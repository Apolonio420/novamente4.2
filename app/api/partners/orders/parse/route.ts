/**
 * POST /api/partners/orders/parse
 *
 * Cara al PARTNER (no admin). Recibe { text } en texto libre (lo que el partner
 * pega de un chat) y devuelve items estructurados que el partner revisa/edita
 * antes de cargar el pedido. NO crea el pedido ni toca precios — solo parsea.
 *
 * Auth: getRequestTenant (sesión del partner). NO requireAdmin.
 */
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getRequestTenant } from '@/lib/partners/auth'
import { parseOrderText } from '@/lib/orders/parse-with-ai'
import { rateLimit, rateLimitResponse } from '@/lib/rate-limit'

export const maxDuration = 25
export const dynamic = 'force-dynamic'

const limiter = rateLimit({ limit: 10, windowSeconds: 60, prefix: 'partner-orders-parse' })

const bodySchema = z.object({
  text: z.string().min(3).max(5000),
})

export async function POST(request: NextRequest) {
  const rl = limiter.check(request)
  if (!rl.success) return rateLimitResponse(rl.resetAt)

  const result = await getRequestTenant(request)
  if (!result) {
    return NextResponse.json({ ok: false, error: 'No autenticado' }, { status: 401 })
  }

  let raw: unknown
  try {
    raw = await request.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'Payload JSON inválido' }, { status: 400 })
  }

  const parsed = bodySchema.safeParse(raw)
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues[0]?.message ?? 'Body inválido' },
      { status: 400 },
    )
  }

  try {
    const out = await parseOrderText(parsed.data.text)
    return NextResponse.json({ ok: true, ...out })
  } catch (err) {
    console.error('[partners/orders/parse]', err instanceof Error ? err.message : String(err))
    return NextResponse.json({ ok: false, error: 'Error al parsear el pedido' }, { status: 502 })
  }
}
