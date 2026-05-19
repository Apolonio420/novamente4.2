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
   * Costo real de produccion (peor color por familia, Cost_2_Print del Excel 1.5.26).
   * Base para calcular precio Growth/Pro = cost + PLAN_GROWTH_PRO_MARGIN_ARS.
   * Precio unico por familia para respetar regla comercial "mismo precio todos los colores".
   */
  cost: number
  /** B2B Partner price (1u, retail B2B publicado en /b2b-precios-2026). */
  on_demand: number
  /** B2B Starter price (5+ units/month, legacy volume-based) */
  b2b_starter: number
  /** B2B Pro price (10+ units/month, legacy volume-based) */
  b2b_pro: number
  /** B2B Drop price (30+ units/month, legacy volume-based) */
  b2b_drop: number
  /** Suggested retail price (B2C web). What Starter plan partners pay. */
  b2c_suggested: number
}

// ---------------------------------------------------------------------------
// Plan-based pricing (Re-arquitectura 2026-05)
// ---------------------------------------------------------------------------
//
// Tres niveles de precio que paga un partner segun su plan:
//   Starter (gratis): tier B2B Partner 1u publicado en /b2b-precios-2026
//                     (= on_demand). Es el "precio amigo" base.
//   Growth (USD$50): markup minimo sobre costo real. Ventaja sustancial
//                    vs Starter, pensado para partners que ya venden.
//   Pro (USD$100):   mismo precio que Growth + servicios extra.
// b2c_suggested es solo el precio web sugerido que el partner usa en su
// storefront para vender a clientes finales; NO es el precio que el partner paga.
//
// Ver docs/seo/REARQUITECTURA-2026-05.md para la decision completa.

/** Markup interno aplicado al costo real para partners Growth/Pro. */
export const PLAN_GROWTH_PRO_MARGIN_ARS = 2000

/**
 * Devuelve el precio que paga un partner por una prenda, segun su plan.
 * - starter: paga el tier B2B Partner 1u (on_demand) — precio publico amigo
 * - growth/pro: paga cost + markup minimo → mejor margen propio
 *
 * Retorna null si la prenda no existe en el catalogo.
 */
export function getPartnerPlanPrice(
  garmentKey: string,
  plan: 'starter' | 'growth' | 'pro'
): number | null {
  const pricing = ALL_GARMENT_PRICING[garmentKey]
  if (!pricing) return null
  if (plan === 'starter') return pricing.on_demand
  return pricing.cost + PLAN_GROWTH_PRO_MARGIN_ARS
}

/** Devuelve la diferencia (margen para el partner) entre retail y precio del plan. */
export function getPlanMargin(
  garmentKey: string,
  plan: 'starter' | 'growth' | 'pro'
): number {
  const pricing = ALL_GARMENT_PRICING[garmentKey]
  if (!pricing) return 0
  const partnerPrice = getPartnerPlanPrice(garmentKey, plan) ?? 0
  return Math.max(0, pricing.b2c_suggested - partnerPrice)
}

export const GARMENT_PRICING: Record<string, GarmentPricing> = {
  'aldea-classic-tshirt': {
    key: 'aldea-classic-tshirt',
    name: 'Aldea Classic Fit T-Shirt',
    cost: 19696,
    on_demand: 25700,
    b2b_starter: 24700,
    b2b_pro: 23700,
    b2b_drop: 22700,
    b2c_suggested: 28600,
  },
  'aura-oversize-tshirt': {
    key: 'aura-oversize-tshirt',
    name: 'Aura Oversize T-Shirt',
    cost: 20496,
    on_demand: 25400,
    b2b_starter: 24700,
    b2b_pro: 21800,
    b2b_drop: 23200,
    b2c_suggested: 31000,
  },
  // Lienzo (Canvas) discontinuado del catalogo partner el 2026-05-18.
  // Si vuelve a ofrecerse, reagregar entrada con campo cost del Excel.
}

// Additional garments not in design engine but available for partners
export const EXTRA_GARMENT_PRICING: Record<string, GarmentPricing> = {
  'remera-clasica-mujer': {
    key: 'remera-clasica-mujer',
    name: 'Remera Clásica Mujer',
    cost: 19696,
    on_demand: 25700,
    b2b_starter: 24700,
    b2b_pro: 23700,
    b2b_drop: 22700,
    b2c_suggested: 28600,
  },
  'remera-crop-mujer': {
    key: 'remera-crop-mujer',
    name: 'Remera Crop Mujer',
    cost: 15156,
    on_demand: 19300,
    b2b_starter: 18800,
    b2b_pro: 18200,
    b2b_drop: 17700,
    b2c_suggested: 23500,
  },
  'buzo-cuello-redondo': {
    key: 'buzo-cuello-redondo',
    name: 'Buzo Cuello Redondo',
    cost: 26170,
    on_demand: 32200,
    b2b_starter: 31200,
    b2b_pro: 30200,
    b2b_drop: 29200,
    b2c_suggested: 43000,
  },
  'buzo-hoodie-unisex': {
    key: 'buzo-hoodie-unisex',
    name: 'Buzo Hoodie Oversize',
    cost: 28170,
    on_demand: 38700,
    b2b_starter: 36600,
    b2b_pro: 34500,
    b2b_drop: 32400,
    b2c_suggested: 55000,
  },
  'musculosa-bali': {
    key: 'musculosa-bali',
    name: 'Musculosa Bali',
    cost: 13096,
    on_demand: 17400,
    b2b_starter: 16800,
    b2b_pro: 16200,
    b2b_drop: 15700,
    b2c_suggested: 21800,
  },
}

/** All garments combined (design engine + extras) */
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
