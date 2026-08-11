'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import {
  Package,
  Users,
  ShoppingBag,
  TrendingUp,
  Palette,
  Plus,
  ExternalLink,
  CheckCircle2,
  Circle,
  AlertCircle,
  ChevronDown,
  Sparkles,
  Eye,
  Activity,
  Clock,
  Star,
  PartyPopper,
  Wand2,
  AlertTriangle,
  Rocket,
  HelpCircle,
  X,
  EyeOff,
  Copy,
  Check,
  Loader2,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { authFetch } from '@/lib/partners/auth-fetch'
import { KpiOverview } from '@/components/workspace/KpiOverview'
import { BusinessModelBanner } from '@/components/workspace/BusinessModelBanner'
import { QuickStartCard } from '@/components/workspace/QuickStartCard'
import { QuickDesignUpload } from '@/components/workspace/QuickDesignUpload'
import { DailyAttention } from '@/components/workspace/DailyAttention'
import { isPartnersCockpitEnabled } from '@/lib/partners/feature-flags'
import type { StorefrontHiddenReason } from '@/lib/partners/auto-publish'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface DashboardData {
  products: number
  publishedProducts: number
  storefrontHiddenReason: StorefrontHiddenReason | null
  leads: number
  orders: number
  score: number
  designs: number
  trends?: {
    products: number[]
    leads: number[]
    orders: number[]
    score: number[]
  }
  tenant: {
    id: string
    name: string
    slug: string
    logo_url: string | null
    banner_url: string | null
    plan: string
    status: string
    description: string | null
    tagline: string | null
    primary_color: string
    industry: string | null
    storefront_published: boolean
    onboarding_completed: boolean
    onboarding_dismissed_business_model: boolean
  }
}

interface ChecklistItem {
  label: string
  done: boolean
  href: string
}

interface ActivityEvent {
  icon: typeof Package
  label: string
  time: string
  color: string
}

// ---------------------------------------------------------------------------
// Mini Sparkline SVG
// ---------------------------------------------------------------------------

function Sparkline({
  data,
  color,
  className,
}: {
  data: number[]
  color: string
  className?: string
}) {
  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1
  const w = 80
  const h = 28
  const padding = 2

  const points = data
    .map((v, i) => {
      const x = padding + (i / (data.length - 1)) * (w - padding * 2)
      const y = h - padding - ((v - min) / range) * (h - padding * 2)
      return `${x},${y}`
    })
    .join(' ')

  // Area fill path
  const firstX = padding
  const lastX = padding + ((data.length - 1) / (data.length - 1)) * (w - padding * 2)
  const areaPath = `M${firstX},${h} L${points.split(' ').map((p, i) => {
    const [x, y] = p.split(',')
    return i === 0 ? `${x},${y}` : ` L${x},${y}`
  }).join('')} L${lastX},${h} Z`

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className={className}
      style={{ width: w, height: h }}
      fill="none"
    >
      <defs>
        <linearGradient id={`grad-${color}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#grad-${color})`} />
      <polyline
        points={points}
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  )
}

// ---------------------------------------------------------------------------
// Circular Progress Ring
// ---------------------------------------------------------------------------

function ProgressRing({
  pct,
  size = 72,
  strokeWidth = 5,
}: {
  pct: number
  size?: number
  strokeWidth?: number
}) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (pct / 100) * circumference

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(113,113,122,0.2)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="url(#ring-gradient)"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
        <defs>
          <linearGradient id="ring-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#a78bfa" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-sm font-bold text-zinc-100">{pct}%</span>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Loading skeleton
// ---------------------------------------------------------------------------

