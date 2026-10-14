// Los escritores de `tenants` que leen y escriben metadata (crons de vencimiento
// y follow-up) no pueden pisar las marcas de un cobro/alta que se aplica en el
// medio. Se prueba con el tenant en memoria que entrelaza (fake-tenants-db): el
// mail se "envía" mientras el webhook aplica el cobro.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { NextRequest } from 'next/server'

const h = vi.hoisted(() => ({
  store: { tenant: null as any },
  duranteMail: null as null | (() => Promise<unknown>),
}))

vi.mock('@/lib/partners/tenant', () => ({
  getTenantById: async () => ({ ...h.store.tenant }),
  // updateTenant real: pisa la metadata completa con lo que le pasan.
  updateTenant: async (_id: string, u: any) => { h.store.tenant = { ...h.store.tenant, ...u, updated_at: new Date().toISOString() }; return { ...h.store.tenant } },
}))
vi.mock('@/lib/notifications', () => ({
  notifyError: async () => {}, notifySubscriptionExpiring: async () => {}, notifySubscriptionDegraded: async () => {},
  notifyPartnerSubscription: async () => {}, notifySubscriptionActivatedEmails: async () => {}, escapeTelegramHtml: (s: string) => s,
}))
vi.mock('@/lib/email', () => ({
  sendEmail: async () => { await h.duranteMail?.(); return { ok: true } },
}))
vi.mock('mercadopago', () => ({ MercadoPagoConfig: class {}, PreApproval: class { get = async () => ({}) }, Payment: class {} }))
vi.mock('@/lib/partners/currency', () => ({ getUsdToArs: async () => 1000 }))
vi.mock('@/lib/supabase-admin', async () => {
  const { createFakeSupabase } = await import('@/lib/partners/test-helpers/fake-tenants-db')
  const fake = createFakeSupabase(h.store)
  const chain = (ops: string[]): any => new Proxy({}, {
    get: (_t, prop: string) => {
      if (prop === 'then') {
        // Solo la consulta de "vencen en 3 días" (.gt) y la de follow-up (.is) devuelven el tenant.
        const rows = h.store.tenant && (ops.includes('gt') || ops.includes('is')) ? [structuredClone(h.store.tenant)] : []
        return (res: any) => res({ data: rows, error: null })
      }
      if (prop === 'update') return (u: any) => fake.from().update(u)
      if (prop === 'single') return async () => ({ data: structuredClone(h.store.tenant), error: null })
      return (..._a: any[]) => chain([...ops, prop])
    },
  })
  return { supabaseAdmin: { from: () => chain([]) } }
})

import { GET as cronVencimiento } from './route'
import { GET as cronFollowup } from '../pending-subscription-followup/route'
import { registerRecurringCharge, activateRecurringTenant, addMonths } from '@/lib/partners/subscription'
import { isAuthorizedPaymentAlreadyProcessed } from '@/lib/partners/webhook-guards'

const T0 = '2026-10-13T12:00:00.000Z'
const call = (url: string) => new NextRequest(url, { headers: { authorization: 'Bearer s' } })

beforeEach(() => { vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(new Date(T0)); process.env.CRON_SECRET = 's'; h.duranteMail = null })
afterEach(() => vi.useRealTimers())

describe('escritores de metadata vs cobro/alta concurrente', () => {
  it('cron de vencimiento (mail) intercalado con un cobro: ap-7 sigue marcado y el mes se suma una sola vez', async () => {
    const EXP = '2026-10-15T00:00:00.000Z'
    h.store.tenant = {
      id: 't1', name: 'X', email: 'x@x.com', plan: 'growth', status: 'active', payment_failures: 0,
      subscription_expires_at: EXP, updated_at: '2026-10-01T00:00:00.000Z', mp_subscription_id: 'pa-1',
      metadata: { subscription_type: 'recurring' },
    }
    h.duranteMail = () => registerRecurringCharge('t1', T0, 'ap-7')
    await cronVencimiento(call('http://localhost/api/cron/partners/check-subscriptions'))
    const t = h.store.tenant
    expect(t.subscription_expires_at).toBe(addMonths(EXP, 1))
    expect(isAuthorizedPaymentAlreadyProcessed(t.metadata, 'ap-7')).toBe(true)
    expect(t.metadata.expiry_email_sent_for).toBe(EXP) // el dedupe del mail también quedó
    // El reenvío de ap-7 no suma de nuevo.
    expect(await registerRecurringCharge('t1', T0, 'ap-7')).toBe('duplicate')
    expect(h.store.tenant.subscription_expires_at).toBe(addMonths(EXP, 1))
  })

  it('follow-up intercalado con un alta: no vuelve a recurring_pending ni pisa la gracia de activación', async () => {
    h.store.tenant = {
      id: 't1', slug: 'x', name: 'X', email: 'x@x.com', plan: 'starter', status: 'onboarding', payment_failures: 0,
      subscription_expires_at: null, subscription_started_at: null, last_payment_at: null,
      updated_at: '2026-10-10T00:00:00.000Z', mp_subscription_id: 'pa-1',
      metadata: { subscription_type: 'recurring_pending', pending_plan: 'growth', pending_since: '2026-10-10T00:00:00.000Z', subscription_followups: [] },
    }
    const visto = structuredClone(h.store.tenant)
    h.duranteMail = () => activateRecurringTenant(visto, 'pa-1', T0)
    await cronFollowup(call('http://localhost/api/cron/partners/pending-subscription-followup'))
    const m = h.store.tenant.metadata
    expect(m.subscription_type).toBe('recurring')
    expect(m.expiry_is_activation_grace).toBe(true)
    expect(m.subscription_followups).toHaveLength(1)
    // Primer cobro: reemplaza la gracia (1 mes), no suma encima.
    await registerRecurringCharge('t1', T0, 'ap-1')
    expect(h.store.tenant.subscription_expires_at).toBe(addMonths(T0, 1))
  })
})
