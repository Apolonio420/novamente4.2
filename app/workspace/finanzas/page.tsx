"use client"

import { useEffect, useState } from "react"
import { authFetch } from "@/lib/partners/auth-fetch"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Wallet, ArrowDownToLine, TrendingUp, Clock, CheckCircle2, XCircle, AlertTriangle } from "lucide-react"

interface LedgerEntry {
  id: string
  type: 'credit' | 'debit'
  amount: number
  concept: string
  status: string
  source: string
  created_at: string
}

interface Payout {
  id: string
  amount: number
  status: 'requested' | 'paid' | 'rejected'
  method: string | null
  requested_at: string
  resolved_at: string | null
}

interface FinanzasData {
  balance: { available: number; pendingReview: number }
  minPayout: number
  entries: LedgerEntry[]
  payouts: Payout[]
  bankAlias: string | null
  bankCbu: string | null
}

const fmt = (n: number) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 }).format(n)

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })

const PAYOUT_BADGE: Record<Payout['status'], { label: string; cls: string }> = {
  requested: { label: 'Pendiente', cls: 'bg-amber-500/15 text-amber-600 border-amber-500/30' },
  paid: { label: 'Pagado', cls: 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30' },
  rejected: { label: 'Rechazado', cls: 'bg-red-500/15 text-red-600 border-red-500/30' },
}

export default function FinanzasPage() {
  const [data, setData] = useState<FinanzasData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [requesting, setRequesting] = useState(false)
  const [amount, setAmount] = useState('')
  const [method, setMethod] = useState('')
  const [okMsg, setOkMsg] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    try {
      const res = await authFetch('/api/partners/finanzas')
      if (!res.ok) throw new Error((await res.json()).error || 'Error')
      const d = await res.json()
      setData(d)
      if (!method && (d.bankAlias || d.bankCbu)) setMethod(d.bankAlias || d.bankCbu)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const requestPayout = async () => {
    if (!data) return
    setRequesting(true)
    setError(null)
    setOkMsg(null)
    try {
      const res = await authFetch('/api/partners/finanzas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: Number(amount), method }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error || 'Error al solicitar el retiro')
      setOkMsg('Retiro solicitado. Te lo transferimos dentro de las próximas 48h hábiles.')
      setAmount('')
      await load()
    } catch (e: any) {
      setError(e.message)
    } finally {
      setRequesting(false)
    }
  }

  if (loading && !data) {
    return <div className="p-8 text-muted-foreground">Cargando finanzas…</div>
  }

  return (
    <div className="p-4 md:p-8 max-w-4xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Wallet className="h-6 w-6" /> Finanzas
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Tu margen por cada venta se acredita acá automáticamente cuando el pago se confirma.
        </p>
      </div>

      {/* Balance hero */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="rounded-2xl border bg-gradient-to-br from-emerald-500/10 to-transparent p-6">
          <p className="text-sm text-muted-foreground flex items-center gap-1.5">
            <TrendingUp className="h-4 w-4" /> Saldo disponible
          </p>
          <p className="text-4xl font-bold mt-2 text-emerald-600">{fmt(data?.balance.available ?? 0)}</p>
        </div>
        {(data?.balance.pendingReview ?? 0) > 0 && (
          <div className="rounded-2xl border bg-amber-500/5 p-6">
            <p className="text-sm text-muted-foreground flex items-center gap-1.5">
              <AlertTriangle className="h-4 w-4" /> En revisión
            </p>
            <p className="text-2xl font-bold mt-2 text-amber-600">{fmt(data?.balance.pendingReview ?? 0)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Ventas con margen a confirmar por el equipo. Se liberan en 24-48h.
            </p>
          </div>
        )}
      </div>

      {/* Solicitar retiro */}
      <div className="rounded-2xl border p-6 space-y-4">
        <h2 className="font-semibold flex items-center gap-2">
          <ArrowDownToLine className="h-4 w-4" /> Solicitar retiro
        </h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="amount">Monto (mín. {fmt(data?.minPayout ?? 20000)})</Label>
            <Input
              id="amount"
              type="number"
              inputMode="numeric"
              placeholder="50000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="method">Alias o CBU destino</Label>
            <Input
              id="method"
              placeholder="tu.alias.mp"
              value={method}
              onChange={(e) => setMethod(e.target.value)}
            />
          </div>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        {okMsg && <p className="text-sm text-emerald-600">{okMsg}</p>}
        <Button
          onClick={requestPayout}
          disabled={requesting || !amount || Number(amount) <= 0}
        >
          {requesting ? 'Solicitando…' : 'Solicitar retiro'}
        </Button>
      </div>

      {/* Retiros */}
      {(data?.payouts.length ?? 0) > 0 && (
        <div className="space-y-3">
          <h2 className="font-semibold">Retiros</h2>
          {data!.payouts.map((p) => (
            <div key={p.id} className="flex items-center justify-between rounded-xl border px-4 py-3">
              <div className="flex items-center gap-3">
                {p.status === 'paid' ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                ) : p.status === 'rejected' ? (
                  <XCircle className="h-4 w-4 text-red-500" />
                ) : (
                  <Clock className="h-4 w-4 text-amber-500" />
                )}
                <div>
                  <p className="text-sm font-medium">{fmt(p.amount)}</p>
                  <p className="text-xs text-muted-foreground">
                    {p.method ? `→ ${p.method} · ` : ''}{fmtDate(p.requested_at)}
                  </p>
                </div>
              </div>
              <Badge variant="outline" className={PAYOUT_BADGE[p.status].cls}>
                {PAYOUT_BADGE[p.status].label}
              </Badge>
            </div>
          ))}
        </div>
      )}

      {/* Movimientos */}
      <div className="space-y-3">
        <h2 className="font-semibold">Movimientos</h2>
        {(data?.entries.length ?? 0) === 0 ? (
          <div className="rounded-xl border border-dashed p-8 text-center text-muted-foreground">
            <p className="font-medium">Todavía no hay movimientos</p>
            <p className="text-sm mt-1">
              Cuando alguien compre en tu tienda y el pago se confirme, tu margen aparece acá.
            </p>
          </div>
        ) : (
          data!.entries.map((e) => (
            <div key={e.id} className="flex items-center justify-between rounded-xl border px-4 py-3">
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{e.concept}</p>
                <p className="text-xs text-muted-foreground">
                  {fmtDate(e.created_at)}
                  {e.status === 'needs_review' && (
                    <span className="text-amber-600 ml-1.5">· en revisión</span>
                  )}
                </p>
              </div>
              <p className={`text-sm font-bold shrink-0 ml-3 ${e.type === 'credit' ? 'text-emerald-600' : 'text-red-500'}`}>
                {e.type === 'credit' ? '+' : '−'}{fmt(e.amount)}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
