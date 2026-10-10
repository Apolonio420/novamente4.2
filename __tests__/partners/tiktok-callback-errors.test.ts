// @vitest-environment node
//
// Bug: cada camino de error de GET /api/auth/tiktok/callback devolvía JSON
// crudo (ej. { error: 'Token exchange failed', tiktok: {...} }). El partner
// termina ahí después de un redirect de TikTok — una pantalla de JSON sin
// botón para volver no es una experiencia recuperable. Ahora todos los
// errores redirigen a /workspace/integrations/tiktok?error=<code> con un
// código corto (nunca el texto crudo de TikTok/Supabase) para que la UI
// muestre un mensaje en español con un botón "Volver a intentar".
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

vi.mock('@/lib/partners/tenant', () => ({
  getTenantById: vi.fn(async () => null),
}))

import { GET } from '@/app/api/auth/tiktok/callback/route'
import { getTenantById } from '@/lib/partners/tenant'

function makeRequest(query: string, cookies?: Record<string, string>) {
  const req = new NextRequest(`http://localhost:3000/api/auth/tiktok/callback${query}`)
  if (cookies) {
    for (const [k, v] of Object.entries(cookies)) req.cookies.set(k, v)
  }
  return req
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('GET /api/auth/tiktok/callback — errores redirigen, nunca JSON crudo', () => {
  it('error devuelto por TikTok (usuario canceló) → redirect con error=denied', async () => {
    const res = await GET(makeRequest('?error=access_denied&error_description=user+cancelled&state=tenant-1:nonce'))
    expect(res.status).toBe(307) // NextResponse.redirect default
    const location = res.headers.get('location')
    expect(location).toContain('/workspace/integrations/tiktok?error=denied')
    expect(location).not.toContain('user+cancelled')
    expect(location).not.toContain('access_denied')
  })

  it('falta code o state → redirect con error=missing_params', async () => {
    const res = await GET(makeRequest('?state=tenant-1:nonce'))
    expect(res.headers.get('location')).toContain('error=missing_params')
  })

  it('state no matchea la cookie → redirect con error=invalid_state', async () => {
    const res = await GET(makeRequest('?code=abc&state=tenant-1:nonce', { tiktok_oauth_state: 'otro-valor' }))
    expect(res.headers.get('location')).toContain('error=invalid_state')
  })

  it('falta la cookie de state por completo → redirect con error=invalid_state', async () => {
    const res = await GET(makeRequest('?code=abc&state=tenant-1:nonce'))
    expect(res.headers.get('location')).toContain('error=invalid_state')
  })

  it('borra la cookie tiktok_oauth_state en el redirect de error (no solo en el de éxito)', async () => {
    const res = await GET(makeRequest('?state=tenant-1:nonce'))
    const setCookie = res.headers.get('set-cookie') || ''
    expect(setCookie).toMatch(/tiktok_oauth_state=;/)
  })

  it('tenant no encontrado (después de validar state y credenciales) → redirect con error=tenant_not_found', async () => {
    vi.stubEnv('TIKTOK_CLIENT_KEY', 'key')
    vi.stubEnv('TIKTOK_CLIENT_SECRET', 'secret')
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://example.supabase.co')
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'service-key')

    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({ access_token: 'tok', open_id: 'oid' }),
    }))
    vi.stubGlobal('fetch', fetchMock)
    ;(getTenantById as any).mockResolvedValue(null)

    const res = await GET(makeRequest('?code=abc&state=tenant-1:nonce', { tiktok_oauth_state: 'tenant-1:nonce' }))
    expect(res.headers.get('location')).toContain('error=tenant_not_found')

    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
  })
})
