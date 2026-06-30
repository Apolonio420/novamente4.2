"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Check } from "lucide-react"
import { PartnersJoinLink } from "@/components/PartnersHeroCTAs"
import {
  PLAN_NAMES,
  PLAN_DESCRIPTIONS,
  PLAN_PRICING_USD,
  firstYearPromoPct,
} from "@/lib/partners/plans"
import { formatUsdPrice } from "@/lib/partners/plan-display"
import { PromoSpotsCounter } from "@/components/partners/PromoSpotsCounter"
import type { Plan } from "@/lib/partners/types"

type Tier = { plan: Plan; popular?: boolean; features: string[] }

export function PartnersPricing({ tiers }: { tiers: Tier[] }) {
  const [annual, setAnnual] = useState(false)

  return (
    <>
      {/* Billing toggle */}
      <div className="flex justify-center mb-10">
        <div className="inline-flex items-center rounded-full border border-zinc-700 bg-zinc-900/60 p-1">
          <button
            type="button"
            onClick={() => setAnnual(false)}
            className={`px-5 py-2 text-sm font-medium rounded-full transition-colors ${
              !annual ? "bg-purple-500 text-white shadow" : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Mensual
          </button>
          <button
            type="button"
            onClick={() => setAnnual(true)}
            className={`px-5 py-2 text-sm font-medium rounded-full transition-colors flex items-center gap-2 ${
              annual ? "bg-purple-500 text-white shadow" : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Anual
            <span
              className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                annual ? "bg-emerald-500 text-white" : "bg-emerald-500/20 text-emerald-400"
              }`}
            >
              −15%
            </span>
          </button>
        </div>
      </div>

      <PromoSpotsCounter className="mb-10" />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
        {tiers.map(({ plan, popular, features }) => {
          const promoPct = firstYearPromoPct(plan)
          const isFree = PLAN_PRICING_USD[plan] === 0
          const price = formatUsdPrice(PLAN_PRICING_USD[plan], annual, promoPct)
          return (
            <div
              key={plan}
              className={`relative p-6 rounded-xl border transition-all ${
                popular
                  ? "border-purple-500 bg-purple-500/5 shadow-lg shadow-purple-500/10"
                  : "border-zinc-800 bg-zinc-900/50 hover:border-zinc-700"
              }`}
            >
              {popular && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-purple-500 text-white border-0">
                  Más popular
                </Badge>
              )}
              <div className="mb-6">
                <h3 className="text-xl font-bold mb-1">{PLAN_NAMES[plan]}</h3>
                <p className="text-zinc-400 text-sm mb-4">{PLAN_DESCRIPTIONS[plan]}</p>
                {isFree ? (
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold">Gratis</span>
                  </div>
                ) : (
                  <>
                    {promoPct > 0 && (
                      <div className="mb-2">
                        <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 text-white text-[11px] font-bold uppercase tracking-wide px-2.5 py-1 shadow-lg shadow-orange-500/30 animate-pulse">
                          🔥 {Math.round(promoPct * 100)}% OFF · 1<sup>er</sup> año
                        </span>
                      </div>
                    )}
                    {price.strike && (
                      <span className="text-xs text-zinc-500 line-through block mb-1">{price.strike}/mes</span>
                    )}
                    <div className="flex items-baseline gap-1 flex-wrap">
                      <span className="text-3xl font-bold">{price.main}</span>
                      <span className="text-zinc-400 text-sm">/mes</span>
                    </div>
                    <p className="text-zinc-500 text-xs mt-1">{price.sub}</p>
                    {promoPct > 0 && (
                      <p className="text-[11px] font-semibold text-amber-500 mt-1">⚡ Solo para los primeros 100 partners</p>
                    )}
                  </>
                )}
              </div>
              <ul className="space-y-3 mb-8">
                {features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm">
                    <Check className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
                    <span className="text-zinc-300">{feature}</span>
                  </li>
                ))}
              </ul>
              <PartnersJoinLink className="block">
                <Button
                  className={`w-full ${
                    popular
                      ? "bg-purple-500 hover:bg-purple-400 text-white"
                      : "bg-zinc-800 hover:bg-zinc-700 text-zinc-200"
                  }`}
                >
                  {plan === "starter" ? "Empezar gratis" : "Elegir plan"}
                </Button>
              </PartnersJoinLink>
            </div>
          )
        })}
      </div>
    </>
  )
}
