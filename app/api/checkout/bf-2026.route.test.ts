/**
 * Black Friday 2026 en /api/checkout y /api/checkout/transfer con el validador
 * de precios REAL: etiqueta metadata.promo='bf-2026', rechaza el precio BF fuera
 * de la ventana con un mensaje claro y no lo suma con códigos de descuento.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { envioPorDistancia } from '@/lib/shipping-config'

const h = vi.hoisted(() => ({ preferences: [] as any[], orders: [] as any[], alertas: [] as any[], descuento: { valid: false, discountARS: 0 } as any }))

vi.mock('mercadopago', () => {
  class MercadoPagoConfig { constructor(_o: any) {} }
  class Preference {
    async create({ body }: any) { h.preferences.push(body); return { id: 'pref-1', init_point: 'https://mp.test/init' } }
  }
  return { MercadoPagoConfig, Preference }
})
vi.mock('@/lib/db', () => ({
  findRecentDuplicateOrder: async () => null,
  updateOrder: async () => true,
  createOrder: async (o: any) => { h.orders.push(o); return { id: '00000000-0000-4000-8000-000000000001', order_number: 'NOV-TEST', ...o } },
}))
vi.mock('@/lib/checkout/stock-guard', () => ({ validarStock: async () => ({ ok: true }), mensajeStockAgotado: () => '' }))
vi.mock('@/lib/checkout/partner-items', () => ({ enriquecerItemsPartner: async (items: any[]) => items }))
vi.mock('@/lib/checkout/funnel', () => ({ registrarEventoCheckout: async () => undefined }))
vi.mock('@/lib/notifications', () => ({ notifyError: async (a: any) => { h.alertas.push(a) }, notifyNewOrder: async () => undefined, notifyTransferOrder: async () => undefined }))
vi.mock('@/lib/email', () => ({}))
vi.mock('@/lib/partners/drop7', () => ({}))
vi.mock('@/lib/partners/garment-pricing.server', () => ({ ALL_GARMENT_PRICING: {}, getPartnerPlanPrice: () => 10000 }))
vi.mock('@/lib/supabase-admin', () => ({
  supabaseAdmin: { from: () => ({ select: () => ({ in: async () => ({ data: [] }), eq: () => ({ maybeSingle: async () => ({ data: null }), single: async () => ({ data: null }) }) }), update: () => ({ eq: async () => ({}) }) }) },
}))
vi.mock('@/lib/checkout/discount-guard', async () => {
  const real = await vi.importActual<any>('@/lib/checkout/discount-guard')
  return { ...real, validarDescuento: async () => h.descuento }
})

process.env.MP_ACCESS_TOKEN = 'test-token'

const customer = { email: 'qa@example.com', firstName: 'QA', lastName: 'Test', phone: '1155550000', address: 'Av. Siempreviva 742', city: 'CABA', postalCode: '1414' }
const aura = (price: number, quantity = 1) => [{ id: 'remera-1', name: 'Remera', garmentType: 'aura-oversize-tshirt', color: 'Negro', size: 'M', price, quantity, image: '/x.png' }]

function req(url: string, body: any) {
  return new NextRequest(url, { method: 'POST', body: JSON.stringify(body), headers: { 'content-type': 'application/json', host: 'localhost:3000' } })
}
function cuerpo(items: any[], extra: Record<string, unknown> = {}) {
  const sub = items.reduce((s, i) => s + i.price * i.quantity, 0)
  const envio = envioPorDistancia(sub, '1414', 'BA').costo
  return { customer, cartItems: items, items: items.map((i) => ({ id: i.id, title: i.name, quantity: i.quantity, unit_price: i.price })), shippingZone: 'BA', subtotal: sub, shippingCost: envio, total: sub + envio, ...extra }
}
function cuerpoTransfer(items: any[], extra: Record<string, unknown> = {}) {
  const { cartItems, ...rest } = cuerpo(items, extra) as any
  return { ...rest, items: cartItems }
}
const at = (iso: string) => { vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(new Date(iso)) }

beforeEach(() => { h.preferences = []; h.orders = []; h.alertas = []; h.descuento = { valid: false, discountARS: 0 } })
afterEach(() => vi.useRealTimers())

describe('Black Friday 2026 — /api/checkout (Mercado Pago)', () => {
  it('28/11: Aura a $27.900 → 200 y el pedido queda con metadata.promo = bf-2026', async () => {
    at('2026-11-28T15:00:00-03:00')
    const { POST } = await import('./route')
    const res = await POST(req('http://localhost:3000/api/checkout', cuerpo(aura(27900))))
    expect(res.status).toBe(200)
    expect(h.orders[0].metadata.promo).toBe('bf-2026')
  })
  it('precio de lista en la ventana → 200 sin etiqueta de promo', async () => {
    at('2026-11-28T15:00:00-03:00')
    const { POST } = await import('./route')
    const res = await POST(req('http://localhost:3000/api/checkout', cuerpo(aura(31000))))
    expect(res.status).toBe(200)
    expect(h.orders[0].metadata.promo).toBeUndefined()
  })
  it('01/12 00:00 con el carrito todavía a $27.900 → 400 con el aviso de BF, sin pedido', async () => {
    at('2026-12-01T00:00:00-03:00')
    const { POST } = await import('./route')
    const res = await POST(req('http://localhost:3000/api/checkout', cuerpo(aura(27900))))
    const json = await res.json()
    expect(res.status).toBe(400)
    expect(json.code).toBe('BF_2026_NO_APLICA')
    expect(json.error).toMatch(/Black Friday/)
    expect(h.orders).toHaveLength(0)
    // Cliente de buena fe con el carrito vencido: no es alerta urgente de fraude.
    expect(h.alertas.filter((a) => a?.urgent)).toHaveLength(0)
  })
  it('5 prendas a precio BF → 400 (5+ quedan afuera)', async () => {
    at('2026-11-28T15:00:00-03:00')
    const { POST } = await import('./route')
    const res = await POST(req('http://localhost:3000/api/checkout', cuerpo(aura(27900, 5))))
    expect(res.status).toBe(400)
    expect(h.orders).toHaveLength(0)
  })
  it('BF + código de descuento válido → 400, no se suman', async () => {
    at('2026-11-28T15:00:00-03:00')
    h.descuento = { valid: true, discountARS: 2000, discountId: 'd1', discountCode: 'X' }
    const { POST } = await import('./route')
    const items = aura(27900)
    const res = await POST(req('http://localhost:3000/api/checkout', cuerpo(items, { discountCode: 'X', total: cuerpo(items).total - 2000 })))
    expect(res.status).toBe(400)
    expect((await res.json()).code).toBe('BF_2026_SIN_CODIGO')
    expect(h.orders).toHaveLength(0)
  })
})

describe('Black Friday 2026 — la alerta de fraude sigue para lo demás', () => {
  it('Aura a $1 el 28/11 → 400 y alerta urgente', async () => {
    at('2026-11-28T15:00:00-03:00')
    const { POST } = await import('./route')
    const res = await POST(req('http://localhost:3000/api/checkout', cuerpo(aura(1))))
    expect(res.status).toBe(400)
    expect(h.alertas.filter((a) => a?.urgent)).toHaveLength(1)
  })
})

describe('Black Friday 2026 — /api/checkout/transfer', () => {
  it('28/11: transferencia a $27.900 → pedido con metadata.promo = bf-2026', async () => {
    at('2026-11-28T15:00:00-03:00')
    const { POST } = await import('./transfer/route')
    const res = await POST(req('http://localhost:3000/api/checkout/transfer', cuerpoTransfer(aura(27900))))
    expect(res.status).toBe(200)
    expect(h.orders[0].metadata.promo).toBe('bf-2026')
  })
  it('26/11 23:59 → 400 con el aviso de BF', async () => {
    at('2026-11-26T23:59:00-03:00')
    const { POST } = await import('./transfer/route')
    const res = await POST(req('http://localhost:3000/api/checkout/transfer', cuerpoTransfer(aura(27900))))
    expect(res.status).toBe(400)
    expect((await res.json()).code).toBe('BF_2026_NO_APLICA')
  })
})
