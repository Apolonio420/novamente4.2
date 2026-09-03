import { type NextRequest, NextResponse } from "next/server"
import { createOrder } from "@/lib/db"
import { toPublicR2Url } from "@/lib/r2"
import { shippingCostFor, envioPorDistancia } from "@/lib/shipping-config"

export async function POST(request: NextRequest) {
  try {
    const { customer, items, subtotal, shippingCost, total, discountCode } = await request.json()

    console.log("🔄 Transfer checkout API received:", {
      itemsCount: items?.length || 0,
      customer: customer?.email || 'No customer data',
      total,
    })

    // Validar que tenemos los datos necesarios
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ success: false, error: "No items provided" }, { status: 400 })
    }

    if (!customer || !customer.email) {
      return NextResponse.json({ success: false, error: "Customer information required" }, { status: 400 })
    }

    if (!total || total <= 0) {
      return NextResponse.json({ success: false, error: "Invalid total amount" }, { status: 400 })
    }

    // Stock: rechazar ACÁ un talle agotado (misma convención que /api/checkout:
    // sin fila/stock null = libre, sólo bloquea si hay tope cargado y no alcanza).
    const { validarStock, mensajeStockAgotado } = await import('@/lib/checkout/stock-guard')
    const stockCheck = await validarStock(items as any[])
    if (!stockCheck.ok) {
      console.error('❌ Stock insuficiente (transferencia):', stockCheck.agotados)
      return NextResponse.json(
        { success: false, error: mensajeStockAgotado(stockCheck.agotados), agotados: stockCheck.agotados },
        { status: 400 },
      )
    }

    // Precio real: mismo guard server-side que /api/checkout — nunca confiar en
    // el unit_price/price que manda el navegador para transferencia tampoco.
    const { validarPrecios } = await import('@/lib/checkout/precio-real')
    const chequeoPrecio = await validarPrecios(items as any[])
    if (!chequeoPrecio.ok) {
      console.error('❌ Precio por debajo del real (transferencia):', chequeoPrecio.subfacturados)
      return NextResponse.json(
        { success: false, error: 'Los precios del carrito no coinciden. Recargá la página y probá de nuevo.' },
        { status: 400 },
      )
    }

    // Calcular subtotal y shipping si no vienen (fallback zona BA — fuente de verdad compartida)
    const finalSubtotal = subtotal || items.reduce((sum: number, item: any) => sum + (item.price || 0) * (item.quantity || 1), 0)
    const finalShippingCost =
      shippingCost ?? envioPorDistancia(finalSubtotal, (customer as any)?.postalCode, 'BA').costo

    // Código de descuento: se vuelve a resolver EN EL SERVIDOR — nunca se confía
    // en el discountId/discountARS que mande el navegador. Un código inválido
    // da discountARS: 0, así que NUNCA baja el total por default. En
    // transferencia el descuento SÍ se resta del monto a transferir (no hay
    // pasarela de pago que lo tenga que reflejar, es lo que el cliente
    // efectivamente transfiere).
    const { validarDescuento } = await import('@/lib/checkout/discount-guard')
    const descuento = await validarDescuento(discountCode, finalSubtotal)
    if (discountCode && !descuento.valid) {
      console.warn('[checkout/transfer] código de descuento no aplicado:', discountCode, descuento.reason)
    }

    const finalTotal = Math.max(0, finalSubtotal - descuento.discountARS) + finalShippingCost

    // Preparar items del pedido desde items del carrito
    const orderItems = items.map((item: any) => ({
      item_name: item.name || `${item.garmentType || 'Producto'} - ${item.color} - Talle ${item.size}`,
      product_type: item.garmentType || 'unknown',
      product_color: item.color || 'unknown',
      product_size: item.size || 'unknown',
      quantity: item.quantity || 1,
      unit_price: item.price || 0,
      total_price: (item.price || 0) * (item.quantity || 1),
      image_url: toPublicR2Url(item.image || null),
      mockup_url: toPublicR2Url(item.mockupUrl || null),
      front_mockup_url: toPublicR2Url(item.frontMockup || null),
      back_mockup_url: toPublicR2Url(item.backMockup || null),
      front_design_url: toPublicR2Url(item.frontDesign || null),
      back_design_url: toPublicR2Url(item.backDesign || null),
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

    // Crear el pedido en la base de datos
    const externalReference = `order_transfer_${Date.now()}`

    // Si todos los items vienen de una tienda partner, vincular el pedido al tenant
    const tenantId = items.find((i: any) => i.tenantId)?.tenantId ?? null

    const newOrder = await createOrder({
      tenant_id: tenantId,
      customer_email: customer.email,
      customer_first_name: customer.firstName,
      customer_last_name: customer.lastName,
      customer_phone: customer.phone || null,
      shipping_address: customer.address,
      shipping_city: customer.city,
      shipping_postal_code: customer.postalCode || null,
      payment_method: 'transferencia',
      payment_status: 'pending',
      external_reference: externalReference,
      subtotal: finalSubtotal,
      shipping_cost: finalShippingCost,
      total: finalTotal,
      currency: 'ARS',
      status: 'pending',
      notes: 'Esperando comprobante de transferencia bancaria',
      items: orderItems,
      metadata: descuento.valid
        ? {
            discount_code_id: descuento.discountId,
            discount_code: descuento.discountCode,
            discount_ars: descuento.discountARS,
          }
        : undefined,
    })

    if (!newOrder) {
      console.error("❌ Failed to create transfer order in database")
      return NextResponse.json({
        success: false,
        error: "Error creating order"
      }, { status: 500 })
    }

    console.log("✅ Transfer order created in database:", newOrder.id, "Number:", newOrder.order_number)

    // 🔔 Aviso a Novamente al CREARSE el pedido por transferencia (Telegram + email).
    // Una transferencia directa a la cuenta MP no dispara ningún webhook, así que
    // este es el ÚNICO momento en que el sistema puede avisar. Caso Marcelo
    // NOV-20260813-7038 (13/08→02/09/2026): pedido de $41.000 creado sin aviso,
    // el cliente transfirió 20 días después y Juan se enteró por el ingreso en MP.
    // Fire-and-forget: un fallo acá nunca rompe el checkout del cliente.
    try {
      const [{ notifySale }, { sendEmail }] = await Promise.all([
        import("@/lib/notifications"),
        import("@/lib/email"),
      ])
      void notifySale({
        orderNumber: `🟡 TRANSFERENCIA PENDIENTE — ${newOrder.order_number || newOrder.id}`,
        total: finalTotal,
        email: customer.email,
        items: orderItems.map((it: any) => ({
          name: it.item_name,
          quantity: it.quantity,
          size: it.product_size,
          color: it.product_color,
          price: it.unit_price,
          imageUrl: it.image_url || it.mockup_url || undefined,
        })),
      }).catch((e: any) => console.error("❌ notifySale (transfer) falló:", e?.message))
      const salesEmail = process.env.SALES_NOTIFY_EMAIL || "juan@novamente.ar"
      const itemsHtml = orderItems
        .map((it: any) => `<li><b>${it.item_name}</b> x${it.quantity} — Talle ${it.product_size || "-"} · ${it.product_color || "-"}</li>`)
        .join("")
      void sendEmail({
        to: salesEmail,
        subject: `🟡 PEDIDO POR TRANSFERENCIA ${newOrder.order_number || ""} — $${finalTotal.toLocaleString("es-AR")} (${customer.firstName || ""} ${customer.lastName || ""})`,
        html: `<h2>Pedido por transferencia creado — esperando el pago 🟡</h2>
<p>Cuando entre una transferencia de <b>$${finalTotal.toLocaleString("es-AR")}</b> en Mercado Pago, es este pedido.</p>
<p><b>Pedido:</b> ${newOrder.order_number || newOrder.id}<br/>
<b>Cliente:</b> ${customer.firstName || ""} ${customer.lastName || ""} · ${customer.email} · ${customer.phone || "-"}<br/>
<b>Envío:</b> ${customer.address || "-"}, ${customer.city || "-"} (CP ${customer.postalCode || "-"})</p>
<ul>${itemsHtml}</ul>
<p>Si en unos días no llega el pago, el pedido queda pending y lo persigue el rescate. Ficha: admin.novamente.ar/dashboard/orders/fichas</p>`,
      }).then((sent) => {
        if (!sent.ok) console.error("❌ Email de pedido por transferencia falló:", sent.error)
      }).catch((e: any) => console.error("❌ Exception email transferencia:", e?.message))
    } catch (notifErr: any) {
      console.error("❌ Aviso de pedido por transferencia falló (no bloquea):", notifErr?.message)
    }

    return NextResponse.json({
      success: true,
      order_id: newOrder.id,
      order_number: newOrder.order_number,
      external_reference: externalReference,
      message: "Order created successfully. Waiting for transfer receipt.",
    })
  } catch (error: any) {
    console.error("❌ Transfer checkout API error:", error)
    return NextResponse.json({
      success: false,
      error: "Error creating transfer order",
      details: error?.message || 'Unknown error'
    }, { status: 500 })
  }
}

