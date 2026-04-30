'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import {
  Loader2,
  CheckCircle2,
  Video,
  Calendar,
  Sparkles,
  Shield,
  Plug,
  Unplug,
  ArrowRight,
} from 'lucide-react'

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
    if (!confirm('¿Seguro querés desconectar TikTok? Vas a tener que reautorizar para volver a publicar.')) return
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

  // Trust the URL flag while we wait for the status endpoint to catch up.
  const isConnected = (status?.connected ?? false) || justConnected

  return (
    <div className="max-w-4xl mx-auto">
      {/* Hero */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-violet-500/20">
            <Video className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-zinc-100 tracking-tight">TikTok</h1>
            <p className="text-sm text-zinc-500">
              Programá y publicá videos de tu marca en TikTok desde el workspace.
            </p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-zinc-500 py-12 justify-center">
          <Loader2 className="h-4 w-4 animate-spin" />
          Cargando estado de la integración…
        </div>
      ) : isConnected ? (
        <ConnectedView
          status={status}
          justConnected={justConnected}
          onDisconnect={handleDisconnect}
          disconnecting={disconnecting}
        />
      ) : (
        <DisconnectedView />
      )}

      {/* Footer note */}
      <p className="mt-10 text-xs text-zinc-600">
        Esta integración usa la{' '}
        <a
          href="https://developers.tiktok.com/doc/content-posting-api-reference-direct-post-video"
          className="underline hover:text-zinc-400"
          target="_blank"
          rel="noopener noreferrer"
        >
          Content Posting API oficial de TikTok
        </a>
        . Datos manejados según nuestra{' '}
        <Link href="/privacidad" className="underline hover:text-zinc-400">
          política de privacidad
        </Link>
        .
      </p>
    </div>
  )
}

