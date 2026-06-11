"use client"

import { useEffect, useState } from "react"
import { authFetch } from "@/lib/partners/auth-fetch"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Star, CheckCircle2, XCircle, MessageSquareText } from "lucide-react"

interface Review {
  id: string
  product_id: string
  product_name: string
  customer_name: string
  rating: number
  title: string | null
  body: string | null
  verified_purchase: boolean
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
}

const STATUS_BADGE: Record<Review['status'], { label: string; cls: string }> = {
  pending: { label: 'Pendiente', cls: 'bg-amber-500/15 text-amber-600 border-amber-500/30' },
  approved: { label: 'Publicada', cls: 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30' },
  rejected: { label: 'Rechazada', cls: 'bg-red-500/15 text-red-600 border-red-500/30' },
}

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'pending' | 'all'>('pending')

  const load = async () => {
    setLoading(true)
    try {
      const res = await authFetch('/api/partners/reviews')
      const d = await res.json()
      setReviews(d.reviews || [])
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { load() }, [])

  const moderate = async (id: string, status: 'approved' | 'rejected') => {
    setReviews((rs) => rs.map((r) => (r.id === id ? { ...r, status } : r)))
    await authFetch('/api/partners/reviews', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    })
  }

  const visible = filter === 'pending' ? reviews.filter((r) => r.status === 'pending') : reviews
  const pendingCount = reviews.filter((r) => r.status === 'pending').length

  return (
    <div className="p-4 md:p-8 max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <MessageSquareText className="h-6 w-6" /> Reseñas
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Las reseñas aprobadas se publican en la página del producto de tu tienda.
        </p>
      </div>

      <div className="flex gap-2">
        <Button variant={filter === 'pending' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('pending')}>
          Pendientes {pendingCount > 0 && `(${pendingCount})`}
        </Button>
        <Button variant={filter === 'all' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('all')}>
          Todas
        </Button>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Cargando…</p>
      ) : visible.length === 0 ? (
        <div className="rounded-xl border border-dashed p-10 text-center text-muted-foreground">
          <p className="font-medium">{filter === 'pending' ? 'No hay reseñas pendientes' : 'Todavía no hay reseñas'}</p>
          <p className="text-sm mt-1">Cuando un cliente deje una opinión en tu tienda, aparece acá para que la apruebes.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {visible.map((r) => (
            <div key={r.id} className="rounded-xl border p-4">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <Star key={i} className={`h-3.5 w-3.5 ${i <= r.rating ? 'fill-amber-400 text-amber-400' : 'text-zinc-300'}`} />
                      ))}
                    </div>
                    <span className="text-sm font-medium">{r.customer_name}</span>
                    {r.verified_purchase && (
                      <span className="text-[11px] text-emerald-600 inline-flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" /> compra verificada
                      </span>
                    )}
                    <Badge variant="outline" className={STATUS_BADGE[r.status].cls}>{STATUS_BADGE[r.status].label}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {r.product_name} · {new Date(r.created_at).toLocaleDateString('es-AR')}
                  </p>
                  {r.title && <p className="text-sm font-semibold mt-2">{r.title}</p>}
                  {r.body && <p className="text-sm text-muted-foreground mt-1">{r.body}</p>}
                </div>
                {r.status === 'pending' && (
                  <div className="flex gap-2 shrink-0">
                    <Button size="sm" onClick={() => moderate(r.id, 'approved')}>
                      <CheckCircle2 className="h-4 w-4 mr-1" /> Aprobar
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => moderate(r.id, 'rejected')}>
                      <XCircle className="h-4 w-4 mr-1" /> Rechazar
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
