'use client'

import { useEffect, useState, useCallback } from 'react'
import { BarChart3, TrendingUp, Users, Target, Download, Lock, ArrowUpRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { authFetch } from '@/lib/partners/auth-fetch'
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AnalyticsData {
  period: string
  visits: {
    total: number
    unique: number
    byDay: { date: string; total: number; unique: number }[]
  }
  conversion: { visits: number; leads: number; rate: number }
  topProducts: { productSlug: string; name: string; views: number }[]
  trafficSources: { source: string; count: number; percentage: number }[]
  funnel: { stage: string; count: number; dropoff: number }[] | null
  utmCampaigns: { campaign: string; source: string; medium: string; visits: number; leads: number; conversion: number }[] | null
}

const PERIOD_OPTIONS = [
  { label: '7 dias', value: '7d' },
  { label: '30 dias', value: '30d' },
  { label: '90 dias', value: '90d' },
]

const DONUT_COLORS = ['#8b5cf6', '#ec4899', '#06b6d4', '#f59e0b', '#10b981']

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [period, setPeriod] = useState('7d')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [plan, setPlan] = useState<string>('starter')

  const fetchData = useCallback(async (p: string) => {
    setLoading(true)
    setError(null)
    try {
      const res = await authFetch(`/api/partners/analytics?period=${p}`)
      if (res.status === 403) {
        const json = await res.json()
        setError(json.error)
        return
      }
      if (!res.ok) throw new Error('Error al cargar analytics')
      const json = await res.json()
      setData(json)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error')
    } finally {
      setLoading(false)
    }
  }, [])

  // Fetch plan info
  useEffect(() => {
    authFetch('/api/partners/dashboard').then(r => r.json()).then(d => {
      if (d.tenant?.plan) setPlan(d.tenant.plan)
    }).catch(() => {})
  }, [])

  useEffect(() => {
    fetchData(period)
  }, [period, fetchData])

  const handleExport = async () => {
    const res = await authFetch(`/api/partners/analytics/export?period=${period}`)
    if (!res.ok) return
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `analytics-${period}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  // Starter: show locked state
  if (error && plan === 'starter') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="w-16 h-16 rounded-2xl bg-purple-500/10 flex items-center justify-center mb-6">
          <Lock className="w-8 h-8 text-purple-400" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Analytics no disponible</h2>
        <p className="text-zinc-400 max-w-md mb-6">
          Actualiza a Growth para ver metricas de tu storefront: visitas, leads, productos populares y mas.
        </p>
        <Button className="bg-purple-600 hover:bg-purple-500" onClick={() => window.location.href = '/workspace/billing'}>
          Actualizar plan
        </Button>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Analytics</h1>
          <p className="text-zinc-400 text-sm mt-1">Rendimiento de tu storefront</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Period selector */}
          <div className="flex bg-zinc-900 rounded-lg p-1 border border-zinc-800">
            {PERIOD_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => setPeriod(opt.value)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  period === opt.value
                    ? 'bg-purple-600 text-white'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          {/* CSV Export (Pro only) */}
          {plan === 'pro' && (
            <Button size="sm" variant="outline" onClick={handleExport} className="border-zinc-700 text-zinc-300">
              <Download className="w-4 h-4 mr-1.5" />
              CSV
            </Button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard icon={Users} label="Visitas" value={data.visits.total} color="blue" />
        <MetricCard icon={Users} label="Unicos" value={data.visits.unique} color="emerald" />
        <MetricCard icon={Target} label="Leads" value={data.conversion.leads} color="amber" />
        <MetricCard icon={TrendingUp} label="Conversion" value={`${data.conversion.rate}%`} color="purple" />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Visits over time */}
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-zinc-300">Visitas por dia</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={data.visits.byDay}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#71717a' }} tickFormatter={d => d.slice(5)} />
                <YAxis tick={{ fontSize: 11, fill: '#71717a' }} />
                <Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: 8 }} />
                <Line type="monotone" dataKey="total" stroke="#8b5cf6" strokeWidth={2} dot={false} name="Total" />
                <Line type="monotone" dataKey="unique" stroke="#06b6d4" strokeWidth={2} dot={false} name="Unicos" />
                <Legend />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Traffic sources donut */}
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-zinc-300">Fuentes de trafico</CardTitle>
          </CardHeader>
          <CardContent>
            {data.trafficSources.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={data.trafficSources}
                    dataKey="count"
                    nameKey="source"
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={3}
                  >
                    {data.trafficSources.map((_, i) => (
                      <Cell key={i} fill={DONUT_COLORS[i % DONUT_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: 8 }} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-zinc-500 text-sm">
                Sin datos de trafico aun
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Products */}
      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-zinc-300">Productos mas vistos</CardTitle>
        </CardHeader>
        <CardContent>
          {data.topProducts.length > 0 ? (
            <ResponsiveContainer width="100%" height={Math.max(200, data.topProducts.length * 40)}>
              <BarChart data={data.topProducts} layout="vertical" margin={{ left: 100 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#71717a' }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: '#a1a1aa' }} width={90} />
                <Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: 8 }} />
                <Bar dataKey="views" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-zinc-500 text-sm">
              Sin datos de productos aun
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pro: Funnel */}
      {data.funnel ? (
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-zinc-300">Funnel de conversion</CardTitle>
            <Badge className="bg-purple-500/10 text-purple-400 border-purple-500/30 text-xs">Pro</Badge>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.funnel.map((step, i) => {
                const maxCount = data.funnel![0].count || 1
                const pct = Math.max(5, (step.count / maxCount) * 100)
                return (
                  <div key={step.stage}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-zinc-300">{step.stage}</span>
                      <span className="text-zinc-400">
                        {step.count}
                        {i > 0 && step.dropoff > 0 && (
                          <span className="text-red-400 ml-2 text-xs">-{step.dropoff}%</span>
                        )}
                      </span>
                    </div>
                    <div className="h-6 bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-purple-600 to-pink-500 rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      ) : plan !== 'pro' ? (
        <Card className="bg-zinc-900/50 border-zinc-800 relative overflow-hidden">
          <div className="absolute inset-0 bg-zinc-950/60 backdrop-blur-sm z-10 flex flex-col items-center justify-center">
            <Lock className="w-6 h-6 text-purple-400 mb-2" />
            <p className="text-sm text-zinc-300 font-medium">Funnel de conversion</p>
            <p className="text-xs text-zinc-500 mt-1">Disponible en plan Pro</p>
          </div>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-zinc-300">Funnel de conversion</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]" />
          </CardContent>
        </Card>
      ) : null}

      {/* Pro: UTM Campaigns */}
      {data.utmCampaigns && data.utmCampaigns.length > 0 && (
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-zinc-300">Campanas UTM</CardTitle>
            <Badge className="bg-purple-500/10 text-purple-400 border-purple-500/30 text-xs">Pro</Badge>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-800">
                    <th className="text-left py-2 text-zinc-500 font-medium">Campana</th>
                    <th className="text-left py-2 text-zinc-500 font-medium">Fuente</th>
                    <th className="text-right py-2 text-zinc-500 font-medium">Visitas</th>
                    <th className="text-right py-2 text-zinc-500 font-medium">Leads</th>
                    <th className="text-right py-2 text-zinc-500 font-medium">Conversion</th>
                  </tr>
                </thead>
                <tbody>
                  {data.utmCampaigns.map((c) => (
                    <tr key={c.campaign} className="border-b border-zinc-800/50">
                      <td className="py-2 text-zinc-200">{c.campaign}</td>
                      <td className="py-2 text-zinc-400">{c.source}/{c.medium}</td>
                      <td className="py-2 text-right text-zinc-300">{c.visits}</td>
                      <td className="py-2 text-right text-zinc-300">{c.leads}</td>
                      <td className="py-2 text-right text-purple-400">{c.conversion}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Components
// ---------------------------------------------------------------------------

function MetricCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ElementType
  label: string
  value: number | string
  color: 'blue' | 'emerald' | 'amber' | 'purple'
}) {
  const colorMap = {
    blue: 'from-blue-500/10 border-blue-500/15 text-blue-400',
    emerald: 'from-emerald-500/10 border-emerald-500/15 text-emerald-400',
    amber: 'from-amber-500/10 border-amber-500/15 text-amber-400',
    purple: 'from-purple-500/10 border-purple-500/15 text-purple-400',
  }

  return (
    <div className={`rounded-xl border p-4 bg-gradient-to-br ${colorMap[color]} via-zinc-900/60 to-zinc-900/60`}>
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`w-4 h-4 ${colorMap[color].split(' ').pop()}`} />
        <span className="text-xs text-zinc-500 font-medium uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-2xl font-bold text-zinc-100">{value}</p>
    </div>
  )
}
