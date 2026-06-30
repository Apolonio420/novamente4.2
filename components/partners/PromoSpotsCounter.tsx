"use client"

import { useEffect, useState } from "react"

// Contador de "lugares" de la promo de lanzamiento (50% OFF primer año para los
// primeros 100 partners). El número es de marketing (base 66), NO es el conteo
// real de la base de datos: arranca en BASE y "se va llenando" de a poco para
// generar urgencia. Reutilizable en todas las superficies de planes.
const TOTAL = 100
const BASE_TAKEN = 66
const CAP = 93 // nunca llega a 100: siempre quedan lugares

export function PromoSpotsCounter({ className = "" }: { className?: string }) {
  const [taken, setTaken] = useState(BASE_TAKEN)

  useEffect(() => {
    // sube de a 1 cada ~9s (40% de chance por tick) → la barra "se llena" sola
    const id = setInterval(() => {
      setTaken((t) => (t >= CAP ? t : Math.random() < 0.4 ? t + 1 : t))
    }, 9000)
    return () => clearInterval(id)
  }, [])

  const pct = Math.round((taken / TOTAL) * 100)
  const left = TOTAL - taken

  return (
    <div className={`mx-auto max-w-md rounded-xl border border-amber-500/40 bg-amber-500/5 p-3.5 ${className}`}>
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="text-xs font-bold uppercase tracking-wide text-amber-500">
          🔥 50% OFF · primer año
        </span>
        <span className="text-xs font-semibold text-amber-400 tabular-nums">
          {taken}/{TOTAL} lugares
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-700/60">
        <div
          className="h-full rounded-full bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 transition-all duration-700 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="mt-1.5 text-[11px] text-zinc-400">
        Solo para los primeros {TOTAL} partners — quedan{" "}
        <span className="font-semibold text-amber-400 tabular-nums">{left}</span>. Después, precio full.
      </p>
    </div>
  )
}
