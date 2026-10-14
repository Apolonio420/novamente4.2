// Tests para el guard de idempotencia del webhook de partners (hallazgo [3] del
// review docs/reviews/REVIEW-caminos-de-plata-2026-07-03.md): MP reenvía
// webhooks (reintentos, notificaciones duplicadas, o un replay manual de un
// payment id viejo) — un mismo payment id aprobado no debe re-ejecutar los
// efectos (activar plan, extender vencimiento, notificar) más de una vez.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { NextRequest } from 'next/server'

const h = vi.hoisted(() => ({
  paymentGet: vi.fn(),
  preapprovalGet: vi.fn(),
  getTenantById: vi.fn(),
  notifyPartnerSubscription: vi.fn(),
  notifyPossibleDoubleCharge: vi.fn(),
  notifySubscriptionActivatedEmails: vi.fn(),
  sendCapiPurchase: vi.fn(),
  // activateRecurringTenant/registerRecurringCharge (lib/partners/subscription.ts)
  // escriben directo con `db()` = supabaseAdmin, no con updateTenant.
  tenantsUpdate: vi.fn(),
  // Resultado devuelto por `.from('tenants').select(...).eq(...).single()` —
  // usado por handleAuthorizedPaymentEvent (busca el tenant por
  // mp_subscription_id) y por registerRecurringCharge (lee subscription_expires_at
  // + metadata). Configurable por test; default abajo en beforeEach.
  tenantsSelectSingleResult: null as any,
  // Error devuelto por el UPDATE a tenants (null = OK). Auditoría 08/10.
  tenantsUpdateError: null as any,
  notifyError: vi.fn(),
}))

vi.mock('mercadopago', () => ({
  MercadoPagoConfig: class MercadoPagoConfig {},
  Payment: class Payment {
    get = h.paymentGet
  },
  PreApproval: class PreApproval {
    get = h.preapprovalGet
  },
}))

vi.mock('@/lib/partners/tenant', () => ({
  getTenantById: h.getTenantById,
}))

vi.mock('@/lib/notifications', () => ({
  notifyPartnerSubscription: h.notifyPartnerSubscription,
  notifyPossibleDoubleCharge: h.notifyPossibleDoubleCharge,
  notifySubscriptionActivatedEmails: h.notifySubscriptionActivatedEmails,
  notifyError: h.notifyError,
  escapeTelegramHtml: (s: string) => s,
}))

vi.mock('@/lib/meta/capi', () => ({
  sendCapiPurchase: h.sendCapiPurchase,
}))

vi.mock('@/lib/supabase-admin', () => ({
  supabaseAdmin: {
    from: (table: string) => {
      if (table === 'tenants') {
        return {
          update: (updates: any) => {
            h.tenantsUpdate(updates)
            // Encadenable (compare-and-swap de subscription.ts: .eq().eq()/.is().select()) y
            // awaitable; con .select() devuelve la fila escrita (1 fila = el UPDATE matcheó).
            const q: any = {
              eq: () => q,
              is: () => q,
              select: () => ({ ...q, single: async () => ({ data: null }), then: (res: any, rej: any) => Promise.resolve({ data: [{ id: 't' }], error: h.tenantsUpdateError }).then(res, rej) }),
              then: (res: any, rej: any) => Promise.resolve({ error: h.tenantsUpdateError }).then(res, rej),
            }
            return q
          },
          select: () => ({
            eq: () => ({
              // activateRecurringTenant relee la fila fresca: sin resultado explícito, el tenant del test (getTenantById).
              single: async () => ({ data: h.tenantsSelectSingleResult ?? (await h.getTenantById()) ?? { subscription_expires_at: null } }),
              maybeSingle: async () => ({ data: null }),
            }),
          }),
        }
      }
      return {
        select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null }) }) }),
      }
    },
  },
}))

import { POST } from './route'
import { isPaymentAlreadyProcessed, isSuspectedDoubleCharge, isAuthorizedPaymentAlreadyProcessed } from '@/lib/partners/webhook-guards'

function webhookRequest(paymentId: string) {
  return new NextRequest('http://localhost/api/partners/webhook/mercadopago', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ type: 'payment', data: { id: paymentId } }),
  })
}

const baseTenant = {
  id: 'tenant-1',
  name: 'Marca Test',
  slug: 'marca-test',
  email: 'partner@example.com',
  plan: 'starter',
  metadata: {},
  subscription_started_at: null,
}

beforeEach(() => {
  vi.clearAllMocks()
  process.env.MP_ACCESS_TOKEN = 'test-token'
  h.notifyPartnerSubscription.mockResolvedValue(undefined)
  h.notifyPossibleDoubleCharge.mockResolvedValue(undefined)
  h.notifySubscriptionActivatedEmails.mockResolvedValue(undefined)
  h.sendCapiPurchase.mockResolvedValue({ ok: true })
  h.tenantsSelectSingleResult = null
  h.tenantsUpdateError = null
  h.notifyError.mockResolvedValue(undefined)
})

