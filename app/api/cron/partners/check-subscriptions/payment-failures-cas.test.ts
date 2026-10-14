// El cron de vencimiento (periodo de gracia) y el webhook de cobro rechazado
// incrementan el MISMO contador payment_failures. Intercalados no pueden perder
// una cuenta ni contar un vencimiento que un cobro ya renovo.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { NextRequest } from 'next/server'

const h = vi.hoisted(() => ({ store: { tenant: null as any } }))

vi.mock('@/lib/partners/tenant', () => ({
  getTenantById: async () => ({ ...h.store.tenant }),
  // updateTenant real: pisa lo que le pasan con la lectura que tenia el llamador.
  updateTenant: async (_id: string, u: any) => { h.store.tenant = { ...h.store.tenant, ...u, updated_at: new Date().toISOString() }; return { ...h.store.tenant } },
}))
vi.mock('@/lib/notifications', () => ({
  notifyError: async () => {}, notifySubscriptionExpiring: async () => {}, notifySubscriptionDegraded: async () => {},
  notifyPartnerSubscription: async () => {}, notifySubscriptionActivatedEmails: async () => {}, escapeTelegramHtml: (s: string) => s,
}))
vi.mock('@/lib/email', () => ({ sendEmail: async () => ({ ok: true }) }))
vi.mock('mercadopago', () => ({ MercadoPagoConfig: class {}, PreApproval: class { get = async () => ({}) }, Payment: class {} }))
vi.mock('@/lib/partners/currency', () => ({ getUsdToArs: async () => 1000 }))
vi.mock('@/lib/supabase-admin', async () => {
  const { createFakeSupabase } = await import('@/lib/partners/test-helpers/fake-tenants-db')
  const fake = createFakeSupabase(h.store)
  const chain = (ops: string[]): any => new Proxy({}, {
    get: (_t, prop: string) => {
      if (prop === 'then') {
        // Solo la consulta 1 (vencidos: lt + neq, sin gt) devuelve el tenant.
        const expired = ops.includes('lt') && ops.includes('neq') && !ops.includes('gt')
        const rows = h.store.tenant && expired ? [structuredClone(h.store.tenant)] : []
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
import { registerPaymentFailure, registerRecurringCharge, addMonths } from '@/lib/partners/subscription'

const T0 = '2026-10-13T12:00:00.000Z'
const EXP_VENCIDO = '2026-10-10T00:00:00.000Z'
const call = () => new NextRequest('http://localhost/api/cron/partners/check-subscriptions', { headers: { authorization: 'Bearer s' } })
const delay = async (n: number) => { for (let i = 0; i < n; i++) await Promise.resolve() }

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(new Date(T0)); process.env.CRON_SECRET = 's'
  h.store.tenant = {
    id: 't1', name: 'X', email: 'x@x.com', plan: 'growth', status: 'active', payment_failures: 0,
    subscription_expires_at: EXP_VENCIDO, updated_at: '2026-10-01T00:00:00.000Z',
    metadata: { subscription_type: 'recurring_pending', otra_clave: 'ajena' },
  }
})
afterEach(() => vi.useRealTimers())

describe('payment_failures: cron de vencimiento vs webhook', () => {
  it('cron (gracia) y webhook de rechazo simultaneos -> +2, ninguno pisa al otro', async () => {
    for (const retraso of [0, 1, 2, 3, 5, 8]) {
      h.store.tenant.payment_failures = 0
      h.store.tenant.metadata = { subscription_type: 'recurring_pending', otra_clave: 'ajena' }
      h.store.tenant.updated_at = '2026-10-01T00:00:00.000Z'
      await Promise.all([
        cronVencimiento(call()),
        (async () => { await delay(retraso); return registerPaymentFailure('t1', T0, `f-${retraso}`) })(),
      ])
      expect(h.store.tenant.payment_failures).toBe(2)
      expect(h.store.tenant.metadata.otra_clave).toBe('ajena')
      expect(h.store.tenant.metadata.mp_failed_payment_ids).toContain(`f-${retraso}`)
    }
  })

  it('cron con lectura vieja y un cobro que renovo el vencimiento: no cuenta la gracia ni pisa las marcas', async () => {
    for (const retraso of [0, 1, 2, 3, 5, 8]) {
      h.store.tenant.payment_failures = 1
      h.store.tenant.subscription_expires_at = EXP_VENCIDO
      h.store.tenant.metadata = { subscription_type: 'recurring_pending', otra_clave: 'ajena' }
      h.store.tenant.updated_at = '2026-10-01T00:00:00.000Z'
      await Promise.all([
        cronVencimiento(call()),
        (async () => { await delay(retraso); return registerRecurringCharge('t1', T0, `ap-${retraso}`) })(),
      ])
      const t = h.store.tenant
      expect(t.metadata.last_mp_authorized_payment_id).toBe(`ap-${retraso}`) // marca del cobro intacta
      expect(t.metadata.otra_clave).toBe('ajena')
      expect(t.subscription_expires_at).toBe(addMonths(EXP_VENCIDO < T0 ? T0 : EXP_VENCIDO, 1))
      // El cobro resetea; si el cron corrio ANTES del cobro, el cobro igual deja 0.
      expect(t.payment_failures).toBe(0)
    }
  })
})
