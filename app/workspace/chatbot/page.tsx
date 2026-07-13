'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import {
  MessageSquare, Loader2, ArrowLeft, User, Bot,
  Search, Download, Clock, ChevronRight, Zap, Filter
} from 'lucide-react'
import { authFetch } from '@/lib/partners/auth-fetch'
import { LockedFeature } from '@/components/partners/locked-feature'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SessionSummary {
  id: string
  visitor_id: string | null
  status: 'active' | 'closed'
  message_count: number
  created_at: string
  updated_at: string
}

interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  created_at: string
}

interface Metrics {
  total: number
  active: number
  messagesToday: number
  avgMessages: number
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function ChatbotPage() {
  const [sessions, setSessions] = useState<SessionSummary[]>([])
  const [selectedSession, setSelectedSession] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [metrics, setMetrics] = useState<Metrics>({ total: 0, active: 0, messagesToday: 0, avgMessages: 0 })
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'closed'>('all')

  // Plan gate — el chatbot es Pro-only (PLAN_FEATURES.pro.chatbot). El
  // sidebar ya lo marca requiredPlan='pro', pero eso es solo cosmetico: el
  // link navega igual, asi que el gate real vive aca.
  const [plan, setPlan] = useState<string | null>(null)
  const [planLoading, setPlanLoading] = useState(true)

  useEffect(() => {
    authFetch('/api/partners/dashboard')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setPlan(data?.tenant?.plan || 'starter'))
      .catch(() => setPlan('starter'))
      .finally(() => setPlanLoading(false))
  }, [])

