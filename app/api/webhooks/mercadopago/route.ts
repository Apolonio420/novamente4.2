import { type NextRequest, NextResponse } from "next/server"
import { processPaymentById } from "@/lib/payments/process-payment"

/**
 * Webhook de MercadoPago (pagos del checkout web + tiendas partner).
 * La lógica de confirmación vive en lib/payments/process-payment.ts, compartida
 * con /api/payments/confirm (fallback de la success page) y el cron de recupero.
 */

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
    await processPaymentById(paymentId, body)
    // Siempre 200 para evitar reintentos infinitos de MP (los errores quedan logueados)
    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("❌ Error procesando webhook MercadoPago:", error)
    return NextResponse.json({ received: true })
  }
}

export async function GET() {
  return NextResponse.json({ message: "MercadoPago webhook endpoint is active" })
}
