'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import {
  Loader2,
  CheckCircle2,
  Video,
  Calendar,
  Sparkles,
  Plug,
  Unplug,
  Clock,
  Send,
  AlertTriangle,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Plus,
  Music2,
} from 'lucide-react'

interface IntegrationStatus {
  connected: boolean
  open_id?: string | null
  scope?: string | null
  connected_at?: string | null
  expires_at?: string | null
}

interface TikTokPost {
  id: string
  video_url: string
  caption: string
  status: 'pending' | 'sent' | 'failed' | 'cancelled'
  scheduled_at: string
  sent_at: string | null
  publish_id: string | null
  error: string | null
  created_at: string
}

export default function TikTokIntegrationPage() {
  const [status, setStatus] = useState<IntegrationStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [disconnecting, setDisconnecting] = useState(false)
  const [posts, setPosts] = useState<TikTokPost[]>([])
  const [postsLoading, setPostsLoading] = useState(true)
  const [showDetails, setShowDetails] = useState(false)
  const params = useSearchParams()
  const justConnected = params.get('connected') === '1'
  const justPosted = params.get('posted') === '1'

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
      const [statusRes, postsRes] = await Promise.all([
        fetch('/api/partners/integrations/tiktok/status', {
          headers: { Authorization: `Bearer ${session.access_token}` },
        }),
        fetch('/api/partners/integrations/tiktok/posts', {
          headers: { Authorization: `Bearer ${session.access_token}` },
        }),
      ])
      if (cancelled) return
      if (statusRes.ok) setStatus((await statusRes.json()) as IntegrationStatus)
      else setStatus({ connected: false })
      if (postsRes.ok) {
        const data = await postsRes.json()
        setPosts(data.posts ?? [])
      }
      setLoading(false)
      setPostsLoading(false)
    }
    load()
    return () => {
      cancelled = true
    }
  }, [justPosted])

  async function handleDisconnect() {
    if (
      !confirm('¿Seguro querés desconectar TikTok? Vas a tener que reautorizar para volver a publicar.')
    )
      return
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

  const isConnected = (status?.connected ?? false) || justConnected

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-zinc-500 py-24 justify-center">
        <Loader2 className="h-4 w-4 animate-spin" />
        Cargando integración…
      </div>
    )
  }

  if (!isConnected) {
    return <DisconnectedView />
  }

  const stats = computeStats(posts)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative rounded-2xl overflow-hidden border border-zinc-800">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,#25F4EE22,transparent_50%),radial-gradient(circle_at_bottom_right,#FE2C5533,transparent_55%)]" />
        <div className="absolute inset-0 bg-zinc-950/40" />
        <div className="relative p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-center gap-4 min-w-0 flex-1">
            <TikTokLogo />
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">TikTok</h1>
                <ConnectedPill />
              </div>
              <p className="text-sm text-zinc-400 truncate">
                {status?.open_id ? (
                  <span className="font-mono text-xs">@{status.open_id.slice(0, 18)}…</span>
                ) : (
                  'Cuenta conectada'
                )}
                <span className="mx-2 text-zinc-700">·</span>
                <span className="text-xs">
                  {status?.scope?.split(',').length ?? 3} permisos otorgados
                </span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/workspace/integrations/tiktok/post"
              className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#25F4EE] to-[#FE2C55] px-4 py-2 text-sm font-semibold text-black hover:opacity-90 transition-opacity shadow-lg shadow-[#FE2C55]/20"
            >
              <Plus className="w-4 h-4" />
              Nuevo video
            </Link>
            <button
              onClick={handleDisconnect}
              disabled={disconnecting}
              title="Desconectar TikTok"
              className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-2 text-zinc-500 hover:text-red-400 hover:border-red-500/30 transition-colors"
            >
              {disconnecting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Unplug className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Just-posted toast */}
      {justPosted && (
        <div className="rounded-xl border border-[#25F4EE]/40 bg-gradient-to-r from-[#25F4EE]/10 to-[#FE2C55]/10 p-4 flex items-start gap-3">
          <Send className="h-5 w-5 text-[#25F4EE] shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-white">Video enviado a TikTok</p>
            <p className="text-sm text-zinc-300">
              Aparece en <span className="text-white font-medium">Drafts</span> de tu app — abrila
              en mobile para ajustar cover, hashtags y publicar.
            </p>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          icon={Video}
          label="Total"
          value={stats.total}
          accent="text-zinc-300"
          iconBg="bg-zinc-800"
        />
        <StatCard
          icon={Send}
          label="Enviados"
          value={stats.sent}
          accent="text-emerald-400"
          iconBg="bg-emerald-500/15"
        />
        <StatCard
          icon={Clock}
          label="Programados"
          value={stats.pending}
          accent="text-amber-400"
          iconBg="bg-amber-500/15"
        />
        <StatCard
          icon={AlertTriangle}
          label="Fallidos"
          value={stats.failed}
          accent="text-red-400"
          iconBg="bg-red-500/15"
        />
      </div>

      {/* Quick actions (compact) */}
      <div className="grid sm:grid-cols-2 gap-3">
        <Link
          href="/workspace/integrations/tiktok/post"
          className="group relative rounded-xl border border-zinc-800 bg-zinc-900/40 hover:border-[#25F4EE]/40 p-4 flex items-center gap-3 transition-all"
        >
          <div className="w-10 h-10 rounded-lg bg-[#25F4EE]/15 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5 text-[#25F4EE]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-zinc-100">Publicar ahora</p>
            <p className="text-xs text-zinc-500">Subí un mp4 y lo mandamos a TikTok</p>
          </div>
          <ChevronDown className="w-4 h-4 text-zinc-600 group-hover:text-[#25F4EE] -rotate-90 transition-colors" />
        </Link>
        <Link
          href="/workspace/integrations/tiktok/post?mode=schedule"
          className="group relative rounded-xl border border-zinc-800 bg-zinc-900/40 hover:border-[#FE2C55]/40 p-4 flex items-center gap-3 transition-all"
        >
          <div className="w-10 h-10 rounded-lg bg-[#FE2C55]/15 flex items-center justify-center shrink-0">
            <Calendar className="w-5 h-5 text-[#FE2C55]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-zinc-100">Programar</p>
            <p className="text-xs text-zinc-500">Elegí día y hora</p>
          </div>
          <ChevronDown className="w-4 h-4 text-zinc-600 group-hover:text-[#FE2C55] -rotate-90 transition-colors" />
        </Link>
      </div>

      {/* Posts grid */}
      <PostsGrid posts={posts} loading={postsLoading} />

      {/* Connection details (collapsed) */}
      <ConnectionDetails
        status={status}
        justConnected={justConnected}
        expanded={showDetails}
        onToggle={() => setShowDetails((v) => !v)}
      />

      <p className="text-[11px] text-zinc-600 text-center pt-2">
        Esta integración usa la{' '}
        <a
          href="https://developers.tiktok.com/doc/content-posting-api-reference-direct-post-video"
          className="underline hover:text-zinc-400"
          target="_blank"
          rel="noopener noreferrer"
        >
          Content Posting API oficial de TikTok
        </a>
        {' · '}
        <Link href="/privacidad" className="underline hover:text-zinc-400">
          política de privacidad
        </Link>
      </p>
    </div>
  )
}

