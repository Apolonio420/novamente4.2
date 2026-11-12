/**
 * Black Friday 2026 en la web (/crear): hasta 10 % OFF minorista 1-4 prendas,
 * 27/11 00:00 → 30/11 23:59 hora de Argentina. Decisión 12/11/2026.
 * Bordes de fecha en ART, 4 contra 5, partner, Bali, tote, carrito que cruza
 * la medianoche y la regla del servidor (validarPrecios).
 */
import { describe, it, expect, vi, afterEach } from 'vitest'

vi.mock('@/lib/supabase-admin', () => ({
  supabaseAdmin: {
    from: () => ({ select: () => ({ eq: () => ({ single: async () => ({ data: { price: 30000, metadata: {}, tenant_id: null }, error: null }) }) }) }),
  },
}))

vi.mock('@/lib/partners/garment-pricing.server', () => ({
  ALL_GARMENT_PRICING: { 'aura-oversize-tshirt': {} },
  getPartnerPlanPrice: () => 10000,
}))

import {
  BF_2026_PRICES,
  isBf2026Window,
  bf2026PriceFor,
  bf2026DisplayPrice,
  bf2026CartGarments,
  aplicarBf2026,
  carritoConBf2026,
  precioListaPrendaPropia,
  getActiveOffers,
} from '@/lib/offers'
import { CATALOG_PRODUCTS, getCatalogProduct } from '@/lib/catalog/products'
import { validarPrecios } from '@/lib/checkout/precio-real'

const T = {
  antes: Date.parse('2026-11-26T23:59:59-03:00'),
  inicio: Date.parse('2026-11-27T00:00:00-03:00'),
  medio: Date.parse('2026-11-28T15:00:00-03:00'),
  fin: Date.parse('2026-11-30T23:59:59-03:00'),
  despues: Date.parse('2026-12-01T00:00:00-03:00'),
}
const AURA = 'aura-oversize-tshirt'
const prenda = (garmentType: string, quantity = 1, extra: Record<string, unknown> = {}) => ({ garmentType, quantity, ...extra })

afterEach(() => vi.useRealTimers())

describe('ventana en hora de Argentina', () => {
  it.each([
    ['26/11 23:59:59', T.antes, false],
    ['27/11 00:00', T.inicio, true],
    ['30/11 23:59:59', T.fin, true],
    ['01/12 00:00', T.despues, false],
  ])('%s ART → %s', (_l, t, esperado) => {
    expect(isBf2026Window(t)).toBe(esperado)
    expect(bf2026DisplayPrice(AURA, t)).toBe(esperado ? 27900 : null)
  })
  it('no depende del huso del server (Vercel en UTC)', () => {
    expect(isBf2026Window(Date.parse('2026-11-27T02:59:59Z'))).toBe(false)
    expect(isBf2026Window(Date.parse('2026-12-01T02:59:59Z'))).toBe(true)
    expect(isBf2026Window(Date.parse('2026-12-01T03:00:00Z'))).toBe(false)
  })
  it('BF no entra en OFFERS (no toca compare_at_price de ninguna tienda partner)', () => {
    expect(getActiveOffers(new Date(T.medio)).filter((o) => o.campaign === 'Black Friday')).toEqual([])
  })
})

describe('precios BF de la web', () => {
  it('existen solo para prendas del catálogo, nunca más de 10 % OFF ni Bali/tote', () => {
    for (const [k, bf] of Object.entries(BF_2026_PRICES)) {
      const p = getCatalogProduct(k)
      expect(p, k).toBeDefined()
      expect(bf).toBeLessThan(p!.retailARS)
      expect(bf).toBeGreaterThanOrEqual(Math.ceil(p!.retailARS * 0.9))
      expect(bf % 100).toBe(0)
    }
    expect(BF_2026_PRICES['musculosa-bali']).toBeUndefined()
    expect(BF_2026_PRICES['totebag']).toBeUndefined()
    // Toda prenda del catálogo salvo Bali y tote tiene precio BF.
    const sinBf = CATALOG_PRODUCTS.map((p) => p.key).filter((k) => !(k in BF_2026_PRICES))
    expect(sinBf.sort()).toEqual(['musculosa-bali', 'totebag'])
  })
})

