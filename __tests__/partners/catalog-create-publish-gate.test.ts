// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

/**
 * Bug real (auditoría workspace, 10/10): POST /api/partners/catalog nunca
 * pasaba `status` a createProduct() — createProduct() defaultea a 'draft'
 * (lib/partners/catalog.ts) — así que crear un producto como "Publicado"
 * desde el panel (app/workspace/catalog/page.tsx manda status: 'published')
 * quedaba guardado como borrador EN SILENCIO: la UI mostraba "Producto
 * creado" igual, sin avisar que en realidad no se publicó.
 *
 * Este archivo cubre el fix: el status del body ahora llega a createProduct,
 * pero solo después de pasar el MISMO gate "EN REGLA" que ya exige el PUT
 * (catalog/[id]/route.ts) antes de publicar — precio > 0 con margen sobre el
 * costo (lib/partners/variants.ts) y frente+dorso (E3, product-sides.ts). Si
 * no pasa el gate, debe devolver un 422 en español y NO crear nada (ni
 * borrador), en vez de draftear en silencio. Si pasa y nace 'published'
 * directo (sin transición draft->published), corre el mismo auto-publish del
 * storefront que from-design/route.ts (onProductPublished).
 */

const TENANT = {
  id: 'tenant-1',
  slug: 'acme',
  plan: 'starter',
  max_products: 50,
  logo_url: 'https://cdn/logo.png',
  banner_url: null as string | null,
  tagline: 'Ropa con onda',
  about_text: null as string | null,
  storefront_published: false,
  status: 'onboarding',
  metadata: null as Record<string, unknown> | null,
  email: 'owner@acme.com',
  name: 'ACME',
}

vi.mock('@/lib/partners/permissions', () => ({
  requireTenantPermission: vi.fn(async () => ({
    ok: true, tenant: TENANT, role: 'owner', userId: 'user-1', email: 'owner@acme.com', isPlatformAdmin: false,
  })),
}))

const h = vi.hoisted(() => ({
  createProductMock: vi.fn(async (_tenantId: string, input: Record<string, unknown>) => ({
    id: 'prod-1',
    ...input,
  })),
  updateTenantMock: vi.fn(async (_id: string, updates: Record<string, unknown>) => ({ ...TENANT, ...updates })),
  countPublishedProductsReadyMock: vi.fn(async (_tenantId: string) => 1),
}))

vi.mock('@/lib/partners/catalog', () => ({
  createProduct: (tenantId: string, input: Record<string, unknown>) => h.createProductMock(tenantId, input),
  countProducts: vi.fn(async () => 0),
  countPublishedProductsReady: (tenantId: string) => h.countPublishedProductsReadyMock(tenantId),
}))

vi.mock('@/lib/partners/tenant', () => ({
  updateTenant: (id: string, updates: Record<string, unknown>) => h.updateTenantMock(id, updates),
}))

vi.mock('@/lib/partners/garment-pricing.server', () => ({
  getAllPublicGarmentPricing: vi.fn(() => ({})),
  ALL_GARMENT_PRICING: {},
  getPartnerPlanPrice: () => null,
}))

// El gate "solo nuestros mockups" (product-image-origin.ts) ya tiene su
// propia cobertura en catalog-product-image-gate.test.ts — acá no es lo que
// se está probando, así que se neutraliza (siempre "URL propia") para poder
// enfocarse en el gate EN REGLA nuevo.
vi.mock('@/lib/partners/product-image-origin', async () => {
  const actual = await vi.importActual<typeof import('@/lib/partners/product-image-origin')>(
    '@/lib/partners/product-image-origin',
  )
  return {
    ...actual,
    findFirstDisallowedProductImage: vi.fn(async () => null),
    findFirstDisallowedColorImage: vi.fn(async () => null),
  }
})

// onProductPublished (lib/partners/auto-publish.ts) manda un email best-effort
// y hace updates fire-and-forget sobre `tenants` — se mockean para que el test
// no dependa de la red ni de Supabase real.
vi.mock('@/lib/email', () => ({ sendEmail: vi.fn(async () => {}) }))
vi.mock('@/lib/partners/storefront-reactivated-email', () => ({
  buildStorefrontReactivatedEmail: vi.fn(() => ({ subject: 's', html: 'h' })),
}))

