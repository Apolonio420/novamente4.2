import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock de supabase-admin consciente de tabla/método: cada tabla que toca
// planOrderCredits/creditOrderMargin/reverseOrderMargin tiene su propia cola
// de respuestas, para no depender del orden global de llamadas (planOrderCredits
// dispara dos SELECT a partner_products en paralelo con Promise.all).
const h = vi.hoisted(() => {
  const state = {
    productsById: [] as Array<{ data: any; error: any }>, // partner_products .in('id', ids)
    productsByTenant: [] as Array<{ data: any; error: any }>, // partner_products .eq('tenant_id', …)
    discountCode: [] as Array<{ data: any; error: any }>, // partner_discount_codes …maybeSingle()
    tenants: [] as Array<{ data: any; error: any }>, // tenants .in('id', ids)
    ledgerSelects: [] as Array<{ data: any; error: any }>, // partner_ledger_entries SELECT (reverseOrderMargin)
    ledgerInsertResults: [] as Array<{ data: any; error: any }>, // partner_ledger_entries INSERT
    ledgerInsertCalls: [] as any[],
  }

  function chainFor(table: string) {
    let mode: 'in' | 'eq' = 'eq'
    const chain: any = {
      select: () => chain,
      eq: (field: string) => {
        if (table === 'partner_products' && field === 'tenant_id') mode = 'eq'
        return chain
      },
      in: (field: string) => {
        if (table === 'partner_products' && field === 'id') mode = 'in'
        return chain
      },
      maybeSingle: () => Promise.resolve(state.discountCode.shift() ?? { data: null, error: null }),
      insert: (payload: any) => {
        state.ledgerInsertCalls.push(payload)
        const result = state.ledgerInsertResults.shift() ?? { data: { id: 'entry' }, error: null }
        return { then: (resolve: any) => resolve(result) }
      },
      then: (resolve: any) => {
        if (table === 'partner_products') {
          const q = mode === 'in' ? state.productsById : state.productsByTenant
          return resolve(q.shift() ?? { data: [], error: null })
        }
        if (table === 'tenants') return resolve(state.tenants.shift() ?? { data: [], error: null })
        if (table === 'partner_ledger_entries') return resolve(state.ledgerSelects.shift() ?? { data: [], error: null })
        return resolve({ data: [], error: null })
      },
    }
    return chain
  }

  const sb = { from: (table: string) => chainFor(table) }
  return { sb, state }
})

vi.mock('@/lib/supabase-admin', () => ({ supabaseAdmin: h.sb }))
vi.mock('./garment-pricing.server', () => ({
  ALL_GARMENT_PRICING: { 'aura-oversize-tshirt': {} },
  getPartnerPlanPrice: (_gk: string, _plan: string) => 10000,
}))

import { computeOrderMargin, reverseOrderMargin, creditOrderMargin, planOrderCredits, matchProduct, partnerProductIdDeItem } from './ledger'

beforeEach(() => {
  h.state.productsById.length = 0
  h.state.productsByTenant.length = 0
  h.state.discountCode.length = 0
  h.state.tenants.length = 0
  h.state.ledgerSelects.length = 0
  h.state.ledgerInsertResults.length = 0
  h.state.ledgerInsertCalls.length = 0
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

  it('costo irresoluble (sin garmentKey ni cost_partner) → needsReview con reason costo_irresoluble', () => {
    const items = [{ item_name: 'Objeto no identificable', quantity: 1, unit_price: 30000 }]
    const products = [{ name: 'Objeto no identificable', category: null, metadata: {} }]
    const result = computeOrderMargin(items, products, 'starter')
    expect(result.needsReview).toBe(true)
    expect(result.breakdown[0].cost).toBeNull()
    expect(result.reasons).toContain('costo_irresoluble:Objeto no identificable')
  })

  it('PVP por debajo del costo → needsReview + bajo_costo, y la ganancia negativa NO se clampea en la línea', () => {
    const items = [{ item_name: 'Remera Aura - MiMarca', quantity: 1, unit_price: 4000 }] // < costo 10000
    const products = [{ name: 'Remera Aura', category: null, metadata: { garmentKey: 'aura-oversize-tshirt' } }]
    const result = computeOrderMargin(items, products, 'starter')
    expect(result.needsReview).toBe(true)
    expect(result.breakdown[0].bajo_costo).toBe(true)
    expect(result.breakdown[0].ganancia).toBe(-6000) // (4000 - 10000) * 1, SIN clampear
    expect(result.margin).toBe(-6000)
    expect(result.reasons).toEqual(expect.arrayContaining(['pvp_bajo_costo:Remera Aura - MiMarca', 'ganancia_negativa']))
  })

  it('descuento prorrateado entre líneas: la suma exacta = el descuento, y la ganancia total baja en ese monto', () => {
    // Dos líneas de igual peso (misma unit*qty) → prorratear reparte 50/50 (queda
    // determinístico por el redondeo de la última línea, que absorbe el resto).
    const items = [
      { item_name: 'Remera Aura - MiMarca', quantity: 1, unit_price: 20000 },
      { item_name: 'Remera Aura - MiMarca 2', quantity: 1, unit_price: 20000 },
    ]
    const products = [
      { name: 'Remera Aura', category: null, metadata: { garmentKey: 'aura-oversize-tshirt' } },
      { name: 'Remera Aura 2', category: null, metadata: { garmentKey: 'aura-oversize-tshirt' } },
    ]
    // Sin descuento: ganancia por línea = 10000 c/u → margin 20000.
    const sinDescuento = computeOrderMargin(items, products, 'starter')
    expect(sinDescuento.margin).toBe(20000)

    const conDescuento = computeOrderMargin(items, products, 'starter', { discountARS: 3000 })
    const sumaDescuentos = conDescuento.breakdown.reduce((s, l) => s + l.descuento, 0)
    expect(sumaDescuentos).toBe(3000) // el prorrateo suma EXACTO el descuento (sin perder centavos por redondeo)
    expect(conDescuento.margin).toBe(20000 - 3000)
  })
})

