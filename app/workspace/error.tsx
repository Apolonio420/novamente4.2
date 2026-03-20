'use client'

import { useEffect } from 'react'
import { AlertTriangle, RefreshCw, MessageCircle, Home } from 'lucide-react'
import { useAssistant } from '@/lib/assistant/assistant-context'

export default function WorkspaceError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const { openWithBugReport } = useAssistant()

  useEffect(() => {
    console.error('[Workspace Error]', error)
  }, [error])

  const handleReport = () => {
    openWithBugReport({
      errorMessage: error.message,
      errorStack: error.stack,
      errorDigest: error.digest,
      sourceUrl: typeof window !== 'undefined' ? window.location.href : undefined,
    })
  }

  return (
    <div className="flex items-center justify-center min-h-[60vh] p-6">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="mx-auto w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center">
          <AlertTriangle className="w-8 h-8 text-red-400" />
        </div>

        <div>
          <h2 className="text-xl font-semibold text-zinc-100 mb-2">
            Algo salio mal
          </h2>
          <p className="text-sm text-zinc-400">
            Ocurrio un error inesperado. Podes intentar recargar o reportar el problema al asistente
            para que se solucione automaticamente.
          </p>
          {error.digest && (
            <p className="text-xs text-zinc-600 mt-2 font-mono">
              Error ID: {error.digest}
            </p>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-violet-600 hover:bg-violet-500 px-4 py-2.5 text-sm font-medium text-white transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Reintentar
          </button>

          <button
            onClick={handleReport}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 px-4 py-2.5 text-sm font-medium text-amber-400 transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
            Reportar al asistente
          </button>
        </div>

        <a
          href="/workspace"
          className="inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          <Home className="w-3 h-3" />
          Volver al dashboard
        </a>
      </div>
    </div>
  )
}
