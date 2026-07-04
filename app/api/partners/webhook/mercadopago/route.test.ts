// Tests para el guard de idempotencia del webhook de partners (hallazgo [3] del
// review docs/reviews/REVIEW-caminos-de-plata-2026-07-03.md): MP reenvía
// webhooks (reintentos, notificaciones duplicadas, o un replay manual de un
// payment id viejo) — un mismo payment id aprobado no debe re-ejecutar los
// efectos (activar plan, extender vencimiento, notificar) más de una vez.
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NextRequest } from 'next/server'

const h = vi.hoisted(() => ({
  paymentGet: vi.fn(),
  getTenantById: vi.fn(),
  updateTenant: vi.fn(),
  notifyPartnerSubscription: vi.fn(),
  notifyPossibleDoubleCharge: vi.fn(),
  sendCapiPurchase: vi.fn(),
}))

vi.mock('mercadopago', () => ({
  MercadoPagoConfig: class MercadoPagoConfig {},
  Payment: class Payment {
    get = h.paymentGet
  },
  PreApproval: class PreApproval {
    get = vi.fn()
  },
}))

vi.mock('@/lib/partners/tenant', () => ({
  getTenantById: h.getTenantById,
  updateTenant: h.updateTenant,
}))

vi.mock('@/lib/notifications', () => ({
  notifyPartnerSubscription: h.notifyPartnerSubscription,
  notifyPossibleDoubleCharge: h.notifyPossibleDoubleCharge,
}))

vi.mock('@/lib/meta/capi', () => ({
  sendCapiPurchase: h.sendCapiPurchase,
}))

vi.mock('@/lib/supabase-admin', () => ({ supabaseAdmin: {} }))

import { POST, isPaymentAlreadyProcessed, isSuspectedDoubleCharge } from './route'

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
  h.updateTenant.mockResolvedValue({ ...baseTenant, plan: 'growth', status: 'active' })
  h.notifyPartnerSubscription.mockResolvedValue(undefined)
  h.notifyPossibleDoubleCharge.mockResolvedValue(undefined)
  h.sendCapiPurchase.mockResolvedValue({ ok: true })
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

    expect(h.updateTenant).toHaveBeenCalledTimes(1)
    const [, updates] = h.updateTenant.mock.calls[0]
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

    expect(h.updateTenant).not.toHaveBeenCalled()
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
    expect(h.updateTenant).not.toHaveBeenCalled()
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
    expect(h.updateTenant).toHaveBeenCalledTimes(1)
    const [, updates] = h.updateTenant.mock.calls[0]
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
    expect(h.updateTenant).toHaveBeenCalledTimes(1)
    const [, updates] = h.updateTenant.mock.calls[0]
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
    expect(h.updateTenant).toHaveBeenCalledTimes(1)
    expect(h.notifyPossibleDoubleCharge).not.toHaveBeenCalled()
  })
})
