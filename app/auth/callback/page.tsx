'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { supabase } from '@/lib/supabase'
import { Loader2 } from 'lucide-react'

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<CallbackLoading />}>
      <CallbackHandler />
    </Suspense>
  )
}

function CallbackLoading() {
  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin text-violet-500 mx-auto" />
        <p className="text-zinc-400 mt-4 text-sm">Autenticando...</p>
      </div>
    </div>
  )
}

function CallbackHandler() {
  const searchParams = useSearchParams()
  const next = searchParams.get('next') || '/workspace'
  const [error, setError] = useState('')

  useEffect(() => {
    async function handleCallback() {
      try {
        // Supabase client auto-detects tokens from URL hash (implicit flow)
        // or exchanges code (PKCE flow) — onAuthStateChange fires either way
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()

        if (sessionError) {
          console.error('Auth callback error:', sessionError)
          setError('Error al autenticar. Intentá de nuevo.')
          return
        }

        if (!session) {
          // No session yet — wait for auth state change (token might be in hash)
          const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, newSession) => {
              if (event === 'SIGNED_IN' && newSession) {
                subscription.unsubscribe()
                await handleAuthenticatedUser(newSession.user.id)
              }
            }
          )

          // Timeout after 10 seconds
          setTimeout(() => {
            subscription.unsubscribe()
            setError('No se pudo completar la autenticación. Intentá de nuevo.')
          }, 10000)
          return
        }

        await handleAuthenticatedUser(session.user.id)
      } catch {
        setError('Error inesperado. Intentá de nuevo.')
      }
    }

    async function handleAuthenticatedUser(userId: string) {
      // Set auth cookie so middleware can read it (supabase-js uses localStorage)
      try {
        const { data: { session: cookieSession } } = await supabase.auth.getSession()
        if (cookieSession?.access_token) {
          const ref = process.env.NEXT_PUBLIC_SUPABASE_URL?.match(/\/\/([^.]+)/)?.[1] || 'sb'
          document.cookie = `sb-${ref}-auth-token=${JSON.stringify([cookieSession.access_token, cookieSession.refresh_token])}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`
        }
      } catch {}

      // Check if user has a tenant linked
      try {
        const res = await fetch('/api/partners/me', {
          headers: {
            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          },
        })

        if (res.ok) {
          // User has a tenant — redirect to workspace
          window.location.href = next
        } else if (res.status === 401 || res.status === 404) {
          // No tenant — redirect to partner signup
          window.location.href = '/partners/join?from=oauth'
        } else {
          window.location.href = next
        }
      } catch {
        // If check fails, try workspace anyway
        window.location.href = next
      }
    }

    handleCallback()
  }, [next])

  if (error) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
            <span className="text-red-400 text-xl">!</span>
          </div>
          <p className="text-zinc-200 font-medium mb-2">Error de autenticación</p>
          <p className="text-zinc-400 text-sm mb-6">{error}</p>
          <a
            href="/partners/login"
            className="inline-block bg-violet-600 hover:bg-violet-500 text-white font-medium px-6 py-2.5 rounded-lg transition-colors"
          >
            Volver al login
          </a>
        </div>
      </div>
    )
  }

  return <CallbackLoading />
}
