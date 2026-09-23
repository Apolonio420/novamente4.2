import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

/**
 * Regresión Fase 2 "solo nuestros mockups": este endpoint de subida libre
 * aceptaba cualquier `type` de formulario (incluido "product", que usaba el
 * catálogo para la foto de vidriera) sin validar contenido — ver
 * lib/partners/product-image-origin.ts para el gate del lado de catálogo.
 * Acá se cierra la puerta de entrada: "product" (y cualquier otro no
 * relevado) ya no puede subir nada por este endpoint.
 */

const storageUploadMock = vi.fn(async () => ({ error: null }))
const getPublicUrlMock = vi.fn(() => ({ data: { publicUrl: 'https://cdn.example.com/x.png' } }))
const insertMock = vi.fn(async () => ({ data: null, error: null }))

vi.mock('@/lib/supabase-admin', () => ({
  supabaseAdmin: {
    storage: {
      from: () => ({
        upload: storageUploadMock,
        getPublicUrl: getPublicUrlMock,
      }),
    },
    from: () => ({ insert: insertMock, select: () => ({ eq: () => ({ eq: () => ({}) }) }) }),
  },
}))

vi.mock('@/lib/partners/permissions', () => ({ requireTenantPermission: vi.fn() }))
vi.mock('@/lib/partners/plan-limits', () => ({ getDesignUploadLimit: () => Infinity }))

import { requireTenantPermission } from '@/lib/partners/permissions'
import { POST } from './route'

const requirePermission = requireTenantPermission as ReturnType<typeof vi.fn>

function makeUploadRequest(type: string) {
  const form = new FormData()
  form.append('file', new File(['x'], 'photo.png', { type: 'image/png' }))
  form.append('type', type)
  return new NextRequest('http://localhost/api/partners/upload', {
    method: 'POST',
    body: form,
  })
}

describe('POST /api/partners/upload', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    requirePermission.mockResolvedValue({
      ok: true,
      tenant: { id: 'tenant-1', slug: 'impulso', plan: 'starter' },
      role: 'owner',
      userId: 'user-1',
    })
  })

  it('rejects type="product" with 400 and never touches storage', async () => {
    const res = await POST(makeUploadRequest('product'))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toMatch(/Studio/i)
    expect(storageUploadMock).not.toHaveBeenCalled()
  })

  it('rejects an unrecognized type with 400', async () => {
    const res = await POST(makeUploadRequest('mockup'))
    expect(res.status).toBe(400)
    expect(storageUploadMock).not.toHaveBeenCalled()
  })

  it('still allows type="logo"', async () => {
    const res = await POST(makeUploadRequest('logo'))
    expect(res.status).toBe(200)
    expect(storageUploadMock).toHaveBeenCalled()
  })

  it('still allows type="design"', async () => {
    const res = await POST(makeUploadRequest('design'))
    expect(res.status).toBe(200)
    expect(storageUploadMock).toHaveBeenCalled()
  })
})
