'use client'

import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { handleAuthEventForSync } from './session-sync'

/**
 * Mantiene la cookie `sb-<ref>-auth-token` sincronizada con el access_token
 * vigente de supabase-js, para que el middleware (que sólo lee la cookie) no
 * eche al partner cuando el cliente ya renovó la sesión. Montar UNA vez,
 * arriba del árbol de /workspace (ver app/workspace/layout.tsx).
 *
 * Dos disparadores:
 *  1. onAuthStateChange — cubre el refresh en background mientras la pestaña
 *     está abierta y activa.
 *  2. focus / visibilitychange — cubre el caso ORIGEN (navegador de WhatsApp
 *     u otro webview sin timers en segundo plano): al volver a la pestaña,
 *     getSession() dispara el refresh si hace falta y eso a su vez sincroniza
 *     la cookie.
 */
export function useSessionCookieSync(): void {
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      handleAuthEventForSync(
        event,
        session ? { access_token: session.access_token, refresh_token: session.refresh_token } : null,
      )
    })

    function recheck() {
      supabase.auth
        .getSession()
        .then(({ data }) => {
          if (data.session) {
            handleAuthEventForSync('TOKEN_REFRESHED', {
              access_token: data.session.access_token,
              refresh_token: data.session.refresh_token,
            })
          }
        })
        .catch(() => {})
    }

    function onVisibilityChange() {
      if (document.visibilityState === 'visible') recheck()
    }

    window.addEventListener('focus', recheck)
    document.addEventListener('visibilitychange', onVisibilityChange)

    return () => {
      subscription.unsubscribe()
      window.removeEventListener('focus', recheck)
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  }, [])
}
