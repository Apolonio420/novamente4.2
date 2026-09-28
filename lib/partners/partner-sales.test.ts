import { describe, it, expect } from 'vitest'
import { buildPartnerSales, saleLinesForPartner, type LedgerEntryForSales } from './partner-sales'

function entry(overrides: Partial<LedgerEntryForSales> & { id: string; created_at: string }): LedgerEntryForSales {
  return {
    type: 'credit',
    amount: 0,
    status: 'confirmed',
    source: 'web_order',
    order_id: null,
    metadata: null,
    ...overrides,
  }
}

function venta(id: string, amount: number, created_at: string, extra: Partial<LedgerEntryForSales> = {}) {
  return entry({
    id,
    type: 'credit',
    source: 'web_order',
    amount,
    created_at,
    order_id: `order-${id}`,
    metadata: { order_number: `NOV-${id}`, breakdown: [] },
    ...extra,
  })
}

describe('saleLinesForPartner — whitelist', () => {
  it('copia solo los campos partner-safe y descarta todo lo demás (clase_estampa, via, bajo_costo, product_id, order_item_id, garment_key)', () => {
    const breakdown = [
      {
        item: 'Remera Aura',
        qty: 2,
        unit: 15000,
        color: 'negro',
        talle: 'M',
        doble_estampa: true,
        costo_base: 8000,
        recargo_doble: 1500,
        cost: 9500,
        descuento: 500,
        ganancia: 5000,
        // Campos internos que NUNCA deben llegar al partner:
        clase_estampa: 'dtg-premium',
        via: 'dreamful',
        bajo_costo: true,
        product_id: 'prod-123',
        order_item_id: 'item-abc',
        garment_key: 'aura-oversize-tshirt',
      },
    ]
    const lines = saleLinesForPartner(breakdown)
    expect(lines).toHaveLength(1)
    const l = lines[0] as unknown as Record<string, unknown>
    expect(l).not.toHaveProperty('clase_estampa')
    expect(l).not.toHaveProperty('via')
    expect(l).not.toHaveProperty('bajo_costo')
    expect(l).not.toHaveProperty('product_id')
    expect(l).not.toHaveProperty('order_item_id')
    expect(l).not.toHaveProperty('garment_key')
    expect(Object.keys(l).sort()).toEqual(
      ['item', 'qty', 'unit', 'color', 'talle', 'doble_estampa', 'costo_base', 'recargo_doble', 'cost', 'descuento', 'ganancia'].sort(),
    )
    expect(l).toMatchObject({
      item: 'Remera Aura',
      qty: 2,
      unit: 15000,
      color: 'negro',
      talle: 'M',
      doble_estampa: true,
      costo_base: 8000,
      recargo_doble: 1500,
      cost: 9500,
      descuento: 500,
      ganancia: 5000,
    })
  })

  it('breakdown no-array → []', () => {
    expect(saleLinesForPartner(null)).toEqual([])
    expect(saleLinesForPartner(undefined)).toEqual([])
    expect(saleLinesForPartner({})).toEqual([])
  })

  it('valores faltantes/raros caen a defaults seguros', () => {
    const [l] = saleLinesForPartner([{}])
    expect(l).toMatchObject({
      item: 'Producto',
      qty: 1,
      unit: 0,
      color: null,
      talle: null,
      doble_estampa: false,
      costo_base: null,
      recargo_doble: 0,
      cost: null,
      descuento: 0,
      ganancia: null,
    })
  })
})

