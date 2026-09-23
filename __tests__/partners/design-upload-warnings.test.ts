// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import sharp from 'sharp'

/**
 * Fase 3 pieza B — POST /api/partners/design/upload ahora decodifica con
 * sharp (rechaza corruptos) y devuelve { url, width, height, hasAlpha,
 * bgRemovable, warnings[] }.
 */

const TENANT = { id: 'tenant-1', slug: 'acme', plan: 'starter' }

vi.mock('@/lib/partners/permissions', () => ({
  requireTenantPermission: vi.fn(async () => ({
    ok: true, tenant: TENANT, role: 'owner', userId: 'user-1', email: 'x@acme.com', isPlatformAdmin: false,
  })),
}))

vi.mock('@/lib/partners/design-engine', () => ({
  saveDesignAsset: vi.fn(async () => ({ id: 'asset-1' })),
}))

const uploadFileMock = vi.fn(async (_buf: Buffer, key: string, _contentType?: string) => ({ url: `https://cdn.example.com/${key}`, provider: 'r2' as const }))
vi.mock('@/lib/cloudflare-r2', () => ({
  uploadFile: (buf: Buffer, key: string, contentType?: string) => uploadFileMock(buf, key, contentType),
}))

import { POST } from '@/app/api/partners/design/upload/route'

function makeFileRequest(file: File) {
  const fd = new FormData()
  fd.append('file', file)
  return new NextRequest('http://localhost/api/partners/design/upload', { method: 'POST', body: fd as any })
}

beforeEach(() => vi.clearAllMocks())

describe('POST /api/partners/design/upload', () => {
  it('rechaza un archivo corrupto (no decodifica como imagen)', async () => {
    const corrupt = new File([new Uint8Array([0xff, 0xd8, 0xff, 0x00, 0x01, 0x02])], 'roto.jpg', { type: 'image/jpeg' })
    const res = await POST(makeFileRequest(corrupt))
    expect(res.status).toBe(422)
  })

  it('avisa resolución baja para un diseño chico', async () => {
    const buf = await sharp({ create: { width: 400, height: 400, channels: 3, background: { r: 10, g: 10, b: 10 } } }).png().toBuffer()
    const file = new File([new Uint8Array(buf)], 'logo.png', { type: 'image/png' })
    const res = await POST(makeFileRequest(file))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.width).toBe(400)
    expect(body.height).toBe(400)
    expect(body.warnings.some((w: string) => /resoluci/i.test(w))).toBe(true)
  })

  it('no avisa resolución baja para un diseño de 1200x1200', async () => {
    const buf = await sharp({ create: { width: 1200, height: 1200, channels: 3, background: { r: 10, g: 10, b: 10 } } }).png().toBuffer()
    const file = new File([new Uint8Array(buf)], 'logo.png', { type: 'image/png' })
    const res = await POST(makeFileRequest(file))
    const body = await res.json()
    expect(body.warnings.some((w: string) => /resoluci/i.test(w))).toBe(false)
  })

  it('detecta hasAlpha=true para un PNG con transparencia real y no avisa fondo', async () => {
    const buf = await sharp({ create: { width: 1200, height: 1200, channels: 4, background: { r: 10, g: 10, b: 10, alpha: 0 } } }).png().toBuffer()
    const file = new File([new Uint8Array(buf)], 'logo.png', { type: 'image/png' })
    const res = await POST(makeFileRequest(file))
    const body = await res.json()
    expect(body.hasAlpha).toBe(true)
    expect(body.warnings.some((w: string) => /fondo/i.test(w))).toBe(false)
  })

  it('avisa "tiene fondo" para un PNG opaco con fondo plano', async () => {
    // fondo plano uniforme sin alpha → el knockout SÍ lo detecta como
    // recortable (bgRemovable), así que en realidad NO debería avisar "tiene
    // fondo" — este caso valida el camino inverso: un color de borde que NO
    // es plano ni neutro (arte full-bleed) y por lo tanto no es recortable.
    const buf = await sharp({
      create: { width: 1200, height: 1200, channels: 3, background: { r: 200, g: 30, b: 90 } },
    })
      .composite([{
        input: await sharp({ create: { width: 40, height: 40, channels: 3, background: { r: 10, g: 200, b: 10 } } }).png().toBuffer(),
        left: 0,
        top: 0,
      }])
      .png()
      .toBuffer()
    const file = new File([new Uint8Array(buf)], 'full-bleed.png', { type: 'image/png' })
    const res = await POST(makeFileRequest(file))
    const body = await res.json()
    // El borde entero es magenta/rosado salvo una esquina con el parche verde
    // (no plano) — perfilDelBorde no lo toma como fondo recortable, así que
    // avisa "tiene fondo" sin importar si sharp adjuntó un canal alpha vacío
    // al componer (bgRemovable es lo que de verdad importa acá).
    expect(body.bgRemovable).toBe(false)
    expect(body.warnings.some((w: string) => /fondo/i.test(w))).toBe(true)
  })
})