describe('isPaymentAlreadyProcessed (unidad)', () => {
  it('sin metadata previa → no procesado', () => {
    expect(isPaymentAlreadyProcessed(null, '123')).toBe(false)
    expect(isPaymentAlreadyProcessed({}, '123')).toBe(false)
  })
  it('mismo payment id ya registrado → procesado', () => {
    expect(isPaymentAlreadyProcessed({ last_mp_payment_id: '123' }, '123')).toBe(true)
  })
  it('payment id distinto → no procesado', () => {
    expect(isPaymentAlreadyProcessed({ last_mp_payment_id: '123' }, '456')).toBe(false)
  })
})

describe('POST /api/partners/webhook/mercadopago — idempotencia de payment aprobado', () => {
  const externalReference = 'partner_sub_tenant-1_1751500000000_monthly_growth'

  it('primer webhook approved: corre los efectos y persiste last_mp_payment_id', async () => {
    h.getTenantById.mockResolvedValue({ ...baseTenant })
    h.paymentGet.mockResolvedValue({
      id: 'payment-1',
      status: 'approved',
      external_reference: externalReference,
      transaction_amount: 25000,
    })

    const res = await POST(webhookRequest('payment-1'))
    expect(res.status).toBe(200)

    expect(h.tenantsUpdate).toHaveBeenCalledTimes(1)
    const [updates] = h.tenantsUpdate.mock.calls[0]
    expect(updates.metadata.last_mp_payment_id).toBe('payment-1')
    expect(updates.status).toBe('active')
    expect(h.notifyPartnerSubscription).toHaveBeenCalledTimes(1)
  })

  it('MP reenvía el MISMO payment id (retry): no re-ejecuta efectos, corta con 200', async () => {
    // El tenant ya tiene este payment id marcado como procesado (efecto del webhook anterior).
    h.getTenantById.mockResolvedValue({ ...baseTenant, metadata: { last_mp_payment_id: 'payment-1' } })
    h.paymentGet.mockResolvedValue({
      id: 'payment-1',
      status: 'approved',
      external_reference: externalReference,
      transaction_amount: 25000,
    })

    const res = await POST(webhookRequest('payment-1'))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.already_processed).toBe(true)

    expect(h.tenantsUpdate).not.toHaveBeenCalled()
    expect(h.notifyPartnerSubscription).not.toHaveBeenCalled()
    expect(h.sendCapiPurchase).not.toHaveBeenCalled()
  })

  it('replay de un payment id VIEJO de otro ciclo ya consumido: no reactiva ni extiende gratis', async () => {
    // Escenario del hallazgo [3]: alguien reenvía el POST con un id de un pago
    // de meses atrás que ya fue aplicado — no debe re-otorgar el período.
    h.getTenantById.mockResolvedValue({ ...baseTenant, metadata: { last_mp_payment_id: 'payment-jan' } })
    h.paymentGet.mockResolvedValue({
      id: 'payment-jan',
      status: 'approved',
      external_reference: externalReference,
      transaction_amount: 25000,
    })

    const res = await POST(webhookRequest('payment-jan'))
    expect(res.status).toBe(200)
    expect(h.tenantsUpdate).not.toHaveBeenCalled()
  })

  it('un SEGUNDO payment id distinto y aprobado sí corre los efectos (no es replay)', async () => {
    h.getTenantById.mockResolvedValue({ ...baseTenant, metadata: { last_mp_payment_id: 'payment-1' } })
    h.paymentGet.mockResolvedValue({
      id: 'payment-2',
      status: 'approved',
      external_reference: externalReference,
      transaction_amount: 25000,
    })

    const res = await POST(webhookRequest('payment-2'))
    expect(res.status).toBe(200)
    expect(h.tenantsUpdate).toHaveBeenCalledTimes(1)
    const [updates] = h.tenantsUpdate.mock.calls[0]
    expect(updates.metadata.last_mp_payment_id).toBe('payment-2')
  })
})

