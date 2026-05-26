'use client'

import { getPartnerPlanPrice, formatPrice, ALL_GARMENT_PRICING } from '@/lib/partners/garment-pricing'

interface MarginBreakdownProps {
  price: number | null
  garmentKey: string | null
  plan: string
}

export function MarginBreakdown({ price, garmentKey, plan }: MarginBreakdownProps) {
  const safePlan = plan === 'growth' || plan === 'pro' ? plan : 'starter'

  if (!garmentKey) {
    return (
      <p className="text-xs text-zinc-500 mt-1">
        Asociá una prenda para ver tu margen.
      </p>
    )
  }

  const partnerCost = getPartnerPlanPrice(garmentKey, safePlan)
  if (partnerCost === null) return null

  const garmentName = ALL_GARMENT_PRICING[garmentKey]?.name ?? garmentKey

  if (price === null || price <= 0) {
    return (
      <div className="mt-2 rounded-lg bg-zinc-900/40 border border-zinc-800/50 px-3 py-2 space-y-1 text-xs">
        <div className="flex justify-between text-zinc-400">
          <span>Costo Novamente <span className="text-zinc-600 capitalize">({safePlan})</span></span>
          <span>{formatPrice(partnerCost)}</span>
        </div>
        <div className="flex justify-between text-zinc-600">
          <span>Tu ganancia</span>
          <span>—</span>
        </div>
      </div>
    )
  }

  const margin = price - partnerCost
  const marginPct = Math.round((margin / price) * 100)

  let marginColor = 'text-emerald-400'
  if (margin < 0) marginColor = 'text-red-400'
  else if (marginPct < 20) marginColor = 'text-amber-400'

  return (
    <div className="mt-2 rounded-lg bg-zinc-900/40 border border-zinc-800/50 px-3 py-2 space-y-1 text-xs">
      <div className="flex justify-between text-zinc-400">
        <span>Tu PVP</span>
        <span className="text-zinc-200">{formatPrice(price)}</span>
      </div>
      <div className="flex justify-between text-zinc-400">
        <span>
          Costo Novamente{' '}
          <span className="text-zinc-600 capitalize">({safePlan})</span>
        </span>
        <span>{formatPrice(partnerCost)}</span>
      </div>
      <div className={`flex justify-between font-medium ${marginColor}`}>
        <span>Tu ganancia</span>
        <span>
          {formatPrice(margin)} ({marginPct}%)
        </span>
      </div>
      {margin < 0 && (
        <p className="text-red-400 text-[10px] pt-0.5">
          Estás vendiendo por debajo del costo de {garmentName}.
        </p>
      )}
    </div>
  )
}
