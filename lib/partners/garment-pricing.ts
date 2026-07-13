/**
 * Garment pricing for partners.
 *
 * Tiers are based on monthly sales volume (units sold in the current calendar month).
 * Partners start at on_demand and automatically unlock better prices as they sell more.
 *
 * Synced from whatsapp-sales-bot/lib/payments/payment-link.ts CATALOG.
 */

export interface GarmentPricing {
  key: string
  name: string
  /**
   * Costo real de produccion (peor color por familia, Cost_2_Print del Excel 2.6.26 dreamful).
   * Base para calcular precio Growth/Pro = cost + GROWTH_TIER_DELTA_ARS[tier].
   * Precio unico por familia para respetar regla comercial "mismo precio todos los colores".
   * INNEGOCIABLE: nunca renderizar este valor en UI/API del lado del cliente.
   *
   * Codigo SERVER debe importar este objeto via `./garment-pricing.server`
   * (que envuelve `server-only`), no desde este archivo directamente. Este
   * archivo original sigue siendo importado por codigo cliente existente
   * (ver app/workspace/design-engine/page.tsx, app/workspace/catalog/page.tsx,
   * components/workspace/MarginBreakdown.tsx, components/partners/storefront-designer.tsx)
   * asi que `cost` todavia viaja al bundle publico para esos 4 casos — pendiente
   * de extraccion en una sesion futura. `garment-pricing.server.ts` es la fuente
   * de verdad server-only para trabajo nuevo.
   */
  cost: number
  /** B2B Partner price (1u, retail B2B publicado en /b2b-precios-2026). */
  on_demand: number
  /** B2B Starter price (5-9 units/month, volume-based) */
  b2b_starter: number
  /** B2B Pro price (10-20 units/month, volume-based) */
  b2b_pro: number
  /** B2B Drop price (30-99 units/month, volume-based) */
  b2b_drop: number
  /** B2B Bulk price (100+ units/month, volume-based) */
  b2b_bulk: number
  /** Suggested retail price (B2C web). What Starter plan partners pay. */
  b2c_suggested: number
}

// ---------------------------------------------------------------------------
// Plan-based pricing (Re-arquitectura 2026-05 · costos Dreamful 2026-06)
// ---------------------------------------------------------------------------
//
// Tres niveles de precio que paga un partner segun su plan:
//   Starter (gratis): tier B2B por volumen publicado en /b2b-precios-2026
//                     (on_demand / b2b_starter / ...). Es el "precio amigo" base.
//   Growth (USD$50): precio cercano al costo. Beneficio de la suscripcion.
//   Pro (USD$100):   mismo precio que Growth + servicios extra.
// b2c_suggested es solo el precio web sugerido que el partner usa en su
// storefront para vender a clientes finales; NO es el precio que el partner paga.
//
// Ver docs/seo/REARQUITECTURA-2026-05.md para la decision completa.

/**
 * Delta (en ARS) que se suma al costo base para obtener el precio Growth/Pro,
 * segun el tier de volumen. El descuento por volumen es leve a proposito: el
 * precio ya esta a costo y no hay margen para descontar mas en niveles altos.
 *   precio_growth = cost + GROWTH_TIER_DELTA_ARS[tier]
 * Como depende solo del costo, los precios Growth se recalculan solos cuando
 * cambian los costos (no hay tabla separada que mantener).
 */
export const GROWTH_TIER_DELTA_ARS = {
  partner: 1000,
  starter: 800,
  pro: 600,
  drop: 400,
  bulk: 200,
} as const

// REGLA DEL 8% (mantener al cambiar costos/precios): pasarse a Growth debe ahorrar
// al menos 8% en el tier de entrada (Partner 1u). Es decir:
//   on_demand (Partner normal) >= getGrowthPrice(key,'partner') / 0.92  (redondeado hacia arriba a la centena)
// Al actualizar costos: recalcular Growth (cost + delta) y, si algun on_demand no
// cumple, subirlo al minimo que la satisface. Fuente: Excel 'Plan_Precios_Futuro'.

export type GrowthTier = keyof typeof GROWTH_TIER_DELTA_ARS

