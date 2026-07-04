// Tests para los hallazgos [14]/[20] del review
// docs/reviews/REVIEW-caminos-de-plata-2026-07-03.md: el flujo MENSUAL de
// suscripción (createRecurringSubscription) otorgaba el precio promo Growth
// sin verificar si el tenant ya tenía un pago acreditado — a diferencia del
// flujo anual (app/api/partners/subscribe/route.ts), que sí exige
// isFirstPayment = !tenant.last_payment_at. Este archivo verifica que ambos
// flujos comparten ahora la misma semántica para el mismo tenant.
import { describe, it, expect, beforeEach, vi } from 'vitest'

const h = vi.hoisted(() => {
  const state = {
    mpSubscriptionId: null as string | null,
    lastPaymentAt: null as string | null,
    paidPartnersCount: 0,
  }

  const chain: any = {
    _mode: null as 'tenantLookup' | 'countPaid' | 'other' | null,
  }
  chain.from = () => chain
  chain.select = (cols: string) => {
    // countPaidPartners: .select('id', { count: 'exact', head: true })
    // tenant lookup (createRecurringSubscription): .select('mp_subscription_id, last_payment_at')
    chain._mode = cols === 'id' ? 'countPaid' : 'tenantLookup'
    return chain
  }
  chain.update = () => chain
  chain.eq = () => chain
  chain.not = () => chain
  // countPaidPartners hace `.in(...)` como último eslabón y lo awaitea directo
  // (sin .single()) → debe resolver a { count, error }.
  chain.in = () => Promise.resolve({ count: state.paidPartnersCount, error: null })
  // tenant lookup en createRecurringSubscription SÍ encadena .single()
  chain.single = () =>
    Promise.resolve({
      data: { mp_subscription_id: state.mpSubscriptionId, last_payment_at: state.lastPaymentAt },
      error: null,
    })
  // persistPendingSubscription: db().from('tenants').select('metadata').eq(...).single()
  // ya cubierto arriba por chain.single(); solo necesita no explotar.
  chain.then = (resolve: any) => resolve({ data: null, error: null })

  return { state, chain, preapprovalCreate: vi.fn(), getUsdToArs: vi.fn() }
})

vi.mock('mercadopago', () => ({
  MercadoPagoConfig: class MercadoPagoConfig {},
  PreApproval: class PreApproval {
    get = vi.fn()
    update = vi.fn()
    create = h.preapprovalCreate
  },
}))

vi.mock('./currency', () => ({ getUsdToArs: h.getUsdToArs }))
vi.mock('@/lib/supabase-admin', () => ({ supabaseAdmin: h.chain }))

import { createRecurringSubscription, isGrowthPromoEligible } from './subscription'

beforeEach(() => {
  vi.clearAllMocks()
  process.env.MP_ACCESS_TOKEN = 'test-token'
  h.state.mpSubscriptionId = null
  h.state.lastPaymentAt = null
  h.state.paidPartnersCount = 0 // cupo abierto por defecto
  h.getUsdToArs.mockResolvedValue(1000)
  h.preapprovalCreate.mockResolvedValue({ id: 'preapproval-new', init_point: 'https://mp.example/new' })
})

const baseArgs = {
  tenantId: 'tenant-1',
  tenantEmail: 'partner@example.com',
  plan: 'growth' as const,
  baseUrl: 'https://novamente.ar',
  nowISO: '2026-07-03T12:00:00.000Z',
}

describe('createRecurringSubscription — promo Growth exige primer pago (hallazgos [14]/[20])', () => {
  it('alta nueva sin pagos previos (last_payment_at null): elegible a promo si hay cupo', async () => {
    h.state.lastPaymentAt = null
    h.state.paidPartnersCount = 0

    const result = await createRecurringSubscription(baseArgs)

    expect(result.ok).toBe(true)
    expect(result.price_usd).toBe(25) // GROWTH_PROMO.priceUsd
    expect(result.promo).toEqual(expect.objectContaining({ price_usd: 25 }))
  })

  it('re-suscripción mensual con last_payment_at poblado: precio full, NO promo', async () => {
    h.state.lastPaymentAt = '2026-05-01T00:00:00.000Z' // ya pagó alguna vez
    h.state.paidPartnersCount = 0 // aunque haya cupo de sobra

    const result = await createRecurringSubscription(baseArgs)

    expect(result.ok).toBe(true)
    expect(result.price_usd).toBe(50) // PLAN_PRICING_USD.growth (standard)
    expect(result.promo).toBeNull()
  })

  it('mismo tenant, mismo cupo: anual (isFirstPayment inyectado por el caller) y mensual coinciden', async () => {
    // Simula un tenant que YA pagó (re-suscripción). El flujo anual calcula
    // isFirstPayment = !tenant.last_payment_at y se lo pasa a isGrowthPromoEligible;
    // el mensual debe llegar a la MISMA conclusión leyendo el mismo campo.
    const tenantLastPaymentAt = '2026-04-10T00:00:00.000Z'

    const annualIsFirstPayment = !tenantLastPaymentAt
    const annualEligible = await isGrowthPromoEligible('growth', annualIsFirstPayment)

    h.state.lastPaymentAt = tenantLastPaymentAt
    h.state.paidPartnersCount = 0
    const monthlyResult = await createRecurringSubscription(baseArgs)

    expect(annualEligible).toBe(false)
    expect(monthlyResult.promo).toBeNull()
    expect(monthlyResult.price_usd).toBe(50)
  })

  it('cupo lleno además de ser primer pago: sigue sin promo (ambas condiciones deben cumplirse)', async () => {
    h.state.lastPaymentAt = null // primer pago
    h.state.paidPartnersCount = 100 // cupo lleno

    const result = await createRecurringSubscription(baseArgs)

    expect(result.ok).toBe(true)
    expect(result.price_usd).toBe(50)
    expect(result.promo).toBeNull()
  })
})

describe('isGrowthPromoEligible — compatibilidad hacia atrás', () => {
  it('sin segundo argumento (callers agnósticos de tenant): sigue evaluando solo por cupo', async () => {
    h.state.paidPartnersCount = 0
    const eligible = await isGrowthPromoEligible('growth')
    expect(eligible).toBe(true)
  })

  it('isFirstPayment=false: nunca elegible aunque haya cupo', async () => {
    h.state.paidPartnersCount = 0
    const eligible = await isGrowthPromoEligible('growth', false)
    expect(eligible).toBe(false)
  })
})
