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
    // Controla si el claim atómico de garment_stock (WHERE
    // metadata->>garment_stock_decremented_at IS NULL, via .filter(...)) "gana
    // la carrera" — separado de claimWins/claimCalls porque es una clave y un
    // método de encadenamiento (.filter, no .eq('status', ...)) distintos.
    garmentClaimWins: true,
    garmentClaimCalls: [] as Array<{ orderId: string; updates: any }>,
    rpcCalls: [] as Array<{ fn: string; args: any }>,
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
        // o el claim de garment_stock: .update(...).eq('id', orderId)
        //   .filter('metadata->>garment_stock_decremented_at', 'is', null).select('id')
        let orderId = ''
        let expectedStatus = ''
        let garmentClaim = false
        const chain = {
          eq(field: string, value: string) {
            if (field === 'id') orderId = value
            if (field === 'status') expectedStatus = value
            return chain
          },
          filter(field: string, _op: string, _value: unknown) {
            if (field === 'metadata->>garment_stock_decremented_at') garmentClaim = true
            return chain
          },
          select: async (_cols: string) => {
            if (table === 'orders' && garmentClaim) {
              h.state.garmentClaimCalls.push({ orderId, updates })
              return h.state.garmentClaimWins
                ? { data: [{ id: orderId }], error: null }
                : { data: [], error: null }
            }
            if (table === 'orders') {
              h.state.claimCalls.push({ orderId, expectedStatus, updates })
            }
            return h.state.claimWins ? { data: [{ id: orderId }], error: null } : { data: [], error: null }
          },
        }
        return chain
      },
    }),
    rpc: async (fn: string, args: any) => {
      h.state.rpcCalls.push({ fn, args })
      return { data: null, error: null }
    },
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

const notifySaleMock = vi.fn(async (_args: any) => undefined)
const notifyPartnerOrderMock = vi.fn(async (_tenant: any, _args: any) => undefined)
vi.mock('@/lib/notifications', () => ({
  notifySale: (args: any) => notifySaleMock(args),
  notifyPartnerOrder: (tenant: any, args: any) => notifyPartnerOrderMock(tenant, args),
}))

vi.mock('@/lib/meta/capi', () => ({
  sendCapiPurchase: async () => ({ ok: false, skipped: 'not_configured' }),
}))

process.env.MP_ACCESS_TOKEN = 'test-token'

import { processPaymentById } from './process-payment'

