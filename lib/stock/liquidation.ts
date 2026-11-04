/**
 * Stock por talle para prendas de LIQUIDACION (proveedor viejo).
 *
 * Solo se trackean las combinaciones prenda+color que el proveedor actual NO
 * repone: buzo-oversize en marron/crema/gris-melange y remera-oversize en
 * marron. Todo lo demas (Negro, Blanco, Stone Wash, Chocolate, etc.) tiene
 * reposicion permanente y NO pasa por aca — vende como siempre.
 *
 * "Caramel" ES la remera marron: la Aura Caramel publicada en la web es la
 * misma prenda fisica que "Remera Oversized-Marron" de la planilla del
 * proveedor viejo (confirmado por Juan 29/07). Por eso caramel -> marron.
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

/** 'marron' | 'crema' | 'gris-melange' | null a partir de texto libre (color). Caramel = marron (misma prenda); chocolate NUNCA matchea. */
export function matchStockColor(text: string): LiquidationColor | null {
  const t = normalizeText(text)
  if (/chocolate/.test(t)) return null
  if (/marron|caramel/.test(t)) return "marron"
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
 * Talles que EXISTEN del hoodie (Boston) en los colores de liquidacion
 * (Crema, Gris Melange, Marron). XS, 2XS y 2XL/XXL no hay ni hubo nunca
 * (Juan 04/11). Blanco/Negro/Stone Wash NO pasan por esta regla (XS-2XL).
 */
export const LIQUIDATION_HOODIE_SIZES: readonly LiquidationSize[] = ["S", "M", "L", "XL"]

/** true si el color es de liquidacion del hoodie (crema / gris melange / marron). */
export function isLiquidationHoodieColor(color: string | null | undefined): boolean {
  return matchStockColor(String(color ?? "")) !== null
}

/**
 * Talles ofrecibles del hoodie para un color: S-XL si es de liquidacion, o
 * `allSizes` sin tocar (colores basicos). Puro, usable en cliente y servidor.
 */
export function sizesForHoodieColor(color: string | null | undefined, allSizes: string[]): string[] {
  if (!isLiquidationHoodieColor(color)) return allSizes
  return allSizes.filter((s) => (LIQUIDATION_HOODIE_SIZES as readonly string[]).includes(s.trim().toUpperCase()))
}

/**
 * Remera Aura (oversize) en Caramel = remera marron de liquidacion: tambien
 * existe solo en S-XL. 2XS, XS y 2XL no hay (Juan 04/11). Negro, Blanco y
 * Stone Wash siguen 2XS-2XL.
 */
export const LIQUIDATION_TEE_SIZES: readonly LiquidationSize[] = ["S", "M", "L", "XL"]

/** true si el color de la Aura es el de liquidacion (caramel / marron). */
export function isLiquidationTeeColor(color: string | null | undefined): boolean {
  return matchStockColor(String(color ?? "")) === "marron"
}

/** Talles ofrecibles de la Aura para un color: S-XL en Caramel, `allSizes` en el resto. */
export function sizesForAuraColor(color: string | null | undefined, allSizes: string[]): string[] {
  if (!isLiquidationTeeColor(color)) return allSizes
  return allSizes.filter((s) => (LIQUIDATION_TEE_SIZES as readonly string[]).includes(s.trim().toUpperCase()))
}

/**
 * false si es una prenda de liquidacion (hoodie en crema / gris melange /
 * marron, o Aura en caramel) con un talle que no existe (XS, 2XS, 2XL,
 * XXL...). Cualquier otra combinacion devuelve true.
 */
export function isHoodieSizeAllowed(
  garmentText: string | null | undefined,
  color: string | null | undefined,
  size: string | null | undefined,
): boolean {
  const garment = matchGarmentKey(String(garmentText ?? ""))
  if (garment === "buzo-oversize") {
    if (!isLiquidationHoodieColor(color)) return true
  } else if (garment === "remera-oversize") {
    if (!isLiquidationTeeColor(color)) return true
  } else {
    return true
  }
  const t = String(size ?? "").trim()
  if (!t) return true
  return normalizeStockSize(t) !== null
}

/** Alias con nombre general: cubre hoodie y Aura de liquidacion. */
export const isLiquidationSizeAllowed = isHoodieSizeAllowed

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
