"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { authFetch } from "@/lib/partners/auth-fetch"
import { Badge } from "@/components/ui/badge"
import { Wallet, TrendingUp, CheckCircle2, AlertTriangle, ShoppingBag, Landmark, ExternalLink } from "lucide-react"
import { PAYOUT_BADGE, type PayoutDisplayStatus } from '@/lib/partners/finance-ui'
import type { PartnerSale, PartnerSaleEstado } from '@/lib/partners/partner-sales'

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
  status: PayoutDisplayStatus
  method: string | null
  requested_at: string
  resolved_at: string | null
  reference: string | null
  paid_at: string | null
}

interface FinanzasData {
  balance: { available: number; pendingReview: number; paid: number }
  sales: PartnerSale[]
  entries: LedgerEntry[]
  payouts: Payout[]
  bankAlias: string | null
  bankCbu: string | null
}

const fmt = (n: number) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n)

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })

const fmtDay = (iso: string) =>
  new Date(iso).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'America/Argentina/Buenos_Aires' })

const ESTADO_VENTA: Record<PartnerSaleEstado, { label: string; cls: string }> = {
  a_cobrar: { label: 'A cobrar', cls: 'border-emerald-500/40 text-emerald-700 bg-emerald-500/10' },
  parcial: { label: 'Cobrada en parte', cls: 'border-amber-500/40 text-amber-700 bg-amber-500/10' },
  pagado: { label: 'Cobrada', cls: 'border-slate-400/40 text-slate-600 bg-slate-500/10' },
  en_revision: { label: 'En revisión', cls: 'border-amber-500/40 text-amber-700 bg-amber-500/10' },
  reembolsada: { label: 'Reembolsada', cls: 'border-red-500/40 text-red-600 bg-red-500/10' },
}

