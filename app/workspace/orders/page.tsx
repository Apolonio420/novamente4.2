'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Package,
  Loader2,
  Inbox,
  X,
  Mail,
  Phone,
  User,
  Calendar,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Truck,
  Factory,
  Clock,
  StickyNote,
  ShoppingBag,
  Plus,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { authFetch } from '@/lib/partners/auth-fetch'
import LoadOrderModal from './components/LoadOrderModal'

// --- Types ---

interface OrderItem {
  product_id?: string
  name: string
  variant?: string
  quantity: number
  unit_price: number
}

interface Order {
  id: string
  tenant_id: string
  customer_name: string | null
  customer_email: string | null
  customer_phone: string | null
  items: OrderItem[]
  total: number | null
  currency: string
  status: OrderStatus
  payment_id: string | null
  payment_status: PaymentStatus
  shipping_info: Record<string, unknown>
  notes: string | null
  created_at: string
  updated_at: string
}

type OrderStatus = 'pending' | 'confirmed' | 'producing' | 'shipped' | 'delivered' | 'cancelled'
type PaymentStatus = 'pending' | 'approved' | 'rejected' | 'refunded'

// --- Constants ---

const STATUS_CONFIG: Record<OrderStatus, { label: string; bg: string; icon: React.ElementType }> = {
  pending: {
    label: 'Pendiente',
    bg: 'bg-zinc-500/20 border-zinc-500/30 text-zinc-300',
    icon: Clock,
  },
  confirmed: {
    label: 'Confirmado',
    bg: 'bg-blue-500/20 border-blue-500/30 text-blue-300',
    icon: CheckCircle2,
  },
  producing: {
    label: 'En produccion',
    bg: 'bg-amber-500/20 border-amber-500/30 text-amber-300',
    icon: Factory,
  },
  shipped: {
    label: 'Enviado',
    bg: 'bg-purple-500/20 border-purple-500/30 text-purple-300',
    icon: Truck,
  },
  delivered: {
    label: 'Entregado',
    bg: 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300',
    icon: CheckCircle2,
  },
  cancelled: {
    label: 'Cancelado',
    bg: 'bg-red-500/20 border-red-500/30 text-red-300',
    icon: XCircle,
  },
}

const PAYMENT_CONFIG: Record<PaymentStatus, { label: string; bg: string }> = {
  pending: { label: 'Pendiente', bg: 'bg-zinc-500/20 border-zinc-500/30 text-zinc-300' },
  approved: { label: 'Aprobado', bg: 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300' },
  rejected: { label: 'Rechazado', bg: 'bg-red-500/20 border-red-500/30 text-red-300' },
  refunded: { label: 'Reembolsado', bg: 'bg-amber-500/20 border-amber-500/30 text-amber-300' },
}

const STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['producing', 'cancelled'],
  producing: ['shipped'],
  shipped: ['delivered'],
  delivered: [],
  cancelled: [],
}

const FILTER_TABS: { value: string; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'pending', label: 'Pendiente' },
  { value: 'confirmed', label: 'Confirmado' },
  { value: 'producing', label: 'En produccion' },
  { value: 'shipped', label: 'Enviado' },
  { value: 'delivered', label: 'Entregado' },
  { value: 'cancelled', label: 'Cancelado' },
]

// --- Helpers ---

function formatCurrency(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: currency || 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  } catch {
    return `$${amount.toLocaleString('es-AR')}`
  }
}

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

function formatFullDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('es-AR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// --- Toast ---

function useToast() {
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const show = useCallback((message: string, type: 'success' | 'error') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }, [])

  const ToastUI = toast ? (
    <div
      className={cn(
        'fixed bottom-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg border text-sm font-medium',
        'animate-in slide-in-from-bottom-4 fade-in duration-300',
        toast.type === 'success'
          ? 'bg-emerald-950/90 border-emerald-800 text-emerald-200'
          : 'bg-red-950/90 border-red-800 text-red-200',
      )}
    >
      {toast.message}
    </div>
  ) : null

  return { show, ToastUI }
}

// --- Skeletons ---

function TableRowSkeleton() {
  return (
    <tr className="border-b border-zinc-800/50 animate-pulse">
      <td className="px-4 py-3.5"><div className="h-4 bg-zinc-800 rounded w-28" /></td>
      <td className="px-4 py-3.5"><div className="h-4 bg-zinc-800 rounded w-12" /></td>
      <td className="px-4 py-3.5"><div className="h-4 bg-zinc-800 rounded w-20" /></td>
      <td className="px-4 py-3.5"><div className="h-5 bg-zinc-800 rounded-full w-20" /></td>
      <td className="px-4 py-3.5"><div className="h-4 bg-zinc-800 rounded w-16" /></td>
    </tr>
  )
}

