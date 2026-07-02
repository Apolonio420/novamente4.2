import { type NextRequest, NextResponse } from "next/server"
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit"
import { processPaymentById } from "@/lib/payments/process-payment"

export const runtime = "nodejs"

/**
 * Fallback de confirmación server-side, llamado por la success page tras el
 * redirect de MercadoPago. NO depende de que el webhook llegue: consulta el
 * pago directamente a MP (fuente de verdad) y confirma la orden con la misma
 * lógica compartida del webhook. Idempotente — si el webhook ya la procesó,
 * responde already_confirmed sin efectos duplicados.
 *
 * Seguridad: el payment_id no otorga nada al caller — el estado del pago se
 * lee de la API de MP con nuestro access token, no del request.
 */
const limiter = rateLimit({ limit: 15, windowSeconds: 600, prefix: "payments-confirm" })

export async function POST(req: NextRequest) {
  const { success, resetAt } = limiter.check(req)
  if (!success) return rateLimitResponse(resetAt)

  try {
    const body = await req.json().catch(() => ({}))
    const paymentId = String(body?.payment_id ?? "").trim()

    if (!paymentId || !/^\d{5,20}$/.test(paymentId)) {
      return NextResponse.json({ ok: false, error: "payment_id inválido" }, { status: 400 })
    }

    const result = await processPaymentById(paymentId)
    return NextResponse.json({
      ok: result.ok,
      reason: result.reason,
      order_status: result.orderStatus,
      payment_status: result.paymentStatus,
      order_number: result.orderNumber,
    })
  } catch (e: any) {
    console.error("[payments/confirm] error:", e?.message)
    return NextResponse.json({ ok: false, error: "Error confirmando el pago" }, { status: 500 })
  }
}
