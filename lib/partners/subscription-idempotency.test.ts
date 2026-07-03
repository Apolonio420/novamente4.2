// Tests para el hardening de idempotencia de billing (hallazgo [4] del review
// docs/reviews/REVIEW-caminos-de-plata-2026-07-03.md): createRecurringSubscription
// debe cancelar cualquier PreApproval activo del tenant ANTES de crear uno nuevo,
// y abortar sin crear si la cancelación falla (evitar doble débito mensual).
import { describe, it, expect, beforeEach, vi } from 'vitest'

const h = vi.hoisted(() => {
  const state = { mpSubscriptionId: null as string | null }
  const chain: any = {}
  chain.from = () => chain
  chain.select = () => chain
  chain.update = () => chain
  chain.eq = () => chain
  // db().from('tenants').select('mp_subscription_id').eq('id', x).single()
  chain.single = () => Promise.resolve({ data: { mp_subscription_id: state.mpSubscriptionId }, error: null })
  // db().from('tenants').update({...}).eq('id', x) — persistPendingSubscription
  // no encadena .single(), así que el chain mismo debe ser awaitable.
  chain.then = (resolve: any) => resolve({ data: null, error: null })

  return {
    state,
    chain,
    preapprovalGet: vi.fn(),
    preapprovalUpdate: vi.fn(),
    preapprovalCreate: vi.fn(),
    getUsdToArs: vi.fn(),
  }
})

vi.mock('mercadopago', () => ({
  MercadoPagoConfig: class MercadoPagoConfig {},
  PreApproval: class PreApproval {
    get = h.preapprovalGet
    update = h.preapprovalUpdate
    create = h.preapprovalCreate
  },
}))

vi.mock('./currency', () => ({
  getUsdToArs: h.getUsdToArs,
}))

vi.mock('@/lib/supabase-admin', () => ({ supabaseAdmin: h.chain }))

import { createRecurringSubscription } from './subscription'

beforeEach(() => {
  vi.clearAllMocks()
  process.env.MP_ACCESS_TOKEN = 'test-token'
  h.state.mpSubscriptionId = null
  h.getUsdToArs.mockResolvedValue(1000)
  h.preapprovalCreate.mockResolvedValue({ id: 'preapproval-new', init_point: 'https://mp.example/new' })
})

const baseArgs = {
  tenantId: 'tenant-1',
  tenantEmail: 'partner@example.com',
  plan: 'pro' as const, // Pro: sin promo, evita tener que mockear countPaidPartners
  baseUrl: 'https://novamente.ar',
  nowISO: '2026-07-03T12:00:00.000Z',
}

describe('createRecurringSubscription — cancela PreApproval previo', () => {
  it('sin suscripción previa: no llama a cancelar, crea directo', async () => {
    h.state.mpSubscriptionId = null

    const result = await createRecurringSubscription(baseArgs)

    expect(result.ok).toBe(true)
    expect(h.preapprovalGet).not.toHaveBeenCalled()
    expect(h.preapprovalUpdate).not.toHaveBeenCalled()
    expect(h.preapprovalCreate).toHaveBeenCalledTimes(1)
  })

  it('con PreApproval activo previo: lo cancela ANTES de crear el nuevo', async () => {
    h.state.mpSubscriptionId = 'preapproval-old'
    h.preapprovalGet.mockResolvedValue({ id: 'preapproval-old', status: 'authorized' })

    const callOrder: string[] = []
    h.preapprovalUpdate.mockImplementation(async (args: any) => {
      callOrder.push('cancel:' + args.id)
      return { id: args.id, status: 'cancelled' }
    })
    h.preapprovalCreate.mockImplementation(async () => {
      callOrder.push('create')
      return { id: 'preapproval-new', init_point: 'https://mp.example/new' }
    })

    const result = await createRecurringSubscription(baseArgs)

    expect(result.ok).toBe(true)
    expect(h.preapprovalGet).toHaveBeenCalledWith({ id: 'preapproval-old' })
    expect(h.preapprovalUpdate).toHaveBeenCalledWith({
      id: 'preapproval-old',
      body: { status: 'cancelled' },
    })
    // Orden: cancelar el viejo primero, recién después crear el nuevo.
    expect(callOrder).toEqual(['cancel:preapproval-old', 'create'])
  })

  it('PreApproval previo ya estaba cancelado: no vuelve a llamar update, crea el nuevo igual', async () => {
    h.state.mpSubscriptionId = 'preapproval-old'
    h.preapprovalGet.mockResolvedValue({ id: 'preapproval-old', status: 'cancelled' })

    const result = await createRecurringSubscription(baseArgs)

    expect(result.ok).toBe(true)
    expect(h.preapprovalUpdate).not.toHaveBeenCalled()
    expect(h.preapprovalCreate).toHaveBeenCalledTimes(1)
  })

  it('PreApproval previo ya no existe en MP (404 en el get): no bloquea el alta nueva', async () => {
    h.state.mpSubscriptionId = 'preapproval-gone'
    h.preapprovalGet.mockRejectedValue({ status: 404, message: 'not found' })

    const result = await createRecurringSubscription(baseArgs)

    expect(result.ok).toBe(true)
    expect(h.preapprovalCreate).toHaveBeenCalledTimes(1)
  })

  it('falla la cancelación del viejo (error real de MP): ABORTA sin crear el nuevo', async () => {
    h.state.mpSubscriptionId = 'preapproval-old'
    h.preapprovalGet.mockResolvedValue({ id: 'preapproval-old', status: 'authorized' })
    h.preapprovalUpdate.mockRejectedValue({ status: 500, message: 'MP internal error' })

    const result = await createRecurringSubscription(baseArgs)

    expect(result.ok).toBe(false)
    expect(result.error).toMatch(/No se pudo cancelar la suscripción anterior/)
    // Guardrail central: si no se pudo cancelar el viejo, NUNCA se crea el nuevo
    // (evita que dos PreApprovals debiten en paralelo).
    expect(h.preapprovalCreate).not.toHaveBeenCalled()
  })
})
