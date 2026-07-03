import { describe, it, expect, beforeEach, vi } from 'vitest'

// Hallazgo #5(a): el guard de idempotencia en PASO 3 no debe cortar en seco
// cuando MP reenvía el mismo paymentId con un status fresco distinto de
// "approved" (p.ej. "refunded"). Estos tests mockean toda la superficie de
// processPaymentById (MP SDK, db, email, ledger) para verificar el guard
// específicamente, sin depender de infraestructura real.

const h = vi.hoisted(() => {
  const state = {
    paymentGet: null as any,
    order: null as any,
    updateOrderResult: true,
  }
  return { state }
})

vi.mock('mercadopago', () => {
  class Payment {
    async get() {
      return h.state.paymentGet
    }
    async search() {
      return { results: [] }
    }
  }
  class MercadoPagoConfig {
    constructor(_opts: any) {}
  }
  return { Payment, MercadoPagoConfig }
})

vi.mock('@/lib/db', () => ({
  getOrderByExternalReference: async () => h.state.order,
  updateOrder: async () => h.state.updateOrderResult,
}))

vi.mock('@/lib/supabase-admin', () => ({
  supabaseAdmin: {
    from: () => ({
      upsert: async () => ({ error: null }),
      select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null }) }) }),
    }),
  },
}))

const reverseOrderMarginMock = vi.fn(async (_order: any) => ({ reversed: true, amount: 20000 }))
const creditOrderMarginMock = vi.fn(async (_order: any) => ({ margin: 0, needsReview: false }))
vi.mock('@/lib/partners/ledger', () => ({
  creditOrderMargin: (order: any) => creditOrderMarginMock(order),
  reverseOrderMargin: (order: any) => reverseOrderMarginMock(order),
}))

vi.mock('@/lib/email', () => ({
  sendEmail: async () => ({ ok: true }),
}))

process.env.MP_ACCESS_TOKEN = 'test-token'

import { processPaymentById } from './process-payment'

beforeEach(() => {
  reverseOrderMarginMock.mockClear()
  creditOrderMarginMock.mockClear()
  h.state.updateOrderResult = true
})

describe('processPaymentById — guard de idempotencia PASO 3', () => {
  it('salta como already_confirmed cuando MP sigue reportando "approved"', async () => {
    h.state.order = {
      id: 'order-1',
      order_number: 'NM-001',
      status: 'confirmed',
      payment_id: 'pay-1',
      tenant_id: null,
      items: [],
    }
    h.state.paymentGet = {
      id: 'pay-1',
      status: 'approved',
      status_detail: 'accredited',
      transaction_amount: 1000,
      external_reference: 'ext-1',
    }

    const result = await processPaymentById('pay-1')

    expect(result.reason).toBe('already_confirmed')
    expect(reverseOrderMarginMock).not.toHaveBeenCalled()
  })

  it('NO corta en already_confirmed cuando MP ahora reporta "refunded" para el mismo paymentId, y revierte el margen', async () => {
    h.state.order = {
      id: 'order-1',
      order_number: 'NM-001',
      status: 'confirmed',
      payment_id: 'pay-1', // mismo payment_id que ya estaba confirmado
      tenant_id: 'tenant-1',
      items: [],
      metadata: {},
    }
    h.state.paymentGet = {
      id: 'pay-1',
      status: 'refunded', // MP reenvía el mismo pago, ahora reembolsado
      status_detail: 'refunded',
      transaction_amount: 1000,
      external_reference: 'ext-1',
    }

    const result = await processPaymentById('pay-1')

    expect(result.reason).not.toBe('already_confirmed')
    expect(result.orderStatus).toBe('cancelled')
    expect(result.paymentStatus).toBe('refunded')
    expect(reverseOrderMarginMock).toHaveBeenCalledTimes(1)
    expect(reverseOrderMarginMock).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'order-1', tenant_id: 'tenant-1' }),
    )
  })

  it('mapea "charged_back" a orderStatus cancelled y también revierte el margen', async () => {
    h.state.order = {
      id: 'order-2',
      order_number: 'NM-002',
      status: 'confirmed',
      payment_id: 'pay-2',
      tenant_id: 'tenant-2',
      items: [],
      metadata: {},
    }
    h.state.paymentGet = {
      id: 'pay-2',
      status: 'charged_back',
      status_detail: 'charged_back',
      transaction_amount: 2000,
      external_reference: 'ext-2',
    }

    const result = await processPaymentById('pay-2')

    expect(result.orderStatus).toBe('cancelled')
    expect(result.paymentStatus).toBe('charged_back')
    expect(reverseOrderMarginMock).toHaveBeenCalledTimes(1)
  })
})
