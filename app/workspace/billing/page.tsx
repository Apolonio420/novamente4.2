'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  CreditCard,
  Crown,
  Sparkles,
  Zap,
  ArrowUpRight,
  AlertTriangle,
  Loader2,
  CheckCircle2,
  XCircle,
  Check,
  X,
  Calendar,
  Clock,
  Phone,
  Minus,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { authFetch } from '@/lib/partners/auth-fetch'
import { UpgradeModal } from '@/components/partners/upgrade-modal'

// --- Types ---

interface BillingData {
  plan: string
  status: string
  subscription_started_at: string | null
  billing_cycle: string | null
  next_billing_date: string | null
  price_usd: number
  tenant_id: string
}

interface Toast {
  message: string
  type: 'success' | 'error'
}

// --- Constants ---

const PLAN_ICONS: Record<string, typeof Zap> = {
  starter: Zap,
  growth: Sparkles,
  pro: Crown,
}

const PLAN_LABELS: Record<string, string> = {
  starter: 'Starter',
  growth: 'Growth',
  pro: 'Pro',
}

const PLAN_DESCRIPTIONS: Record<string, string> = {
  starter: 'Ideal para empezar. Storefront con logo, colores y acceso a precios mayoristas.',
  growth: 'Para marcas que quieren crecer. SEO, branding avanzado y generaciones de IA ilimitadas.',
  pro: 'La experiencia completa. Chatbot, Meta Ads, soporte premium y mas.',
}

const PLAN_BADGE_COLORS: Record<string, string> = {
  starter: 'bg-zinc-700 text-zinc-300',
  growth: 'bg-violet-900/60 text-violet-400 border-violet-500/30',
  pro: 'bg-purple-900/60 text-purple-400 border-purple-500/30',
}

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  active: { label: 'Activo', className: 'bg-emerald-900/60 text-emerald-400 border-emerald-500/30' },
  paused: { label: 'Pausado', className: 'bg-amber-900/60 text-amber-400 border-amber-500/30' },
  pending: { label: 'Pendiente', className: 'bg-blue-900/60 text-blue-400 border-blue-500/30' },
  onboarding: { label: 'Onboarding', className: 'bg-blue-900/60 text-blue-400 border-blue-500/30' },
}

const PLAN_FEATURES: Record<string, string[]> = {
  starter: [
    'Hasta 10 productos',
    '20 leads/mes',
    'Storefront con logo y colores',
    'Branding basico',
  ],
  growth: [
    'Productos ilimitados',
    'Leads ilimitados',
    'SEO + GEO optimizado',
    'Branding avanzado',
    'Design Engine (presets)',
    'Analytics basico',
    'Soporte por email',
    'CSV import',
  ],
  pro: [
    'Todo de Growth',
    'Chatbot IA en storefront',
    'Design Engine completo',
    'Meta Ads templates',
    'Analytics avanzado',
    'Feed export',
    'Soporte WhatsApp',
    'Onboarding call',
  ],
}

// Features that a plan loses when downgrading
function getFeaturesLost(fromPlan: string, toPlan: string): string[] {
  const fromFeatures = PLAN_FEATURES[fromPlan] || []
  const toFeatures = PLAN_FEATURES[toPlan] || []
  return fromFeatures.filter((f) => !toFeatures.includes(f))
}

const PLAN_ORDER = ['starter', 'growth', 'pro']

// --- Component ---

