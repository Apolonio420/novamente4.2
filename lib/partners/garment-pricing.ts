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
  /** On-demand price (1+ units, default starting tier) */
  on_demand: number
  /** B2B Starter price (5+ units/month) */
  b2b_starter: number
  /** B2B Pro price (10+ units/month) */
  b2b_pro: number
  /** B2B Drop price (30+ units/month) */
  b2b_drop: number
  /** Suggested retail price (B2C web) */
  b2c_suggested: number
}

export const GARMENT_PRICING: Record<string, GarmentPricing> = {
  'aldea-classic-tshirt': {
    key: 'aldea-classic-tshirt',
    name: 'Aldea Classic Fit T-Shirt',
    on_demand: 24696,
    b2b_starter: 23696,
    b2b_pro: 22696,
    b2b_drop: 21696,
    b2c_suggested: 28600,
  },
  'aura-oversize-tshirt': {
    key: 'aura-oversize-tshirt',
    name: 'Aura Oversize T-Shirt',
    on_demand: 25496,
    b2b_starter: 24496,
    b2b_pro: 23496,
    b2b_drop: 22496,
    b2c_suggested: 31000,
  },
  lienzo: {
    key: 'lienzo',
    name: 'Lienzo (Canvas)',
    on_demand: 15000,
    b2b_starter: 14000,
    b2b_pro: 13000,
    b2b_drop: 12000,
    b2c_suggested: 20000,
  },
}

// Additional garments not in design engine but available for partners
export const EXTRA_GARMENT_PRICING: Record<string, GarmentPricing> = {
  'remera-clasica-mujer': {
    key: 'remera-clasica-mujer',
    name: 'Remera Clásica Mujer',
    on_demand: 24696,
    b2b_starter: 23696,
    b2b_pro: 22696,
    b2b_drop: 21696,
    b2c_suggested: 28600,
  },
  'remera-crop-mujer': {
    key: 'remera-crop-mujer',
    name: 'Remera Crop Mujer',
    on_demand: 20156,
    b2b_starter: 19156,
    b2b_pro: 18156,
    b2b_drop: 17156,
    b2c_suggested: 23500,
  },
  'buzo-cuello-redondo': {
    key: 'buzo-cuello-redondo',
    name: 'Buzo Cuello Redondo',
    on_demand: 28088,
    b2b_starter: 27088,
    b2b_pro: 26088,
    b2b_drop: 25088,
    b2c_suggested: 43000,
  },
  'buzo-hoodie-unisex': {
    key: 'buzo-hoodie-unisex',
    name: 'Buzo Hoodie Oversize',
    on_demand: 30120,
    b2b_starter: 29120,
    b2b_pro: 28120,
    b2b_drop: 27120,
    b2c_suggested: 55000,
  },
  'musculosa-bali': {
    key: 'musculosa-bali',
    name: 'Musculosa Bali',
    on_demand: 18096,
    b2b_starter: 17096,
    b2b_pro: 16096,
    b2b_drop: 15096,
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
