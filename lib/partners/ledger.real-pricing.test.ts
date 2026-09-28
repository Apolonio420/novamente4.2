import { describe, it, expect, vi } from 'vitest'

// computeOrderMargin no toca supabase (es pura), pero ledger.ts importa
// partner-cost.ts → garment-pricing.server.ts, cuya primera línea es
// `import 'server-only'`, que tira fuera de una build server de Next. Este
// archivo quiere el PRICING REAL (garment-pricing-data.ts), así que NO se
// mockea './garment-pricing.server' como hace lib/partners/ledger.test.ts —
// solo se neutraliza el marker package.
vi.mock('server-only', () => ({}))

import { computeOrderMargin } from './ledger'

// Caso real NOV-20260926-9852 (Sponsors) — la transferencia confirmada por
// link nunca había acreditado nada al partner porque el checkout de
// transferencia no guardaba partner_product_id (27/09/2026). Reconstruido con
// los ids/metadata reales del pedido; ambos ítems resuelven por el prefijo
// UUID de metadata.itemId (partner_product_id llega NULL, como en ese pedido).
describe('computeOrderMargin — caso real NOV-20260926-9852, PRICING REAL sin mockear', () => {
  const items = [
    {
      id: '20ddfdb8-d190-48e6-8dad-52f575471269',
      item_name: 'Buzo Hoodie Oversize CARC vintage — Sponsors',
      product_color: 'Blanco',
      product_size: 'L',
      quantity: 1,
      unit_price: 48700,
      partner_product_id: null,
      front_design_url: 'https://x/carc-frente.png',
      back_design_url: null,
      metadata: {
        itemId: '7896eb69-0000-4000-8000-000000000001-L-def-1758845000000',
        print_back: null,
      },
    },
    {
      id: '8b78d92f-7cd7-4229-9b4b-1640faba0fea',
      item_name: 'Club ROSARIO — Sponsors',
      product_color: 'Negro',
      product_size: 'L',
      quantity: 1,
      unit_price: 49000,
      partner_product_id: null,
      front_design_url: 'https://x/rosario-frente.png',
      back_design_url: 'https://x/rosario-nuca.png',
      metadata: {
        itemId: '5239d5d6-0000-4000-8000-000000000002-L-def-1758845000001',
        print_back: { widthCm: 7, placement: 'nuca', stampMode: 'chest-logo', designUrl: 'https://x/rosario-nuca.png' },
      },
    },
  ]

  const products = [
    {
      id: '7896eb69-0000-4000-8000-000000000001',
      tenant_id: 'b3de2939-3e5f-4c5b-b1f2-b1cbdeeb9a3b',
      name: 'Buzo Hoodie Oversize CARC vintage',
      category: 'Buzo Hoodie Oversize',
      metadata: {
        garmentKey: 'buzo-hoodie-unisex',
        print_side: 'frente',
        print: { front: { designUrl: 'https://x/carc-frente.png' } },
      },
    },
    {
      id: '5239d5d6-0000-4000-8000-000000000002',
      tenant_id: 'b3de2939-3e5f-4c5b-b1f2-b1cbdeeb9a3b',
      name: 'Club ROSARIO',
      category: 'Buzo Hoodie Oversize',
      metadata: {
        garmentKey: 'buzo-hoodie-unisex',
        dualSide: true,
        print: {
          front: { placement: 'center', designUrl: 'https://x/rosario-frente.png' },
          back: { widthCm: 7, placement: 'nuca', stampMode: 'chest-logo', designUrl: 'https://x/rosario-nuca.png' },
        },
      },
    },
  ]

  it('margin 16800, needsReview false, y el desglose por línea coincide exacto', () => {
    const result = computeOrderMargin(items, products, 'starter')

    expect(result.needsReview).toBe(false)
    expect(result.margin).toBe(16800)
    expect(result.breakdown).toHaveLength(2)

    expect(result.breakdown[0]).toMatchObject({
      order_item_id: '20ddfdb8-d190-48e6-8dad-52f575471269',
      product_id: '7896eb69-0000-4000-8000-000000000001',
      unit: 48700,
      doble_estampa: false,
      costo_base: 38700,
      recargo_doble: 0,
      cost: 38700,
      ganancia: 10000,
      clase_estampa: 'No',
    })

    expect(result.breakdown[1]).toMatchObject({
      order_item_id: '8b78d92f-7cd7-4229-9b4b-1640faba0fea',
      product_id: '5239d5d6-0000-4000-8000-000000000002',
      unit: 49000,
      doble_estampa: true,
      costo_base: 38700,
      recargo_doble: 3500,
      cost: 42200,
      ganancia: 6800,
      clase_estampa: 'Chica',
    })
  })

  it('el breakdown NUNCA lleva costo del proveedor ni margen de Novamente (solo se le muestra al partner)', () => {
    const result = computeOrderMargin(items, products, 'starter')
    const serialized = JSON.stringify(result.breakdown).toLowerCase()
    for (const forbidden of ['dreamful', 'supplier', 'cost_1_print', 'cost_2_print', 'cost_chica', 'margen_novamente']) {
      expect(serialized).not.toContain(forbidden)
    }
  })
})
