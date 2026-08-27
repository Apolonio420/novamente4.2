import { type NextRequest, NextResponse } from "next/server"
import { createOrder } from "@/lib/db"
import { toPublicR2Url } from "@/lib/r2"
import { shippingCostFor, envioPorDistancia } from "@/lib/shipping-config"

export async function POST(request: NextRequest) {
  try {
    const { customer, items, subtotal, shippingCost, total } = await request.json()

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

    // Calcular subtotal y shipping si no vienen (fallback zona BA — fuente de verdad compartida)
    const finalSubtotal = subtotal || items.reduce((sum: number, item: any) => sum + (item.price || 0) * (item.quantity || 1), 0)
    const finalShippingCost =
      shippingCost ?? envioPorDistancia(finalSubtotal, (customer as any)?.postalCode, 'BA').costo
    const finalTotal = finalSubtotal + finalShippingCost

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
    })

    if (!newOrder) {
      console.error("❌ Failed to create transfer order in database")
      return NextResponse.json({
        success: false,
        error: "Error creating order"
      }, { status: 500 })
    }

    console.log("✅ Transfer order created in database:", newOrder.id, "Number:", newOrder.order_number)

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

