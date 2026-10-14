// Invariante del camino de plata de suscripciones recurrentes: UN cobro de MP
// = UN mes de subscription_expires_at, exactamente una vez, sin importar el
// orden de los eventos (alta `subscription_preapproval`, cobro
// `subscription_authorized_payment`, `payment` del mismo cobro) ni los
// reintentos. Antes el alta sumaba 1 mes y el primer authorized_payment
// sumaba OTRO (2 meses por 1 cobro), y el evento `payment` (que MP manda con el
// mismo external_reference del preapproval) lo volvía a sumar por el flujo de
// pago único.
//
// Test de flujo completo con un tenant en memoria (no mocks por llamada) para
// que cualquier orden/combinación de eventos pase por el estado real.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { NextRequest } from 'next/server'

const h = vi.hoisted(() => ({
  paymentGet: vi.fn(),
  preapprovalGet: vi.fn(),
  store: { tenant: null as any },
  notifyError: vi.fn(async () => {}),
}))

vi.mock('mercadopago', () => ({
  MercadoPagoConfig: class MercadoPagoConfig {},
  Payment: class Payment { get = h.paymentGet },
  PreApproval: class PreApproval { get = h.preapprovalGet },
}))

vi.mock('@/lib/partners/tenant', () => ({
  getTenantById: async () => (h.store.tenant ? { ...h.store.tenant } : null),
  updateTenant: async (_id: string, updates: any) => {
    h.store.tenant = { ...h.store.tenant, ...updates }
    return { ...h.store.tenant }
  },
}))

vi.mock('@/lib/notifications', () => ({
  notifyPartnerSubscription: async () => {},
  notifyPossibleDoubleCharge: async () => {},
  notifySubscriptionActivatedEmails: async () => {},
  notifyError: h.notifyError,
  escapeTelegramHtml: (s: string) => s,
}))
vi.mock('@/lib/meta/capi', () => ({ sendCapiPurchase: async () => ({ ok: true }) }))

// Tenant en memoria con UPDATE condicional (compare-and-swap), ver fake-tenants-db.
vi.mock('@/lib/supabase-admin', async () => {
  const m = await import('@/lib/partners/test-helpers/fake-tenants-db')
  return { supabaseAdmin: m.createFakeSupabase(h.store) }
})

import { POST } from './route'
import { addMonths } from '@/lib/partners/subscription'

const T0 = '2026-10-13T12:00:00.000Z'
const PREAPPROVAL = 'preapproval-1'
const REF = 'partner_sub_tenant-1_1760000000000_monthly'

function ev(type: string, id: string) {
  return new NextRequest('http://localhost/api/partners/webhook/mercadopago', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ type, data: { id } }),
  })
}
const alta = () => POST(ev('subscription_preapproval', PREAPPROVAL))
const cobro = (apId: string) => POST(ev('subscription_authorized_payment', apId))
const pago = (payId: string) => POST(ev('payment', payId))

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date(T0))
  process.env.MP_ACCESS_TOKEN = 'test-token'
  // Tenant que hizo el checkout mensual: persistPendingSubscription ya dejó el preapproval.
  h.store.tenant = {
    id: 'tenant-1', name: 'Marca Test', slug: 'marca-test', email: 'p@example.com',
    plan: 'starter', status: 'onboarding', billing_cycle: 'monthly',
    mp_subscription_id: PREAPPROVAL, subscription_expires_at: null, subscription_started_at: null,
    payment_failures: 0,
    metadata: { subscription_type: 'recurring_pending', pending_plan: 'growth' },
  }
  h.preapprovalGet.mockResolvedValue({ id: PREAPPROVAL, status: 'authorized', external_reference: REF, auto_recurring: { transaction_amount: 25000 } })
  h.paymentGet.mockImplementation(async ({ id }: any) => ({ id, status: 'approved', external_reference: REF, transaction_amount: 25000, operation_type: 'recurring_payment' }))
  // authorized_payment `ap-N` ↔ payment `pay-N`
  global.fetch = vi.fn(async (url: string) => {
    const apId = String(url).split('/').pop()!
    return { ok: true, json: async () => ({ preapproval_id: PREAPPROVAL, payment: { id: apId.replace('ap-', 'pay-'), status: 'approved' }, status: 'processed' }) }
  }) as any
})
afterEach(() => vi.useRealTimers())

const unMes = addMonths(T0, 1)
const dosMeses = addMonths(unMes, 1)

