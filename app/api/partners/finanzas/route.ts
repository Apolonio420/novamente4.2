/**
 * GET  /api/partners/finanzas — saldo + ventas web (con su costo B2B y
 *      ganancia) + pagos recibidos + movimientos del tenant
 * POST /api/partners/finanzas — DESACTIVADO (410): desde el 27/09/2026 Novamente
 *      le paga al partner de oficio una vez por semana, sin mínimo (decisión de
 *      Juan). El pago lo registra un admin en platform con el nro. de operación.
 *
 * Owner-only (expone datos bancarios y plata). Lo que viaja al partner es
 * partner-safe: las ventas pasan por la whitelist de lib/partners/partner-sales.ts
 * y los movimientos NO incluyen la metadata del ledger.
 */
import { NextRequest, NextResponse } from 'next/server'
import { requireTenantPermission } from '@/lib/partners/permissions'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { computeFinancials } from '@/lib/partners/payouts'
import { buildPartnerSales } from '@/lib/partners/partner-sales'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireTenantPermission(request, 'withdrawals:read')
    if (!auth.ok) return auth.response
    const tenant = auth.tenant
    const sb = supabaseAdmin as any

    // Todas las entries del tenant (el estado de cada venta es FIFO contra los
    // pagos, necesita la historia completa). Un partner tiene decenas, no miles.
    const [{ data: allEntries, error: entriesErr }, { data: payouts, error: payoutsErr }] = await Promise.all([
      sb
        .from('partner_ledger_entries')
        .select('id, type, amount, concept, status, source, order_id, metadata, created_at')
        .eq('tenant_id', tenant.id)
        .order('created_at', { ascending: true })
        .limit(1000),
      sb
        .from('partner_payouts')
        .select('id, amount, status, method, requested_at, resolved_at, metadata')
        .eq('tenant_id', tenant.id)
        .order('requested_at', { ascending: false })
        .limit(50),
    ])
    if (entriesErr || payoutsErr) throw new Error(entriesErr?.message || payoutsErr?.message)

    const entries = allEntries ?? []
    const financials = computeFinancials(entries, payouts ?? [])
    const sales = buildPartnerSales(entries)

    return NextResponse.json({
      // `pendingReview` kept as an alias for backward compatibility with the UI.
      balance: { ...financials, pendingReview: financials.pending },
      payoutMode: 'weekly',
      sales,
      // Movimientos: sin metadata (tiene datos internos del cálculo).
      entries: [...entries]
        .reverse()
        .slice(0, 50)
        .map((e: any) => ({ id: e.id, type: e.type, amount: e.amount, concept: e.concept, status: e.status, source: e.source, created_at: e.created_at })),
      payouts: (payouts ?? []).map((p: any) => ({
        id: p.id,
        amount: p.amount,
        status: p.status,
        method: p.method,
        requested_at: p.requested_at,
        resolved_at: p.resolved_at,
        reference: typeof p.metadata?.reference === 'string' ? p.metadata.reference : null,
        paid_at: typeof p.metadata?.paid_at === 'string' ? p.metadata.paid_at : p.resolved_at,
      })),
      bankAlias: (tenant as any).bank_alias || null,
      bankCbu: (tenant as any).bank_cbu || null,
    })
  } catch (e: any) {
    console.error('[finanzas] GET error:', e?.message)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireTenantPermission(request, 'withdrawals:read')
  if (!auth.ok) return auth.response
  return NextResponse.json(
    {
      error:
        'Ya no hace falta pedir retiros: Novamente te transfiere tu ganancia disponible una vez por semana, sin mínimo, al alias o CBU de tu panel.',
    },
    { status: 410 },
  )
}
