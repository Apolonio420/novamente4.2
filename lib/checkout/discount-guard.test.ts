/**
 * El código de descuento sólo se validaba en /api/discounts/validate — un
 * endpoint que el checkout llamaba para MOSTRARLE el descuento al cliente,
 * pero el submit real (/api/checkout, /api/checkout/transfer) nunca volvía a
 * validarlo: max_uses no se aplicaba (nada incrementaba uses_count), y el
 * `total` que llegaba ya con el descuento restado rompía la comparación de
 * precios del checkout de MercadoPago con CUALQUIER código aplicado.
 *
 * Estos tests cubren validarDescuento/registrarUsoDescuento/
 * aplicarDescuentoAItemsMP de forma aislada (sin pegarle a Supabase real).
 */
import { describe, it, expect, vi } from 'vitest'

const h = vi.hoisted(() => ({
  state: {
    codeRow: null as any,
    codeError: null as any,
    rpcResult: null as any,
    rpcError: null as any,
  },
}))

vi.mock('@/lib/supabase-admin', () => ({
  supabaseAdmin: {
    from: () => ({
      select: () => ({
        eq: () => ({
          eq: () => ({
            limit: async () => ({
              data: h.state.codeRow ? [h.state.codeRow] : [],
              error: h.state.codeError,
            }),
          }),
        }),
      }),
    }),
    rpc: async () => ({ data: h.state.rpcResult, error: h.state.rpcError }),
  },
}))

import { validarDescuento, registrarUsoDescuento, aplicarDescuentoAItemsMP } from './discount-guard'

const baseCode = {
  id: 'code-1',
  tenant_id: 't1',
  code: 'HOTSALE15',
  description: null,
  discount_type: 'percentage' as const,
  discount_value: 15,
  min_purchase_ars: 0,
  max_uses: 10,
  uses_count: 3,
  starts_at: '2020-01-01T00:00:00.000Z',
  ends_at: null,
  active: true,
  created_at: '2020-01-01T00:00:00.000Z',
  updated_at: '2020-01-01T00:00:00.000Z',
}

describe('validarDescuento — nunca confía en el navegador', () => {
  it('sin código: no hay descuento', async () => {
    const r = await validarDescuento(null, 100000)
    expect(r.valid).toBe(false)
    expect(r.discountARS).toBe(0)
  })

  it('código inexistente: no descuenta', async () => {
    h.state.codeRow = null
    const r = await validarDescuento('NOEXISTE', 100000)
    expect(r.valid).toBe(false)
    expect(r.discountARS).toBe(0)
  })

  it('código inactivo: no descuenta', async () => {
    h.state.codeRow = { ...baseCode, active: false }
    const r = await validarDescuento('HOTSALE15', 100000)
    expect(r.valid).toBe(false)
    expect(r.discountARS).toBe(0)
  })

  it('código vencido: no descuenta', async () => {
    h.state.codeRow = { ...baseCode, ends_at: '2020-06-01T00:00:00.000Z' }
    const r = await validarDescuento('HOTSALE15', 100000)
    expect(r.valid).toBe(false)
    expect(r.discountARS).toBe(0)
  })

  it('max_uses alcanzado (uses_count >= max_uses): no descuenta — el hueco original', async () => {
    h.state.codeRow = { ...baseCode, max_uses: 10, uses_count: 10 }
    const r = await validarDescuento('HOTSALE15', 100000)
    expect(r.valid).toBe(false)
    expect(r.discountARS).toBe(0)
    expect(r.reason).toMatch(/agotado/i)
  })

  it('código válido con cupo disponible: descuenta el % sobre el subtotal REAL (no el del navegador)', async () => {
    h.state.codeRow = { ...baseCode, max_uses: 10, uses_count: 9 }
    const r = await validarDescuento('hotsale15', 100000) // lowercase — se normaliza
    expect(r.valid).toBe(true)
    expect(r.discountARS).toBe(15000)
    expect(r.discountId).toBe('code-1')
  })

  it('error de Supabase: no descuenta (nunca baja el total por un fallo)', async () => {
    h.state.codeRow = null
    h.state.codeError = { message: 'boom' }
    const r = await validarDescuento('HOTSALE15', 100000)
    expect(r.valid).toBe(false)
    expect(r.discountARS).toBe(0)
    h.state.codeError = null
  })
})

describe('registrarUsoDescuento — incremento atómico de uses_count', () => {
  it('devuelve el uses_count nuevo cuando el RPC incrementa', async () => {
    h.state.rpcResult = 4
    h.state.rpcError = null
    const r = await registrarUsoDescuento('code-1')
    expect(r).toBe(4)
  })

  it('devuelve null si el RPC no afectó filas (código ya en el tope)', async () => {
    h.state.rpcResult = null
    h.state.rpcError = null
    const r = await registrarUsoDescuento('code-1')
    expect(r).toBeNull()
  })

  it('devuelve null ante un error del RPC, sin lanzar', async () => {
    h.state.rpcResult = null
    h.state.rpcError = { message: 'boom' }
    const r = await registrarUsoDescuento('code-1')
    expect(r).toBeNull()
    h.state.rpcError = null
  })
})

describe('aplicarDescuentoAItemsMP — MercadoPago no acepta unit_price <= 0', () => {
  it('sin descuento, devuelve los items intactos', () => {
    const items = [{ unit_price: 30000, quantity: 1 }]
    expect(aplicarDescuentoAItemsMP(items, 0)).toEqual(items)
  })

  it('reparte el descuento proporcionalmente entre items y el total baja exactamente lo esperado', () => {
    const items = [
      { id: 'a', unit_price: 30000, quantity: 1 },
      { id: 'b', unit_price: 20000, quantity: 1 },
    ]
    const result = aplicarDescuentoAItemsMP(items, 5000)
    const nuevoTotal = result.reduce((s, i) => s + i.unit_price * i.quantity, 0)
    expect(nuevoTotal).toBe(45000) // 50000 - 5000
    expect(result.every((i) => i.unit_price > 0)).toBe(true)
  })

  it('nunca deja un item en $0 o negativo (piso de $1) aunque el descuento cubra casi todo', () => {
    const items = [{ id: 'a', unit_price: 1000, quantity: 1 }]
    const result = aplicarDescuentoAItemsMP(items, 999999)
    expect(result[0].unit_price).toBeGreaterThan(0)
  })

  it('no toca items si la lista está vacía', () => {
    expect(aplicarDescuentoAItemsMP([], 5000)).toEqual([])
  })
})
