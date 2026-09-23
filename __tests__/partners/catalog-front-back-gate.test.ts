// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

/**
 * Fase 3 pieza E3 — "frente y dorso siempre": PUT /api/partners/catalog/[id]
 * debe exigir mínimo 2 imágenes (y front+back por color si hay
 * metadata.colors) al pasar a `published`. No debe afectar ediciones que no
 * tocan el status/precio/metadata de un producto ya publicado (mismo
 * criterio que needsPublishedProductValidation).
 */

const TENANT = { id: 'tenant-1', slug: 'acme', plan: 'starter' }

vi.mock('@/lib/partners/permissions', () => ({
  requireTenantPermission: vi.fn(async () => ({
    ok: true, tenant: TENANT, role: 'owner', userId: 'user-1', email: 'x@acme.com', isPlatformAdmin: false,
  })),
}))

let currentExisting: Record<string, unknown> | null = null
const updateProductMock = vi.fn(async (id: string, updates: Record<string, unknown>) => ({
  ...(currentExisting ?? {}),
  ...updates,
  id,
}))
vi.mock('@/lib/partners/catalog', () => ({
  updateProduct: (id: string, updates: Record<string, unknown>) => updateProductMock(id, updates),
  deleteProduct: vi.fn(),
  generateUniqueSlug: vi.fn(async () => 'slug'),
  countPublishedProducts: vi.fn(async () => 1),
}))

vi.mock('@/lib/supabase-admin', () => {
  const builder: any = {
    from: () => builder,
    select: () => builder,
    eq: () => builder,
    order: async () => ({ data: [], error: null }),
    single: async () => ({ data: currentExisting, error: currentExisting ? null : new Error('not found') }),
    update: () => builder,
    is: () => builder,
  }
  return { supabaseAdmin: builder }
})

vi.mock('@/lib/partners/garment-pricing.server', () => ({
  ALL_GARMENT_PRICING: {},
  getPartnerPlanPrice: () => null,
  getAllPublicGarmentPricing: () => ({}),
}))

import { PUT } from '@/app/api/partners/catalog/[id]/route'

function makeRequest(body: unknown) {
  return new NextRequest('http://localhost:3000/api/partners/catalog/prod-1', {
    method: 'PUT',
    body: JSON.stringify(body),
    headers: { 'content-type': 'application/json' },
  })
}
const params = Promise.resolve({ id: 'prod-1' })

describe('PUT /api/partners/catalog/[id] — E3 frente y dorso al publicar', () => {
  beforeEach(() => {
    updateProductMock.mockClear()
  })

  it('rechaza publicar con una sola imagen', async () => {
    currentExisting = { id: 'prod-1', tenant_id: TENANT.id, status: 'draft', price: 20000, images: ['https://x/front.jpg'], metadata: {} }
    const res = await PUT(makeRequest({ status: 'published' }), { params })
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toMatch(/frente y dorso/i)
  })

  it('rechaza publicar cuando un color tiene front pero no back', async () => {
    currentExisting = {
      id: 'prod-1', tenant_id: TENANT.id, status: 'draft', price: 20000,
      images: ['https://x/front.jpg', 'https://x/back.jpg'],
      metadata: { garmentKey: 'aldea-classic-tshirt', colors: [{ key: 'black', images: { front: 'https://x/f.jpg' } }] },
    }
    const res = await PUT(makeRequest({ status: 'published' }), { params })
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toMatch(/frente y dorso/i)
  })

  it('acepta publicar con 2 imágenes y sin metadata.colors', async () => {
    currentExisting = { id: 'prod-1', tenant_id: TENANT.id, status: 'draft', price: 20000, images: ['https://x/front.jpg', 'https://x/back.jpg'], metadata: {} }
    const res = await PUT(makeRequest({ status: 'published' }), { params })
    expect(res.status).toBe(200)
  })

  it('acepta publicar cuando todos los colores tienen front y back', async () => {
    currentExisting = {
      id: 'prod-1', tenant_id: TENANT.id, status: 'draft', price: 20000,
      images: ['https://x/front.jpg', 'https://x/back.jpg'],
      metadata: {
        garmentKey: 'aldea-classic-tshirt',
        colors: [{ key: 'black', images: { front: 'https://x/f.jpg', back: 'https://x/b.jpg' } }],
      },
    }
    const res = await PUT(makeRequest({ status: 'published' }), { params })
    expect(res.status).toBe(200)
  })

  it('bloquea una edición de precio en un producto legacy YA publicado con una sola cara', async () => {
    // needsPublishedProductValidation solo dispara si además de estar
    // publicado se toca price o metadata — acá tocamos price, así que SÍ
    // revalida, y con solo 1 imagen debe rechazar (E3 alcanza también a
    // productos legacy que re-tocan precio, mismo criterio que el resto del
    // publish gate).
    currentExisting = { id: 'prod-1', tenant_id: TENANT.id, status: 'published', price: 20000, images: ['https://x/front.jpg'], metadata: {} }
    const res = await PUT(makeRequest({ price: 21000 }), { params })
    expect(res.status).toBe(400)
  })

  it('permite bajar de visibilidad (hidden) un producto legacy con una sola cara', async () => {
    currentExisting = { id: 'prod-1', tenant_id: TENANT.id, status: 'published', price: 20000, images: ['https://x/front.jpg'], metadata: {} }
    const res = await PUT(makeRequest({ status: 'hidden' }), { params })
    expect(res.status).toBe(200)
  })

  it('no revalida en una edición que no toca status/price/metadata (ni de un producto publicado)', async () => {
    currentExisting = { id: 'prod-1', tenant_id: TENANT.id, status: 'draft', price: 20000, images: ['https://x/front.jpg'], metadata: {} }
    const res = await PUT(makeRequest({ name: 'Nuevo nombre' }), { params })
    expect(res.status).toBe(200)
  })
})
