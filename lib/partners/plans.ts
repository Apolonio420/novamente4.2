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
  customFaqs: boolean
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
    customFaqs: false,
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
    customFaqs: false,
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
    customFaqs: true,
  },
}

export function getPlanFeatures(plan: Plan): PlanFeatures {
  return PLAN_FEATURES[plan]
}

/**
 * El plan que el partner puede USAR HOY, que no es lo mismo que el que
 * contrató.
 *
 * `tenant.plan` guarda lo contratado y se conserva para poder reactivar sin
 * perder el historial. Pero mientras la cuenta no esté al día, las features
 * son las del plan gratis — que es lo que promete /studio/planes para Starter.
 *
 * Antes esto no existía: el cron de suscripciones suspendía al partner
 * (status='suspended') sin tocar `plan`, y como todos los gates preguntan por
 * `tenant.plan`, alguien que dejó de pagar seguía con generaciones ilimitadas
 * de IA, analytics, feeds y chatbot. Novamente pagaba la factura de Gemini de
 * un cliente que ya no pagaba.
 *
 * 'onboarding' cuenta como al día: es el partner que todavía está entrando.
 */
export function effectivePlan(tenant: { plan: Plan | string; status?: string | null }): Plan {
  const alDia = tenant.status === 'active' || tenant.status === 'onboarding' || !tenant.status
  if (!alDia) return 'starter'
  const p = tenant.plan as Plan
  return p in PLAN_FEATURES ? p : 'starter'
}

/** Features realmente disponibles hoy para este tenant. */
export function featuresDelTenant(tenant: { plan: Plan | string; status?: string | null }): PlanFeatures {
  return PLAN_FEATURES[effectivePlan(tenant)]
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

export const ANNUAL_DISCOUNT = 0.15

// ── Promoción de lanzamiento ─────────────────────────────────────────────────
// El checkout (lib/partners/subscription.ts) aplica esta promo AUTOMÁTICAMENTE:
// no es un cupón manual. El cupo son los primeros GROWTH_PROMO.maxPartners
// partners con el PRIMER PAGO acreditado (ver countPaidPartners /
// isGrowthPromoEligible en subscription.ts), y dura GROWTH_PROMO.months meses
// desde el alta, después el cobro sube solo a precio standard (cron
// partners/check-subscriptions → bumpPromoToStandardIfDue). Por ahora solo
// Growth tiene promo.
export type PaidPlan = Exclude<Plan, 'starter'>

export const GROWTH_PROMO = {
  priceUsd: 25, // 50% off
  standardUsd: 50,
  maxPartners: 100, // primeros 100 partners pagos
  months: 12, // dura 12 meses, después → standardUsd
} as const

/** % de descuento de la promo de lanzamiento (derivado de GROWTH_PROMO: 25/50 = 0.5). */
export const GROWTH_PROMO_PCT = 1 - GROWTH_PROMO.priceUsd / GROWTH_PROMO.standardUsd

// FIRST_YEAR_PROMO_PCT deriva de GROWTH_PROMO_PCT — una sola fuente de verdad
// para el % de descuento, no un número duplicado a mano.
export const FIRST_YEAR_PROMO_PCT: Partial<Record<Plan, number>> = {
  growth: GROWTH_PROMO_PCT,
}

export function firstYearPromoPct(plan: Plan): number {
  return FIRST_YEAR_PROMO_PCT[plan] ?? 0
}

/** Precio en USD del plan mensual, contemplando la promo de Growth si aplica. */
export function resolvePriceUsd(plan: PaidPlan, promoEligible: boolean): number {
  if (plan === 'growth' && promoEligible) return GROWTH_PROMO.priceUsd
  return PLAN_PRICING_USD[plan]
}

/**
 * Precio ANUAL en USD (pago único), contemplando la promo de primer año de Growth.
 * El anual de lista (PLAN_PRICING_ANNUAL_USD) ya viene con -15%; la promo aplica
 * el mismo 50% sobre ese total, SOLO el primer año. Pro nunca tiene promo.
 * Ej. Growth: $510 → $255 (≈ US$21,25/mes). Renovación = full $510.
 */
export function resolveAnnualPriceUsd(plan: PaidPlan, promoEligible: boolean): number {
  const list = PLAN_PRICING_ANNUAL_USD[plan]
  if (plan === 'growth' && promoEligible) return Math.round(list * (1 - GROWTH_PROMO_PCT))
  return list
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
