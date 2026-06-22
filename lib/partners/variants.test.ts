import { describe, it, expect, beforeEach, vi } from 'vitest'

const h = vi.hoisted(() => {
  const single = vi.fn()
  const awaitResult = { value: { data: null as any, error: null as any } }
  const chain: any = {
    from: () => chain,
    select: () => chain,
    insert: () => chain,
    update: () => chain,
    delete: () => chain,
    eq: () => chain,
    order: () => chain,
    is: () => chain,
    single: () => single(),
    then: (resolve: any) => resolve(awaitResult.value),
  }
  return { chain, single, awaitResult }
})

vi.mock('@/lib/supabase-admin', () => ({ supabaseAdmin: h.chain }))
// garment-pricing is imported by variants.ts; stub it so resolveProductCost is deterministic.
vi.mock('./garment-pricing', () => ({
  ALL_GARMENT_PRICING: { 'aura-oversize-tshirt': {} },
  getPartnerPlanPrice: (_gk: string, _plan: string) => 10000,
}))

import {
  validateVariantInput,
  validateProductForPublish,
  resolveProductCost,
  createVariant,
  deleteVariant,
} from './variants'

beforeEach(() => {
  h.single.mockReset()
  h.awaitResult.value = { data: null, error: null }
})

describe('validateVariantInput', () => {
  it('requiere al menos SKU, color o talle al crear', () => {
    expect(validateVariantInput({}).ok).toBe(false)
    expect(validateVariantInput({ color: 'Negro' }).ok).toBe(true)
  })
  it('rechaza precio negativo', () => {
    expect(validateVariantInput({ sku: 'A', price: -5 }).ok).toBe(false)
  })
  it('rechaza disponibilidad inválida', () => {
    expect(validateVariantInput({ sku: 'A', availability: 'magic' }).ok).toBe(false)
    expect(validateVariantInput({ sku: 'A', availability: 'preorder' }).ok).toBe(true)
  })
  it('en update no exige identificador', () => {
    expect(validateVariantInput({ price: 100 }, false).ok).toBe(true)
  })
})

describe('validateProductForPublish', () => {
  it('exige precio > 0', () => {
    expect(validateProductForPublish({ price: 0 }).ok).toBe(false)
  })
  it('rechaza precio por debajo o igual al costo (sin margen)', () => {
    expect(validateProductForPublish({ price: 10000, cost: 10000 }).ok).toBe(false)
    expect(validateProductForPublish({ price: 9000, cost: 10000 }).ok).toBe(false)
  })
  it('acepta precio con margen sobre el costo', () => {
    expect(validateProductForPublish({ price: 18000, cost: 10000 }).ok).toBe(true)
  })
  it('si hay variantes, exige al menos una disponible', () => {
    expect(
      validateProductForPublish({
        price: 18000,
        cost: 10000,
        variants: [{ availability: 'out_of_stock' }, { availability: 'discontinued' }],
      }).ok,
    ).toBe(false)
    expect(
      validateProductForPublish({
        price: 18000,
        cost: 10000,
        variants: [{ availability: 'out_of_stock' }, { availability: 'available' }],
      }).ok,
    ).toBe(true)
  })
  it('sin costo resoluble no bloquea por margen', () => {
    expect(validateProductForPublish({ price: 5000, cost: null }).ok).toBe(true)
  })
})

describe('resolveProductCost', () => {
  it('usa cost_partner explícito', () => {
    expect(resolveProductCost({ cost_partner: 7777 }, 'starter')).toBe(7777)
  })
  it('cae a garment pricing por garmentKey', () => {
    expect(resolveProductCost({ garmentKey: 'aura-oversize-tshirt' }, 'growth')).toBe(10000)
  })
  it('devuelve null si no hay costo resoluble', () => {
    expect(resolveProductCost({}, 'starter')).toBe(null)
  })
})

describe('CRUD tenant-scoping', () => {
  it('createVariant: producto de otro tenant → 404', async () => {
    h.single.mockResolvedValueOnce({ data: null, error: null }) // productBelongsToTenant → false
    const r = await createVariant('tenant-attacker', 'foreign-product', { color: 'Negro' })
    expect(r.ok).toBe(false)
    expect(r.status).toBe(404)
  })

  it('createVariant: producto propio → crea', async () => {
    h.single
      .mockResolvedValueOnce({ data: { id: 'p1' }, error: null }) // ownership ok
      .mockResolvedValueOnce({ data: { id: 'v1', product_id: 'p1', color: 'Negro' }, error: null }) // insert
    const r = await createVariant('tenant-a', 'p1', { color: 'Negro', size: 'M' })
    expect(r.ok).toBe(true)
    expect(r.variant?.id).toBe('v1')
  })

  it('deleteVariant: producto de otro tenant → 404', async () => {
    h.single.mockResolvedValueOnce({ data: null, error: null })
    const r = await deleteVariant('tenant-attacker', 'foreign-product', 'v1')
    expect(r.ok).toBe(false)
    expect(r.status).toBe(404)
  })
})
