'use client'

import { useState } from 'react'
import { X, Check, Sparkles, Zap, Crown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { PLAN_PRICING_USD, PLAN_PRICING_MONTHLY_FROM_ANNUAL, GROWTH_PROMO, GROWTH_PROMO_PCT } from '@/lib/partners/plans'

interface UpgradeModalProps {
  currentPlan: string
  tenantId: string
  onClose: () => void
}

interface PlanCard {
  id: string
  name: string
  priceMonthly: number
  priceAnnualMonth: number
  promoMonthly?: number // precio promo de lanzamiento (mensual)
  promoAnnualMonth?: number // precio/mes promo de lanzamiento (anual, primer año)
  icon: typeof Zap
  popular?: boolean
  features: string[]
  notIncluded: string[]
}

const plans: PlanCard[] = [
  {
    id: 'starter',
    name: 'Starter',
    priceMonthly: PLAN_PRICING_USD.starter,
    priceAnnualMonth: PLAN_PRICING_MONTHLY_FROM_ANNUAL.starter,
    icon: Zap,
    features: [
      'Hasta 10 productos',
      '20 leads/mes',
      'Storefront basica',
      'Branding limitado',
    ],
    notIncluded: [
      'SEO / GEO',
      'Design Engine',
      'Chatbot IA',
      'Analytics',
      'Meta Ads',
    ],
  },
  {
    id: 'growth',
    name: 'Growth',
    priceMonthly: PLAN_PRICING_USD.growth,
    priceAnnualMonth: PLAN_PRICING_MONTHLY_FROM_ANNUAL.growth,
    // lanzamiento -50% (primeros GROWTH_PROMO.maxPartners partners, GROWTH_PROMO.months meses)
    promoMonthly: GROWTH_PROMO.priceUsd,
    promoAnnualMonth: Math.round(PLAN_PRICING_MONTHLY_FROM_ANNUAL.growth * (1 - GROWTH_PROMO_PCT) * 100) / 100,
    icon: Sparkles,
    popular: true,
    features: [
      'Productos ilimitados',
      'Leads ilimitados',
      'SEO + GEO optimizado',
      'Branding completo',
      'Design Engine (presets)',
      'Analytics basico',
      'Soporte por email',
      'CSV import',
    ],
    notIncluded: [
      'Chatbot IA',
      'Meta Ads templates',
      'Soporte WhatsApp',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    priceMonthly: PLAN_PRICING_USD.pro,
    priceAnnualMonth: PLAN_PRICING_MONTHLY_FROM_ANNUAL.pro,
    icon: Crown,
    features: [
      'Todo de Growth',
      'Chatbot IA en storefront',
      'Design Engine completo',
      'Meta Ads templates',
      'Analytics avanzado',
      'Feed export',
      'Soporte WhatsApp',
      'Onboarding call',
    ],
    notIncluded: [],
  },
]

export function UpgradeModal({ currentPlan, tenantId, onClose }: UpgradeModalProps) {
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly')

  async function handleSubscribe(planId: string) {
    if (planId === 'starter') return
    setLoading(planId)
    setError(null)

    try {
      const res = await fetch('/api/partners/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId, plan: planId, billingCycle }),
      })

      const data = await res.json().catch(() => ({}))
      if (res.ok && data.init_point) {
        window.location.href = data.init_point
        return
      }
      setError(data?.details || data?.error || 'No pudimos generar el pago. Probá de nuevo en un momento.')
    } catch {
      setError('Error de conexión. Probá de nuevo.')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl bg-zinc-950 border border-zinc-800 p-6 md:p-8">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-md text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-zinc-100 mb-2">Elegí tu plan</h2>
          <p className="text-zinc-400 text-sm">Actualizá tu plan para desbloquear más funciones</p>
        </div>

        {/* Billing cycle toggle */}
        <div className="flex items-center justify-center gap-3 mb-2">
          <button
            onClick={() => setBillingCycle('monthly')}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
              billingCycle === 'monthly'
                ? 'bg-violet-600 text-white'
                : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
            )}
          >
            Mensual
          </button>
          <button
            onClick={() => setBillingCycle('annual')}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium transition-colors relative',
              billingCycle === 'annual'
                ? 'bg-violet-600 text-white'
                : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
            )}
          >
            Anual
            <Badge className="absolute -top-2 -right-3 bg-emerald-600 text-white text-[10px] px-1.5 py-0">
              -15%
            </Badge>
          </button>
        </div>
        <p className="text-center text-xs text-zinc-500 mb-6">
          {billingCycle === 'monthly'
            ? 'Renovación automática mensual — podés cancelar cuando quieras'
            : 'Un pago por 12 meses'}
        </p>

        {error && (
          <div className="mb-6 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {plans.map((plan) => {
            const Icon = plan.icon
            const isCurrent = plan.id === currentPlan
            const isUpgrade = plans.findIndex((p) => p.id === plan.id) > plans.findIndex((p) => p.id === currentPlan)
            const promoForCycle = billingCycle === 'annual' ? plan.promoAnnualMonth : plan.promoMonthly
            const hasPromo = !!promoForCycle
            const basePrice = billingCycle === 'annual' ? plan.priceAnnualMonth : plan.priceMonthly
            const price = hasPromo ? promoForCycle! : basePrice

            return (
              <div
                key={plan.id}
                className={cn(
                  'relative rounded-xl border p-5 flex flex-col',
                  plan.popular
                    ? 'border-violet-500/50 bg-violet-500/5'
                    : 'border-zinc-800 bg-zinc-900/50',
                  isCurrent && 'ring-2 ring-violet-500'
                )}
              >
                {plan.popular && (
                  <Badge className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-violet-600 text-white text-xs">
                    Popular
                  </Badge>
                )}

                <div className="flex items-center gap-2 mb-3">
                  <Icon className="w-5 h-5 text-violet-400" />
                  <h3 className="font-bold text-zinc-100">{plan.name}</h3>
                </div>

                <div className="mb-4">
                  {price === 0 ? (
                    <p className="text-2xl font-bold text-zinc-100">Gratis</p>
                  ) : (
                    <>
                      <div className="flex items-baseline gap-2">
                        <p className="text-2xl font-bold text-zinc-100">
                          US${price}<span className="text-sm font-normal text-zinc-400">/mes</span>
                        </p>
                        {hasPromo && (
                          <span className="text-sm text-zinc-500 line-through">US${basePrice}</span>
                        )}
                      </div>
                      {hasPromo && billingCycle === 'monthly' && (
                        <p className="text-xs text-emerald-400 mt-1">
                          Promo -{Math.round(GROWTH_PROMO_PCT * 100)}% · primeros {GROWTH_PROMO.maxPartners} partners · {GROWTH_PROMO.months} meses, luego US${plan.priceMonthly}/mes
                        </p>
                      )}
                      {billingCycle === 'annual' && (
                        <p className="text-xs text-emerald-400 mt-1">
                          {hasPromo
                            ? `US$${Math.round(price * 12)} el primer año (-${Math.round(GROWTH_PROMO_PCT * 100)}%, primeros ${GROWTH_PROMO.maxPartners}), luego US$${Math.round(plan.priceAnnualMonth * 12)}/año`
                            : `US$${Math.round(price * 12)}/año — ahorrás 15%`}
                        </p>
                      )}
                    </>
                  )}
                </div>

                <ul className="space-y-2 mb-6 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-zinc-300">
                      <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                  {plan.notIncluded.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-zinc-600">
                      <X className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>

                {plan.id === 'starter' ? (
                  <Button disabled variant="outline" className="w-full border-zinc-700 text-zinc-500">
                    {isCurrent ? 'Plan actual' : '—'}
                  </Button>
                ) : isCurrent ? (
                  <Button
                    onClick={() => handleSubscribe(plan.id)}
                    disabled={!!loading}
                    variant="outline"
                    className="w-full border-violet-500/50 text-violet-300 hover:bg-violet-500/10"
                  >
                    {loading === plan.id ? 'Procesando...' : 'Renovar / Reactivar'}
                  </Button>
                ) : isUpgrade ? (
                  <Button
                    onClick={() => handleSubscribe(plan.id)}
                    disabled={!!loading}
                    className="w-full bg-violet-600 hover:bg-violet-500 text-white"
                  >
                    {loading === plan.id ? 'Procesando...' : `Pasar a ${plan.name}`}
                  </Button>
                ) : (
                  <Button disabled variant="outline" className="w-full border-zinc-700 text-zinc-500">
                    —
                  </Button>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
