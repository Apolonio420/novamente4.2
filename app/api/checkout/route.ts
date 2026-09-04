import { type NextRequest, NextResponse } from "next/server"
import { cardSurchargeAmount } from "@/lib/payment-config"
import { MercadoPagoConfig, Preference } from "mercadopago"
import { createOrder, findRecentDuplicateOrder } from "@/lib/db"
import { toPublicR2Url } from "@/lib/r2"
import { shippingCostFor, envioPorDistancia } from "@/lib/shipping-config"
import { sanitizeAttribution } from "@/lib/attribution"

const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN!,
})

export async function POST(request: NextRequest) {
  try {
    // Verificar que el token de MercadoPago esté configurado
    console.log("🔑 MP_ACCESS_TOKEN configured:", !!process.env.MP_ACCESS_TOKEN)

    if (!process.env.MP_ACCESS_TOKEN) {
      console.error("❌ MP_ACCESS_TOKEN not configured - using mock response")
      // Para testing, devolver una respuesta simulada
      return NextResponse.json({
        success: true,
        id: "mock-preference-id",
        init_point: "/checkout/success?mock=true",
        message: "Mock payment created for testing"
      })
    }

    const { items, customer, total, cartItems, subtotal, shippingCost, shippingZone, tenantId, discountCode, attribution } =
      await request.json()

    // Atribución de marketing (UTMs/fbclid/gclid/referrer/landing_page), capturada
    // en el navegador por lib/attribution.ts. Puramente analítica: si viene vacía
    // o inválida, la orden se crea igual sin ella.
    const sanitizedAttribution = sanitizeAttribution(attribution) || {}

    console.log("🛒 Checkout API received:", {
      itemsCount: items?.length || 0,
      customer: customer?.email || 'No customer data',
      totalReceived: total,
      items: items?.map((item: any) => ({
        title: item.title,
        quantity: item.quantity,
        unit_price: item.unit_price,
      })) || [],
    })

    // Validar que tenemos los datos necesarios
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ success: false, error: "No items provided" }, { status: 400 })
    }

    if (!customer || !customer.email) {
      return NextResponse.json({ success: false, error: "Customer information required" }, { status: 400 })
    }

    // 🚫 Datos de envío OBLIGATORIOS antes de poder pagar (03/09/2026, mismo
    // guard que /api/checkout/transfer — caso Marcelo NOV-20260813-7038). El
    // "express checkout" que completaba la dirección post-pago en
    // /checkout/success dependía de que el cliente volviera; si no volvía, el
    // pedido quedaba pago y sin adónde despachar. shipping-info queda solo como
    // backfill de pedidos viejos.
    const addrMp = String(customer.address || "").trim()
    const cityMp = String(customer.city || "").trim()
    if (!addrMp || !cityMp || /pendiente/i.test(addrMp)) {
      return NextResponse.json(
        { success: false, error: "Completá los datos de envío (dirección y ciudad) antes de pagar — los necesitamos para despachar tu pedido." },
        { status: 400 },
      )
    }

    if (!total || total <= 0) {
      return NextResponse.json({ success: false, error: "Invalid total amount" }, { status: 400 })
    }

    // Validar que el total calculado coincida con la suma de items
    const calculatedTotal = items.reduce((sum: number, item: any) => sum + item.unit_price * item.quantity, 0)

    const itemsParaValidar = (cartItems && cartItems.length ? cartItems : items) as any[]

    // Stock: rechazar ACÁ (antes de crear la orden / cobrar) un talle agotado.
    // Convención: SIN fila en garment_stock / stock=NULL en partner_products =
    // stock libre — sólo se bloquea si hay un tope cargado y no alcanza.
    const { validarStock, mensajeStockAgotado } = await import('@/lib/checkout/stock-guard')
    const stockCheck = await validarStock(itemsParaValidar)
    if (!stockCheck.ok) {
      console.error('❌ Stock insuficiente:', stockCheck.agotados)
      return NextResponse.json(
        { success: false, error: mensajeStockAgotado(stockCheck.agotados), agotados: stockCheck.agotados },
        { status: 400 },
      )
    }

    // La comparación original acá miraba `total` contra la suma de `unit_price` —
    // los dos vienen del NAVEGADOR. O sea: validaba la aritmética del cliente
    // contra sus propios números. Con postear `unit_price: 1` alcanzaba para
    // pagar $1 un buzo de $55.000, porque ese mismo valor viajaba después a la
    // preferencia de MercadoPago.
    //
    // Acá se resuelve el precio REAL contra el catálogo y la fila del producto.
    // Sólo se rechaza si el cliente manda MENOS que el precio real; si manda de
    // más, se deja pasar (no vamos a bloquear a alguien que paga de más) y los
    // ítems de un flujo que no conocemos tampoco frenan la compra.
    const { validarPrecios } = await import('@/lib/checkout/precio-real')
    const chequeo = await validarPrecios(itemsParaValidar)
    if (!chequeo.ok) {
      console.error('❌ Precio por debajo del real:', chequeo.subfacturados)
      const { notifyError } = await import('@/lib/notifications')
      await notifyError({
        area: 'Checkout',
        endpoint: 'POST /api/checkout',
        message:
          `Intento de compra por debajo del precio real (${customer?.email || 'sin email'}): ` +
          chequeo.subfacturados
            .map((s) => `${s.item} cobrado ${s.cobrado} vs real ${s.real}`)
            .join(' · '),
      }).catch(() => null)
      return NextResponse.json(
        { success: false, error: 'Los precios del carrito no coinciden. Recargá la página y probá de nuevo.' },
        { status: 400 },
      )
    }
    if (chequeo.sinVerificar > 0) {
      console.warn(`[checkout] ${chequeo.sinVerificar} item(s) sin precio verificable`)
    }

    // Calcular subtotal y shipping si no vienen. El fallback sale de
    // lib/shipping-config (antes tenía los montos hardcodeados acá y quedaba
    // desincronizado del carrito cuando cambiaba la tarifa).
    const finalSubtotal = subtotal || calculatedTotal
    // Mismo cálculo por distancia que muestra el checkout, para que el server
    // nunca cobre un envío distinto del que vio el cliente.
    const fallbackShipping = envioPorDistancia(
      calculatedTotal,
      customer?.postalCode,
      shippingZone === 'RESTO' ? 'RESTO' : 'BA',
    ).costo
    const finalShippingCost = typeof shippingCost === 'number' ? shippingCost : fallbackShipping

    // Código de descuento: se vuelve a resolver EN EL SERVIDOR contra
    // partner_discount_codes — nunca se confía en el discountId/discountARS
    // que mande el navegador. Un código inválido/vencido/agotado/de otro
    // tenant da discountARS: 0, así que NUNCA baja el total por default.
    const { validarDescuento } = await import('@/lib/checkout/discount-guard')
    const descuento = await validarDescuento(discountCode, finalSubtotal)
    if (discountCode && !descuento.valid) {
      console.warn('[checkout] código de descuento no aplicado:', discountCode, descuento.reason)
    }

    const finalTotal = Math.max(0, finalSubtotal - descuento.discountARS) + finalShippingCost

    console.log("💰 Price validation:", {
      receivedTotal: total,
      finalTotal,
      discountARS: descuento.discountARS,
      matches: Math.abs(total - finalTotal) < 1, // Permitir diferencia mínima por redondeo
    })

    // Gate de consistencia: el total que mandó el navegador tiene que coincidir
    // con el total que calculó el servidor (subtotal real + envío - descuento
    // válido). Ya no compara la aritmética del cliente contra sí misma: usa el
    // descuento resuelto server-side, así un código legítimo no rompe esta
    // comparación (antes CUALQUIER descuento hacía fallar el checkout acá).
    if (Math.abs(total - finalTotal) > 1) {
      console.error("❌ Price mismatch:", { receivedTotal: total, finalTotal })
      return NextResponse.json({ success: false, error: "Price validation failed" }, { status: 400 })
    }

    // ── Recargo por tarjeta (regla 31/08/2026, igual que el bot) ────────────
    // El gate de arriba valida el total BASE que vio el cliente. El recargo se
    // aplica ACÁ, server-side, para que un cliente modificado no pueda esquivarlo:
    // la orden y la preferencia de MP se crean con el total recargado.
    const cardSurcharge = cardSurchargeAmount(finalTotal)
    const chargeTotal = finalTotal + cardSurcharge

    // Preparar items del pedido desde cartItems si están disponibles, sino desde items simplificados
    let orderItems: any[] = []
    if (cartItems && Array.isArray(cartItems) && cartItems.length > 0) {
      // Usar cartItems completos (tienen toda la información)
      orderItems = cartItems.map((item: any) => ({
        item_name: item.name || item.title || `${item.garmentType || 'Producto'} - ${item.color} - Talle ${item.size}`,
        partner_product_id: item.productId || item.partner_product_id || null,
        product_type: item.garmentType || item.product_type || 'unknown',
        product_color: item.color || item.product_color || 'unknown',
        product_size: item.size || item.product_size || 'unknown',
        quantity: item.quantity || 1,
        unit_price: item.price || item.unit_price || 0,
        total_price: (item.price || item.unit_price || 0) * (item.quantity || 1),
        image_url: toPublicR2Url(item.image || item.image_url || null),
        mockup_url: toPublicR2Url(item.mockupUrl || item.mockup_url || null),
        front_mockup_url: toPublicR2Url(item.frontMockup || item.front_mockup_url || null),
        back_mockup_url: toPublicR2Url(item.backMockup || item.back_mockup_url || null),
        front_design_url: toPublicR2Url(item.frontDesign || item.front_design_url || null),
        back_design_url: toPublicR2Url(item.backDesign || item.back_design_url || null),
        doble_estampa: item.doble_estampa || (item.backDesign && item.frontDesign ? 'Si' : 'No'),
        front_stamp_size: item.frontStampSize || null,
        back_stamp_size: item.backStampSize || null,
        front_stamp_position: item.frontStampPosition || null,
        back_stamp_position: item.backStampPosition || null,
        design_position: item.designPosition || null,
        custom_design: item.customDesign || null,
        metadata: {
          itemId: item.id,
          originalImageId: item.originalImageId || null,
          ...(item.metadata || {})
        }
      }))
    } else {
      // Fallback: crear items desde items simplificados
      orderItems = items.map((item: any) => ({
        item_name: item.title || 'Producto',
        product_type: 'unknown',
        product_color: 'unknown',
        product_size: 'unknown',
        quantity: item.quantity || 1,
        unit_price: item.unit_price || 0,
        total_price: (item.unit_price || 0) * (item.quantity || 1),
        image_url: item.image_url || "https://placehold.co/600x400", // Fallback to satisfy NOT NULL constraint
        metadata: {
          itemId: item.id,
          description: item.description || null
        }
      }))
    }

    // Validar que tenantId sea un UUID antes de persistirlo
    const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    const validTenantId = typeof tenantId === 'string' && UUID_RE.test(tenantId) ? tenantId : null

    // ── Idempotencia anti doble-submit ──────────────────────────────────────
    // Si el cliente re-envía el MISMO carrito (doble-click o volver-atrás desde
    // MP) reusamos el pedido pending reciente en vez de crear otro duplicado.
    // El chequeo es defensivo: ante cualquier error cae a createOrder normal,
    // así el checkout/MP nunca se rompe.
    let newOrder = await findRecentDuplicateOrder({
      customer_email: customer.email,
      total: chargeTotal,
    })

    // Reusar el external_reference del pedido existente para que el webhook de
    // MP siga matcheando contra esa única orden. Si no hay pedido previo (o no
    // tiene external_reference) generamos uno nuevo.
    const externalReference = newOrder?.external_reference || `order_${Date.now()}`

    if (newOrder) {
      console.log("♻️ Reusando pedido pending reciente (idempotencia):", newOrder.id, newOrder.order_number)
    } else {
      // Express checkout: address/city pueden venir vacíos · se completan post-pago en /checkout/success
      newOrder = await createOrder({
        customer_email: customer.email,
        customer_first_name: customer.firstName,
        customer_last_name: customer.lastName,
        customer_phone: customer.phone || null,
        shipping_address: customer.address || null,
        shipping_city: customer.city || null,
        shipping_postal_code: customer.postalCode || null,
        shipping_zone: shippingZone || null,
        payment_method: 'mercadopago',
        payment_status: 'pending',
        external_reference: externalReference,
        subtotal: finalSubtotal,
        shipping_cost: finalShippingCost,
        total: chargeTotal,
        currency: 'ARS',
        status: 'pending',
        tenant_id: validTenantId,
        items: orderItems,
        ...sanitizedAttribution,
        metadata: {
          card_surcharge_ars: cardSurcharge,
          base_total_ars: finalTotal,
          ...(descuento.valid
            ? {
                discount_code_id: descuento.discountId,
                discount_code: descuento.discountCode,
                discount_ars: descuento.discountARS,
              }
            : {}),
        },
      })
    }

    if (!newOrder) {
      console.error("❌ Failed to create order in database")
      return NextResponse.json({
        success: false,
        error: "Error creating order"
      }, { status: 500 })
    }

    console.log("✅ Order ready:", newOrder.id, "Number:", newOrder.order_number)

    // Crear preferencia de MercadoPago con precios exactos
    const preference = new Preference(client)

    // El descuento se reparte entre los items de PRODUCTO (nunca el envío):
    // MercadoPago no acepta un item con unit_price <= 0, así que en vez de una
    // línea de "descuento" en negativo se reduce proporcionalmente cada item —
    // así lo que MP efectivamente cobra coincide con finalTotal.
    const { aplicarDescuentoAItemsMP } = await import('@/lib/checkout/discount-guard')
    const mpItemsProducto = items.filter((item: any) => item.id !== 'shipping')
    const mpItemShipping = items.filter((item: any) => item.id === 'shipping')
    const mpItemsFinal = [...aplicarDescuentoAItemsMP(mpItemsProducto, descuento.discountARS), ...mpItemShipping]

    // Línea propia de recargo: MP no acepta multiplicar el total, así que va
    // como item explícito — de paso el cliente ve el porqué en la pantalla de pago.
    if (cardSurcharge > 0) {
      mpItemsFinal.push({
        id: 'card-surcharge',
        title: 'Recargo pago con tarjeta (10%)',
        quantity: 1,
        unit_price: cardSurcharge,
        description: 'Pagando por transferencia bancaria este recargo no aplica',
      })
    }

    const preferenceData = {
      items: mpItemsFinal.map((item: any) => ({
        id: item.id,
        title: item.title,
        quantity: item.quantity,
        unit_price: item.unit_price,
        currency_id: "ARS",
        description: item.description,
      })),
      payer: {
        email: customer.email,
        name: customer.firstName,
        surname: customer.lastName,
        ...(customer.phone ? { phone: { number: customer.phone } } : {}),
        ...(customer.address || customer.city || customer.postalCode
          ? {
              address: {
                street_name: customer.address || undefined,
                city_name: customer.city || undefined,
                zip_code: customer.postalCode || undefined,
              },
            }
          : {}),
      },
      back_urls: {
        success: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/checkout/success`,
        failure: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/checkout/cancel`,
        pending: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/checkout/pending`,
      },
      // MP exige HTTPS en back_urls.success para auto_return. Solo activar en prod (HTTPS),
      // en dev local mantener desactivado para no romper el flujo.
      ...(process.env.NEXT_PUBLIC_BASE_URL?.startsWith('https://') ? { auto_return: 'approved' as const } : {}),
      notification_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/webhooks/mercadopago`,
      statement_descriptor: "NOVAMENTE",
      external_reference: externalReference, // Usar el mismo external_reference del pedido creado
    }

    console.log("🚀 Creating MercadoPago preference:", {
      itemsCount: preferenceData.items.length,
      totalAmount: calculatedTotal,
      customerEmail: preferenceData.payer.email,
      backUrls: preferenceData.back_urls,
      baseUrl: process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000',
    })

    console.log("📋 Full preference data:", JSON.stringify(preferenceData, null, 2))

    const result = await preference.create({ body: preferenceData })

    console.log("✅ MercadoPago preference created:", {
      id: result.id,
      init_point: result.init_point,
      externalReference: externalReference,
    })

    // Actualizar el pedido con el preference_id de MercadoPago
    const { updateOrder } = await import("@/lib/db")
    await updateOrder(newOrder.id!, {
      mercado_pago_preference_id: result.id,
    })

    return NextResponse.json({
      success: true,
      id: result.id,
      init_point: result.init_point,
      order_id: newOrder.id,
      order_number: newOrder.order_number,
      external_reference: externalReference,
    })
  } catch (error: any) {
    console.error("❌ Checkout API error:", error)
    console.error("❌ Error details:", {
      message: error?.message || 'Unknown error',
      status: error?.status,
      error: error?.error,
      cause: error?.cause,
      stack: error?.stack,
    })

    // Si es un error de MercadoPago, devolver más detalles
    if (error?.status === 400) {
      return NextResponse.json({
        success: false,
        error: "MercadoPago validation error",
        details: error.message,
        mercadopagoError: error.error
      }, { status: 400 })
    }

    return NextResponse.json({
      success: false,
      error: "Error creating payment preference",
      details: error?.message || 'Unknown error'
    }, { status: 500 })
  }
}
