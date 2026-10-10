/**
 * Bug reportado 08/10: un usuario con sesión VÁLIDA pero sin membership
 * aceptada en ningún tenant recibía el mismo 401 "Se venció tu sesión..."
 * que una sesión realmente vencida — y app/workspace/layout.tsx tragaba el
 * error silenciosamente, mostrando un workspace vacío sin ninguna pista.
 *
 * Este test fija el contrato de status/code de /api/partners/me para los
 * cuatro casos: sesión inválida, sin tenant, tenant ajeno (x-tenant-id
 * stale) y ok.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/partners/permissions', () => ({
  resolveRequestUser: vi.fn(),
  resolveActiveTenant: vi.fn(),
}))

vi.mock('@/lib/supabase-admin', () => ({
  supabaseAdmin: {
    from: () => ({
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({ data: { terms_version: 'v1' } }),
        }),
      }),
      update: () => ({
        eq: () => Promise.resolve({ data: null, error: null }),
      }),
    }),
  },
}))

vi.mock('@/lib/partners/terms-version', () => ({
  CURRENT_TERMS_VERSION: 'v1',
}))

import { resolveRequestUser, resolveActiveTenant } from '@/lib/partners/permissions'
import { GET } from './route'

const mResolveRequestUser = resolveRequestUser as unknown as ReturnType<typeof vi.fn>
const mResolveActiveTenant = resolveActiveTenant as unknown as ReturnType<typeof vi.fn>

function makeRequest(): any {
  return {
    headers: { get: () => null },
    cookies: { getAll: () => [] },
  }
}

const TENANT_A = {
  id: 'tenant-a',
  name: 'Acme',
  slug: 'acme',
  logo_url: null,
  plan: 'starter',
  status: 'active',
  email: 'partner@acme.com',
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('GET /api/partners/me — status/code por resolución', () => {
  it('sin sesión válida → 401 SESSION_EXPIRED', async () => {
    mResolveRequestUser.mockResolvedValue(null)

    const res = await GET(makeRequest())
    const body = await res.json()

    expect(res.status).toBe(401)
    expect(body.code).toBe('SESSION_EXPIRED')
  })

  it('sesión válida sin membership → 403 NO_TENANT (no 401 — no es la sesión)', async () => {
    mResolveRequestUser.mockResolvedValue({ userId: 'u1', email: 'u1@x.com', isPlatformAdmin: false })
    mResolveActiveTenant.mockResolvedValue({ kind: 'no_membership' })

    const res = await GET(makeRequest())
    const body = await res.json()

    expect(res.status).toBe(403)
    expect(body.code).toBe('NO_TENANT')
  })

  it('x-tenant-id apunta a un tenant ajeno (selección stale) → 404 TENANT_NOT_ALLOWED', async () => {
    mResolveRequestUser.mockResolvedValue({ userId: 'u1', email: 'u1@x.com', isPlatformAdmin: false })
    mResolveActiveTenant.mockResolvedValue({ kind: 'forbidden_tenant' })

    const res = await GET(makeRequest())
    const body = await res.json()

    expect(res.status).toBe(404)
    expect(body.code).toBe('TENANT_NOT_ALLOWED')
  })

  it('con membership aceptada → 200 con los datos del tenant', async () => {
    mResolveRequestUser.mockResolvedValue({ userId: 'u1', email: 'partner@acme.com', isPlatformAdmin: false })
    mResolveActiveTenant.mockResolvedValue({ kind: 'ok', tenant: TENANT_A, role: 'owner' })

    const res = await GET(makeRequest())
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.tenant.id).toBe('tenant-a')
    expect(body.tenant.slug).toBe('acme')
  })

  it('admin de plataforma viendo un tenant ajeno (x-tenant-id) → 200, sin tocar el clickwrap de T&C', async () => {
    mResolveRequestUser.mockResolvedValue({ userId: 'admin-1', email: 'sambu@novamente.ar', isPlatformAdmin: true })
    mResolveActiveTenant.mockResolvedValue({ kind: 'ok', tenant: TENANT_A, role: 'owner' })

    const res = await GET(makeRequest())
    expect(res.status).toBe(200)
  })
})
