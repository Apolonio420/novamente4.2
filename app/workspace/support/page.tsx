'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  LifeBuoy,
  Plus,
  Loader2,
  MessageSquare,
  Clock,
  ChevronRight,
  ChevronDown,
  ArrowUpRight,
  Send,
  X,
  CheckCircle2,
  XCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { authFetch } from '@/lib/partners/auth-fetch'
import { LockedFeature } from '@/components/partners/locked-feature'

// --- Types ---

interface Ticket {
  id: string
  tenant_id: string
  subject: string
  description: string
  status: 'open' | 'in_progress' | 'resolved' | 'closed'
  priority: 'normal' | 'priority'
  category: string
  created_at: string
  updated_at: string
  resolved_at: string | null
}

interface DashboardData {
  plan: string
  features: Record<string, boolean | number | string>
}

interface Toast {
  message: string
  type: 'success' | 'error'
}

// --- Constants ---

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  open: { label: 'Abierto', className: 'bg-yellow-500/20 border-yellow-500/30 text-yellow-300' },
  in_progress: { label: 'En progreso', className: 'bg-blue-500/20 border-blue-500/30 text-blue-300' },
  resolved: { label: 'Resuelto', className: 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300' },
  closed: { label: 'Cerrado', className: 'bg-zinc-500/20 border-zinc-500/30 text-zinc-400' },
}

const PRIORITY_CONFIG: Record<string, { label: string; className: string }> = {
  normal: { label: 'Normal', className: 'bg-zinc-500/20 border-zinc-500/30 text-zinc-400' },
  priority: { label: 'Prioritario', className: 'bg-purple-500/20 border-purple-500/30 text-purple-300' },
}

const CATEGORY_OPTIONS = [
  { value: 'general', label: 'General' },
  { value: 'billing', label: 'Facturacion' },
  { value: 'technical', label: 'Tecnico' },
  { value: 'feature_request', label: 'Solicitud de funcion' },
]

const CATEGORY_LABELS: Record<string, string> = {
  general: 'General',
  billing: 'Facturacion',
  technical: 'Tecnico',
  feature_request: 'Solicitud',
}

const FILTER_TABS = [
  { value: 'all', label: 'Todos' },
  { value: 'open', label: 'Abiertos' },
  { value: 'in_progress', label: 'En progreso' },
  { value: 'resolved', label: 'Resueltos' },
  { value: 'closed', label: 'Cerrados' },
]

// --- Helpers ---

function relativeDate(dateStr: string): string {
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const diffMs = now - then
  const diffMin = Math.floor(diffMs / 60000)
  const diffHour = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHour / 24)

  if (diffMin < 1) return 'ahora'
  if (diffMin < 60) return `hace ${diffMin}m`
  if (diffHour < 24) return `hace ${diffHour}h`
  if (diffDay === 1) return 'ayer'
  if (diffDay < 7) return `hace ${diffDay}d`
  return new Date(dateStr).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })
}

// --- Component ---

