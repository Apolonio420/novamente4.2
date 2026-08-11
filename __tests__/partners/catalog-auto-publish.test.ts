// Caso Orlando (08/2026): un partner completo su onboarding, cargo branding,
// publico 2 productos... y su /p/<slug> devolvia 404 durante un mes porque
// publicar un producto NUNCA publica el storefront — la unica red de seguridad
// vivia en app/api/partners/branding/route.ts, y si el partner nunca vuelve a
// tocar /workspace/branding no la dispara jamas.
//
// Este archivo cubre la nueva red de seguridad agregada a
// app/api/partners/catalog/[id]/route.ts: cuando un producto pasa a
// 'published', si el tenant tiene branding minimo cargado (ver
// lib/partners/auto-publish.ts) pero el storefront sigue apagado, se publica
// solo.
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

const h = vi.hoisted(() => ({
  tenant: {} as Record<string, unknown>,
  product: {} as Record<string, unknown>,
  updateProductMock: vi.fn(),
  updateTenantMock: vi.fn(),
  tenantWriteCalls: [] as { vals: Record<string, unknown> }[],
}))

vi.mock('@/lib/partners/permissions', () => ({
  requireTenantPermission: vi.fn(async () => ({
    ok: true,
    tenant: h.tenant,
    role: 'owner',
    userId: 'user-1',
    email: 'owner@acme.com',
    isPlatformAdmin: false,
  })),
}))

vi.mock('@/lib/partners/catalog', () => ({
  updateProduct: (id: string, updates: Record<string, unknown>) => h.updateProductMock(id, updates),
  deleteProduct: vi.fn(),
  generateUniqueSlug: vi.fn(async (_tenantId: string, name: string) => name),
}))

// Mockeamos variants.ts entero: evita tener que simular las queries reales de
// listVariants/productBelongsToTenant contra supabaseAdmin y el import
// server-only de garment-pricing.server (ver nota en catalog-update-policy.test.ts).
vi.mock('@/lib/partners/variants', () => ({
  listVariants: vi.fn(async () => []),
  needsPublishedProductValidation: (currentStatus: string, updates: Record<string, unknown>) =>
    updates.status === 'published'
    || (currentStatus === 'published' && (updates.price !== undefined || updates.metadata !== undefined)),
  resolveProductCost: () => null,
  validateProductForPublish: () => ({ ok: true }),
}))

vi.mock('@/lib/partners/tenant', () => ({
  updateTenant: (id: string, updates: Record<string, unknown>) => h.updateTenantMock(id, updates),
}))

// Stub supabaseAdmin: la ruta lo usa (1) para su getProductById local
// (tabla partner_products) y (2) para los writes fire-and-forget de
// first_product_published_at / storefront_published_at (tabla tenants).
vi.mock('@/lib/supabase-admin', () => {
  const productBuilder = {
    select: () => productBuilder,
    eq: () => productBuilder,
    single: async () => ({ data: h.product, error: null }),
  }
  const tenantChain = {
    eq: () => tenantChain,
    is: async () => ({ error: null }),
  }
  return {
    supabaseAdmin: {
      from: (table: string) => {
        if (table === 'partner_products') return productBuilder
        return {
          update: (vals: Record<string, unknown>) => {
            h.tenantWriteCalls.push({ vals })
            return tenantChain
          },
        }
      },
    },
  }
})

import { PUT } from '@/app/api/partners/catalog/[id]/route'

function makeRequest(body: unknown) {
  return new NextRequest('http://localhost:3000/api/partners/catalog/prod-1', {
    method: 'PUT',
    body: JSON.stringify(body),
    headers: { 'content-type': 'application/json' },
  })
}
const params = Promise.resolve({ id: 'prod-1' })

const baseTenant = {
  id: 'tenant-1',
  slug: 'acme',
  plan: 'starter',
  logo_url: null as string | null,
  banner_url: null as string | null,
  tagline: null as string | null,
  about_text: null as string | null,
  storefront_published: false,
  status: 'onboarding',
}

const baseProduct = {
  id: 'prod-1',
  tenant_id: 'tenant-1',
  name: 'Remera Aldea',
  description: 'Remera de algodon',
  category: 'Remera',
  status: 'draft',
  price: 20000,
  metadata: {},
}

