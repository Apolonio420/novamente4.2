// @vitest-environment node
import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest'
import { NextRequest } from 'next/server'
import sharp from 'sharp'

/**
 * Fase 3 pieza B — contratos de
 *   POST /api/partners/products/mockup-preview
 *   POST /api/partners/products/plain-side
 *   POST /api/partners/products/from-design
 *
 * Todo mockeado (compose, R2, supabase, catalog) — el pipeline real de sharp
 * ya se prueba end-to-end en __tests__/mockup/compose.test.ts.
 */

const TENANT = { id: 'tenant-1', slug: 'acme', plan: 'starter', max_products: 10 }

vi.mock('@/lib/partners/permissions', () => ({
  requireTenantPermission: vi.fn(async () => ({
    ok: true, tenant: TENANT, role: 'owner', userId: 'user-1', email: 'x@acme.com', isPlatformAdmin: false,
  })),
}))

const renderProductMockupMock = vi.fn()
vi.mock('@/lib/mockup/compose', () => ({
  renderProductMockup: (opts: Record<string, unknown>) => renderProductMockupMock(opts),
}))

vi.mock('next/headers', () => ({
  headers: async () => new Headers({ host: 'localhost:3000', 'x-forwarded-proto': 'http' }),
}))

const uploadFileMock = vi.fn(async (_buf: Buffer, key: string, _contentType?: string) => ({ url: `https://cdn.example.com/${key}`, provider: 'r2' as const }))
vi.mock('@/lib/cloudflare-r2', () => ({
  uploadFile: (buf: Buffer, key: string, contentType?: string) => uploadFileMock(buf, key, contentType),
}))

vi.mock('@/lib/partners/garment-pricing.server', () => ({
  ALL_GARMENT_PRICING: { 'aldea-classic-tshirt': true },
  getPartnerPlanPrice: () => 25800,
  getAllPublicGarmentPricing: () => ({}),
}))

const createProductMock = vi.fn(async (_tenantId: string, input: Record<string, unknown>) => ({ id: 'prod-1', ...input }))
vi.mock('@/lib/partners/catalog', () => ({
  createProduct: (tenantId: string, input: Record<string, unknown>) => createProductMock(tenantId, input),
  countProducts: vi.fn(async () => 0),
}))

const saveDesignAssetMock = vi.fn(async () => ({ id: 'asset-1' }))
vi.mock('@/lib/partners/design-engine', () => ({
  saveDesignAsset: (...args: unknown[]) => (saveDesignAssetMock as any)(...args),
}))

// El gate real exige fila en partner_assets (desde 45aec5b); acá se prueba el
// endpoint, no el gate: se simula que las URLs recién registradas pasan.
vi.mock('@/lib/partners/product-image-origin', async (orig) => ({
  ...(await (orig as () => Promise<Record<string, unknown>>)()),
  findFirstDisallowedProductImage: vi.fn(async () => null),
  findFirstDisallowedColorImage: vi.fn(async () => null),
}))

vi.mock('@/lib/supabase-admin', () => {
  const builder: any = {
    from: () => builder,
    select: () => builder,
    eq: () => builder,
    neq: () => builder,
    limit: () => builder,
    is: () => builder,
    update: () => builder,
    then: (resolve: (v: unknown) => void) => resolve({ data: [], error: null }),
  }
  return { supabaseAdmin: builder }
})

import { POST as mockupPreviewPost } from '@/app/api/partners/products/mockup-preview/route'
import { POST as plainSidePost } from '@/app/api/partners/products/plain-side/route'
import { POST as fromDesignPost } from '@/app/api/partners/products/from-design/route'

function req(url: string, body: unknown) {
  return new NextRequest(url, {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'content-type': 'application/json' },
  })
}

let tinyJpeg: Buffer

beforeAll(async () => {
  tinyJpeg = await sharp({ create: { width: 4, height: 4, channels: 3, background: { r: 1, g: 2, b: 3 } } })
    .jpeg()
    .toBuffer()
})

