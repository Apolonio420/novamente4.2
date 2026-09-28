import { describe, it, expect, beforeEach, vi } from 'vitest'

const h = vi.hoisted(() => {
  const state = {
    existingBridge: new Set<string>(), // `${tenantId}|${paymentId}` que ya tienen fila en partner_orders
    bridgeInsertResults: [] as Array<{ error: any }>,
    bridgeInsertCalls: [] as any[],
    tenants: [] as Array<{ data: any; error: any }>,
  }

  function chainFor(table: string) {
    let tenantId = ''
    let paymentId = ''
    const chain: any = {
      select: () => chain,
      eq: (field: string, value: string) => {
        if (field === 'tenant_id') tenantId = value
        if (field === 'payment_id') paymentId = value
        return chain
      },
      in: () => chain,
      limit: () => chain,
      insert: (payload: any) => {
        state.bridgeInsertCalls.push(payload)
        const result = state.bridgeInsertResults.shift() ?? { error: null }
        return { then: (resolve: any) => resolve(result) }
      },
      then: (resolve: any) => {
        if (table === 'partner_orders') {
          const exists = state.existingBridge.has(`${tenantId}|${paymentId}`)
          return resolve({ data: exists ? [{ id: 'existing' }] : [], error: null })
        }
        if (table === 'tenants') return resolve(state.tenants.shift() ?? { data: [], error: null })
        return resolve({ data: [], error: null })
      },
    }
    return chain
  }

  const sb = { from: (table: string) => chainFor(table) }
  return { sb, state }
})

vi.mock('@/lib/supabase-admin', () => ({ supabaseAdmin: h.sb }))

const creditOrderMarginMock = vi.fn()
vi.mock('./ledger', () => ({ creditOrderMargin: (...args: any[]) => creditOrderMarginMock(...args) }))

const updateOrderMock = vi.fn(async (..._args: any[]) => true)
vi.mock('@/lib/db', () => ({ updateOrder: (...args: any[]) => updateOrderMock(...args) }))

const notifyPartnerWebSaleMock = vi.fn(async (..._args: any[]) => true)
const notifyPartnerDebtMock = vi.fn(async (..._args: any[]) => undefined)
vi.mock('@/lib/notifications', () => ({
  notifyPartnerWebSale: (...args: any[]) => notifyPartnerWebSaleMock(...args),
  notifyPartnerDebt: (...args: any[]) => notifyPartnerDebtMock(...args),
}))

import { partnerSaleKey, runPartnerSaleEffects } from './sale-effects'

beforeEach(() => {
  h.state.existingBridge.clear()
  h.state.bridgeInsertResults.length = 0
  h.state.bridgeInsertCalls.length = 0
  h.state.tenants.length = 0
  creditOrderMarginMock.mockReset()
  updateOrderMock.mockClear()
  notifyPartnerWebSaleMock.mockClear()
  notifyPartnerDebtMock.mockClear()
})

describe('partnerSaleKey', () => {
  it('transferencia → transfer:<order_number>', () => {
    expect(partnerSaleKey({ id: 'o1', tenant_id: null, order_number: 'NOV-1', payment_method: 'transferencia' })).toBe('transfer:NOV-1')
  })

  it('transferencia sin order_number → transfer:<id>', () => {
    expect(partnerSaleKey({ id: 'o1', tenant_id: null, payment_method: 'transferencia' })).toBe('transfer:o1')
  })

  it('MP con paymentId → usa ese id', () => {
    expect(partnerSaleKey({ id: 'o2', tenant_id: null, payment_method: 'mercadopago' }, 'mp-123')).toBe('mp-123')
  })

  it('payment_id "manual" (sin paymentId explícito) → web:<id>', () => {
    expect(partnerSaleKey({ id: 'o3', tenant_id: null, payment_method: 'mercadopago', payment_id: 'manual' })).toBe('web:o3')
  })
})

function makeCredit(overrides: Partial<any> = {}) {
  return {
    tenantId: 'tenant-A',
    amount: 1000,
    computed: 1000,
    needsReview: false,
    breakdown: [],
    reasons: [],
    inserted: true,
    alreadyExisted: false,
    ...overrides,
  }
}

