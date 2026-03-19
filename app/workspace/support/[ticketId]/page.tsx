'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Loader2,
  Send,
  CheckCircle2,
  XCircle,
  Clock,
  LifeBuoy,
  User,
  Shield,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { authFetch } from '@/lib/partners/auth-fetch'

// --- Types ---

interface Message {
  id: string
  ticket_id: string
  sender_type: 'partner' | 'admin'
  sender_name: string
  message: string
  created_at: string
}

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
  messages: Message[]
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

const CATEGORY_LABELS: Record<string, string> = {
  general: 'General',
  billing: 'Facturacion',
  technical: 'Tecnico',
  feature_request: 'Solicitud de funcion',
}

// --- Helpers ---

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('es-AR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// --- Component ---

export default function TicketDetailPage() {
  const params = useParams()
  const router = useRouter()
  const ticketId = params.ticketId as string

  const [ticket, setTicket] = useState<Ticket | null>(null)
  const [loading, setLoading] = useState(true)
  const [reply, setReply] = useState('')
  const [sending, setSending] = useState(false)
  const [resolving, setResolving] = useState(false)
  const [toast, setToast] = useState<Toast | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)

  const showToast = useCallback((message: string, type: 'success' | 'error') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3500)
  }, [])

  const fetchTicket = useCallback(async () => {
    try {
      const res = await authFetch(`/api/partners/support/${ticketId}`)
      if (!res.ok) throw new Error('Not found')
      const data = await res.json()
      setTicket(data.ticket)
    } catch {
      showToast('Error al cargar el ticket', 'error')
    } finally {
      setLoading(false)
    }
  }, [ticketId, showToast])

  useEffect(() => {
    fetchTicket()
  }, [fetchTicket])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [ticket?.messages])

  const handleSendReply = async () => {
    if (!reply.trim() || !ticket) return

    setSending(true)
    try {
      const res = await authFetch(`/api/partners/support/${ticketId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: reply.trim() }),
      })

      if (!res.ok) throw new Error('Error')

      const data = await res.json()
      setTicket((prev) =>
        prev ? { ...prev, messages: [...prev.messages, data.message] } : prev
      )
      setReply('')
    } catch {
      showToast('Error al enviar mensaje', 'error')
    } finally {
      setSending(false)
    }
  }

  const handleResolve = async () => {
    if (!ticket) return

    setResolving(true)
    try {
      const res = await authFetch(`/api/partners/support/${ticketId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'resolved' }),
      })

      if (!res.ok) throw new Error('Error')

      const data = await res.json()
      setTicket((prev) => (prev ? { ...prev, ...data.ticket } : prev))
      showToast('Ticket marcado como resuelto', 'success')
    } catch {
      showToast('Error al actualizar el ticket', 'error')
    } finally {
      setResolving(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendReply()
    }
  }

  // --- Loading ---
  if (loading) {
    return (
      <div className="max-w-3xl mx-auto space-y-6 p-4 sm:p-6">
        <div className="h-6 w-32 rounded bg-zinc-800 animate-pulse" />
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-6 space-y-4">
          <div className="h-6 w-2/3 rounded bg-zinc-800 animate-pulse" />
          <div className="h-4 w-1/3 rounded bg-zinc-800/50 animate-pulse" />
          <div className="h-20 w-full rounded bg-zinc-800/30 animate-pulse" />
        </div>
        {[1, 2].map((i) => (
          <div key={i} className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-4 space-y-2">
            <div className="h-4 w-1/4 rounded bg-zinc-800 animate-pulse" />
            <div className="h-12 w-3/4 rounded bg-zinc-800/30 animate-pulse" />
          </div>
        ))}
      </div>
    )
  }

  if (!ticket) {
    return (
      <div className="max-w-3xl mx-auto p-4 sm:p-6">
        <button
          onClick={() => router.push('/workspace/support')}
          className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-zinc-200 transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a soporte
        </button>
        <div className="flex items-center gap-3 text-red-400">
          <XCircle className="h-5 w-5" />
          <span>Ticket no encontrado.</span>
        </div>
      </div>
    )
  }

  const isActive = ticket.status === 'open' || ticket.status === 'in_progress'

  return (
    <div className="max-w-3xl mx-auto space-y-6 p-4 sm:p-6">
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

      {/* Back link */}
      <button
        onClick={() => router.push('/workspace/support')}
        className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-zinc-200 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver a soporte
      </button>

      {/* Ticket header */}
      <Card className="bg-zinc-900/60 border-zinc-800">
        <CardContent className="p-5 space-y-4">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="space-y-1">
              <h1 className="text-lg font-semibold text-zinc-100">{ticket.subject}</h1>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge className={STATUS_CONFIG[ticket.status]?.className || ''}>
                  {STATUS_CONFIG[ticket.status]?.label || ticket.status}
                </Badge>
                <Badge className={PRIORITY_CONFIG[ticket.priority]?.className || ''}>
                  {PRIORITY_CONFIG[ticket.priority]?.label || ticket.priority}
                </Badge>
                <span className="text-xs text-zinc-500">
                  {CATEGORY_LABELS[ticket.category] || ticket.category}
                </span>
              </div>
            </div>
            {isActive && (
              <Button
                onClick={handleResolve}
                disabled={resolving}
                variant="outline"
                size="sm"
                className="gap-1.5 border-emerald-500/40 text-emerald-400 hover:bg-emerald-950/40 hover:text-emerald-300 shrink-0"
              >
                {resolving ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-3.5 w-3.5" />
                )}
                Marcar como resuelto
              </Button>
            )}
          </div>

          <div className="flex items-center gap-4 text-xs text-zinc-500">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Creado {formatDate(ticket.created_at)}
            </span>
            {ticket.resolved_at && (
              <span className="flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                Resuelto {formatDate(ticket.resolved_at)}
              </span>
            )}
          </div>

          <div className="rounded-lg bg-zinc-950 border border-zinc-800 p-4">
            <p className="text-sm text-zinc-300 whitespace-pre-wrap">{ticket.description}</p>
          </div>
        </CardContent>
      </Card>

      {/* Message thread */}
      {ticket.messages.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-zinc-400 flex items-center gap-2">
            <LifeBuoy className="h-4 w-4" />
            Conversacion ({ticket.messages.length})
          </h2>

          {ticket.messages.map((msg) => {
            const isPartner = msg.sender_type === 'partner'
            return (
              <div
                key={msg.id}
                className={`flex ${isPartner ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] sm:max-w-[75%] rounded-lg p-3.5 ${
                    isPartner
                      ? 'bg-purple-950/40 border border-purple-500/20'
                      : 'bg-zinc-800/60 border border-zinc-700/50'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    {isPartner ? (
                      <User className="h-3.5 w-3.5 text-purple-400" />
                    ) : (
                      <Shield className="h-3.5 w-3.5 text-blue-400" />
                    )}
                    <span
                      className={`text-xs font-medium ${
                        isPartner ? 'text-purple-300' : 'text-blue-300'
                      }`}
                    >
                      {msg.sender_name}
                    </span>
                    <span className="text-xs text-zinc-600">
                      {formatDate(msg.created_at)}
                    </span>
                  </div>
                  <p className="text-sm text-zinc-200 whitespace-pre-wrap">
                    {msg.message}
                  </p>
                </div>
              </div>
            )
          })}
          <div ref={messagesEndRef} />
        </div>
      )}

      {/* Reply box */}
      {isActive && (
        <Card className="bg-zinc-900/60 border-zinc-800">
          <CardContent className="p-4">
            <div className="flex gap-3">
              <textarea
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Escribe tu respuesta..."
                rows={3}
                className="flex-1 rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
              />
              <Button
                onClick={handleSendReply}
                disabled={sending || !reply.trim()}
                className="self-end gap-2 bg-purple-600 hover:bg-purple-700 text-white"
              >
                {sending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                <span className="hidden sm:inline">Enviar</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Closed/resolved notice */}
      {!isActive && (
        <div className="text-center py-4">
          <p className="text-xs text-zinc-500">
            Este ticket esta {ticket.status === 'resolved' ? 'resuelto' : 'cerrado'}.
            Si necesitas mas ayuda, crea un nuevo ticket.
          </p>
        </div>
      )}
    </div>
  )
}