export default function BillingPage() {
  const [billing, setBilling] = useState<BillingData | null>(null)
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState<Toast | null>(null)
  const [showUpgrade, setShowUpgrade] = useState(false)
  const [downgradeTarget, setDowngradeTarget] = useState<string | null>(null)
  const [showCancel, setShowCancel] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  const showToast = useCallback((message: string, type: 'success' | 'error') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3500)
  }, [])

  const fetchBilling = useCallback(async () => {
    try {
      const res = await authFetch('/api/partners/billing')
      if (!res.ok) throw new Error('Error cargando billing')
      const data: BillingData = await res.json()
      setBilling(data)
    } catch {
      showToast('Error al cargar informacion de facturacion', 'error')
    } finally {
      setLoading(false)
    }
  }, [showToast])

  useEffect(() => {
    fetchBilling()
  }, [fetchBilling])

  const handleDowngrade = async () => {
    if (!billing || !downgradeTarget) return
    setActionLoading(true)
    try {
      const res = await authFetch('/api/partners/billing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'downgrade', plan: downgradeTarget }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Error al cambiar plan')
      }
      const data: BillingData = await res.json()
      setBilling(data)
      setDowngradeTarget(null)
      showToast(`Plan cambiado a ${PLAN_LABELS[downgradeTarget] || downgradeTarget}`, 'success')
    } catch (e: any) {
      showToast(e.message || 'Error al cambiar plan', 'error')
    } finally {
      setActionLoading(false)
    }
  }

  const handleCancel = async () => {
    if (!billing) return
    setActionLoading(true)
    try {
      const res = await authFetch('/api/partners/billing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cancel' }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Error al cancelar suscripcion')
      }
      const data: BillingData = await res.json()
      setBilling(data)
      setShowCancel(false)
      showToast('Suscripcion cancelada', 'success')
    } catch (e: any) {
      showToast(e.message || 'Error al cancelar suscripcion', 'error')
    } finally {
      setActionLoading(false)
    }
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '—'
    return new Date(dateStr).toLocaleDateString('es-AR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }

  // --- Skeleton ---

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-8 p-4 sm:p-6">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded bg-zinc-800 animate-pulse" />
          <div className="h-7 w-48 rounded bg-zinc-800 animate-pulse" />
        </div>
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-6 space-y-4"
          >
            <div className="h-5 w-40 rounded bg-zinc-800 animate-pulse" />
            <div className="h-10 w-full rounded bg-zinc-800/50 animate-pulse" />
            <div className="h-10 w-full rounded bg-zinc-800/50 animate-pulse" />
          </div>
        ))}
      </div>
    )
  }

  if (!billing) {
    return (
      <div className="max-w-4xl mx-auto p-4 sm:p-6">
        <div className="flex items-center gap-3 text-red-400">
          <XCircle className="h-5 w-5" />
          <span>No se pudo cargar la informacion de facturacion.</span>
        </div>
      </div>
    )
  }

  const PlanIcon = PLAN_ICONS[billing.plan] || Zap
  const planLabel = PLAN_LABELS[billing.plan] || billing.plan
  const planDesc = PLAN_DESCRIPTIONS[billing.plan] || ''
  const features = PLAN_FEATURES[billing.plan] || []
  const planIndex = PLAN_ORDER.indexOf(billing.plan)
  const canUpgrade = planIndex < PLAN_ORDER.length - 1
  const canDowngrade = planIndex > 0
  const isPaid = billing.plan !== 'starter'

  return (
    <div className="max-w-4xl mx-auto space-y-8 p-4 sm:p-6">
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
      <div className="flex items-center gap-3">
        <CreditCard className="h-6 w-6 text-zinc-400" />
        <h1 className="text-xl sm:text-2xl font-semibold text-zinc-100">
          Facturacion
        </h1>
      </div>

      {/* 1. Current Plan */}
      <Card className="bg-zinc-900/60 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-base font-medium text-zinc-100 flex items-center gap-2">
            <PlanIcon className="h-5 w-5 text-purple-400" />
            Plan actual
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <Badge className={PLAN_BADGE_COLORS[billing.plan] || PLAN_BADGE_COLORS.starter}>
                  {planLabel}
                </Badge>
                <Badge className={STATUS_BADGE[billing.status]?.className || 'bg-zinc-700 text-zinc-300'}>
                  {STATUS_BADGE[billing.status]?.label || billing.status}
                </Badge>
              </div>
              <p className="text-sm text-zinc-400 max-w-md">{planDesc}</p>
              {isPaid && (
                <p className="text-lg font-semibold text-zinc-100">
                  US${billing.price_usd}<span className="text-sm font-normal text-zinc-500">/mes</span>
                </p>
              )}
            </div>
            {canUpgrade && (
              <Button
                onClick={() => setShowUpgrade(true)}
                className="bg-purple-600 hover:bg-purple-500 text-white gap-2"
              >
                <ArrowUpRight className="h-4 w-4" />
                Upgrade
              </Button>
            )}
          </div>

          {/* Features list */}
          <div className="pt-3 border-t border-zinc-800">
            <p className="text-xs text-zinc-500 mb-3 uppercase tracking-wider font-medium">
              Incluido en tu plan
            </p>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-zinc-300">
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  {f}
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* 2. Plan Comparison Table */}
      <Card className="bg-zinc-900/60 border-zinc-800 overflow-hidden">
        <CardHeader>
          <CardTitle className="text-base font-medium text-zinc-100">
            Comparar planes
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800">
                  <th className="text-left text-xs text-zinc-500 font-medium px-4 py-3 w-1/4">Caracteristica</th>
                  {(['starter', 'growth', 'pro'] as const).map((p) => {
                    const isCurrent = billing.plan === p
                    return (
                      <th key={p} className={`text-center px-4 py-3 w-1/4 ${isCurrent ? 'bg-violet-500/5' : ''}`}>
                        <div className="flex flex-col items-center gap-1">
                          <span className={`text-sm font-semibold ${isCurrent ? 'text-violet-400' : 'text-zinc-200'}`}>
                            {PLAN_LABELS[p]}
                          </span>
                          <span className="text-xs text-zinc-500">
                            {p === 'starter' ? 'Gratis' : `US$${p === 'growth' ? '25' : '100'}/mes`}
                          </span>
                          {isCurrent && (
                            <Badge className="bg-violet-500/20 text-violet-400 text-[10px] px-2 py-0">Plan actual</Badge>
                          )}
                        </div>
                      </th>
                    )
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                {[
                  { feature: 'Productos', starter: '10', growth: 'Ilimitados', pro: 'Ilimitados' },
                  { feature: 'Leads / mes', starter: '20', growth: 'Ilimitados', pro: 'Ilimitados' },
                  { feature: 'Design Engine', starter: 'Presets', growth: 'Presets', pro: 'Completo' },
                  { feature: 'Branding', starter: 'Basico', growth: 'Completo', pro: 'Completo' },
                  { feature: 'SEO + GEO', starter: false, growth: true, pro: true },
                  { feature: 'Analytics', starter: false, growth: 'Basico', pro: 'Avanzado' },
                  { feature: 'Chatbot IA', starter: false, growth: false, pro: true },
                  { feature: 'Meta Ads templates', starter: false, growth: false, pro: true },
                  { feature: 'Feed export', starter: false, growth: false, pro: true },
                  { feature: 'Soporte', starter: false, growth: 'Email', pro: 'WhatsApp' },
                  { feature: 'Onboarding call', starter: false, growth: false, pro: true },
                  { feature: 'Badge removible', starter: false, growth: true, pro: true },
                ].map((row) => (
                  <tr key={row.feature} className="hover:bg-zinc-800/20 transition-colors">
                    <td className="px-4 py-2.5 text-zinc-300 text-xs font-medium">{row.feature}</td>
                    {(['starter', 'growth', 'pro'] as const).map((p) => {
                      const val = row[p]
                      const isCurrent = billing.plan === p
                      return (
                        <td key={p} className={`text-center px-4 py-2.5 ${isCurrent ? 'bg-violet-500/5' : ''}`}>
                          {val === true ? (
                            <Check className="w-4 h-4 text-emerald-400 mx-auto" />
                          ) : val === false ? (
                            <Minus className="w-4 h-4 text-zinc-700 mx-auto" />
                          ) : (
                            <span className="text-xs text-zinc-300">{val}</span>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* 2b. Usage Meters */}
      <Card className="bg-zinc-900/60 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-base font-medium text-zinc-100">
            Uso de tu plan
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            {
              label: 'Productos',
              max: billing.plan === 'starter' ? 10 : null,
              note: billing.plan === 'starter' ? 'Limite de 10 en Starter' : 'Ilimitados',
            },
            {
              label: 'Leads este mes',
              max: billing.plan === 'starter' ? 20 : null,
              note: billing.plan === 'starter' ? 'Limite de 20/mes en Starter' : 'Ilimitados',
            },
          ].map((meter) => (
            <div key={meter.label} className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-sm text-zinc-300">{meter.label}</span>
                <span className="text-xs text-zinc-500">{meter.note}</span>
              </div>
              {meter.max ? (
                <div className="h-2 rounded-full bg-zinc-800 overflow-hidden">
                  <div className="h-full rounded-full bg-violet-500 transition-all" style={{ width: '0%' }} />
                </div>
              ) : (
                <div className="h-2 rounded-full bg-emerald-500/20 overflow-hidden">
                  <div className="h-full rounded-full bg-emerald-500/40 w-full" />
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* 2c. Onboarding Call CTA */}
      {billing.plan === 'pro' && (
        <Card className="bg-zinc-900/60 border-zinc-800">
          <CardContent className="py-5">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center">
                  <Phone className="w-5 h-5 text-violet-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-zinc-100">Llamada de onboarding incluida</p>
                  <p className="text-xs text-zinc-500">Agenda una llamada personalizada con nuestro equipo</p>
                </div>
              </div>
              <Link
                href="/workspace/onboarding-call"
                className="inline-flex items-center gap-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium px-4 py-2 transition-colors"
              >
                <Phone className="w-4 h-4" />
                Agendar llamada
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 3. Subscription Details */}
      {isPaid && (
        <Card className="bg-zinc-900/60 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-base font-medium text-zinc-100 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-zinc-400" />
              Detalles de suscripcion
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1">
                <span className="text-xs text-zinc-500">Inicio de suscripcion</span>
                <p className="text-sm text-zinc-200 font-medium">
                  {formatDate(billing.subscription_started_at)}
                </p>
              </div>
              <div className="space-y-1">
                <span className="text-xs text-zinc-500">Proxima facturacion</span>
                <p className="text-sm text-zinc-200 font-medium">
                  {formatDate(billing.next_billing_date)}
                </p>
              </div>
              <div className="space-y-1">
                <span className="text-xs text-zinc-500">Ciclo de facturacion</span>
                <p className="text-sm text-zinc-200 font-medium capitalize">
                  {billing.billing_cycle === 'annual' ? 'Anual' : 'Mensual'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 3. Payment History Placeholder */}
      <Card className="bg-zinc-900/60 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-base font-medium text-zinc-100 flex items-center gap-2">
            <Clock className="h-5 w-5 text-zinc-400" />
            Historial de pagos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 py-6 justify-center">
            <CreditCard className="h-8 w-8 text-zinc-700" />
            <p className="text-sm text-zinc-500">
              Historial de pagos disponible proximamente
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 4. Downgrade / Cancel zone */}
      {isPaid && billing.status !== 'paused' && (
        <Card className="bg-zinc-900/60 border-red-900/40">
          <CardHeader>
            <CardTitle className="text-base font-medium text-red-400 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Gestionar suscripcion
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Downgrade */}
            {canDowngrade && (
              <div className="space-y-3">
                <p className="text-sm text-zinc-400">
                  Cambiar a un plan inferior. Perderás acceso a funciones premium.
                </p>
                {!downgradeTarget ? (
                  <div className="flex flex-wrap gap-2">
                    {PLAN_ORDER.slice(0, planIndex).map((p) => (
                      <Button
                        key={p}
                        variant="outline"
                        onClick={() => setDowngradeTarget(p)}
                        className="border-amber-600/50 text-amber-400 hover:bg-amber-950/40 hover:text-amber-300 gap-2"
                      >
                        Cambiar a {PLAN_LABELS[p]}
                      </Button>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 rounded-lg border border-amber-600/30 bg-amber-950/20 space-y-3">
                    <p className="text-sm font-medium text-amber-300">
                      Seguro que queres cambiar a {PLAN_LABELS[downgradeTarget]}?
                    </p>
                    <div className="space-y-1">
                      <p className="text-xs text-zinc-500 uppercase tracking-wider font-medium">
                        Vas a perder acceso a:
                      </p>
                      <ul className="space-y-1">
                        {getFeaturesLost(billing.plan, downgradeTarget).map((f) => (
                          <li key={f} className="flex items-start gap-2 text-sm text-red-400">
                            <X className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                            {f}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="flex items-center gap-3 pt-2">
                      <Button
                        size="sm"
                        onClick={handleDowngrade}
                        disabled={actionLoading}
                        className="bg-amber-600 hover:bg-amber-700 text-white gap-1"
                      >
                        {actionLoading ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : null}
                        Confirmar cambio
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setDowngradeTarget(null)}
                        className="text-zinc-400 hover:text-zinc-200"
                      >
                        Cancelar
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Cancel */}
            <div className="space-y-3 pt-3 border-t border-zinc-800/50">
              <p className="text-sm text-zinc-400">
                Cancelar tu suscripcion. Tu storefront seguira activa hasta el fin del periodo actual.
              </p>
              {!showCancel ? (
                <Button
                  variant="outline"
                  onClick={() => setShowCancel(true)}
                  className="border-red-600/50 text-red-400 hover:bg-red-950/40 hover:text-red-300 gap-2"
                >
                  <AlertTriangle className="h-4 w-4" />
                  Cancelar suscripcion
                </Button>
              ) : (
                <div className="p-4 rounded-lg border border-red-600/30 bg-red-950/20 space-y-3">
                  <p className="text-sm font-medium text-red-300">
                    Estas seguro de cancelar tu suscripcion?
                  </p>
                  <p className="text-xs text-zinc-400">
                    Al cancelar, tu storefront seguira activa hasta el fin del periodo actual.
                    Despues de eso, tu cuenta volvera al plan Starter.
                  </p>
                  <div className="flex items-center gap-3 pt-1">
                    <Button
                      size="sm"
                      onClick={handleCancel}
                      disabled={actionLoading}
                      className="bg-red-600 hover:bg-red-700 text-white gap-1"
                    >
                      {actionLoading ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : null}
                      Confirmar cancelacion
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setShowCancel(false)}
                      className="text-zinc-400 hover:text-zinc-200"
                    >
                      Volver
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Paused notice */}
      {billing.status === 'paused' && isPaid && (
        <Card className="bg-zinc-900/60 border-amber-900/40">
          <CardContent className="py-6">
            <div className="flex items-center gap-3 text-amber-400">
              <AlertTriangle className="h-5 w-5 shrink-0" />
              <p className="text-sm">
                Tu suscripcion esta cancelada. Tu cuenta volvera al plan Starter al finalizar el periodo actual.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upgrade Modal */}
      {showUpgrade && billing && (
        <UpgradeModal
          currentPlan={billing.plan}
          tenantId={billing.tenant_id}
          onClose={() => setShowUpgrade(false)}
        />
      )}
    </div>
  )
}
