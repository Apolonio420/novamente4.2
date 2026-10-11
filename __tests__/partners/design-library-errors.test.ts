// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// Auditoría workspace 10/10: un error de Supabase en la biblioteca / sesiones
// del Studio se devolvía como lista vacía (200) y la UI mostraba "Todavía no
// generaste ningún diseño". Ahora getDesignAssets tira y las rutas devuelven 500.

const h = vi.hoisted(() => ({
  tenantResult: { tenant: { id: 'tenant-1' } } as unknown,
  assetsResult: { data: [] as unknown[] | null, error: null as unknown },
  sessionsResult: { data: [] as unknown[] | null, error: null as unknown },
}))

vi.mock('@/lib/partners/auth', () => ({ getRequestTenant: vi.fn(async () => h.tenantResult) }))
vi.mock('@/lib/partners/permissions', () => ({
  requireTenantPermission: vi.fn(async () => ({ ok: true, tenant: { id: 'tenant-1' }, userId: 'u1' })),
}))
vi.mock('@/lib/supabase-admin', () => {
  const make = (table: string): any => {
    const q: any = {
      select: () => q, eq: () => q, order: () => q, limit: () => q,
      then: (resolve: (v: unknown) => void) =>
        resolve(table === 'partner_assets' ? h.assetsResult : h.sessionsResult),
    }
    return q
  }
  return { supabaseAdmin: { from: (t: string) => make(t) } }
})

import { GET as libraryGet } from '@/app/api/partners/design/library/route'
import { GET as sessionsGet } from '@/app/api/partners/design/sessions/route'

const req = (u: string) => new NextRequest(`http://localhost${u}`)

describe('design library / sessions no tragan errores de Supabase', () => {
  beforeEach(() => {
    h.tenantResult = { tenant: { id: 'tenant-1' } }
    h.assetsResult = { data: [], error: null }
    h.sessionsResult = { data: [], error: null }
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  it('library: error de DB => 500 (no assets: [])', async () => {
    h.assetsResult = { data: null, error: { message: 'boom' } }
    const res = await libraryGet(req('/api/partners/design/library'))
    expect(res.status).toBe(500)
    expect((await res.json()).error).toMatch(/biblioteca/i)
  })

  it('library: sin diseños de verdad => 200 con assets vacío', async () => {
    const res = await libraryGet(req('/api/partners/design/library'))
    expect(res.status).toBe(200)
    expect((await res.json()).assets).toEqual([])
  })

  it('library: sin sesión => 401', async () => {
    h.tenantResult = null
    const res = await libraryGet(req('/api/partners/design/library'))
    expect(res.status).toBe(401)
  })

  it('sessions: error de DB => 500 (no sessions: [])', async () => {
    h.sessionsResult = { data: null, error: { message: 'boom' } }
    const res = await sessionsGet(req('/api/partners/design/sessions'))
    expect(res.status).toBe(500)
  })

  it('sessions: sin sesiones de verdad => 200 vacío', async () => {
    const res = await sessionsGet(req('/api/partners/design/sessions'))
    expect(res.status).toBe(200)
    expect((await res.json()).sessions).toEqual([])
  })
})
