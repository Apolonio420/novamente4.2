import { getPublishedTenants, getTenantBySlug } from './tenant'
import { getPublishedProducts } from './catalog'
import { partners as staticPartners, getPartnerById } from '@/src/data/partners'
import type { Tenant, PartnerProduct } from './types'

// Override logos (fix bad exports or missing logos in DB)
const LOGO_OVERRIDES: Record<string, string> = {
  'maldito-demonio': '/partners/maldito-demonio/logo.jpeg',
  'ventolito': '/partners/ventolito-wind-surf/logo.png',
}

// Card-only image overrides for entries whose logo export does not work well in the square grid.
const CARD_IMAGE_OVERRIDES: Record<string, string> = {
}

// DB slugs to hide (duplicates, test tenants, or demos not meant to be public)
const HIDDEN_DB_SLUGS = new Set([
  'ventolito',
  'demo-restaurante',
  'demo-clinica',
  'demo-inmobiliaria',
  'demo-peluqueria',
  'demo-mayorista',
  'ar-brand-test',
  'karimarketok',
  'karimarket-ok',
  'karimarket.ok',
])

// Slug redirects — old slug → current slug (for renamed brands)
export const SLUG_REDIRECTS: Record<string, string> = {
  'hard-demonio': 'maldito-demonio',
}

// Category mapping for static partners (DB partners use their `industry` field)
const STATIC_CATEGORIES: Record<string, string> = {
  'novamente-mundial': 'Deportes',
  'falco': 'Streetwear',
  'novamente-originals': 'Streetwear',
  'mindset': 'Lifestyle',
  'ventolito-wind-surf': 'Deportes',
}

export interface DirectoryEntry {
  slug: string
  name: string
  slogan: string | null
  description: string | null
  logo: string | null
  cardImage: string | null
  banner: string | null
  featured: boolean
  productCount: number
  instagram: string | null
  category: string | null
  source: 'db' | 'static'
}

export interface StorefrontData {
  slug: string
  name: string
  slogan: string | null
  description: string | null
  values: string | null
  mission: string | null
  logo: string | null
  banner: string | null
  instagram: string | null
  primaryColor: string
  products: PartnerProduct[]
  source: 'db' | 'static'
  plan: string
  tenant?: Tenant
}

/**
 * Get all directory entries: DB tenants first, then static partners not in DB.
 * Deduplicates by slug (DB wins over static).
 */
export async function getDirectoryEntries(): Promise<DirectoryEntry[]> {
  const allDbTenants = await getPublishedTenants()
  const dbTenants = allDbTenants.filter((t) => !HIDDEN_DB_SLUGS.has(t.slug))
  const dbSlugs = new Set(dbTenants.map((t) => t.slug))

  const dbEntries: DirectoryEntry[] = dbTenants.map((t) => ({
    slug: t.slug,
    name: t.name,
    slogan: t.tagline,
    description: t.description,
    logo: LOGO_OVERRIDES[t.slug] || t.logo_url,
    cardImage: CARD_IMAGE_OVERRIDES[t.slug] || LOGO_OVERRIDES[t.slug] || t.logo_url,
    banner: t.banner_url,
    featured: t.plan === 'pro',
    productCount: 0, // Will be enriched below
    instagram: t.instagram,
    category: t.industry || null,
    source: 'db' as const,
  }))

  // Static partners that aren't in the DB yet
  const staticEntries: DirectoryEntry[] = staticPartners
    .filter((p) => !dbSlugs.has(p.id))
    .map((p) => ({
      slug: p.id,
      name: p.name,
      slogan: p.slogan,
      description: p.description,
      logo: p.logo,
      cardImage: p.cardImage || p.logo,
      banner: p.banner,
      featured: p.featured || false,
      productCount: p.products.length,
      instagram: p.instagramUrl || null,
      category: STATIC_CATEGORIES[p.id] || null,
      source: 'static' as const,
    }))

  return [...dbEntries, ...staticEntries]
}

/**
 * Resolve a storefront by slug — tries DB first, falls back to static.
 */
export async function getStorefrontBySlug(slug: string): Promise<StorefrontData | null> {
  if (HIDDEN_DB_SLUGS.has(slug)) return null

  // Try DB first
  const tenant = await getTenantBySlug(slug)
  if (tenant && tenant.status === 'active' && tenant.storefront_published) {
    const products = await getPublishedProducts(tenant.id)
    return {
      slug: tenant.slug,
      name: tenant.name,
      slogan: tenant.tagline,
      description: tenant.description,
      values: tenant.about_text,
      mission: null,
      logo: LOGO_OVERRIDES[tenant.slug] || tenant.logo_url,
      banner: tenant.banner_url,
      instagram: tenant.instagram,
      primaryColor: tenant.primary_color,
      products,
      source: 'db',
      plan: tenant.plan,
      tenant,
    }
  }

  // Fallback to static
  const staticPartner = getPartnerById(slug)
  if (!staticPartner) return null

  return {
    slug: staticPartner.id,
    name: staticPartner.name,
    slogan: staticPartner.slogan,
    description: staticPartner.description,
    values: staticPartner.values,
    mission: staticPartner.mission,
    logo: staticPartner.logo,
    banner: staticPartner.banner,
    instagram: staticPartner.instagramUrl || null,
    primaryColor: '#000000',
    products: [],
    source: 'static',
    plan: 'starter',
  }
}
