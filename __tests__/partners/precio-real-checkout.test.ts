/**
 * /api/checkout recibía `unit_price` y `total` del navegador y su "validación
 * de precio" comparaba uno contra el otro — la aritmética del cliente contra
 * sus propios números. Después mandaba ese mismo `unit_price` a la preferencia
 * de MercadoPago ("con precios exactos", decía el comentario).
 *
 * Con postear `unit_price: 1` alcanzaba para pagar $1 un buzo de $55.000.
 */
import { describe, it, expect, vi } from 'vitest'
import { validarPrecios, precioRealDelItem, RECARGO_DOBLE_ESTAMPA } from '@/lib/checkout/precio-real'

vi.mock('@/lib/supabase-admin', () => ({
  supabaseAdmin: {
    from: () => ({
      select: () => ({
        eq: () => ({
          single: async () => ({
            data: { price: 30000, metadata: { size_prices: { XL: 34000 } } },
            error: null,
          }),
        }),
      }),
    }),
  },
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
