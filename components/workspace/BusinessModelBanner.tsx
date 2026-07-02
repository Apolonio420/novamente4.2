'use client'

import { useState } from 'react'
import { Info, X, Zap, Package, Banknote } from 'lucide-react'
import { authFetch } from '@/lib/partners/auth-fetch'

interface BusinessModelBannerProps {
  tenantId: string
}

export function BusinessModelBanner({ tenantId }: BusinessModelBannerProps) {
  const [dismissed, setDismissed] = useState(false)
  const [dismissing, setDismissing] = useState(false)

  async function handleDismiss() {
    setDismissing(true)
    try {
      await authFetch('/api/partners/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ onboarding_dismissed_business_model: true }),
      })
    } catch {
      // ignore — we still dismiss locally
    } finally {
      setDismissed(true)
      setDismissing(false)
    }
  }

  if (dismissed) return null

  const bullets = [
    {
      icon: Zap,
      text: 'El cliente le paga directo a Novamente — no necesitás pasarela.',
    },
    {
      icon: Package,
      text: 'Producimos y enviamos en 24-48hs cuando hay venta.',
    },
    {
      icon: Banknote,
      text: (
        <>
          Tu ganancia (PVP − costo Novamente) queda disponible cuando se confirma
          el pago. Los retiros aprobados se transfieren a tu CBU/alias en{' '}
          <strong className="text-emerald-300">24–48 h hábiles</strong>.
        </>
      ),
    },
  ]

  return (
    <div className="relative rounded-xl border border-emerald-800/40 bg-emerald-950/30 p-5">
      <div className="flex items-start gap-4">
        <div className="shrink-0 w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center">
          <Info className="w-4 h-4 text-emerald-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-emerald-300 mb-2">
            Cómo funciona Novamente
          </p>
          <ul className="space-y-1.5">
            {bullets.map((b, i) => {
              const Icon = b.icon
              return (
                <li key={i} className="flex items-start gap-2 text-sm text-zinc-400">
                  <Icon className="w-4 h-4 text-emerald-500/70 shrink-0 mt-0.5" />
                  <span>{b.text}</span>
                </li>
              )
            })}
          </ul>
        </div>
      </div>
      <button
        onClick={handleDismiss}
        disabled={dismissing}
        aria-label="Entendido, cerrar banner"
        className="absolute top-3 right-3 p-1.5 rounded-md text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/60 transition-colors disabled:opacity-50"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}
