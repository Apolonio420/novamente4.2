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

/**
 * Get the admin tenant override ID from localStorage (if any).
 */
function getAdminTenantOverride(): string | null {
  if (typeof window === 'undefined') return null
  try {
    return localStorage.getItem('admin_tenant_id')
  } catch {
    return null
  }
}

/**
 * Wrapper around fetch that automatically injects the Supabase access token.
 * If an admin tenant override is set, includes x-tenant-id header.
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

  const override = getAdminTenantOverride()
  if (override && !headers.has('x-tenant-id')) {
    headers.set('x-tenant-id', override)
  }

  return fetch(url, { ...options, headers })
}
