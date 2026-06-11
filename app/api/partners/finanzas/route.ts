/**
 * GET /api/partners/finanzas — balance + movimientos + retiros del tenant
 * POST /api/partners/finanzas — solicitar retiro { amount, method? }
 */
import { NextRequest, NextResponse } from 'next/server'
import { getRequestTenant } from '@/lib/partners/auth'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getTenantBalance } from '@/lib/partners/ledger'

const MIN_PAYOUT_ARS = 20000

export async function GET(request: NextRequest) {
  try {
    const result = await getRequestTenant(request)
    if (!result) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    const { tenant } = result
    const sb = supabaseAdmin as any

    const [balance, { data: entries }, { data: payouts }] = await Promise.all([
      getTenantBalance(tenant.id),
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
      balance,
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
    const result = await getRequestTenant(request)
    if (!result) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    const { tenant } = result
    const sb = supabaseAdmin as any

    const body = await request.json().catch(() => ({}))
    const amount = Math.round(Number(body.amount) || 0)
    const method = String(body.method || (tenant as any).bank_alias || (tenant as any).bank_cbu || '').slice(0, 120)

    if (amount < MIN_PAYOUT_ARS) {
      return NextResponse.json({ error: `El retiro mínimo es $${MIN_PAYOUT_ARS.toLocaleString('es-AR')}` }, { status: 400 })
    }
    if (!method) {
      return NextResponse.json({ error: 'Indicá un alias o CBU de destino (o cargalo en Configuración)' }, { status: 400 })
    }

    const { available } = await getTenantBalance(tenant.id)
    if (amount > available) {
      return NextResponse.json({ error: `Saldo insuficiente (disponible $${available.toLocaleString('es-AR')})` }, { status: 400 })
    }

    // Crear payout + debit atómico-ish (si falla el debit, borramos el payout)
    const { data: payout, error: pErr } = await sb
      .from('partner_payouts')
      .insert({ tenant_id: tenant.id, amount, method, status: 'requested' })
      .select('id')
      .single()
    if (pErr || !payout) {
      console.error('[finanzas] payout insert error:', pErr?.message)
      return NextResponse.json({ error: 'No se pudo crear la solicitud' }, { status: 500 })
    }

    const { error: dErr } = await sb.from('partner_ledger_entries').insert({
      tenant_id: tenant.id,
      payout_id: payout.id,
      source: 'payout',
      type: 'debit',
      amount,
      concept: `Retiro solicitado a ${method}`,
    })
    if (dErr) {
      await sb.from('partner_payouts').delete().eq('id', payout.id)
      console.error('[finanzas] debit error:', dErr.message)
      return NextResponse.json({ error: 'No se pudo registrar el retiro' }, { status: 500 })
    }

    // Aviso interno (Telegram ventas si está configurado) — best effort
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
    } catch { /* no bloquea */ }

    return NextResponse.json({ ok: true, payoutId: payout.id })
  } catch (e: any) {
    console.error('[finanzas] POST error:', e?.message)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
