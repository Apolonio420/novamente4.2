import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getTenantByUserId } from './tenant'
import type { Tenant } from './types'

/**
 * Extract the authenticated user + their tenant from a request.
 * Checks Authorization header first, then Supabase session cookie.
 */
export async function getRequestTenant(
  request: NextRequest,
): Promise<{ userId: string; tenant: Tenant } | null> {
  // 1. Try Authorization header
  const authHeader = request.headers.get('authorization')
  let token: string | null = authHeader?.replace('Bearer ', '') ?? null

  console.log('[auth] Authorization header present:', !!authHeader)

  // 2. Fallback: Supabase session cookie (sb-<ref>-auth-token)
  if (!token) {
    const allCookies = request.cookies.getAll()
    console.log('[auth] Cookies:', allCookies.map(c => c.name).join(', '))
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

  if (!token) {
    console.log('[auth] No token found')
    return null
  }

  console.log('[auth] Token found, length:', token.length)
  const { data: userData, error } = await supabaseAdmin.auth.getUser(token)
  if (error || !userData?.user) {
    console.log('[auth] getUser failed:', error?.message)
    return null
  }
  console.log('[auth] User:', userData.user.email)

  const tenant = await getTenantByUserId(userData.user.id)
  if (!tenant) return null

  return { userId: userData.user.id, tenant }
}
