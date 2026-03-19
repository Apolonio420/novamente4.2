'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Users,
  Mail,
  Phone,
  ChevronDown,
  ChevronUp,
  Loader2,
  Inbox,
  Share2,
  ExternalLink,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { authFetch } from '@/lib/partners/auth-fetch'

// --- Types ---

interface Lead {
  id: string
  tenant_id: string
  name: string | null
  email: string | null
  phone: string | null
  message: string | null
  source: string
  product_interest: string | null
  status: string
  metadata: Record<string, unknown>
  created_at: string
}

type LeadStatus = 'new' | 'contacted' | 'qualified' | 'converted' | 'lost'

// --- Constants ---

const STATUS_CONFIG: Record<LeadStatus, { label: string; color: string; bg: string }> = {
  new: { label: 'Nuevo', color: 'text-blue-400', bg: 'bg-blue-500/20 border-blue-500/30 text-blue-300' },
  contacted: { label: 'Contactado', color: 'text-yellow-400', bg: 'bg-yellow-500/20 border-yellow-500/30 text-yellow-300' },
  qualified: { label: 'Calificado', color: 'text-purple-400', bg: 'bg-purple-500/20 border-purple-500/30 text-purple-300' },
  converted: { label: 'Convertido', color: 'text-green-400', bg: 'bg-green-500/20 border-green-500/30 text-green-300' },
  lost: { label: 'Perdido', color: 'text-red-400', bg: 'bg-red-500/20 border-red-500/30 text-red-300' },
}

const FILTER_TABS: { value: string; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'new', label: 'Nuevos' },
  { value: 'contacted', label: 'Contactados' },
  { value: 'qualified', label: 'Calificados' },
  { value: 'converted', label: 'Convertidos' },
  { value: 'lost', label: 'Perdidos' },
]

const SOURCE_LABELS: Record<string, string> = {
  storefront: 'Storefront',
  whatsapp: 'WhatsApp',
  instagram: 'Instagram',
  manual: 'Manual',
  referral: 'Referido',
}

// --- Helpers ---

function relativeDate(dateStr: string): string {
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const diffMs = now - then
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHour = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHour / 24)

  if (diffSec < 60) return 'ahora'
  if (diffMin < 60) return `hace ${diffMin}m`
  if (diffHour < 24) return `hace ${diffHour}h`
  if (diffDay === 1) return 'ayer'
  if (diffDay < 7) return `hace ${diffDay}d`
  if (diffDay < 30) return `hace ${Math.floor(diffDay / 7)}sem`
  return new Date(dateStr).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text
  return text.slice(0, max) + '...'
}

// --- Skeleton ---

function LeadRowSkeleton() {
  return (
    <div className="px-4 py-4 border-b border-zinc-800/50 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-zinc-800" />
        <div className="flex-1 min-w-0 space-y-2">
          <div className="h-4 bg-zinc-800 rounded w-32" />
          <div className="h-3 bg-zinc-800/60 rounded w-48" />
        </div>
        <div className="h-5 bg-zinc-800 rounded-full w-16" />
      </div>
    </div>
  )
}

// --- Lead Row ---