function ConnectedView({
  status,
  justConnected,
  onDisconnect,
  disconnecting,
}: {
  status: IntegrationStatus | null
  justConnected: boolean
  onDisconnect: () => void
  disconnecting: boolean
}) {
  return (
    <div className="space-y-6">
      {/* Success banner */}
      <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 flex items-start gap-3">
        <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="font-medium text-emerald-300">
            {justConnected ? 'TikTok conectado correctamente' : 'TikTok activo'}
          </p>
          <p className="text-sm text-emerald-200/70">
            Ya podés crear y programar publicaciones desde acá.
          </p>
        </div>
      </div>

      {/* Primary CTA cards */}
      <div className="grid sm:grid-cols-2 gap-4">
        <Link
          href="/workspace/integrations/tiktok/post"
          className="group rounded-xl border border-zinc-800 bg-gradient-to-br from-violet-600/10 to-fuchsia-600/5 p-5 hover:border-violet-500/50 transition-all hover:shadow-lg hover:shadow-violet-500/10"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="w-10 h-10 rounded-lg bg-violet-500/20 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-violet-400" />
            </div>
            <ArrowRight className="w-4 h-4 text-zinc-600 group-hover:text-violet-400 group-hover:translate-x-0.5 transition-all" />
          </div>
          <h3 className="font-semibold text-zinc-100 mb-1">Publicar un video</h3>
          <p className="text-sm text-zinc-500">
            Subí un mp4, escribí el caption y publicalo ahora mismo.
          </p>
        </Link>

        <Link
          href="/workspace/integrations/tiktok/post?mode=schedule"
          className="group rounded-xl border border-zinc-800 bg-zinc-900/40 p-5 hover:border-zinc-700 transition-all"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-zinc-400" />
            </div>
            <ArrowRight className="w-4 h-4 text-zinc-600 group-hover:text-zinc-300 group-hover:translate-x-0.5 transition-all" />
          </div>
          <h3 className="font-semibold text-zinc-100 mb-1">Programar publicación</h3>
          <p className="text-sm text-zinc-500">
            Elegí día y hora — el video se publica automáticamente.
          </p>
        </Link>
      </div>

      {/* Connection details */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 overflow-hidden">
        <div className="px-5 py-3 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-zinc-500" />
            <span className="text-sm font-medium text-zinc-300">Detalles de la conexión</span>
          </div>
          <span className="inline-block rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-400">
            Activa
          </span>
        </div>
        <dl className="divide-y divide-zinc-800 text-sm">
          <Row label="open_id" value={status?.open_id ?? '—'} mono />
          <Row label="Scopes" value={status?.scope ?? '—'} mono />
          <Row
            label="Conectada el"
            value={
              status?.connected_at
                ? new Date(status.connected_at).toLocaleString('es-AR')
                : justConnected
                  ? 'Hace instantes'
                  : '—'
            }
          />
          {status?.expires_at && (
            <Row
              label="Token expira"
              value={new Date(status.expires_at).toLocaleString('es-AR')}
            />
          )}
        </dl>
        <div className="px-5 py-3 border-t border-zinc-800 flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={onDisconnect}
            disabled={disconnecting}
            className="text-zinc-500 hover:text-red-400 hover:bg-red-500/10"
          >
            {disconnecting ? (
              <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
            ) : (
              <Unplug className="h-3.5 w-3.5 mr-2" />
            )}
            Desconectar TikTok
          </Button>
        </div>
      </div>
    </div>
  )
}

function DisconnectedView() {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 overflow-hidden">
      <div className="p-6 sm:p-8">
        <div className="flex items-start gap-4 mb-6">
          <div className="w-12 h-12 rounded-xl bg-zinc-800 flex items-center justify-center shrink-0">
            <Plug className="w-6 h-6 text-zinc-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-zinc-100 mb-1">
              Conectá tu cuenta de TikTok
            </h2>
            <p className="text-sm text-zinc-500">
              Te llevamos a la pantalla oficial de TikTok donde autorizás los permisos necesarios.
            </p>
          </div>
        </div>

        <div className="grid sm:grid-cols-3 gap-3 mb-6">
          <Feature
            icon={Shield}
            title="Tu contraseña no pasa por acá"
            text="Autorizás directo en TikTok vía OAuth oficial."
          />
          <Feature
            icon={Unplug}
            title="Desconectás cuando quieras"
            text="Revocá el acceso desde esta misma página."
          />
          <Feature
            icon={CheckCircle2}
            title="Vos aprobás cada video"
            text="Solo se publica lo que vos subís y confirmás."
          />
        </div>

        <Button
          asChild
          size="lg"
          className="w-full sm:w-auto bg-violet-600 hover:bg-violet-700 shadow-lg shadow-violet-600/20"
        >
          <a href="/api/auth/tiktok/login">
            <Plug className="w-4 h-4 mr-2" />
            Conectar TikTok
          </a>
        </Button>
      </div>

      <div className="px-6 sm:px-8 py-3 border-t border-zinc-800 bg-zinc-950/40">
        <p className="text-xs text-zinc-500">
          Scopes solicitados:{' '}
          <code className="text-zinc-400">user.info.basic</code> ·{' '}
          <code className="text-zinc-400">video.upload</code> ·{' '}
          <code className="text-zinc-400">video.publish</code>
        </p>
      </div>
    </div>
  )
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="px-5 py-3 flex items-center justify-between gap-4">
      <dt className="text-zinc-500">{label}</dt>
      <dd className={`text-zinc-300 truncate ${mono ? 'font-mono text-xs' : ''}`}>{value}</dd>
    </div>
  )
}

function Feature({
  icon: Icon,
  title,
  text,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  text: string
}) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-950/40 p-3">
      <Icon className="w-4 h-4 text-violet-400 mb-2" />
      <p className="text-xs font-medium text-zinc-300 mb-1">{title}</p>
      <p className="text-xs text-zinc-500 leading-relaxed">{text}</p>
    </div>
  )
}
