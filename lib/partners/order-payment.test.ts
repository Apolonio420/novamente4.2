import { describe, expect, it } from 'vitest'
import { isPartnerOrderPaid, partnerOrderPayment } from './order-payment'

describe('partnerOrderPayment — el pago se deduce de status (partner_orders no tiene payment_status)', () => {
  it.each(['confirmed', 'producing', 'shipped', 'delivered'])('%s → pagado', (status) => {
    expect(partnerOrderPayment({ status })).toBe('paid')
    expect(isPartnerOrderPaid({ status })).toBe(true)
  })

  it('pending → pendiente, aunque traiga payment_id', () => {
    expect(partnerOrderPayment({ status: 'pending' })).toBe('pending')
    expect(partnerOrderPayment({ status: 'pending', payment_id: 'mp-123' })).toBe('pending')
  })

  it('cancelled → cancelado (no cuenta como venta)', () => {
    expect(partnerOrderPayment({ status: 'cancelled', payment_id: 'mp-123' })).toBe('cancelled')
    expect(isPartnerOrderPaid({ status: 'cancelled', payment_id: 'mp-123' })).toBe(false)
  })

  it('exception: pagado solo si viene de una venta bridgeada (payment_id)', () => {
    expect(partnerOrderPayment({ status: 'exception', payment_id: 'transfer:NOV-20260926-9852' })).toBe('paid')
    expect(partnerOrderPayment({ status: 'exception', payment_id: null })).toBe('pending')
  })

  it('venta web bridgeada por sale-effects (status confirmed, sin payment_status) → pagado', () => {
    const bridged = { status: 'confirmed', payment_id: 'transfer:NOV-20260926-9852', shipping_info: { source: 'web' } }
    expect(isPartnerOrderPaid(bridged)).toBe(true)
  })

  it('status desconocido o vacío → pendiente', () => {
    expect(partnerOrderPayment({ status: null })).toBe('pending')
    expect(partnerOrderPayment({})).toBe('pending')
  })
})
