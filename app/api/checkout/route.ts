import { type NextRequest, NextResponse } from "next/server"
import { MercadoPagoConfig, Preference } from "mercadopago"
import { createOrder } from "@/lib/db"
import { toPublicR2Url } from "@/lib/r2"

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

    const { items, customer, total, cartItems, subtotal, shippingCost } = await request.json()

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

    if (!total || total <= 0) {
      return NextResponse.json({ success: false, error: "Invalid total amount" }, { status: 400 })
    }

    // Validar que el total calculado coincida con la suma de items
    const calculatedTotal = items.reduce((sum: number, item: any) => sum + item.unit_price * item.quantity, 0)

    console.log("💰 Price validation:", {
      receivedTotal: total,
      calculatedTotal,
      matches: Math.abs(total - calculatedTotal) < 1, // Permitir diferencia mínima por redondeo
    })

    if (Math.abs(total - calculatedTotal) > 1) {
      console.error("❌ Price mismatch:", { receivedTotal: total, calculatedTotal })
      return NextResponse.json({ success: false, error: "Price validation failed" }, { status: 400 })
    }

    // Calcular subtotal y shipping si no vienen
    const finalSubtotal = subtotal || calculatedTotal
    const finalShippingCost = shippingCost || (calculatedTotal >= 85000 ? 0 : 6500)
    const finalTotal = finalSubtotal + finalShippingCost

    // Preparar items del pedido desde cartItems si están disponibles, sino desde items simplificados
    let orderItems: any[] = []
    if (cartItems && Array.isArray(cartItems) && cartItems.length > 0) {
      // Usar cartItems completos (tienen toda la información)
      orderItems = cartItems.map((item: any) => ({
        item_name: item.name || item.title || `${item.garmentType || 'Producto'} - ${item.color} - Talle ${item.size}`,
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

    // Crear el pedido en la base de datos ANTES de crear la preferencia
    const externalReference = `order_${Date.now()}`

    const newOrder = await createOrder({
      customer_email: customer.email,
      customer_first_name: customer.firstName,
      customer_last_name: customer.lastName,
      customer_phone: customer.phone || null,
      shipping_address: customer.address,
      shipping_city: customer.city,
      shipping_postal_code: customer.postalCode || null,
      payment_method: 'mercadopago',
      payment_status: 'pending',
      external_reference: externalReference,
      subtotal: finalSubtotal,
      shipping_cost: finalShippingCost,
      total: finalTotal,
      currency: 'ARS',
      status: 'pending',
      items: orderItems,
    })

    if (!newOrder) {
      console.error("❌ Failed to create order in database")
      return NextResponse.json({
        success: false,
        error: "Error creating order"
      }, { status: 500 })
    }

    console.log("✅ Order created in database:", newOrder.id, "Number:", newOrder.order_number)

    // Crear preferencia de MercadoPago con precios exactos
    const preference = new Preference(client)

    const preferenceData = {
      items: items.map((item: any) => ({
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
        phone: {
          number: customer.phone,
        },
        address: {
          street_name: customer.address,
          city_name: customer.city,
          zip_code: customer.postalCode,
        },
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
