import { describe, it, expect, vi } from 'vitest'

// partner-cost.ts importa garment-pricing.server.ts, cuya primera línea es
// `import 'server-only'` — ese paquete TIRA si se evalúa fuera de una build
// server de Next (ver garment-pricing.server.test.ts). Bajo vitest no hay
// condición `react-server`, así que el import real revienta. Solo stubeamos
// el marker package (no el pricing): estos tests quieren el PRICING REAL de
// garment-pricing-data.ts, no un mock de getPartnerPlanPrice.
vi.mock('server-only', () => ({}))

import {
  esDobleEstampa,
  esDobleEstampaItem,
  claseEstampaProveedor,
  costoPartnerUnitario,
  resolvePartnerGarmentKey,
} from './partner-cost'
import { ALL_GARMENT_PRICING } from './garment-pricing.server'

describe('esDobleEstampa (metadata de partner_products)', () => {
  it('front + back → true', () => {
    const meta = { print: { front: { designUrl: 'https://x/f.png' }, back: { designUrl: 'https://x/b.png' } } }
    expect(esDobleEstampa(meta)).toBe(true)
  })

  it('solo un lado → false', () => {
    expect(esDobleEstampa({ print: { front: { designUrl: 'https://x/f.png' } } })).toBe(false)
    expect(esDobleEstampa({ print: { back: { designUrl: 'https://x/b.png' } } })).toBe(false)
  })

  it('legacy print_ready_url + print_side "dorso" combinado con print.front → true', () => {
    const meta = {
      print: { front: { designUrl: 'https://x/f.png' } },
      print_ready_url: 'https://x/legacy-back.png',
      print_side: 'dorso',
    }
    expect(esDobleEstampa(meta)).toBe(true)
  })
})

describe('esDobleEstampaItem (lo que va a producción de UN ítem vendido)', () => {
  it('metadata.doble_estampa boolean del ítem gana sobre todo lo demás', () => {
    const productoDoble = { print: { front: { designUrl: 'f' }, back: { designUrl: 'b' } } }
    expect(esDobleEstampaItem({ metadata: { doble_estampa: false } }, productoDoble)).toBe(false)
    expect(esDobleEstampaItem({ metadata: { doble_estampa: true } }, {})).toBe(true)
  })

  it('si el ítem tiene arte (front/back_design_url), manda el ítem aunque el producto sea doble', () => {
    const productoDoble = { print: { front: { designUrl: 'f' }, back: { designUrl: 'b' } } }
    const item = { front_design_url: 'https://x/solo-frente.png', back_design_url: null }
    expect(esDobleEstampaItem(item, productoDoble)).toBe(false)
  })

  it('si el ítem tiene arte vía metadata.print_front/print_back, también manda el ítem', () => {
    const productoDoble = { print: { front: { designUrl: 'f' }, back: { designUrl: 'b' } } }
    const item = { metadata: { print_front: { designUrl: 'https://x/f.png' } } } // sin print_back
    expect(esDobleEstampaItem(item, productoDoble)).toBe(false)
  })

  it('sin ningún dato de arte en el ítem, cae a la metadata del producto', () => {
    const productoDoble = { print: { front: { designUrl: 'f' }, back: { designUrl: 'b' } } }
    const productoSimple = { print: { front: { designUrl: 'f' } } }
    expect(esDobleEstampaItem({}, productoDoble)).toBe(true)
    expect(esDobleEstampaItem({}, productoSimple)).toBe(false)
  })
})

describe('claseEstampaProveedor (solo etiqueta interna de tamaño, NUNCA el costo del proveedor)', () => {
  it('prenda simple (no doble) → "No"', () => {
    const item = { metadata: { print_front: { designUrl: 'f' } } } // sin back → no es doble
    expect(claseEstampaProveedor(item, {})).toBe('No')
  })

  it('nuca en cualquiera de los dos lados → "Chica" aunque el otro lado sea grande', () => {
    const item = {
      metadata: {
        print_front: { designUrl: 'f', widthCm: 30 },
        print_back: { designUrl: 'b', placement: 'nuca' },
      },
    }
    expect(claseEstampaProveedor(item, {})).toBe('Chica')
  })

  it('chest-logo → "Chica"', () => {
    const item = {
      metadata: {
        print_front: { designUrl: 'f', stampMode: 'chest-logo' },
        print_back: { designUrl: 'b', widthCm: 30 },
      },
    }
    expect(claseEstampaProveedor(item, {})).toBe('Chica')
  })

  it('ancho ≤ 12cm → "Chica"', () => {
    const item = {
      metadata: {
        print_front: { designUrl: 'f', widthCm: 30 },
        print_back: { designUrl: 'b', widthCm: 12 },
      },
    }
    expect(claseEstampaProveedor(item, {})).toBe('Chica')
  })

  it('dos estampas grandes (sin nuca/chest-logo/≤12cm) → "Si"', () => {
    const item = {
      metadata: {
        print_front: { designUrl: 'f', widthCm: 30 },
        print_back: { designUrl: 'b', widthCm: 25 },
      },
    }
    expect(claseEstampaProveedor(item, {})).toBe('Si')
  })
})