function CardSkeleton() {
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

// --- Detail Panel ---

function OrderDetail({
  order,
  onClose,
  onStatusChange,
  onNotesChange,
  isUpdating,
}: {
  order: Order
  onClose: () => void
  onStatusChange: (orderId: string, newStatus: OrderStatus) => void
  onNotesChange: (orderId: string, notes: string) => void
  isUpdating: boolean
}) {
  const statusCfg = STATUS_CONFIG[order.status]
  const paymentCfg = PAYMENT_CONFIG[order.payment_status] || PAYMENT_CONFIG.pending
  const transitions = STATUS_TRANSITIONS[order.status]
  const displayName = order.customer_name || order.customer_email || order.customer_phone || 'Cliente anonimo'
  const [editingNotes, setEditingNotes] = useState(false)
  const [notesValue, setNotesValue] = useState(order.notes || '')

  useEffect(() => {
    setNotesValue(order.notes || '')
    setEditingNotes(false)
  }, [order.id, order.notes])

  const handleSaveNotes = () => {
    onNotesChange(order.id, notesValue)
    setEditingNotes(false)
  }

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[420px] bg-zinc-950 border-l border-zinc-800 shadow-2xl overflow-y-auto animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-zinc-950/95 backdrop-blur-sm border-b border-zinc-800 px-5 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-zinc-100">Pedido</h2>
            <p className="text-xs text-zinc-500 mt-0.5 font-mono">#{order.id.slice(0, 8)}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-zinc-800 transition-colors text-zinc-400 hover:text-zinc-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-6">
          {/* Customer info */}
          <div className="space-y-3">
            <h3 className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Cliente</h3>
            <div className="bg-zinc-900/60 border border-zinc-800 rounded-lg p-4 space-y-2.5">
              <div className="flex items-center gap-2.5">
                <User className="w-4 h-4 text-zinc-500 shrink-0" />
                <span className="text-sm text-zinc-200">{displayName}</span>
              </div>
              {order.customer_email && (
                <a
                  href={`mailto:${order.customer_email}`}
                  className="flex items-center gap-2.5 text-sm text-violet-400 hover:text-violet-300 transition-colors"
                >
                  <Mail className="w-4 h-4 shrink-0" />
                  {order.customer_email}
                </a>
              )}
              {order.customer_phone && (
                <a
                  href={`tel:${order.customer_phone}`}
                  className="flex items-center gap-2.5 text-sm text-violet-400 hover:text-violet-300 transition-colors"
                >
                  <Phone className="w-4 h-4 shrink-0" />
                  {order.customer_phone}
                </a>
              )}
            </div>
          </div>

          {/* Items */}
          <div className="space-y-3">
            <h3 className="text-xs font-medium text-zinc-500 uppercase tracking-wide">
              Items ({order.items.length})
            </h3>
            <div className="bg-zinc-900/60 border border-zinc-800 rounded-lg divide-y divide-zinc-800/50">
              {order.items.map((item, idx) => (
                <div key={idx} className="px-4 py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm text-zinc-200 truncate">{item.name}</p>
                    {item.variant && (
                      <p className="text-xs text-zinc-500 mt-0.5">{item.variant}</p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm text-zinc-200">
                      {item.quantity} x {formatCurrency(item.unit_price, order.currency)}
                    </p>
                    <p className="text-xs text-zinc-400">
                      {formatCurrency(item.quantity * item.unit_price, order.currency)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Total */}
            {order.total != null && (
              <div className="flex items-center justify-between px-1">
                <span className="text-sm font-medium text-zinc-400">Total</span>
                <span className="text-lg font-bold text-zinc-100">
                  {formatCurrency(order.total, order.currency)}
                </span>
              </div>
            )}
          </div>

          {/* Status */}
          <div className="space-y-3">
            <h3 className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Estado</h3>
            <div className="flex items-center gap-2">
              <Badge className={cn('text-xs border', statusCfg.bg)}>
                {statusCfg.label}
              </Badge>
            </div>

            {transitions.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {transitions.map((nextStatus) => {
                  const nextCfg = STATUS_CONFIG[nextStatus]
                  const NextIcon = nextCfg.icon
                  return (
                    <button
                      key={nextStatus}
                      disabled={isUpdating}
                      onClick={() => onStatusChange(order.id, nextStatus)}
                      className={cn(
                        'flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border transition-all',
                        'border-zinc-700 text-zinc-300 hover:border-zinc-600 hover:bg-zinc-800/60',
                        'disabled:opacity-50 disabled:cursor-not-allowed',
                      )}
                    >
                      {isUpdating ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <NextIcon className="w-3.5 h-3.5" />
                      )}
                      Mover a {nextCfg.label.toLowerCase()}
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* Payment */}
          <div className="space-y-3">
            <h3 className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Pago</h3>
            <div className="flex items-center gap-3">
              <Badge className={cn('text-xs border', paymentCfg.bg)}>
                {paymentCfg.label}
              </Badge>
              {order.payment_id && (
                <span className="text-xs text-zinc-500 font-mono">
                  ID: {order.payment_id}
                </span>
              )}
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Notas</h3>
              {!editingNotes && (
                <button
                  onClick={() => setEditingNotes(true)}
                  className="text-xs text-violet-400 hover:text-violet-300 transition-colors"
                >
                  {order.notes ? 'Editar' : 'Agregar nota'}
                </button>
              )}
            </div>

            {editingNotes ? (
              <div className="space-y-2">
                <textarea
                  value={notesValue}
                  onChange={(e) => setNotesValue(e.target.value)}
                  className="w-full bg-zinc-900/60 border border-zinc-700 rounded-lg p-3 text-sm text-zinc-200 placeholder-zinc-600 resize-none focus:outline-none focus:ring-1 focus:ring-violet-500/50 focus:border-violet-500/50"
                  rows={3}
                  placeholder="Escribi una nota..."
                  autoFocus
                />
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={() => {
                      setNotesValue(order.notes || '')
                      setEditingNotes(false)
                    }}
                    className="px-3 py-1.5 rounded-md text-xs text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSaveNotes}
                    disabled={isUpdating}
                    className="px-3 py-1.5 rounded-md text-xs font-medium bg-violet-600 hover:bg-violet-500 text-white transition-colors disabled:opacity-50"
                  >
                    {isUpdating ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      'Guardar'
                    )}
                  </button>
                </div>
              </div>
            ) : order.notes ? (
              <div className="bg-zinc-900/60 border border-zinc-800 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <StickyNote className="w-3.5 h-3.5 text-zinc-500 mt-0.5 shrink-0" />
                  <p className="text-sm text-zinc-300 whitespace-pre-wrap">{order.notes}</p>
                </div>
              </div>
            ) : (
              <p className="text-xs text-zinc-600">Sin notas</p>
            )}
          </div>

          {/* Dates */}
          <div className="space-y-3">
            <h3 className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Fechas</h3>
            <div className="bg-zinc-900/60 border border-zinc-800 rounded-lg p-4 space-y-2.5">
              <div className="flex items-center gap-2.5 text-sm">
                <Calendar className="w-4 h-4 text-zinc-500 shrink-0" />
                <span className="text-zinc-500">Creado:</span>
                <span className="text-zinc-300">{formatFullDate(order.created_at)}</span>
              </div>
              <div className="flex items-center gap-2.5 text-sm">
                <Calendar className="w-4 h-4 text-zinc-500 shrink-0" />
                <span className="text-zinc-500">Actualizado:</span>
                <span className="text-zinc-300">{formatFullDate(order.updated_at)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

// --- Main Page ---

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [showLoad, setShowLoad] = useState(false)
  const { show: showToast, ToastUI } = useToast()

  const fetchOrders = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (filter !== 'all') params.set('status', filter)
      params.set('limit', '50')
      params.set('offset', '0')

      const res = await authFetch(`/api/partners/orders?${params.toString()}`)
      if (!res.ok) return

      const data = await res.json()
      setOrders(data.orders || [])
      setTotal(data.total || 0)
    } catch {
      // Silent fail — keep stale data
    }
  }, [filter])

  useEffect(() => {
    setLoading(true)
    fetchOrders().finally(() => setLoading(false))
  }, [fetchOrders])

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchOrders()
    }, 30_000)
    return () => clearInterval(interval)
  }, [fetchOrders])

  // Close detail panel on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedOrderId(null)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    setUpdatingId(orderId)
    try {
      const res = await authFetch(`/api/partners/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      if (res.ok) {
        const data = await res.json()
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, ...data.order } : o)),
        )
        if (filter !== 'all' && newStatus !== filter) {
          setOrders((prev) => prev.filter((o) => o.status === filter))
        }
        showToast(`Pedido movido a "${STATUS_CONFIG[newStatus].label}"`, 'success')
      } else {
        const data = await res.json().catch(() => ({}))
        showToast(data.error || 'Error al actualizar el pedido', 'error')
      }
    } catch {
      showToast('Error de conexion', 'error')
    } finally {
      setUpdatingId(null)
    }
  }

  const handleNotesChange = async (orderId: string, notes: string) => {
    setUpdatingId(orderId)
    try {
      const res = await authFetch(`/api/partners/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes }),
      })

      if (res.ok) {
        const data = await res.json()
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, ...data.order } : o)),
        )
        showToast('Notas actualizadas', 'success')
      } else {
        showToast('Error al guardar notas', 'error')
      }
    } catch {
      showToast('Error de conexion', 'error')
    } finally {
      setUpdatingId(null)
    }
  }

  const selectedOrder = orders.find((o) => o.id === selectedOrderId) || null

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-zinc-100">Pedidos</h1>
            {!loading && (
              <Badge className="bg-zinc-800 border-zinc-700 text-zinc-300 text-xs">
                {total}
              </Badge>
            )}
          </div>
          <button
            onClick={() => setShowLoad(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-violet-600 hover:bg-violet-500 text-white transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Cargar venta
          </button>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => {
                setFilter(tab.value)
                setSelectedOrderId(null)
              }}
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

      {/* Orders list */}
      <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl overflow-hidden">
        {loading ? (
          <>
            {/* Desktop skeleton */}
            <table className="w-full hidden md:table">
              <thead>
                <tr className="border-b border-zinc-800">
                  <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500">Cliente</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500">Items</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500">Total</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500">Estado</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500">Fecha</th>
                </tr>
              </thead>
              <tbody>
                <TableRowSkeleton />
                <TableRowSkeleton />
                <TableRowSkeleton />
                <TableRowSkeleton />
                <TableRowSkeleton />
              </tbody>
            </table>
            {/* Mobile skeleton */}
            <div className="md:hidden">
              <CardSkeleton />
              <CardSkeleton />
              <CardSkeleton />
              <CardSkeleton />
              <CardSkeleton />
            </div>
          </>
        ) : orders.length === 0 ? (
          /* Empty state */
          filter !== 'all' ? (
            <div className="py-16 px-6 flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center mb-4">
                <Inbox className="w-6 h-6 text-zinc-500" />
              </div>
              <h3 className="text-sm font-semibold text-zinc-200 mb-1">Sin pedidos</h3>
              <p className="text-xs text-zinc-500 max-w-xs">
                {`No hay pedidos con estado "${FILTER_TABS.find((t) => t.value === filter)?.label}".`}
              </p>
            </div>
          ) : (
            <div className="py-12 px-6 flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-2xl bg-zinc-800/80 flex items-center justify-center mb-5">
                <ShoppingBag className="w-8 h-8 text-zinc-400" />
              </div>
              <h3 className="text-lg font-semibold text-zinc-100 mb-2">
                Pedidos de tu storefront
              </h3>
              <p className="text-sm text-zinc-400 max-w-sm mb-5">
                Cuando un cliente compra productos en tu storefront, los pedidos aparecen aca. Tambien podes cargar a mano las ventas que tuviste por fuera: pega el texto del pedido y la IA lo interpreta.
              </p>
              <button
                onClick={() => setShowLoad(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-semibold bg-violet-600 hover:bg-violet-500 text-white transition-colors mb-8"
              >
                <Plus className="w-4 h-4" />
                Cargar venta
              </button>

              {/* Order cycle */}
              <div className="w-full max-w-md text-left">
                <h4 className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-3">
                  Ciclo del pedido
                </h4>
                <div className="space-y-0">
                  {[
                    { icon: Clock, label: 'Pendiente', desc: 'El cliente realizo el pago', color: 'text-zinc-400', bg: 'bg-zinc-800/60' },
                    { icon: CheckCircle2, label: 'Confirmado', desc: 'Confirmaste el pedido', color: 'text-blue-400', bg: 'bg-blue-500/10' },
                    { icon: Factory, label: 'En produccion', desc: 'El producto se esta fabricando', color: 'text-amber-400', bg: 'bg-amber-500/10' },
                    { icon: Truck, label: 'Enviado', desc: 'El pedido fue despachado', color: 'text-purple-400', bg: 'bg-purple-500/10' },
                    { icon: Package, label: 'Entregado', desc: 'El cliente recibio su pedido', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
                  ].map((step, idx, arr) => {
                    const StepIcon = step.icon
                    return (
                      <div key={step.label} className="flex items-start gap-3">
                        <div className="flex flex-col items-center">
                          <div className={`w-8 h-8 rounded-lg ${step.bg} flex items-center justify-center shrink-0`}>
                            <StepIcon className={`w-4 h-4 ${step.color}`} />
                          </div>
                          {idx < arr.length - 1 && (
                            <div className="w-px h-5 bg-zinc-800 my-1" />
                          )}
                        </div>
                        <div className="pt-1 pb-1 min-w-0">
                          <span className="text-sm font-medium text-zinc-200">{step.label}</span>
                          <span className="text-zinc-600 mx-1.5">—</span>
                          <span className="text-sm text-zinc-500">{step.desc}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )
        ) : (
          <>
            {/* Desktop table */}
            <table className="w-full hidden md:table">
              <thead>
                <tr className="border-b border-zinc-800">
                  <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500">Cliente</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500">Items</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500">Total</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500">Estado</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500">Fecha</th>
                  <th className="px-4 py-3 w-8" />
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => {
                  const cfg = STATUS_CONFIG[order.status]
                  const customerDisplay = order.customer_name || order.customer_email || order.customer_phone || 'Anonimo'
                  return (
                    <tr
                      key={order.id}
                      onClick={() => setSelectedOrderId(order.id)}
                      className={cn(
                        'border-b border-zinc-800/50 cursor-pointer transition-colors',
                        selectedOrderId === order.id
                          ? 'bg-zinc-800/40'
                          : 'hover:bg-zinc-900/60',
                      )}
                    >
                      <td className="px-4 py-3.5">
                        <div className="min-w-0">
                          <p className="text-sm text-zinc-200 truncate max-w-[200px]">{customerDisplay}</p>
                          {order.customer_email && order.customer_name && (
                            <p className="text-xs text-zinc-500 truncate max-w-[200px]">{order.customer_email}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="text-sm text-zinc-300">
                          {order.items.length} {order.items.length === 1 ? 'item' : 'items'}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="text-sm font-medium text-zinc-200">
                          {order.total != null
                            ? formatCurrency(order.total, order.currency)
                            : '-'}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <Badge className={cn('text-[10px] border', cfg.bg)}>
                          {cfg.label}
                        </Badge>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="text-sm text-zinc-400">
                          {relativeDate(order.created_at)}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <ChevronRight className="w-4 h-4 text-zinc-600" />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>

            {/* Mobile card list */}
            <div className="md:hidden">
              {orders.map((order) => {
                const cfg = STATUS_CONFIG[order.status]
                const customerDisplay = order.customer_name || order.customer_email || order.customer_phone || 'Anonimo'
                const initial = customerDisplay.charAt(0).toUpperCase()
                return (
                  <button
                    key={order.id}
                    onClick={() => setSelectedOrderId(order.id)}
                    className={cn(
                      'w-full px-4 py-3.5 flex items-center gap-3 text-left border-b border-zinc-800/50 transition-colors',
                      selectedOrderId === order.id
                        ? 'bg-zinc-800/40'
                        : 'hover:bg-zinc-900/30',
                    )}
                  >
                    {/* Avatar */}
                    <div className="w-9 h-9 rounded-full bg-zinc-800 flex items-center justify-center text-sm font-semibold text-zinc-300 shrink-0">
                      {initial}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-zinc-100 truncate">
                          {customerDisplay}
                        </span>
                        <span className="text-xs text-zinc-500 shrink-0">
                          {relativeDate(order.created_at)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-zinc-400">
                          {order.items.length} {order.items.length === 1 ? 'item' : 'items'}
                        </span>
                        {order.total != null && (
                          <>
                            <span className="text-xs text-zinc-600">·</span>
                            <span className="text-xs font-medium text-zinc-300">
                              {formatCurrency(order.total, order.currency)}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Badge + arrow */}
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge className={cn('text-[10px] border', cfg.bg)}>
                        {cfg.label}
                      </Badge>
                      <ChevronRight className="w-4 h-4 text-zinc-600" />
                    </div>
                  </button>
                )
              })}
            </div>
          </>
        )}
      </div>

      {/* Detail panel */}
      {selectedOrder && (
        <OrderDetail
          order={selectedOrder}
          onClose={() => setSelectedOrderId(null)}
          onStatusChange={handleStatusChange}
          onNotesChange={handleNotesChange}
          isUpdating={updatingId === selectedOrder.id}
        />
      )}

      {/* Cargar venta (manual + IA) */}
      <LoadOrderModal
        open={showLoad}
        onClose={() => setShowLoad(false)}
        onCreated={() => {
          setShowLoad(false)
          showToast('Venta cargada', 'success')
          fetchOrders()
        }}
      />

      {/* Toast */}
      {ToastUI}
    </div>
  )
}
