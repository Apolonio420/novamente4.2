// Atomicidad de los caminos de plata del cobro recurrente (pendiente de la
// revisión Opus del 13/10): registerRecurringCharge y activateRecurringTenant
// hacían read-modify-write de subscription_expires_at y metadata sin
// atomicidad. Con un tenant en memoria que entrelaza lecturas y escrituras
// (Promise.all), el invariante "1 authorized_payment = 1 mes, exactamente una
// vez" tiene que sostenerse bajo concurrencia y reenvíos fuera de orden.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

const h = vi.hoisted(() => ({ store: { tenant: null as any } }))

vi.mock('mercadopago', () => ({ MercadoPagoConfig: class {}, PreApproval: class {} }))
vi.mock('./currency', () => ({ getUsdToArs: async () => 1000 }))
vi.mock('@/lib/supabase-admin', async () => {
  const m = await import('./test-helpers/fake-tenants-db')
  return { supabaseAdmin: m.createFakeSupabase(h.store) }
})

import { registerRecurringCharge, activateRecurringTenant, addMonths } from './subscription'
import { isAuthorizedPaymentAlreadyProcessed } from './webhook-guards'

const T0 = '2026-10-13T12:00:00.000Z'
const EXP0 = '2026-11-01T00:00:00.000Z'

// Igual que el webhook: guard con el tenant leído, y recién después el cobro.
async function webhookCobro(apId: string, retrasoTicks = 0) {
  const seen = structuredClone(h.store.tenant)
  await Promise.resolve() // el guard corre sobre una lectura previa, como en route.ts
  for (let i = 0; i < retrasoTicks; i++) await Promise.resolve() // el 2º aviso llega más tarde al UPDATE
  if (isAuthorizedPaymentAlreadyProcessed(seen.metadata, apId)) return
  await registerRecurringCharge(seen.id, T0, apId)
}

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date(T0))
  h.store.tenant = {
    id: 't1', plan: 'growth', status: 'active', subscription_expires_at: EXP0,
    subscription_started_at: '2026-09-01T00:00:00.000Z', updated_at: '2026-10-01T00:00:00.000Z',
    payment_failures: 0, mp_subscription_id: 'pa-1',
    metadata: { subscription_type: 'recurring', otra_clave: 'ajena' },
  }
})
afterEach(() => vi.useRealTimers())

describe('cobro recurrente atómico', () => {
  it('dos avisos simultáneos del MISMO authorized_payment → 1 mes', async () => {
    await Promise.all([webhookCobro('ap-1'), webhookCobro('ap-1', 6)])
    expect(h.store.tenant.subscription_expires_at).toBe(addMonths(EXP0, 1))
  })

  it('dos cobros DISTINTOS simultáneos → 2 meses, no se pierde ninguno', async () => {
    await Promise.all([webhookCobro('ap-1'), webhookCobro('ap-2')])
    expect(h.store.tenant.subscription_expires_at).toBe(addMonths(addMonths(EXP0, 1), 1))
    expect(isAuthorizedPaymentAlreadyProcessed(h.store.tenant.metadata, 'ap-1')).toBe(true)
    expect(isAuthorizedPaymentAlreadyProcessed(h.store.tenant.metadata, 'ap-2')).toBe(true)
    expect(h.store.tenant.metadata.otra_clave).toBe('ajena')
  })

  it('reenvío de ap-1 DESPUÉS de ap-2 → no suma', async () => {
    await webhookCobro('ap-1')
    await webhookCobro('ap-2')
    const despues = h.store.tenant.subscription_expires_at
    expect(despues).toBe(addMonths(addMonths(EXP0, 1), 1))
    await webhookCobro('ap-1')
    expect(h.store.tenant.subscription_expires_at).toBe(despues)
  })

  it('alta y primer cobro simultáneos → 1 mes y marcas intactas', async () => {
    h.store.tenant = {
      ...h.store.tenant, plan: 'starter', status: 'onboarding', subscription_expires_at: null, subscription_started_at: null,
      metadata: { subscription_type: 'recurring_pending', pending_plan: 'growth', otra_clave: 'ajena' },
    }
    const seen = structuredClone(h.store.tenant)
    await Promise.all([activateRecurringTenant(seen, 'pa-1', T0), registerRecurringCharge('t1', T0, 'ap-1')])
    const t = h.store.tenant
    expect(t.subscription_expires_at).toBe(addMonths(T0, 1)) // 1 cobro = 1 mes, sin sumar el del alta
    expect(t.metadata.last_mp_authorized_payment_id).toBe('ap-1')
    expect(isAuthorizedPaymentAlreadyProcessed(t.metadata, 'ap-1')).toBe(true)
    expect(t.metadata.subscription_type).toBe('recurring')
    expect(t.metadata.expiry_is_activation_grace).toBeUndefined() // el cobro consumió la gracia
    expect(t.metadata.otra_clave).toBe('ajena')
    expect(t.plan).toBe('growth')
  })

  it('el conjunto de ids recordados queda acotado a 12', async () => {
    for (let i = 1; i <= 15; i++) await registerRecurringCharge('t1', T0, `ap-${i}`)
    expect(h.store.tenant.metadata.mp_authorized_payment_ids).toHaveLength(12)
    expect(h.store.tenant.metadata.last_mp_authorized_payment_id).toBe('ap-15')
  })
})
