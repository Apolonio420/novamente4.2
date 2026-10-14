// El pago unico aprobado (anual y mensual viejo con plan) escribia plan, periodo,
// payment_failures y metadata con updateTenant sobre una lectura VIEJA: pisaba
// mp_authorized_payment_ids / mp_failed_payment_ids / expiry_is_activation_grace
// de otro webhook y un reenvio podia sumar el periodo dos veces. Ahora va por
// casUpdateTenant (registerSinglePayment). Mismo patron que payment-failures-cas.test.ts.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

const h = vi.hoisted(() => ({ store: { tenant: null as any } }))

vi.mock('mercadopago', () => ({ MercadoPagoConfig: class {}, PreApproval: class {} }))
vi.mock('./currency', () => ({ getUsdToArs: async () => 1000 }))
vi.mock('@/lib/supabase-admin', async () => {
  const m = await import('./test-helpers/fake-tenants-db')
  return { supabaseAdmin: m.createFakeSupabase(h.store) }
})

import { registerSinglePayment, registerRecurringCharge, registerPaymentFailure, addMonths } from './subscription'
import { isPaymentAlreadyProcessed } from './webhook-guards'

const T0 = '2026-10-13T12:00:00.000Z'
const EXP0 = '2026-11-01T00:00:00.000Z'
const delay = async (n: number) => { for (let i = 0; i < n; i++) await Promise.resolve() }
const monthly = { plan: 'growth', billingCycle: 'monthly' as const, designEngineMode: 'full', maxProducts: 50, maxLeadsPerMonth: 100, seoIndexable: true }
const annual = { ...monthly, billingCycle: 'annual' as const }

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date(T0))
  h.store.tenant = {
    id: 't1', plan: 'starter', status: 'active', subscription_expires_at: EXP0,
    subscription_started_at: '2026-09-01T00:00:00.000Z', updated_at: '2026-10-01T00:00:00.000Z',
    payment_failures: 2,
    metadata: { subscription_type: 'one_time', otra_clave: 'ajena', last_mp_authorized_payment_id: 'ap-0', mp_authorized_payment_ids: ['ap-0'], mp_failed_payment_ids: ['f-0'], expiry_is_activation_grace: true },
  }
})
afterEach(() => vi.useRealTimers())

describe('pago unico por CAS', () => {
  it('el pago anual suma 12 meses, activa el plan, resetea payment_failures y preserva metadata', async () => {
    expect(await registerSinglePayment('t1', T0, 'p-1', annual)).toBe('applied')
    const t = h.store.tenant
    expect(t.subscription_expires_at).toBe(addMonths(EXP0, 12))
    expect(t.plan).toBe('growth')
    expect(t.billing_cycle).toBe('annual')
    expect(t.payment_failures).toBe(0)
    expect(t.metadata).toMatchObject({ subscription_type: 'one_time', otra_clave: 'ajena', mp_authorized_payment_ids: ['ap-0'], mp_failed_payment_ids: ['f-0'], expiry_is_activation_grace: true, last_mp_payment_id: 'p-1' })
  })

  it('vencido: el periodo arranca desde la fecha del pago', async () => {
    h.store.tenant.subscription_expires_at = '2026-09-01T00:00:00.000Z'
    await registerSinglePayment('t1', T0, 'p-1', monthly)
    expect(h.store.tenant.subscription_expires_at).toBe(addMonths(T0, 1))
  })

  it('el MISMO pago unico simultaneo -> el periodo se suma una sola vez', async () => {
    const r = await Promise.all([registerSinglePayment('t1', T0, 'p-1', annual), registerSinglePayment('t1', T0, 'p-1', annual)])
    expect(r.sort()).toEqual(['applied', 'duplicate'])
    expect(h.store.tenant.subscription_expires_at).toBe(addMonths(EXP0, 12))
  })

  it('reenvio posterior (tambien de un id viejo fuera de orden) -> no suma', async () => {
    await registerSinglePayment('t1', T0, 'p-1', monthly)
    await registerSinglePayment('t1', T0, 'p-2', monthly)
    const exp = h.store.tenant.subscription_expires_at
    expect(exp).toBe(addMonths(addMonths(EXP0, 1), 1))
    expect(await registerSinglePayment('t1', T0, 'p-1', monthly)).toBe('duplicate')
    expect(await registerSinglePayment('t1', T0, 'p-2', monthly)).toBe('duplicate')
    expect(h.store.tenant.subscription_expires_at).toBe(exp)
    expect(isPaymentAlreadyProcessed(h.store.tenant.metadata, 'p-1')).toBe(true)
  })

  it('dos pagos unicos DISTINTOS simultaneos -> ambos se aplican', async () => {
    await Promise.all([registerSinglePayment('t1', T0, 'p-1', monthly), registerSinglePayment('t1', T0, 'p-2', monthly)])
    expect(h.store.tenant.subscription_expires_at).toBe(addMonths(addMonths(EXP0, 1), 1))
    expect(h.store.tenant.metadata.mp_single_payment_ids).toEqual(expect.arrayContaining(['p-1', 'p-2']))
  })

  it('la marca de ids aplicados queda acotada a los ultimos 12', async () => {
    for (let i = 1; i <= 15; i++) await registerSinglePayment('t1', T0, `p-${i}`, monthly)
    expect(h.store.tenant.metadata.mp_single_payment_ids).toHaveLength(12)
    expect(h.store.tenant.metadata.mp_single_payment_ids.at(-1)).toBe('p-15')
  })

  it('intercalado con cobro recurrente / rechazo: no pisa sus marcas y el reset ocurre', async () => {
    for (const retraso of [0, 2, 4, 8]) {
      h.store.tenant.payment_failures = 2
      h.store.tenant.subscription_expires_at = EXP0
      h.store.tenant.updated_at = '2026-10-01T00:00:00.000Z'
      h.store.tenant.metadata = { otra_clave: 'ajena', expiry_is_activation_grace: true }
      await Promise.all([
        registerSinglePayment('t1', T0, `p-${retraso}`, monthly),
        (async () => { await delay(retraso); return registerPaymentFailure('t1', T0, `f-${retraso}`) })(),
        (async () => { await delay(retraso + 1); return registerRecurringCharge('t1', T0, `ap-${retraso}`) })(),
      ])
      const t = h.store.tenant
      expect(t.metadata.last_mp_payment_id).toBe(`p-${retraso}`)
      expect(t.metadata.mp_failed_payment_ids).toContain(`f-${retraso}`)
      expect(t.metadata.mp_authorized_payment_ids).toContain(`ap-${retraso}`)
      expect(t.metadata.otra_clave).toBe('ajena')
      expect([0, 1]).toContain(t.payment_failures) // reset; un rechazo serializado DESPUES suma 1
    }
  })

  it('pago unico intercalado con un alta (grace): no pierde la marca de gracia ni el periodo', async () => {
    h.store.tenant.metadata = { expiry_is_activation_grace: true }
    await Promise.all([registerSinglePayment('t1', T0, 'p-1', monthly), registerPaymentFailure('t1', T0, 'f-1')])
    expect(h.store.tenant.metadata.expiry_is_activation_grace).toBe(true)
    expect(h.store.tenant.subscription_expires_at).toBe(addMonths(EXP0, 1))
  })
})
