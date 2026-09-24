// app/api/partners/design/publish/route.ts, slot='product_image' — regla
// frente/dorso/extras: `side='front'` reemplaza images[0] (sin correr el
// dorso ni las extras), `side='back'` reemplaza/completa images[1] (requiere
// que ya exista un frente), y sin `side` se mantiene el comportamiento
// legacy de agregar al final. Ver el comentario en la propia route y
// MOCKUP_REQUIRED_SLOTS en lib/partners/product-image-origin.ts.
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

const h = vi.hoisted(() => ({
  tenant: { id: 'tenant-1', slug: 'impulso' } as Record<string, unknown>,
  product: { images: [] as string[] },
  updateCalls: [] as Array<{ id: string; vals: Record<string, unknown> }>,
}))

vi.mock('@/lib/partners/permissions', () => ({
  requireTenantPermission: vi.fn(async () => ({ ok: true, tenant: h.tenant })),
}))

vi.mock('@/lib/partners/product-image-origin', () => ({
  isOwnMockupUrl: vi.fn(async () => ({ ok: true, reason: 'db_asset' })),
  PRODUCT_IMAGE_ORIGIN_ERROR: 'origin-error',
  MAX_PRODUCT_IMAGES: 8,
}))

vi.mock('@/lib/cloudflare-r2', () => ({ uploadFile: vi.fn() }))
vi.mock('@/lib/partners/banner-image', () => ({ toBanner16x9: vi.fn() }))

vi.mock('@/lib/supabase-admin', () => {
  function makeQuery() {
    const query: any = {
      from() { return query },
      select() { return query },
      update(vals: Record<string, unknown>) {
        h.updateCalls.push({ id: 'productId', vals })
        return query
      },
      eq() { return query },
      single: async () => ({ data: h.product, error: null }),
      then(resolve: (v: unknown) => void) {
        resolve({ error: null })
      },
    }
    return query
  }
  return { supabaseAdmin: { from: () => makeQuery() } }
})

import { POST } from '@/app/api/partners/design/publish/route'

function makeRequest(body: Record<string, unknown>) {
  return new NextRequest('http://localhost/api/partners/design/publish', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
}

beforeEach(() => {
  h.product = { images: [] }
  h.updateCalls = []
})

describe('POST /api/partners/design/publish — slot=product_image, side', () => {
  it('side=front on an empty product sets images[0]', async () => {
    h.product = { images: [] }
    const res = await POST(makeRequest({ assetUrl: 'front.png', slot: 'product_image', productId: 'p1', side: 'front' }))
    expect(res.status).toBe(200)
    expect(h.updateCalls[0].vals.images).toEqual(['front.png'])
  })

  it('side=front REPLACES images[0] without disturbing back/extras', async () => {
    h.product = { images: ['old-front.png', 'back.png', 'extra1.png'] }
    const res = await POST(makeRequest({ assetUrl: 'new-front.png', slot: 'product_image', productId: 'p1', side: 'front' }))
    expect(res.status).toBe(200)
    expect(h.updateCalls[0].vals.images).toEqual(['new-front.png', 'back.png', 'extra1.png'])
  })

  it('side=back REPLACES images[1], keeping front and extras', async () => {
    h.product = { images: ['front.png', 'old-back.png', 'extra1.png'] }
    const res = await POST(makeRequest({ assetUrl: 'new-back.png', slot: 'product_image', productId: 'p1', side: 'back' }))
    expect(res.status).toBe(200)
    expect(h.updateCalls[0].vals.images).toEqual(['front.png', 'new-back.png', 'extra1.png'])
  })

  it('side=back on a product with only a front COMPLETES images[1]', async () => {
    h.product = { images: ['front.png'] }
    const res = await POST(makeRequest({ assetUrl: 'back.png', slot: 'product_image', productId: 'p1', side: 'back' }))
    expect(res.status).toBe(200)
    expect(h.updateCalls[0].vals.images).toEqual(['front.png', 'back.png'])
  })

  it('side=back with NO existing front is rejected (never invents a front)', async () => {
    h.product = { images: [] }
    const res = await POST(makeRequest({ assetUrl: 'back.png', slot: 'product_image', productId: 'p1', side: 'back' }))
    expect(res.status).toBe(400)
    expect(h.updateCalls).toHaveLength(0)
  })

  it('without side, appends at the end (legacy behavior)', async () => {
    h.product = { images: ['front.png', 'back.png'] }
    const res = await POST(makeRequest({ assetUrl: 'extra.png', slot: 'product_image', productId: 'p1' }))
    expect(res.status).toBe(200)
    expect(h.updateCalls[0].vals.images).toEqual(['front.png', 'back.png', 'extra.png'])
  })

  it('rejects when the result would exceed MAX_PRODUCT_IMAGES (8)', async () => {
    h.product = { images: ['f', 'b', 'e1', 'e2', 'e3', 'e4', 'e5', 'e6'] }
    const res = await POST(makeRequest({ assetUrl: 'e7.png', slot: 'product_image', productId: 'p1' }))
    expect(res.status).toBe(400)
    expect(h.updateCalls).toHaveLength(0)
  })
})
