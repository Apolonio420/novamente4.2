// Hueco del diseño "alta sin cobro": MP autoriza el alta, el primer cobro nunca
// llega aprobado y después cancela. El partner no puede quedar en Growth para
// siempre: el alta deja vencimiento hoy + 1 mes y, tras la cancelación
// (subscription_type 'cancelled'), el cron real lo degrada a starter.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { NextRequest } from 'next/server'

const h = vi.hoisted(() => ({ store: { tenant: null as any } }))

vi.mock('@/lib/partners/tenant', () => ({
  getTenantById: async () => ({ ...h.store.tenant }),
  updateTenant: async (_id: string, u: any) => { h.store.tenant = { ...h.store.tenant, ...u }; return { ...h.store.tenant } },
}))
vi.mock('@/lib/notifications', () => ({
  notifyError: async () => {}, notifySubscriptionExpiring: async () => {}, notifySubscriptionDegraded: async () => {},
  notifyPartnerSubscription: async () => {}, notifySubscriptionActivatedEmails: async () => {}, escapeTelegramHtml: (s: string) => s,
}))
vi.mock('@/lib/email', () => ({ sendEmail: async () => ({ ok: true }) }))
vi.mock('mercadopago', () => ({ MercadoPagoConfig: class {}, PreApproval: class { get = async () => ({}) }, Payment: class {} }))

// Query builder encadenable: solo la consulta de vencidos (.lt) devuelve el tenant si venció.
vi.mock('@/lib/supabase-admin', () => {
  const chain = (ops: string[], ltValue?: string): any => new Proxy({}, {
    get: (_t, prop: string) => {
      if (prop === 'then') {
        const t = h.store.tenant
        const rows = ops.includes('lt') && t && t.subscription_expires_at && t.subscription_expires_at < ltValue! && t.plan !== 'starter' && t.status === 'active' ? [t] : []
        return (res: any) => res({ data: rows, error: null })
      }
      if (prop === 'update') return (u: any) => ({ eq: async () => { h.store.tenant = { ...h.store.tenant, ...u }; return { error: null } } })
      return (...a: any[]) => chain([...ops, prop], prop === 'lt' ? a[1] : ltValue)
    },
  })
  return { supabaseAdmin: { from: () => chain([]) } }
})

import { GET } from './route'
import { activateRecurringTenant, addMonths } from '@/lib/partners/subscription'

const T0 = '2026-10-13T12:00:00.000Z'
beforeEach(() => { vi.useFakeTimers(); process.env.CRON_SECRET = 's' })
afterEach(() => vi.useRealTimers())

const cron = () => GET(new NextRequest('http://localhost/api/cron/partners/check-subscriptions', { headers: { authorization: 'Bearer s' } }))

describe('alta autorizada, primer cobro rechazado, MP cancela', () => {
  it('vence hoy + 1 mes y el cron lo degrada a starter (no queda en Growth para siempre)', async () => {
    vi.setSystemTime(new Date(T0))
    const tenant: any = { id: 't1', name: 'X', email: 'x@x.com', plan: 'starter', status: 'onboarding', payment_failures: 0, subscription_expires_at: null, mp_subscription_id: 'pa-1', metadata: { subscription_type: 'recurring_pending', pending_plan: 'growth' } }
    h.store.tenant = tenant
    await activateRecurringTenant(tenant, 'pa-1', T0)
    expect(h.store.tenant.subscription_expires_at).toBe(addMonths(T0, 1))
    expect(h.store.tenant.plan).toBe('growth')
    // cobro rechazado + MP cancela: el webhook solo marca metadata (el acceso sigue hasta el vencimiento)
    h.store.tenant.payment_failures = 1
    h.store.tenant.metadata = { ...h.store.tenant.metadata, subscription_type: 'cancelled' }
    // pasa el mes + 1 día; el cron corre 4 veces (3 de gracia + degradación)
    vi.setSystemTime(new Date(addMonths(T0, 1)).getTime() + 86_400_000)
    for (let i = 0; i < 4; i++) await cron()
    expect(h.store.tenant.plan).toBe('starter')
    expect(h.store.tenant.metadata.subscription_type).toBe('cancelled')
  })
})
