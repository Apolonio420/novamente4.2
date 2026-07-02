/**
 * Team & multi-brand membership service.
 *
 *  - listUserTenants: the brands a user belongs to (for the tenant selector).
 *  - listTeam / inviteMember / removeMember: owner-managed team (owner→operator/viewer).
 *  - acceptInvitation: an invitee turns a pending membership into an active one.
 *
 * Invited memberships start with accepted_at = null and grant NO access until
 * accepted (resolveActiveTenant/getUserTenantRole require accepted_at).
 */
import { supabaseAdmin } from '@/lib/supabase-admin'
import type { TenantRole } from './types'

const db = () => supabaseAdmin as any

export interface UserTenantMembership {
  id: string
  name: string
  slug: string
  logo_url: string | null
  plan: string
  status: string
  role: TenantRole
  pending: boolean
}

/** Brands the user belongs to (accepted + pending), for the selector UI. */
export async function listUserTenants(userId: string): Promise<UserTenantMembership[]> {
  const { data, error } = await db()
    .from('tenant_users')
    .select('role, accepted_at, tenants ( id, name, slug, logo_url, plan, status )')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })

  if (error || !data) return []
  return data
    .filter((r: any) => r.tenants)
    .map((r: any) => ({
      id: r.tenants.id,
      name: r.tenants.name,
      slug: r.tenants.slug,
      logo_url: r.tenants.logo_url ?? null,
      plan: r.tenants.plan,
      status: r.tenants.status,
      role: r.role as TenantRole,
      pending: !r.accepted_at,
    }))
}

export interface TeamMember {
  id: string
  user_id: string
  role: TenantRole
  accepted_at: string | null
  invited_by: string | null
  created_at: string
}

export async function listTeam(tenantId: string): Promise<TeamMember[]> {
  const { data } = await db()
    .from('tenant_users')
    .select('id, user_id, role, accepted_at, invited_by, created_at')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: true })
  return (data || []) as TeamMember[]
}

/** Pure: owners may only invite operators or viewers (never another owner). */
export function validateInviteRole(role: string): role is 'operator' | 'viewer' {
  return role === 'operator' || role === 'viewer'
}

export interface InviteResult {
  ok: boolean
  status: number
  error?: string
  membershipId?: string
  pending?: boolean
}

export async function inviteMember(
  tenantId: string,
  inviterUserId: string,
  email: string,
  role: string,
): Promise<InviteResult> {
  if (!validateInviteRole(role)) {
    return { ok: false, status: 400, error: 'Rol inválido: sólo se puede invitar como operator o viewer' }
  }
  const cleanEmail = String(email || '').trim().toLowerCase()
  if (!cleanEmail || !cleanEmail.includes('@')) {
    return { ok: false, status: 400, error: 'Email inválido' }
  }

  const { data: userId, error: rpcErr } = await db().rpc('partner_find_user_by_email', { p_email: cleanEmail })
  if (rpcErr) {
    console.error('[team] lookup error:', rpcErr.message)
    return { ok: false, status: 500, error: 'No se pudo buscar el usuario' }
  }
  if (!userId) {
    return { ok: false, status: 404, error: 'No existe un usuario con ese email. Pedile que se registre primero.' }
  }

  // INSERT (not upsert) so an existing membership is never silently demoted.
  const { data, error } = await db()
    .from('tenant_users')
    .insert({ tenant_id: tenantId, user_id: userId, role, invited_by: inviterUserId, accepted_at: null })
    .select('id')
    .single()

  if (error) {
    if (error.code === '23505') return { ok: false, status: 409, error: 'Ese usuario ya es miembro de la marca' }
    console.error('[team] invite error:', error.message)
    return { ok: false, status: 500, error: 'No se pudo invitar' }
  }
  return { ok: true, status: 200, membershipId: data.id, pending: true }
}

export interface RemoveResult {
  ok: boolean
  status: number
  error?: string
}

export async function removeMember(tenantId: string, membershipId: string): Promise<RemoveResult> {
  const { data: member } = await db()
    .from('tenant_users')
    .select('id, role')
    .eq('tenant_id', tenantId)
    .eq('id', membershipId)
    .single()

  if (!member) return { ok: false, status: 404, error: 'Miembro no encontrado' }
  // Never remove an owner here — avoid orphaning the tenant / privilege games.
  if (member.role === 'owner') return { ok: false, status: 403, error: 'No se puede quitar a un owner' }

  const { error } = await db()
    .from('tenant_users')
    .delete()
    .eq('tenant_id', tenantId)
    .eq('id', membershipId)

  if (error) return { ok: false, status: 500, error: 'No se pudo quitar al miembro' }
  return { ok: true, status: 200 }
}

/** An invitee accepts a pending membership (accepted_at null → now). */
export async function acceptInvitation(tenantId: string, userId: string): Promise<boolean> {
  const { data, error } = await db()
    .from('tenant_users')
    .update({ accepted_at: new Date().toISOString() })
    .eq('tenant_id', tenantId)
    .eq('user_id', userId)
    .is('accepted_at', null)
    .select('id')

  return !error && Array.isArray(data) && data.length > 0
}
