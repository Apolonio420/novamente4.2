/**
 * Costo del PARTNER por prenda — fuente única.
 *
 * Es lo que el partner le paga a Novamente por cada prenda que vende en su tienda:
 *   costo = precio del plan (CATALOG vía getPartnerPlanPrice: starter → tier
 *           "partner" on_demand; growth/pro → costo + delta)
 *         + recargo por doble estampa si la prenda se estampa en LAS DOS CARAS
 *           ($3.500, tote $5.000 — `lib/pricing/recargo-doble-estampa.ts`).
 *
 * Regla de negocio (Juan, 27/09/2026): el recargo se cobra COMPLETO por cualquier
 * prenda estampada en frente y dorso (o nuca), sin importar el tamaño de cada
 * estampa. Una sola cara (aunque sea solo el dorso) = simple, sin recargo.
 *
 * Lo usan: el ledger (ganancia que se le acredita al partner por una venta web),
 * `resolveProductCost` (piso de precio del checkout + gate de publicación + costo
 * que el partner ve en su catálogo). Antes cada uno ignoraba la doble estampa y al
 * partner se le acreditaban $3.500 de más por cada prenda con dorso.
 *
 * NUNCA incluye el costo del proveedor (Dreamful) ni el margen de Novamente: este
 * número se le muestra al partner. La clase de estampa para el proveedor
 * (`claseEstampaProveedor`) es solo una etiqueta de tamaño que usa el admin
 * interno (platform) para buscar el costo en `supplier_costs`.
 */
import { getPartnerPlanPrice, ALL_GARMENT_PRICING } from './garment-pricing.server'
import { recargoDorsoPara } from '@/lib/pricing/recargo-doble-estampa'
import { readPrintArt, type PrintSpec } from './print-art'
import type { Plan } from './types'

type Meta = Record<string, unknown> | null | undefined

/** Heurística model/categoría → garment key del pricing. */
export function guessGarmentKey(raw: string): string | null {
  const s = raw.toLowerCase()
  if (/aura|oversize/.test(s) && /remera|tshirt|t-shirt|shirt/.test(s)) return 'aura-oversize-tshirt'
  if (/aldea|classic/.test(s) && /remera|tshirt|t-shirt|shirt/.test(s)) return 'aldea-classic-tshirt'
  if (/hoodie|boston|capucha/.test(s)) return 'buzo-hoodie-unisex'
  if (/crewneck|berlin|cuello redondo/.test(s)) return 'buzo-cuello-redondo'
  if (/crop|bahamas/.test(s)) return 'remera-crop-mujer'
  if (/musculosa|bali/.test(s)) return 'musculosa-bali'
  if (/buenos aires|mujer/.test(s) && /remera/.test(s)) return 'remera-clasica-mujer'
  if (/remera|tshirt|t-shirt/.test(s)) return 'aura-oversize-tshirt' // remera genérica → la más vendida
  if (/buzo/.test(s)) return 'buzo-hoodie-unisex'
  return null
}

/** true si el producto (metadata de partner_products) se estampa en las dos caras. */
export function esDobleEstampa(metadata: Meta): boolean {
  const { front, back } = readPrintArt(metadata)
  return !!front && !!back
}

function specOf(v: unknown): PrintSpec | null {
  return v && typeof v === 'object' ? (v as PrintSpec) : null
}

function specUrl(v: unknown): string {
  const url = specOf(v)?.designUrl
  return typeof url === 'string' ? url.trim() : ''
}

interface ItemConArte {
  front_design_url?: string | null
  back_design_url?: string | null
  metadata?: Meta
}

/**
 * ¿Esta prenda VENDIDA se estampó en las dos caras? Mira primero lo que quedó
 * registrado en el ítem del pedido (es lo que va a producción), y solo si el ítem
 * no tiene ningún dato de arte cae a la metadata actual del producto (pedidos
 * viejos).
 *   1. `order_items.metadata.doble_estampa` (boolean, lo escribe el checkout)
 *   2. arte del ítem: `front/back_design_url` o `metadata.print_front/print_back`
 *   3. `partner_products.metadata` (readPrintArt)
 */
export function esDobleEstampaItem(item: ItemConArte, productMetadata: Meta): boolean {
  const im = (item.metadata || {}) as Record<string, unknown>
  if (typeof im.doble_estampa === 'boolean') return im.doble_estampa

  const front = (item.front_design_url || '').trim() || specUrl(im.print_front)
  const back = (item.back_design_url || '').trim() || specUrl(im.print_back)
  if (front || back) return !!front && !!back

  return esDobleEstampa(productMetadata)
}