describe('un authorized_payment de MP = un mes, sin importar orden ni reintentos', () => {
  it('alta → primer cobro: 1 mes (no 2)', async () => {
    await alta()
    await cobro('ap-1')
    expect(h.store.tenant.subscription_expires_at).toBe(unMes)
    expect(h.store.tenant.plan).toBe('growth')
    expect(h.store.tenant.metadata.subscription_type).toBe('recurring')
  })

  it('primer cobro → alta: 1 mes (no 2) y el plan queda activo', async () => {
    await cobro('ap-1')
    await alta()
    expect(h.store.tenant.subscription_expires_at).toBe(unMes)
    expect(h.store.tenant.plan).toBe('growth')
    expect(h.store.tenant.status).toBe('active')
  })

  it('reintentos de alta y de cobro (ambos órdenes): sigue en 1 mes', async () => {
    await alta(); await alta(); await cobro('ap-1'); await cobro('ap-1'); await alta()
    expect(h.store.tenant.subscription_expires_at).toBe(unMes)
    h.store.tenant.subscription_expires_at = null
    h.store.tenant.metadata = { subscription_type: 'recurring_pending', pending_plan: 'growth' }
    h.store.tenant.status = 'onboarding'
    await cobro('ap-1'); await alta(); await cobro('ap-1'); await alta()
    expect(h.store.tenant.subscription_expires_at).toBe(unMes)
  })

  it('cobro del mes siguiente (otro authorized_payment id): suma exactamente 1 más', async () => {
    await alta(); await cobro('ap-1')
    await cobro('ap-2'); await cobro('ap-2')
    expect(h.store.tenant.subscription_expires_at).toBe(dosMeses)
  })

  it('evento payment del MISMO cobro (external_reference partner_sub_..._monthly) no suma otro mes', async () => {
    await alta(); await cobro('ap-1'); await pago('pay-1'); await pago('pay-1')
    expect(h.store.tenant.subscription_expires_at).toBe(unMes)
  })

  it('payment antes del alta y del cobro: tampoco suma por el flujo de pago único', async () => {
    await pago('pay-1'); await alta(); await cobro('ap-1'); await pago('pay-1')
    expect(h.store.tenant.subscription_expires_at).toBe(unMes)
  })

  it('payment → cobro → alta (cualquier permutación): 1 mes', async () => {
    await pago('pay-1'); await cobro('ap-1'); await alta()
    expect(h.store.tenant.subscription_expires_at).toBe(unMes)
  })

  it('el pago ANUAL (pago único, external_reference ..._annual_<plan>) sigue sumando 12 meses', async () => {
    h.store.tenant.metadata = {}
    h.store.tenant.mp_subscription_id = null
    h.paymentGet.mockResolvedValue({ id: 'pay-a', status: 'approved', external_reference: 'partner_sub_tenant-1_1760000000000_annual_growth', transaction_amount: 250000 })
    await pago('pay-a')
    expect(h.store.tenant.subscription_expires_at).toBe(addMonths(T0, 12))
  })

  it('alta con vencimiento ya futuro (el cobro llegó antes): no lo toca ni marca gracia', async () => {
    await cobro('ap-1')
    await alta()
    expect(h.store.tenant.metadata.expiry_is_activation_grace).toBeUndefined()
    expect(h.store.tenant.subscription_expires_at).toBe(unMes)
  })

  it('alta sola nunca deja el vencimiento en null: hoy + 1 mes con marca de gracia', async () => {
    await alta()
    expect(h.store.tenant.subscription_expires_at).toBe(unMes)
    expect(h.store.tenant.metadata.expiry_is_activation_grace).toBe(true)
    await cobro('ap-1')
    expect(h.store.tenant.metadata.expiry_is_activation_grace).toBeUndefined()
  })

  it('primer cobro 10 días después del alta: el mes cuenta desde el cobro, no se suma a la gracia', async () => {
    await alta()
    vi.setSystemTime(new Date('2026-10-23T12:00:00.000Z'))
    await cobro('ap-1')
    expect(h.store.tenant.subscription_expires_at).toBe(addMonths('2026-10-23T12:00:00.000Z', 1))
  })

  it('payment _monthly con operation_type recurring_payment se corta (200, sin alerta)', async () => {
    await alta(); await cobro('ap-1')
    const res = await pago('pay-1')
    expect((await res.json()).skipped).toBe('recurring_charge_handled_by_authorized_payment')
    expect(h.notifyError).not.toHaveBeenCalled()
  })

  it('payment _monthly SIN operation_type recurring_payment: NO se corta (pago único viejo) y avisa', async () => {
    h.store.tenant.metadata = {}
    h.store.tenant.mp_subscription_id = null
    h.paymentGet.mockResolvedValue({ id: 'pay-old', status: 'approved', external_reference: REF, transaction_amount: 25000 })
    const res = await pago('pay-old')
    expect((await res.json()).skipped).toBeUndefined()
    expect(h.store.tenant.subscription_expires_at).toBe(unMes) // se procesó como pago único
    expect(h.notifyError).toHaveBeenCalledTimes(1)
  })
})
