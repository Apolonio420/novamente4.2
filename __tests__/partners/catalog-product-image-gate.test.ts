import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

/**
 * Fase 2 "solo nuestros mockups": POST y PUT de /api/partners/catalog deben
 * rechazar una URL de imagen de producto NUEVA que no venga del Studio (o de
 * un patrón legacy reconocido) — ver lib/partners/product-image-origin.ts.
 * Las URLs que un producto YA TENÍA (PUT) siguen permitidas.
 */

const TENANT = { id: 'tenant-1', slug: 'impulso', plan: 'starter', max_products: 50 }
const GOOD_URL = '/api/proxy-image?key=partners%2Fimpulso%2Fmockups%2Fabc.png'
const BAD_URL = 'https://images.unsplash.com/photo-123'

vi.mock('@/lib/partners/permissions', () => ({
  requireTenantPermission: vi.fn(async () => ({
    ok: true,
    tenant: TENANT,
    role: 'owner',
    userId: 'user-1',
  })),
}))

// Estado del fixture "producto existente" que `getProductById` (PUT route)
// devuelve via `.single()` — mutable por test (hoisted para que el factory
// de vi.mock lo vea).
const state = vi.hoisted(() => ({
  existingProduct: null as null | Record<string, unknown>,
}))

// El gate consulta partner_assets — sin filas, así que solo el patrón de key
// del compositor Studio decide (mismo mock minimalista que product-image-origin.test.ts).
vi.mock('@/lib/supabase-admin', () => {
  function makeQuery() {
    const query: any = {
      from() { return query },
      select() { return query },
      eq() { return query },
      neq() { return query },
      limit() { return query },
      is() { return query },
      update() { return query },
      single() { return Promise.resolve({ data: state.existingProduct, error: state.existingProduct ? null : new Error('not found') }) },
      then(resolve: (v: unknown) => void) { resolve({ data: [], error: null }) },
    }
    return query
  }
  return { supabaseAdmin: { from: () => makeQuery() } }
})

const createProductMock = vi.fn(async (_tenantId: string, input: Record<string, unknown>) => ({
  id: 'prod-1',
  ...input,
}))
vi.mock('@/lib/partners/catalog', () => ({
  createProduct: (tenantId: string, input: Record<string, unknown>) => createProductMock(tenantId, input),
  countProducts: vi.fn(async () => 0),
  updateProduct: vi.fn(async (id: string, updates: Record<string, unknown>) => ({ id, ...updates })),
  deleteProduct: vi.fn(),
  generateUniqueSlug: vi.fn(async () => 'slug'),
  countPublishedProducts: vi.fn(async () => 1),
}))
vi.mock('@/lib/partners/garment-pricing.server', () => ({
  getAllPublicGarmentPricing: vi.fn(() => ({})),
  ALL_GARMENT_PRICING: {},
  getPartnerPlanPrice: () => null,
}))

import { POST as catalogPost } from '@/app/api/partners/catalog/route'
import { PUT as catalogPut } from '@/app/api/partners/catalog/[id]/route'

function makePostRequest(body: unknown) {
  return new NextRequest('http://localhost/api/partners/catalog', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'content-type': 'application/json' },
  })
}

function makePutRequest(body: unknown) {
  return new NextRequest('http://localhost/api/partners/catalog/prod-1', {
    method: 'PUT',
    body: JSON.stringify(body),
    headers: { 'content-type': 'application/json' },
  })
}

describe('POST /api/partners/catalog — image origin gate', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('rejects a product with a non-Studio image URL', async () => {
    const res = await catalogPost(makePostRequest({ name: 'Remera test', price: 20000, images: [BAD_URL] }))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toMatch(/Studio/i)
  })

  it('accepts a product whose image matches the Studio compositor key pattern', async () => {
    const res = await catalogPost(makePostRequest({ name: 'Remera test', price: 20000, images: [GOOD_URL] }))
    expect(res.status).toBe(201)
  })

  it('accepts a product with no images at all', async () => {
    const res = await catalogPost(makePostRequest({ name: 'Remera test', price: 20000 }))
    expect(res.status).toBe(201)
  })

  it('rejects a product whose metadata.colors carries a non-Studio image', async () => {
    const res = await catalogPost(makePostRequest({
      name: 'Remera test',
      price: 20000,
      metadata: { colors: [{ name: 'Negro', hex: '#000', images: { front: BAD_URL } }] },
    }))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toMatch(/Studio/i)
  })

  it('accepts a product whose metadata.colors images all come from the Studio', async () => {
    const res = await catalogPost(makePostRequest({
      name: 'Remera test',
      price: 20000,
      metadata: { colors: [{ name: 'Negro', hex: '#000', images: { front: GOOD_URL, back: GOOD_URL } }] },
    }))
    expect(res.status).toBe(201)
  })
})

describe('PUT /api/partners/catalog/[id] — image origin gate (images + metadata.colors)', () => {
  const params = Promise.resolve({ id: 'prod-1' })

  beforeEach(() => {
    vi.clearAllMocks()
    state.existingProduct = {
      id: 'prod-1',
      tenant_id: TENANT.id,
      status: 'draft',
      price: 20000,
      images: [],
      metadata: {},
    }
  })

  it('rejects a NEW top-level image that is not from the Studio', async () => {
    const res = await catalogPut(makePutRequest({ images: [BAD_URL] }), { params })
    expect(res.status).toBe(400)
  })

  it('allows an existing top-level image to stay untouched on unrelated edits', async () => {
    state.existingProduct!.images = [BAD_URL]
    const res = await catalogPut(makePutRequest({ images: [BAD_URL], price: 21000 }), { params })
    expect(res.status).toBe(200)
  })

  it('rejects a NEW metadata.colors image that is not from the Studio', async () => {
    const res = await catalogPut(makePutRequest({
      metadata: { colors: [{ name: 'Negro', hex: '#000', images: { front: BAD_URL } }] },
    }), { params })
    expect(res.status).toBe(400)
  })

  it('allows an existing metadata.colors image to stay untouched on unrelated metadata edits', async () => {
    state.existingProduct!.metadata = { colors: [{ name: 'Negro', hex: '#000', images: { front: BAD_URL } }] }
    const res = await catalogPut(makePutRequest({
      metadata: { colors: [{ name: 'Negro', hex: '#000', images: { front: BAD_URL } }], sizes: ['M'] },
    }), { params })
    expect(res.status).toBe(200)
  })

  it('accepts a NEW metadata.colors image that comes from the Studio', async () => {
    const res = await catalogPut(makePutRequest({
      metadata: { colors: [{ name: 'Negro', hex: '#000', images: { front: GOOD_URL } }] },
    }), { params })
    expect(res.status).toBe(200)
  })
})
