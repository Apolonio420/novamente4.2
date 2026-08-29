"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Sparkles } from "lucide-react"
import { MODELS, TIERS } from "./data"

function formatPrice(value: number) {
  return `$${value.toLocaleString("es-AR")}`
}

// growthByModel llega ya calculado desde el server (page.tsx) con el precio Growth
// "desde (1u)". El cliente nunca recibe el costo del que se deriva.
export default function UnifiedPriceTable({
  growthByModel,
}: {
  growthByModel: Record<string, number | null>
}) {
  const [showGrowth, setShowGrowth] = useState(false)

  return (
    <section className="mb-14">
      <div className="text-center mb-6">
        <h2 className="novamente-heading text-2xl mb-2">Tabla de Precios Unificados</h2>
        <p className="text-sm text-muted-foreground">
          Precios finales por unidad en Pesos (ARS), incluyen una estampa (frente o dorso, del tamaño que sea).
          Estampa en ambas caras: +$3.500 por prenda (totebag +$5.000) — incluida sin cargo en los planes Growth y Pro.
        </p>
      </div>

      <div className="flex justify-center mb-5">
        <Button
          size="sm"
          variant={showGrowth ? "default" : "outline"}
          onClick={() => setShowGrowth(v => !v)}
          className="rounded-full"
        >
          <Sparkles className="w-3.5 h-3.5 mr-1.5" />
          {showGrowth ? "Ocultar columna Plan Growth" : "Ver precios con Plan Studio Growth"}
        </Button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40">
              <th className="text-left p-4 font-semibold">Producto</th>
              {TIERS.map(t => (
                <th key={t.key} className="text-right p-4 font-semibold whitespace-nowrap">
                  {t.label}
                  <span className="block text-xs font-normal text-muted-foreground">({t.range})</span>
                </th>
              ))}
              {showGrowth && (
                <th className="text-right p-4 font-semibold whitespace-nowrap text-primary bg-primary/5">
                  Plan Growth
                  <span className="block text-xs font-normal text-muted-foreground">USD$50/mes</span>
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {MODELS.map(p => {
              const growthPrice = growthByModel[p.id] ?? null
              const savings = growthPrice != null ? p.prices.partner - growthPrice : 0
              const savingsPct = growthPrice != null && p.prices.partner > 0
                ? Math.round((savings / p.prices.partner) * 100)
                : 0
              return (
                <tr key={p.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                  <td className="p-4">
                    <p className="font-semibold">{p.name}</p>
                    <p className="text-xs text-muted-foreground">{p.subtitle}</p>
                  </td>
                  {TIERS.map(t => (
                    <td key={t.key} className="p-4 text-right tabular-nums whitespace-nowrap">
                      {formatPrice(p.prices[t.key])}
                    </td>
                  ))}
                  {showGrowth && (
                    <td className="p-4 text-right tabular-nums whitespace-nowrap bg-primary/5">
                      {growthPrice != null ? (
                        <>
                          <span className="font-bold text-primary">{formatPrice(growthPrice)}</span>
                          {savingsPct > 0 && (
                            <span className="block text-[10px] text-emerald-500 font-medium mt-0.5">
                              −{savingsPct}% vs Partner
                            </span>
                          )}
                        </>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                  )}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {showGrowth && (
        <p className="text-xs text-muted-foreground text-center mt-3">
          Plan Studio Growth: USD$50/mes — con 50% OFF el primer año para los primeros 100 partners
          (USD$25/mes), después USD$50/mes (−15% en plan anual). El beneficio es mayor en los tiers de
          menor volumen; en Drop y Bulk la diferencia se reduce porque el precio Starter ya tiene
          descuentos por volumen.
        </p>
      )}
    </section>
  )
}