function TikTokLogo() {
  return (
    <div className="relative w-12 h-12 shrink-0">
      <div className="absolute inset-0 rounded-xl bg-black border border-zinc-800" />
      <div className="absolute inset-0 flex items-center justify-center">
        <svg viewBox="0 0 24 24" className="w-6 h-6">
          <path
            fill="#25F4EE"
            d="M16.6 5.82s.51.5 0 0A4.28 4.28 0 0 1 15.54 3h-3.09v12.4a2.59 2.59 0 0 1-2.59 2.5c-1.42 0-2.59-1.16-2.59-2.59a2.59 2.59 0 0 1 3.39-2.46V9.71a6 6 0 0 0-1-.08A5.7 5.7 0 0 0 4 15.36 5.66 5.66 0 0 0 9.66 21a5.66 5.66 0 0 0 5.66-5.64V8.7a8.18 8.18 0 0 0 4.81 1.62V7.21a4.79 4.79 0 0 1-3.53-1.39z"
            transform="translate(2 1)"
          />
          <path
            fill="#FE2C55"
            d="M17.6 6.82s.51.5 0 0A4.28 4.28 0 0 1 16.54 4h-3.09v12.4a2.59 2.59 0 0 1-2.59 2.5c-1.42 0-2.59-1.16-2.59-2.59a2.59 2.59 0 0 1 3.39-2.46V10.71a6 6 0 0 0-1-.08A5.7 5.7 0 0 0 5 16.36 5.66 5.66 0 0 0 10.66 22a5.66 5.66 0 0 0 5.66-5.64V9.7a8.18 8.18 0 0 0 4.81 1.62V8.21a4.79 4.79 0 0 1-3.53-1.39z"
          />
          <path
            fill="#fff"
            d="M17 6s.5.5 0 0A4.28 4.28 0 0 1 16 3.5h-3v12.4a2.59 2.59 0 0 1-2.59 2.5c-1.42 0-2.59-1.16-2.59-2.59a2.59 2.59 0 0 1 3.39-2.46V10.21a6 6 0 0 0-1-.08A5.7 5.7 0 0 0 4.5 15.86 5.66 5.66 0 0 0 10.16 21.5a5.66 5.66 0 0 0 5.66-5.64V9.2a8.18 8.18 0 0 0 4.81 1.62V8.21A4.79 4.79 0 0 1 17 6z"
            opacity="0.85"
          />
        </svg>
      </div>
    </div>
  )
}

