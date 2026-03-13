import { type NextRequest, NextResponse } from "next/server"
import { getOrderByExternalReference, updateOrder } from "@/lib/db"
import { MercadoPagoConfig, Payment } from "mercadopago"

const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN!,
})

/**
 * Extrae paymentId de múltiples fuentes posibles:
 * 1. body.data.id  — formato estándar webhook/IPN nuevo
 * 2. query param "data.id" — algunas notificaciones MP usan esto
 * 3. query param "id" + topic=payment — formato IPN legacy
 */
function resolvePaymentId(body: any, request: NextRequest): string | null {
  const bodyId = body?.data?.id
  if (bodyId) return String(bodyId)

  const url = new URL(request.url)

  const dataId = url.searchParams.get("data.id")
  if (dataId) return dataId

  const topicId = url.searchParams.get("id")
  const topic = url.searchParams.get("topic")
  if (topicId && topic === "payment") return topicId

  return null
}

export async function POST(request: NextRequest) {
  // Parsear body de forma defensiva (algunos pings de MP llegan sin body)
  let body: any = {}
  try {
    body = await request.json()
  } catch {
    // body vacío — continuar con {}
  }

  console.log("🔔 MercadoPago webhook received:", {
    type: body.type,
    action: body.action,
    data: body.data,
  })

  const paymentId = resolvePaymentId(body, request)

  // Determinar si es un evento de pago (body.type o query param topic)
  const url = new URL(request.url)
  const topic = url.searchParams.get("topic")
  const isPaymentEvent = body.type === "payment" || topic === "payment"

  if (!paymentId) {
    console.warn("⚠️ Webhook sin paymentId — ignorando:", {
      type: body.type,
      action: body.action,
    })
    return NextResponse.json({ received: true })
  }

  if (!isPaymentEvent) {
    console.log("ℹ️ Evento no-payment, ignorando:", body.type || topic)
    return NextResponse.json({ received: true })
  }

  try {
    console.log("💳 Procesando notificación de pago ID:", paymentId)

    // PASO 1: Obtener detalles completos del pago desde MP
    // external_reference vive AQUÍ, no en el body del webhook
    const payment = new Payment(client)
    let paymentDetails: any

    try {
      paymentDetails = await payment.get({ id: paymentId })
    } catch (paymentError: any) {
      console.error("❌ Error al obtener detalles del pago desde MP:", paymentError.message)
      // Retornar 200 para que MP no reintente indefinidamente
      return NextResponse.json({ received: true })
    }

    console.log("📋 Payment details:", {
      id: paymentDetails.id,
      status: paymentDetails.status,
      status_detail: paymentDetails.status_detail,
      transaction_amount: paymentDetails.transaction_amount,
      external_reference: paymentDetails.external_reference,
    })

    const externalReference = paymentDetails.external_reference

    if (!externalReference) {
      console.warn("⚠️ Sin external_reference en payment details para paymentId:", paymentId)
      return NextResponse.json({ received: true })
    }

    // PASO 2: Buscar la orden por external_reference (ahora con el dato correcto)
    const order = await getOrderByExternalReference(externalReference)

    if (!order) {
      console.error("❌ Orden no encontrada para external_reference:", externalReference)
      // 200 para que MP no reintente (la orden no existe en nuestro sistema)
      return NextResponse.json({ received: true })
    }

    console.log("✅ Orden encontrada:", order.id, "Número:", order.order_number, "Estado actual:", order.status)

    // PASO 3: Idempotencia — no reescribir si ya está confirmada con el mismo pago
    if (order.status === "confirmed" && order.payment_id === String(paymentId)) {
      console.log("ℹ️ Orden ya confirmada con mismo payment_id, saltando:", order.id)
      return NextResponse.json({ received: true })
    }

    // PASO 4: Mapear estados de MP a estados internos
    let paymentStatus = "pending"
    let orderStatus = "pending"

    switch (paymentDetails.status) {
      case "approved":
        paymentStatus = "approved"
        orderStatus = "confirmed"
        break
      case "rejected":
        paymentStatus = "rejected"
        orderStatus = "cancelled"
        break
      case "cancelled":
        paymentStatus = "cancelled"
        orderStatus = "cancelled"
        break
      case "refunded":
        paymentStatus = "refunded"
        orderStatus = "cancelled"
        break
      case "pending":
      case "in_process":
      case "in_meditation":
      default:
        paymentStatus = "pending"
        orderStatus = "pending"
        break
    }

    // PASO 5: Mergear metadata (preservar eventos previos, no pisar)
    const existingMetadata = (order as any).metadata || {}
    const newMetadata = {
      ...existingMetadata,
      webhook_data: body,
      payment_details: {
        status: paymentDetails.status,
        status_detail: paymentDetails.status_detail,
        transaction_amount: paymentDetails.transaction_amount,
        currency_id: paymentDetails.currency_id,
        date_approved: paymentDetails.date_approved,
        date_created: paymentDetails.date_created,
        payment_method_id: paymentDetails.payment_method_id,
        payment_type_id: paymentDetails.payment_type_id,
      },
    }

    // PASO 6: Actualizar orden en Supabase
    const updated = await updateOrder(order.id!, {
      payment_id: String(paymentId),
      payment_status: paymentStatus,
      status: orderStatus,
      metadata: newMetadata,
    })

    if (updated) {
      console.log("✅ Orden actualizada:", order.id, "→ status:", orderStatus)

      if (paymentStatus === "approved" && orderStatus === "confirmed") {
        console.log("🎉 Pago aprobado! Orden confirmada:", order.order_number)

        try {
          const { notifySale } = await import("@/lib/notifications")
          await notifySale({
            orderNumber: order.order_number || order.id || "N/A",
            total: order.total || 0,
            email: order.customer_email || "N/A",
            items: (order.items || []).map((item: any) => ({
              name: item.item_name || "Producto",
              quantity: item.quantity || 1,
              size: item.product_size || "N/A",
              color: item.product_color || "N/A",
              price: item.unit_price || 0,
              imageUrl: item.image_url || item.mockup_url || null,
            })),
          })
        } catch (notifErr: any) {
          console.error("❌ Error enviando notificación de venta:", notifErr.message)
        }
      }
    } else {
      console.error("❌ Falló la actualización de la orden:", order.id)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("❌ Error procesando webhook MercadoPago:", error)
    // Siempre 200 para evitar reintentos infinitos de MP
    return NextResponse.json({ received: true })
  }
}

export async function GET() {
  return NextResponse.json({ message: "MercadoPago webhook endpoint is active" })
}
