/**
 * Ajustes MANUALES al saldo de un partner (bonificaciones, correcciones).
 *
 * Caso que lo originó (28/09/2026): Juan bonificó los $3.500 de doble estampa
 * del primer pedido de Sponsors (NOV-20260926-9852) porque no se le había
 * avisado del recargo. La regla del ledger es NUNCA editar un asiento: el
 * crédito de la venta queda como se calculó y el ajuste va como asiento propio
 * (source 'adjustment'), con motivo, quién y cuándo.
 *
 * Único camino para escribir un ajuste desde fuera de la app:
 * scripts/partner-ledger-adjust.mts (dry-run por defecto). Guardas:
 *  - monto entero, distinto de 0 y con tope (MAX_AJUSTE_ARS) — positivo = a
 *    favor del partner (credit), negativo = en contra (debit);
 *  - motivo obligatorio (mín. 10 caracteres) y quién lo autorizó;
 *  - idempotente: la clave sale de (tenant, pedido, monto, motivo); correrlo dos
 *    veces no duplica.
 * `order_id` va en metadata y NO en la columna: el índice único de créditos es
 * por (tenant, pedido) y ya lo ocupa el crédito de la venta.
 */
import { createHash } from 'crypto'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const MAX_AJUSTE_ARS = 100_000

export interface AjusteInput {
  tenantId: string
  /** ARS enteros. > 0 bonificación (credit), < 0 descuento (debit). */
  amount: number
  motivo: string
  /** Quién lo autorizó (ej. "juan (vía Claude)"). */
  autorizadoPor: string
  orderId?: string | null
  orderNumber?: string | null
}

export function validarAjuste(a: AjusteInput): { ok: true } | { ok: false; error: string } {
  if (!a.tenantId) return { ok: false, error: 'Falta el partner (tenant).' }
  if (!Number.isInteger(a.amount) || a.amount === 0) return { ok: false, error: 'El monto tiene que ser un entero distinto de 0.' }
  if (Math.abs(a.amount) > MAX_AJUSTE_ARS) {
    return { ok: false, error: `El monto supera el tope de $${MAX_AJUSTE_ARS.toLocaleString('es-AR')} para ajustes manuales.` }
  }
  if (!a.motivo || a.motivo.trim().length < 10) return { ok: false, error: 'El motivo es obligatorio (mínimo 10 caracteres).' }
  if (!a.autorizadoPor || !a.autorizadoPor.trim()) return { ok: false, error: 'Falta quién autorizó el ajuste.' }
  return { ok: true }
}

/** Clave de idempotencia: mismo partner + pedido + monto + motivo = mismo ajuste. */
export function claveAjuste(a: AjusteInput): string {
  const base = [a.tenantId, a.orderId || '', String(a.amount), a.motivo.trim().toLowerCase()].join('|')
  return `adj:${createHash('sha256').update(base).digest('hex').slice(0, 32)}`
}

export function asientoAjuste(a: AjusteInput, now = new Date()) {
  const key = claveAjuste(a)
  const pedido = a.orderNumber ? ` — pedido ${a.orderNumber}` : ''
  return {
    tenant_id: a.tenantId,
    order_id: null,
    source: 'adjustment',
    type: a.amount > 0 ? ('credit' as const) : ('debit' as const),
    amount: Math.abs(a.amount),
    status: 'confirmed',
    // El concepto lo ve el partner en sus movimientos: el motivo tal cual (sin
    // prefijos tipo "Bonificación" que no aplican a todo ajuste a favor).
    concept: `${a.motivo.trim()}${pedido}`.slice(0, 200),
    metadata: {
      idempotency_key: key,
      order_id: a.orderId || null,
      order_number: a.orderNumber || null,
      motivo: a.motivo.trim(),
      autorizado_por: a.autorizadoPor.trim(),
      recorded_at: now.toISOString(),
    },
  }
}

export interface ResultadoAjuste {
  ok: boolean
  dryRun: boolean
  yaExistia?: boolean
  entryId?: string
  saldoAntes?: number
  saldoDespues?: number
  asiento?: ReturnType<typeof asientoAjuste>
  error?: string
}

async function saldoDe(tenantId: string): Promise<number> {
  const { data, error } = await (supabaseAdmin as any)
    .from('partner_ledger_entries')
    .select('type, amount, status')
    .eq('tenant_id', tenantId)
  if (error) throw new Error(error.message)
  return (data || []).reduce((s: number, e: any) => {
    const amt = Number(e.amount) || 0
    if (e.type === 'credit') return e.status === 'needs_review' ? s : s + amt
    return s - amt
  }, 0)
}

