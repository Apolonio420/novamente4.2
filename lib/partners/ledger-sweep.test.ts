import { describe, it, expect, beforeEach, vi } from 'vitest'

const h = vi.hoisted(() => {
  const state = {
    ordersPages: [] as any[][], // una entrada por página que devuelve el SELECT a `orders`
    ledgerPages: [] as any[][], // una entrada por chunk que devuelve el SELECT a `partner_ledger_entries`
  }

  function chainFor(table: string) {
    const chain: any = {
      select: () => chain,
      not: () => chain,
      eq: () => chain,
      gte: () => chain,
      order: () => chain,
      range: () => chain,
      in: () => chain,
      then: (resolve: any) => {
        if (table === 'orders') return resolve({ data: state.ordersPages.shift() ?? [], error: null })
        if (table === 'partner_ledger_entries') return resolve({ data: state.ledgerPages.shift() ?? [], error: null })
        return resolve({ data: [], error: null })
      },
    }
    return chain
  }

  const sb = { from: (table: string) => chainFor(table) }
  return { sb, state }
})

vi.mock('@/lib/supabase-admin', () => ({ supabaseAdmin: h.sb }))

const getOrderByIdMock = vi.fn()
vi.mock('@/lib/db', () => ({ getOrderById: (...args: any[]) => getOrderByIdMock(...args) }))

const planOrderCreditsMock = vi.fn()
vi.mock('./ledger', () => ({ planOrderCredits: (...args: any[]) => planOrderCreditsMock(...args) }))

const runPartnerSaleEffectsMock = vi.fn()
const partnerSaleKeyMock = vi.fn((..._args: any[]) => 'sale-key-1')
vi.mock('./sale-effects', () => ({
  runPartnerSaleEffects: (...args: any[]) => runPartnerSaleEffectsMock(...args),
  partnerSaleKey: (...args: any[]) => partnerSaleKeyMock(...args),
}))

import { findOrdersMissingCredit, sweepPartnerCredits } from './ledger-sweep'

beforeEach(() => {
  h.state.ordersPages.length = 0
  h.state.ledgerPages.length = 0
  getOrderByIdMock.mockReset()
  planOrderCreditsMock.mockReset()
  runPartnerSaleEffectsMock.mockReset()
  partnerSaleKeyMock.mockClear()
})

describe('findOrdersMissingCredit', () => {
  it('excluye las órdenes canceladas y las que ya tienen crédito web_order', async () => {
    h.state.ordersPages.push([
      { id: 'o1', order_number: 'NOV-1', tenant_id: 't1', payment_method: 'transferencia', created_at: '2026-01-01', total: 1000, status: 'confirmed' },
      { id: 'o2', order_number: 'NOV-2', tenant_id: 't1', payment_method: 'transferencia', created_at: '2026-01-02', total: 1000, status: 'cancelled' },
      { id: 'o3', order_number: 'NOV-3', tenant_id: 't1', payment_method: 'mercadopago', created_at: '2026-01-03', total: 1000, status: 'confirmed' },
    ]) // < PAGE(1000) → una sola página
    h.state.ledgerPages.push([{ order_id: 'o1' }]) // o1 ya tiene crédito; o2(cancelada) ni se cuenta; o3 falta

    const { scanned, missing } = await findOrdersMissingCredit()

    expect(scanned).toBe(2) // o1 + o3 (o2 cancelada nunca se pushea a `orders`)
    expect(missing.map((o) => o.id)).toEqual(['o3'])
  })
})

describe('sweepPartnerCredits — dry run', () => {
  it('usa planOrderCredits y NO llama runPartnerSaleEffects', async () => {
    h.state.ordersPages.push([
      { id: 'o1', order_number: 'NOV-1', tenant_id: 't1', payment_method: 'transferencia', created_at: '2026-01-01', total: 1000, status: 'confirmed' },
    ])
    h.state.ledgerPages.push([]) // sin crédito → falta
    getOrderByIdMock.mockResolvedValue({ id: 'o1', order_number: 'NOV-1', tenant_id: 't1', items: [] })
    planOrderCreditsMock.mockResolvedValue({ credits: [{ tenantId: 't1', amount: 500, needsReview: false, reasons: [] }], excluded: [] })

    const result = await sweepPartnerCredits({ dryRun: true })

    expect(result.dryRun).toBe(true)
    expect(result.missing).toHaveLength(1)
    expect(result.missing[0].planned).toEqual([{ tenantId: 't1', amount: 500, needsReview: false, reasons: [] }])
    expect(planOrderCreditsMock).toHaveBeenCalledTimes(1)
    expect(runPartnerSaleEffectsMock).not.toHaveBeenCalled()
  })
})

describe('sweepPartnerCredits — ejecución real', () => {
  it('llama runPartnerSaleEffects con notifyPartner false', async () => {
    h.state.ordersPages.push([
      { id: 'o2', order_number: 'NOV-2', tenant_id: 't2', payment_method: 'mercadopago', created_at: '2026-01-01', total: 1000, status: 'confirmed' },
    ])
    h.state.ledgerPages.push([])
    const fullOrder = { id: 'o2', order_number: 'NOV-2', tenant_id: 't2', items: [] }
    getOrderByIdMock.mockResolvedValue(fullOrder)
    runPartnerSaleEffectsMock.mockResolvedValue({
      meta: {},
      credit: { margin: 500, needsReview: false, excluded: [], credits: [{ tenantId: 't2', amount: 500, needsReview: false, inserted: true, reasons: [] }] },
    })

    const result = await sweepPartnerCredits({ dryRun: false })

    expect(runPartnerSaleEffectsMock).toHaveBeenCalledTimes(1)
    const [orderArg, optsArg] = runPartnerSaleEffectsMock.mock.calls[0]
    expect(orderArg).toEqual(fullOrder)
    expect(optsArg.notifyPartner).toBe(false)
    expect(optsArg.saleKey).toBe('sale-key-1')
    expect(result.missing[0].credited).toEqual([{ tenantId: 't2', amount: 500, needsReview: false, inserted: true, reasons: [] }])
    expect(result.missing[0].error).toBeUndefined()
  })

  it('si runPartnerSaleEffects devuelve credits vacío, la entry queda con error', async () => {
    h.state.ordersPages.push([
      { id: 'o3', order_number: 'NOV-3', tenant_id: 't3', payment_method: 'mercadopago', created_at: '2026-01-01', total: 1000, status: 'confirmed' },
    ])
    h.state.ledgerPages.push([])
    getOrderByIdMock.mockResolvedValue({ id: 'o3', order_number: 'NOV-3', tenant_id: 't3', items: [] })
    runPartnerSaleEffectsMock.mockResolvedValue({ meta: {}, credit: { margin: 0, needsReview: false, excluded: [], credits: [] } })

    const result = await sweepPartnerCredits({ dryRun: false })

    expect(result.missing[0].error).toBeTruthy()
  })
})
