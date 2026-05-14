"use client"

import { useEffect, useState } from "react"
import { authFetch } from "@/lib/partners/auth-fetch"
import { Card, CardContent } from "@/components/ui/card"
import { TrendingUp, TrendingDown, DollarSign, ShoppingBag, Award, Target } from "lucide-react"

interface KPIs {
  revenue30d: number
  revenuePrev30d: number
  revenueChangePct: number
  orders30d: number
  ordersPrev30d: number
  avgOrderValue: number
  topProduct: { name: string; units: number; revenue: number } | null
  leadsThisMonth: number
  conversionRate: number
  pendingOrders: number
  approvedOrders: number
  fulfilledOrders: number
  ordersByDay: Array<{ date: string; count: number; revenue: number }>
}

const fmt = (n: number) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", minimumFractionDigits: 0 }).format(n)

function Sparkline({ data }: { data: Array<{ date: string; revenue: number }> }) {
  const max = Math.max(1, ...data.map(d => d.revenue))
  const w = 280
  const h = 48
  const step = data.length > 1 ? w / (data.length - 1) : 0
  const points = data
    .map((d, i) => `${i * step},${h - (d.revenue / max) * h}`)
    .join(" ")
  return (
    <svg width={w} height={h} className="overflow-visible" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
      <polyline points={points} fill="none" stroke="currentColor" strokeWidth={1.5} className="text-violet-400" />
    </svg>
  )
}

export function KpiOverview() {
  const [kpis, setKpis] = useState<KPIs | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    authFetch("/api/partners/dashboard/kpis")
      .then(r => r.json())
      .then(data => !cancelled && setKpis(data?.kpis ?? null))
      .catch(() => {})
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [])

  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[0, 1, 2, 3].map(i => (
          <div key={i} className="h-24 bg-zinc-900 rounded-lg animate-pulse" />
        ))}
      </div>
    )
  }

  if (!kpis) return null

  const hasAnyActivity = kpis.revenue30d > 0 || kpis.orders30d > 0 || kpis.leadsThisMonth > 0
  if (!hasAnyActivity) return null

  const changeIsUp = kpis.revenueChangePct > 0
  const changeIsDown = kpis.revenueChangePct < 0

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold tracking-widest uppercase text-zinc-400">Performance · ultimos 30 dias</h2>
        <span className="text-[10px] text-zinc-600">Pedidos pagados + finalizados</span>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Revenue */}
        <Card className="border-zinc-800 bg-gradient-to-br from-violet-950/30 to-zinc-900/80">
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="w-9 h-9 rounded-lg bg-violet-500/15 flex items-center justify-center">
                <DollarSign className="w-4 h-4 text-violet-400" />
              </div>
              {kpis.revenuePrev30d > 0 && (
                <span
                  className={`text-[10px] inline-flex items-center gap-0.5 font-medium px-1.5 py-0.5 rounded ${
                    changeIsUp
                      ? "bg-emerald-500/15 text-emerald-400"
                      : changeIsDown
                      ? "bg-red-500/15 text-red-400"
                      : "bg-zinc-800 text-zinc-400"
                  }`}
                >
                  {changeIsUp ? <TrendingUp className="w-2.5 h-2.5" /> : changeIsDown ? <TrendingDown className="w-2.5 h-2.5" /> : null}
                  {Math.abs(kpis.revenueChangePct)}%
                </span>
              )}
            </div>
            <div className="text-2xl font-bold text-zinc-100 tracking-tight">{fmt(kpis.revenue30d)}</div>
            <p className="text-[11px] text-zinc-500 mt-0.5">Revenue 30d</p>
          </CardContent>
        </Card>

        {/* AOV */}
        <Card className="border-zinc-800 bg-zinc-900/60">
          <CardContent className="p-4">
            <div className="w-9 h-9 rounded-lg bg-amber-500/15 flex items-center justify-center mb-3">
              <ShoppingBag className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-bold text-zinc-100 tracking-tight">{fmt(kpis.avgOrderValue)}</div>
            <p className="text-[11px] text-zinc-500 mt-0.5">
              Ticket promedio · {kpis.orders30d} pedido{kpis.orders30d === 1 ? "" : "s"}
            </p>
          </CardContent>
        </Card>

        {/* Conversion */}
        <Card className="border-zinc-800 bg-zinc-900/60">
          <CardContent className="p-4">
            <div className="w-9 h-9 rounded-lg bg-cyan-500/15 flex items-center justify-center mb-3">
              <Target className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-2xl font-bold text-zinc-100 tracking-tight">{kpis.conversionRate}%</div>
            <p className="text-[11px] text-zinc-500 mt-0.5">
              Conversion · {kpis.leadsThisMonth} lead{kpis.leadsThisMonth === 1 ? "" : "s"} este mes
            </p>
          </CardContent>
        </Card>

        {/* Top product */}
        <Card className="border-zinc-800 bg-zinc-900/60">
          <CardContent className="p-4">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/15 flex items-center justify-center mb-3">
              <Award className="w-4 h-4 text-emerald-400" />
            </div>
            {kpis.topProduct ? (
              <>
                <div className="text-sm font-semibold text-zinc-100 leading-tight line-clamp-2">{kpis.topProduct.name}</div>
                <p className="text-[11px] text-zinc-500 mt-0.5">
                  {kpis.topProduct.units} unidades · {fmt(kpis.topProduct.revenue)}
                </p>
              </>
            ) : (
              <>
                <div className="text-sm font-semibold text-zinc-500">Sin datos</div>
                <p className="text-[11px] text-zinc-600 mt-0.5">Cuando tengas ventas, aparece el top product</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Sparkline + status breakdown */}
      {kpis.ordersByDay.length > 0 && (
        <Card className="border-zinc-800 bg-zinc-900/60">
          <CardContent className="p-4 flex items-center justify-between gap-4 flex-wrap">
            <div>
              <div className="text-xs text-zinc-500 mb-2">Revenue dia a dia (30d)</div>
              <Sparkline data={kpis.ordersByDay} />
            </div>
            <div className="flex gap-4 text-xs">
              <div>
                <div className="text-zinc-500">Pendientes</div>
                <div className="text-lg font-bold text-amber-400">{kpis.pendingOrders}</div>
              </div>
              <div>
                <div className="text-zinc-500">En producción</div>
                <div className="text-lg font-bold text-violet-400">{kpis.approvedOrders}</div>
              </div>
              <div>
                <div className="text-zinc-500">Entregadas</div>
                <div className="text-lg font-bold text-emerald-400">{kpis.fulfilledOrders}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </section>
  )
}