export default function SupportPage() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [plan, setPlan] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [showForm, setShowForm] = useState(false)
  const [creating, setCreating] = useState(false)
  const [toast, setToast] = useState<Toast | null>(null)

  // New ticket form
  const [subject, setSubject] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('general')

  const showToast = useCallback((message: string, type: 'success' | 'error') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3500)
  }, [])

  const fetchData = useCallback(async () => {
    try {
      const [dashRes, ticketsRes] = await Promise.all([
        authFetch('/api/partners/dashboard'),
        authFetch('/api/partners/support'),
      ])

      if (dashRes.ok) {
        const dashData: DashboardData = await dashRes.json()
        setPlan(dashData.plan)
      }

      if (ticketsRes.ok) {
        const ticketsData = await ticketsRes.json()
        setTickets(ticketsData.tickets || [])
      }
    } catch {
      showToast('Error al cargar datos', 'error')
    } finally {
      setLoading(false)
    }
  }, [showToast])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleCreate = async () => {
    if (!subject.trim() || !description.trim()) {
      showToast('Completa asunto y descripcion', 'error')
      return
    }

    setCreating(true)
    try {
      const res = await authFetch('/api/partners/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject: subject.trim(), description: description.trim(), category }),
      })

      if (!res.ok) throw new Error('Error')

      const data = await res.json()
      setTickets((prev) => [data.ticket, ...prev])
      setSubject('')
      setDescription('')
      setCategory('general')
      setShowForm(false)
      showToast('Ticket creado correctamente', 'success')
    } catch {
      showToast('Error al crear ticket', 'error')
    } finally {
      setCreating(false)
    }
  }

  const filteredTickets = filter === 'all'
    ? tickets
    : tickets.filter((t) => t.status === filter)

  // --- Loading skeleton ---
  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 p-4 sm:p-6">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded bg-zinc-800 animate-pulse" />
          <div className="h-7 w-40 rounded bg-zinc-800 animate-pulse" />
        </div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-5 space-y-3">
            <div className="h-5 w-2/3 rounded bg-zinc-800 animate-pulse" />
            <div className="h-4 w-1/3 rounded bg-zinc-800/50 animate-pulse" />
          </div>
        ))}
      </div>
    )
  }

  // --- Starter: locked state ---
  if (plan === 'starter') {
    return (
      <div className="max-w-4xl mx-auto p-4 sm:p-6">
        <div className="flex items-center gap-3 mb-8">
          <LifeBuoy className="h-6 w-6 text-zinc-400" />
          <h1 className="text-xl sm:text-2xl font-semibold text-zinc-100">Soporte</h1>
        </div>

        <div className="space-y-8">
          <LockedFeature
            title="Soporte por tickets"
            description="Crea tickets de soporte y recibilos resueltos por nuestro equipo. Seguimiento completo del estado de cada consulta."
            requiredPlan="growth"
            icon={LifeBuoy}
            features={[
              'Crea tickets de soporte ilimitados',
              'Seguimiento de estado en tiempo real',
              'Historial completo de consultas',
              'Soporte WhatsApp prioritario (plan Pro)',
            ]}
          />

          {/* FAQ section accessible to ALL plans */}
          <div>
            <h2 className="text-lg font-semibold text-zinc-100 mb-4">Preguntas frecuentes</h2>
            <div className="space-y-3">
              {[
                {
                  q: 'Como personalizo mi storefront?',
                  a: 'Anda a la seccion Branding en el menu lateral. Ahi podes cambiar logo, colores, tipografia y textos de tu tienda.',
                },
                {
                  q: 'Como agrego productos a mi catalogo?',
                  a: 'En la seccion Catalogo podes agregar productos con nombre, precio, imagenes y variantes. Los productos aparecen automaticamente en tu storefront.',
                },
                {
                  q: 'Como recibo pagos?',
                  a: 'Los pagos se procesan a traves de MercadoPago. Los clientes pagan directamente en tu storefront y vos recibis el dinero en tu cuenta.',
                },
                {
                  q: 'Puedo usar mi propio dominio?',
                  a: 'Actualmente tu storefront esta disponible en novamente.ar/merch/tu-slug. Dominios personalizados estan disponibles en planes Growth y Pro.',
                },
                {
                  q: 'Como funciona el Design Engine?',
                  a: 'El Design Engine usa inteligencia artificial para generar disenos para tus productos. Accede desde la seccion Studio en el menu lateral.',
                },
              ].map(({ q, a }) => (
                <details key={q} className="group rounded-xl border border-zinc-800 bg-zinc-900/60">
                  <summary className="flex items-center justify-between p-4 cursor-pointer text-sm font-medium text-zinc-200 hover:text-zinc-100">
                    {q}
                    <ChevronDown className="w-4 h-4 text-zinc-500 group-open:rotate-180 transition-transform" />
                  </summary>
                  <div className="px-4 pb-4 text-sm text-zinc-400">{a}</div>
                </details>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // --- Growth+ support view ---
  return (
    <div className="max-w-4xl mx-auto space-y-6 p-4 sm:p-6">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 flex items-center gap-2 rounded-lg border px-4 py-3 text-sm shadow-lg transition-all ${
            toast.type === 'success'
              ? 'border-emerald-500/30 bg-emerald-950/90 text-emerald-300'
              : 'border-red-500/30 bg-red-950/90 text-red-300'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4 shrink-0" />
          ) : (
            <XCircle className="h-4 w-4 shrink-0" />
          )}
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <LifeBuoy className="h-6 w-6 text-zinc-400" />
          <h1 className="text-xl sm:text-2xl font-semibold text-zinc-100">Soporte</h1>
        </div>
        <Button
          onClick={() => setShowForm(!showForm)}
          className="gap-2 bg-purple-600 hover:bg-purple-700 text-white"
        >
          {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {showForm ? 'Cancelar' : 'Nuevo ticket'}
        </Button>
      </div>

      {/* Pro: WhatsApp priority card */}
      {plan === 'pro' && (
        <Card className="bg-gradient-to-r from-purple-950/40 to-zinc-900/60 border-purple-500/30">
          <CardContent className="flex items-center justify-between py-4 px-5">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-green-500/20 p-2">
                <MessageSquare className="h-5 w-5 text-green-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-zinc-100">Soporte prioritario por WhatsApp</p>
                <p className="text-xs text-zinc-400">Como partner Pro, tenes atencion directa y prioritaria.</p>
              </div>
            </div>
            <a
              href="https://wa.me/message/DRWR3O2HZY2JG1"
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0"
            >
              <Button
                variant="outline"
                size="sm"
                className="gap-2 border-green-500/40 text-green-400 hover:bg-green-950/40 hover:text-green-300"
              >
                <ArrowUpRight className="h-3.5 w-3.5" />
                Abrir WhatsApp
              </Button>
            </a>
          </CardContent>
        </Card>
      )}

      {/* New ticket form */}
      {showForm && (
        <Card className="bg-zinc-900/60 border-zinc-800">
          <CardContent className="p-5 space-y-4">
            <h3 className="text-base font-medium text-zinc-100">Nuevo ticket</h3>

            <div className="space-y-2">
              <Label htmlFor="subject" className="text-zinc-300">Asunto</Label>
              <Input
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Describe brevemente tu consulta"
                maxLength={120}
                className="bg-zinc-950 border-zinc-700 text-zinc-100 placeholder:text-zinc-500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category" className="text-zinc-300">Categoria</Label>
              <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="flex h-10 w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                {CATEGORY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-zinc-300">Descripcion</Label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Explica tu problema o consulta con detalle..."
                rows={4}
                className="flex w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
              />
            </div>

            <div className="flex justify-end">
              <Button
                onClick={handleCreate}
                disabled={creating || !subject.trim() || !description.trim()}
                className="gap-2 bg-purple-600 hover:bg-purple-700 text-white"
              >
                {creating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                Enviar ticket
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filter tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setFilter(tab.value)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
              filter === tab.value
                ? 'bg-purple-600/30 text-purple-300 border border-purple-500/40'
                : 'bg-zinc-800/50 text-zinc-400 border border-zinc-700/50 hover:bg-zinc-800 hover:text-zinc-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Ticket list */}
      {filteredTickets.length === 0 ? (
        <Card className="bg-zinc-900/60 border-zinc-800">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <MessageSquare className="h-10 w-10 text-zinc-600 mb-3" />
            <p className="text-sm text-zinc-400">
              {filter === 'all'
                ? 'No tenes tickets de soporte. Crea uno nuevo si necesitas ayuda.'
                : `No hay tickets con estado "${FILTER_TABS.find((t) => t.value === filter)?.label}".`}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredTickets.map((ticket) => (
            <a
              key={ticket.id}
              href={`/workspace/support/${ticket.id}`}
              className="block"
            >
              <Card className="bg-zinc-900/60 border-zinc-800 hover:border-zinc-700 transition-colors cursor-pointer">
                <CardContent className="p-4 sm:p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="text-sm font-medium text-zinc-100 truncate">
                          {ticket.subject}
                        </h3>
                        <Badge className={STATUS_CONFIG[ticket.status]?.className || ''}>
                          {STATUS_CONFIG[ticket.status]?.label || ticket.status}
                        </Badge>
                        {ticket.priority === 'priority' && (
                          <Badge className={PRIORITY_CONFIG.priority.className}>
                            {PRIORITY_CONFIG.priority.label}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-zinc-500">
                        <span className="capitalize">
                          {CATEGORY_LABELS[ticket.category] || ticket.category}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {relativeDate(ticket.created_at)}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-zinc-600 shrink-0 mt-0.5" />
                  </div>
                </CardContent>
              </Card>
            </a>
          ))}
        </div>
      )}
    </div>
  )
}
