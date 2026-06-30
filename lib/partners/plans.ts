import type { Plan, DesignEngineMode } from './types'

export interface PlanFeatures {
  maxProducts: number
  maxLeadsPerMonth: number
  seoIndexable: boolean
  geoOptimized: boolean
  semReady: boolean
  designEngine: DesignEngineMode
  storefrontDesigner: boolean
  chatbot: boolean
  metaBusinessSetup: boolean
  metaAdsTemplates: boolean
  analytics: 'none' | 'basic' | 'advanced'
  badgeRemovable: boolean
  supportLevel: 'none' | 'email' | 'whatsapp'
  feedExport: boolean
  onboardingCall: boolean
  brandingFull: boolean
}

export const PLAN_FEATURES: Record<Plan, PlanFeatures> = {
  starter: {
    maxProducts: 10,
    maxLeadsPerMonth: 20,
    seoIndexable: false,
    geoOptimized: false,
    semReady: false,
    designEngine: 'presets',
    storefrontDesigner: false,
    chatbot: false,
    metaBusinessSetup: false,
    metaAdsTemplates: false,
    analytics: 'none',
    badgeRemovable: false,
    supportLevel: 'none',
    feedExport: false,
    onboardingCall: false,
    brandingFull: true,
  },
  growth: {
    maxProducts: 999999,
    maxLeadsPerMonth: 999999,
    seoIndexable: true,
    geoOptimized: true,
    semReady: false,
    designEngine: 'presets',
    storefrontDesigner: true,
    chatbot: false,
    metaBusinessSetup: false,
    metaAdsTemplates: false,
    analytics: 'basic',
    badgeRemovable: true,
    supportLevel: 'email',
    feedExport: false,
    onboardingCall: false,
    brandingFull: true,
  },
  pro: {
    maxProducts: 999999,
    maxLeadsPerMonth: 999999,
    seoIndexable: true,
    geoOptimized: true,
    semReady: true,
    designEngine: 'full_brand_fit',
    storefrontDesigner: true,
    chatbot: true,
    metaBusinessSetup: true,
    metaAdsTemplates: true,
    analytics: 'advanced',
    badgeRemovable: true,
    supportLevel: 'whatsapp',
    feedExport: true,
    onboardingCall: true,
    brandingFull: true,
  },
}

export function getPlanFeatures(plan: Plan): PlanFeatures {
  return PLAN_FEATURES[plan]
}

export function hasFeature(plan: Plan, feature: keyof PlanFeatures): boolean {
  const features = PLAN_FEATURES[plan]
  const value = features[feature]
  if (typeof value === 'boolean') return value
  if (typeof value === 'number') return value > 0
  if (typeof value === 'string') return value !== 'none' && value !== 'disabled'
  return false
}

export function canAddProduct(plan: Plan, currentCount: number): boolean {
  return currentCount < PLAN_FEATURES[plan].maxProducts
}

export function canReceiveLead(plan: Plan, currentMonthCount: number): boolean {
  return currentMonthCount < PLAN_FEATURES[plan].maxLeadsPerMonth
}

// Pricing in USD (converted to ARS at checkout)
// Updated 2026-05-11 (PR 5 re-arquitectura): Growth 25→50, agrega beneficio
// "prendas a costo + $1.000 ARS". Pro mantiene $100, agrega chatbot WhatsApp/IG
// + automatización de contenido IG/FB/X.
export const PLAN_PRICING_USD: Record<Plan, number> = {
  starter: 0,
  growth: 50,
  pro: 100,
}

export const PLAN_PRICING_ANNUAL_USD: Record<Plan, number> = {
  starter: 0,
  growth: Math.round(50 * 12 * 0.85), // $510/year (15% off)
  pro: Math.round(100 * 12 * 0.85), // $1020/year (15% off)
}

export const PLAN_PRICING_MONTHLY_FROM_ANNUAL: Record<Plan, number> = {
  starter: 0,
  growth: Math.round(50 * 0.85 * 100) / 100, // ~$42.5/mo
  pro: Math.round(100 * 0.85 * 100) / 100, // ~$85/mo
}

// ── Promoción de lanzamiento (SOLO DISPLAY) ─────────────────────────────────
// Estos valores afectan únicamente lo que se muestra en las páginas/planillas
// de planes. El cobro real sigue derivándose de PLAN_PRICING_USD /
// PLAN_PRICING_ANNUAL_USD: el 50% del primer año se aplica como cupón/manual
// al dar de alta al partner, no automáticamente.
export const ANNUAL_DISCOUNT = 0.15

// 50% OFF el primer año para atraer partners pagos. Por ahora solo Growth.
export const FIRST_YEAR_PROMO_PCT: Partial<Record<Plan, number>> = {
  growth: 0.5,
}

export function firstYearPromoPct(plan: Plan): number {
  return FIRST_YEAR_PROMO_PCT[plan] ?? 0
}

export const PLAN_NAMES: Record<Plan, string> = {
  starter: 'Starter',
  growth: 'Growth',
  pro: 'Pro',
}

export const PLAN_DESCRIPTIONS: Record<Plan, string> = {
  starter: 'Ideal para empezar. Storefront con branding completo. Prendas a precio retail.',
  growth: 'Para marcas que quieren crecer. Prendas al costo Novamente, SEO, Design Engine y analytics.',
  pro: 'Experiencia completa con chatbot WhatsApp + Instagram, automatización de contenido y Meta Ads.',
}
