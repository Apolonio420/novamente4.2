'use client'

import { useState, Suspense } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { buildAuthRedirect } from '@/lib/auth-redirect'
import { Mail, Lock, Loader2, ArrowRight, Eye, EyeOff } from 'lucide-react'

export default function PartnerLoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-zinc-950" />}>
      <LoginForm />
    </Suspense>
  )
}

function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [resetSent, setResetSent] = useState(false)
  const [resetLoading, setResetLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirect') || '/workspace'

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (authError) {
        setError(
          authError.message === 'Invalid login credentials'
            ? 'Email o contraseña incorrectos'
            : authError.message
        )
        setLoading(false)
        return
      }

      // Set auth cookie server-side so middleware can detect session
      if (authData?.session?.access_token) {
        await fetch('/api/auth/set-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            access_token: authData.session.access_token,
            refresh_token: authData.session.refresh_token,
          }),
        })
      }

      window.location.href = redirectTo
    } catch {
      setError('Error al iniciar sesión. Intentá de nuevo.')
      setLoading(false)
    }
  }

  async function handleGoogleLogin() {
    setError('')
    try {
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: buildAuthRedirect(`/auth/callback?next=${encodeURIComponent(redirectTo)}`),
        },
      })
      if (oauthError) {
        setError(oauthError.message)
      }
    } catch {
      setError('Error al iniciar sesión con Google')
    }
  }

  async function handleResetPassword() {
    if (!email) {
      setError('Ingresá tu email primero para recuperar la contraseña')
      return
    }

    setResetLoading(true)
    setError('')

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: buildAuthRedirect('/partners/reset-password'),
      })

      if (resetError) {
        setError(resetError.message)
      } else {
        setResetSent(true)
      }
    } catch {
      setError('Error al enviar el email de recuperación')
    } finally {
      setResetLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo & Title */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-6">
            <Image
              src="/logo.png"
              alt="Novamente"
              width={48}
              height={48}
              className="mx-auto"
            />
          </Link>
          <h1 className="text-2xl font-bold text-zinc-100">Novamente Partners</h1>
          <p className="text-zinc-400 mt-2 text-sm">
            Ingresá a tu workspace
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8">
          {/* Google OAuth */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-3 bg-white hover:bg-zinc-100 text-zinc-800 font-medium py-2.5 rounded-lg transition-colors mb-6"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continuar con Google
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-zinc-700" />
            <span className="text-xs text-zinc-500">o con email</span>
            <div className="flex-1 h-px bg-zinc-700" />
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-zinc-300 mb-1.5">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-zinc-800 border border-zinc-700 text-zinc-100 rounded-lg placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 transition-colors"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-zinc-300 mb-1.5">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Tu contraseña"
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

            {/* Error */}
            {error && (
              <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2.5">
                {error}
              </div>
            )}

            {/* Reset password success */}
            {resetSent && (
              <div className="text-emerald-400 text-sm bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-4 py-2.5">
                Te enviamos un email para restablecer tu contraseña. Revisá tu bandeja de entrada.
              </div>
            )}

            {/* Forgot password */}
            <div className="text-right">
              <button
                type="button"
                onClick={handleResetPassword}
                disabled={resetLoading}
                className="text-sm text-violet-400 hover:text-violet-300 transition-colors disabled:opacity-50"
              >
                {resetLoading ? 'Enviando...' : 'Olvidé mi contraseña'}
              </button>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-500 text-white font-medium py-2.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  Iniciar sesión
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Join link */}
        <p className="text-center mt-6 text-sm text-zinc-400">
          ¿No tenés cuenta?{' '}
          <Link
            href="/partners/join"
            className="text-violet-400 hover:text-violet-300 font-medium transition-colors"
          >
            Registrate como Partner
          </Link>
        </p>

        {/* Terms notice */}
        <p className="text-center mt-4 text-xs text-zinc-500">
          Al ingresar aceptás nuestros{' '}
          <Link
            href="/partners/terms"
            className="text-zinc-400 hover:text-zinc-300 underline underline-offset-2"
          >
            Términos y Condiciones
          </Link>{' '}
          y la{' '}
          <Link
            href="/partners/privacy"
            className="text-zinc-400 hover:text-zinc-300 underline underline-offset-2"
          >
            Política de Privacidad
          </Link>
          , incluida tu responsabilidad sobre los derechos del contenido que publicás.
        </p>
      </div>
    </div>
  )
}
