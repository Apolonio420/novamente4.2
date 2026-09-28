/**
 * Estado de pago de un pedido de tienda partner (`partner_orders`).
 *
 * `partner_orders` NO tiene columna `payment_status` en prod: la declaraba
 * migrations/create_partner_orders_table.sql pero la tabla en vivo nunca la
 * tuvo (select → 42703, insert/update → PGRST204). El pago se deduce de
 * `status`: el bridge de ventas web (lib/partners/sale-effects.ts) inserta el
 * pedido ya 'confirmed' y recién con el pago aprobado; los cargados a mano
 * arrancan 'pending' hasta que se confirman.
 *
 * Módulo puro (sin supabase) para poder usarlo también desde componentes cliente.
 */

export const PAID_PARTNER_ORDER_STATUSES = ['confirmed', 'producing', 'shipped', 'delivered'] as const

export type PartnerOrderPayment = 'paid' | 'pending' | 'cancelled'

export function partnerOrderPayment(order: {
  status?: string | null
  payment_id?: string | null
}): PartnerOrderPayment {
  const status = order.status ?? ''
  if ((PAID_PARTNER_ORDER_STATUSES as readonly string[]).includes(status)) return 'paid'
  if (status === 'cancelled') return 'cancelled'
  // 'exception' puede venir de un pedido pagado (incidencia de envío) o de uno
  // que nunca se pagó. Solo las ventas bridgeadas post-pago traen payment_id.
  if (status === 'exception' && order.payment_id) return 'paid'
  return 'pending'
}

export function isPartnerOrderPaid(order: { status?: string | null; payment_id?: string | null }): boolean {
  return partnerOrderPayment(order) === 'paid'
}