function ConnectedPill() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-400 border border-emerald-500/30">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
      Conectado
    </span>
  )
}

function StatCard({
  icon: Icon,
  label,
  value,
  accent,
  iconBg,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: number
  accent: string
  iconBg: string
}) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className={`w-8 h-8 rounded-lg ${iconBg} flex items-center justify-center`}>
          <Icon className={`w-4 h-4 ${accent}`} />
        </div>
      </div>
      <p className={`text-2xl font-bold ${accent}`}>{value}</p>
      <p className="text-xs text-zinc-500">{label}</p>
    </div>
  )
}

function PostsGrid({ posts, loading }: { posts: TikTokPost[]; loading: boolean }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 overflow-hidden">
      <div className="px-5 py-3 border-b border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Music2 className="w-4 h-4 text-zinc-500" />
          <span className="text-sm font-medium text-zinc-200">Publicaciones</span>
          {posts.length > 0 && (
            <span className="text-xs text-zinc-600">{posts.length}</span>
          )}
        </div>
      </div>

      {loading ? (
        <div className="px-5 py-12 flex items-center justify-center text-sm text-zinc-500 gap-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          Cargando…
        </div>
      ) : posts.length === 0 ? (
        <EmptyPosts />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 p-4">
          {posts.map((p) => (
            <PostCard key={p.id} post={p} />
          ))}
        </div>
      )}
    </div>
  )
}

function EmptyPosts() {
  return (
    <div className="px-5 py-16 text-center">
      <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-[#25F4EE]/20 to-[#FE2C55]/20 mb-4">
        <Video className="w-6 h-6 text-zinc-300" />
      </div>
      <p className="text-base font-medium text-zinc-200 mb-1">Sin videos todavía</p>
      <p className="text-sm text-zinc-500 mb-5 max-w-xs mx-auto">
        Subí tu primer mp4 y lo mandamos a TikTok como draft listo para publicar.
      </p>
      <Link
        href="/workspace/integrations/tiktok/post"
        className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#25F4EE] to-[#FE2C55] px-4 py-2 text-sm font-semibold text-black hover:opacity-90 transition-opacity"
      >
        <Plus className="w-4 h-4" />
        Subir video
      </Link>
    </div>
  )
}

function PostCard({ post }: { post: TikTokPost }) {
  const isScheduled = post.status === 'pending'
  const isSent = post.status === 'sent'
  const isFailed = post.status === 'failed'

  const date = new Date(isSent && post.sent_at ? post.sent_at : post.scheduled_at)
  const dateStr = date.toLocaleDateString('es-AR', {
    day: '2-digit',
    month: 'short',
  })
  const timeStr = date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })

  const statusBadge = isSent ? (
    <span className="inline-flex items-center gap-1 rounded bg-emerald-500/90 backdrop-blur px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-black">
      <Send className="w-2.5 h-2.5" />
      Enviado
    </span>
  ) : isScheduled ? (
    <span className="inline-flex items-center gap-1 rounded bg-amber-500/90 backdrop-blur px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-black">
      <Clock className="w-2.5 h-2.5" />
      {dateStr}
    </span>
  ) : isFailed ? (
    <span className="inline-flex items-center gap-1 rounded bg-red-500/90 backdrop-blur px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white">
      <AlertTriangle className="w-2.5 h-2.5" />
      Falló
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded bg-zinc-700/90 backdrop-blur px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white">
      {post.status}
    </span>
  )

  return (
    <a
      href={post.video_url}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative rounded-lg overflow-hidden bg-black aspect-[9/16] block"
    >
      <video src={post.video_url} className="absolute inset-0 w-full h-full object-cover" muted />
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />
      {/* Top badge */}
      <div className="absolute top-2 left-2">{statusBadge}</div>
      {/* External link icon */}
      <div className="absolute top-2 right-2 w-6 h-6 rounded bg-black/60 backdrop-blur flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
        <ExternalLink className="w-3 h-3 text-white" />
      </div>
      {/* Bottom: caption + time */}
      <div className="absolute bottom-0 left-0 right-0 p-2">
        <p className="text-xs text-white line-clamp-2 leading-tight mb-1">
          {post.caption || <span className="text-zinc-500 italic">Sin caption</span>}
        </p>
        <p className="text-[10px] text-zinc-400 font-mono">{timeStr}</p>
      </div>
      {post.error && (
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 px-2">
          <p className="text-[10px] text-red-300 line-clamp-2 bg-red-950/80 rounded px-1.5 py-1">
            {post.error}
          </p>
        </div>
      )}
    </a>
  )
}