// Hallazgo [18] del review: un payment id DISTINTO llega aprobado mientras la
// suscripción todavía está vigente (no vencida) → sospecha de doble cobro con
// dos ids de MP para el mismo período. El pago se procesa NORMAL (no se
// bloquea); además se dispara una alerta de Telegram con ambos ids/fechas.
describe('isSuspectedDoubleCharge (unidad)', () => {
  const now = '2026-07-15T00:00:00.000Z'
  it('sin pago previo registrado → no es sospecha', () => {
    expect(isSuspectedDoubleCharge({ metadata: {}, subscription_expires_at: '2026-08-01T00:00:00.000Z' }, 'p2', now)).toBe(false)
  })
  it('mismo payment id (sería el guard de idempotencia, no doble cobro) → no es sospecha', () => {
    expect(isSuspectedDoubleCharge({ metadata: { last_mp_payment_id: 'p1' }, subscription_expires_at: '2026-08-01T00:00:00.000Z' }, 'p1', now)).toBe(false)
  })
  it('payment id distinto, período TODAVÍA vigente (no vencido) → sospecha de doble cobro', () => {
    expect(isSuspectedDoubleCharge({ metadata: { last_mp_payment_id: 'p1' }, subscription_expires_at: '2026-08-01T00:00:00.000Z' }, 'p2', now)).toBe(true)
  })
  it('payment id distinto, pero el período YA VENCIÓ (renovación normal) → no es sospecha', () => {
    expect(isSuspectedDoubleCharge({ metadata: { last_mp_payment_id: 'p1' }, subscription_expires_at: '2026-06-01T00:00:00.000Z' }, 'p2', now)).toBe(false)
  })
  it('sin subscription_expires_at (alta nueva) → no es sospecha', () => {
    expect(isSuspectedDoubleCharge({ metadata: { last_mp_payment_id: 'p1' }, subscription_expires_at: null }, 'p2', now)).toBe(false)
  })
})

describe('POST /api/partners/webhook/mercadopago — alerta de doble cobro', () => {
  const externalReference = 'partner_sub_tenant-1_1751500000000_monthly_growth'

  // "Período activo" se evalúa contra new Date() en la ruta: fijamos el reloj
  // para que los fixtures (vigente hasta 2026-08-20 / vencido en 2026-02-20)
  // no caduquen con el calendario real. Solo Date: los timers/promesas quedan reales.
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2026-07-15T00:00:00.000Z'))
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('payment id distinto dentro del período activo: procesa el pago normal Y alerta por Telegram con ambos ids/fechas', async () => {
    const tenant = {
      ...baseTenant,
      metadata: { last_mp_payment_id: 'payment-old' },
      last_payment_at: '2026-06-20T10:00:00.000Z',
      subscription_expires_at: '2026-08-20T10:00:00.000Z', // todavía vigente
    }
    h.getTenantById.mockResolvedValue(tenant)
    h.paymentGet.mockResolvedValue({
      id: 'payment-new',
      status: 'approved',
      external_reference: externalReference,
      transaction_amount: 25000,
    })

    const res = await POST(webhookRequest('payment-new'))
    expect(res.status).toBe(200)

    // (a) el pago se procesa normal — no se bloquea el flujo de activación.
    expect(h.tenantsUpdate).toHaveBeenCalledTimes(1)
    const [updates] = h.tenantsUpdate.mock.calls[0]
    expect(updates.status).toBe('active')
    expect(updates.metadata.last_mp_payment_id).toBe('payment-new')

    // (b) la alerta se dispara con tenant, monto, ambos ids y ambas fechas.
    expect(h.notifyPossibleDoubleCharge).toHaveBeenCalledTimes(1)
    expect(h.notifyPossibleDoubleCharge).toHaveBeenCalledWith({
      tenantName: tenant.name,
      amountArs: 25000,
      previousPaymentId: 'payment-old',
      newPaymentId: 'payment-new',
      previousPaymentDate: '2026-06-20T10:00:00.000Z',
      newPaymentDate: expect.any(String),
    })
  })

  it('payment id distinto pero el período YA VENCIÓ (renovación legítima): no alerta', async () => {
    const tenant = {
      ...baseTenant,
      metadata: { last_mp_payment_id: 'payment-old' },
      last_payment_at: '2026-01-20T10:00:00.000Z',
      subscription_expires_at: '2026-02-20T10:00:00.000Z', // ya venció
    }
    h.getTenantById.mockResolvedValue(tenant)
    h.paymentGet.mockResolvedValue({
      id: 'payment-renewal',
      status: 'approved',
      external_reference: externalReference,
      transaction_amount: 25000,
    })

    const res = await POST(webhookRequest('payment-renewal'))
    expect(res.status).toBe(200)
    expect(h.tenantsUpdate).toHaveBeenCalledTimes(1)
    expect(h.notifyPossibleDoubleCharge).not.toHaveBeenCalled()
  })
})

