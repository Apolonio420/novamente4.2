'use client'

import { useState } from 'react'
import Link from 'next/link'
import { MessageCircle, Loader2, CheckCircle2 } from 'lucide-react'
import { createErrorTicket, type ReportableError } from '@/lib/errors/workspace-error-report'

/** "Avisar a Novamente": crea un ticket real de soporte con el error y confirma. */
export function ErrorTicketButton({ error }: { error: ReportableError }) {
  const [state, setState] = useState<'idle' | 'sending' | 'done' | 'failed'>('idle')

  const send = async () => {
    if (state === 'sending' || state === 'done') return
    setState('sending')
    const id = await createErrorTicket(error)
    setState(id ? 'done' : 'failed')
  }

  if (state === 'done') {
    return (
      <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
        <p className="flex items-center justify-center gap-2 font-medium">
          <CheckCircle2 className="w-4 h-4" />
          Listo, ya nos llegó. Te respondemos en Soporte.
        </p>
        <Link href="/workspace/support" className="mt-1 inline-block text-xs underline hover:text-emerald-200">
          Ir a Soporte
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-1">
      <button
        onClick={send}
        disabled={state === 'sending'}
        className="inline-flex items-center justify-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 px-4 py-2.5 text-sm font-medium text-amber-400 transition-colors disabled:opacity-60"
      >
        {state === 'sending' ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageCircle className="w-4 h-4" />}
        Avisar a Novamente
      </button>
      {state === 'failed' && (
        <p className="text-xs text-red-400">
          No pudimos enviarlo. Probá de nuevo o escribinos desde{' '}
          <Link href="/workspace/support" className="underline">Soporte</Link>.
        </p>
      )}
    </div>
  )
}
