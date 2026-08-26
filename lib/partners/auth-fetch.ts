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

/**
 * ¿Al token le queda vida? Se lee el `exp` del JWT sin verificar firma — sólo
 * nos interesa la fecha, la validación real la hace el servidor.
 *
 * Devuelve false también si no se puede leer: ante la duda, pedir uno nuevo.
 */
function tokenVigente(token: string | null): boolean {
  if (!token) return false
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    if (!payload?.exp) return false
    // 60s de colchón: no queremos mandar un token que vence en el viaje
    return payload.exp * 1000 - Date.now() > 60_000
  } catch {
    return false
  }
}

async function getAccessToken(): Promise<string | null> {
  ensureListener()

  // 1. Cache, PERO sólo si el token todavía sirve.
  //
  //    Antes esto devolvía el cacheado sin mirar el vencimiento, y como
  //    getSession() —que es lo que dispara la renovación— nunca se volvía a
  //    llamar, un token vencido se quedaba pegado y TODAS las requests daban
  //    401 hasta recargar la página. Pasaba con el Studio abierto un rato
  //    largo, sobre todo en el navegador interno de WhatsApp, donde el
  //    temporizador de refresh de Supabase no corre en segundo plano.
  //    (ORIGEN, 26/08/2026: 3 h con la pestaña abierta → "No autenticado o sin
  //    tenant asociado" con la cuenta perfectamente en orden.)
  if (tokenVigente(cachedToken)) return cachedToken
  cachedToken = null

  // 2. getSession() renueva solo si hace falta — por eso hay que llegar acá
  try {
    const { data } = await supabase.auth.getSession()
    if (tokenVigente(data.session?.access_token ?? null)) {
      cachedToken = data.session!.access_token
      return cachedToken
    }
  } catch {}

  // 3. Forzar la renovación con el refresh token (el timer pudo no correr)
  try {
    const { data } = await supabase.auth.refreshSession()
    if (tokenVigente(data.session?.access_token ?? null)) {
      cachedToken = data.session!.access_token
      return cachedToken
    }
  } catch {}

  // 4. Último recurso: leerlo directo de localStorage
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
          if (tokenVigente(token)) {
            cachedToken = token
            return cachedToken
          }
        }
      }
    } catch {}
  }

  // 5. Esperar y reintentar una vez (la sesión puede estar cargando todavía)
  await new Promise(r => setTimeout(r, 500))
  try {
    const { data } = await supabase.auth.getSession()
    if (tokenVigente(data.session?.access_token ?? null)) {
      cachedToken = data.session!.access_token
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