function SkeletonPulse({ className }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-zinc-800/60 rounded ${className ?? ''}`} />
  )
}

function DashboardSkeleton() {
  return (
    <div className="max-w-6xl mx-auto space-y-8 p-4 lg:p-0">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div>
          <SkeletonPulse className="h-9 w-72 mb-3" />
          <SkeletonPulse className="h-4 w-48" />
        </div>
        <SkeletonPulse className="h-10 w-32 rounded-lg" />
      </div>

      {/* Metric cards skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="rounded-xl border border-zinc-800/50 bg-zinc-900/40 p-5"
          >
            <div className="flex items-center justify-between mb-4">
              <SkeletonPulse className="w-10 h-10 rounded-xl" />
              <SkeletonPulse className="w-20 h-7" />
            </div>
            <SkeletonPulse className="h-3 w-20 mb-2" />
            <SkeletonPulse className="h-8 w-16" />
          </div>
        ))}
      </div>

      {/* Quick actions skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <SkeletonPulse key={i} className="h-20 rounded-xl" />
        ))}
      </div>

      {/* Bottom row skeleton */}
      <div className="grid lg:grid-cols-2 gap-6">
        <SkeletonPulse className="h-64 rounded-xl" />
        <SkeletonPulse className="h-64 rounded-xl" />
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const PLAN_BADGE_STYLES: Record<string, string> = {
  starter: 'bg-zinc-700/40 text-zinc-300 border-zinc-600/50',
  growth: 'bg-violet-600/20 text-violet-300 border-violet-500/30',
  pro: 'bg-amber-600/20 text-amber-300 border-amber-500/30',
}

function formatDate(): string {
  return new Date().toLocaleDateString('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function buildChecklist(data: DashboardData): ChecklistItem[] {
  const t = data.tenant
  return [
    {
      label: 'Subir logo de tu marca',
      done: !!t.logo_url,
      href: '/workspace/branding',
    },
    {
      label: 'Agregar banner o imagen hero',
      done: !!t.banner_url,
      href: '/workspace/branding',
    },
    {
      label: 'Escribir tagline de tu marca',
      done: !!t.tagline,
      href: '/workspace/branding',
    },
    {
      label: 'Agregar descripcion de tu marca',
      done: !!t.description,
      href: '/workspace/branding',
    },
    {
      label: 'Configurar colores de branding',
      done: !!t.primary_color && t.primary_color !== '#000000',
      href: '/workspace/branding',
    },
    {
      label: 'Cargar al menos un producto',
      done: data.products > 0,
      href: '/workspace/catalog',
    },
    {
      label: 'Cargar 3 o mas productos',
      done: data.products >= 3,
      href: '/workspace/catalog',
    },
    {
      label: 'Generar tu primer diseno con IA',
      done: data.designs > 0,
      href: '/workspace/design-engine',
    },
    {
      label: 'Elegir industria o categoria',
      done: !!t.industry,
      href: '/workspace/settings',
    },
    {
      label: 'Publicar tu storefront',
      done: t.storefront_published,
      href: '/workspace/settings',
    },
  ]
}

// Default sparkline data (shown while loading or if no real data yet)
const DEFAULT_SPARKLINE: number[] = [0, 0, 0, 0, 0, 0, 0]

const SPARKLINE_COLORS: Record<string, string> = {
  products: '#60a5fa',
  leads: '#34d399',
  orders: '#fbbf24',
  score: '#a78bfa',
}

const METRIC_GRADIENTS: Record<string, string> = {
  products:
    'bg-gradient-to-br from-blue-500/10 via-zinc-900/60 to-zinc-900/60 border-blue-500/15',
  leads:
    'bg-gradient-to-br from-emerald-500/10 via-zinc-900/60 to-zinc-900/60 border-emerald-500/15',
  orders:
    'bg-gradient-to-br from-amber-500/10 via-zinc-900/60 to-zinc-900/60 border-amber-500/15',
  score:
    'bg-gradient-to-br from-violet-500/10 via-zinc-900/60 to-zinc-900/60 border-violet-500/15',
}

function buildActivityFeed(data: DashboardData): ActivityEvent[] {
  const events: ActivityEvent[] = []

  if (data.products > 0) {
    events.push({
      icon: Package,
      label: `${data.products} producto${data.products !== 1 ? 's' : ''} en catalogo`,
      time: 'Recientemente',
      color: 'text-blue-400',
    })
  }
  if (data.leads > 0) {
    events.push({
      icon: Users,
      label: `${data.leads} lead${data.leads !== 1 ? 's' : ''} generado${data.leads !== 1 ? 's' : ''}`,
      time: 'Esta semana',
      color: 'text-emerald-400',
    })
  }
  if (data.orders > 0) {
    events.push({
      icon: ShoppingBag,
      label: `${data.orders} pedido${data.orders !== 1 ? 's' : ''} recibido${data.orders !== 1 ? 's' : ''}`,
      time: 'Este mes',
      color: 'text-amber-400',
    })
  }
  if (data.tenant.logo_url) {
    events.push({
      icon: Sparkles,
      label: 'Logo de marca configurado',
      time: 'Completado',
      color: 'text-violet-400',
    })
  }
  if (data.tenant.storefront_published) {
    events.push({
      icon: Eye,
      label: 'Storefront publicada y visible',
      time: 'Activo',
      color: 'text-cyan-400',
    })
  }

  return events.slice(0, 5)
}

// ---------------------------------------------------------------------------
// Usage Warning Bar (Starter plan)
// ---------------------------------------------------------------------------

const STARTER_MAX_PRODUCTS = 10
const STARTER_MAX_LEADS = 20

function UsageProgressBar({
  label,
  current,
  max,
}: {
  label: string
  current: number
  max: number
}) {
  const pct = Math.min((current / max) * 100, 100)
  const isWarning = pct >= 80 && pct < 100
  const isMaxed = pct >= 100

  const barColor = isMaxed
    ? 'bg-red-500'
    : isWarning
      ? 'bg-amber-500'
      : 'bg-violet-500'

  const textColor = isMaxed
    ? 'text-red-400'
    : isWarning
      ? 'text-amber-400'
      : 'text-zinc-400'

  return (
    <div className="flex-1 min-w-[200px]">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-medium text-zinc-300">{label}</span>
        <span className={`text-xs font-medium ${textColor}`}>
          {current}/{max}
        </span>
      </div>
      <div className="h-2 rounded-full bg-zinc-800 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${barColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

function UsageWarningBar({
  products,
  leads,
}: {
  products: number
  leads: number
}) {
  const productPct = (products / STARTER_MAX_PRODUCTS) * 100
  const leadPct = (leads / STARTER_MAX_LEADS) * 100
  const maxPct = Math.max(productPct, leadPct)

  const isWarning = maxPct >= 80 && maxPct < 100
  const isMaxed = maxPct >= 100

  // Only show the bar if at least at 50% usage
  if (maxPct < 50) return null

  const borderColor = isMaxed
    ? 'border-red-500/30'
    : isWarning
      ? 'border-amber-500/30'
      : 'border-zinc-800/50'

  const bgColor = isMaxed
    ? 'bg-red-500/5'
    : isWarning
      ? 'bg-amber-500/5'
      : 'bg-zinc-900/40'

  return (
    <div className={`rounded-xl border ${borderColor} ${bgColor} p-4`}>
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        {(isWarning || isMaxed) && (
          <div className="flex items-center gap-2 shrink-0">
            <AlertTriangle
              className={`w-4 h-4 ${isMaxed ? 'text-red-400' : 'text-amber-400'}`}
            />
            <span
              className={`text-xs font-medium ${isMaxed ? 'text-red-400' : 'text-amber-400'}`}
            >
              {isMaxed
                ? 'Limite alcanzado'
                : 'Cerca del limite'}
            </span>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          <UsageProgressBar
            label={`${products}/${STARTER_MAX_PRODUCTS} productos usados`}
            current={products}
            max={STARTER_MAX_PRODUCTS}
          />
          <UsageProgressBar
            label={`${leads}/${STARTER_MAX_LEADS} leads este mes`}
            current={leads}
            max={STARTER_MAX_LEADS}
          />
        </div>

        {isMaxed && (
          <Link
            href="/workspace/billing"
            className="shrink-0 inline-flex items-center gap-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-medium px-4 py-2 transition-colors shadow-lg shadow-violet-600/20"
          >
            Actualiza tu plan
          </Link>
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Storefront Visibility Banner — productos publicados pero tienda apagada.
//
// Publicar un producto NO publica la tienda (ver lib/partners/auto-publish.ts
// para la red de auto-publish del lado del servidor). Este banner cubre el
// resto de los casos: branding insuficiente para el auto-publish, o un
// partner que apago la tienda a proposito y despues siguio agregando
// productos. Caso real: Orlando completo onboarding + cargo branding +
// publico 2 productos y su /p/<slug> quedo en 404 un mes sin ningun aviso.
// ---------------------------------------------------------------------------

// Copy del banner por motivo. Nombra CONCRETAMENTE lo que falta — nunca un
// generico "completa tu perfil" — y nunca menciona "storefront_published" ni
// "flag": el que lee es un emprendedor, no un dev.
const HIDDEN_REASON_COPY: Record<
  Exclude<StorefrontHiddenReason, 'ready_not_published'>,
  { title: string; body: string }
> = {
  missing_logo: {
    title: 'Tu tienda todavía no se puede publicar',
    body: 'Para publicar tu tienda te falta cargar tu logo.',
  },
  missing_cover_or_description: {
    title: 'Tu tienda todavía no se puede publicar',
    body: 'Para publicar tu tienda te falta una portada, una frase de marca o una descripción.',
  },
  hidden_manually: {
    title: 'Tu tienda está oculta porque la ocultaste desde Configuración',
    body: 'Cuando quieras, la podés volver a publicar.',
  },
}

function StorefrontVisibilityBanner({
  slug,
  published,
  reason,
  onPublished,
}: {
  slug: string
  published: boolean
  reason: StorefrontHiddenReason | null
  onPublished: () => void
}) {
  const [publishing, setPublishing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const url = `www.novamente.ar/p/${slug}`

  const handlePublish = async () => {
    setPublishing(true)
    setError(null)
    try {
      const res = await authFetch('/api/partners/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storefront_published: true }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}) as { error?: string })
        throw new Error(err?.error || 'No se pudo publicar la tienda. Intentá de nuevo.')
      }
      onPublished()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al publicar la tienda.')
    } finally {
      setPublishing(false)
    }
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(`https://${url}`)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {}
  }

  // Tienda publicada: mostrar el link copiable (estado final tras publicar,
  // o el que corresponde si ya estaba publicada de antes).
  if (published) {
    return (
      <div className="relative rounded-xl border border-emerald-500/30 bg-gradient-to-r from-emerald-600/10 via-zinc-900/60 to-zinc-900/60 p-5">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-11 h-11 rounded-xl bg-emerald-500/20 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-zinc-100">
                Tu tienda ya está publicada y visible
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5 font-mono truncate">{url}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              onClick={handleCopy}
              variant="outline"
              className="border-zinc-700 text-zinc-200 hover:bg-zinc-800"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 mr-2 text-emerald-400" />
                  Copiado
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-2" />
                  Copiar link
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Falta branding minimo: mandamos a completar la marca, NO ofrecemos
  // "Publicar tienda" — publicarla incompleta la deja peor (auto-publish
  // tampoco se va a disparar solo hasta que esto se resuelva).
  if (reason === 'missing_logo' || reason === 'missing_cover_or_description') {
    const copy = HIDDEN_REASON_COPY[reason]
    return (
      <div className="relative rounded-xl border-2 border-amber-500/40 bg-gradient-to-r from-amber-600/10 via-orange-600/5 to-zinc-900/60 p-5 shadow-lg shadow-amber-950/10">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-11 h-11 rounded-xl bg-amber-500/20 flex items-center justify-center shrink-0">
              <EyeOff className="w-5 h-5 text-amber-400" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-zinc-100">{copy.title}</h3>
              <p className="text-xs text-zinc-400 mt-0.5">{copy.body}</p>
            </div>
          </div>
          <Button asChild className="shrink-0 bg-amber-600 hover:bg-amber-500 text-white border-0">
            <Link href="/workspace/branding">
              <Palette className="w-4 h-4 mr-2" />
              {reason === 'missing_logo' ? 'Cargar mi logo' : 'Completar mi marca'}
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  // La ocultaste vos: tono neutro, sin regañar — fue una decision a proposito.
  if (reason === 'hidden_manually') {
    const copy = HIDDEN_REASON_COPY.hidden_manually
    return (
      <div className="relative rounded-xl border border-zinc-700 bg-zinc-900/60 p-5">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-11 h-11 rounded-xl bg-zinc-800 flex items-center justify-center shrink-0">
              <EyeOff className="w-5 h-5 text-zinc-400" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-zinc-100">{copy.title}</h3>
              <p className="text-xs text-zinc-400 mt-0.5">{copy.body}</p>
              {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
            </div>
          </div>
          <Button
            onClick={handlePublish}
            disabled={publishing}
            variant="outline"
            className="shrink-0 border-zinc-600 text-zinc-200 hover:bg-zinc-800"
          >
            {publishing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Publicando...
              </>
            ) : (
              'Volver a publicarla'
            )}
          </Button>
        </div>
      </div>
    )
  }

  // reason === 'ready_not_published': tiene branding minimo, nadie la oculto
  // a proposito — deberia estar publicada y no lo esta (el caso original,
  // Orlando). El mas urgente de los cuatro.
  return (
    <div className="relative rounded-xl border-2 border-red-500/40 bg-gradient-to-r from-red-600/10 via-orange-600/5 to-zinc-900/60 p-5 shadow-lg shadow-red-950/10">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-11 h-11 rounded-xl bg-red-500/20 flex items-center justify-center shrink-0">
            <EyeOff className="w-5 h-5 text-red-400" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-zinc-100">
              Tu tienda está lista pero todavía no es visible
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Tenés productos publicados y tu marca está completa — solo falta publicar la tienda.
            </p>
            {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
          </div>
        </div>
        <Button
          onClick={handlePublish}
          disabled={publishing}
          className="shrink-0 bg-red-600 hover:bg-red-500 text-white border-0"
        >
          {publishing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Publicando...
            </>
          ) : (
            'Publicar tienda'
          )}
        </Button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function WorkspaceDashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [checklistOpen, setChecklistOpen] = useState(true)
  const [welcomeDismissed, setWelcomeDismissed] = useState(false)
  const [showScoreTooltip, setShowScoreTooltip] = useState(false)
  const [showUploadCard, setShowUploadCard] = useState(true)
  const [storefrontJustPublished, setStorefrontJustPublished] = useState(false)

  const fetchDashboard = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await authFetch('/api/partners/dashboard')
      if (!res.ok) {
        if (res.status === 401) {
          setError('No se pudo identificar tu cuenta. Inicia sesion nuevamente.')
        } else {
          setError('Error al cargar el dashboard.')
        }
        return
      }
      const json = await res.json()
      setData(json)
    } catch {
      setError('Error de conexion. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDashboard()
  }, [fetchDashboard])

  if (loading) {
    return <DashboardSkeleton />
  }

  if (error || !data) {
    return (
      <div className="max-w-6xl mx-auto p-4 lg:p-0">
        <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/40 p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center mx-auto mb-5">
            <AlertCircle className="w-8 h-8 text-amber-400" />
          </div>
          <h2 className="text-xl font-semibold text-zinc-100 mb-2">
            No pudimos cargar tu dashboard
          </h2>
          <p className="text-zinc-400 mb-6 max-w-md mx-auto">
            {error || 'Ocurrio un problema inesperado. Por favor intenta de nuevo.'}
          </p>
          <Button
            onClick={fetchDashboard}
            className="bg-violet-600 hover:bg-violet-500 text-white border-0"
          >
            Reintentar
          </Button>
        </div>
      </div>
    )
  }

  const checklist = buildChecklist(data)
  const completed = checklist.filter((i) => i.done).length
  const total = checklist.length
  const pct = Math.round((completed / total) * 100)
  const allComplete = completed === total

  const planStyle =
    PLAN_BADGE_STYLES[data.tenant.plan] || PLAN_BADGE_STYLES.starter

  const metrics = [
    {
      key: 'products',
      label: 'Productos',
      value: String(data.products),
      icon: Package,
      color: 'text-blue-400',
      iconBg: 'bg-blue-500/10',
    },
    {
      key: 'leads',
      label: 'Leads',
      value: String(data.leads),
      icon: Users,
      color: 'text-emerald-400',
      iconBg: 'bg-emerald-500/10',
    },
    {
      key: 'orders',
      label: 'Pedidos',
      value: String(data.orders),
      icon: ShoppingBag,
      color: 'text-amber-400',
      iconBg: 'bg-amber-500/10',
    },
    {
      key: 'score',
      label: 'Storefront Score',
      value: `${data.score}%`,
      icon: TrendingUp,
      color: 'text-violet-400',
      iconBg: 'bg-violet-500/10',
      hasTooltip: true,
    },
  ]

  const quickActions = [
    {
      label: 'Agregar producto',
      icon: Plus,
      href: '/workspace/catalog',
    },
    {
      label: 'Ver leads',
      icon: Users,
      href: '/workspace/leads',
    },
    {
      label: 'Editar branding',
      icon: Palette,
      href: '/workspace/branding',
    },
    {
      label: 'Design Engine',
      icon: Wand2,
      href: '/workspace/design-engine',
    },
  ]

  const activity = buildActivityFeed(data)

  return (
    <div className="max-w-6xl mx-auto space-y-8 p-4 lg:p-0">
      {/* ================================================================= */}
      {/* HEADER                                                            */}
      {/* ================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl lg:text-3xl font-bold text-zinc-100 tracking-tight">
              Hola, {data.tenant.name}
            </h1>
            {/* KpiOverview se inserta debajo del header */}
            <Badge
              className={`text-xs font-medium border px-2.5 py-0.5 ${planStyle}`}
            >
              {data.tenant.plan.charAt(0).toUpperCase() +
                data.tenant.plan.slice(1)}
            </Badge>
          </div>
          <p className="text-sm text-zinc-500 capitalize">{formatDate()}</p>
        </div>

        {data.tenant.slug && (
          <Button
            asChild
            className="bg-violet-600 hover:bg-violet-500 text-white border-0 shadow-lg shadow-violet-600/20 transition-all hover:shadow-violet-500/30"
          >
            <Link href={`/p/${data.tenant.slug}`} target="_blank">
              <ExternalLink className="w-4 h-4 mr-2" />
              Ver tienda
            </Link>
          </Button>
        )}
      </div>

      {/* ================================================================= */}
      {/* WELCOME BANNER (new partners)                                     */}
      {/* ================================================================= */}
      {!data.tenant.onboarding_completed && !welcomeDismissed && (
        <div className="relative rounded-xl border border-violet-500/20 bg-gradient-to-r from-violet-600/10 via-fuchsia-600/5 to-zinc-900/60 p-6 overflow-hidden">
          <button
            onClick={() => setWelcomeDismissed(true)}
            className="absolute top-3 right-3 p-1 rounded-md text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-violet-500/20 flex items-center justify-center shrink-0">
              <Rocket className="w-6 h-6 text-violet-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-zinc-100 mb-1">
                Bienvenido a Novamente Partners!
              </h2>
              <p className="text-sm text-zinc-400 mb-3 max-w-xl">
                Tu workspace esta listo. Completa los pasos del checklist para configurar tu marca,
                agregar productos y publicar tu storefront. Cuantos mas pasos completes, mejor sera
                tu Storefront Score.
              </p>
              <div className="flex flex-wrap gap-2">
                <Link
                  href="/workspace/branding"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-medium px-3 py-1.5 transition-colors"
                >
                  <Palette className="w-3 h-3" />
                  Configurar mi marca
                </Link>
                <Link
                  href="/workspace/catalog"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium px-3 py-1.5 transition-colors border border-zinc-700"
                >
                  <Plus className="w-3 h-3" />
                  Agregar productos
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* STOREFRONT OCULTA — productos publicados pero tienda apagada      */}
      {/* ================================================================= */}
      {data.tenant.slug
        && ((!data.tenant.storefront_published && data.publishedProducts >= 1) || storefrontJustPublished) && (
        <StorefrontVisibilityBanner
          slug={data.tenant.slug}
          published={data.tenant.storefront_published || storefrontJustPublished}
          reason={data.storefrontHiddenReason}
          onPublished={() => {
            setStorefrontJustPublished(true)
            setData((prev) =>
              prev ? { ...prev, tenant: { ...prev.tenant, storefront_published: true } } : prev,
            )
          }}
        />
      )}

      {/* ================================================================= */}
      {/* KPI OVERVIEW — Performance ultimos 30 dias                        */}
      {/* ================================================================= */}
      <KpiOverview />

      {isPartnersCockpitEnabled() && <DailyAttention />}

      {/* ================================================================= */}
      {/* METRIC CARDS                                                      */}
      {/* ================================================================= */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m) => {
          const Icon = m.icon
          return (
            <div
              key={m.key}
              data-tour={m.key === 'score' ? 'score-card' : undefined}
              className={`group relative rounded-xl border p-5 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-black/20 cursor-default ${METRIC_GRADIENTS[m.key]}`}
            >
              <div className="flex items-center justify-between mb-3">
                <div
                  className={`w-10 h-10 rounded-xl ${m.iconBg} flex items-center justify-center`}
                >
                  <Icon className={`w-5 h-5 ${m.color}`} />
                </div>
                <Sparkline
                  data={data?.trends?.[m.key as keyof typeof data.trends] || DEFAULT_SPARKLINE}
                  color={SPARKLINE_COLORS[m.key]}
                  className="opacity-60 group-hover:opacity-100 transition-opacity"
                />
              </div>
              <div className="flex items-center gap-1.5 mb-1">
                <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider">
                  {m.label}
                </p>
                {(m as any).hasTooltip && (
                  <div className="relative">
                    <button
                      onClick={() => setShowScoreTooltip(!showScoreTooltip)}
                      className="text-zinc-600 hover:text-zinc-400 transition-colors"
                    >
                      <HelpCircle className="w-3.5 h-3.5" />
                    </button>
                    {showScoreTooltip && m.key === 'score' && (
                      <div className="absolute left-0 top-full mt-2 w-64 p-3 rounded-lg bg-zinc-800 border border-zinc-700 text-xs text-zinc-300 shadow-xl z-50">
                        <p className="font-medium text-zinc-100 mb-1.5">¿Cómo subir tu Storefront Score?</p>
                        <p className="text-zinc-400 leading-relaxed">
                          Tu Storefront Score mide qué tan completa está tu tienda. Sube al completar: logo, banner, descripción, tagline, colores personalizados, CTA, industria, redes sociales y SEO. Score 100% = tu tienda está lista para vender.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <p className="text-2xl lg:text-3xl font-bold text-zinc-100 tracking-tight">
                {m.value}
              </p>
            </div>
          )
        })}
      </div>

      {/* ================================================================= */}
      {/* USAGE WARNINGS (Starter plan only)                               */}
      {/* ================================================================= */}
      {data.tenant.plan === 'starter' && (
        <UsageWarningBar products={data.products} leads={data.leads} />
      )}

      {/* ================================================================= */}
      {/* QUICK ACTIONS                                                     */}
      {/* ================================================================= */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {quickActions.map((action) => {
          const Icon = action.icon
          return (
            <Link
              key={action.label}
              href={action.href}
              className="group flex items-center gap-3 rounded-xl border border-zinc-800/50 bg-zinc-900/30 p-4 transition-all duration-200 hover:bg-violet-600/10 hover:border-violet-500/30"
            >
              <div className="w-9 h-9 rounded-lg bg-zinc-800/60 flex items-center justify-center group-hover:bg-violet-600/20 transition-colors">
                <Icon className="w-4 h-4 text-zinc-400 group-hover:text-violet-400 transition-colors" />
              </div>
              <span className="text-sm font-medium text-zinc-300 group-hover:text-violet-300 transition-colors">
                {action.label}
              </span>
            </Link>
          )
        })}
      </div>

      {/* ================================================================= */}
      {/* BUSINESS MODEL BANNER (descartable)                               */}
      {/* ================================================================= */}
      {!data.tenant.onboarding_dismissed_business_model && (
        <BusinessModelBanner tenantId={data.tenant.id} />
      )}

      {/* ================================================================= */}
      {/* QUICK DESIGN UPLOAD CARD                                         */}
      {/* ================================================================= */}
      {showUploadCard && (
        <QuickDesignUpload onClose={() => setShowUploadCard(false)} />
      )}

      {/* ================================================================= */}
      {/* QUICK-START CARD (solo cuando products === 0)                     */}
      {/* ================================================================= */}
      {data.products === 0 && (
        <QuickStartCard
          logoUploaded={!!data.tenant.logo_url}
          hasDesign={data.designs > 0}
        />
      )}

      {/* ================================================================= */}
      {/* BOTTOM ROW: ONBOARDING + ACTIVITY                                 */}
      {/* ================================================================= */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* -------------------------------------------------------------- */}
        {/* ONBOARDING CHECKLIST                                            */}
        {/* -------------------------------------------------------------- */}
        <div data-tour="onboarding-checklist" className="rounded-xl border border-zinc-800/50 bg-zinc-900/40 overflow-hidden">
          <button
            onClick={() => setChecklistOpen(!checklistOpen)}
            className="w-full flex items-center justify-between p-5 text-left hover:bg-zinc-800/20 transition-colors"
          >
            <div className="flex items-center gap-4">
              <ProgressRing pct={pct} size={56} strokeWidth={4} />
              <div>
                <h3 className="text-base font-semibold text-zinc-100">
                  Primeros pasos
                </h3>
                <p className="text-xs text-zinc-500 mt-0.5">
                  {allComplete
                    ? 'Todo listo!'
                    : `${completed} de ${total} completados`}
                </p>
              </div>
            </div>
            <ChevronDown
              className={`w-5 h-5 text-zinc-500 transition-transform duration-300 ${
                checklistOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          <div
            className={`transition-all duration-300 ease-in-out overflow-hidden ${
              checklistOpen ? 'max-h-[400px] opacity-100' : 'max-h-0 opacity-0'
            }`}
          >
            <div className="px-5 pb-5 space-y-1">
              {allComplete ? (
                <div className="text-center py-6">
                  <div className="relative inline-block mb-3">
                    <PartyPopper className="w-10 h-10 text-amber-400" />
                    {/* Confetti dots */}
                    <div className="absolute -top-1 -left-2 w-2 h-2 rounded-full bg-violet-400 animate-bounce" />
                    <div className="absolute -top-2 right-0 w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce [animation-delay:200ms]" />
                    <div className="absolute top-0 -right-3 w-2 h-2 rounded-full bg-blue-400 animate-bounce [animation-delay:400ms]" />
                    <div className="absolute -bottom-1 -left-1 w-1.5 h-1.5 rounded-full bg-amber-400 animate-bounce [animation-delay:300ms]" />
                    <div className="absolute -bottom-2 right-1 w-2 h-2 rounded-full bg-pink-400 animate-bounce [animation-delay:100ms]" />
                  </div>
                  <p className="text-sm font-medium text-zinc-200">
                    Felicitaciones! Tu marca esta lista
                  </p>
                  <p className="text-xs text-zinc-500 mt-1">
                    Todos los pasos completados
                  </p>
                </div>
              ) : (
                checklist.map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    className="flex items-center gap-3 text-sm group rounded-lg px-3 py-2.5 -mx-3 transition-colors hover:bg-zinc-800/40"
                  >
                    {item.done ? (
                      <CheckCircle2 className="w-[18px] h-[18px] text-emerald-400 shrink-0" />
                    ) : (
                      <Circle className="w-[18px] h-[18px] text-zinc-600 shrink-0 group-hover:text-violet-400 transition-colors" />
                    )}
                    <span
                      className={
                        item.done
                          ? 'text-zinc-500 line-through'
                          : 'text-zinc-300 group-hover:text-zinc-100 transition-colors'
                      }
                    >
                      {item.label}
                    </span>
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>

        {/* -------------------------------------------------------------- */}
        {/* RECENT ACTIVITY                                                 */}
        {/* -------------------------------------------------------------- */}
        <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/40 p-5">
          <div className="flex items-center gap-2 mb-5">
            <Activity className="w-4 h-4 text-zinc-500" />
            <h3 className="text-base font-semibold text-zinc-100">
              Actividad reciente
            </h3>
          </div>

          {activity.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="w-14 h-14 rounded-2xl bg-zinc-800/40 flex items-center justify-center mb-4">
                <Star className="w-6 h-6 text-zinc-600" />
              </div>
              <p className="text-sm text-zinc-400 mb-1">
                Sin actividad todavia
              </p>
              <p className="text-xs text-zinc-600">
                Agrega productos o configura tu marca para comenzar
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {activity.map((event, i) => {
                const Icon = event.icon
                return (
                  <div
                    key={i}
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 -mx-3 hover:bg-zinc-800/30 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-lg bg-zinc-800/60 flex items-center justify-center shrink-0">
                      <Icon className={`w-4 h-4 ${event.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-zinc-300 truncate">
                        {event.label}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Clock className="w-3 h-3 text-zinc-600" />
                      <span className="text-xs text-zinc-600">
                        {event.time}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