describe('matchProduct', () => {
  const products = [
    { id: '7896eb69-0000-4000-8000-000000000001', name: 'Club', category: null, metadata: {} },
    { id: '5239d5d6-0000-4000-8000-000000000002', name: 'Club ROSARIO', category: null, metadata: {} },
  ]

  it('matchea por partner_product_id (columna)', () => {
    const item = { partner_product_id: '5239d5d6-0000-4000-8000-000000000002', item_name: 'lo que sea' }
    expect(matchProduct(item, products)?.id).toBe('5239d5d6-0000-4000-8000-000000000002')
  })

  it('matchea por el prefijo UUID de metadata.itemId cuando no hay columna', () => {
    const item = { metadata: { itemId: '7896eb69-0000-4000-8000-000000000001-L-def-1758845000000' } }
    expect(partnerProductIdDeItem(item)).toBe('7896eb69-0000-4000-8000-000000000001')
    expect(matchProduct(item, products)?.id).toBe('7896eb69-0000-4000-8000-000000000001')
  })

  it('matchea por nombre (legacy) — gana el nombre más largo entre los que prefijan el item_name', () => {
    const item = { item_name: 'Club ROSARIO — Sponsors' }
    expect(matchProduct(item, products)?.name).toBe('Club ROSARIO')
  })
})

