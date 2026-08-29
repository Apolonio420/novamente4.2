/**
 * El submit del checkout no rechazaba un talle agotado — el stock (tanto
 * partner_products.stock como garment_stock de liquidación) recién se
 * miraba al CONFIRMARSE el pago. Estos tests cubren validarStock, que ahora
 * corre ANTES de crear la orden / cobrar.
 *
 * Convención: SIN fila en garment_stock / stock=NULL en partner_products =
 * stock libre. Sólo se rechaza cuando hay un tope cargado y no alcanza.
 */
import { describe, it, expect, vi } from 'vitest'

const partnerProductsRows: Array<{ id: string; stock: number | null }> = [
  { id: 'p-agotado', stock: 0 },
  { id: 'p-poco-stock', stock: 2 },
  { id: 'p-ilimitado', stock: null },
]

const garmentStockRows = [
  { product_key: 'buzo-oversize', color: 'marron', size: 'S', qty: 0 },
  { product_key: 'buzo-oversize', color: 'marron', size: 'M', qty: 2 },
]

vi.mock('@/lib/supabase-admin', () => ({
  supabaseAdmin: {
    from: (table: string) => {
      if (table === 'partner_products') {
        return {
          select: () => ({
            in: async (_col: string, ids: string[]) => ({
              data: partnerProductsRows.filter((r) => ids.includes(r.id)),
              error: null,
            }),
          }),
        }
      }
      if (table === 'garment_stock') {
        return {
          select: () => ({
            eq: async () => ({ data: garmentStockRows, error: null }),
          }),
        }
      }
      throw new Error(`tabla no mockeada: ${table}`)
    },
  },
}))

import { validarStock, mensajeStockAgotado } from './stock-guard'

describe('validarStock — productos de partner (partner_products.stock)', () => {
  it('rechaza un producto agotado (stock 0, piden 1)', async () => {
    const r = await validarStock([{ productId: 'p-agotado', size: 'M', quantity: 1 }])
    expect(r.ok).toBe(false)
    expect(r.agotados[0]).toMatchObject({ item: 'p-agotado', disponible: 0, pedido: 1 })
  })

  it('rechaza cuando piden más de lo que queda', async () => {
    const r = await validarStock([{ productId: 'p-poco-stock', quantity: 3 }])
    expect(r.ok).toBe(false)
    expect(r.agotados[0]).toMatchObject({ disponible: 2, pedido: 3 })
  })

  it('pasa cuando alcanza el stock', async () => {
    const r = await validarStock([{ productId: 'p-poco-stock', quantity: 2 }])
    expect(r.ok).toBe(true)
  })

  it('stock NULL = ilimitado, siempre pasa', async () => {
    const r = await validarStock([{ productId: 'p-ilimitado', quantity: 9999 }])
    expect(r.ok).toBe(true)
  })
})

describe('validarStock — liquidación por talle (garment_stock)', () => {
  it('rechaza un talle agotado (buzo-oversize marron S, qty 0)', async () => {
    const r = await validarStock([
      { garmentType: 'Buzo Oversize', color: 'Marrón', size: 'S', quantity: 1 },
    ])
    expect(r.ok).toBe(false)
    expect(r.agotados[0]).toMatchObject({ talle: 'S', disponible: 0, pedido: 1 })
  })

  it('pasa cuando el talle trackeado tiene stock suficiente', async () => {
    const r = await validarStock([
      { garmentType: 'Buzo Oversize', color: 'Marrón', size: 'M', quantity: 2 },
    ])
    expect(r.ok).toBe(true)
  })

  it('SIN fila en garment_stock = libre (no trackeado, p.ej. color con reposición)', async () => {
    const r = await validarStock([
      { garmentType: 'Buzo Oversize', color: 'Negro', size: 'L', quantity: 500 },
    ])
    expect(r.ok).toBe(true)
  })

  it('prenda que no matchea ninguna clave de liquidación = libre', async () => {
    const r = await validarStock([
      { garmentType: 'Remera Clásica', color: 'Blanco', size: 'M', quantity: 100 },
    ])
    expect(r.ok).toBe(true)
  })
})

describe('mensajeStockAgotado', () => {
  it('arma un mensaje legible con el detalle de cada item agotado', () => {
    const msg = mensajeStockAgotado([{ item: 'Buzo Oversize Marrón', talle: 'S', disponible: 0, pedido: 1 }])
    expect(msg).toContain('Buzo Oversize Marrón')
    expect(msg).toContain('talle S')
    expect(msg).toContain('quedan 0')
    expect(msg).toContain('pediste 1')
  })
})
