import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock chain: supports .from().select().eq().eq().maybeSingle() and
// .from().insert({...}) (thenable, resolves like a promise). Responses are
// consumed from queues so each test controls exactly what each call returns.
const h = vi.hoisted(() => {
  const maybeSingleQueue: Array<{ data: any; error: any }> = []
  const insertQueue: Array<{ data: any; error: any }> = []
  const insertCalls: any[] = []

  const chain: any = {
    from: () => chain,
    select: () => chain,
    eq: () => chain,
    maybeSingle: () => Promise.resolve(maybeSingleQueue.shift() ?? { data: null, error: null }),
    insert: (payload: any) => {
      insertCalls.push(payload)
      const result = insertQueue.shift() ?? { data: null, error: null }
      return {
        ...chain,
        then: (resolve: any) => resolve(result),
      }
    },
  }
  return { chain, maybeSingleQueue, insertQueue, insertCalls }
})

vi.mock('@/lib/supabase-admin', () => ({ supabaseAdmin: h.chain }))
vi.mock('./garment-pricing.server', () => ({
  ALL_GARMENT_PRICING: { 'aura-oversize-tshirt': {} },
  getPartnerPlanPrice: (_gk: string, _plan: string) => 10000,
}))

import { computeOrderMargin, reverseOrderMargin } from './ledger'

beforeEach(() => {
  h.maybeSingleQueue.length = 0
  h.insertQueue.length = 0
  h.insertCalls.length = 0
})

describe('computeOrderMargin / resolveItemCost — anti-inflado de margen', () => {
  it('usa getPartnerPlanPrice (garmentKey) aunque metadata.cost_partner declare un costo inflado bajo', () => {
    const items = [{ item_name: 'Remera Aura - MiMarca', quantity: 1, unit_price: 30000 }]
    const products = [
      {
        name: 'Remera Aura',
        category: null,
        metadata: { garmentKey: 'aura-oversize-tshirt', cost_partner: 1 }, // partner intenta inflar margen
      },
    ]
    const result = computeOrderMargin(items, products, 'starter')
    // costo real de plan = 10000 (mockeado), no 1 → margen = 30000 - 10000 = 20000
    expect(result.margin).toBe(20000)
    expect(result.breakdown[0].cost).toBe(10000)
    expect(result.breakdown[0].via).toBe('garmentKey:aura-oversize-tshirt')
  })

  it('usa getPartnerPlanPrice aunque metadata.cost_partner declare un costo inflado alto (reduciría el margen si ganara)', () => {
    const items = [{ item_name: 'Remera Aura - MiMarca', quantity: 1, unit_price: 30000 }]
    const products = [
      {
        name: 'Remera Aura',
        category: null,
        metadata: { garmentKey: 'aura-oversize-tshirt', cost_partner: 999999 },
      },
    ]
    const result = computeOrderMargin(items, products, 'starter')
    expect(result.breakdown[0].cost).toBe(10000)
    expect(result.margin).toBe(20000)
  })

  it('cae a metadata.cost_partner solo cuando no hay garmentKey ni heurística resoluble', () => {
    const items = [{ item_name: 'Producto rarísimo sin match', quantity: 1, unit_price: 30000 }]
    const products = [
      {
        name: 'Producto rarísimo sin match',
        category: null,
        metadata: { cost_partner: 12345 },
      },
    ]
    const result = computeOrderMargin(items, products, 'starter')
    expect(result.breakdown[0].cost).toBe(12345)
    expect(result.breakdown[0].via).toBe('metadata.cost')
  })
})

describe('reverseOrderMargin', () => {
  const order = { id: 'order-1', tenant_id: 'tenant-1', order_number: 'NM-001' }

  it('inserta un debit compensatorio cuando existe un credit confirmado previo', async () => {
    h.maybeSingleQueue.push({ data: null, error: null }) // no existing reversal
    h.maybeSingleQueue.push({ data: { id: 'credit-1', amount: 20000 }, error: null }) // original credit
    h.insertQueue.push({ data: { id: 'debit-1' }, error: null })

    const result = await reverseOrderMargin(order)

    expect(result.reversed).toBe(true)
    expect(result.amount).toBe(20000)
    expect(h.insertCalls).toHaveLength(1)
    expect(h.insertCalls[0]).toMatchObject({
      tenant_id: 'tenant-1',
      order_id: 'order-1',
      source: 'order_refund',
      type: 'debit',
      amount: 20000,
      status: 'confirmed',
    })
  })

  it('NO borra ni edita la entry original (solo inserta, nunca llama delete/update)', async () => {
    h.maybeSingleQueue.push({ data: null, error: null })
    h.maybeSingleQueue.push({ data: { id: 'credit-1', amount: 5000 }, error: null })
    h.insertQueue.push({ data: { id: 'debit-2' }, error: null })

    expect(h.chain.delete).toBeUndefined()
    expect(h.chain.update).toBeUndefined()
    await reverseOrderMargin(order)
    expect(h.insertCalls).toHaveLength(1)
  })

  it('es idempotente: si ya existe un reverso previo, no inserta de nuevo', async () => {
    h.maybeSingleQueue.push({ data: { id: 'existing-reversal' }, error: null }) // reversal already exists

    const result = await reverseOrderMargin(order)

    expect(result.reversed).toBe(false)
    expect(h.insertCalls).toHaveLength(0)
  })

  it('no hace nada si no existe un credit confirmado previo (orden needs_review o margen 0)', async () => {
    h.maybeSingleQueue.push({ data: null, error: null }) // no existing reversal
    h.maybeSingleQueue.push({ data: null, error: null }) // no original credit

    const result = await reverseOrderMargin(order)

    expect(result.reversed).toBe(false)
    expect(h.insertCalls).toHaveLength(0)
  })
})