export type ClaseEstampaProveedor = 'No' | 'Chica' | 'Si'

/** Una estampa "chica" para el proveedor: nuca, logo de pecho o ≤ 12 cm de ancho. */
function esEstampaChica(spec: PrintSpec | null): boolean {
  if (!spec) return false
  if (spec.stampMode === 'chest-logo') return true
  if (typeof spec.placement === 'string' && /nuca|pecho|chest/i.test(spec.placement)) return true
  return typeof spec.widthCm === 'number' && spec.widthCm > 0 && spec.widthCm <= 12
}

/**
 * Clase de estampa para el costo del PROVEEDOR (misma enum que usa platform en
 * `supplier_costs`: 'No' → cost_1_print, 'Chica' → cost_chica, 'Si' → cost_2_print).
 * Solo para el admin interno — al partner se le cobra el recargo completo igual.
 */
export function claseEstampaProveedor(item: ItemConArte, productMetadata: Meta): ClaseEstampaProveedor {
  if (!esDobleEstampaItem(item, productMetadata)) return 'No'
  const im = (item.metadata || {}) as Record<string, unknown>
  const pm = ((productMetadata || {}) as Record<string, unknown>).print as Record<string, unknown> | undefined
  const front = specOf(im.print_front) ?? specOf(pm?.front)
  const back = specOf(im.print_back) ?? specOf(pm?.back)
  return esEstampaChica(front) || esEstampaChica(back) ? 'Chica' : 'Si'
}

/**
 * Garment key del pricing para un producto: `metadata.garmentKey` si es válido;
 * si no, la heurística sobre los `fallbacks` que pase el caller (model,
 * categoría, nombre del ítem…). `via` explica de dónde salió (auditoría).
 */
export function resolvePartnerGarmentKey(
  metadata: Meta,
  fallbacks: Array<string | null | undefined> = [],
): { garmentKey: string | null; via: string } {
  const meta = (metadata || {}) as Record<string, unknown>
  const gk = typeof meta.garmentKey === 'string' ? meta.garmentKey : null
  if (gk && ALL_GARMENT_PRICING[gk]) return { garmentKey: gk, via: `garmentKey:${gk}` }
  for (const candidate of fallbacks) {
    if (!candidate) continue
    const guessed = guessGarmentKey(candidate)
    if (guessed && ALL_GARMENT_PRICING[guessed]) return { garmentKey: guessed, via: `guess:${guessed}` }
  }
  return { garmentKey: null, via: 'unresolved' }
}

export interface CostoPartner {
  /** null cuando el costo salió de metadata.cost_partner (sin prenda resoluble). */
  garmentKey: string | null
  /** Precio de la prenda según el plan (sin recargo). */
  base: number
  /** Recargo por doble estampa (0 si es simple). */
  recargoDoble: number
  /** base + recargoDoble — lo que paga el partner por UNA prenda. */
  total: number
  via: string
}

/**
 * Costo del partner por UNA prenda. El precio del plan es SIEMPRE la fuente de
 * verdad cuando la prenda es resoluble; `metadata.cost_partner/cost_ars` es solo
 * el último recurso (un partner no puede inflar su ganancia escribiendo metadata).
 * Devuelve null si no hay forma de saber el costo.
 */
export function costoPartnerUnitario(opts: {
  metadata: Meta
  plan: Plan
  doble: boolean
  fallbacks?: Array<string | null | undefined>
}): CostoPartner | null {
  const { garmentKey, via } = resolvePartnerGarmentKey(opts.metadata, opts.fallbacks)
  if (garmentKey) {
    const base = getPartnerPlanPrice(garmentKey, opts.plan)
    if (base) {
      const recargoDoble = opts.doble ? recargoDorsoPara(garmentKey) : 0
      return { garmentKey, base, recargoDoble, total: base + recargoDoble, via }
    }
  }
  const meta = (opts.metadata || {}) as Record<string, unknown>
  const explicit = Number(meta.cost_partner ?? meta.cost_ars)
  if (Number.isFinite(explicit) && explicit > 0) {
    const recargoDoble = opts.doble ? recargoDorsoPara(null) : 0
    return { garmentKey: null, base: explicit, recargoDoble, total: explicit + recargoDoble, via: 'metadata.cost' }
  }
  return null
}