function ConnectionDetails({
  status,
  justConnected,
  expanded,
  onToggle,
}: {
  status: IntegrationStatus | null
  justConnected: boolean
  expanded: boolean
  onToggle: () => void
}) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full px-5 py-3 flex items-center justify-between hover:bg-zinc-900/60 transition-colors"
      >
        <span className="text-sm text-zinc-400">Detalles técnicos de la conexión</span>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-zinc-600" />
        ) : (
          <ChevronDown className="w-4 h-4 text-zinc-600" />
        )}
      </button>
      {expanded && (
        <dl className="border-t border-zinc-800 divide-y divide-zinc-800 text-sm">
          <DetailRow label="open_id" value={status?.open_id ?? '—'} mono />
          <DetailRow label="Scopes" value={status?.scope ?? '—'} mono />
          <DetailRow
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
            <DetailRow
              label="Token expira"
              value={new Date(status.expires_at).toLocaleString('es-AR')}
            />
          )}
        </dl>
      )}
    </div>
  )
}

function DetailRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="px-5 py-2.5 flex items-center justify-between gap-4">
      <dt className="text-zinc-500 text-xs">{label}</dt>
      <dd className={`text-zinc-300 truncate text-xs ${mono ? 'font-mono' : ''}`}>{value}</dd>
    </div>
  )
}

function DisconnectedView() {
  return (
    <div className="max-w-2xl mx-auto pt-8">
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 overflow-hidden">
        <div className="relative p-8 text-center border-b border-zinc-800">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,#25F4EE22,transparent_50%),radial-gradient(circle_at_center,#FE2C5522,transparent_55%)]" />
          <div className="relative">
            <div className="inline-block mb-4">
              <TikTokLogo />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Conectá tu cuenta de TikTok</h2>
            <p className="text-sm text-zinc-400 max-w-md mx-auto">
              Te llevamos a la pantalla oficial de TikTok donde autorizás los permisos. Tu
              contraseña nunca pasa por nuestra plataforma.
            </p>
          </div>
        </div>

        <div className="p-6 grid sm:grid-cols-3 gap-3">
          <Feature title="Auth oficial" text="OAuth 2.0 directo con TikTok" />
          <Feature title="Vos aprobás" text="Solo se envía lo que vos confirmás" />
          <Feature title="Desconectás siempre" text="Revocás el acceso cuando quieras" />
        </div>

        <div className="p-6 pt-0">
          <a
            href="/api/auth/tiktok/login"
            className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-[#25F4EE] to-[#FE2C55] px-4 py-3 text-sm font-bold text-black hover:opacity-90 transition-opacity shadow-lg shadow-[#FE2C55]/20"
          >
            <Plug className="w-4 h-4" />
            Conectar con TikTok
          </a>
          <p className="mt-3 text-[11px] text-zinc-600 text-center">
            Scopes: <code className="text-zinc-400">user.info.basic</code> ·{' '}
            <code className="text-zinc-400">video.upload</code> ·{' '}
            <code className="text-zinc-400">video.publish</code>
          </p>
        </div>
      </div>
    </div>
  )
}

function Feature({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-950/40 p-3">
      <div className="flex items-center gap-2 mb-1">
        <CheckCircle2 className="w-3.5 h-3.5 text-[#25F4EE]" />
        <p className="text-xs font-medium text-zinc-200">{title}</p>
      </div>
      <p className="text-xs text-zinc-500 leading-relaxed">{text}</p>
    </div>
  )
}

function computeStats(posts: TikTokPost[]) {
  return {
    total: posts.length,
    sent: posts.filter((p) => p.status === 'sent').length,
    pending: posts.filter((p) => p.status === 'pending').length,
    failed: posts.filter((p) => p.status === 'failed').length,
  }
}
