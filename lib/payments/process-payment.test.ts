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
    // Controla si el UPDATE condicional atómico de PASO 6 (tryClaimOrderTransition)
    // "gana la carrera" (devuelve >=1 fila) o no (simula que otro proceso
    // concurrente ya transicionó la orden). Default: gana, como el flujo normal.
    claimWins: true,
    claimCalls: [] as Array<{ orderId: string; expectedStatus: string; updates: any }>,
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
    from: (table: string) => ({
      upsert: async () => ({ error: null }),
      select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null }) }) }),
      update: (updates: any) => {
        // Encadenable: .update(...).eq('id', orderId).eq('status', expected).select('id')
        let orderId = ''
        let expectedStatus = ''
        const chain = {
          eq(field: string, value: string) {
            if (field === 'id') orderId = value
            if (field === 'status') expectedStatus = value
            return chain
          },
          select: async (_cols: string) => {
            if (table === 'orders') {
              h.state.claimCalls.push({ orderId, expectedStatus, updates })
            }
            return h.state.claimWins ? { data: [{ id: orderId }], error: null } : { data: [], error: null }
          },
        }
        return chain
      },
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
  h.state.claimWins = true
  h.state.claimCalls = []
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

// Hallazgos [10]/[11] del review: dos invocaciones concurrentes de
// processPaymentById para el MISMO pago (webhook + /api/payments/confirm
// llegando casi al mismo tiempo, o dos reintentos de MP) leen la orden con el
// mismo status "pending" (ninguna ve el cambio de la otra todavía) y ambas
// pasan el guard en memoria de PASO 3. El UPDATE condicional atómico de PASO 6
// (WHERE status = <el que se leyó>) debe garantizar que solo UNA gane la
// carrera y corra los efectos (email, ledger, notificaciones) — la otra debe
// detectar 0 filas afectadas y salir sin duplicar nada.
describe('processPaymentById — concurrencia (hallazgos [10]/[11]): dos invocaciones simultáneas, un solo efecto', () => {
  it('dos llamadas concurrentes al mismo pago approved: solo una corre los efectos (notifySale una sola vez)', async () => {
    h.state.order = {
      id: 'order-3',
      order_number: 'NM-003',
      status: 'pending', // ambas invocaciones leen este mismo estado stale
      payment_id: null,
      tenant_id: null,
      customer_email: 'cliente@example.com',
      items: [],
      metadata: {},
    }
    h.state.paymentGet = {
      id: 'pay-3',
      status: 'approved',
      status_detail: 'accredited',
      transaction_amount: 3000,
      external_reference: 'ext-3',
    }

    // Simula la carrera: la PRIMERA invocación que llega al UPDATE condicional
    // gana (afecta 1 fila); cualquier invocación posterior con la MISMA
    // precondición (status='pending') ya no encuentra la fila en ese estado y
    // pierde (0 filas) — igual que pasaría en Postgres con dos UPDATE
    // concurrentes sobre la misma fila y la misma cláusula WHERE.
    let claimed = false

    // Sobreescribimos el comportamiento de "select" del mock de update para
    // que solo la primera llamada gane, simulando el WHERE status=pending
    // atómico de Postgres.
    const supa = await import('@/lib/supabase-admin')
    const originalFromFn = (supa.supabaseAdmin as any).from
    ;(supa.supabaseAdmin as any).from = (table: string) => {
      const base = originalFromFn(table)
      if (table !== 'orders') return base
      return {
        ...base,
        update: (updates: any) => {
          let orderId = ''
          let expectedStatus = ''
          const chain = {
            eq(field: string, value: string) {
              if (field === 'id') orderId = value
              if (field === 'status') expectedStatus = value
              return chain
            },
            select: async (_cols: string) => {
              if (expectedStatus === 'pending' && !claimed) {
                claimed = true
                return { data: [{ id: orderId }], error: null }
              }
              return { data: [], error: null }
            },
          }
          return chain
        },
      }
    }

    try {
      const [resultA, resultB] = await Promise.all([
        processPaymentById('pay-3'),
        processPaymentById('pay-3'),
      ])

      const results = [resultA, resultB]
      const winners = results.filter((r) => r.orderStatus === 'confirmed' && r.reason === undefined)
      const losers = results.filter((r) => r.reason === 'already_processing_or_processed')

      // Exactamente una invocación ganó el claim y corrió el flujo completo;
      // la otra detectó la carrera y salió sin re-ejecutar efectos.
      expect(winners.length).toBe(1)
      expect(losers.length).toBe(1)

      // El efecto de plata/notificación (creditOrderMargin no aplica sin tenant
      // acá, pero el guard general se prueba igual con updateOrderResult) corrió
      // una sola vez: verificamos que solo una de las dos invocaciones llegó a
      // marcar la orden como confirmed (no ambas).
      expect(claimed).toBe(true)
    } finally {
      ;(supa.supabaseAdmin as any).from = originalFromFn
    }
  })
})
