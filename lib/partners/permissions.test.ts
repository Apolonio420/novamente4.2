import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/supabase-admin', () => ({
  supabaseAdmin: { auth: { getUser: vi.fn() } },
}))
vi.mock('./tenant', () => ({
  getTenantById: vi.fn(),
  getTenantByUserId: vi.fn(),
  getUserTenantRole: vi.fn(),
}))

import { supabaseAdmin } from '@/lib/supabase-admin'
import { getTenantById, getTenantByUserId, getUserTenantRole } from './tenant'
import {
  hasPermission,
  decideAccessStatus,
  requireTenantPermission,
  ROLE_PERMISSIONS,
  type Permission,
} from './permissions'

const authGetUser = (supabaseAdmin as any).auth.getUser as ReturnType<typeof vi.fn>
const mGetTenantById = getTenantById as unknown as ReturnType<typeof vi.fn>
const mGetTenantByUserId = getTenantByUserId as unknown as ReturnType<typeof vi.fn>
const mGetUserTenantRole = getUserTenantRole as unknown as ReturnType<typeof vi.fn>

function makeRequest(headers: Record<string, string> = {}): any {
  const lower: Record<string, string> = {}
  for (const k of Object.keys(headers)) lower[k.toLowerCase()] = headers[k]
  return {
    headers: { get: (k: string) => lower[k.toLowerCase()] ?? null },
    cookies: { getAll: () => [] },
  }
}

const TENANT_A = { id: 'tenant-a', slug: 'a', name: 'A' } as any
const TENANT_B = { id: 'tenant-b', slug: 'b', name: 'B' } as any

beforeEach(() => {
  vi.clearAllMocks()
})

describe('ROLE_PERMISSIONS matrix', () => {
  it('owner puede todo lo sensible (equipo, banco, retiros, plan, settings)', () => {
    const sensitive: Permission[] = [
      'team:manage', 'bank:manage', 'withdrawals:manage', 'billing:manage', 'settings:write',
    ]
    for (const p of sensitive) expect(hasPermission('owner', p)).toBe(true)
  })

  it('operator NO tiene equipo/banco/retiros/plan ni settings:write', () => {
    const forbidden: Permission[] = [
      'team:read', 'team:manage', 'bank:read', 'bank:manage',
      'withdrawals:read', 'withdrawals:manage', 'billing:manage', 'settings:write',
    ]
    for (const p of forbidden) expect(hasPermission('operator', p)).toBe(false)
  })

  it('operator SÍ opera catálogo/leads/pedidos/diseños/soporte/marketing', () => {
    const allowed: Permission[] = [
      'catalog:write', 'leads:write', 'orders:write',
      'designs:write', 'support:write', 'marketing:write',
    ]
    for (const p of allowed) expect(hasPermission('operator', p)).toBe(true)
  })

  it('viewer es estrictamente sólo lectura (ningún :write/:manage)', () => {
    for (const perm of ROLE_PERMISSIONS.viewer) {
      expect(perm.endsWith(':write') || perm.endsWith(':manage')).toBe(false)
    }
    expect(hasPermission('viewer', 'leads:read')).toBe(true)
    expect(hasPermission('viewer', 'leads:write')).toBe(false)
    expect(hasPermission('viewer', 'bank:read')).toBe(false)
  })
})

describe('decideAccessStatus (semántica de aislamiento y roles)', () => {
  it('sin membership → 401', () => {
    expect(decideAccessStatus({ kind: 'no_membership' }, 'leads:read')).toBe(401)
  })
  it('tenant ajeno → 404 (no filtra existencia, ni con permiso de lectura)', () => {
    expect(decideAccessStatus({ kind: 'forbidden_tenant' }, 'leads:read')).toBe(404)
    expect(decideAccessStatus({ kind: 'forbidden_tenant' }, 'withdrawals:manage')).toBe(404)
  })
  it('viewer intentando escribir → 403', () => {
    expect(decideAccessStatus({ kind: 'ok', role: 'viewer' }, 'leads:write')).toBe(403)
  })
  it('operator intentando retiro → 403', () => {
    expect(decideAccessStatus({ kind: 'ok', role: 'operator' }, 'withdrawals:manage')).toBe(403)
  })
  it('operator escribiendo lead → 200', () => {
    expect(decideAccessStatus({ kind: 'ok', role: 'operator' }, 'leads:write')).toBe(200)
  })
  it('owner haciendo retiro → 200', () => {
    expect(decideAccessStatus({ kind: 'ok', role: 'owner' }, 'withdrawals:manage')).toBe(200)
  })
})

