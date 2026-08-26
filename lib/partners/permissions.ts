import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getTenantById, getTenantByUserId, getUserTenantRole } from './tenant'
import type { Tenant, TenantRole } from './types'

/**
 * Centralized tenant authorization for partner APIs.
 *
 * This module is the single source of truth for:
 *  - who the requesting user is (token extraction + Supabase getUser),
 *  - which tenant is "active" for the request (membership-validated),
 *  - whether the user's role grants the required permission.
 *
 * Security model:
 *  - Every mutation must require an explicit Permission via requireTenantPermission().
 *  - The active tenant can only be one of the user's own memberships. The only
 *    exception is a Novamente platform admin acting on a tenant for support.
 *  - Cross-tenant access (a resource that is not the caller's tenant) returns 404,
 *    never 403 — we do not leak the existence of other tenants' resources.
 */

// Novamente platform staff. They may act on any tenant for support purposes.
export const ADMIN_EMAILS = [
  'apolonio@novamente.ar',
  'sambu@novamente.ar',
  'moishe@novamente.ar',
  'izzaga@novamente.ar',
]

// ---------------------------------------------------------------------------
// Permission model
// ---------------------------------------------------------------------------

export type Permission =
  | 'catalog:read' | 'catalog:write'
  | 'designs:read' | 'designs:write'
  | 'leads:read' | 'leads:write'
  | 'orders:read' | 'orders:write'
  | 'support:read' | 'support:write'
  | 'marketing:read' | 'marketing:write'
  | 'analytics:read'
  | 'settings:read' | 'settings:write'
  | 'team:read' | 'team:manage'
  | 'billing:read' | 'billing:manage'
  | 'bank:read' | 'bank:manage'
  | 'withdrawals:read' | 'withdrawals:manage'

// Day-to-day operation of the partner: catalog, designs, leads, orders,
// support and marketing — plus read-only analytics and settings.
const OPERATOR_PERMISSIONS: Permission[] = [
  'catalog:read', 'catalog:write',
  'designs:read', 'designs:write',
  'leads:read', 'leads:write',
  'orders:read', 'orders:write',
  'support:read', 'support:write',
  'marketing:read', 'marketing:write',
  'analytics:read',
  'settings:read',
]

// Read-only across the operational surface. No financial or org-management data.
const VIEWER_PERMISSIONS: Permission[] = [
  'catalog:read', 'designs:read', 'leads:read', 'orders:read',
  'support:read', 'marketing:read', 'analytics:read', 'settings:read',
]

// Owner = full management: everything an operator can do, plus settings writes,
// team, billing/plan, bank details and withdrawals (read + manage).
const OWNER_PERMISSIONS: Permission[] = [
  ...OPERATOR_PERMISSIONS,
  'settings:write',
  'team:read', 'team:manage',
  'billing:read', 'billing:manage',
  'bank:read', 'bank:manage',
  'withdrawals:read', 'withdrawals:manage',
]

export const ROLE_PERMISSIONS: Record<TenantRole, ReadonlySet<Permission>> = {
  owner: new Set(OWNER_PERMISSIONS),
  operator: new Set(OPERATOR_PERMISSIONS),
  viewer: new Set(VIEWER_PERMISSIONS),
}

/** Pure: does this role grant this permission? */
export function hasPermission(role: TenantRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.has(permission) ?? false
}

// ---------------------------------------------------------------------------
// Access resolution (I/O) + decision (pure)
// ---------------------------------------------------------------------------

export type TenantResolution =
  | { kind: 'ok'; tenant: Tenant; role: TenantRole }
  | { kind: 'no_membership' } // authenticated, but no usable tenant → 401
  | { kind: 'forbidden_tenant' } // requested a tenant the user is not a member of → 404

/**
 * Pure mapping from a resolution + required permission to an HTTP status.
 * Kept separate from I/O so role/isolation semantics are exhaustively testable.
 */
export function decideAccessStatus(
  resolution: { kind: 'ok'; role: TenantRole } | { kind: 'no_membership' } | { kind: 'forbidden_tenant' },
  permission: Permission,
): 200 | 401 | 403 | 404 {
  if (resolution.kind === 'no_membership') return 401
  if (resolution.kind === 'forbidden_tenant') return 404
  if (!hasPermission(resolution.role, permission)) return 403
  return 200
}

function extractToken(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization')
  let token: string | null = authHeader?.replace('Bearer ', '') ?? null
  if (!token) {
    for (const cookie of request.cookies.getAll()) {
      if (cookie.name.startsWith('sb-') && cookie.name.endsWith('-auth-token')) {
        try {
          const parsed = JSON.parse(cookie.value)
          token = Array.isArray(parsed) ? parsed[0] : parsed
        } catch {
          token = cookie.value
        }
        break
      }
    }
  }
  return token
}

/** Resolve the authenticated user from a request (token → Supabase getUser). */
export async function resolveRequestUser(
  request: NextRequest,
): Promise<{ userId: string; email: string; isPlatformAdmin: boolean } | null> {
  const token = extractToken(request)
  if (!token) return null

  const { data, error } = await supabaseAdmin.auth.getUser(token)
  if (error || !data?.user) return null

  const email = data.user.email?.toLowerCase() || ''
  return { userId: data.user.id, email, isPlatformAdmin: ADMIN_EMAILS.includes(email) }
}

