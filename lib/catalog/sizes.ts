/**
 * Talles por prenda — UNA fuente: el catálogo (lib/catalog/products.ts).
 *
 * Antes /crear (chat y canvas) y el legacy /design tenían su propia lista fija
 * de adulto (XS-XXL / S-XXL) para TODAS las prendas. La remera infantil
 * (Bambino, talles 4 a 16) se vendía en S/M/L: el pedido NOV-20261105-9051
 * salió con talle "L" y el proveedor solo trabaja 4-16 (Juan 05/11).
 *
 * Puro: usable en cliente y servidor.
 */
import { getCatalogProduct } from "./products"
import { sizesForAuraColor, sizesForHoodieColor } from "@/lib/stock/liquidation"

/** Talles de la remera infantil (Bambino). Mismos que el catálogo. */
export const KIDS_SIZES = ["4", "6", "8", "10", "12", "14", "16"] as const

/** Tabla del proveedor (pecho / largo, en cm) — Juan 05/11/2026. */
export const KIDS_SIZE_TABLE: ReadonlyArray<{ size: (typeof KIDS_SIZES)[number]; chestCm: number; lengthCm: number }> = [
  { size: "4", chestCm: 38, lengthCm: 53 },
  { size: "6", chestCm: 40, lengthCm: 55 },
  { size: "8", chestCm: 42, lengthCm: 57 },
  { size: "10", chestCm: 44, lengthCm: 59 },
  { size: "12", chestCm: 46, lengthCm: 61 },
  { size: "14", chestCm: 48, lengthCm: 63 },
  { size: "16", chestCm: 50, lengthCm: 66 },
]

const FALLBACK_ADULT_SIZES = ["S", "M", "L", "XL"]

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
}

/** true si la prenda (key del catálogo o texto libre del pedido) es la infantil. */
export function isKidsGarment(garment: string | null | undefined): boolean {
  const t = normalize(String(garment ?? ""))
  return /remera-infantil|infantil|bambino|\bkids?\b|\bnin(o|a|os|as)\b/.test(t)
}

/**
 * Talles ofrecibles para una prenda del catálogo y un color. Respeta la
 * liquidación (hoodie crema/gris/marrón y Aura caramel: solo S-XL).
 */
export function sizesForGarment(garmentKey: string, color?: string | null): string[] {
  const product = getCatalogProduct(garmentKey)
  if (!product) return isKidsGarment(garmentKey) ? [...KIDS_SIZES] : FALLBACK_ADULT_SIZES
  const all = product.sizes
  if (garmentKey === "buzo-hoodie-unisex") return sizesForHoodieColor(color, all)
  if (garmentKey === "aura-oversize-tshirt") return sizesForAuraColor(color, all)
  return all
}

/**
 * Talle por defecto al elegir/cambiar de prenda: se conserva el actual si
 * existe en la prenda nueva; si no, M (o el del medio, en la infantil).
 */
export function pickSizeFor(sizes: readonly string[], current: string | null | undefined): string {
  if (current && sizes.includes(current)) return current
  if (sizes.includes("M")) return "M"
  return sizes[Math.floor((sizes.length - 1) / 2)] ?? "M"
}

/** Imagen de la tabla de medidas de la prenda (catálogo), o null. */
export function sizeChartForGarment(garmentKey: string): string | null {
  return getCatalogProduct(garmentKey)?.measurementsImage ?? null
}

/**
 * Validación server-side del talle contra el tipo de prenda: la infantil solo
 * acepta 4-16, y una prenda de adulto no acepta un talle infantil. Texto libre
 * (lo que llega del carrito/pedido). Talle vacío = no se valida acá.
 */
export function isSizeValidForGarment(garment: string | null | undefined, size: string | null | undefined): boolean {
  const s = String(size ?? "").trim().toUpperCase()
  if (!s || !String(garment ?? "").trim()) return true
  const isKidsSize = (KIDS_SIZES as readonly string[]).includes(s)
  if (isKidsGarment(garment)) return isKidsSize
  return !isKidsSize
}