describe('requireTenantPermission (integración con I/O mockeada)', () => {
  function authUser(email = 'partner@acme.com', id = 'user-1') {
    authGetUser.mockResolvedValue({ data: { user: { id, email } }, error: null })
  }

  it('sin token → 401', async () => {
    const res = await requireTenantPermission(makeRequest(), 'leads:read')
    expect(res.ok).toBe(false)
    expect(res.ok ? null : res.status).toBe(401)
  })

  it('token inválido → 401', async () => {
    authGetUser.mockResolvedValue({ data: { user: null }, error: { message: 'bad jwt' } })
    const res = await requireTenantPermission(makeRequest({ authorization: 'Bearer x' }), 'leads:read')
    expect(res.ok).toBe(false)
    expect(res.ok ? null : res.status).toBe(401)
  })

  it('aislamiento: pedir tenant ajeno vía x-tenant-id → 404 sin tocar la tabla tenants', async () => {
    authUser()
    mGetUserTenantRole.mockResolvedValue(null) // no es miembro de tenant-b
    const res = await requireTenantPermission(
      makeRequest({ authorization: 'Bearer t', 'x-tenant-id': 'tenant-b' }),
      'leads:read',
    )
    expect(res.ok).toBe(false)
    expect(res.ok ? null : res.status).toBe(404)
    // No leak: tras el miss de membership no se consulta el tenant ajeno
    expect(mGetTenantById).not.toHaveBeenCalled()
  })

  it('rol: viewer no puede escribir leads en su propio tenant → 403', async () => {
    authUser()
    mGetTenantByUserId.mockResolvedValue(TENANT_A)
    mGetUserTenantRole.mockResolvedValue({ role: 'viewer', accepted_at: '2026-01-01' })
    const res = await requireTenantPermission(makeRequest({ authorization: 'Bearer t' }), 'leads:write')
    expect(res.ok).toBe(false)
    expect(res.ok ? null : res.status).toBe(403)
  })

  it('rol: operator escribe leads en su tenant → ok', async () => {
    authUser()
    mGetTenantByUserId.mockResolvedValue(TENANT_A)
    mGetUserTenantRole.mockResolvedValue({ role: 'operator', accepted_at: '2026-01-01' })
    const res = await requireTenantPermission(makeRequest({ authorization: 'Bearer t' }), 'leads:write')
    expect(res.ok).toBe(true)
    if (res.ok) {
      expect(res.tenant.id).toBe('tenant-a')
      expect(res.role).toBe('operator')
    }
  })

  it('selector: cambiar a otra membership válida vía x-tenant-id', async () => {
    authUser()
    mGetUserTenantRole.mockResolvedValue({ role: 'owner', accepted_at: '2026-01-01' })
    mGetTenantById.mockResolvedValue(TENANT_B)
    const res = await requireTenantPermission(
      makeRequest({ authorization: 'Bearer t', 'x-tenant-id': 'tenant-b' }),
      'withdrawals:manage',
    )
    expect(res.ok).toBe(true)
    if (res.ok) {
      expect(res.tenant.id).toBe('tenant-b')
      expect(res.role).toBe('owner')
    }
  })

  it('admin de plataforma puede operar un tenant ajeno (soporte)', async () => {
    authUser('apolonio@novamente.ar', 'admin-1')
    mGetTenantById.mockResolvedValue(TENANT_B)
    const res = await requireTenantPermission(
      makeRequest({ authorization: 'Bearer t', 'x-tenant-id': 'tenant-b' }),
      'withdrawals:manage',
    )
    expect(res.ok).toBe(true)
    if (res.ok) {
      expect(res.role).toBe('owner')
      expect(res.isPlatformAdmin).toBe(true)
    }
  })

  it('invitación pendiente sin aceptar no puede actuar → 401', async () => {
    authUser()
    // getTenantByUserId sólo devuelve memberships aceptadas; pendiente → sin tenant por defecto
    mGetTenantByUserId.mockResolvedValue(null)
    const res = await requireTenantPermission(makeRequest({ authorization: 'Bearer t' }), 'leads:read')
    expect(res.ok).toBe(false)
    expect(res.ok ? null : res.status).toBe(401)
  })
})