  const fetchSessions = useCallback(async () => {
    try {
      const res = await authFetch('/api/partners/agent/sessions')
      if (!res.ok) return
      const data = await res.json()
      const sessionList: SessionSummary[] = data.sessions || []
      setSessions(sessionList)

      const today = new Date().toISOString().slice(0, 10)
      const active = sessionList.filter((s) => s.status === 'active').length
      const todayMessages = sessionList
        .filter((s) => s.updated_at?.slice(0, 10) === today)
        .reduce((sum, s) => sum + (s.message_count || 0), 0)
      const totalMessages = sessionList.reduce((sum, s) => sum + (s.message_count || 0), 0)

      setMetrics({
        total: sessionList.length,
        active,
        messagesToday: todayMessages,
        avgMessages: sessionList.length ? Math.round(totalMessages / sessionList.length) : 0,
      })
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSessions()
    const interval = setInterval(fetchSessions, 30000)
    return () => clearInterval(interval)
  }, [fetchSessions])

  const openSession = useCallback(async (id: string) => {
    setSelectedSession(id)
    setLoadingMessages(true)
    try {
      const res = await authFetch(`/api/partners/agent/sessions/${id}`)
      if (!res.ok) return
      const data = await res.json()
      setMessages(data.messages || [])
    } catch {
      // ignore
    } finally {
      setLoadingMessages(false)
    }
  }, [])

  const filteredSessions = useMemo(() => {
    let filtered = sessions
    if (statusFilter !== 'all') {
      filtered = filtered.filter(s => s.status === statusFilter)
    }
    if (search.trim()) {
      const q = search.toLowerCase()
      filtered = filtered.filter(s =>
        (s.visitor_id || s.id).toLowerCase().includes(q)
      )
    }
    return filtered
  }, [sessions, search, statusFilter])

  const exportSession = useCallback(() => {
    if (!messages.length) return
    const session = sessions.find(s => s.id === selectedSession)
    const lines = messages
      .filter(m => m.role !== 'system')
      .map(m => {
        const time = new Date(m.created_at).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
        const role = m.role === 'user' ? 'Visitante' : 'Bot'
        return `[${time}] ${role}: ${m.content}`
      })
    const header = `Conversacion - ${session?.visitor_id ? `Visitante ${session.visitor_id.slice(0, 8)}` : `Sesion ${selectedSession?.slice(0, 8)}`}\nFecha: ${session ? new Date(session.created_at).toLocaleDateString('es-AR') : ''}\n${'─'.repeat(50)}\n\n`
    const blob = new Blob([header + lines.join('\n')], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `chat-${selectedSession?.slice(0, 8)}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }, [messages, selectedSession, sessions])

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  if (!planLoading && plan !== 'pro') {
    return (
      <div className="mx-auto max-w-3xl">
        <LockedFeature
          title="Chatbot IA"
          description="Asistente virtual con IA que responde consultas de tus visitantes por WhatsApp e Instagram, entrenado con tu catalogo."
          requiredPlan="pro"
          icon={MessageSquare}
          features={[
            'Respuestas automaticas 24/7 en tu storefront',
            'Entrenado con los productos de tu catalogo',
            'Historial de conversaciones en tiempo real',
            'Metricas de sesiones y mensajes',
          ]}
        />
      </div>
    )
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="h-6 w-32 bg-zinc-800 rounded animate-pulse" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 rounded-xl bg-zinc-900 animate-pulse" />
          ))}
        </div>
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 rounded-xl bg-zinc-900 animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-xl font-bold text-zinc-100">Chatbot</h1>
        <p className="text-sm text-zinc-500">
          Conversaciones del asistente virtual con visitantes de tu storefront
        </p>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard icon={MessageSquare} label="Total sesiones" value={metrics.total} />
        <MetricCard icon={Zap} label="Activas ahora" value={metrics.active} color="emerald" />
        <MetricCard icon={Clock} label="Mensajes hoy" value={metrics.messagesToday} color="violet" />
        <MetricCard icon={MessageSquare} label="Promedio msgs" value={metrics.avgMessages} color="amber" />
      </div>

      {sessions.length === 0 ? (
        <EmptyState />
      ) : selectedSession ? (
        <SessionDetail
          session={sessions.find(s => s.id === selectedSession) || null}
          messages={messages}
          loading={loadingMessages}
          onBack={() => {
            setSelectedSession(null)
            setMessages([])
          }}
          onExport={exportSession}
        />
      ) : (
        <>
          {/* Search + Filter bar */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
              <input
                type="text"
                placeholder="Buscar por visitante..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-lg border border-zinc-800 bg-zinc-900 py-2.5 pl-10 pr-4 text-sm text-zinc-200 placeholder-zinc-600 focus:border-violet-600 focus:outline-none focus:ring-1 focus:ring-violet-600"
              />
            </div>
            <div className="flex gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900 p-1">
              {(['all', 'active', 'closed'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setStatusFilter(f)}
                  className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                    statusFilter === f
                      ? 'bg-violet-600/20 text-violet-400'
                      : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  {f === 'all' ? 'Todas' : f === 'active' ? 'Activas' : 'Cerradas'}
                </button>
              ))}
            </div>
          </div>

          {/* Session count */}
          <div className="flex items-center justify-between">
            <p className="text-xs text-zinc-500">
              {filteredSessions.length} {filteredSessions.length === 1 ? 'conversacion' : 'conversaciones'}
            </p>
          </div>

          <SessionList sessions={filteredSessions} onSelect={openSession} />
        </>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Metric Card
// ---------------------------------------------------------------------------

function MetricCard({
  icon: Icon,
  label,
  value,
  color = 'zinc',
}: {
  icon: any
  label: string
  value: number
  color?: string
}) {
  const colorMap: Record<string, { text: string; bg: string; icon: string }> = {
    zinc: { text: 'text-zinc-100', bg: 'bg-zinc-800/50', icon: 'text-zinc-400' },
    emerald: { text: 'text-emerald-400', bg: 'bg-emerald-500/10', icon: 'text-emerald-500' },
    violet: { text: 'text-violet-400', bg: 'bg-violet-500/10', icon: 'text-violet-500' },
    amber: { text: 'text-amber-400', bg: 'bg-amber-500/10', icon: 'text-amber-500' },
  }
  const c = colorMap[color] || colorMap.zinc

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-zinc-500">{label}</p>
        <div className={`rounded-lg p-1.5 ${c.bg}`}>
          <Icon className={`h-3.5 w-3.5 ${c.icon}`} />
        </div>
      </div>
      <p className={`text-2xl font-bold ${c.text}`}>{value}</p>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Empty State
// ---------------------------------------------------------------------------

function EmptyState() {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-8 space-y-6">
      {/* Icon + title */}
      <div className="flex flex-col items-center text-center gap-4">
        <div className="rounded-2xl bg-violet-500/10 p-5">
          <MessageSquare className="h-10 w-10 text-violet-400" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-zinc-100">Chatbot IA para tu storefront</h2>
          <p className="mt-2 text-sm text-zinc-400 leading-relaxed max-w-md mx-auto">
            Cuando un visitante entre a tu storefront y use el chat, sus conversaciones van a aparecer aca.
            El chatbot esta entrenado con los productos de tu catalogo y responde consultas automaticamente.
          </p>
        </div>
      </div>

      {/* Como funciona */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-800/30 p-5 max-w-md mx-auto w-full">
        <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-4">Como funciona</p>
        <ol className="space-y-3">
          {[
            'Un visitante entra a tu storefront y abre el chat',
            'El chatbot responde usando IA, entrenado con tus productos',
            'Ves las conversaciones aca en tiempo real',
          ].map((step, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-violet-500/20 text-[11px] font-bold text-violet-400 mt-0.5">
                {i + 1}
              </span>
              <span className="text-sm text-zinc-300 leading-relaxed">{step}</span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Session List
// ---------------------------------------------------------------------------

function SessionList({
  sessions,
  onSelect,
}: {
  sessions: SessionSummary[]
  onSelect: (id: string) => void
}) {
  // Group sessions by date
  const grouped = useMemo(() => {
    const groups: { label: string; sessions: SessionSummary[] }[] = []
    const today = new Date().toDateString()
    const yesterday = new Date(Date.now() - 86400000).toDateString()
    const buckets = new Map<string, SessionSummary[]>()

    for (const s of sessions) {
      const d = new Date(s.updated_at || s.created_at).toDateString()
      let label = d === today ? 'Hoy' : d === yesterday ? 'Ayer' : new Date(s.updated_at || s.created_at).toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'short' })
      if (!buckets.has(label)) buckets.set(label, [])
      buckets.get(label)!.push(s)
    }

    for (const [label, items] of buckets) {
      groups.push({ label, sessions: items })
    }
    return groups
  }, [sessions])

  return (
    <div className="space-y-6">
      {grouped.map((group) => (
        <div key={group.label}>
          <p className="text-xs font-medium text-zinc-600 uppercase tracking-wider mb-2 px-1">
            {group.label}
          </p>
          <div className="space-y-1.5">
            {group.sessions.map((session) => (
              <button
                key={session.id}
                onClick={() => onSelect(session.id)}
                className="flex w-full items-center gap-4 rounded-xl border border-zinc-800 bg-zinc-900 p-4 text-left transition-all hover:border-zinc-700 hover:bg-zinc-800/60 group"
              >
                {/* Avatar */}
                <div className="relative">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-800 text-zinc-400">
                    <User className="h-4 w-4" />
                  </div>
                  {session.status === 'active' && (
                    <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-zinc-900 bg-emerald-500" />
                  )}
                </div>

                {/* Info */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-zinc-200 truncate">
                      {session.visitor_id
                        ? `Visitante ${session.visitor_id.slice(0, 8)}`
                        : `Sesion ${session.id.slice(0, 8)}`}
                    </p>
                    {session.status === 'active' && (
                      <span className="shrink-0 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
                        En vivo
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    {formatTimeAgo(session.updated_at || session.created_at)}
                  </p>
                </div>

                {/* Right side */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                    <MessageSquare className="h-3.5 w-3.5" />
                    {session.message_count}
                  </div>
                  <ChevronRight className="h-4 w-4 text-zinc-600 group-hover:text-zinc-400 transition-colors" />
                </div>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Session Detail
// ---------------------------------------------------------------------------

function SessionDetail({
  session,
  messages,
  loading,
  onBack,
  onExport,
}: {
  session: SessionSummary | null
  messages: Message[]
  loading: boolean
  onBack: () => void
  onExport: () => void
}) {
  const visibleMessages = messages.filter(m => m.role !== 'system')

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm text-zinc-400 transition hover:text-zinc-200"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver
        </button>
        {visibleMessages.length > 0 && (
          <button
            onClick={onExport}
            className="flex items-center gap-2 rounded-lg border border-zinc-700 px-3 py-1.5 text-xs text-zinc-400 transition hover:border-zinc-600 hover:text-zinc-200"
          >
            <Download className="h-3.5 w-3.5" />
            Exportar
          </button>
        )}
      </div>

      {/* Session info card */}
      {session && (
        <div className="flex items-center gap-4 rounded-xl border border-zinc-800 bg-zinc-900 p-4">
          <div className="relative">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-800">
              <User className="h-4 w-4 text-zinc-400" />
            </div>
            {session.status === 'active' && (
              <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-zinc-900 bg-emerald-500" />
            )}
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-zinc-200">
              {session.visitor_id ? `Visitante ${session.visitor_id.slice(0, 8)}` : `Sesion ${session.id.slice(0, 8)}`}
            </p>
            <p className="text-xs text-zinc-500">
              {new Date(session.created_at).toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
          <div className="text-right">
            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
              session.status === 'active'
                ? 'bg-emerald-500/10 text-emerald-400'
                : 'bg-zinc-800 text-zinc-500'
            }`}>
              <div className={`h-1.5 w-1.5 rounded-full ${session.status === 'active' ? 'bg-emerald-500' : 'bg-zinc-600'}`} />
              {session.status === 'active' ? 'Activa' : 'Cerrada'}
            </span>
            <p className="text-xs text-zinc-600 mt-1">{session.message_count} mensajes</p>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900">
        <div className="max-h-[60vh] overflow-y-auto p-4 space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-5 w-5 animate-spin text-zinc-500" />
            </div>
          ) : visibleMessages.length === 0 ? (
            <p className="py-16 text-center text-sm text-zinc-500">
              Sin mensajes en esta sesion
            </p>
          ) : (
            visibleMessages.map((msg, i) => {
              const isUser = msg.role === 'user'
              const showAvatar = i === 0 || visibleMessages[i - 1]?.role !== msg.role

              return (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''} ${!showAvatar ? (isUser ? 'pr-10' : 'pl-10') : ''}`}
                >
                  {showAvatar && (
                    <div
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                        isUser
                          ? 'bg-violet-600/20 text-violet-400'
                          : 'bg-zinc-700 text-zinc-300'
                      }`}
                    >
                      {isUser ? <User className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
                    </div>
                  )}

                  <div
                    className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                      isUser
                        ? 'rounded-br-md bg-violet-600/20 text-violet-100'
                        : 'rounded-bl-md bg-zinc-800 text-zinc-300'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                    <span className="mt-1 block text-[10px] opacity-40">
                      {new Date(msg.created_at).toLocaleTimeString('es-AR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Hace un momento'
  if (mins < 60) return `Hace ${mins} min`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `Hace ${hours}h`
  const days = Math.floor(hours / 24)
  if (days < 7) return `Hace ${days}d`
  return new Date(dateStr).toLocaleDateString('es-AR')
}
