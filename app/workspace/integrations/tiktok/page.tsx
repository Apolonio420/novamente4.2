'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Loader2, CheckCircle2, ExternalLink } from 'lucide-react'

interface IntegrationStatus {
  connected: boolean
  open_id?: string | null
  scope?: string | null
  connected_at?: string | null
  expires_at?: string | null
}

export default function TikTokIntegrationPage() {
  const [status, setStatus] = useState<IntegrationStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [disconnecting, setDisconnecting] = useState(false)
  const params = useSearchParams()
  const justConnected = params.get('connected') === '1'

  useEffect(() => {
    let cancelled = false
    async function load() {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) {
        window.location.href = '/partners/login?redirect=/workspace/integrations/tiktok'
        return
      }
      const res = await fetch('/api/partners/integrations/tiktok/status', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      if (cancelled) return
      if (res.ok) {
        const data = (await res.json()) as IntegrationStatus
        setStatus(data)
      } else {
        setStatus({ connected: false })
      }
      setLoading(false)
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  async function handleDisconnect() {
    setDisconnecting(true)
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session) return
    await fetch('/api/partners/integrations/tiktok/disconnect', {
      method: 'POST',
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
    setStatus({ connected: false })
    setDisconnecting(false)
  }

  return (
    <main className="container mx-auto px-4 py-12 max-w-3xl">
      <div className="mb-6">
        <Link href="/workspace" className="text-sm text-zinc-500 hover:text-zinc-900">
          ← Volver al workspace
        </Link>
      </div>

      <h1 className="text-3xl font-bold mb-2">Integración con TikTok</h1>
      <p className="text-zinc-600 mb-8">
        Conectá la cuenta de TikTok de tu marca para programar y publicar videos directamente desde tu workspace.
      </p>

      {justConnected && (
        <div className="mb-6 rounded-lg border border-emerald-200 bg-emerald-50 p-4 flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 text-emerald-600" />
          <div>
            <p className="font-medium text-emerald-900">TikTok conectado correctamente</p>
            <p className="text-sm text-emerald-700">Ya podés programar tu primer video desde Calendar.</p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center gap-2 text-zinc-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          Cargando estado…
        </div>
      ) : status?.connected ? (
        <div className="rounded-lg border p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 mb-2">
                Conectada
              </Badge>
              <p className="text-sm text-zinc-600">
                <span className="font-medium">open_id:</span> {status.open_id ?? '—'}
              </p>
              <p className="text-sm text-zinc-600">
                <span className="font-medium">Scopes:</span> {status.scope ?? '—'}
              </p>
              <p className="text-sm text-zinc-600">
                <span className="font-medium">Conectada el:</span>{' '}
                {status.connected_at ? new Date(status.connected_at).toLocaleString('es-AR') : '—'}
              </p>
            </div>
          </div>
          <div className="flex gap-3 pt-2 border-t">
            <Button variant="outline" onClick={handleDisconnect} disabled={disconnecting}>
              {disconnecting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Desconectar TikTok
            </Button>
            <Button asChild variant="ghost">
              <Link href="/workspace/calendar">
                Ir al calendario <ExternalLink className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      ) : (
        <div className="rounded-lg border p-6 space-y-4">
          <p className="text-zinc-700">
            Conectá tu cuenta de TikTok para empezar a programar publicaciones. Te llevamos a la pantalla
            oficial de TikTok donde autorizás los permisos: leer información básica de tu cuenta, subir y
            publicar videos.
          </p>
          <ul className="list-disc list-inside text-sm text-zinc-600 space-y-1">
            <li>Tu contraseña nunca pasa por nuestra plataforma</li>
            <li>Podés desconectar la cuenta en cualquier momento desde esta página</li>
            <li>Solo programamos los videos que vos subís y aprobás</li>
          </ul>
          <Button asChild size="lg" className="bg-violet-600 hover:bg-violet-700">
            <a href="/api/auth/tiktok/login">Conectar TikTok</a>
          </Button>
        </div>
      )}

      <div className="mt-8 text-xs text-zinc-500">
        Esta integración usa la{' '}
        <a
          href="https://developers.tiktok.com/doc/content-posting-api-reference-direct-post-video"
          className="underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          Content Posting API oficial de TikTok
        </a>
        . Datos manejados según nuestra{' '}
        <Link href="/privacidad" className="underline">
          política de privacidad
        </Link>
        .
      </div>
    </main>
  )
}
