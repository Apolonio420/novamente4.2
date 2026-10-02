/**
 * Montos de /api/checkout y /api/checkout/transfer calculados en el server
 * (02/10/2026). El caso que motivó esto: cartItems con el precio real (pasan
 * validarPrecios) + `items` formato MP con unit_price $1 + subtotal/envío del
 * navegador → antes la preferencia de MP cobraba $1 por un pedido de $45.000.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { envioPorDistancia } from '@/lib/shipping-config'
import { cardSurchargeAmount } from '@/lib/payment-config'

const h = vi.hoisted(() => ({
  preferences: [] as any[],
  orders: [] as any[],
}))

vi.mock('mercadopago', () => {
  class MercadoPagoConfig { constructor(_o: any) {} }
  class Preference {
    async create({ body }: any) {
      h.preferences.push(body)
      return { id: 'pref-1', init_point: 'https://mp.test/init' }
    }
  }
  return { MercadoPagoConfig, Preference }
})
vi.mock('@/lib/db', () => ({
  findRecentDuplicateOrder: async () => null,
  updateOrder: async () => true,
  createOrder: async (o: any) => {
    h.orders.push(o)
    return { id: '00000000-0000-4000-8000-000000000001', order_number: 'NOV-TEST', ...o }
  },
}))
vi.mock('@/lib/checkout/stock-guard', () => ({ validarStock: async () => ({ ok: true }), mensajeStockAgotado: () => '' }))
vi.mock('@/lib/checkout/precio-real', () => ({ validarPrecios: async () => ({ ok: true, subfacturados: [], bajoCosto: [], sinVerificar: 0 }) }))
vi.mock('@/lib/checkout/partner-items', () => ({ enriquecerItemsPartner: async (items: any[]) => items }))
vi.mock('@/lib/checkout/funnel', () => ({ registrarEventoCheckout: async () => undefined }))
vi.mock('@/lib/notifications', () => ({ notifyError: async () => undefined, notifyNewOrder: async () => undefined, notifyTransferOrder: async () => undefined }))
vi.mock('@/lib/email', () => ({}))
vi.mock('@/lib/partners/drop7', () => ({}))
vi.mock('@/lib/supabase-admin', () => ({
  supabaseAdmin: { from: () => ({ select: () => ({ in: async () => ({ data: [] }), eq: () => ({ maybeSingle: async () => ({ data: null }) }) }) }) },
}))
vi.mock('@/lib/checkout/discount-guard', async () => {
  const real = await vi.importActual<any>('@/lib/checkout/discount-guard')
  return { ...real, validarDescuento: async () => ({ valid: false, discountARS: 0 }) }
})

process.env.MP_ACCESS_TOKEN = 'test-token'

const customer = {
  email: 'qa@example.com', firstName: 'QA', lastName: 'Test', phone: '1155550000',
  address: 'Av. Siempreviva 742', city: 'CABA', postalCode: '1414',
}
const cartItems = [{ id: 'remera-1', name: 'Remera', garmentType: 'Aura T-Shirt', color: 'Negro', size: 'M', price: 45000, quantity: 1, image: '/x.png' }]
const SUB = 45000
const ENVIO = envioPorDistancia(SUB, '1414', 'BA').costo

function req(url: string, body: any) {
  return new NextRequest(url, { method: 'POST', body: JSON.stringify(body), headers: { 'content-type': 'application/json', host: 'localhost:3000' } })
}

beforeEach(() => {
  h.preferences = []
  h.orders = []
})

describe('/api/checkout (Mercado Pago) — montos del server', () => {
  it('ítems de MP de $1 en el payload: la preferencia cobra el precio real del carrito', async () => {
    const { POST } = await import('./route')
    const res = await POST(req('http://localhost:3000/api/checkout', {
      customer, cartItems, shippingZone: 'BA',
      items: [{ id: 'remera-1', title: 'Remera', quantity: 1, unit_price: 1 }, { id: 'shipping', title: 'Envío', quantity: 1, unit_price: 1 }],
      subtotal: SUB, shippingCost: ENVIO, total: SUB + ENVIO,
    }))
    expect(res.status).toBe(200)
    const pref = h.preferences[0]
    const cobrado = pref.items.reduce((s: number, i: any) => s + i.unit_price * i.quantity, 0)
    const base = SUB + ENVIO
    expect(cobrado).toBe(base + cardSurchargeAmount(base))
    expect(h.orders[0].total).toBe(cobrado)
  })

  it('envío manipulado a $0: se rechaza (el total no coincide con el del server)', async () => {
    const { POST } = await import('./route')
    const res = await POST(req('http://localhost:3000/api/checkout', {
      customer, cartItems, shippingZone: 'BA', items: [],
      subtotal: SUB, shippingCost: 0, total: SUB,
    }))
    expect(res.status).toBe(400)
    expect(h.preferences).toHaveLength(0)
    expect(h.orders).toHaveLength(0)
  })

  it('subtotal manipulado: se rechaza', async () => {
    const { POST } = await import('./route')
    const res = await POST(req('http://localhost:3000/api/checkout', {
      customer, cartItems, shippingZone: 'BA', items: [],
      subtotal: 1, shippingCost: ENVIO, total: 1 + ENVIO,
    }))
    expect(res.status).toBe(400)
    expect(h.orders).toHaveLength(0)
  })
})

describe('/api/checkout/transfer — montos del server', () => {
  it('pedido honesto: el total guardado y devuelto es el del server', async () => {
    const { POST } = await import('./transfer/route')
    const res = await POST(req('http://localhost:3000/api/checkout/transfer', {
      customer, items: cartItems, shippingZone: 'BA', subtotal: SUB, shippingCost: ENVIO, total: SUB + ENVIO,
    }))
    const json = await res.json()
    expect(res.status).toBe(200)
    expect(h.orders[0]).toMatchObject({ subtotal: SUB, shipping_cost: ENVIO, total: SUB + ENVIO })
    expect(json.total).toBe(SUB + ENVIO)
  })

  it('envío/total manipulados: se rechaza y no se crea el pedido', async () => {
    const { POST } = await import('./transfer/route')
    const res = await POST(req('http://localhost:3000/api/checkout/transfer', {
      customer, items: cartItems, shippingZone: 'BA', subtotal: 1, shippingCost: 0, total: 1,
    }))
    expect(res.status).toBe(400)
    expect(h.orders).toHaveLength(0)
  })
})