function LeadRow({
  lead,
  isExpanded,
  onToggle,
  onStatusChange,
  isUpdating,
}: {
  lead: Lead
  isExpanded: boolean
  onToggle: () => void
  onStatusChange: (leadId: string, status: LeadStatus) => void
  isUpdating: boolean
}) {
  const status = (lead.status as LeadStatus) || 'new'
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.new
  const displayName = lead.name || lead.email || lead.phone || 'Sin nombre'
  const initial = displayName.charAt(0).toUpperCase()

  return (
    <div className={cn(
      'border-b border-zinc-800/50 transition-colors',
      isExpanded ? 'bg-zinc-900/50' : 'hover:bg-zinc-900/30',
    )}>
      {/* Row summary */}
      <button
        onClick={onToggle}
        className="w-full px-4 py-3.5 flex items-center gap-3 text-left"
      >
        {/* Avatar */}
        <div className="w-9 h-9 rounded-full bg-zinc-800 flex items-center justify-center text-sm font-semibold text-zinc-300 shrink-0">
          {initial}
        </div>

        {/* Main info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-zinc-100 truncate">
              {displayName}
            </span>
            <span className="text-xs text-zinc-500 shrink-0 hidden sm:inline">
              {relativeDate(lead.created_at)}
            </span>
          </div>
          {lead.message && (
            <p className="text-xs text-zinc-400 truncate mt-0.5">
              {truncate(lead.message, 80)}
            </p>
          )}
        </div>

        {/* Badges */}
        <div className="flex items-center gap-2 shrink-0">
          <Badge className={cn('text-[10px] border', config.bg)}>
            {config.label}
          </Badge>
          <span className="text-xs text-zinc-500 sm:hidden">
            {relativeDate(lead.created_at)}
          </span>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-zinc-500" />
          ) : (
            <ChevronDown className="w-4 h-4 text-zinc-500" />
          )}
        </div>
      </button>

      {/* Expanded detail */}
      {isExpanded && (
        <div className="px-4 pb-4 pt-1 space-y-4">
          {/* Contact info */}
          <div className="flex flex-wrap gap-3">
            {lead.email && (
              <a
                href={`mailto:${lead.email}`}
                className="flex items-center gap-1.5 text-sm text-violet-400 hover:text-violet-300 transition-colors"
              >
                <Mail className="w-3.5 h-3.5" />
                {lead.email}
              </a>
            )}
            {lead.phone && (
              <a
                href={`tel:${lead.phone}`}
                className="flex items-center gap-1.5 text-sm text-violet-400 hover:text-violet-300 transition-colors"
              >
                <Phone className="w-3.5 h-3.5" />
                {lead.phone}
              </a>
            )}
          </div>

          {/* Full message */}
          {lead.message && (
            <div className="bg-zinc-800/40 rounded-lg p-3">
              <p className="text-xs text-zinc-500 mb-1 font-medium">Mensaje</p>
              <p className="text-sm text-zinc-200 whitespace-pre-wrap">{lead.message}</p>
            </div>
          )}

          {/* Meta info */}
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-500">
            {lead.product_interest && (
              <span>Producto: <span className="text-zinc-300">{lead.product_interest}</span></span>
            )}
            <span>Fuente: <span className="text-zinc-300">{SOURCE_LABELS[lead.source] || lead.source}</span></span>
            <span>
              Fecha:{' '}
              <span className="text-zinc-300">
                {new Date(lead.created_at).toLocaleDateString('es-AR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </span>
          </div>

          {/* Status pipeline */}
          <div>
            <p className="text-xs text-zinc-500 mb-2 font-medium">Cambiar estado</p>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(STATUS_CONFIG) as LeadStatus[]).map((s) => {
                const sc = STATUS_CONFIG[s]
                const isCurrent = s === status
                return (
                  <button
                    key={s}
                    disabled={isCurrent || isUpdating}
                    onClick={() => onStatusChange(lead.id, s)}
                    className={cn(
                      'px-3 py-1.5 rounded-md text-xs font-medium border transition-colors',
                      isCurrent
                        ? cn(sc.bg, 'cursor-default')
                        : 'border-zinc-700 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200 disabled:opacity-50',
                    )}
                  >
                    {isUpdating ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      sc.label
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// --- Main Page ---

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [totalThisMonth, setTotalThisMonth] = useState(0)
  const [maxPerMonth, setMaxPerMonth] = useState(0)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const fetchLeads = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (filter !== 'all') params.set('status', filter)
      params.set('limit', '50')

      const res = await authFetch(`/api/partners/leads/list?${params.toString()}`)
      if (!res.ok) return

      const data = await res.json()
      setLeads(data.leads || [])
      setTotalThisMonth(data.totalThisMonth || 0)
      setMaxPerMonth(data.maxPerMonth || 0)
    } catch {
      // Silent fail — keep stale data
    }
  }, [filter])

  // Initial fetch + filter change
  useEffect(() => {
    setLoading(true)
    fetchLeads().finally(() => setLoading(false))
  }, [fetchLeads])

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchLeads()
    }, 30_000)
    return () => clearInterval(interval)
  }, [fetchLeads])

  const handleStatusChange = async (leadId: string, newStatus: LeadStatus) => {
    setUpdatingId(leadId)
    try {
      const res = await authFetch(`/api/partners/leads/${leadId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      if (res.ok) {
        // Update locally
        setLeads((prev) =>
          prev.map((l) => (l.id === leadId ? { ...l, status: newStatus } : l)),
        )
        // Re-count if filter active — the lead might need to disappear
        if (filter !== 'all') {
          setLeads((prev) => prev.filter((l) => l.status === filter))
        }
      }
    } catch {
      // Silent fail
    } finally {
      setUpdatingId(null)
    }
  }

  const usagePct = maxPerMonth > 0 ? Math.min((totalThisMonth / maxPerMonth) * 100, 100) : 0
  const isUnlimited = maxPerMonth >= 999999
  const isNearLimit = !isUnlimited && usagePct >= 80

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-zinc-100">Leads</h1>
            {!loading && (
              <Badge className="bg-zinc-800 border-zinc-700 text-zinc-300 text-xs">
                {leads.length}
              </Badge>
            )}
          </div>

          {/* Month counter */}
          {!loading && (
            <div className="flex items-center gap-2 text-sm">
              {isUnlimited ? (
                <span className="text-zinc-400">{totalThisMonth} este mes</span>
              ) : (
                <span className={cn(
                  'font-medium',
                  isNearLimit ? 'text-amber-400' : 'text-zinc-400',
                )}>
                  {totalThisMonth} / {maxPerMonth} este mes
                </span>
              )}
            </div>
          )}
        </div>

        {/* Progress bar (only for limited plans near limit) */}
        {!loading && !isUnlimited && (
          <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-all duration-500',
                isNearLimit ? 'bg-amber-500' : 'bg-violet-500',
              )}
              style={{ width: `${usagePct}%` }}
            />
          </div>
        )}

        {/* Filter tabs */}
        <div className="flex gap-1 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setFilter(tab.value)}
              className={cn(
                'px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors',
                filter === tab.value
                  ? 'bg-violet-600/20 text-violet-400'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60',
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Lead list */}
      <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl overflow-hidden">
        {loading ? (
          <>
            <LeadRowSkeleton />
            <LeadRowSkeleton />
            <LeadRowSkeleton />
            <LeadRowSkeleton />
            <LeadRowSkeleton />
          </>
        ) : leads.length === 0 ? (
          /* Empty state */
          <div className="py-16 px-6 flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center mb-4">
              <Inbox className="w-6 h-6 text-zinc-500" />
            </div>
            <h3 className="text-sm font-semibold text-zinc-200 mb-1">
              Todavia no recibiste leads
            </h3>
            <p className="text-xs text-zinc-500 max-w-xs mb-4">
              Comparti tu storefront para empezar a recibir consultas de clientes potenciales.
            </p>
            <div className="flex items-center gap-1.5 text-xs text-violet-400">
              <Share2 className="w-3.5 h-3.5" />
              Comparti tu storefront
              <ExternalLink className="w-3 h-3" />
            </div>
          </div>
        ) : (
          leads.map((lead) => (
            <LeadRow
              key={lead.id}
              lead={lead}
              isExpanded={expandedId === lead.id}
              onToggle={() =>
                setExpandedId(expandedId === lead.id ? null : lead.id)
              }
              onStatusChange={handleStatusChange}
              isUpdating={updatingId === lead.id}
            />
          ))
        )}
      </div>
    </div>
  )
}
