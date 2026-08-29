import 'server-only'

/**
 * Punto de acceso server-only al pricing de prendas — incluye funciones que
 * tocan `cost` (el costo real de produccion, nunca debe llegar a un bundle
 * cliente) y expone tambien vistas derivadas seguras (`PublicGarmentPricing`,
 * sin `cost`) para servir desde API routes a componentes 'use client'.
 *
 * Codigo server (APIs, ledger, variants, daily-attention) debe importar todo
 * esto DESDE ACÁ, nunca directamente de `./garment-pricing-data`. El paquete
 * `server-only` hace fallar el build de Next si este módulo termina importado
 * (directa o transitivamente) desde un componente 'use client'.
 */
import {
  ALL_GARMENT_PRICING,
  GARMENT_PRICING,
  EXTRA_GARMENT_PRICING,
  GROWTH_TIER_DELTA_ARS,
  VOLUME_FIELD_BY_TIER,
  type GarmentPricing,
  type GrowthTier,
} from './garment-pricing-data'

export {
  ALL_GARMENT_PRICING,
  GARMENT_PRICING,
  EXTRA_GARMENT_PRICING,
  GROWTH_TIER_DELTA_ARS,
  type GarmentPricing,
  type GrowthTier,
}

/**
 * Precio Growth/Pro de una prenda para un tier de volumen dado (default 1u).
 * = cost + delta del tier. Retorna null si la prenda no existe.
 */
export function getGrowthPrice(
  garmentKey: string,
  tier: GrowthTier = 'partner'
): number | null {
  const pricing = ALL_GARMENT_PRICING[garmentKey]
  if (!pricing) return null
  // La tote tiene override: su costo real varía por cantidad y `cost + delta`
  // daba una tabla derivada de un costo irreal (ver growth_override en data).
  if (pricing.growth_override) return pricing.growth_override[tier]
  return pricing.cost + GROWTH_TIER_DELTA_ARS[tier]
}

/**
 * Devuelve el precio que paga un partner por una prenda, segun su plan.
 * - starter: paga el tier B2B por volumen (on_demand / b2b_starter / ...)
 * - growth/pro: paga cost + delta minimo del tier → precio cercano al costo
 *
 * `tier` (default 'partner'/1u) selecciona el escalon de volumen. Retorna null
 * si la prenda no existe en el catalogo.
 */
export function getPartnerPlanPrice(
  garmentKey: string,
  plan: 'starter' | 'growth' | 'pro',
  tier: GrowthTier = 'partner'
): number | null {
  const pricing = ALL_GARMENT_PRICING[garmentKey]
  if (!pricing) return null
  if (plan === 'starter') return pricing[VOLUME_FIELD_BY_TIER[tier]] as number
  return getGrowthPrice(garmentKey, tier)
}

/** Devuelve la diferencia (margen para el partner) entre retail y precio del plan. */
export function getPlanMargin(
  garmentKey: string,
  plan: 'starter' | 'growth' | 'pro',
  tier: GrowthTier = 'partner'
): number {
  const pricing = ALL_GARMENT_PRICING[garmentKey]
  if (!pricing) return 0
  const partnerPrice = getPartnerPlanPrice(garmentKey, plan, tier) ?? 0
  return Math.max(0, pricing.b2c_suggested - partnerPrice)
}

export function getGarmentPrice(
  garmentKey: string,
  tier: 'on_demand' | 'b2b_starter' | 'b2b_pro' | 'b2b_drop'
): number | null {
  const pricing = ALL_GARMENT_PRICING[garmentKey]
  if (!pricing) return null
  return pricing[tier]
}

// ---------------------------------------------------------------------------
// Public (client-safe) pricing view — NUNCA incluye `cost`
// ---------------------------------------------------------------------------

/**
 * Vista de pricing segura para llegar a un bundle cliente o a una respuesta
 * JSON publica: son todos precios ya derivados (venta al partner, retail,
 * margen), nunca el costo real de produccion.
 */
export interface PublicGarmentPricing {
  key: string
  name: string
  on_demand: number
  b2b_starter: number
  b2b_pro: number
  b2b_drop: number
  b2b_bulk: number
  b2c_suggested: number
  /** Precio que paga el partner segun su plan actual (starter/growth/pro). */
  myPrice: number
  /** Precio Growth (1u) — solo se completa cuando el plan actual es 'starter', para mostrar el ahorro de upgradear. */
  growthPrice: number | null
  /** Margen del partner vendiendo a b2c_suggested con su plan actual. */
  margin: number
}

/**
 * Arma la vista publica de pricing para UN garment + plan, sin exponer `cost`.
 * Devuelve null si la prenda no existe en el catalogo.
 */
export function getPublicGarmentPricing(
  garmentKey: string,
  plan: 'starter' | 'growth' | 'pro'
): PublicGarmentPricing | null {
  const pricing = ALL_GARMENT_PRICING[garmentKey]
  if (!pricing) return null
  const myPrice = getPartnerPlanPrice(garmentKey, plan) ?? pricing.on_demand
  const growthPrice = plan === 'starter' ? getGrowthPrice(garmentKey, 'partner') : null
  return {
    key: pricing.key,
    name: pricing.name,
    on_demand: pricing.on_demand,
    b2b_starter: pricing.b2b_starter,
    b2b_pro: pricing.b2b_pro,
    b2b_drop: pricing.b2b_drop,
    b2b_bulk: pricing.b2b_bulk,
    b2c_suggested: pricing.b2c_suggested,
    myPrice,
    growthPrice,
    margin: getPlanMargin(garmentKey, plan),
  }
}

/** Igual que `getPublicGarmentPricing`, para todo el catalogo (design engine, catalog page). */
export function getAllPublicGarmentPricing(
  plan: 'starter' | 'growth' | 'pro'
): Record<string, PublicGarmentPricing> {
  return Object.fromEntries(
    Object.keys(ALL_GARMENT_PRICING).map((key) => [key, getPublicGarmentPricing(key, plan)!])
  )
}
