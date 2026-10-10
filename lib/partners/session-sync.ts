'use client'

/**
 * Sincroniza la cookie `sb-<ref>-auth-token` con el access_token vigente de
 * supabase-js.
 *
 * ORIGEN del bug (sesión dropea ~1h después del login en /workspace): el
 * login escribe la cookie UNA sola vez (POST /api/auth/set-session). Después,
 * supabase-js renueva el access_token en segundo plano (TOKEN_REFRESHED) pero
 * nadie vuelve a escribir la cookie — el middleware (que SÓLO lee la cookie,
 * nunca el refresh_token) sigue validando el token viejo contra Supabase y,
 * cuando ese token vence, redirige a /partners/login aunque el cliente tenga
 * una sesión perfectamente válida en memoria/localStorage.
 *
 * Por qué no renovar desde el middleware con el refresh_token: Supabase rota
 * los refresh tokens en cada uso. Si servidor (middleware) y cliente
 * (supabase-js) comparten y usan el mismo refresh_token de forma
 * independiente, el segundo en llegar dispara "reuse detection" y Supabase
 * revoca la sesión completa. Por eso el refresh vive SÓLO en el cliente; este
 * módulo únicamente re-escribe la cookie con el access_token nuevo que ese
 * refresh ya produjo.
 */

export type AuthEventForSync = 'SIGNED_IN' | 'TOKEN_REFRESHED' | 'INITIAL_SESSION' | 'SIGNED_OUT' | string

export interface MinimalSession {
  access_token: string
  refresh_token?: string | null
}

// Eventos que traen una sesión fresca y ameritan (re)escribir la cookie.
// SIGNED_OUT se maneja aparte (DELETE, no POST) — ver handleAuthEventForSync.
const SYNCABLE_EVENTS = new Set(['SIGNED_IN', 'TOKEN_REFRESHED', 'INITIAL_SESSION'])

/**
 * Pure: ¿hace falta pedir una sincronización de cookie para este evento?
 * Separada de I/O y de timers para poder testearla sin red ni fake timers.
 */
export function shouldSync(
  event: AuthEventForSync,
  accessToken: string | null | undefined,
  lastSyncedToken: string | null,
): boolean {
  if (!SYNCABLE_EVENTS.has(event)) return false
  return Boolean(accessToken) && accessToken !== lastSyncedToken
}

// ---------------------------------------------------------------------------
// Cola serial de escrituras a la cookie
// ---------------------------------------------------------------------------
//
// Un POST (login/refresh) y un DELETE (logout) pueden dispararse casi juntos
// — p.ej. signOut() mientras un refresh recién disparado todavía está en
// vuelo. Sin orden, el POST puede resolver DESPUÉS del DELETE y resucitar la
// cookie tras el logout. Encolamos todo en una sola promesa para aplicar los
// cambios en el orden en que se pidieron, nunca en el orden en que resuelven.
let writeQueue: Promise<void> = Promise.resolve()

function enqueueWrite(job: () => Promise<void>): void {
  // Un job que falla no debe trabar a los siguientes.
  writeQueue = writeQueue.then(job, job)
}

async function postSetSession(session: MinimalSession): Promise<void> {
  try {
    await fetch('/api/auth/set-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        access_token: session.access_token,
        refresh_token: session.refresh_token || '',
      }),
    })
    lastSyncedToken = session.access_token
  } catch {
    // Best-effort — el próximo evento de auth, focus o visibilitychange reintenta.
  }
}

async function deleteSetSession(): Promise<void> {
  try {
    await fetch('/api/auth/set-session', { method: 'DELETE' })
  } catch {
    // Best-effort — el logout del cliente (supabase.auth.signOut()) ya corrió.
  }
}

let lastSyncedToken: string | null = null
let pendingTimer: ReturnType<typeof setTimeout> | null = null

function clearPendingTimer(): void {
  if (pendingTimer) {
    clearTimeout(pendingTimer)
    pendingTimer = null
  }
}

const DEBOUNCE_MS = 500

/**
 * Manejar un evento de `onAuthStateChange`. Debounce de 500ms antes de pegarle
 * a la red — SIGNED_IN y TOKEN_REFRESHED pueden llegar casi juntos al cargar
 * la página.
 *
 * Usa la `session` que el propio callback de onAuthStateChange recibió:
 * llamar a getSession() DESDE un callback de onAuthStateChange puede
 * deadlockear el auth-lock interno de supabase-js. El setTimeout de abajo
 * también ayuda a esto, porque corre fuera del callback.
 */
export function handleAuthEventForSync(event: AuthEventForSync, session: MinimalSession | null): void {
  if (event === 'SIGNED_OUT') {
    clearPendingTimer()
    lastSyncedToken = null
    enqueueWrite(deleteSetSession)
    return
  }

  const accessToken = session?.access_token ?? null
  if (!shouldSync(event, accessToken, lastSyncedToken)) return

  clearPendingTimer()
  const toSync = session as MinimalSession
  pendingTimer = setTimeout(() => {
    pendingTimer = null
    enqueueWrite(() => postSetSession(toSync))
  }, DEBOUNCE_MS)
}

/** Sólo para tests: resetea el estado interno (módulo compartido entre specs). */
export function __resetSessionSyncForTests(): void {
  clearPendingTimer()
  lastSyncedToken = null
  writeQueue = Promise.resolve()
}
