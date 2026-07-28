import { GROWTH_PROMO, GROWTH_PROMO_PCT } from "@/lib/partners/plans"

// Banner de la promo de lanzamiento (50% OFF primer año en Growth). Sin
// números inventados: NO simula un contador de "lugares tomados" — eso era
// marketing ficticio (base 66 + 1 fake por sesión), no el conteo real de la
// base de datos. El único dato mostrado (cupo total, %) sale de GROWTH_PROMO,
// la misma fuente que usa el checkout para calcular el precio y el cupo real.
export function PromoSpotsCounter({ className = "" }: { className?: string }) {
  const pct = Math.round(GROWTH_PROMO_PCT * 100)

  return (
    <div className={`mx-auto max-w-md rounded-xl border border-amber-500/40 bg-amber-500/5 p-3.5 ${className}`}>
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="text-xs font-bold uppercase tracking-wide text-amber-500">
          🔥 {pct}% OFF · primer año
        </span>
      </div>
      <p className="text-[11px] text-zinc-400">
        Solo para los primeros{" "}
        <span className="font-semibold text-amber-400 tabular-nums">{GROWTH_PROMO.maxPartners}</span> partners.
        Después, precio full.
      </p>
    </div>
  )
}