// Hallazgo [15] del review: eventos `subscription_preapproval` espurios o
// repetidos (bump de monto del cron, reintento/duplicado de notificación de
// MP) sobre un preapproval que YA está activo no deben re-ejecutar
// activateRecurringTenant — eso extendería subscription_expires_at y
// refrescaría last_payment_at sin que haya un cobro real detrás.
describe('POST /api/partners/webhook/mercadopago — subscription_preapproval no re-dispara activación sin cobro', () => {
  const preapprovalId = 'preapproval-abc'
  const externalReference = `partner_sub_tenant-1_1751500000000_monthly`

  function preapprovalWebhookRequest(id: string) {
    return new NextRequest('http://localhost/api/partners/webhook/mercadopago', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ type: 'subscription_preapproval', data: { id } }),
    })
  }

  it('alta nueva (tenant no activo en este preapproval): SÍ activa el plan, SIN sumar mes (lo suma el primer cobro)', async () => {
    h.getTenantById.mockResolvedValue({
      ...baseTenant,
      status: 'onboarding',
      mp_subscription_id: null,
      subscription_expires_at: null,
    })
    h.preapprovalGet.mockResolvedValue({
      id: preapprovalId,
      status: 'authorized',
      external_reference: externalReference,
      auto_recurring: { transaction_amount: 25000 },
    })

    const res = await POST(preapprovalWebhookRequest(preapprovalId))
    expect(res.status).toBe(200)
    expect(h.tenantsUpdate).toHaveBeenCalledTimes(1)
    const [updates] = h.tenantsUpdate.mock.calls[0]
    expect(updates.status).toBe('active')
    // El primer cobro REEMPLAZA esta gracia (no suma encima): ver recurring-un-mes-por-cobro.test.ts.
    // Sin vencimiento futuro: hoy + 1 mes marcado como gracia de activación.
    expect(updates.subscription_expires_at).toBeTruthy()
    expect(updates.metadata.expiry_is_activation_grace).toBe(true)
    // Hallazgo [9]: tras un authorized real, activateRecurringTenant deja
    // subscription_type en 'recurring' (nunca 'recurring_pending').
    expect(updates.metadata.subscription_type).toBe('recurring')
  })

  // Hallazgo [9] + interacción con [15]: un tenant YA 'active' pide un upgrade
  // mensual. persistPendingSubscription ya actualizó mp_subscription_id al
  // preapproval NUEVO, pero metadata.subscription_type quedó en
  // 'recurring_pending' (MP todavía no autorizó). El primer 'authorized' de
  // ese preapproval nuevo debe activar el plan — si acá dijera 'recurring' (el
  // bug de antes del fix), isGenuinePreapprovalActivation lo descartaría como
  // espurio y MP debitaría sin que el plan se aplique nunca.
  it('upgrade de tenant activo con checkout mensual recién creado (recurring_pending, mismo preapproval): SÍ activa el plan nuevo', async () => {
    h.getTenantById.mockResolvedValue({
      ...baseTenant,
      status: 'active',
      mp_subscription_id: preapprovalId,
      metadata: { subscription_type: 'recurring_pending', pending_plan: 'pro' },
      subscription_expires_at: '2026-08-01T00:00:00.000Z',
      last_payment_at: '2026-07-01T00:00:00.000Z',
    })
    h.preapprovalGet.mockResolvedValue({
      id: preapprovalId,
      status: 'authorized',
      external_reference: externalReference,
      auto_recurring: { transaction_amount: 50000 },
    })

    const res = await POST(preapprovalWebhookRequest(preapprovalId))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.skipped).toBeUndefined()

    expect(h.tenantsUpdate).toHaveBeenCalledTimes(1)
    const [updates] = h.tenantsUpdate.mock.calls[0]
    expect(updates.status).toBe('active')
    expect(updates.metadata.subscription_type).toBe('recurring')
    expect(h.notifyPartnerSubscription).toHaveBeenCalledTimes(1)
  })

  it('evento repetido/espurio sobre preapproval YA activo (ej. bump de monto del cron): NO re-activa ni extiende', async () => {
    const nowExpiry = '2026-08-01T00:00:00.000Z'
    h.getTenantById.mockResolvedValue({
      ...baseTenant,
      status: 'active',
      mp_subscription_id: preapprovalId,
      metadata: { subscription_type: 'recurring' },
      subscription_expires_at: nowExpiry,
      last_payment_at: '2026-07-01T00:00:00.000Z',
    })
    h.preapprovalGet.mockResolvedValue({
      id: preapprovalId,
      status: 'authorized', // MP sigue reportando "authorized" — no es un alta, es un update sobre lo mismo
      external_reference: externalReference,
      auto_recurring: { transaction_amount: 50000 }, // ej. el propio bump de monto
    })

    const res = await POST(preapprovalWebhookRequest(preapprovalId))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.skipped).toBe('already_active_on_preapproval')

    // No debe haber tocado el tenant: ni extendido vencimiento, ni refrescado
    // last_payment_at, ni notificado una "nueva" activación.
    expect(h.tenantsUpdate).not.toHaveBeenCalled()
    expect(h.tenantsUpdate).not.toHaveBeenCalled()
    expect(h.notifyPartnerSubscription).not.toHaveBeenCalled()
  })

  it('reactivación tras cancelled (mismo preapproval, tenant no activo): SÍ activa de nuevo', async () => {
    h.getTenantById.mockResolvedValue({
      ...baseTenant,
      status: 'suspended',
      mp_subscription_id: preapprovalId,
      metadata: { subscription_type: 'cancelled' },
      subscription_expires_at: '2026-05-01T00:00:00.000Z',
    })
    h.preapprovalGet.mockResolvedValue({
      id: preapprovalId,
      status: 'authorized',
      external_reference: externalReference,
      auto_recurring: { transaction_amount: 25000 },
    })

    const res = await POST(preapprovalWebhookRequest(preapprovalId))
    expect(res.status).toBe(200)
    expect(h.tenantsUpdate).toHaveBeenCalledTimes(1)
  })
})