describe('resolvePartnerGarmentKey', () => {
  it('usa metadata.garmentKey cuando existe en el catálogo', () => {
    const r = resolvePartnerGarmentKey({ garmentKey: 'buzo-hoodie-unisex' })
    expect(r).toEqual({ garmentKey: 'buzo-hoodie-unisex', via: 'garmentKey:buzo-hoodie-unisex' })
  })

  it('cae a la heurística sobre los fallbacks si garmentKey no existe en el catálogo', () => {
    const r = resolvePartnerGarmentKey({ garmentKey: 'no-existe' }, ['Buzo Hoodie Oversize Vintage'])
    expect(r.garmentKey).toBe('buzo-hoodie-unisex')
    expect(r.via).toBe('guess:buzo-hoodie-unisex')
  })

  it('sin garmentKey ni fallback resoluble → unresolved', () => {
    expect(resolvePartnerGarmentKey({}, ['???'])).toEqual({ garmentKey: null, via: 'unresolved' })
  })
})

describe('costoPartnerUnitario — PRICING REAL (garment-pricing-data.ts, sin mockear)', () => {
  it('buzo-hoodie-unisex starter simple: base 38700, total 38700', () => {
    expect(ALL_GARMENT_PRICING['buzo-hoodie-unisex'].on_demand).toBe(38700) // sanity: el fixture sigue vigente
    const r = costoPartnerUnitario({ metadata: { garmentKey: 'buzo-hoodie-unisex' }, plan: 'starter', doble: false })
    expect(r).toMatchObject({ garmentKey: 'buzo-hoodie-unisex', base: 38700, recargoDoble: 0, total: 38700 })
  })

  it('buzo-hoodie-unisex starter doble: total 42200 (+$3.500, no es tote)', () => {
    const r = costoPartnerUnitario({ metadata: { garmentKey: 'buzo-hoodie-unisex' }, plan: 'starter', doble: true })
    expect(r).toMatchObject({ base: 38700, recargoDoble: 3500, total: 42200 })
  })

  it('totebag starter doble: recargo $5.000 (tote), no $3.500', () => {
    expect(ALL_GARMENT_PRICING['totebag']).toBeTruthy() // sanity: la key existe en el catálogo
    const simple = costoPartnerUnitario({ metadata: { garmentKey: 'totebag' }, plan: 'starter', doble: false })
    const doble = costoPartnerUnitario({ metadata: { garmentKey: 'totebag' }, plan: 'starter', doble: true })
    expect(simple?.total).toBe(ALL_GARMENT_PRICING['totebag'].on_demand)
    expect(doble!.recargoDoble).toBe(5000)
    expect(doble!.total).toBe(ALL_GARMENT_PRICING['totebag'].on_demand + 5000)
  })

  it('garmentKey inválido + metadata.cost_partner explícito doble → total = cost_partner + 3500, via metadata.cost', () => {
    const r = costoPartnerUnitario({
      metadata: { garmentKey: 'no-existe-en-catalogo', cost_partner: 20000 },
      plan: 'starter',
      doble: true,
    })
    expect(r).toMatchObject({ garmentKey: null, base: 20000, recargoDoble: 3500, total: 23500, via: 'metadata.cost' })
  })

  it('garmentKey válido gana SIEMPRE sobre un cost_partner declarado bajo (anti-inflado de margen)', () => {
    const r = costoPartnerUnitario({
      metadata: { garmentKey: 'buzo-hoodie-unisex', cost_partner: 100 },
      plan: 'starter',
      doble: false,
    })
    expect(r).toMatchObject({ base: 38700, total: 38700, via: 'garmentKey:buzo-hoodie-unisex' })
  })

  it('sin garmentKey resoluble ni cost_partner válido → null', () => {
    expect(costoPartnerUnitario({ metadata: {}, plan: 'starter', doble: false })).toBeNull()
  })
})
