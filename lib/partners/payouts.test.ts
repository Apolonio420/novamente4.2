import { describe, it, expect, beforeEach, vi } from 'vitest'

const h = vi.hoisted(() => {
  const state: { rpc: (name: string, args: any) => Promise<{ data: any; error: any }> } = {
    rpc: async () => ({ data: { ok: true }, error: null }),
  }
  const calls: Array<{ name: string; args: any }> = []
  const chain: any = {
    rpc: (name: string, args: any) => {
      calls.push({ name, args })
      return state.rpc(name, args)
    },
    from: () => chain,
    select: () => chain,
    eq: () => Promise.resolve({ data: [], error: null }),
  }
  return { chain, state, calls }
})

vi.mock('@/lib/supabase-admin', () => ({ supabaseAdmin: h.chain }))

import { validatePayoutInput, requestPayout, computeFinancials, MIN_PAYOUT_ARS } from './payouts'

beforeEach(() => {
  h.calls.length = 0
  h.state.rpc = async () => ({ data: { ok: true }, error: null })
})

describe('validatePayoutInput', () => {
  it('rechaza montos por debajo del mínimo', () => {
    const r = validatePayoutInput(MIN_PAYOUT_ARS - 1, 'alias')
    expect(r.ok).toBe(false)
  })
  it('rechaza sin método de destino', () => {
    const r = validatePayoutInput(MIN_PAYOUT_ARS, '   ')
    expect(r.ok).toBe(false)
  })
  it('acepta monto válido + método', () => {
    expect(validatePayoutInput(MIN_PAYOUT_ARS, 'alias.mp').ok).toBe(true)
  })
})

describe('requestPayout', () => {
  it('pasa la Idempotency-Key al RPC', async () => {
    await requestPayout({ tenantId: 't1', amount: 30000, method: 'alias', idempotencyKey: 'key-123' })
    expect(h.calls).toHaveLength(1)
    expect(h.calls[0].name).toBe('partner_request_payout')
    expect(h.calls[0].args.p_idempotency_key).toBe('key-123')
    expect(h.calls[0].args.p_tenant_id).toBe('t1')
    expect(h.calls[0].args.p_amount).toBe(30000)
  })

  it('éxito del RPC → ok + payoutId', async () => {
    h.state.rpc = async () => ({ data: { ok: true, payout_id: 'p1', idempotent: false, available_after: 5000 }, error: null })
    const r = await requestPayout({ tenantId: 't1', amount: 30000, method: 'alias' })
    expect(r.ok).toBe(true)
    expect(r.status).toBe(200)
    expect(r.payoutId).toBe('p1')
  })

  it('réplica idempotente → ok + idempotent:true (sin duplicar)', async () => {
    h.state.rpc = async () => ({ data: { ok: true, idempotent: true, payout_id: 'p1', status: 'requested' }, error: null })
    const r = await requestPayout({ tenantId: 't1', amount: 30000, method: 'alias', idempotencyKey: 'key-123' })
    expect(r.ok).toBe(true)
    expect(r.idempotent).toBe(true)
    expect(r.payoutId).toBe('p1')
  })

  it('saldo insuficiente → 400 con disponible', async () => {
    h.state.rpc = async () => ({ data: { ok: false, error: 'insufficient_funds', available: 12000 }, error: null })
    const r = await requestPayout({ tenantId: 't1', amount: 30000, method: 'alias' })
    expect(r.ok).toBe(false)
    expect(r.status).toBe(400)
    expect(r.available).toBe(12000)
  })

  it('monto por debajo del mínimo no llega al RPC', async () => {
    const r = await requestPayout({ tenantId: 't1', amount: 100, method: 'alias' })
    expect(r.ok).toBe(false)
    expect(h.calls).toHaveLength(0)
  })

  it('error de RPC → 500', async () => {
    h.state.rpc = async () => ({ data: null, error: { message: 'db down' } })
    const r = await requestPayout({ tenantId: 't1', amount: 30000, method: 'alias' })
    expect(r.ok).toBe(false)
    expect(r.status).toBe(500)
  })
})

describe('computeFinancials — estados consistentes', () => {
  it('disponible = créditos confirmados − débitos; needs_review → pendiente', () => {
    const fin = computeFinancials(
      [
        { type: 'credit', amount: 100000, status: 'confirmed' },
        { type: 'credit', amount: 20000, status: 'needs_review' },
        { type: 'debit', amount: 30000, status: 'confirmed' },
      ],
      [],
    )
    expect(fin.available).toBe(70000) // 100000 - 30000
    expect(fin.pending).toBe(20000)
  })

  it('retiros: requested/processing → retenido; paid → pagado; rejected → rechazado', () => {
    const fin = computeFinancials(
      [{ type: 'credit', amount: 100000, status: 'confirmed' }],
      [
        { amount: 20000, status: 'requested' },
        { amount: 15000, status: 'processing' },
        { amount: 40000, status: 'paid' },
        { amount: 5000, status: 'rejected' },
      ],
    )
    expect(fin.held).toBe(35000) // 20000 + 15000
    expect(fin.paid).toBe(40000)
    expect(fin.rejected).toBe(5000)
  })

  it('reverso de retiro rechazado vuelve a disponible', () => {
    // debit del retiro + credit de reverso (payout_reversal) se cancelan en el neto
    const fin = computeFinancials(
      [
        { type: 'credit', amount: 100000, status: 'confirmed' },
        { type: 'debit', amount: 30000, status: 'confirmed' },
        { type: 'credit', amount: 30000, status: 'confirmed' }, // payout_reversal
      ],
      [{ amount: 30000, status: 'rejected' }],
    )
    expect(fin.available).toBe(100000)
    expect(fin.rejected).toBe(30000)
  })
})
