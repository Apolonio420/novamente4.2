/**
 * Partner payouts (retiros) service.
 *
 * All withdrawals go through the transactional RPC `partner_request_payout`
 * (see migrations/20260622_partner_payout_transaction.sql), which validates the
 * balance, creates the payout + debit atomically, serializes concurrent
 * withdrawals per tenant and is idempotent on an Idempotency-Key. This module is
 * the typed wrapper + the financial-state computation surfaced to the UI.
 */
import { supabaseAdmin } from '@/lib/supabase-admin'

export const MIN_PAYOUT_ARS = 20000

// ---------------------------------------------------------------------------
// Request a payout
// ---------------------------------------------------------------------------

export interface RequestPayoutInput {
  tenantId: string
  amount: number
  method: string
  /** Required so a timeout/retry cannot create a second withdrawal. */
  idempotencyKey: string
}

export interface RequestPayoutResult {
  ok: boolean
  /** HTTP status the route should return. */
  status: number
  payoutId?: string
  idempotent?: boolean
  available?: number
  error?: string
}

export interface PayoutInputValidation {
  ok: boolean
  status?: number
  error?: string
}

/**
 * The withdrawal endpoint must not accept an unkeyed request: an HTTP retry is
 * indistinguishable from a second user action once it reaches the database.
 */
export function validateIdempotencyKey(key: string | null | undefined): PayoutInputValidation {
  const normalized = String(key || '').trim()
  if (!normalized) {
    return { ok: false, status: 400, error: 'Falta el header Idempotency-Key' }
  }
  if (normalized.length > 255) {
    return { ok: false, status: 400, error: 'Idempotency-Key demasiado larga' }
  }
  return { ok: true }
}

/**
 * Pure validation shared by the route and tests. Flat shape (not a union) so it
 * type-checks under the project's `strict: false` config.
 */
export function validatePayoutInput(amount: number, method: string): PayoutInputValidation {
  if (!Number.isFinite(amount) || amount < MIN_PAYOUT_ARS) {
    return {
      ok: false,
      status: 400,
      error: `El retiro mínimo es $${MIN_PAYOUT_ARS.toLocaleString('es-AR')}`,
    }
  }
  if (!method || !method.trim()) {
    return {
      ok: false,
      status: 400,
      error: 'Indicá un alias o CBU de destino (o cargalo en Configuración)',
    }
  }
  return { ok: true }
}

export async function requestPayout(input: RequestPayoutInput): Promise<RequestPayoutResult> {
  const amount = Math.round(Number(input.amount) || 0)
  const method = String(input.method || '').slice(0, 120)
  const idempotencyKey = String(input.idempotencyKey || '').trim()

  const valid = validatePayoutInput(amount, method)
  if (!valid.ok) return { ok: false, status: valid.status, error: valid.error }
  const keyValid = validateIdempotencyKey(idempotencyKey)
  if (!keyValid.ok) return { ok: false, status: keyValid.status, error: keyValid.error }

  const sb = supabaseAdmin as any
  const { data, error } = await sb.rpc('partner_request_payout', {
    p_tenant_id: input.tenantId,
    p_amount: amount,
    p_method: method,
    p_idempotency_key: idempotencyKey,
  })

  if (error) {
    console.error('[payouts] rpc error:', error.message)
    return { ok: false, status: 500, error: 'No se pudo procesar el retiro' }
  }

  const res = (data || {}) as {
    ok?: boolean
    error?: string
    available?: number
    payout_id?: string
    idempotent?: boolean
    available_after?: number
  }

  if (!res.ok) {
    if (res.error === 'insufficient_funds') {
      const available = Number(res.available || 0)
      return {
        ok: false,
        status: 400,
        available,
        error: `Saldo insuficiente (disponible $${available.toLocaleString('es-AR')})`,
      }
    }
    return { ok: false, status: 400, error: 'No se pudo procesar el retiro' }
  }

  return {
    ok: true,
    status: 200,
    payoutId: res.payout_id,
    idempotent: !!res.idempotent,
    available: res.available_after,
  }
}

// ---------------------------------------------------------------------------
// Financial states
// ---------------------------------------------------------------------------

export interface TenantFinancials {
  /** Withdrawable now: confirmed credits − debits. */
  available: number
  /** Credits not yet confirmed (needs_review). */
  pending: number
  /** Reserved by in-flight payouts (requested/processing). */
  held: number
  /** Paid out (historical). */
  paid: number
  /** Rejected payouts (historical; debit already reversed). */
  rejected: number
}

interface LedgerEntryLite {
  type: string
  amount: number | string
  status?: string | null
}

interface PayoutLite {
  amount: number | string
  status?: string | null
}

/** Pure: derive the five financial states from ledger entries + payouts. */
export function computeFinancials(
  entries: LedgerEntryLite[],
  payouts: PayoutLite[],
): TenantFinancials {
  let available = 0
  let pending = 0
  for (const e of entries || []) {
    const amt = Number(e.amount) || 0
    if (e.type === 'credit' && e.status === 'needs_review') pending += amt
    else available += e.type === 'credit' ? amt : -amt
  }

  let held = 0
  let paid = 0
  let rejected = 0
  for (const p of payouts || []) {
    const amt = Number(p.amount) || 0
    switch (p.status) {
      case 'requested':
      case 'processing':
        held += amt
        break
      case 'paid':
        paid += amt
        break
      case 'rejected':
        rejected += amt
        break
      default:
        break
    }
  }

  return {
    available: Math.round(available),
    pending: Math.round(pending),
    held: Math.round(held),
    paid: Math.round(paid),
    rejected: Math.round(rejected),
  }
}

/** Fetch ledger + payouts for a tenant and compute the financial states. */
export async function getTenantFinancials(tenantId: string): Promise<TenantFinancials> {
  const sb = supabaseAdmin as any
  const [{ data: entries }, { data: payouts }] = await Promise.all([
    sb.from('partner_ledger_entries').select('type, amount, status').eq('tenant_id', tenantId),
    sb.from('partner_payouts').select('amount, status').eq('tenant_id', tenantId),
  ])
  return computeFinancials(entries || [], payouts || [])
}
