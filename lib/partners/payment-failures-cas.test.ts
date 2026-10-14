// El contador payment_failures decide la DEGRADACION del plan (un impago degrada,
// no suspende). Antes los escritores hacian read-modify-write con una lectura
// vieja: dos rechazos juntos perdian una cuenta y un updateTenant con copia vieja
// podia pisar marcas de un cobro aprobado. Ahora van por casUpdateTenant
// (registerPaymentFailure). Mismo patron que recurring-atomico.test.ts.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

const h = vi.hoisted(() => ({ store: { tenant: null as any } }))

vi.mock('mercadopago', () => ({ MercadoPagoConfig: class {}, PreApproval: class {} }))
vi.mock('./currency', () => ({ getUsdToArs: async () => 1000 }))
vi.mock('@/lib/supabase-admin', async () => {
  const m = await import('./test-helpers/fake-tenants-db')
  return { supabaseAdmin: m.createFakeSupabase(h.store) }
})

import { registerPaymentFailure, registerRecurringCharge, addMonths } from './subscription'
import { isAuthorizedPaymentAlreadyProcessed } from './webhook-guards'

const T0 = '2026-10-13T12:00:00.000Z'
const EXP0 = '2026-11-01T00:00:00.000Z'

const delay = async (n: number) => { for (let i = 0; i < n; i++) await Promise.resolve() }

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date(T0))
  h.store.tenant = {
    id: 't1', plan: 'growth', status: 'active', subscription_expires_at: EXP0,
    subscription_started_at: '2026-09-01T00:00:00.000Z', updated_at: '2026-10-01T00:00:00.000Z',
    payment_failures: 0, mp_subscription_id: 'pa-1',
    metadata: { subscription_type: 'recurring', otra_clave: 'ajena', last_mp_authorized_payment_id: 'ap-0', mp_authorized_payment_ids: ['ap-0'] },
  }
})
afterEach(() => vi.useRealTimers())

describe('payment_failures por CAS', () => {
  it('dos rechazos DISTINTOS simultaneos -> contador +2, no se pierde ninguno', async () => {
    await Promise.all([registerPaymentFailure('t1', T0, 'f-1'), registerPaymentFailure('t1', T0, 'f-2')])
    expect(h.store.tenant.payment_failures).toBe(2)
    expect(h.store.tenant.metadata.mp_failed_payment_ids).toEqual(expect.arrayContaining(['f-1', 'f-2']))
    expect(h.store.tenant.metadata.otra_clave).toBe('ajena')
  })

  it('el MISMO rechazo reenviado simultaneamente -> +1', async () => {
    const r = await Promise.all([registerPaymentFailure('t1', T0, 'f-1'), (async () => { await delay(6); return registerPaymentFailure('t1', T0, 'f-1') })()])
    expect(h.store.tenant.payment_failures).toBe(1)
    expect(r.sort()).toEqual(['applied', 'duplicate'])
  })

  it('el mismo rechazo reenviado DESPUES -> +1, y un rechazo nuevo suma', async () => {
    await registerPaymentFailure('t1', T0, 'f-1')
    expect(await registerPaymentFailure('t1', T0, 'f-1')).toBe('duplicate')
    expect(h.store.tenant.payment_failures).toBe(1)
    await registerPaymentFailure('t1', T0, 'f-2')
    expect(h.store.tenant.payment_failures).toBe(2)
  })

  it('la marca de ids contados queda acotada a los ultimos 12', async () => {
    for (let i = 1; i <= 15; i++) await registerPaymentFailure('t1', T0, `f-${i}`)
    expect(h.store.tenant.payment_failures).toBe(15)
    expect(h.store.tenant.metadata.mp_failed_payment_ids).toHaveLength(12)
    expect(h.store.tenant.metadata.mp_failed_payment_ids.at(-1)).toBe('f-15')
  })

  it('rechazo intercalado con un cobro aprobado: la marca del cobro sobrevive y el fallo no se pierde', async () => {
    for (const retraso of [0, 2, 4, 8]) {
      h.store.tenant.payment_failures = 2
      h.store.tenant.metadata = { subscription_type: 'recurring', otra_clave: 'ajena' }
      h.store.tenant.subscription_expires_at = EXP0
      h.store.tenant.updated_at = '2026-10-01T00:00:00.000Z'
      await Promise.all([
        (async () => { await delay(retraso); return registerPaymentFailure('t1', T0, `f-${retraso}`) })(),
        registerRecurringCharge('t1', T0, `ap-${retraso}`),
      ])
      const t = h.store.tenant
      expect(isAuthorizedPaymentAlreadyProcessed(t.metadata, `ap-${retraso}`)).toBe(true) // marca del cobro intacta
      expect(t.metadata.mp_failed_payment_ids).toContain(`f-${retraso}`) // fallo registrado
      expect(t.metadata.otra_clave).toBe('ajena')
      expect(t.subscription_expires_at).toBe(addMonths(EXP0, 1)) // el cobro extiende una vez
      // Regla actual: el cobro aprobado resetea a 0; un fallo que se serializa DESPUES suma 1.
      expect([0, 1]).toContain(t.payment_failures)
    }
  })

  it('cobro aprobado ya aplicado y luego un rechazo viejo: no pisa las marcas del cobro', async () => {
    await registerRecurringCharge('t1', T0, 'ap-1')
    await registerPaymentFailure('t1', T0, 'f-1')
    const t = h.store.tenant
    expect(t.payment_failures).toBe(1)
    expect(t.metadata.last_mp_authorized_payment_id).toBe('ap-1')
    expect(isAuthorizedPaymentAlreadyProcessed(t.metadata, 'ap-1')).toBe(true)
    expect(isAuthorizedPaymentAlreadyProcessed(t.metadata, 'ap-0')).toBe(true)
  })

  it('un rechazo seguido de un cobro aprobado: el cobro resetea el contador a 0', async () => {
    await registerPaymentFailure('t1', T0, 'f-1')
    await registerPaymentFailure('t1', T0, 'f-2')
    await registerRecurringCharge('t1', T0, 'ap-1')
    expect(h.store.tenant.payment_failures).toBe(0)
  })
})
