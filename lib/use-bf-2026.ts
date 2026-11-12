"use client"

import { useEffect, useState } from "react"
import { bf2026DisplayPrice } from "@/lib/offers"

/**
 * Precio Black Friday 2026 para MOSTRAR en /crear (tachado + precio BF), con la
 * hora del navegador recién al montar (evita que el HTML prerenderizado sin
 * promo choque con el del cliente) y re-evaluado cada minuto: a las 00:00 del
 * 01/12 el tachado desaparece solo. Lo que se cobra lo decide el servidor
 * (lib/checkout/precio-real.ts) con la misma regla de lib/offers.ts.
 */
export function useBf2026Now(): number | null {
  const [now, setNow] = useState<number | null>(null)
  useEffect(() => {
    setNow(Date.now())
    const t = setInterval(() => setNow(Date.now()), 60_000)
    return () => clearInterval(t)
  }, [])
  return now
}

/** Precio BF (sin dorso) de una prenda de /crear ahora, o null. */
export function useBf2026Price(garmentKey: string | null | undefined): number | null {
  const now = useBf2026Now()
  if (now === null || !garmentKey) return null
  return bf2026DisplayPrice(garmentKey, now)
}
