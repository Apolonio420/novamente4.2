// Regression test para el punto 2 del ticket de subscription semantics
// (2026-07): el cupo de la promo Growth (100 partners) se consume en el
// PRIMER PAGO ACREDITADO (last_payment_at), NO en la creación de la
// suscripción/checkout. Ver comentario en countPaidPartners (subscription.ts).
import { describe, it, expect, beforeEach, vi } from 'vitest'

const h = vi.hoisted(() => ({
  notCalledWith: [] as any[],
  countResult: { count: 0, error: null as any },
}))

vi.mock('@/lib/supabase-admin', () => ({
  supabaseAdmin: {
    from: (table: string) => {
      const query = {
        _table: table,
        select: (_cols: string, _opts: any) => query,
        not: (col: string, op: string, val: any) => {
          h.notCalledWith.push({ table, col, op, val })
          return query
        },
        in: (_col: string, _vals: any[]) => Promise.resolve(h.countResult),
      }
      return query
    },
  },
}))

vi.mock('mercadopago', () => ({
  MercadoPagoConfig: class MercadoPagoConfig {},
  PreApproval: class PreApproval {},
}))

vi.mock('./currency', () => ({ getUsdToArs: vi.fn() }))

import { countPaidPartners, isGrowthPromoEligible, GROWTH_PROMO } from './subscription'

beforeEach(() => {
  vi.clearAllMocks()
  h.notCalledWith = []
  h.countResult = { count: 0, error: null }
})

describe('countPaidPartners — cupo por last_payment_at, no por creación', () => {
  it('la query filtra por last_payment_at NOT NULL (no por fecha de creación ni status)', async () => {
    h.countResult = { count: 42, error: null }
    const count = await countPaidPartners()
    expect(count).toBe(42)
    expect(h.notCalledWith).toContainEqual({
      table: 'tenants',
      col: 'last_payment_at',
      op: 'is',
      val: null,
    })
  })

  it('crear una suscripción sin pago (last_payment_at aún null) NO consume cupo: el conteo la ignora', async () => {
    // Un tenant recién creado con createRecurringSubscription/subscribe anual
    // tiene metadata.subscription_type='recurring' pero last_payment_at=null
    // hasta que el webhook confirme un pago real. La query de countPaidPartners
    // solo cuenta filas con last_payment_at NOT NULL, así que ese tenant no
    // aparece en el conteo aunque ya haya "creado" la intención de suscripción.
    h.countResult = { count: 0, error: null } // ningún tenant con last_payment_at aún
    const count = await countPaidPartners()
    expect(count).toBe(0)

    const eligible = await isGrowthPromoEligible('growth')
    expect(eligible).toBe(true) // cupo intacto, nadie pagó todavía
  })

  it('el primer pago acreditado (last_payment_at seteado) SÍ consume un lugar del cupo', async () => {
    // Simula que ya hay 99 partners con al menos un pago acreditado.
    h.countResult = { count: 99, error: null }
    const count = await countPaidPartners()
    expect(count).toBe(99)
    expect(count).toBeLessThan(GROWTH_PROMO.maxPartners)

    const eligible = await isGrowthPromoEligible('growth')
    expect(eligible).toBe(true) // partner #100 todavía entra

    // Al acreditarse su pago (activateRecurringTenant/webhook setea
    // last_payment_at), el conteo pasaría a 100 y el cupo se cierra.
    h.countResult = { count: 100, error: null }
    const eligibleAfter = await isGrowthPromoEligible('growth')
    expect(eligibleAfter).toBe(false)
  })

  it('fail-safe: si la query de conteo falla, NO se otorga promo (se asume cupo lleno)', async () => {
    h.countResult = { count: null as any, error: { message: 'db down' } }
    const eligible = await isGrowthPromoEligible('growth')
    expect(eligible).toBe(false)
  })
})