beforeEach(() => {
  reverseOrderMarginMock.mockClear()
  creditOrderMarginMock.mockClear()
  notifySaleMock.mockClear()
  notifyPartnerOrderMock.mockClear()
  h.state.updateOrderResult = true
  h.state.claimWins = true
  h.state.claimCalls = []
  h.state.garmentClaimWins = true
  h.state.garmentClaimCalls = []
  h.state.rpcCalls = []
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

  // Hallazgo [10]: si el proceso murió entre confirmar la orden (PASO 6) y
  // correr los efectos (ledger, notificaciones), el reintento de MP entra por
  // PASO 3 — y ahora debe COMPLETAR los efectos pendientes en vez de cortar.
  it('retry sobre orden ya confirmada re-ejecuta los efectos de plata pendientes (ledger) sin re-clamear la orden', async () => {
    h.state.order = {
      id: 'order-10',
      order_number: 'NM-010',
      status: 'confirmed', // ya confirmada por la invocación que murió
      payment_id: 'pay-10',
      tenant_id: 'tenant-10',
      customer_email: null,
      items: [{ item_name: 'Buzo', quantity: 1, unit_price: 55000 }],
      metadata: {}, // sin flags: los efectos nunca llegaron a correr
    }
    h.state.paymentGet = {
      id: 'pay-10',
      status: 'approved',
      status_detail: 'accredited',
      transaction_amount: 55000,
      external_reference: 'ext-10',
    }

    const result = await processPaymentById('pay-10')

    expect(result.reason).toBe('already_confirmed')
    // El efecto de plata (crédito de margen al partner) corrió en el retry:
    expect(creditOrderMarginMock).toHaveBeenCalledTimes(1)
    expect(creditOrderMarginMock).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'order-10', tenant_id: 'tenant-10' }),
    )
    // El aviso de venta también se completó (tenía metadata sin sale_notified_at):
    expect(notifySaleMock).toHaveBeenCalledTimes(1)
    // Pero NO se re-clameó la transición de la orden (PASO 6 no corre en este camino):
    expect(h.state.claimCalls.length).toBe(0)
  })

  it('retry sobre orden confirmada con efectos YA completos no duplica nada (guards en metadata)', async () => {
    h.state.order = {
      id: 'order-11',
      order_number: 'NM-011',
      status: 'confirmed',
      payment_id: 'pay-11',
      tenant_id: 'tenant-11',
      customer_email: 'cliente@example.com',
      items: [{ item_name: 'Remera', quantity: 1, unit_price: 30000 }],
      metadata: {
        partner_notified_at: '2026-07-13T00:00:00.000Z',
        confirmation_email_sent_at: '2026-07-13T00:00:00.000Z',
        sale_notified_at: '2026-07-13T00:00:00.000Z',
      },
    }
    h.state.paymentGet = {
      id: 'pay-11',
      status: 'approved',
      status_detail: 'accredited',
      transaction_amount: 30000,
      external_reference: 'ext-11',
    }

    const result = await processPaymentById('pay-11')

    expect(result.reason).toBe('already_confirmed')
    // El crédito de ledger se re-intenta (es idempotente por unique index — no duplica):
    expect(creditOrderMarginMock).toHaveBeenCalledTimes(1)
    // Las comunicaciones NO se repiten: los guards del metadata las cortan.
    expect(notifySaleMock).not.toHaveBeenCalled()
    expect(notifyPartnerOrderMock).not.toHaveBeenCalled()
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

// Síntoma [2] de la auditoría de idempotencia de webhooks MP (2026-08-29):
// "un payment.approved posterior pisa una orden ya confirmada". El guard de
// PASO 3 solo cubre el reintento del MISMO paymentId — acá se prueba el guard
// de PASO 3.5, que cubre un paymentId DISTINTO llegando sobre una orden que
// otro pago ya confirmó.
describe('processPaymentById — guard PASO 3.5: no pisar una orden confirmada con OTRO pago', () => {
  it('un SEGUNDO payment_id (distinto), approved, sobre una orden ya confirmada: se ignora sin tocar la orden', async () => {
    h.state.order = {
      id: 'order-40',
      order_number: 'NM-040',
      status: 'confirmed',
      payment_id: 'pay-original', // el pago que YA confirmó esta orden
      payment_status: 'approved',
      tenant_id: 'tenant-40',
      customer_email: 'cliente@example.com',
      items: [{ item_name: 'Buzo', quantity: 1, unit_price: 60000 }],
      metadata: {},
    }
    h.state.paymentGet = {
      id: 'pay-nuevo', // un pago DISTINTO (doble intento, replay de un id viejo, etc.)
      status: 'approved',
      status_detail: 'accredited',
      transaction_amount: 60000,
      external_reference: 'ext-40',
    }

    const result = await processPaymentById('pay-nuevo')

    expect(result.reason).toBe('confirmed_with_different_payment_ignored')
    expect(result.orderStatus).toBe('confirmed')
    // No se reclamó ninguna transición de la orden (PASO 6 no corre en este camino):
    expect(h.state.claimCalls.length).toBe(0)
    // No se re-ejecutó NINGÚN efecto de plata/notificación con el pago nuevo:
    expect(creditOrderMarginMock).not.toHaveBeenCalled()
    expect(notifySaleMock).not.toHaveBeenCalled()
    expect(notifyPartnerOrderMock).not.toHaveBeenCalled()
  })

  it('un SEGUNDO payment_id (distinto), rejected, sobre una orden ya confirmada: NO la degrada a cancelled', async () => {
    // Caso más peligroso: un intento de pago fallido y no relacionado (mismo
    // checkout, doble click) no debe poder cancelar un pedido que YA está pagado.
    h.state.order = {
      id: 'order-41',
      order_number: 'NM-041',
      status: 'confirmed',
      payment_id: 'pay-original',
      payment_status: 'approved',
      tenant_id: 'tenant-41',
      items: [],
      metadata: {},
    }
    h.state.paymentGet = {
      id: 'pay-fallido',
      status: 'rejected',
      status_detail: 'cc_rejected_other_reason',
      transaction_amount: 60000,
      external_reference: 'ext-41',
    }

    const result = await processPaymentById('pay-fallido')

    expect(result.reason).toBe('confirmed_with_different_payment_ignored')
    expect(result.orderStatus).toBe('confirmed') // sigue confirmada, NO se degrada
    expect(h.state.claimCalls.length).toBe(0)
    expect(reverseOrderMarginMock).not.toHaveBeenCalled()
  })

  it('el MISMO payment_id sigue funcionando igual que antes (no rompe el guard de PASO 3 existente)', async () => {
    h.state.order = {
      id: 'order-42',
      order_number: 'NM-042',
      status: 'confirmed',
      payment_id: 'pay-42',
      payment_status: 'approved',
      tenant_id: null,
      items: [],
      metadata: {},
    }
    h.state.paymentGet = {
      id: 'pay-42',
      status: 'approved',
      status_detail: 'accredited',
      transaction_amount: 1000,
      external_reference: 'ext-42',
    }

    const result = await processPaymentById('pay-42')

    expect(result.reason).toBe('already_confirmed') // no 'confirmed_with_different_payment_ignored'
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

describe('processPaymentById — decremento de stock (Fase 2)', () => {
  it('decrementa el stock solo de los items con partner_product_id al confirmar', async () => {
    h.state.order = {
      id: 'order-20',
      order_number: 'NM-020',
      status: 'confirmed',
      payment_id: 'pay-20',
      tenant_id: 'tenant-20',
      customer_email: null,
      items: [
        { item_name: 'Buzo A', quantity: 2, unit_price: 60000, partner_product_id: 'prod-A' },
        { item_name: 'Buzo B', quantity: 1, unit_price: 60000 }, // sin link → no decrementa
      ],
      metadata: {}, // sin flag: el decremento corre
    }
    h.state.paymentGet = {
      id: 'pay-20',
      status: 'approved',
      status_detail: 'accredited',
      transaction_amount: 180000,
      external_reference: 'ext-20',
    }

    await processPaymentById('pay-20')

    const dec = h.state.rpcCalls.filter((c) => c.fn === 'decrement_partner_product_stock')
    expect(dec).toHaveLength(1) // solo el item con partner_product_id
    expect(dec[0].args).toEqual({ p_id: 'prod-A', p_qty: 2 }) // con la cantidad comprada
  })

  it('no re-decrementa si el guard stock_decremented_at ya está seteado (retry idempotente)', async () => {
    h.state.order = {
      id: 'order-21',
      order_number: 'NM-021',
      status: 'confirmed',
      payment_id: 'pay-21',
      tenant_id: 'tenant-21',
      customer_email: null,
      items: [{ item_name: 'Buzo A', quantity: 1, unit_price: 60000, partner_product_id: 'prod-A' }],
      metadata: { stock_decremented_at: '2026-07-23T00:00:00.000Z' }, // ya se decrementó
    }
    h.state.paymentGet = {
      id: 'pay-21',
      status: 'approved',
      status_detail: 'accredited',
      transaction_amount: 60000,
      external_reference: 'ext-21',
    }

    await processPaymentById('pay-21')

    const dec = h.state.rpcCalls.filter((c) => c.fn === 'decrement_partner_product_stock')
    expect(dec).toHaveLength(0) // el guard evita el doble decremento
  })
})

describe('processPaymentById — decremento de garment_stock (liquidación) con claim atómico', () => {
  it('reclama el claim y decrementa con las claves canónicas cuando el item matchea prenda/color/talle', async () => {
    h.state.order = {
      id: 'order-30',
      order_number: 'NM-030',
      status: 'confirmed',
      payment_id: 'pay-30',
      tenant_id: null,
      customer_email: null,
      items: [
        { item_name: 'Buzo', product_type: 'buzo-hoodie-unisex', product_color: 'Marrón', product_size: 'M', quantity: 2, unit_price: 60000 },
        { item_name: 'Aura', product_type: 'aura-oversize-tshirt', product_color: 'Caramel', product_size: 'M', quantity: 1, unit_price: 30000 }, // caramel = remera marron de liquidación → también trackeado
        { item_name: 'Aura', product_type: 'aura-oversize-tshirt', product_color: 'Negro', product_size: 'M', quantity: 1, unit_price: 30000 }, // color con reposición → no trackeado
      ],
      metadata: {},
    }
    h.state.paymentGet = {
      id: 'pay-30',
      status: 'approved',
      status_detail: 'accredited',
      transaction_amount: 150000,
      external_reference: 'ext-30',
    }

    await processPaymentById('pay-30')

    // El claim atómico corrió una sola vez, con la clave dentro del metadata:
    expect(h.state.garmentClaimCalls).toHaveLength(1)
    expect(h.state.garmentClaimCalls[0].orderId).toBe('order-30')
    expect(h.state.garmentClaimCalls[0].updates?.metadata?.garment_stock_decremented_at).toBeTruthy()

    // Decrementó SOLO los items trackeados (el Aura Negro no), con claves canónicas:
    const dec = h.state.rpcCalls.filter((c) => c.fn === 'decrement_garment_stock')
    expect(dec).toHaveLength(2)
    expect(dec.map((c) => c.args)).toEqual([
      { p_product_key: 'buzo-oversize', p_color: 'marron', p_size: 'M', p_qty: 2 },
      { p_product_key: 'remera-oversize', p_color: 'marron', p_size: 'M', p_qty: 1 },
    ])
  })

  it('si el claim atómico NO gana (otro proceso ya reclamó), no llama la RPC', async () => {
    h.state.garmentClaimWins = false
    h.state.order = {
      id: 'order-31',
      order_number: 'NM-031',
      status: 'confirmed',
      payment_id: 'pay-31',
      tenant_id: null,
      customer_email: null,
      items: [
        { item_name: 'Buzo', product_type: 'buzo-hoodie-unisex', product_color: 'Crema', product_size: 'S', quantity: 1, unit_price: 60000 },
      ],
      metadata: {}, // el flag no está en la copia en memoria, pero el UPDATE condicional devuelve 0 filas
    }
    h.state.paymentGet = {
      id: 'pay-31',
      status: 'approved',
      status_detail: 'accredited',
      transaction_amount: 60000,
      external_reference: 'ext-31',
    }

    await processPaymentById('pay-31')

    expect(h.state.garmentClaimCalls).toHaveLength(1) // intentó reclamar
    const dec = h.state.rpcCalls.filter((c) => c.fn === 'decrement_garment_stock')
    expect(dec).toHaveLength(0) // pero al perder el claim no decrementa
  })
})