describe('runPartnerSaleEffects — bridge a partner_orders', () => {
  it('inserta 1 fila por tenant, con payment_id = saleKey y SOLO los ítems de ese tenant, fulfillment_status queued_for_production', async () => {
    const order = {
      id: 'order-1',
      tenant_id: 'tenant-A',
      order_number: 'NOV-1',
      items: [
        { id: 'item-1', item_name: 'Item 1', quantity: 1, unit_price: 10000 },
        { id: 'item-2', item_name: 'Item 2', quantity: 1, unit_price: 20000 },
      ],
    }
    creditOrderMarginMock.mockResolvedValue({
      margin: 3000,
      needsReview: false,
      excluded: [],
      credits: [
        makeCredit({ tenantId: 'tenant-A', amount: 1000, breakdown: [{ order_item_id: 'item-1', unit: 10000, qty: 1, descuento: 0 }] }),
        makeCredit({ tenantId: 'tenant-B', amount: 2000, breakdown: [{ order_item_id: 'item-2', unit: 20000, qty: 1, descuento: 0 }] }),
      ],
    })

    await runPartnerSaleEffects(order, { saleKey: 'web:order-1', meta: {}, notifyPartner: false })

    expect(h.state.bridgeInsertCalls).toHaveLength(2)
    const byTenant = Object.fromEntries(h.state.bridgeInsertCalls.map((c: any) => [c.tenant_id, c]))
    expect(byTenant['tenant-A']).toMatchObject({ payment_id: 'web:order-1', fulfillment_status: 'queued_for_production', status: 'confirmed' })
    // partner_orders en prod NO tiene payment_status: mandarlo rompe el insert (PGRST204).
    expect(byTenant['tenant-A']).not.toHaveProperty('payment_status')
    expect(byTenant['tenant-A'].shipping_info).toMatchObject({ source: 'web' })
    expect(byTenant['tenant-A'].items.map((i: any) => i.id)).toEqual(['item-1'])
    expect(byTenant['tenant-B'].items.map((i: any) => i.id)).toEqual(['item-2'])
  })

  it('si ya existe una fila (tenant, payment_id), no inserta de nuevo', async () => {
    const order = { id: 'order-2', tenant_id: 'tenant-A', order_number: 'NOV-2', items: [{ id: 'item-1', item_name: 'Item 1' }] }
    h.state.existingBridge.add('tenant-A|web:order-2')
    creditOrderMarginMock.mockResolvedValue({
      margin: 1000,
      needsReview: false,
      excluded: [],
      credits: [makeCredit({ tenantId: 'tenant-A', breakdown: [{ order_item_id: 'item-1', unit: 1000, qty: 1, descuento: 0 }] })],
    })

    await runPartnerSaleEffects(order, { saleKey: 'web:order-2', meta: {}, notifyPartner: false })

    expect(h.state.bridgeInsertCalls).toHaveLength(0)
  })
})

describe('runPartnerSaleEffects — mail al partner (notifyPartnerWebSale)', () => {
  const order = { id: 'order-3', tenant_id: 'tenant-A', order_number: 'NOV-3', items: [{ id: 'item-1', item_name: 'Item 1' }] }
  const credit = makeCredit({ tenantId: 'tenant-A', breakdown: [{ order_item_id: 'item-1', unit: 1000, qty: 1, descuento: 0 }] })

  beforeEach(() => {
    h.state.tenants.push({ data: [{ id: 'tenant-A', name: 'Tienda A', slug: 'a', email: 'a@x.com', bank_alias: null, bank_cbu: null }], error: null })
    creditOrderMarginMock.mockResolvedValue({ margin: 1000, needsReview: false, excluded: [], credits: [credit] })
  })

  it('notifyPartner true → manda el mail 1 vez por tenant y persiste meta.partner_notified_tenants', async () => {
    const r = await runPartnerSaleEffects(order, { saleKey: 'web:order-3', meta: {}, notifyPartner: true })

    expect(notifyPartnerWebSaleMock).toHaveBeenCalledTimes(1)
    expect(updateOrderMock).toHaveBeenCalledWith(
      'order-3',
      expect.objectContaining({ metadata: expect.objectContaining({ partner_notified_tenants: ['tenant-A'] }) }),
    )
    expect(r.meta.partner_notified_tenants).toEqual(['tenant-A'])
  })

  it('meta que YA incluye al tenant → no vuelve a mandar', async () => {
    await runPartnerSaleEffects(order, { saleKey: 'web:order-3', meta: { partner_notified_tenants: ['tenant-A'] }, notifyPartner: true })

    expect(notifyPartnerWebSaleMock).not.toHaveBeenCalled()
    expect(updateOrderMock).not.toHaveBeenCalled()
  })

  it('meta LEGACY (partner_notified_at sin lista) → no vuelve a mandar', async () => {
    await runPartnerSaleEffects(order, { saleKey: 'web:order-3', meta: { partner_notified_at: '2026-01-01T00:00:00Z' }, notifyPartner: true })

    expect(notifyPartnerWebSaleMock).not.toHaveBeenCalled()
  })

  it('notifyPartner false → nunca manda mail', async () => {
    await runPartnerSaleEffects(order, { saleKey: 'web:order-3', meta: {}, notifyPartner: false })

    expect(notifyPartnerWebSaleMock).not.toHaveBeenCalled()
  })
})

