'use client'

import { AlertTriangle } from 'lucide-react'

/**
 * Se muestra cuando NO se pudo averiguar el plan del partner.
 *
 * Existe porque el caso "no sé qué plan tenés" se estaba tratando como
 * "tenés el plan gratis": si /api/partners/dashboard fallaba (típicamente un
 * 401 por sesión vencida), cuatro pantallas del workspace le mostraban a un
 * partner Pro el cartel para comprar el plan Pro que ya había pagado.
 *
 * Un error de red nunca debe leerse como una degradación de plan.
 */
export function PlanUnavailable({ onRetry }: { onRetry?: () => void }) {
  return (
    <div className="mx-auto max-w-lg rounded-xl border border-amber-800/40 bg-amber-950/20 p-6 text-center">
      <AlertTriangle className="mx-auto mb-3 h-6 w-6 text-amber-400" />
      <h2 className="mb-2 text-lg font-semibold text-zinc-100">
        No pudimos verificar tu plan
      </h2>
      <p className="mb-5 text-sm leading-relaxed text-zinc-400">
        No es un problema con tu cuenta. Puede ser la conexión o que se haya
        vencido tu sesión. Reintentá, y si sigue apareciendo volvé a entrar
        desde{' '}
        <a href="/partners/login" className="text-amber-300 underline hover:text-amber-200">
          /partners/login
        </a>
        .
      </p>
      <button
        onClick={() => (onRetry ? onRetry() : window.location.reload())}
        className="rounded-lg bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-900 transition hover:bg-white active:scale-[0.98]"
      >
        Reintentar
      </button>
    </div>
  )
}
