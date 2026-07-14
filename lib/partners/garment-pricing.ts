/**
 * Tier logic para pricing de partners — sin ningun dato de costo/precio crudo.
 *
 * Este modulo es seguro de importar desde componentes 'use client': no
 * depende de `garment-pricing-data.ts` (que tiene el campo `cost`, el costo
 * real de produccion — INNEGOCIABLE que viaje a un bundle cliente).
 *
 * Codigo que necesite precios reales (on_demand, b2b_*, b2c_suggested,
 * getPartnerPlanPrice, getPlanMargin, getPublicGarmentPricing, etc.) debe
 * importar `./garment-pricing.server` (server-only) y, si el consumidor final
 * es un componente cliente, servir esos valores ya derivados via una API route
 * o server component — nunca importar el catalogo crudo directo.
 *
 * Ver docs/reviews/REVIEW-caminos-de-plata-2026-07-03.md hallazgo [1] (cerrado
 * 2026-07-04) y garment-pricing.server.test.ts.
 */

// Tiers son por volumen de venta mensual (unidades vendidas en el mes
// calendario actual). Los partners arrancan en on_demand y desbloquean
// automaticamente mejores precios a medida que venden mas.

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

export function getNextTier(currentTier: PricingTier): { tier: PricingTier; minUnits: number; label: string } | null {
  const idx = TIER_THRESHOLDS.findIndex(t => t.tier === currentTier)
  if (idx < 0 || idx >= TIER_THRESHOLDS.length - 1) return null
  return TIER_THRESHOLDS[idx + 1]
}

export { formatPrice } from './format-price'
