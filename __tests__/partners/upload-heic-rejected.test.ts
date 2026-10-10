// @vitest-environment node
//
// Bug verificado 10/10/2026: el sharp instalado (libvips prebuilt, Vercel
// incluido) NO puede decodificar HEIC real — "heif: Error while loading
// plugin: Support for this compression format has not been built in",
// confirmado subiendo un HEIC generado con `sips -s format heic` en macOS.
// Antes de este fix, POST /api/partners/upload aceptaba el archivo crudo
// (sin convertir) y lo servía tal cual → imagen rota en Chrome/casi todos
// los navegadores. Este test cubre el camino completo del endpoint
// (no solo normalizeUploadMimeType), que ahora rechaza HEIC/HEIF con un
// 415 y un mensaje en español que dice cómo resolverlo desde el iPhone.
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

const TENANT = { id: 'tenant-1', slug: 'acme', plan: 'starter' }

vi.mock('@/lib/partners/permissions', () => ({
  requireTenantPermission: vi.fn(async () => ({
    ok: true, tenant: TENANT, role: 'owner', userId: 'user-1', email: 'x@acme.com', isPlatformAdmin: false,
  })),
}))

vi.mock('@/lib/supabase-admin', () => ({
  supabaseAdmin: {
    storage: { from: () => ({ upload: vi.fn(async () => ({ error: null })), getPublicUrl: () => ({ data: { publicUrl: '' } }) }) },
    from: () => ({ insert: vi.fn(async () => ({ error: null })) }),
  },
}))

import { POST } from '@/app/api/partners/upload/route'

function makeFileRequest(file: File, type = 'other') {
  const fd = new FormData()
  fd.append('file', file)
  fd.append('type', type)
  return new NextRequest('http://localhost/api/partners/upload', { method: 'POST', body: fd as any })
}

beforeEach(() => vi.clearAllMocks())

describe('POST /api/partners/upload — HEIC/HEIF rechazado', () => {
  it('rechaza un archivo con Content-Type image/heic con 415 y mensaje de iPhone', async () => {
    const file = new File([new Uint8Array([0, 1, 2, 3])], 'foto.heic', { type: 'image/heic' })
    const res = await POST(makeFileRequest(file))
    expect(res.status).toBe(415)
    const body = await res.json()
    expect(body.error).toMatch(/iphone/i)
  })

  it('rechaza también cuando el navegador no manda Content-Type y se infiere por la extensión .heic (camino real en Safari/iOS)', async () => {
    const file = new File([new Uint8Array([0, 1, 2, 3])], 'foto.heic', { type: '' })
    const res = await POST(makeFileRequest(file))
    expect(res.status).toBe(415)
  })

  it('rechaza un .heif con el mismo 415', async () => {
    const file = new File([new Uint8Array([0, 1, 2, 3])], 'foto.heif', { type: 'image/heif' })
    const res = await POST(makeFileRequest(file))
    expect(res.status).toBe(415)
  })

  it('un JPG normal sigue aceptándose (no es una regresión del fix)', async () => {
    const file = new File([new Uint8Array([0xff, 0xd8, 0xff, 0xe0])], 'foto.jpg', { type: 'image/jpeg' })
    const res = await POST(makeFileRequest(file))
    expect(res.status).toBe(200)
  })
})