beforeEach(() => {
  vi.clearAllMocks()
  renderProductMockupMock.mockImplementation(async (opts: Record<string, unknown>) => {
    if (opts.garmentKey === 'no-existe') throw new Error('No hay base disponible')
    return tinyJpeg
  })
})

describe('POST /api/partners/products/mockup-preview', () => {
  it('devuelve previewUrl como data URL sin persistir nada', async () => {
    const res = await mockupPreviewPost(req('http://localhost/x', {
      garmentKey: 'aldea-classic-tshirt', color: 'black', side: 'front',
    }))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.previewUrl).toMatch(/^data:image\/jpeg;base64,/)
    expect(uploadFileMock).not.toHaveBeenCalled()
  })

  it('exige garmentKey y color', async () => {
    const res = await mockupPreviewPost(req('http://localhost/x', { side: 'front' }))
    expect(res.status).toBe(400)
  })

  it('devuelve 422 cuando el compositor no encuentra base', async () => {
    const res = await mockupPreviewPost(req('http://localhost/x', {
      garmentKey: 'no-existe', color: 'x', side: 'front',
    }))
    expect(res.status).toBe(422)
  })
})

describe('POST /api/partners/products/plain-side', () => {
  it('renderiza sin diseño y sube a R2, devolviendo la url', async () => {
    const res = await plainSidePost(req('http://localhost/x', {
      garmentKey: 'aldea-classic-tshirt', color: 'black', side: 'back',
    }))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.url).toMatch(/^https:\/\/cdn\.example\.com\/partners\/acme\/mockups\//)
    expect(renderProductMockupMock).toHaveBeenCalledWith(expect.objectContaining({ designBuffer: null, side: 'back' }))
  })
})

describe('POST /api/partners/products/from-design', () => {
  const baseBody = {
    name: 'Mi remera',
    price: 30000,
    garmentKey: 'aldea-classic-tshirt',
    colors: ['black'],
    front: { designUrl: 'data:image/png;base64,AAAA' },
    back: null,
    status: 'draft',
  }

  it('crea el producto con front+back del primer color y metadata.render/print/colors', async () => {
    const res = await fromDesignPost(req('http://localhost/x', baseBody))
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(createProductMock).toHaveBeenCalledTimes(1)
    const [, input] = createProductMock.mock.calls[0]
    expect(input.images).toHaveLength(2)
    expect((input.metadata as any).garmentKey).toBe('aldea-classic-tshirt')
    expect((input.metadata as any).colors).toHaveLength(1)
    expect((input.metadata as any).colors[0].images.front).toBeTruthy()
    expect((input.metadata as any).colors[0].images.back).toBeTruthy()
    expect((input.metadata as any).render.version).toBe(1)
    expect(input.status).toBe('draft')
    expect(body.product.id).toBe('prod-1')
  })

  it('rechaza garmentKey inexistente en CATALOG_PRODUCTS', async () => {
    const res = await fromDesignPost(req('http://localhost/x', { ...baseBody, garmentKey: 'no-existe-catalogo' }))
    expect(res.status).toBe(422)
  })

  it('rechaza un color que no pertenece al garmentKey', async () => {
    const res = await fromDesignPost(req('http://localhost/x', { ...baseBody, colors: ['un-color-inventado'] }))
    expect(res.status).toBe(422)
  })

  it('rechaza precio por debajo del costo del plan', async () => {
    // 1500 pasa el piso "no cargues en miles" (1000) pero queda debajo del
    // costo mockeado (getPartnerPlanPrice => 25800).
    const res = await fromDesignPost(req('http://localhost/x', { ...baseBody, price: 1500 }))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toMatch(/costo de producci/i)
  })

  it('genera 2 colores => 4 renders (front+back x 2) y sube 4 archivos', async () => {
    const res = await fromDesignPost(req('http://localhost/x', { ...baseBody, colors: ['black', 'white'] }))
    expect(res.status).toBe(201)
    expect(renderProductMockupMock).toHaveBeenCalledTimes(4)
    expect(uploadFileMock).toHaveBeenCalledTimes(4)
    // Cada mockup subido queda registrado en partner_assets (lo exige el gate).
    expect(saveDesignAssetMock).toHaveBeenCalledTimes(4)
  })
})
