import type { Offer } from "@/lib/offers"

export interface OfferTarget {
  tenantSlug: string
  productSlug: string
}

/** Extrae tenant/producto de la URL /p/<tenant>/<producto>. null si no matchea. */
export function parseOfferTarget(url: string): OfferTarget | null {
  try {
    const parts = new URL(url).pathname.split("/").filter(Boolean)
    if (parts.length === 3 && parts[0] === "p") {
      return { tenantSlug: parts[1], productSlug: parts[2] }
    }
  } catch {
    // url invalida
  }
  return null
}

export interface RowPrices {
  price: number
  compare_at_price: number | null
}

export type SyncDecision =
  | { action: "none"; reason: string }
  | { action: "update"; price: number; compare_at_price: number | null; reason: string }

/**
 * Decide que hacer con una fila de partner_products para una oferta. Pura.
 * - Antes de empezar: no toca nada.
 * - Activa: price=priceCurrent, compare_at_price=priceOriginal.
 * - Terminada: restaura SOLO si la fila todavia tiene price === priceCurrent
 *   (si alguien la edito a mano, no se pisa).
 */
export const STALE_AFTER_MS = 48 * 3600_000

export function decidePriceSync(
  offer: Pick<Offer, "priceCurrent" | "priceOriginal" | "startsAt" | "endsAt">,
  row: RowPrices,
  now: Date = new Date(),
): SyncDecision {
  const ts = now.getTime()
  const start = new Date(offer.startsAt).getTime()
  const end = new Date(offer.endsAt).getTime()
  if (ts < start) return { action: "none", reason: "not_started" }
  if (ts > end + STALE_AFTER_MS) return { action: "none", reason: "stale_offer" }

  const applied = row.price === offer.priceCurrent && row.compare_at_price === offer.priceOriginal

  if (ts <= end) {
    if (applied) return { action: "none", reason: "already_applied" }
    if (row.price !== offer.priceOriginal) return { action: "none", reason: "price_mismatch" }
    return { action: "update", price: offer.priceCurrent, compare_at_price: offer.priceOriginal, reason: "apply" }
  }

  // Terminada: restaurar solo si la fila la escribio el cron.
  if (applied) {
    return { action: "update", price: offer.priceOriginal, compare_at_price: null, reason: "restore" }
  }
  return { action: "none", reason: "ended_not_cron_written" }
}