/** Campo de precio por volumen (plan starter) asociado a cada GrowthTier. */
const VOLUME_FIELD_BY_TIER: Record<GrowthTier, keyof GarmentPricing> = {
  partner: 'on_demand',
  starter: 'b2b_starter',
  pro: 'b2b_pro',
  drop: 'b2b_drop',
  bulk: 'b2b_bulk',
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

// ADVERTENCIA: estos objetos contienen `cost` (costo real de produccion). Codigo
// server debe importarlos desde `./garment-pricing.server` (server-only), NUNCA
// directamente desde acá si el consumidor puede terminar en un bundle cliente.
export const GARMENT_PRICING: Record<string, GarmentPricing> = {
  'aldea-classic-tshirt': {
    key: 'aldea-classic-tshirt',
    name: 'Aldea Classic Fit T-Shirt',
    cost: 22670,
    on_demand: 25800,
    b2b_starter: 25100,
    b2b_pro: 24400,
    b2b_drop: 23800,
    b2b_bulk: 23600,
    b2c_suggested: 28600,
  },
  'aura-oversize-tshirt': {
    key: 'aura-oversize-tshirt',
    name: 'Aura Oversize T-Shirt',
    cost: 23470,
    on_demand: 26600,
    b2b_starter: 25900,
    b2b_pro: 25100,
    b2b_drop: 24300,
    b2b_bulk: 23600,
    b2c_suggested: 31000,
  },
  // Lienzo (Canvas) discontinuado del catalogo partner el 2026-05-18.
  // Si vuelve a ofrecerse, reagregar entrada con campo cost del Excel.
}

// Additional garments not in design engine but available for partners.
// ADVERTENCIA: contiene `cost` — mismo criterio que GARMENT_PRICING arriba.
export const EXTRA_GARMENT_PRICING: Record<string, GarmentPricing> = {
  'remera-clasica-mujer': {
    key: 'remera-clasica-mujer',
    name: 'Remera Clásica Mujer',
    cost: 22670,
    on_demand: 25800,
    b2b_starter: 25100,
    b2b_pro: 24400,
    b2b_drop: 23800,
    b2b_bulk: 23600,
    b2c_suggested: 28600,
  },
  'remera-crop-mujer': {
    key: 'remera-crop-mujer',
    name: 'Remera Crop Mujer',
    cost: 18100,
    on_demand: 20800,
    b2b_starter: 20300,
    b2b_pro: 19800,
    b2b_drop: 19300,
    b2b_bulk: 18900,
    b2c_suggested: 23500,
  },
  'remera-infantil': {
    key: 'remera-infantil',
    name: 'Bambino Remera Infantil',
    cost: 18100,
    on_demand: 20800,
    b2b_starter: 20300,
    b2b_pro: 19800,
    b2b_drop: 19300,
    b2b_bulk: 18900,
    b2c_suggested: 23500,
  },
  'buzo-cuello-redondo': {
    key: 'buzo-cuello-redondo',
    name: 'Buzo Cuello Redondo',
    cost: 28170,
    on_demand: 32200,
    b2b_starter: 31200,
    b2b_pro: 30200,
    b2b_drop: 29200,
    b2b_bulk: 28200,
    b2c_suggested: 43000,
  },
  'buzo-hoodie-unisex': {
    key: 'buzo-hoodie-unisex',
    name: 'Buzo Hoodie Oversize',
    cost: 30170,
    on_demand: 38700,
    b2b_starter: 36600,
    b2b_pro: 34500,
    b2b_drop: 32400,
    b2b_bulk: 30300,
    b2c_suggested: 55000,
  },
  'musculosa-bali': {
    key: 'musculosa-bali',
    name: 'Musculosa Bali',
    cost: 18100,
    on_demand: 20800,
    b2b_starter: 20700,
    b2b_pro: 20500,
    b2b_drop: 20300,
    b2b_bulk: 20100,
    b2c_suggested: 21800,
  },
  'totebag': {
    key: 'totebag',
    name: 'Bahía Totebag',
    cost: 16000,
    on_demand: 18500,
    b2b_starter: 18000,
    b2b_pro: 17500,
    b2b_drop: 17000,
    b2b_bulk: 16600,
    b2c_suggested: 20900,
  },
}

/**
 * All garments combined (design engine + extras).
 * ADVERTENCIA: contiene `cost` en cada entry — usar `./garment-pricing.server`
 * desde código server; el campo cost nunca debe llegar a un bundle client.
 */
export const ALL_GARMENT_PRICING: Record<string, GarmentPricing> = {
  ...GARMENT_PRICING,
  ...EXTRA_GARMENT_PRICING,
}

// ---------------------------------------------------------------------------
// Tier logic
// ---------------------------------------------------------------------------

export type PricingTier = 'on_demand' | 'b2b_starter' | 'b2b_pro' | 'b2b_drop'

export const TIER_THRESHOLDS: { tier: PricingTier; minUnits: number; label: string }[] = [
  { tier: 'on_demand', minUnits: 0, label: 'On Demand' },
  { tier: 'b2b_starter', minUnits: 5, label: 'Starter' },
  { tier: 'b2b_pro', minUnits: 10, label: 'Pro' },
  { tier: 'b2b_drop', minUnits: 30, label: 'Drop' },
]

export function getTierForVolume(monthlyUnits: number): PricingTier {
  if (monthlyUnits >= 30) return 'b2b_drop'
  if (monthlyUnits >= 10) return 'b2b_pro'
  if (monthlyUnits >= 5) return 'b2b_starter'
  return 'on_demand'
}

export function getTierLabel(tier: PricingTier): string {
  return TIER_THRESHOLDS.find(t => t.tier === tier)?.label || 'On Demand'
}

export function getGarmentPrice(garmentKey: string, tier: PricingTier): number | null {
  const pricing = ALL_GARMENT_PRICING[garmentKey]
  if (!pricing) return null
  return pricing[tier]
}

export function getNextTier(currentTier: PricingTier): { tier: PricingTier; minUnits: number; label: string } | null {
  const idx = TIER_THRESHOLDS.findIndex(t => t.tier === currentTier)
  if (idx < 0 || idx >= TIER_THRESHOLDS.length - 1) return null
  return TIER_THRESHOLDS[idx + 1]
}

export function formatPrice(amount: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}
