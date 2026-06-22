/**
 * GET  /api/partners/finanzas — balance + movimientos + retiros del tenant
 * POST /api/partners/finanzas — solicitar retiro { amount, method? }
 *
 * Ambos son owner-only: exponen y mueven dinero (banco + retiros). El retiro usa
 * el RPC transaccional partner_request_payout (atómico, idempotente y serializado
 * por tenant). Idempotency-Key se toma del header homónimo.
 */
import { NextRequest, NextResponse } from 'next/server'
import { requireTenantPermission } from '@/lib/partners/permissions'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getTenantFinancials, requestPayout, MIN_PAYOUT_ARS, validateIdempotencyKey } from '@/lib/partners/payouts'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireTenantPermission(request, 'withdrawals:read')
    if (!auth.ok) return auth.response
    const tenant = auth.tenant
    const sb = supabaseAdmin as any

    const [financials, { data: entries }, { data: payouts }] = await Promise.all([
      getTenantFinancials(tenant.id),
      sb
        .from('partner_ledger_entries')
        .select('id, type, amount, concept, status, source, created_at')
        .eq('tenant_id', tenant.id)
        .order('created_at', { ascending: false })
        .limit(50),
      sb
        .from('partner_payouts')
        .select('id, amount, status, method, requested_at, resolved_at')
        .eq('tenant_id', tenant.id)
        .order('requested_at', { ascending: false })
        .limit(20),
    ])

    return NextResponse.json({
      // `pendingReview` kept as an alias for backward compatibility with the UI.
      balance: { ...financials, pendingReview: financials.pending },
      minPayout: MIN_PAYOUT_ARS,
      entries: entries ?? [],
      payouts: payouts ?? [],
      bankAlias: (tenant as any).bank_alias || null,
      bankCbu: (tenant as any).bank_cbu || null,
    })
  } catch (e: any) {
    console.error('[finanzas] GET error:', e?.message)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireTenantPermission(request, 'withdrawals:manage')
    if (!auth.ok) return auth.response
    const tenant = auth.tenant

    const body = await request.json().catch(() => ({}))
    const amount = Math.round(Number(body.amount) || 0)
    const method = String(
      body.method || (tenant as any).bank_alias || (tenant as any).bank_cbu || '',
    ).slice(0, 120)
    // Do not fall back to an optional body field. The client must retain this
    // header while retrying a single withdrawal intent.
    const idempotencyKey = request.headers.get('idempotency-key')?.trim() || ''
    const keyValidation = validateIdempotencyKey(idempotencyKey)
    if (!keyValidation.ok) {
      return NextResponse.json({ error: keyValidation.error }, { status: keyValidation.status })
    }

    const result = await requestPayout({ tenantId: tenant.id, amount, method, idempotencyKey })
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status })
    }

    // Aviso interno (Telegram ventas si está configurado) — best effort.
    // No se reenvía en réplicas idempotentes para no duplicar la notificación.
    if (!result.idempotent) {
      try {
        const token = process.env.TELEGRAM_BOT_TOKEN_SALES || process.env.TELEGRAM_BOT_TOKEN
        const chatId = process.env.TELEGRAM_CHAT_ID_SALES || process.env.TELEGRAM_CHAT_ID
        if (token && chatId) {
          await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: chatId,
              text: `💸 RETIRO SOLICITADO\n\nPartner: ${tenant.name} (${tenant.slug})\nMonto: $${amount.toLocaleString('es-AR')}\nDestino: ${method}\n\nTransferir y marcar pagado.`,
            }),
          })
        }
      } catch {
        /* no bloquea */
      }
    }

    return NextResponse.json({ ok: true, payoutId: result.payoutId, idempotent: !!result.idempotent })
  } catch (e: any) {
    console.error('[finanzas] POST error:', e?.message)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
