// @vitest-environment node
//
// Bug (10/2026, caso lumina): POST /api/partners/products/from-design (Studio
// "Aplicar a prenda") puede crear un producto YA 'published' directo, pero
// a diferencia de PUT /api/partners/catalog/[id] nunca corria el auto-publish
// del storefront (lib/partners/auto-publish.ts) — un tenant podia tener
// productos publicados + branding completo y quedar con
// storefront_published=false para siempre, invisible en /p/<slug> sin aviso.
//
// Este archivo cubre que from-design/route.ts ahora dispara la misma regla
// (onProductPublished) que catalog/[id]/route.ts, vía los 3 casos del bug:
// nace published + branding completo => auto-publica; nace draft => nunca
// toca el storefront; tienda apagada a proposito (storefront_hidden_manually)
// => auto-publish no la republica.
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

const h = vi.hoisted(() => ({
  tenant: {} as Record<string, unknown>,
  updateTenantMock: vi.fn(),
  countPublishedProductsMock: vi.fn(async (_tenantId: string) => 1),
  // onProductPublished (ver lib/partners/auto-publish.ts) usa la variante
  // "en regla" (imagen + precio > 0) para decidir el AUTO-publish — ver
  // lib/partners/catalog.ts.
  countPublishedProductsReadyMock: vi.fn(async (_tenantId: string) => 1),
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

vi.mock('@/lib/mockup/compose', () => ({
  renderProductMockup: vi.fn(async () => Buffer.from('fake-jpeg')),
}))

vi.mock('next/headers', () => ({
  headers: async () => new Headers({ host: 'localhost:3000', 'x-forwarded-proto': 'http' }),
}))

vi.mock('@/lib/cloudflare-r2', () => ({
  uploadFile: vi.fn(async (_buf: Buffer, key: string) => ({ url: `https://cdn.example.com/${key}`, provider: 'r2' as const })),
}))

// resolveProductCost real pega contra garment-pricing.server (archivo
// server-only) — lo mockeamos entero, igual que catalog-auto-publish.test.ts,
// para no simular esas queries; el piso de costo no es lo que este archivo
// cubre.
vi.mock('@/lib/partners/variants', () => ({
  resolveProductCost: () => null,
}))

const createProductMock = vi.fn(async (_tenantId: string, input: Record<string, unknown>) => ({
  id: 'prod-1',
  ...input,
}))
vi.mock('@/lib/partners/catalog', () => ({
  createProduct: (tenantId: string, input: Record<string, unknown>) => createProductMock(tenantId, input),
  countProducts: vi.fn(async () => 0),
  countPublishedProducts: (tenantId: string) => h.countPublishedProductsMock(tenantId),
  countPublishedProductsReady: (tenantId: string) => h.countPublishedProductsReadyMock(tenantId),
}))

vi.mock('@/lib/partners/tenant', () => ({
  updateTenant: (id: string, updates: Record<string, unknown>) => h.updateTenantMock(id, updates),
}))

vi.mock('@/lib/partners/design-engine', () => ({
  saveDesignAsset: vi.fn(async () => ({ id: 'asset-1' })),
}))

// El gate real exige fila en partner_assets (desde 45aec5b); este archivo
// prueba la transicion de status, no el gate de origen.
vi.mock('@/lib/partners/product-image-origin', async (orig) => ({
  ...(await (orig as () => Promise<Record<string, unknown>>)()),
  findFirstDisallowedProductImage: vi.fn(async () => null),
  findFirstDisallowedColorImage: vi.fn(async () => null),
}))

vi.mock('@/lib/supabase-admin', () => {
  const tenantChain = {
    eq: () => tenantChain,
    is: async () => ({ error: null }),
  }
  return {
    supabaseAdmin: {
      from: (table: string) => {
        if (table !== 'tenants') {
          return { update: () => ({ eq: () => ({ is: async () => ({ error: null }) }) }) }
        }
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

import { POST } from '@/app/api/partners/products/from-design/route'

function makeRequest(body: unknown) {
  return new NextRequest('http://localhost:3000/api/partners/products/from-design', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'content-type': 'application/json' },
  })
}

const baseTenant = {
  id: 'tenant-1',
  slug: 'acme',
  name: 'Acme',
  email: 'owner@acme.com',
  plan: 'starter',
  max_products: 10,
  logo_url: null as string | null,
  banner_url: null as string | null,
  tagline: null as string | null,
  about_text: null as string | null,
  storefront_published: false,
  status: 'onboarding',
  metadata: null as Record<string, unknown> | null,
}

const baseBody = {
  name: 'Mi remera',
  price: 30000,
  garmentKey: 'aldea-classic-tshirt',
  colors: ['black'],
  front: { designUrl: 'data:image/png;base64,AAAA' },
  back: null,
  status: 'published',
}

beforeEach(() => {
  vi.clearAllMocks()
  h.tenant = { ...baseTenant }
  h.tenantWriteCalls.length = 0
  h.updateTenantMock.mockImplementation(async (_id: string, updates: Record<string, unknown>) => {
    Object.assign(h.tenant, updates)
    return { ...h.tenant }
  })
  h.countPublishedProductsMock.mockImplementation(async () => 1)
  h.countPublishedProductsReadyMock.mockImplementation(async () => 1)
})

describe('POST /api/partners/products/from-design — auto-publish del storefront', () => {
  it('nace published + branding minimo completo + tienda apagada => auto-publica y activa', async () => {
    h.tenant.logo_url = 'https://cdn/logo.png'
    h.tenant.tagline = 'Ropa con onda'
    h.tenant.storefront_published = false
    h.tenant.status = 'onboarding'

    const res = await POST(makeRequest(baseBody))
    expect(res.status).toBe(201)
    const body = await res.json()

    expect(body.auto_published).toBe(true)
    expect(h.updateTenantMock).toHaveBeenCalledWith('tenant-1', {
      storefront_published: true,
      status: 'active',
    })

    // first_product_published_at y storefront_published_at: patron
    // .is(col, null) — se escriben una sola vez.
    const publishedAtWrite = h.tenantWriteCalls.find((c) => 'first_product_published_at' in c.vals)
    expect(publishedAtWrite).toBeTruthy()
    const storefrontAtWrite = h.tenantWriteCalls.find((c) => 'storefront_published_at' in c.vals)
    expect(storefrontAtWrite).toBeTruthy()
    // Nunca pasa por first_product_draft_at: el producto nacio publicado.
    const draftAtWrite = h.tenantWriteCalls.find((c) => 'first_product_draft_at' in c.vals)
    expect(draftAtWrite).toBeUndefined()
  })

  it('nace draft => nunca toca el storefront ni first_product_published_at', async () => {
    h.tenant.logo_url = 'https://cdn/logo.png'
    h.tenant.tagline = 'Ropa con onda'
    h.tenant.storefront_published = false
    h.tenant.status = 'onboarding'

    const res = await POST(makeRequest({ ...baseBody, status: 'draft' }))
    expect(res.status).toBe(201)
    const body = await res.json()

    expect(body.auto_published).toBe(false)
    expect(h.updateTenantMock).not.toHaveBeenCalled()
    const draftAtWrite = h.tenantWriteCalls.find((c) => 'first_product_draft_at' in c.vals)
    expect(draftAtWrite).toBeTruthy()
    const publishedAtWrite = h.tenantWriteCalls.find((c) => 'first_product_published_at' in c.vals)
    expect(publishedAtWrite).toBeUndefined()
  })

  it('tienda apagada a proposito (storefront_hidden_manually) => auto-publish NO la republica aunque nazca published', async () => {
    h.tenant.logo_url = 'https://cdn/logo.png'
    h.tenant.tagline = 'Ropa con onda'
    h.tenant.storefront_published = false
    h.tenant.status = 'active'
    h.tenant.metadata = { storefront_hidden_manually: true }

    const res = await POST(makeRequest(baseBody))
    expect(res.status).toBe(201)
    const body = await res.json()

    expect(body.auto_published).toBe(false)
    expect(h.updateTenantMock).not.toHaveBeenCalled()
    const storefrontAtWrite = h.tenantWriteCalls.find((c) => 'storefront_published_at' in c.vals)
    expect(storefrontAtWrite).toBeUndefined()
  })

  it('sin branding minimo (sin logo) => nace published pero NO publica el storefront', async () => {
    h.tenant.logo_url = null
    h.tenant.banner_url = null
    h.tenant.tagline = null
    h.tenant.about_text = null
    h.tenant.storefront_published = false
    h.tenant.status = 'onboarding'

    const res = await POST(makeRequest(baseBody))
    expect(res.status).toBe(201)
    const body = await res.json()

    expect(body.auto_published).toBe(false)
    expect(h.updateTenantMock).not.toHaveBeenCalled()
  })

  // Requerimiento del dueño (08/10): "que sea automatica siempre y cuando
  // tenga MINIMAMENTE un producto EN REGLA publicado" — countPublishedProducts
  // (cualquier status='published') no alcanza: un producto publicado sin
  // imagenes o con precio 0 no deberia disparar el auto-publish (caso real:
  // buzo publicado con "Imagenes 0/8" que mostraba la vidriera en blanco).
  // onProductPublished usa countPublishedProductsReady para esto — acá
  // simulamos su resultado (0 "en regla" aunque el producto creado haya
  // nacido published).
  it('producto publicado SIN IMAGENES (no esta en regla) => NO publica el storefront', async () => {
    h.tenant.logo_url = 'https://cdn/logo.png'
    h.tenant.tagline = 'Ropa con onda'
    h.tenant.storefront_published = false
    h.tenant.status = 'onboarding'
    h.countPublishedProductsReadyMock.mockResolvedValue(0)

    const res = await POST(makeRequest(baseBody))
    expect(res.status).toBe(201)
    const body = await res.json()

    expect(body.auto_published).toBe(false)
    expect(h.updateTenantMock).not.toHaveBeenCalled()
    const storefrontAtWrite = h.tenantWriteCalls.find((c) => 'storefront_published_at' in c.vals)
    expect(storefrontAtWrite).toBeUndefined()
  })

  it('producto publicado CON IMAGENES Y PRECIO (en regla) => publica el storefront', async () => {
    h.tenant.logo_url = 'https://cdn/logo.png'
    h.tenant.tagline = 'Ropa con onda'
    h.tenant.storefront_published = false
    h.tenant.status = 'onboarding'
    h.countPublishedProductsReadyMock.mockResolvedValue(1)

    const res = await POST(makeRequest(baseBody))
    expect(res.status).toBe(201)
    const body = await res.json()

    expect(body.auto_published).toBe(true)
    expect(h.updateTenantMock).toHaveBeenCalledWith('tenant-1', {
      storefront_published: true,
      status: 'active',
    })
  })
})