describe('planOrderCredits / creditOrderMargin (con supabase mockeado)', () => {
  const TENANT_A = 'tenant-aaaaaaaa-0000-0000-0000-000000000000'
  const TENANT_B = 'tenant-bbbbbbbb-0000-0000-0000-000000000000'
  const PRODUCT_A = 'aaaaaaaa-0000-4000-8000-000000000001'
  const PRODUCT_B = 'bbbbbbbb-0000-4000-8000-000000000002'

  it('carrito mixto (tenant A + tenant B + ítem propio de Novamente): 2 créditos y el ítem propio en excluded', async () => {
    h.state.productsById.push({
      data: [
        { id: PRODUCT_A, tenant_id: TENANT_A, name: 'Producto A', category: null, metadata: { garmentKey: 'aura-oversize-tshirt' } },
        { id: PRODUCT_B, tenant_id: TENANT_B, name: 'Producto B', category: null, metadata: { garmentKey: 'aura-oversize-tshirt' } },
      ],
      error: null,
    })
    h.state.productsByTenant.push({ data: [], error: null })
    h.state.tenants.push({ data: [{ id: TENANT_A, plan: 'starter' }, { id: TENANT_B, plan: 'starter' }], error: null })
    h.state.ledgerInsertResults.push({ data: { id: 'e1' }, error: null }, { data: { id: 'e2' }, error: null })

    const order = {
      id: 'order-mixto',
      tenant_id: TENANT_A,
      order_number: 'NOV-MIX',
      items: [
        { id: 'item-a', item_name: 'Item A', quantity: 1, unit_price: 30000, partner_product_id: PRODUCT_A },
        { id: 'item-b', item_name: 'Item B', quantity: 1, unit_price: 30000, partner_product_id: PRODUCT_B },
        { id: 'item-propio', item_name: 'Prenda propia /crear', quantity: 1, unit_price: 55000 },
      ],
      metadata: {},
    }

    const result = await creditOrderMargin(order)

    expect(result.excluded).toEqual([{ item: 'Prenda propia /crear', order_item_id: 'item-propio' }])
    expect(result.credits).toHaveLength(2)
    expect(h.state.ledgerInsertCalls).toHaveLength(2)

    const byTenant = Object.fromEntries(h.state.ledgerInsertCalls.map((c) => [c.tenant_id, c]))
    expect(byTenant[TENANT_A]).toMatchObject({ tenant_id: TENANT_A, order_id: 'order-mixto', source: 'web_order', type: 'credit', amount: 20000, status: 'confirmed' })
    expect(byTenant[TENANT_B]).toMatchObject({ tenant_id: TENANT_B, order_id: 'order-mixto', source: 'web_order', type: 'credit', amount: 20000, status: 'confirmed' })
    expect(byTenant[TENANT_A].metadata.breakdown).toBeInstanceOf(Array)
  })

  it('amount de creditOrderMargin = max(0, margin): una línea bajo costo con ganancia negativa acredita 0, no negativo', async () => {
    h.state.productsById.push({ data: [], error: null })
    h.state.productsByTenant.push({
      data: [{ id: PRODUCT_A, tenant_id: TENANT_A, name: 'Producto A', category: null, metadata: { garmentKey: 'aura-oversize-tshirt' } }],
      error: null,
    })
    h.state.tenants.push({ data: [{ id: TENANT_A, plan: 'starter' }], error: null })
    h.state.ledgerInsertResults.push({ data: { id: 'e1' }, error: null })

    const order = {
      id: 'order-bajo-costo',
      tenant_id: TENANT_A,
      order_number: 'NOV-LOW',
      items: [{ id: 'item-a', item_name: 'Producto A', quantity: 1, unit_price: 3000, partner_product_id: PRODUCT_A }], // < costo 10000
      metadata: {},
    }

    const result = await creditOrderMargin(order)

    expect(result.credits[0].computed).toBe(-7000) // ganancia real, sin clampear
    expect(result.credits[0].amount).toBe(0) // pero lo acreditado nunca es negativo
    expect(result.credits[0].needsReview).toBe(true)
    expect(h.state.ledgerInsertCalls[0].amount).toBe(0)
    expect(h.state.ledgerInsertCalls[0].status).toBe('needs_review')
  })

  it('error 23505 (unique violation) al insertar → alreadyExisted true, no tira, no lo reporta como error', async () => {
    h.state.productsById.push({ data: [], error: null })
    h.state.productsByTenant.push({
      data: [{ id: PRODUCT_A, tenant_id: TENANT_A, name: 'Producto A', category: null, metadata: { garmentKey: 'aura-oversize-tshirt' } }],
      error: null,
    })
    h.state.tenants.push({ data: [{ id: TENANT_A, plan: 'starter' }], error: null })
    h.state.ledgerInsertResults.push({ data: null, error: { code: '23505', message: 'duplicate key' } })

    const order = {
      id: 'order-dup-2',
      tenant_id: TENANT_A,
      order_number: 'NOV-DUP2',
      items: [{ id: 'item-a', item_name: 'Producto A', quantity: 1, unit_price: 30000, partner_product_id: PRODUCT_A }],
      metadata: {},
    }

    const result = await creditOrderMargin(order)
    expect(result.credits[0].alreadyExisted).toBe(true)
    expect(result.credits[0].inserted).toBe(false)
    expect(result.credits[0].error).toBeUndefined()
  })

  it('descuento con discount_code_id → se asigna al tenant DUEÑO DEL CÓDIGO (lookup en partner_discount_codes), no al tenant del pedido', async () => {
    h.state.productsById.push({
      data: [{ id: PRODUCT_A, tenant_id: TENANT_A, name: 'Producto A', category: null, metadata: { garmentKey: 'aura-oversize-tshirt' } }],
      error: null,
    })
    h.state.productsByTenant.push({ data: [], error: null })
    h.state.discountCode.push({ data: { tenant_id: TENANT_B }, error: null })
    h.state.tenants.push({ data: [{ id: TENANT_A, plan: 'starter' }, { id: TENANT_B, plan: 'starter' }], error: null })
    h.state.ledgerInsertResults.push({ data: { id: 'e1' }, error: null }, { data: { id: 'e2' }, error: null })

    const order = {
      id: 'order-discount',
      tenant_id: TENANT_A, // el pedido es en la tienda de A
      order_number: 'NOV-DISC',
      items: [{ id: 'item-a', item_name: 'Producto A', quantity: 1, unit_price: 30000, partner_product_id: PRODUCT_A }],
      metadata: { discount_ars: 1000, discount_code_id: 'code-de-B' },
    }

    const { credits } = await planOrderCredits(order)
    const creditoB = credits.find((c) => c.tenantId === TENANT_B)
    expect(creditoB).toBeTruthy() // se creó un grupo para B aunque no tenga ítems propios
    expect(creditoB!.descuento).toBe(1000)
    expect(creditoB!.reasons).toContain('descuento_sin_items_propios')

    const creditoA = credits.find((c) => c.tenantId === TENANT_A)
    expect(creditoA!.descuento).toBe(0) // el descuento es del código de B, no toca a A
  })

  it('orden con tenant_id pero sin ningún ítem reconocible → entry needs_review, amount 0, reason sin_items_de_partner', async () => {
    h.state.productsById.push({ data: [], error: null })
    h.state.productsByTenant.push({ data: [], error: null }) // ningún producto de ese tenant matchea
    h.state.tenants.push({ data: [{ id: TENANT_A, plan: 'starter' }], error: null })

    const order = {
      id: 'order-sin-items',
      tenant_id: TENANT_A,
      order_number: 'NOV-EMPTY',
      items: [{ id: 'item-x', item_name: 'Algo que no matchea ningún producto', quantity: 1, unit_price: 30000 }],
      metadata: {},
    }

    const { credits, excluded } = await planOrderCredits(order)
    expect(excluded).toEqual([{ item: 'Algo que no matchea ningún producto', order_item_id: 'item-x' }])
    expect(credits).toHaveLength(1)
    expect(credits[0]).toMatchObject({ tenantId: TENANT_A, amount: 0, needsReview: true })
    expect(credits[0].reasons).toContain('sin_items_de_partner')
  })
})