describe('runPartnerSaleEffects — aviso de deuda por Telegram (notifyPartnerDebt)', () => {
  it('solo avisa para los créditos con inserted=true (no para los que ya existían)', async () => {
    const order = {
      id: 'order-4',
      tenant_id: 'tenant-A',
      order_number: 'NOV-4',
      items: [
        { id: 'item-1', item_name: 'Item 1' },
        { id: 'item-2', item_name: 'Item 2' },
      ],
    }
    h.state.tenants.push({ data: [], error: null })
    creditOrderMarginMock.mockResolvedValue({
      margin: 2000,
      needsReview: false,
      excluded: [],
      credits: [
        makeCredit({ tenantId: 'tenant-A', inserted: true, alreadyExisted: false, breakdown: [{ order_item_id: 'item-1', unit: 1000, qty: 1, descuento: 0 }] }),
        makeCredit({ tenantId: 'tenant-B', inserted: false, alreadyExisted: true, breakdown: [{ order_item_id: 'item-2', unit: 1000, qty: 1, descuento: 0 }] }),
      ],
    })

    await runPartnerSaleEffects(order, { saleKey: 'web:order-4', meta: {}, notifyPartner: false })

    expect(notifyPartnerDebtMock).toHaveBeenCalledTimes(1)
    expect(notifyPartnerDebtMock).toHaveBeenCalledWith(expect.objectContaining({ tenantSlug: expect.any(String) }))
  })
})

describe('runPartnerSaleEffects — payoutMode derivado de tenant.metadata', () => {
  const order = { id: 'order-5', tenant_id: 'tenant-A', order_number: 'NOV-5', items: [{ id: 'item-1', item_name: 'Item 1' }] }
  const credit = makeCredit({ tenantId: 'tenant-A', inserted: true, breakdown: [{ order_item_id: 'item-1', unit: 1000, qty: 1, descuento: 0 }] })

  beforeEach(() => {
    creditOrderMarginMock.mockResolvedValue({ margin: 1000, needsReview: false, excluded: [], credits: [credit] })
  })

  it("tenant.metadata.payout_mode 'credit' → se pasa payoutMode:'credit' a notifyPartnerWebSale y notifyPartnerDebt", async () => {
    h.state.tenants.push({
      data: [{ id: 'tenant-A', name: 'Sponsors', slug: 'sponsors', email: 'sponsors@x.com', bank_alias: null, bank_cbu: null, metadata: { payout_mode: 'credit' } }],
      error: null,
    })

    await runPartnerSaleEffects(order, { saleKey: 'web:order-5', meta: {}, notifyPartner: true })

    expect(notifyPartnerWebSaleMock).toHaveBeenCalledTimes(1)
    expect(notifyPartnerWebSaleMock.mock.calls[0][1]).toMatchObject({ payoutMode: 'credit' })
    expect(notifyPartnerDebtMock).toHaveBeenCalledTimes(1)
    expect(notifyPartnerDebtMock.mock.calls[0][0]).toMatchObject({ payoutMode: 'credit' })
  })

  it("tenant sin metadata.payout_mode (o sin metadata) → payoutMode:'cash'", async () => {
    h.state.tenants.push({
      data: [{ id: 'tenant-A', name: 'Tienda A', slug: 'a', email: 'a@x.com', bank_alias: 'a.alias', bank_cbu: null }],
      error: null,
    })

    await runPartnerSaleEffects(order, { saleKey: 'web:order-5', meta: {}, notifyPartner: true })

    expect(notifyPartnerWebSaleMock.mock.calls[0][1]).toMatchObject({ payoutMode: 'cash' })
    expect(notifyPartnerDebtMock.mock.calls[0][0]).toMatchObject({ payoutMode: 'cash' })
  })
})