export default function FinanzasPage() {
  const [data, setData] = useState<FinanzasData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    try {
      const res = await authFetch('/api/partners/finanzas')
      if (!res.ok) throw new Error((await res.json()).error || 'Error')
      setData(await res.json())
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  if (loading && !data) {
    return <div className="p-8 text-muted-foreground">Cargando finanzas…</div>
  }

  const banco = data?.bankAlias ? `alias ${data.bankAlias}` : data?.bankCbu ? `CBU ${data.bankCbu}` : null
  const sales = data?.sales ?? []
  const paidPayouts = (data?.payouts ?? []).filter((p) => p.status === 'paid')

  return (
    <div className="p-4 md:p-8 max-w-4xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Wallet className="h-6 w-6" /> Finanzas
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Cuando alguien compra en tu tienda y el pago se confirma, tu ganancia se acredita acá: el precio de venta menos tu costo.
          Novamente te transfiere lo que tengas a cobrar <b>una vez por semana, sin mínimo</b>.
        </p>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {/* Saldo */}
      <div className="grid sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border bg-gradient-to-br from-emerald-500/10 to-transparent p-6">
          <p className="text-sm text-muted-foreground flex items-center gap-1.5">
            <TrendingUp className="h-4 w-4" /> A cobrar
          </p>
          <p className={`text-3xl font-bold mt-2 ${(data?.balance.available ?? 0) < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
            {fmt(data?.balance.available ?? 0)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">Te lo transferimos en el próximo pago semanal.</p>
        </div>
        <div className="rounded-2xl border p-6">
          <p className="text-sm text-muted-foreground flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4" /> Cobrado
          </p>
          <p className="text-3xl font-bold mt-2">{fmt(data?.balance.paid ?? 0)}</p>
        </div>
        {(data?.balance.pendingReview ?? 0) > 0 ? (
          <div className="rounded-2xl border bg-amber-500/5 p-6">
            <p className="text-sm text-muted-foreground flex items-center gap-1.5">
              <AlertTriangle className="h-4 w-4" /> En revisión
            </p>
            <p className="text-3xl font-bold mt-2 text-amber-600">{fmt(data?.balance.pendingReview ?? 0)}</p>
            <p className="text-xs text-muted-foreground mt-1">Ventas cuyo cálculo estamos validando. Se suman a “A cobrar” cuando se confirman.</p>
          </div>
        ) : (
          <div className="rounded-2xl border p-6">
            <p className="text-sm text-muted-foreground flex items-center gap-1.5">
              <ShoppingBag className="h-4 w-4" /> Ventas web
            </p>
            <p className="text-3xl font-bold mt-2">{sales.length}</p>
          </div>
        )}
      </div>

      {(data?.balance.available ?? 0) < 0 && (
        <p className="text-sm text-red-600">
          Tu saldo quedó negativo por un reembolso de una venta que ya te habíamos pagado. Se compensa con tus próximas ventas.
        </p>
      )}

      {/* Datos bancarios */}
      <div className={`rounded-2xl border p-5 flex items-start gap-3 ${banco ? '' : 'border-red-500/40 bg-red-500/5'}`}>
        <Landmark className={`h-5 w-5 mt-0.5 ${banco ? 'text-muted-foreground' : 'text-red-600'}`} />
        <div className="text-sm">
          {banco ? (
            <>
              <p>Te transferimos a: <b>{banco}</b></p>
              <p className="text-muted-foreground text-xs mt-1">
                ¿Cambió? Actualizalo en <Link href="/workspace/settings" className="underline">Configuración</Link>.
              </p>
            </>
          ) : (
            <>
              <p className="font-semibold text-red-600">Cargá tu alias o CBU para poder cobrar</p>
              <p className="text-muted-foreground text-xs mt-1">
                Sin datos bancarios no podemos transferirte. Cargalos en <Link href="/workspace/settings" className="underline">Configuración</Link>.
              </p>
            </>
          )}
        </div>
      </div>

      {/* Ventas */}
      <div className="space-y-3">
        <div className="flex items-baseline justify-between gap-3 flex-wrap">
          <h2 className="font-semibold">Ventas en tu tienda</h2>
          <a href="/b2b-precios-2026" target="_blank" rel="noreferrer" className="text-xs underline inline-flex items-center gap-1 text-muted-foreground">
            Lista de precios B2B (tu costo) <ExternalLink className="h-3 w-3" />
          </a>
        </div>
        {sales.length === 0 ? (
          <div className="rounded-xl border border-dashed p-8 text-center text-muted-foreground">
            <p className="font-medium">Todavía no hay ventas web</p>
            <p className="text-sm mt-1">Cuando alguien compre en tu tienda y el pago se confirme, la venta aparece acá con tu ganancia.</p>
          </div>
        ) : (
          sales.map((s) => (
            <div key={s.id} className="rounded-xl border p-4 space-y-3">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <p className="text-sm font-semibold">Pedido {s.orderNumber || '—'}</p>
                  <p className="text-xs text-muted-foreground">{fmtDay(s.fecha)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={ESTADO_VENTA[s.estado].cls}>{ESTADO_VENTA[s.estado].label}</Badge>
                  <p className="text-lg font-bold text-emerald-600">{fmt(s.ganancia)}</p>
                </div>
              </div>
              <div className="divide-y rounded-lg border bg-muted/20">
                {s.lineas.map((l, i) => (
                  <div key={i} className="px-3 py-2 text-sm grid gap-1 sm:grid-cols-[1fr_auto] sm:items-center">
                    <div className="min-w-0">
                      <p className="font-medium truncate">{l.qty}× {l.item}</p>
                      <p className="text-xs text-muted-foreground">
                        {[l.color, l.talle && `talle ${l.talle}`, l.doble_estampa ? 'frente y dorso' : 'una estampa'].filter(Boolean).join(' · ')}
                      </p>
                    </div>
                    <div className="text-xs sm:text-right space-y-0.5">
                      <p>Precio de venta: <b>{fmt(l.unit)}</b></p>
                      <p className="text-muted-foreground">
                        Tu costo: {l.cost == null ? 'a confirmar' : (
                          <>
                            {fmt(l.costo_base ?? 0)}
                            {l.recargo_doble ? <> + {fmt(l.recargo_doble)} doble estampa = {fmt(l.cost)}</> : null}
                          </>
                        )}
                      </p>
                      {l.descuento > 0 && <p className="text-muted-foreground">Descuento de tu código: −{fmt(l.descuento)}</p>}
                      <p>Tu ganancia: <b className="text-emerald-600">{l.ganancia == null ? '—' : fmt(l.ganancia)}</b></p>
                    </div>
                  </div>
                ))}
              </div>
              {s.estado === 'parcial' && (
                <p className="text-xs text-muted-foreground">Cobraste {fmt(s.pagado)} de {fmt(s.ganancia)}; el resto va en el próximo pago.</p>
              )}
              {s.estado === 'en_revision' && (
                <p className="text-xs text-amber-700">Estamos revisando el cálculo de esta venta; te confirmamos el monto acá.</p>
              )}
            </div>
          ))
        )}
        {sales.some((s) => s.lineas.some((l) => l.doble_estampa)) && (
          <p className="text-xs text-muted-foreground">
            Doble estampa: las prendas estampadas en frente y dorso (o nuca) suman un recargo al costo, sin importar el tamaño de cada estampa.
          </p>
        )}
      </div>

      {/* Pagos recibidos */}
      {paidPayouts.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-semibold">Pagos recibidos</h2>
          {paidPayouts.map((p) => (
            <div key={p.id} className="flex items-center justify-between rounded-xl border px-4 py-3">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <div>
                  <p className="text-sm font-medium">{fmt(p.amount)}</p>
                  <p className="text-xs text-muted-foreground">
                    {fmtDay(p.paid_at || p.resolved_at || p.requested_at)}
                    {p.reference ? ` · op. ${p.reference}` : ''}
                  </p>
                </div>
              </div>
              <Badge variant="outline" className={PAYOUT_BADGE[p.status].cls}>{PAYOUT_BADGE[p.status].label}</Badge>
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
          </div>
        ) : (
          data!.entries.map((e) => (
            <div key={e.id} className="flex items-center justify-between rounded-xl border px-4 py-3">
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{e.concept}</p>
                <p className="text-xs text-muted-foreground">
                  {fmtDate(e.created_at)}
                  {e.status === 'needs_review' && <span className="text-amber-600 ml-1.5">· en revisión</span>}
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
