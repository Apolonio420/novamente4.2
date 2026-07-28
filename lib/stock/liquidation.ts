/**
 * Stock por talle para prendas de LIQUIDACION (proveedor viejo).
 *
 * Solo se trackean las combinaciones prenda+color que el proveedor actual NO
 * repone: buzo-oversize en marron/crema/gris-melange y remera-oversize en
 * marron. Todo lo demas (Negro, Blanco, Stone Wash, Caramel, etc.) tiene
 * reposicion permanente y NO pasa por aca — vende como siempre.
 *
 * Fuente de verdad: tabla `garment_stock` (migrations/20260728_garment_stock_liquidation.sql).
 * Los normalizadores de acá son PUROS (sin I/O) y se usan tanto client-side
 * (GarmentSelector, StockPerSize) como server-side (API route, process-payment)
 * para mapear texto libre (nombre de prenda, color, talle) a las claves
 * canonicas que espera `decrement_garment_stock`.
 */

export type LiquidationGarmentKey = "buzo-oversize" | "remera-oversize"
export type LiquidationColor = "marron" | "crema" | "gris-melange"
export type LiquidationSize = "S" | "M" | "L" | "XL"

export interface LiquidationStockRow {
  productKey: LiquidationGarmentKey
  color: LiquidationColor
  size: LiquidationSize
  qty: number
}

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // quita acentos
    .trim()
}

const GARMENT_EXCLUSIONS = /clasic|crop|infantil|musculosa|cuello redondo|bebe|lienzo|gorra|tote/

/** 'buzo-oversize' | 'remera-oversize' | null a partir de texto libre (nombre de prenda). */
export function matchGarmentKey(text: string): LiquidationGarmentKey | null {
  const t = normalizeText(text)
  if (GARMENT_EXCLUSIONS.test(t)) return null
  if (/buzo|hoodie|boston/.test(t)) return "buzo-oversize"
  if (/aura/.test(t)) return "remera-oversize"
  if (/remera|t-?shirt|tee/.test(t) && /oversiz/.test(t)) return "remera-oversize"
  return null
}

/** 'marron' | 'crema' | 'gris-melange' | null a partir de texto libre (color). Caramel/chocolate NUNCA matchean. */
export function matchStockColor(text: string): LiquidationColor | null {
  const t = normalizeText(text)
  if (/marron/.test(t)) return "marron"
  if (/crema|cream/.test(t)) return "crema"
  if (/melange|gris|gray|grey/.test(t)) return "gris-melange"
  return null
}

/** 'S' | 'M' | 'L' | 'XL' | null. Cualquier otro talle (XXL, unico, etc.) no esta trackeado. */
export function normalizeStockSize(text: string): LiquidationSize | null {
  const t = text.trim().toUpperCase()
  if (t === "S" || t === "M" || t === "L" || t === "XL") return t
  return null
}

/**
 * Lee las filas activas de `garment_stock` con el cliente admin (service role).
 * Server-only: usa import() dinamico para no arrastrar @/lib/supabase-admin
 * al bundle de cliente cuando este modulo se importa desde componentes
 * "use client" (que solo necesitan los normalizadores de arriba).
 */
export async function getLiquidationStock(): Promise<LiquidationStockRow[]> {
  const { supabaseAdmin } = await import("@/lib/supabase-admin")
  const { data, error } = await (supabaseAdmin as any)
    .from("garment_stock")
    .select("product_key, color, size, qty")
    .eq("active", true)

  if (error) throw new Error(error.message)

  return ((data || []) as any[]).map((row) => ({
    productKey: row.product_key,
    color: row.color,
    size: row.size,
    qty: row.qty,
  }))
}
