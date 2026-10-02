import { type NextRequest, NextResponse } from "next/server"
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit"
import { registrarEventoCheckout, sanitizarEvento } from "@/lib/checkout/funnel"

// Medición del embudo de checkout (ver migrations/20261001_checkout_events.sql):
// el cliente llama acá con sendBeacon/fetch keepalive desde app/checkout/page.tsx
// en 'checkout_view' y cada click en "Confirmar" ('confirm_click'). Fail-soft
// en toda la cadena — este endpoint NUNCA debe tardar ni afectar al checkout:
// responde 204 siempre, incluso con body vacío/inválido o evento desconocido.
const limiter = rateLimit({ limit: 60, windowSeconds: 60, prefix: "checkout-events" })

export async function POST(request: NextRequest) {
  try {
    const rl = limiter.check(request)
    if (!rl.success) return rateLimitResponse(rl.resetAt)

    // sendBeacon puede mandar un Blob vacío o malformado (y, en dev, se vio el
    // ya conocido "SyntaxError: Unexpected end of JSON input" por body vacío) —
    // nunca debe loguearse como error, es tráfico esperado de este endpoint.
    let body: unknown = null
    try {
      body = await request.json()
    } catch {
      return new NextResponse(null, { status: 204 })
    }

    const evento = sanitizarEvento(body)
    if (!evento) return new NextResponse(null, { status: 204 })

    await registrarEventoCheckout(evento)

    return new NextResponse(null, { status: 204 })
  } catch (error: any) {
    // Fail-soft total: cualquier excepción inesperada tampoco debe tirarle un
    // error al cliente — esto es solo instrumentación.
    console.warn("[checkout-funnel] excepción en POST /api/checkout/events (fail-soft):", error?.message)
    return new NextResponse(null, { status: 204 })
  }
}