describe('reglas del carrito', () => {
  it('4 prendas → BF; 5 prendas → precio de lista', () => {
    const cuatro = [prenda(AURA, 4)]
    const cinco = [prenda(AURA, 5)]
    expect(bf2026PriceFor(cuatro[0], cuatro, T.medio)).toBe(27900)
    expect(bf2026PriceFor(cinco[0], cinco, T.medio)).toBeNull()
    const mezcla = [prenda(AURA, 3), prenda('buzo-cuello-redondo', 2)]
    expect(bf2026CartGarments(mezcla)).toBe(5)
    expect(bf2026PriceFor(mezcla[0], mezcla, T.medio)).toBeNull()
  })
  it('producto de partner: nunca BF, y cuenta para el tope de prendas', () => {
    const carrito = [{ productId: 'p1', garmentType: AURA, quantity: 1 }, prenda(AURA, 4)]
    expect(bf2026PriceFor(carrito[0], carrito, T.medio)).toBeNull()
    expect(bf2026PriceFor(carrito[1], carrito, T.medio)).toBeNull() // 5 prendas
  })
  it('Bali sin BF pero cuenta como prenda; la tote no cuenta', () => {
    const conBali = [prenda('musculosa-bali', 1), prenda(AURA, 3)]
    expect(bf2026PriceFor(conBali[0], conBali, T.medio)).toBeNull()
    expect(bf2026PriceFor(conBali[1], conBali, T.medio)).toBe(27900)
    const conTote = [prenda('totebag', 1), prenda(AURA, 4)]
    expect(bf2026PriceFor(conTote[1], conTote, T.medio)).toBe(27900)
  })
  it('aplicarBf2026: tacha, suma el dorso igual que siempre y vuelve a lista con la 5ª prenda', () => {
    const lista = precioListaPrendaPropia(prenda(AURA, 1, { doble_estampa: 'Si' }))!
    const carrito = [{ id: 'a', price: lista, ...prenda(AURA, 1, { doble_estampa: 'Si' }) }]
    const con = aplicarBf2026(carrito, T.medio)
    expect(con[0].price).toBe(27900 + 3500)
    expect(con[0].bfOriginalPrice).toBe(lista)
    expect(carritoConBf2026(con)).toBe(true)
    const cinco = aplicarBf2026([{ ...con[0], quantity: 5 }], T.medio)
    expect(cinco[0].price).toBe(lista)
    expect(cinco[0].bfOriginalPrice).toBeUndefined()
  })
  it('carrito armado el 30/11 23:59 y abierto el 01/12 00:00: vuelve solo al precio de lista', () => {
    const carrito = aplicarBf2026([{ id: 'a', price: 31000, ...prenda(AURA) }], T.fin)
    expect(carrito[0].price).toBe(27900)
    expect(aplicarBf2026(carrito, T.despues)[0].price).toBe(31000)
  })
  it('no toca ítems con precio propio (drops) ni de partners', () => {
    const drop = { id: 'd', price: 40000, ...prenda(AURA) }
    const partner = { id: 'p', price: 30000, productId: 'x', ...prenda(AURA) }
    expect(aplicarBf2026([drop, partner], T.medio)).toEqual([drop, partner])
  })
})

describe('servidor: validarPrecios con la promo', () => {
  const item = (price: number, quantity = 1, extra: Record<string, unknown> = {}) => ({ garmentType: AURA, unit_price: price, quantity, ...extra })

  it('28/11: BF con 1-4 prendas pasa y marca bfAplicado', async () => {
    const r = await validarPrecios([item(27900, 4)], { now: T.medio })
    expect(r.ok).toBe(true)
    expect(r.bfAplicado).toBe(true)
  })
  it('28/11: pagar el precio de lista también pasa (sin promo)', async () => {
    const r = await validarPrecios([item(31000)], { now: T.medio })
    expect(r.ok).toBe(true)
    expect(r.bfAplicado).toBe(false)
  })
  it('26/11 23:59 y 01/12 00:00: el precio BF se rechaza con el aviso de "oferta terminada"', async () => {
    for (const t of [T.antes, T.despues]) {
      const r = await validarPrecios([item(27900)], { now: t })
      expect(r.ok).toBe(false)
      expect(r.ofertaTerminada).toBe(true)
    }
  })
  it('30/11 23:59:59 todavía vale; 27/11 00:00 ya vale', async () => {
    expect((await validarPrecios([item(27900)], { now: T.fin })).ok).toBe(true)
    expect((await validarPrecios([item(27900)], { now: T.inicio })).ok).toBe(true)
  })
  it('5 prendas a precio BF → rechazo (grupo / 5+ quedan afuera)', async () => {
    const r = await validarPrecios([item(27900, 5)], { now: T.medio })
    expect(r.ok).toBe(false)
    expect(r.ofertaTerminada).toBe(true)
  })
  it('Bali al "10 %" → rechazo genérico (Bali no tiene promo)', async () => {
    const r = await validarPrecios([{ garmentType: 'musculosa-bali', unit_price: 19700, quantity: 1 }], { now: T.medio })
    expect(r.ok).toBe(false)
  })
  it('dorso sobre BF: 27.900 + 3.500', async () => {
    expect((await validarPrecios([item(31400, 1, { doble_estampa: 'Si' })], { now: T.medio })).ok).toBe(true)
    expect((await validarPrecios([item(27900, 1, { doble_estampa: 'Si' })], { now: T.medio })).ok).toBe(false)
  })
})
