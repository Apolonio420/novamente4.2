'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { CalendarClock, CheckCircle2, ChevronDown, CircleDot, Clock3, FileText, MessageCircle, Plus, UserRound } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { authFetch } from '@/lib/partners/auth-fetch'
import { isPartnersCrmEnabled } from '@/lib/partners/feature-flags'

type LeadStatus = 'new' | 'contacted' | 'qualified' | 'converted' | 'lost'

interface Lead {
  id: string
  name: string | null
  email: string | null
  phone: string | null
  message: string | null
  source: string
  product_interest: string | null
  status: LeadStatus
  assigned_user_id: string | null
  next_action_at: string | null
  last_contacted_at: string | null
  estimated_value_ars: number | null
  lost_reason: string | null
  created_at: string
  updated_at: string
}

interface Activity {
  id: string
  type: string
  body: string | null
  metadata: Record<string, unknown>
  created_at: string
}

const STATUS: Record<LeadStatus, { label: string; className: string }> = {
  new: { label: 'Nuevo', className: 'border-blue-500/30 bg-blue-500/10 text-blue-300' },
  contacted: { label: 'Contactado', className: 'border-amber-500/30 bg-amber-500/10 text-amber-300' },
  qualified: { label: 'Calificado', className: 'border-violet-500/30 bg-violet-500/10 text-violet-300' },
  converted: { label: 'Convertido', className: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300' },
  lost: { label: 'Perdido', className: 'border-red-500/30 bg-red-500/10 text-red-300' },
}

const FILTERS: Array<{ value: 'all' | LeadStatus | 'attention'; label: string }> = [
  { value: 'attention', label: 'Para hoy' },
  { value: 'all', label: 'Todos' },
  ...Object.entries(STATUS).map(([value, config]) => ({ value: value as LeadStatus, label: config.label })),
]

const SOURCE_LABELS: Record<string, string> = {
  storefront: 'Storefront', whatsapp: 'WhatsApp', instagram: 'Instagram', manual: 'Manual', referral: 'Referido', chatbot: 'Chatbot',
}

function relativeDate(value: string) {
  const elapsed = Date.now() - new Date(value).getTime()
  const hours = Math.floor(elapsed / 3_600_000)
  if (hours < 1) return 'recién'
  if (hours < 24) return `hace ${hours} h`
  const days = Math.floor(hours / 24)
  return days === 1 ? 'ayer' : `hace ${days} d`
}

function toDateTimeInput(value: string | null) {
  if (!value) return ''
  const date = new Date(value)
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
  return local.toISOString().slice(0, 16)
}

function activityLabel(activity: Activity) {
  if (activity.type === 'note') return 'Nota interna'
  if (activity.type === 'status_changed') return `Estado: ${String(activity.metadata.from || '')} → ${String(activity.metadata.to || '')}`
  if (activity.type === 'next_action_set') return 'Próxima acción actualizada'
  if (activity.type === 'contacted') return 'Marcado como contactado'
  if (activity.type === 'assignment_changed') return 'Responsable actualizado'
  return 'Lead creado'
}

function whatsappUrl(lead: Lead) {
  const phone = (lead.phone || '').replace(/\D/g, '')
  if (!phone) return null
  const name = lead.name ? ` ${lead.name}` : ''
  return `https://wa.me/${phone}?text=${encodeURIComponent(`Hola${name}, te escribimos desde nuestra tienda.`)}`
}

export default function LeadsPage() {
  if (!isPartnersCrmEnabled()) {
    return (
      <div className="max-w-2xl mx-auto rounded-xl border border-zinc-800 bg-zinc-900/40 p-8 text-center">
        <h1 className="text-xl font-semibold text-zinc-100">Inbox de ventas no disponible</h1>
        <p className="mt-2 text-sm text-zinc-500">El CRM estÃ¡ en lanzamiento gradual para esta marca. Mientras tanto, los contactos existentes siguen resguardados.</p>
      </div>
    )
  }

  const [leads, setLeads] = useState<Lead[]>([])
  const [filter, setFilter] = useState<'all' | LeadStatus | 'attention'>('attention')
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [activities, setActivities] = useState<Activity[]>([])
  const [detailLoading, setDetailLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [note, setNote] = useState('')
  const [error, setError] = useState<string | null>(null)

  const selected = useMemo(() => leads.find((lead) => lead.id === selectedId) || null, [leads, selectedId])

  const loadLeads = useCallback(async () => {
    const params = new URLSearchParams({ limit: '80' })
    if (filter === 'attention') params.set('attention', 'true')
    else if (filter !== 'all') params.set('status', filter)
    const response = await authFetch(`/api/partners/leads/list?${params}`)
    if (!response.ok) throw new Error('No se pudieron cargar los leads')
    const data = await response.json()
    setLeads(data.leads || [])
  }, [filter])

  useEffect(() => {
    setLoading(true)
    loadLeads().catch((err) => setError(err.message)).finally(() => setLoading(false))
  }, [loadLeads])

  useEffect(() => {
    if (!selectedId) return
    setDetailLoading(true)
    authFetch(`/api/partners/leads/${selectedId}`)
      .then((response) => response.ok ? response.json() : Promise.reject(new Error('Lead no disponible')))
      .then((data) => {
        setActivities(data.activities || [])
        if (data.lead) setLeads((current) => current.map((lead) => lead.id === data.lead.id ? data.lead : lead))
      })
      .catch((err) => setError(err.message))
      .finally(() => setDetailLoading(false))
  }, [selectedId])

  const saveLead = async (updates: Record<string, unknown>) => {
    if (!selected) return
    setSaving(true)
    setError(null)
    try {
      const response = await authFetch(`/api/partners/leads/${selected.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updates),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'No se pudo guardar el lead')
      setLeads((current) => current.map((lead) => lead.id === selected.id ? data.lead : lead))
      const detail = await authFetch(`/api/partners/leads/${selected.id}`)
      if (detail.ok) setActivities((await detail.json()).activities || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar el lead')
    } finally {
      setSaving(false)
    }
  }

  const addNote = async () => {
    if (!selected || !note.trim()) return
    setSaving(true)
    try {
      const response = await authFetch(`/api/partners/leads/${selected.id}/notes`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ note }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'No se pudo guardar la nota')
      setActivities((current) => [data.activity, ...current])
      setNote('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar la nota')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-5">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Inbox de ventas</h1>
          <p className="text-sm text-zinc-500 mt-1">Respondé, seguí y convertí cada oportunidad desde un solo lugar.</p>
        </div>
        <span className="rounded-lg border border-zinc-800 bg-zinc-900/70 px-3 py-2 text-sm text-zinc-400">{leads.length} visibles</span>
      </div>

      <div className="flex gap-1 overflow-x-auto pb-1">
        {FILTERS.map((item) => (
          <button key={item.value} onClick={() => setFilter(item.value)} className={cn('px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors', filter === item.value ? 'bg-violet-600 text-white' : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200')}>
            {item.label}
          </button>
        ))}
      </div>

      {error && <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p>}

      <div className="grid lg:grid-cols-[minmax(0,1fr)_390px] gap-5 items-start">
        <section className="rounded-xl border border-zinc-800 overflow-hidden bg-zinc-900/40">
          {loading ? (
            <div className="p-6 text-sm text-zinc-500">Cargando oportunidades…</div>
          ) : leads.length === 0 ? (
            <div className="p-10 text-center"><CheckCircle2 className="w-7 h-7 mx-auto text-emerald-400 mb-2" /><p className="text-sm text-zinc-300">No hay leads en esta vista.</p><p className="text-xs text-zinc-500 mt-1">Cuando entre una consulta aparecerá acá para que puedas seguirla.</p></div>
          ) : leads.map((lead) => {
            const config = STATUS[lead.status] || STATUS.new
            const isSelected = lead.id === selectedId
            const overdue = lead.next_action_at && new Date(lead.next_action_at).getTime() <= Date.now()
            return (
              <button key={lead.id} onClick={() => setSelectedId(lead.id)} className={cn('w-full text-left px-4 py-3.5 border-b border-zinc-800/70 last:border-b-0 transition-colors', isSelected ? 'bg-violet-500/10' : 'hover:bg-zinc-800/40')}>
                <div className="flex gap-3 items-start">
                  <div className="w-9 h-9 rounded-full bg-zinc-800 flex items-center justify-center text-sm font-semibold text-zinc-300 shrink-0">{(lead.name || lead.email || '?').charAt(0).toUpperCase()}</div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2"><span className="text-sm font-medium text-zinc-100 truncate">{lead.name || lead.email || lead.phone || 'Sin nombre'}</span><span className="text-xs text-zinc-600">{relativeDate(lead.created_at)}</span></div>
                    <p className="text-xs text-zinc-500 truncate mt-0.5">{lead.message || lead.product_interest || SOURCE_LABELS[lead.source] || lead.source}</p>
                    {lead.next_action_at && <p className={cn('text-xs mt-1 flex items-center gap-1', overdue ? 'text-amber-300' : 'text-zinc-500')}><CalendarClock className="w-3 h-3" />{overdue ? 'Seguimiento vencido' : `Próxima acción: ${new Date(lead.next_action_at).toLocaleDateString('es-AR')}`}</p>}
                  </div>
                  <Badge className={cn('text-[10px] border shrink-0', config.className)}>{config.label}</Badge>
                  <ChevronDown className={cn('w-4 h-4 text-zinc-600 transition-transform', isSelected && 'rotate-180')} />
                </div>
              </button>
            )
          })}
        </section>

        <aside className="rounded-xl border border-zinc-800 bg-zinc-900/60 min-h-[420px] lg:sticky lg:top-4">
          {!selected ? (
            <div className="h-full min-h-[420px] flex flex-col items-center justify-center text-center p-8"><UserRound className="w-8 h-8 text-zinc-600 mb-3" /><p className="text-sm text-zinc-400">Elegí un lead para gestionarlo.</p></div>
          ) : (
            <LeadDetail lead={selected} activities={activities} loading={detailLoading} saving={saving} note={note} setNote={setNote} onSave={saveLead} onAddNote={addNote} />
          )}
        </aside>
      </div>
    </div>
  )
}

function LeadDetail({ lead, activities, loading, saving, note, setNote, onSave, onAddNote }: { lead: Lead; activities: Activity[]; loading: boolean; saving: boolean; note: string; setNote: (value: string) => void; onSave: (updates: Record<string, unknown>) => Promise<void>; onAddNote: () => Promise<void> }) {
  const [nextAction, setNextAction] = useState(toDateTimeInput(lead.next_action_at))
  const [value, setValue] = useState(lead.estimated_value_ars?.toString() || '')
  const [lostReason, setLostReason] = useState(lead.lost_reason || '')

  useEffect(() => {
    setNextAction(toDateTimeInput(lead.next_action_at)); setValue(lead.estimated_value_ars?.toString() || ''); setLostReason(lead.lost_reason || '')
  }, [lead.id, lead.next_action_at, lead.estimated_value_ars, lead.lost_reason])

  const wa = whatsappUrl(lead)
  return <div className="p-5 space-y-5">
    <div><div className="flex gap-2 items-center"><h2 className="text-base font-semibold text-zinc-100">{lead.name || 'Lead sin nombre'}</h2><Badge className={cn('text-[10px] border', STATUS[lead.status].className)}>{STATUS[lead.status].label}</Badge></div><p className="text-xs text-zinc-500 mt-1">{SOURCE_LABELS[lead.source] || lead.source} · {relativeDate(lead.created_at)}</p></div>
    <div className="flex flex-wrap gap-2">
      {lead.email && <a className="text-xs text-violet-400 hover:text-violet-300" href={`mailto:${lead.email}`}>{lead.email}</a>}
      {wa && <a className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-1 text-xs text-emerald-300 hover:bg-emerald-500/20" target="_blank" rel="noreferrer" href={wa}><MessageCircle className="w-3 h-3" />WhatsApp</a>}
    </div>
    {lead.message && <div className="rounded-lg border border-zinc-800 bg-zinc-950/40 p-3 text-sm text-zinc-300 whitespace-pre-wrap">{lead.message}</div>}
    <div className="space-y-2"><p className="text-xs uppercase tracking-wide text-zinc-500">Pipeline</p><div className="flex flex-wrap gap-1.5">{(Object.keys(STATUS) as LeadStatus[]).map((status) => <button key={status} disabled={saving || status === lead.status} onClick={() => onSave({ status })} className={cn('px-2 py-1 rounded-md border text-[11px] transition-colors disabled:opacity-100', status === lead.status ? STATUS[status].className : 'border-zinc-700 text-zinc-500 hover:text-zinc-200')}>{STATUS[status].label}</button>)}</div></div>
    <div className="grid grid-cols-2 gap-2"><div><label className="text-xs text-zinc-500">Próxima acción</label><Input type="datetime-local" value={nextAction} onChange={(event) => setNextAction(event.target.value)} className="mt-1 bg-zinc-950 border-zinc-700 text-xs" /></div><div><label className="text-xs text-zinc-500">Valor estimado (ARS)</label><Input inputMode="numeric" value={value} onChange={(event) => setValue(event.target.value)} className="mt-1 bg-zinc-950 border-zinc-700 text-xs" placeholder="0" /></div></div>
    {lead.status === 'lost' && <div><label className="text-xs text-zinc-500">Motivo de pérdida</label><Input value={lostReason} onChange={(event) => setLostReason(event.target.value)} className="mt-1 bg-zinc-950 border-zinc-700 text-xs" placeholder="Ej: presupuesto, timing…" /></div>}
    <div className="flex gap-2"><Button size="sm" disabled={saving} onClick={() => onSave({ next_action_at: nextAction ? new Date(nextAction).toISOString() : null, estimated_value_ars: value ? Number(value) : null, lost_reason: lostReason || null })}>Guardar seguimiento</Button><Button size="sm" variant="outline" disabled={saving} className="border-zinc-700" onClick={() => onSave({ last_contacted_at: new Date().toISOString(), status: lead.status === 'new' ? 'contacted' : lead.status })}>Marcar contacto</Button></div>
    <div className="border-t border-zinc-800 pt-4 space-y-2"><p className="text-xs uppercase tracking-wide text-zinc-500">Notas y actividad</p><div className="flex gap-2"><Input value={note} onChange={(event) => setNote(event.target.value)} className="bg-zinc-950 border-zinc-700 text-xs" placeholder="Agregar nota interna…" onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); onAddNote() } }} /><Button size="icon" variant="outline" disabled={saving || !note.trim()} className="border-zinc-700 shrink-0" onClick={onAddNote}><Plus className="w-4 h-4" /></Button></div>{loading ? <p className="text-xs text-zinc-600">Cargando actividad…</p> : <div className="space-y-2 max-h-56 overflow-y-auto pr-1">{activities.length === 0 ? <p className="text-xs text-zinc-600">Todavía no hay actividad.</p> : activities.map((activity) => <div key={activity.id} className="flex gap-2 text-xs"><CircleDot className="w-3.5 h-3.5 mt-0.5 text-violet-400 shrink-0" /><div><p className="text-zinc-300">{activityLabel(activity)}</p>{activity.body && <p className="text-zinc-500 mt-0.5 whitespace-pre-wrap">{activity.body}</p>}<p className="text-zinc-600 mt-0.5">{relativeDate(activity.created_at)}</p></div></div>)}</div>}</div>
  </div>
}