/**
 * Resolve the active tenant for a request.
 *
 * Tenant selection rules:
 *  - `x-tenant-id` header selects the active tenant.
 *  - Platform admins may select ANY tenant (support). Unknown id → forbidden (404).
 *  - Regular users may only select a tenant they are an accepted member of.
 *    Selecting a tenant they don't belong to → forbidden (404).
 *  - With no header, default to the user's most recently accepted membership.
 */
export async function resolveActiveTenant(
  request: NextRequest,
  user: { userId: string; isPlatformAdmin: boolean },
): Promise<TenantResolution> {
  const requestedTenantId = request.headers.get('x-tenant-id')

  // Platform staff acting on a tenant for support.
  if (user.isPlatformAdmin && requestedTenantId) {
    const tenant = await getTenantById(requestedTenantId)
    if (!tenant) return { kind: 'forbidden_tenant' }
    return { kind: 'ok', tenant, role: 'owner' }
  }

  // Explicit selection by a regular user — must be a valid, accepted membership.
  if (requestedTenantId) {
    const membership = await getUserTenantRole(requestedTenantId, user.userId)
    if (!membership || !membership.accepted_at) return { kind: 'forbidden_tenant' }
    const tenant = await getTenantById(requestedTenantId)
    if (!tenant) return { kind: 'forbidden_tenant' }
    return { kind: 'ok', tenant, role: membership.role }
  }

  // Default: most recently accepted membership.
  const tenant = await getTenantByUserId(user.userId)
  if (!tenant) return { kind: 'no_membership' }
  const membership = await getUserTenantRole(tenant.id, user.userId)
  if (!membership || !membership.accepted_at) return { kind: 'no_membership' }
  return { kind: 'ok', tenant, role: membership.role }
}

// ---------------------------------------------------------------------------
// Public entrypoints
// ---------------------------------------------------------------------------

/**
 * Result of a tenant-permission check.
 *
 * A flat shape (rather than a discriminated union) is used deliberately: the
 * project compiles with `strict: false`, where boolean-discriminated unions do
 * not narrow reliably. Callers check `ok` and then use the relevant fields:
 *
 *   const auth = await requireTenantPermission(req, 'leads:write')
 *   if (!auth.ok) return auth.response
 *   // auth.tenant, auth.role, auth.userId are populated here
 */
export interface TenantAuthResult {
  ok: boolean
  // Populated when ok === false:
  status?: 401 | 403 | 404
  response?: NextResponse
  // Populated when ok === true:
  userId?: string
  email?: string
  tenant?: Tenant
  role?: TenantRole
  isPlatformAdmin?: boolean
}

const FAILURE_MESSAGES: Record<401 | 403 | 404, string> = {
  // El 401 casi siempre es una sesión vencida, no una cuenta rota. El texto
  // viejo ("No autenticado o sin tenant asociado") daba a entender que el
  // partner había perdido su tienda: ORIGEN lo reportó asustado el 26/08/2026
  // teniendo la cuenta y el plan perfectamente en orden.
  401: 'Se venció tu sesión. Volvé a entrar en /partners/login y seguí donde estabas.',
  403: 'No tenés permiso para esta acción',
  404: 'No encontrado',
}

function fail(status: 401 | 403 | 404): TenantAuthResult {
  return {
    ok: false,
    status,
    response: NextResponse.json({ error: FAILURE_MESSAGES[status] }, { status }),
  }
}

/**
 * Assert the requesting user is allowed to perform `permission` on their active
 * tenant. Use this for EVERY mutation and every sensitive read.
 *
 * On success returns the user, tenant and role. On failure returns a ready-made
 * NextResponse (401 unauthenticated/no-tenant, 403 insufficient role, 404
 * cross-tenant). Callers should `if (!auth.ok) return auth.response`.
 */
export async function requireTenantPermission(
  request: NextRequest,
  permission: Permission,
): Promise<TenantAuthResult> {
  const user = await resolveRequestUser(request)
  if (!user) return fail(401)

  const resolution = await resolveActiveTenant(request, user)
  const status = decideAccessStatus(
    resolution.kind === 'ok' ? { kind: 'ok', role: resolution.role } : resolution,
    permission,
  )

  if (status !== 200) return fail(status)

  const ok = resolution as Extract<TenantResolution, { kind: 'ok' }>
  return {
    ok: true,
    userId: user.userId,
    email: user.email,
    tenant: ok.tenant,
    role: ok.role,
    isPlatformAdmin: user.isPlatformAdmin,
  }
}

/**
 * Read-level resolver kept for backward compatibility with existing routes.
 * Returns the user + active tenant (membership-validated) or null.
 * Prefer requireTenantPermission() for new code so a Permission is always checked.
 */
export async function getRequestTenant(
  request: NextRequest,
): Promise<{ userId: string; tenant: Tenant; role: TenantRole } | null> {
  const user = await resolveRequestUser(request)
  if (!user) return null
  const resolution = await resolveActiveTenant(request, user)
  if (resolution.kind !== 'ok') return null
  return { userId: user.userId, tenant: resolution.tenant, role: resolution.role }
}

/**
 * Resolve the user and assert they are a Novamente platform admin.
 * Returns userId + email when admin, or null otherwise.
 */
export async function getAdminUser(
  request: NextRequest,
): Promise<{ userId: string; email: string } | null> {
  const user = await resolveRequestUser(request)
  if (!user || !user.isPlatformAdmin) return null
  return { userId: user.userId, email: user.email }
}
