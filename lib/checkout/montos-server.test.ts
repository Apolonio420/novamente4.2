import { describe, it, expect } from 'vitest'
import { subtotalServer, envioServer, itemsMPDesdeCarrito, itemMPEnvio, totalItemsMP, tenantsDelCarrito } from './montos-server'
import { envioPorDistancia, SHIPPING } from '@/lib/shipping-config'

const carrito = [
  { id: 'a', name: 'Remera', color: 'Negro', size: 'M', price: 35750, quantity: 2 },
  { id: 'b', name: 'Buzo', color: 'Blanco', size: 'L', price: 55000, quantity: 1 },
]

describe('subtotalServer', () => {
  it('suma precio × cantidad del carrito', () => {
    expect(subtotalServer(carrito)).toBe(35750 * 2 + 55000)
  })
  it('ignora la línea de envío si viene mezclada (payload formato MP)', () => {
    expect(subtotalServer([{ id: 'x', unit_price: 1000, quantity: 1 }, { id: 'shipping', unit_price: 9999, quantity: 1 }])).toBe(1000)
  })
  it('precios/cantidades raros no suman ni restan', () => {
    expect(subtotalServer([{ id: 'x', price: -5, quantity: 3 }, { id: 'y', price: 100, quantity: 0 }, { id: 'z', price: NaN as any }])).toBe(100)
  })
})

describe('envioServer', () => {
  it('es el mismo cálculo que muestra el checkout (CP manda)', () => {
    expect(envioServer(35750, '1414', 'RESTO')).toBe(envioPorDistancia(35750, '1414', 'RESTO').costo)
    expect(envioServer(35750, '5000', 'BA')).toBe(envioPorDistancia(35750, '5000', 'BA').costo)
  })
  it('sin CP usa la zona; zona inválida = BA', () => {
    expect(envioServer(35750, '', 'RESTO')).toBe(SHIPPING.RESTO)
    expect(envioServer(35750, undefined, 'cualquiera')).toBe(SHIPPING.BA)
  })
  it('gratis desde el umbral', () => {
    expect(envioServer(SHIPPING.FREE_THRESHOLD, '9410', 'RESTO')).toBe(0)
  })
})

describe('ítems de Mercado Pago', () => {
  it('se arman desde el carrito, con el precio del carrito (no del payload de MP)', () => {
    const mp = itemsMPDesdeCarrito(carrito)
    expect(mp).toEqual([
      { id: 'a', title: 'Remera', quantity: 2, unit_price: 35750, description: 'Negro · Talle M' },
      { id: 'b', title: 'Buzo', quantity: 1, unit_price: 55000, description: 'Blanco · Talle L' },
    ])
  })
  it('producto + envío = subtotal + envío', () => {
    const envio = envioServer(subtotalServer(carrito), '1414', 'BA')
    const items = [...itemsMPDesdeCarrito(carrito), ...itemMPEnvio(envio)]
    expect(totalItemsMP(items)).toBe(subtotalServer(carrito) + envio)
  })
  it('envío gratis no agrega línea ($0 no lo acepta MP)', () => {
    expect(itemMPEnvio(0)).toEqual([])
  })
})

describe('tenantsDelCarrito', () => {
  const A = '11111111-1111-4111-8111-111111111111'
  const B = '22222222-2222-4222-8222-222222222222'
  it('carrito de una tienda', () => {
    expect(tenantsDelCarrito([{ tenantId: A, price: 100, quantity: 1 }])).toEqual({ principal: A, todos: [A] })
  })
  it('mixto: principal = la tienda con más monto, no la primera', () => {
    const r = tenantsDelCarrito([
      { tenantId: A, price: 100, quantity: 1 },
      { price: 99999, quantity: 1 }, // web propia: no es de ninguna tienda
      { tenantId: B, price: 80, quantity: 2 },
    ])
    expect(r).toEqual({ principal: B, todos: [A, B] })
  })
  it('sin tiendas o con ids inválidos → null', () => {
    expect(tenantsDelCarrito([{ price: 1 }, { tenantId: 'x', price: 1 } as any])).toEqual({ principal: null, todos: [] })
  })
})