vi.mock('@/lib/supabase-admin', () => {
  const chain: any = {
    update: () => chain,
    eq: () => chain,
    is: async () => ({ error: null }),
  }
  return { supabaseAdmin: { from: () => chain } }
})

import { POST } from '@/app/api/partners/catalog/route'

function makeRequest(body: unknown) {
  return new NextRequest('http://localhost/api/partners/catalog', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'content-type': 'application/json' },
  })
}

const FRONT = 'https://cdn.example.com/front.jpg'
const BACK = 'https://cdn.example.com/back.jpg'

describe('POST /api/partners/catalog — status pasa al crear + gate EN REGLA al publicar', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    h.createProductMock.mockImplementation(async (_tenantId: string, input: Record<string, unknown>) => ({
      id: 'prod-1',
      ...input,
    }))
    h.updateTenantMock.mockImplementation(async (_id: string, updates: Record<string, unknown>) => ({ ...TENANT, ...updates }))
    h.countPublishedProductsReadyMock.mockImplementation(async () => 1)
  })

  it('status:"draft" (o ausente) crea el producto como draft sin pasar por el gate EN REGLA', async () => {
    const res = await POST(makeRequest({ name: 'Remera test', price: null, images: [] }))
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.product.status).toBe('draft')
    expect(h.createProductMock).toHaveBeenCalledWith('tenant-1', expect.objectContaining({ status: 'draft' }))
  })

  it('status:"published" EN REGLA (precio + frente/dorso) crea el producto YA publicado, no draft', async () => {
    const res = await POST(makeRequest({
      name: 'Remera test',
      price: 25000,
      images: [FRONT, BACK],
      status: 'published',
    }))
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.product.status).toBe('published')
    expect(h.createProductMock).toHaveBeenCalledWith('tenant-1', expect.objectContaining({ status: 'published' }))
  })

  it('status:"published" sin precio => 422 en español, NO crea nada (ni draft)', async () => {
    const res = await POST(makeRequest({
      name: 'Remera test',
      price: null,
      images: [FRONT, BACK],
      status: 'published',
    }))
    expect(res.status).toBe(422)
    const body = await res.json()
    expect(body.error).toMatch(/precio/i)
    expect(h.createProductMock).not.toHaveBeenCalled()
  })

  it('status:"published" con precio que no cubre el costo (margen) => 422, NO crea nada', async () => {
    const res = await POST(makeRequest({
      name: 'Remera test',
      price: 15000,
      images: [FRONT, BACK],
      status: 'published',
      metadata: { cost_partner: 20000 },
    }))
    expect(res.status).toBe(422)
    const body = await res.json()
    expect(body.error).toMatch(/costo de producci/i)
    expect(h.createProductMock).not.toHaveBeenCalled()
  })

  it('status:"published" con una sola imagen (sin dorso) => 422 "frente y dorso", NO crea nada', async () => {
    const res = await POST(makeRequest({
      name: 'Remera test',
      price: 25000,
      images: [FRONT],
      status: 'published',
    }))
    expect(res.status).toBe(422)
    const body = await res.json()
    expect(body.error).toMatch(/frente y dorso/i)
    expect(h.createProductMock).not.toHaveBeenCalled()
  })

  it('status:"published" EN REGLA + branding mínimo + ≥1 publicado en regla => auto-publica el storefront', async () => {
    const res = await POST(makeRequest({
      name: 'Remera test',
      price: 25000,
      images: [FRONT, BACK],
      status: 'published',
    }))
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.auto_published).toBe(true)
    expect(h.updateTenantMock).toHaveBeenCalledWith('tenant-1', {
      storefront_published: true,
      status: 'active',
    })
  })

  it('status:"draft" nunca dispara el auto-publish del storefront', async () => {
    const res = await POST(makeRequest({ name: 'Remera test', price: 25000, images: [FRONT, BACK] }))
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.auto_published).toBe(false)
    expect(h.updateTenantMock).not.toHaveBeenCalled()
  })
})
