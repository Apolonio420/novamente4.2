'use client'

import { supabase } from '@/lib/supabase'

// Cache token from auth state changes
let cachedToken: string | null = null
let initialized = false

function ensureListener() {
  if (initialized || typeof window === 'undefined') return
  initialized = true

  supabase.auth.onAuthStateChange((_event, session) => {
    cachedToken = session?.access_token ?? null
  })
}

async function getAccessToken(): Promise<string | null> {
  ensureListener()

  // 1. Return cached token if available
  if (cachedToken) return cachedToken

  // 2. Try getSession
  try {
    const { data } = await supabase.auth.getSession()
    if (data.session?.access_token) {
      cachedToken = data.session.access_token
      return cachedToken
    }
  } catch {}

  // 3. Last resort: read directly from localStorage
  if (typeof window !== 'undefined') {
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.startsWith('sb-') && key.endsWith('-auth-token')) {
          const raw = localStorage.getItem(key)
          if (!raw) continue
          const parsed = JSON.parse(raw)
          // Supabase stores as { access_token, ... } or as the session object
          const token = parsed?.access_token || parsed?.currentSession?.access_token
          if (token) {
            cachedToken = token
            return cachedToken
          }
        }
      }
    } catch {}
  }

  // 4. Wait a bit and retry once (session may still be loading)
  await new Promise(r => setTimeout(r, 500))
  try {
    const { data } = await supabase.auth.getSession()
    if (data.session?.access_token) {
      cachedToken = data.session.access_token
      return cachedToken
    }
  } catch {}

  return null
}

const ACTIVE_TENANT_STORAGE_KEY = 'active_tenant_id'

/**
 * Read the tenant selected in the workspace UI. The server independently
 * validates that it is an accepted membership (or a platform-admin selection),
 * so localStorage is only a preference, never an authorization override.
 */
function getActiveTenantSelection(): string | null {
  if (typeof window === 'undefined') return null
  try {
    // Remove the legacy key so a stale unauthorised-looking override is never
    // silently carried into the new membership selector.
    localStorage.removeItem('admin_tenant_id')
    return localStorage.getItem(ACTIVE_TENANT_STORAGE_KEY)
  } catch {
    return null
  }
}

/**
 * Wrapper around fetch that automatically injects the Supabase access token.
 * If the user has selected a tenant, includes x-tenant-id. The API verifies it
 * against the authenticated user's accepted memberships.
 */
export async function authFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = await getAccessToken()

  const headers = new Headers(options.headers)
  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  } else {
    console.warn('[authFetch] No session found for', url)
  }

  const selectedTenant = getActiveTenantSelection()
  if (selectedTenant && !headers.has('x-tenant-id')) {
    headers.set('x-tenant-id', selectedTenant)
  }

  return fetch(url, { ...options, headers })
}
