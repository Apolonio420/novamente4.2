import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getTenantByUserId, getTenantById } from './tenant'
import type { Tenant } from './types'

const ADMIN_EMAILS = [
  'apolonio@novamente.ar',
  'sambu@novamente.ar',
  'moishe@novamente.ar',
  'izzaga@novamente.ar',
]

/**
 * Extract the authenticated user + their tenant from a request.
 * Checks Authorization header first, then Supabase session cookie.
 * Admins can override tenant via x-tenant-id header.
 */
export async function getRequestTenant(
  request: NextRequest,
): Promise<{ userId: string; tenant: Tenant } | null> {
  // 1. Try Authorization header
  const authHeader = request.headers.get('authorization')
  let token: string | null = authHeader?.replace('Bearer ', '') ?? null

  // 2. Fallback: Supabase session cookie (sb-<ref>-auth-token)
  if (!token) {
    const allCookies = request.cookies.getAll()
    for (const cookie of allCookies) {
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

  if (!token) return null

  const { data: userData, error } = await supabaseAdmin.auth.getUser(token)
  if (error || !userData?.user) return null

  const email = userData.user.email?.toLowerCase() || ''
  const isAdmin = ADMIN_EMAILS.includes(email)

  // Admin tenant override via header
  const overrideTenantId = request.headers.get('x-tenant-id')
  if (isAdmin && overrideTenantId) {
    const overrideTenant = await getTenantById(overrideTenantId)
    if (overrideTenant) {
      return { userId: userData.user.id, tenant: overrideTenant }
    }
  }

  const tenant = await getTenantByUserId(userData.user.id)
  if (!tenant) return null

  return { userId: userData.user.id, tenant }
}
