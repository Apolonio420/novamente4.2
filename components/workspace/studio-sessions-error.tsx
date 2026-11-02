'use client'

import { AlertTriangle, RotateCw } from 'lucide-react'
import type { StudioSessionsErrorKind } from '@/lib/partners/studio/session-service'

/**
 * Estado de error del panel de sesiones del Studio. Antes un 401/500 se veía
 * igual que "Sin sesiones aún" (fetchStudioSessions devolvía []). Mismo criterio
 * que /workspace/design-library: 401 → "Tu sesión venció" con link a login;
 * cualquier otro fallo → mensaje con "Reintentar".
 */
export function StudioSessionsError({
  kind,
  onRetry,
}: {
  kind: StudioSessionsErrorKind
  onRetry: () => void
}) {
  if (kind === 'auth') {
    return (
      <div role="alert" className="text-center py-8 px-3">
        <AlertTriangle className="h-6 w-6 text-amber-500 mx-auto mb-2" />
        <p className="text-sm font-medium text-zinc-200">Tu sesión venció</p>
        <p className="text-xs text-zinc-500 mt-1 mb-3">Volvé a entrar para ver tus sesiones.</p>
        <a
          href="/partners/login?redirect=/workspace/design-engine"
          className="inline-block rounded-lg bg-violet-600 hover:bg-violet-500 px-3 py-1.5 text-xs font-medium text-white transition-colors"
        >
          Volver a entrar
        </a>
      </div>
    )
  }
  return (
    <div role="alert" className="text-center py-8 px-3">
      <AlertTriangle className="h-6 w-6 text-amber-500 mx-auto mb-2" />
      <p className="text-sm font-medium text-zinc-200">No pudimos cargar tus sesiones</p>
      <p className="text-xs text-zinc-500 mt-1 mb-3">Puede ser algo pasajero — probá de nuevo.</p>
      <button
        type="button"
        onClick={onRetry}
        className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-100 transition-colors"
      >
        <RotateCw className="h-3 w-3" />
        Reintentar
      </button>
    </div>
  )
}