// Síntoma [1] de la auditoría de idempotencia de webhooks MP (2026-08-29):
// "webhook duplicado de suscripción = mes gratis". A diferencia de
// subscription_preapproval (isGenuinePreapprovalActivation, ya cubierto arriba)
// y del pago único (isPaymentAlreadyProcessed), el cobro recurrente mensual
// (subscription_authorized_payment → registerRecurringCharge) no tenía NINGÚN
// guard: un reenvío del mismo authorized_payment id extendía
// subscription_expires_at otra vez sin que hubiera un segundo cobro real.
describe('isAuthorizedPaymentAlreadyProcessed (unidad)', () => {
  it('sin metadata previa → no procesado', () => {
    expect(isAuthorizedPaymentAlreadyProcessed(null, 'ap-1')).toBe(false)
    expect(isAuthorizedPaymentAlreadyProcessed({}, 'ap-1')).toBe(false)
  })
  it('mismo authorized_payment id ya registrado → procesado', () => {
    expect(isAuthorizedPaymentAlreadyProcessed({ last_mp_authorized_payment_id: 'ap-1' }, 'ap-1')).toBe(true)
  })
  it('authorized_payment id distinto (mes siguiente) → no procesado', () => {
    expect(isAuthorizedPaymentAlreadyProcessed({ last_mp_authorized_payment_id: 'ap-1' }, 'ap-2')).toBe(false)
  })
})

describe('POST /api/partners/webhook/mercadopago — subscription_authorized_payment (cobro recurrente mensual)', () => {
  function authorizedPaymentWebhookRequest(id: string) {
    return new NextRequest('http://localhost/api/partners/webhook/mercadopago', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ type: 'subscription_authorized_payment', data: { id } }),
    })
  }

  const preapprovalId = 'preapproval-recurring-1'

  function mockAuthorizedPaymentFetch(opts: { approved: boolean }) {
    global.fetch = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        preapproval_id: preapprovalId,
        payment: { status: opts.approved ? 'approved' : 'rejected' },
        status: opts.approved ? 'processed' : 'rejected',
      }),
    })) as any
  }

  it('primer cobro recurrente aprobado: extiende vencimiento y persiste el authorized_payment id', async () => {
    mockAuthorizedPaymentFetch({ approved: true })
    h.tenantsSelectSingleResult = {
      id: 'tenant-1',
      name: 'Marca Test',
      metadata: {},
      subscription_expires_at: '2026-07-29T00:00:00.000Z',
      payment_failures: 1,
    }

    const res = await POST(authorizedPaymentWebhookRequest('ap-aug'))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.already_processed).toBeUndefined()

    // registerRecurringCharge hace 1 solo UPDATE a tenants (lee con .single(),
    // escribe con .update()) — el guard de arriba no debe haber cortado.
    expect(h.tenantsUpdate).toHaveBeenCalledTimes(1)
    const [updates] = h.tenantsUpdate.mock.calls[0]
    expect(updates.status).toBe('active')
    expect(updates.payment_failures).toBe(0)
    expect(updates.metadata.last_mp_authorized_payment_id).toBe('ap-aug')
    expect(new Date(updates.subscription_expires_at).getTime()).toBeGreaterThan(
      new Date('2026-07-29T00:00:00.000Z').getTime(),
    )
  })

  it('MP reenvía el MISMO authorized_payment id (retry/duplicado): NO vuelve a extender — no regala un mes gratis', async () => {
    mockAuthorizedPaymentFetch({ approved: true })
    const expiresBefore = '2026-08-29T00:00:00.000Z'
    h.tenantsSelectSingleResult = {
      id: 'tenant-1',
      name: 'Marca Test',
      // Ya procesamos este mismo id en un webhook anterior (efecto de la
      // invocación previa que sí llegó a registerRecurringCharge).
      metadata: { last_mp_authorized_payment_id: 'ap-aug' },
      subscription_expires_at: expiresBefore,
      payment_failures: 0,
    }

    const res = await POST(authorizedPaymentWebhookRequest('ap-aug'))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.already_processed).toBe(true)

    // No debe haber tocado el tenant en absoluto: ni extendido vencimiento
    // (mes gratis), ni refrescado last_payment_at.
    expect(h.tenantsUpdate).not.toHaveBeenCalled()
  })

  it('cobro del MES SIGUIENTE con un authorized_payment id distinto: SÍ extiende de nuevo (no es un duplicado)', async () => {
    mockAuthorizedPaymentFetch({ approved: true })
    h.tenantsSelectSingleResult = {
      id: 'tenant-1',
      name: 'Marca Test',
      metadata: { last_mp_authorized_payment_id: 'ap-aug' }, // procesado el mes pasado
      subscription_expires_at: '2026-08-29T00:00:00.000Z',
      payment_failures: 0,
    }

    const res = await POST(authorizedPaymentWebhookRequest('ap-sep'))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.already_processed).toBeUndefined()

    expect(h.tenantsUpdate).toHaveBeenCalledTimes(1)
    const [updates] = h.tenantsUpdate.mock.calls[0]
    expect(updates.metadata.last_mp_authorized_payment_id).toBe('ap-sep')
  })

  it('cobro recurrente RECHAZADO: suma una falla, no toca la idempotencia del guard aprobado', async () => {
    mockAuthorizedPaymentFetch({ approved: false })
    h.tenantsSelectSingleResult = {
      id: 'tenant-1',
      name: 'Marca Test',
      metadata: {},
      subscription_expires_at: '2026-08-29T00:00:00.000Z',
      payment_failures: 0,
    }

    const res = await POST(authorizedPaymentWebhookRequest('ap-failed'))
    expect(res.status).toBe(200)

    // El camino rechazado escribe por CAS (registerPaymentFailure, `db()` directo); el route ya no usa updateTenant.
    expect(h.tenantsUpdate).toHaveBeenCalledTimes(1)
    const [updates] = h.tenantsUpdate.mock.calls[0]
    expect(updates.payment_failures).toBe(1)
    expect(updates.metadata.mp_failed_payment_ids).toEqual(['ap-failed'])
    expect(updates.metadata.last_mp_payment_id).toBeUndefined()
  })
})