export async function aplicarAjuste(a: AjusteInput, opts: { execute: boolean }): Promise<ResultadoAjuste> {
  const v = validarAjuste(a)
  if (v.ok === false) return { ok: false, dryRun: !opts.execute, error: v.error }
  const sb = supabaseAdmin as any
  const asiento = asientoAjuste(a)

  const { data: previo, error: prevErr } = await sb
    .from('partner_ledger_entries')
    .select('id')
    .eq('tenant_id', a.tenantId)
    .eq('source', 'adjustment')
    .contains('metadata', { idempotency_key: asiento.metadata.idempotency_key })
    .limit(1)
  if (prevErr) return { ok: false, dryRun: !opts.execute, error: prevErr.message }

  // Ajustes cargados a mano (SQL) no tienen clave: si ya hay uno del MISMO pedido,
  // mismo sentido y mismo monto, se considera el mismo y no se duplica.
  let existente = previo?.[0]?.id as string | undefined
  if (!existente && a.orderId) {
    const { data: mismoPedido } = await sb
      .from('partner_ledger_entries')
      .select('id, type, amount')
      .eq('tenant_id', a.tenantId)
      .eq('source', 'adjustment')
      .contains('metadata', { order_id: a.orderId })
      .limit(20)
    existente = (mismoPedido || []).find(
      (e: any) => e.type === asiento.type && Number(e.amount) === asiento.amount,
    )?.id
  }

  const saldoAntes = await saldoDe(a.tenantId)
  if (existente) {
    return { ok: true, dryRun: !opts.execute, yaExistia: true, entryId: existente, saldoAntes, saldoDespues: saldoAntes, asiento }
  }
  const saldoDespues = saldoAntes + a.amount
  if (!opts.execute) return { ok: true, dryRun: true, saldoAntes, saldoDespues, asiento }

  const { data, error } = await sb.from('partner_ledger_entries').insert(asiento).select('id').single()
  if (error) return { ok: false, dryRun: false, error: error.message, asiento }
  return { ok: true, dryRun: false, entryId: data.id, saldoAntes, saldoDespues: await saldoDe(a.tenantId), asiento }
}

// ---------------------------------------------------------------------------
// Usar saldo a favor en un pedido propio del partner (débito 'credit_applied')
// ---------------------------------------------------------------------------

export interface UsoSaldoInput {
  tenantId: string
  /** ARS enteros > 0 que se descuentan del saldo a favor. */
  amount: number
  /** Pedido donde se usa (NOV-…, ficha, pedido de WhatsApp…). */
  referencia: string
  autorizadoPor: string
  nota?: string | null
}

export function claveUsoSaldo(u: UsoSaldoInput): string {
  const base = [u.tenantId, u.referencia.trim().toLowerCase(), String(u.amount)].join('|')
  return `use:${createHash('sha256').update(base).digest('hex').slice(0, 32)}`
}

/**
 * Descuenta saldo a favor vía el RPC partner_admin_apply_credit (atómico, con
 * lock por tenant, idempotente, no deja usar más que el saldo). Mismo camino que
 * el botón "Usar saldo a favor" del admin de platform.
 */
export async function usarSaldo(u: UsoSaldoInput, opts: { execute: boolean }): Promise<ResultadoAjuste> {
  const dryRun = !opts.execute
  if (!u.tenantId) return { ok: false, dryRun, error: 'Falta el partner (tenant).' }
  if (!Number.isInteger(u.amount) || u.amount <= 0) return { ok: false, dryRun, error: 'El monto tiene que ser un entero mayor a 0.' }
  if (!u.referencia || !u.referencia.trim()) return { ok: false, dryRun, error: 'Falta la referencia del pedido.' }
  if (!u.autorizadoPor || !u.autorizadoPor.trim()) return { ok: false, dryRun, error: 'Falta quién autorizó.' }

  const saldoAntes = await saldoDe(u.tenantId)
  if (u.amount > saldoAntes) {
    return { ok: false, dryRun, saldoAntes, error: `El saldo a favor es $${saldoAntes.toLocaleString('es-AR')}; no alcanza para $${u.amount.toLocaleString('es-AR')}.` }
  }
  if (dryRun) return { ok: true, dryRun, saldoAntes, saldoDespues: saldoAntes - u.amount }

  const { data, error } = await (supabaseAdmin as any).rpc('partner_admin_apply_credit', {
    p_tenant_id: u.tenantId,
    p_amount: u.amount,
    p_reference: u.referencia.trim(),
    p_admin_email: u.autorizadoPor.trim(),
    p_idempotency_key: claveUsoSaldo(u),
    p_notes: u.nota || null,
  })
  if (error) return { ok: false, dryRun, saldoAntes, error: error.message }
  const r = (data || {}) as { ok?: boolean; error?: string; entry_id?: string; idempotent?: boolean; available?: number }
  if (!r.ok) return { ok: false, dryRun, saldoAntes, error: r.error === 'insufficient_funds' ? `Saldo insuficiente (disponible $${r.available}).` : r.error }
  return { ok: true, dryRun, yaExistia: !!r.idempotent, entryId: r.entry_id, saldoAntes, saldoDespues: await saldoDe(u.tenantId) }
}