describe('reverseOrderMargin', () => {
  const order = { id: 'order-1', tenant_id: 'tenant-1', order_number: 'NM-001' }

  it('inserta un debit compensatorio por CADA tenant con credit confirmado previo', async () => {
    h.state.ledgerSelects.push({ data: [{ id: 'credit-1', tenant_id: 'tenant-1', amount: 20000 }], error: null }) // credits
    h.state.ledgerSelects.push({ data: [], error: null }) // reversals previos (ninguno)
    h.state.ledgerInsertResults.push({ data: { id: 'debit-1' }, error: null })

    const result = await reverseOrderMargin(order)

    expect(result.reversed).toBe(true)
    expect(result.amount).toBe(20000)
    expect(h.state.ledgerInsertCalls).toHaveLength(1)
    expect(h.state.ledgerInsertCalls[0]).toMatchObject({
      tenant_id: 'tenant-1',
      order_id: 'order-1',
      source: 'order_refund',
      type: 'debit',
      amount: 20000,
      status: 'confirmed',
    })
  })

  it('salta los tenants que YA tienen un reverso (idempotente por tenant)', async () => {
    h.state.ledgerSelects.push({
      data: [
        { id: 'credit-1', tenant_id: 'tenant-1', amount: 20000 },
        { id: 'credit-2', tenant_id: 'tenant-2', amount: 5000 },
      ],
      error: null,
    })
    h.state.ledgerSelects.push({ data: [{ tenant_id: 'tenant-1' }], error: null }) // tenant-1 ya revertido
    h.state.ledgerInsertResults.push({ data: { id: 'debit-2' }, error: null })

    const result = await reverseOrderMargin(order)

    expect(result.reversed).toBe(true)
    expect(result.amount).toBe(5000) // solo tenant-2
    expect(h.state.ledgerInsertCalls).toHaveLength(1)
    expect(h.state.ledgerInsertCalls[0].tenant_id).toBe('tenant-2')
  })

  it('no hace nada si no existe ningún credit confirmado previo', async () => {
    h.state.ledgerSelects.push({ data: [], error: null }) // sin créditos confirmados

    const result = await reverseOrderMargin(order)

    expect(result.reversed).toBe(false)
    expect(result.amount).toBe(0)
    expect(h.state.ledgerInsertCalls).toHaveLength(0)
  })
})
