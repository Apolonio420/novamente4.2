'use client'

import { useState, useEffect, Suspense } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Lock, Loader2, ArrowRight, Eye, EyeOff, CheckCircle2 } from 'lucide-react'

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-zinc-950" />}>
      <ResetForm />
    </Suspense>
  )
}

type Phase = 'verifying' | 'ready' | 'invalid' | 'done'

function ResetForm() {
  const [phase, setPhase] = useState<Phase>('verifying')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Al montar, el cliente de Supabase detecta el token de recovery del hash de la URL
  // (detectSessionInUrl está activo por default → dispara PASSWORD_RECOVERY).
  useEffect(() => {
    let settled = false

    async function verify() {
      // Si ya hay sesión (token procesado del hash), estamos listos para setear la clave
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        settled = true
        setPhase('ready')
        return
      }

      // Si todavía no, esperamos al evento de recovery (el hash se procesa async)
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
        if ((event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') && newSession) {
          settled = true
          subscription.unsubscribe()
          setPhase('ready')
        }
      })

      // Timeout: si en 8s no hay sesión, el link es inválido o expiró
      setTimeout(() => {
        if (!settled) {
          subscription.unsubscribe()
          setPhase('invalid')
        }
      }, 8000)
    }

    verify()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres')
      return
    }
    if (password !== confirm) {
      setError('Las contraseñas no coinciden')
      return
    }

    setLoading(true)
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password })

      if (updateError) {
        setError(updateError.message)
        setLoading(false)
        return
      }

      // Persistir la sesión en cookie para que el middleware detecte el login
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.access_token) {
          await fetch('/api/auth/set-session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              access_token: session.access_token,
              refresh_token: session.refresh_token,
            }),
          })
        }
      } catch {}

      setPhase('done')
      // Pequeña pausa para mostrar el éxito, luego al workspace
      setTimeout(() => {
        window.location.href = '/workspace'
      }, 1500)
    } catch {
      setError('Error al actualizar la contraseña. Intentá de nuevo.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo & Title */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-6">
            <Image src="/logo.png" alt="Novamente" width={48} height={48} className="mx-auto" />
          </Link>
          <h1 className="text-2xl font-bold text-zinc-100">Restablecer contraseña</h1>
          <p className="text-zinc-400 mt-2 text-sm">Elegí una nueva contraseña para tu cuenta</p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8">
          {phase === 'verifying' && (
            <div className="text-center py-6">
              <Loader2 className="w-8 h-8 animate-spin text-violet-500 mx-auto" />
              <p className="text-zinc-400 mt-4 text-sm">Verificando el enlace...</p>
            </div>
          )}

          {phase === 'invalid' && (
            <div className="text-center py-4">
              <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
                <span className="text-red-400 text-xl">!</span>
              </div>
              <p className="text-zinc-200 font-medium mb-2">Enlace inválido o expirado</p>
              <p className="text-zinc-400 text-sm mb-6">
                El enlace de recuperación no es válido o ya expiró. Pedí uno nuevo desde el login.
              </p>
              <Link
                href="/partners/login"
                className="inline-block bg-violet-600 hover:bg-violet-500 text-white font-medium px-6 py-2.5 rounded-lg transition-colors"
              >
                Volver al login
              </Link>
            </div>
          )}

          {phase === 'done' && (
            <div className="text-center py-6">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-6 h-6 text-emerald-400" />
              </div>
              <p className="text-zinc-200 font-medium mb-2">¡Contraseña actualizada!</p>
              <p className="text-zinc-400 text-sm">Te estamos llevando a tu workspace...</p>
            </div>
          )}

          {phase === 'ready' && (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* New password */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-zinc-300 mb-1.5">
                  Nueva contraseña
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mínimo 8 caracteres"
                    className="w-full pl-10 pr-10 py-2.5 bg-zinc-800 border border-zinc-700 text-zinc-100 rounded-lg placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm password */}
              <div>
                <label htmlFor="confirm" className="block text-sm font-medium text-zinc-300 mb-1.5">
                  Repetir contraseña
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input
                    id="confirm"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="Repetí la contraseña"
                    className="w-full pl-10 pr-4 py-2.5 bg-zinc-800 border border-zinc-700 text-zinc-100 rounded-lg placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 transition-colors"
                  />
                </div>
              </div>

              {error && (
                <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2.5">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-500 text-white font-medium py-2.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    Guardar contraseña
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        <p className="text-center mt-6 text-sm text-zinc-400">
          <Link href="/partners/login" className="text-violet-400 hover:text-violet-300 font-medium transition-colors">
            Volver al login
          </Link>
        </p>
      </div>
    </div>
  )
}