// Auditoría workspace partner 08/10: un cobro aprobado que no se pudo aplicar
// al tenant respondía 200 (MP no reintentaba) y solo dejaba un console.error.
describe('POST /api/partners/webhook/mercadopago — cobro aprobado que no se pudo aplicar', () => {
  const externalReference = 'partner_sub_tenant-1_1751500000000_monthly_growth'

  function preapprovalRequest(id: string) {
    return new NextRequest('http://localhost/api/partners/webhook/mercadopago', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ type: 'subscription_preapproval', data: { id } }),
    })
  }
  function authorizedPaymentRequest(id: string) {
    return new NextRequest('http://localhost/api/partners/webhook/mercadopago', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ type: 'subscription_authorized_payment', data: { id } }),
    })
  }
  function mockApprovedAuthorizedPayment() {
    global.fetch = vi.fn(async () => ({
      ok: true,
      json: async () => ({ preapproval_id: 'preapproval-x', payment: { status: 'approved' }, status: 'processed' }),
    })) as any
  }

  it('pago único: si el UPDATE por CAS falla → 500 (MP reintenta) + alerta urgente, sin avisos de venta', async () => {
    h.getTenantById.mockResolvedValue({ ...baseTenant })
    h.paymentGet.mockResolvedValue({ id: 'p-1', status: 'approved', external_reference: externalReference, transaction_amount: 25000 })
    h.tenantsUpdateError = { message: 'db caida' }

    const res = await POST(webhookRequest('p-1'))
    expect(res.status).toBe(500)
    expect(h.notifyError).toHaveBeenCalledTimes(1)
    expect(h.notifyError.mock.calls[0][0]).toMatchObject({ urgent: true, dedupeKey: 'mp-partner-unapplied:p-1' })
    expect(h.notifyPartnerSubscription).not.toHaveBeenCalled()
    expect(h.sendCapiPurchase).not.toHaveBeenCalled()
  })

  it('pago único: el reintento de MP después de la falla activa exactamente una vez', async () => {
    h.getTenantById.mockResolvedValue({ ...baseTenant })
    h.paymentGet.mockResolvedValue({ id: 'p-2', status: 'approved', external_reference: externalReference, transaction_amount: 25000 })
    h.tenantsUpdateError = { message: 'db caida' }
    expect((await POST(webhookRequest('p-2'))).status).toBe(500)

    // El UPDATE fallido no escribió last_mp_payment_id → el guard deja pasar el reintento.
    h.tenantsUpdateError = null
    expect((await POST(webhookRequest('p-2'))).status).toBe(200)
    expect(h.notifyPartnerSubscription).toHaveBeenCalledTimes(1)

    // Un tercer reenvío, ya con la marca escrita, no re-aplica.
    h.getTenantById.mockResolvedValue({ ...baseTenant, metadata: { last_mp_payment_id: 'p-2' } })
    const third = await POST(webhookRequest('p-2'))
    expect((await third.json()).already_processed).toBe(true)
    expect(h.tenantsUpdate).toHaveBeenCalledTimes(2)
  })

  it('pago único aprobado de un tenant que no aparece → 500 + alerta (no se descarta la plata)', async () => {
    h.getTenantById.mockResolvedValue(null)
    h.paymentGet.mockResolvedValue({ id: 'p-3', status: 'approved', external_reference: externalReference, transaction_amount: 25000 })
    const res = await POST(webhookRequest('p-3'))
    expect(res.status).toBe(500)
    expect(h.notifyError).toHaveBeenCalledTimes(1)
  })

  it('pago único NO aprobado de un tenant que no aparece → 200 sin alerta (como antes)', async () => {
    h.getTenantById.mockResolvedValue(null)
    h.paymentGet.mockResolvedValue({ id: 'p-4', status: 'rejected', external_reference: externalReference, transaction_amount: 25000 })
    const res = await POST(webhookRequest('p-4'))
    expect(res.status).toBe(200)
    expect(h.notifyError).not.toHaveBeenCalled()
  })

  it('si no se puede leer el pago en MP → 500 para que reintente', async () => {
    h.paymentGet.mockRejectedValue(new Error('MP timeout'))
    const res = await POST(webhookRequest('p-5'))
    expect(res.status).toBe(500)
    expect(h.tenantsUpdate).not.toHaveBeenCalled()
  })

  it('preapproval authorized: si el UPDATE falla → 500 + alerta, sin avisos de alta', async () => {
    h.getTenantById.mockResolvedValue({ ...baseTenant, status: 'onboarding', mp_subscription_id: null, subscription_expires_at: null })
    h.preapprovalGet.mockResolvedValue({ id: 'pre-1', status: 'authorized', external_reference: 'partner_sub_tenant-1_1751500000000_monthly', auto_recurring: { transaction_amount: 25000 } })
    h.tenantsUpdateError = { message: 'connection reset' }

    const res = await POST(preapprovalRequest('pre-1'))
    expect(res.status).toBe(500)
    expect(h.notifyError).toHaveBeenCalledTimes(1)
    expect(h.notifyError.mock.calls[0][0].message).toContain('connection reset')
    expect(h.notifyPartnerSubscription).not.toHaveBeenCalled()
    expect(h.notifySubscriptionActivatedEmails).not.toHaveBeenCalled()
  })

  it('cobro recurrente: si el UPDATE falla → 500 + alerta; el reintento lo aplica una sola vez', async () => {
    mockApprovedAuthorizedPayment()
    h.tenantsSelectSingleResult = { id: 'tenant-1', name: 'Marca Test', metadata: { foo: 'bar' }, subscription_expires_at: '2026-07-29T00:00:00.000Z', payment_failures: 0 }
    h.tenantsUpdateError = { message: 'timeout' }
    expect((await POST(authorizedPaymentRequest('ap-1'))).status).toBe(500)
    expect(h.notifyError).toHaveBeenCalledTimes(1)

    h.tenantsUpdateError = null
    expect((await POST(authorizedPaymentRequest('ap-1'))).status).toBe(200)
    const lastUpdate = h.tenantsUpdate.mock.calls.at(-1)![0]
    expect(lastUpdate.metadata).toEqual({ foo: 'bar', last_mp_authorized_payment_id: 'ap-1', mp_authorized_payment_ids: ['ap-1'] })
  })

  it('cobro recurrente: si la consulta a MP falla → 500 y no toca el tenant', async () => {
    global.fetch = vi.fn(async () => { throw new Error('ECONNRESET') }) as any
    const res = await POST(authorizedPaymentRequest('ap-2'))
    expect(res.status).toBe(500)
    expect(h.tenantsUpdate).not.toHaveBeenCalled()
  })

  it('cobro recurrente: MP responde HTTP 500 → 500 (reintento)', async () => {
    global.fetch = vi.fn(async () => ({ ok: false, status: 500, json: async () => ({}) })) as any
    expect((await POST(authorizedPaymentRequest('ap-3'))).status).toBe(500)
  })

  it('cobro recurrente: consultado OK pero sin preapproval → 200 (no es de partner)', async () => {
    global.fetch = vi.fn(async () => ({ ok: true, json: async () => ({ preapproval_id: null, status: 'processed' }) })) as any
    expect((await POST(authorizedPaymentRequest('ap-4'))).status).toBe(200)
  })

  it('preapproval authorized con tenant no encontrado (blip de DB) → 500 + alerta', async () => {
    h.getTenantById.mockResolvedValue(null)
    h.preapprovalGet.mockResolvedValue({ id: 'pre-2', status: 'authorized', external_reference: 'partner_sub_tenant-1_1751500000000_monthly' })
    const res = await POST(preapprovalRequest('pre-2'))
    expect(res.status).toBe(500)
    expect(h.notifyError).toHaveBeenCalledTimes(1)
  })

  it('preapproval cancelled con tenant no encontrado → 200 sin alerta', async () => {
    h.getTenantById.mockResolvedValue(null)
    h.preapprovalGet.mockResolvedValue({ id: 'pre-3', status: 'cancelled', external_reference: 'partner_sub_tenant-1_1751500000000_monthly' })
    expect((await POST(preapprovalRequest('pre-3'))).status).toBe(200)
    expect(h.notifyError).not.toHaveBeenCalled()
  })

  // Clasificación de fallas de MP: 400/404 no se reintentan, 401/403 alertan, el resto reintenta.
  const mpErr = (status: number) => Object.assign(new Error(`MP ${status}`), { status })

  it('payment.get 404 → 200 (id ajeno/inexistente), sin alerta ni reintento', async () => {
    h.paymentGet.mockRejectedValue(mpErr(404))
    expect((await POST(webhookRequest('p-404'))).status).toBe(200)
    expect(h.notifyError).not.toHaveBeenCalled()
  })

  it('payment.get 401 → 500 + alerta Urgente con dedupeKey global mp-partner-token', async () => {
    h.paymentGet.mockRejectedValue(mpErr(401))
    expect((await POST(webhookRequest('p-401'))).status).toBe(500)
    expect(h.notifyError).toHaveBeenCalledTimes(1)
    expect(h.notifyError.mock.calls[0][0]).toMatchObject({ urgent: true, dedupeKey: 'mp-partner-token' })
  })

  it('payment.get 429 y 503 → 500 sin alerta (MP reintenta)', async () => {
    for (const st of [429, 503]) {
      h.paymentGet.mockRejectedValue(mpErr(st))
      expect((await POST(webhookRequest('p-x'))).status).toBe(500)
    }
    expect(h.notifyError).not.toHaveBeenCalled()
  })

  it('preapproval.get 404 → 200; 403 → 500 + alerta global; 502 → 500 sin alerta', async () => {
    h.preapprovalGet.mockRejectedValue(mpErr(404))
    expect((await POST(preapprovalRequest('pre-404'))).status).toBe(200)
    expect(h.notifyError).not.toHaveBeenCalled()

    h.preapprovalGet.mockRejectedValue(mpErr(403))
    expect((await POST(preapprovalRequest('pre-403'))).status).toBe(500)
    expect(h.notifyError.mock.calls[0][0]).toMatchObject({ urgent: true, dedupeKey: 'mp-partner-token' })

    h.notifyError.mockClear()
    h.preapprovalGet.mockRejectedValue(mpErr(502))
    expect((await POST(preapprovalRequest('pre-502'))).status).toBe(500)
    expect(h.notifyError).not.toHaveBeenCalled()
  })

  it('authorized_payment HTTP 404 → 200; 401 → 500 + alerta global; 500 → 500 sin alerta', async () => {
    global.fetch = vi.fn(async () => ({ ok: false, status: 404, json: async () => ({}) })) as any
    expect((await POST(authorizedPaymentRequest('ap-404'))).status).toBe(200)
    expect(h.tenantsUpdate).not.toHaveBeenCalled()
    expect(h.notifyError).not.toHaveBeenCalled()

    global.fetch = vi.fn(async () => ({ ok: false, status: 401, json: async () => ({}) })) as any
    expect((await POST(authorizedPaymentRequest('ap-401'))).status).toBe(500)
    expect(h.notifyError.mock.calls[0][0]).toMatchObject({ urgent: true, dedupeKey: 'mp-partner-token' })

    h.notifyError.mockClear()
    global.fetch = vi.fn(async () => ({ ok: false, status: 500, json: async () => ({}) })) as any
    expect((await POST(authorizedPaymentRequest('ap-500'))).status).toBe(500)
    expect(h.notifyError).not.toHaveBeenCalled()
  })

  it('texto de la alerta de cobro sin aplicar: no invita a activar a mano sin la marca de idempotencia', async () => {
    h.getTenantById.mockResolvedValue({ ...baseTenant })
    h.paymentGet.mockResolvedValue({ id: 'p-t', status: 'approved', external_reference: externalReference, transaction_amount: 25000 })
    h.tenantsUpdateError = { message: 'db caida' }
    await POST(webhookRequest('p-t'))
    const msg: string = h.notifyError.mock.calls[0][0].message
    expect(msg).toContain('last_mp_authorized_payment_id')
    expect(msg).toContain('OTRO mes')
    expect(msg).not.toContain('activar el plan a mano')
  })
})