describe('buildPartnerSales — FIFO', () => {
  it("crédito 16800 + débito 'credit_applied' 16800 → venta 'pagado' por el total", () => {
    const entries: LedgerEntryForSales[] = [
      venta('1', 16800, '2026-01-01T00:00:00Z'),
      entry({ id: 'd1', type: 'debit', source: 'credit_applied', amount: 16800, created_at: '2026-01-02T00:00:00Z' }),
    ]
    const [sale] = buildPartnerSales(entries)
    expect(sale).toMatchObject({ estado: 'pagado', pagado: 16800, ganancia: 16800 })
  })

  it("crédito 16800 + débito 'payout' 10000 → 'parcial', pagado 10000", () => {
    const entries: LedgerEntryForSales[] = [
      venta('1', 16800, '2026-01-01T00:00:00Z'),
      entry({ id: 'd1', type: 'debit', source: 'payout', amount: 10000, created_at: '2026-01-02T00:00:00Z' }),
    ]
    const [sale] = buildPartnerSales(entries)
    expect(sale).toMatchObject({ estado: 'parcial', pagado: 10000, ganancia: 16800 })
  })

  it('sin ningún pago → a_cobrar', () => {
    const entries: LedgerEntryForSales[] = [venta('1', 5000, '2026-01-01T00:00:00Z')]
    const [sale] = buildPartnerSales(entries)
    expect(sale).toMatchObject({ estado: 'a_cobrar', pagado: 0 })
  })

  it("un 'payout_reversal' le devuelve el pool: una venta ya pagada vuelve a quedar a_cobrar", () => {
    const entries: LedgerEntryForSales[] = [
      venta('1', 10000, '2026-01-01T00:00:00Z'),
      entry({ id: 'd1', type: 'debit', source: 'payout', amount: 10000, created_at: '2026-01-02T00:00:00Z' }),
      entry({ id: 'r1', type: 'credit', source: 'payout_reversal', amount: 10000, created_at: '2026-01-03T00:00:00Z' }),
    ]
    const [sale] = buildPartnerSales(entries)
    expect(sale).toMatchObject({ estado: 'a_cobrar', pagado: 0 })
  })

  it("un 'payout_reversal' parcial reduce el pool disponible para el FIFO", () => {
    const entries: LedgerEntryForSales[] = [
      venta('1', 10000, '2026-01-01T00:00:00Z'),
      entry({ id: 'd1', type: 'debit', source: 'payout', amount: 10000, created_at: '2026-01-02T00:00:00Z' }),
      entry({ id: 'r1', type: 'credit', source: 'payout_reversal', amount: 4000, created_at: '2026-01-03T00:00:00Z' }),
    ]
    const [sale] = buildPartnerSales(entries)
    // pool efectivo = 10000 - 4000 = 6000 < 10000 → parcial
    expect(sale).toMatchObject({ estado: 'parcial', pagado: 6000 })
  })

  it("status 'needs_review' → en_revision (independiente del pool)", () => {
    const entries: LedgerEntryForSales[] = [
      venta('1', 5000, '2026-01-01T00:00:00Z', { status: 'needs_review' }),
      entry({ id: 'd1', type: 'debit', source: 'payout', amount: 5000, created_at: '2026-01-02T00:00:00Z' }),
    ]
    const [sale] = buildPartnerSales(entries)
    expect(sale.estado).toBe('en_revision')
    expect(sale.pagado).toBe(0)
  })

  it('venta con reverso order_refund del mismo order_id → reembolsada', () => {
    const entries: LedgerEntryForSales[] = [
      venta('1', 5000, '2026-01-01T00:00:00Z', { order_id: 'order-1' }),
      entry({ id: 'ref1', type: 'debit', source: 'order_refund', order_id: 'order-1', amount: 5000, created_at: '2026-01-02T00:00:00Z' }),
    ]
    const [sale] = buildPartnerSales(entries)
    expect(sale.estado).toBe('reembolsada')
  })

  it('reembolsada consume del pool si había algo pagado antes del reverso', () => {
    const entries: LedgerEntryForSales[] = [
      venta('1', 5000, '2026-01-01T00:00:00Z', { order_id: 'order-1' }),
      entry({ id: 'd1', type: 'debit', source: 'payout', amount: 3000, created_at: '2026-01-02T00:00:00Z' }),
      entry({ id: 'ref1', type: 'debit', source: 'order_refund', order_id: 'order-1', amount: 5000, created_at: '2026-01-03T00:00:00Z' }),
    ]
    const [sale] = buildPartnerSales(entries)
    expect(sale).toMatchObject({ estado: 'reembolsada', pagado: 3000 })
  })

  it('needs_review tiene prioridad sobre reembolsada cuando coinciden', () => {
    const entries: LedgerEntryForSales[] = [
      venta('1', 5000, '2026-01-01T00:00:00Z', { order_id: 'order-1', status: 'needs_review' }),
      entry({ id: 'ref1', type: 'debit', source: 'order_refund', order_id: 'order-1', amount: 5000, created_at: '2026-01-02T00:00:00Z' }),
    ]
    const [sale] = buildPartnerSales(entries)
    expect(sale.estado).toBe('en_revision')
  })

  it('orden de salida: la venta más nueva primero', () => {
    const entries: LedgerEntryForSales[] = [
      venta('1', 1000, '2026-01-01T00:00:00Z'),
      venta('2', 2000, '2026-01-02T00:00:00Z'),
      venta('3', 3000, '2026-01-03T00:00:00Z'),
    ]
    const sales = buildPartnerSales(entries)
    expect(sales.map((s) => s.id)).toEqual(['3', '2', '1'])
  })

  it('FIFO paga primero la venta más vieja, no la de mayor monto', () => {
    const entries: LedgerEntryForSales[] = [
      venta('1', 5000, '2026-01-01T00:00:00Z'),
      venta('2', 8000, '2026-01-02T00:00:00Z'),
      entry({ id: 'd1', type: 'debit', source: 'payout', amount: 5000, created_at: '2026-01-03T00:00:00Z' }),
    ]
    const sales = buildPartnerSales(entries)
    const byId = Object.fromEntries(sales.map((s) => [s.id, s]))
    expect(byId['1']).toMatchObject({ estado: 'pagado', pagado: 5000 })
    expect(byId['2']).toMatchObject({ estado: 'a_cobrar', pagado: 0 })
  })

  it('pvp, costo, descuento y ganancia se calculan desde las líneas del desglose', () => {
    const entries: LedgerEntryForSales[] = [
      entry({
        id: '1',
        type: 'credit',
        source: 'web_order',
        amount: 10000,
        created_at: '2026-01-01T00:00:00Z',
        order_id: 'order-1',
        metadata: {
          order_number: 'NOV-1',
          breakdown: [
            { item: 'Remera', qty: 2, unit: 15000, cost: 8000, descuento: 500, ganancia: 5000 },
          ],
        },
      }),
    ]
    const [sale] = buildPartnerSales(entries)
    expect(sale.pvp).toBe(30000) // unit*qty
    expect(sale.costo).toBe(16000) // cost*qty
    expect(sale.descuento).toBe(500)
    expect(sale.orderNumber).toBe('NOV-1')
  })

  it('costo es null si alguna línea no tiene cost', () => {
    const entries: LedgerEntryForSales[] = [
      entry({
        id: '1',
        type: 'credit',
        source: 'web_order',
        amount: 10000,
        created_at: '2026-01-01T00:00:00Z',
        metadata: { breakdown: [{ item: 'A', qty: 1, unit: 1000, cost: 500 }, { item: 'B', qty: 1, unit: 1000 }] },
      }),
    ]
    const [sale] = buildPartnerSales(entries)
    expect(sale.costo).toBeNull()
  })

  it('ignora entradas que no son créditos web_order (otros source/type no generan una venta)', () => {
    const entries: LedgerEntryForSales[] = [
      entry({ id: 'd1', type: 'debit', source: 'payout', amount: 1000, created_at: '2026-01-01T00:00:00Z' }),
      entry({ id: 'a1', type: 'credit', source: 'adjustment', amount: 1000, created_at: '2026-01-02T00:00:00Z' }),
    ]
    expect(buildPartnerSales(entries)).toEqual([])
  })
})
