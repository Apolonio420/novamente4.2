/**
 * /api/checkout recibía `unit_price` y `total` del navegador y su "validación
 * de precio" comparaba uno contra el otro — la aritmética del cliente contra
 * sus propios números. Después mandaba ese mismo `unit_price` a la preferencia
 * de MercadoPago ("con precios exactos", decía el comentario).
 *
 * Con postear `unit_price: 1` alcanzaba para pagar $1 un buzo de $55.000.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { validarPrecios, precioRealDelItem, RECARGO_DOBLE_ESTAMPA } from '@/lib/checkout/precio-real'

// Store table-aware: `partner_products` y `tenants` se leen por separado (la
// pieza nueva del piso de costo agrega una consulta a `tenants.plan`). Las
// pruebas que solo ejercitan el path de /crear (garmentType) ni siquiera
// tocan este mock. Cada test que sí depende de `partner_products`/`tenants`
// pisa los valores en `store` antes de llamar — `beforeEach` los resetea a
// los defaults de siempre para no filtrar estado entre tests.
const store = vi.hoisted(() => ({
  partner_products: { price: 30000, metadata: { size_prices: { XL: 34000 } }, tenant_id: 'tenant-1' } as any,
  tenants: { plan: 'starter' } as any,
}))

beforeEach(() => {
  store.partner_products = { price: 30000, metadata: { size_prices: { XL: 34000 } }, tenant_id: 'tenant-1' }
  store.tenants = { plan: 'starter' }
})

vi.mock('@/lib/supabase-admin', () => ({
  supabaseAdmin: {
    from: (table: string) => ({
      select: () => ({
        eq: () => ({
          single: async () => ({ data: (store as any)[table] ?? null, error: null }),
        }),
      }),
    }),
  },
}))

// El piso de costo resuelve el costo real vía resolveProductCost (variants.ts),
// que a su vez importa garment-pricing.server ('server-only' + tablas de
// pricing reales). Se stubea igual que en variants.test.ts para que el
// costo sea determinístico: 'aura-oversize-tshirt' siempre cuesta $10.000.
vi.mock('@/lib/partners/garment-pricing.server', () => ({
  ALL_GARMENT_PRICING: { 'aura-oversize-tshirt': {} },
  getPartnerPlanPrice: (_gk: string, _plan: string) => 10000,
}))


describe('el precio lo decide el servidor, no el navegador', () => {
  it('el ataque original: pagar $1 un buzo de $55.000 se rechaza', async () => {
    const r = await validarPrecios([
      { garmentType: 'buzo-hoodie-unisex', unit_price: 1, quantity: 1 },
    ])
    expect(r.ok).toBe(false)
    expect(r.subfacturados[0].cobrado).toBe(1)
    expect(r.subfacturados[0].real).toBe(55000)
  })

  it('el precio correcto pasa', async () => {
    const r = await validarPrecios([
      { garmentType: 'buzo-hoodie-unisex', unit_price: 55000, quantity: 1 },
    ])
    expect(r.ok).toBe(true)
  })

  it('el recargo por doble estampa cuenta', async () => {
    expect(await precioRealDelItem({ garmentType: 'aldea-classic-tshirt' })).toBe(28600)
    expect(await precioRealDelItem({ garmentType: 'aldea-classic-tshirt', doble_estampa: 'Si' }))
      .toBe(28600 + RECARGO_DOBLE_ESTAMPA)
  })

  it('en un producto de partner gana el precio por talle', async () => {
    expect(await precioRealDelItem({ productId: 'p1', size: 'M' })).toBe(30000)
    expect(await precioRealDelItem({ productId: 'p1', size: 'XL' })).toBe(34000)
  })

  it('pagar de MÁS no bloquea la compra', async () => {
    const r = await validarPrecios([
      { garmentType: 'aldea-classic-tshirt', unit_price: 50000, quantity: 1 },
    ])
    expect(r.ok).toBe(true)
  })

  it('un item que no sabemos cotizar no frena la venta, pero se cuenta', async () => {
    const r = await validarPrecios([{ unit_price: 5, quantity: 1 }])
    expect(r.ok).toBe(true)
    expect(r.sinVerificar).toBe(1)
  })

  it('tolera el redondeo de un peso', async () => {
    const r = await validarPrecios([
      { garmentType: 'aldea-classic-tshirt', unit_price: 28599.5, quantity: 1 },
    ])
    expect(r.ok).toBe(true)
  })
})

// Auditoría 22/09/2026: lcitea y al-fa cargaron el precio "en miles" (40, 60)
// y `partner_products.price` se cobraría tal cual — el navegador honestamente
// manda el mismo precio bajo que ve, así que el chequeo de "subfacturado" (que
// compara lo cobrado contra la fila) no alcanza. Este piso compara la fila
// misma contra el costo de producción.
describe('piso de costo en productos de partner (no se puede cobrar por debajo del costo)', () => {
  it('precio por debajo del costo → rechaza', async () => {
    store.partner_products = { price: 8000, metadata: { garmentKey: 'aura-oversize-tshirt' }, tenant_id: 'tenant-1' }
    store.tenants = { plan: 'starter' }

    const r = await validarPrecios([{ productId: 'p2', unit_price: 8000, quantity: 1 }])
    expect(r.ok).toBe(false)
    expect(r.bajoCosto).toEqual([{ item: 'p2', real: 8000, costo: 10000 }])
  })

  it('precio 60 sin garmentKey (costo no resoluble) → rechaza por el piso absoluto', async () => {
    store.partner_products = { price: 60, metadata: {}, tenant_id: 'tenant-1' }
    store.tenants = { plan: 'starter' }

    const r = await validarPrecios([{ productId: 'p3', unit_price: 60, quantity: 1 }])
    expect(r.ok).toBe(false)
    expect(r.bajoCosto).toEqual([{ item: 'p3', real: 60, costo: null }])
  })

  it('precio normal (por encima del costo) → pasa', async () => {
    store.partner_products = { price: 55000, metadata: { garmentKey: 'aura-oversize-tshirt' }, tenant_id: 'tenant-1' }
    store.tenants = { plan: 'starter' }

    const r = await validarPrecios([{ productId: 'p4', unit_price: 55000, quantity: 1 }])
    expect(r.ok).toBe(true)
    expect(r.bajoCosto).toEqual([])
  })

  it('size_prices por debajo del costo → rechaza (el precio por talle también pasa el piso)', async () => {
    store.partner_products = {
      price: 55000,
      metadata: { garmentKey: 'aura-oversize-tshirt', size_prices: { S: 5000 } },
      tenant_id: 'tenant-1',
    }
    store.tenants = { plan: 'starter' }

    const r = await validarPrecios([{ productId: 'p5', size: 'S', unit_price: 5000, quantity: 1 }])
    expect(r.ok).toBe(false)
    expect(r.bajoCosto).toEqual([{ item: 'p5', real: 5000, costo: 10000 }])
  })
})
