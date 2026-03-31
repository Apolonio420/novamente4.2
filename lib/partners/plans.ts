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
export const PLAN_PRICING_USD: Record<Plan, number> = {
  starter: 0,
  growth: 25,
  pro: 100,
}

export const PLAN_PRICING_ANNUAL_USD: Record<Plan, number> = {
  starter: 0,
  growth: Math.round(25 * 12 * 0.85), // $255/year (15% off)
  pro: Math.round(100 * 12 * 0.85), // $1020/year (15% off)
}

export const PLAN_PRICING_MONTHLY_FROM_ANNUAL: Record<Plan, number> = {
  starter: 0,
  growth: Math.round(25 * 0.85 * 100) / 100, // ~$21.25/mo
  pro: Math.round(100 * 0.85 * 100) / 100, // ~$85/mo
}

export const PLAN_NAMES: Record<Plan, string> = {
  starter: 'Starter',
  growth: 'Growth',
  pro: 'Pro',
}

export const PLAN_DESCRIPTIONS: Record<Plan, string> = {
  starter: 'Ideal para empezar. Storefront con branding completo y acceso a precios mayoristas.',
  growth: 'Para marcas que quieren crecer. SEO, Design Engine y storefront personalizable.',
  pro: 'La experiencia completa. Chatbot, Meta Ads, soporte premium y más.',
}
