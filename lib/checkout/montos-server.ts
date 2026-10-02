/**
 * Montos del checkout calculados EN EL SERVIDOR.
 *
 * Por qué (02/10/2026): /api/checkout y /api/checkout/transfer tomaban el
 * `subtotal` y el `shippingCost` que mandaba el navegador, y la preferencia de
 * Mercado Pago se armaba con los `items` (formato MP) del navegador — mientras
 * que `validarPrecios` revisaba los `cartItems`. Un cliente modificado podía
 * mandar cartItems con el precio real y un `items` de $1: el pedido quedaba con
 * el total real y MP cobraba $1. Ahora:
 *   - subtotal = suma de los ítems del carrito (los mismos que pasaron
 *     validarPrecios, nunca por debajo del precio real),
 *   - envío = envioPorDistancia con el CP del cliente (mismo cálculo que el
 *     checkout muestra),
 *   - los ítems de MP se arman desde el carrito, no desde el payload de MP.
 * El total que manda el navegador sólo se usa para comparar: si no coincide,
 * el pedido se rechaza (el cliente vio otro monto).
 */
import { envioPorDistancia, type ShippingZone } from '@/lib/shipping-config'

export interface ItemCarritoServer {
  id?: string
  name?: string
  title?: string
  garmentType?: string
  color?: string
  size?: string
  price?: number
  unit_price?: number
  quantity?: number
}

export interface ItemMP {
  id: string
  title: string
  quantity: number
  unit_price: number
  description?: string
}

/** Id de la línea de envío en los ítems de MP (la arma el server). */
export const MP_SHIPPING_ID = 'shipping'

function precio(it: ItemCarritoServer): number {
  const p = Number(it.price ?? it.unit_price ?? 0)
  return Number.isFinite(p) && p > 0 ? p : 0
}

function cantidad(it: ItemCarritoServer): number {
  const q = Math.floor(Number(it.quantity ?? 1))
  return Number.isFinite(q) && q > 0 ? q : 1
}

/** Suma de los productos (sin la línea de envío si viniera mezclada). */
export function subtotalServer(items: ItemCarritoServer[]): number {
  return items
    .filter((it) => it && it.id !== MP_SHIPPING_ID)
    .reduce((sum, it) => sum + precio(it) * cantidad(it), 0)
}

/** Envío por distancia con el CP; la zona sólo pesa si no hay CP legible. */
export function envioServer(subtotal: number, postalCode: unknown, zona: unknown): number {
  const z: ShippingZone = zona === 'RESTO' ? 'RESTO' : 'BA'
  return envioPorDistancia(subtotal, typeof postalCode === 'string' ? postalCode : null, z).costo
}

/** Ítems de producto para la preferencia de MP, armados desde el carrito. */
export function itemsMPDesdeCarrito(items: ItemCarritoServer[]): ItemMP[] {
  return items
    .filter((it) => it && it.id !== MP_SHIPPING_ID)
    .map((it, i) => {
      const detalle = [it.color, it.size ? `Talle ${it.size}` : ''].filter(Boolean).join(' · ')
      return {
        id: String(it.id || `item-${i + 1}`).slice(0, 120),
        title: String(it.name || it.title || it.garmentType || 'Producto').slice(0, 250),
        quantity: cantidad(it),
        unit_price: precio(it),
        ...(detalle ? { description: detalle.slice(0, 250) } : {}),
      }
    })
}

/** Línea de envío para MP (no se agrega si es gratis: MP no acepta $0). */
export function itemMPEnvio(costo: number): ItemMP[] {
  return costo > 0 ? [{ id: MP_SHIPPING_ID, title: 'Envío', quantity: 1, unit_price: costo, description: 'Costo de envío' }] : []
}

/** Lo que cobra MP por una lista de ítems. */
export function totalItemsMP(items: { unit_price: number; quantity: number }[]): number {
  return items.reduce((sum, it) => sum + it.unit_price * it.quantity, 0)
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * Tienda(s) partner del carrito. Antes el pedido tomaba el tenant del PRIMER
 * ítem de partner; en un carrito mixto (dos tiendas, o tienda + web propia)
 * eso es arbitrario. Ahora: `principal` = la tienda con más monto en el
 * carrito (empate → la primera que aparece) y `todos` = todas, para
 * orders.metadata.tenant_ids. La plata no depende de esto: el ledger acredita
 * cada ítem al dueño de su producto (lib/partners/ledger.ts).
 */
export function tenantsDelCarrito(items: Array<ItemCarritoServer & { tenantId?: unknown }>): { principal: string | null; todos: string[] } {
  const monto = new Map<string, number>()
  for (const it of items || []) {
    const t = typeof it?.tenantId === 'string' && UUID.test(it.tenantId) ? it.tenantId : null
    if (!t) continue
    monto.set(t, (monto.get(t) || 0) + precio(it) * cantidad(it))
  }
  const todos = [...monto.keys()]
  let principal: string | null = null
  for (const t of todos) if (principal === null || monto.get(t)! > monto.get(principal)!) principal = t
  return { principal, todos }
}