beforeEach(() => {
  vi.clearAllMocks()
  h.tenant = { ...baseTenant }
  h.product = { ...baseProduct }
  h.tenantWriteCalls.length = 0
  h.updateProductMock.mockImplementation(async (id: string, updates: Record<string, unknown>) => ({
    ...h.product,
    ...updates,
    id,
  }))
  h.updateTenantMock.mockImplementation(async (_id: string, updates: Record<string, unknown>) => {
    Object.assign(h.tenant, updates)
    return { ...h.tenant }
  })
})

describe('PUT /api/partners/catalog/[id] — auto-publish del storefront', () => {
  it('(a) producto -> published + branding minimo + tienda apagada => auto-publica y activa', async () => {
    h.tenant.logo_url = 'https://cdn/logo.png'
    h.tenant.tagline = 'Ropa con onda'
    h.tenant.storefront_published = false
    h.tenant.status = 'onboarding'

    const res = await PUT(makeRequest({ status: 'published' }), { params })
    expect(res.status).toBe(200)
    const body = await res.json()

    expect(body.auto_published).toBe(true)
    expect(h.updateTenantMock).toHaveBeenCalledWith('tenant-1', {
      storefront_published: true,
      status: 'active',
    })

    // storefront_published_at se setea (patron .is(col, null) — una sola vez)
    const storefrontAtWrite = h.tenantWriteCalls.find((c) => 'storefront_published_at' in c.vals)
    expect(storefrontAtWrite).toBeTruthy()
  })

  it('(b) sin branding minimo (sin logo) => NO publica el storefront', async () => {
    h.tenant.logo_url = null
    h.tenant.banner_url = null
    h.tenant.tagline = null
    h.tenant.about_text = null
    h.tenant.storefront_published = false
    h.tenant.status = 'onboarding'

    const res = await PUT(makeRequest({ status: 'published' }), { params })
    expect(res.status).toBe(200)
    const body = await res.json()

    expect(body.auto_published).toBe(false)
    expect(h.updateTenantMock).not.toHaveBeenCalled()
    const storefrontAtWrite = h.tenantWriteCalls.find((c) => 'storefront_published_at' in c.vals)
    expect(storefrontAtWrite).toBeUndefined()
  })

  it('(c) tienda ya publicada => no re-escribe ni pisa storefront_published_at', async () => {
    h.tenant.logo_url = 'https://cdn/logo.png'
    h.tenant.tagline = 'Ropa con onda'
    h.tenant.storefront_published = true
    h.tenant.status = 'active'

    const res = await PUT(makeRequest({ status: 'published' }), { params })
    expect(res.status).toBe(200)
    const body = await res.json()

    expect(body.auto_published).toBe(false)
    expect(h.updateTenantMock).not.toHaveBeenCalled()
    const storefrontAtWrite = h.tenantWriteCalls.find((c) => 'storefront_published_at' in c.vals)
    expect(storefrontAtWrite).toBeUndefined()
  })

  it('(d) producto pasa a draft => nunca publica el storefront', async () => {
    h.tenant.logo_url = 'https://cdn/logo.png'
    h.tenant.tagline = 'Ropa con onda'
    h.tenant.storefront_published = false
    h.tenant.status = 'onboarding'
    h.product.status = 'published' // el producto baja de published a draft

    const res = await PUT(makeRequest({ status: 'draft' }), { params })
    expect(res.status).toBe(200)
    const body = await res.json()

    expect(body.auto_published).toBe(false)
    expect(h.updateTenantMock).not.toHaveBeenCalled()
  })

  it('producto que no toca status (solo precio) nunca dispara auto-publish', async () => {
    h.tenant.logo_url = 'https://cdn/logo.png'
    h.tenant.tagline = 'Ropa con onda'
    h.tenant.storefront_published = false
    h.tenant.status = 'onboarding'
    h.product.status = 'draft'

    const res = await PUT(makeRequest({ price: 25000 }), { params })
    expect(res.status).toBe(200)
    const body = await res.json()

    expect(body.auto_published).toBe(false)
    expect(h.updateTenantMock).not.toHaveBeenCalled()
  })
})
