import { supabaseAdmin } from '@/lib/supabase-admin'
import type { Tenant, TenantUser } from './types'

// Cast helper — Supabase doesn't have generated types for these new tables
const db = () => supabaseAdmin as any

// --- Read operations ---

export async function getTenantBySlug(slug: string): Promise<Tenant | null> {
  const { data, error } = await db()
    .from('tenants')
    .select('*')
    .eq('slug', slug)
    .single()

  if (error || !data) return null
  return data as Tenant
}

export async function getTenantById(id: string): Promise<Tenant | null> {
  const { data, error } = await db()
    .from('tenants')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !data) return null
  return data as Tenant
}

export async function getTenantByUserId(userId: string): Promise<Tenant | null> {
  const { data, error } = await db()
    .from('tenant_users')
    .select('tenant_id')
    .eq('user_id', userId)
    .not('accepted_at', 'is', null)
    .order('accepted_at', { ascending: false })
    .limit(1)
    .single()

  if (error || !data) return null
  return getTenantById(data.tenant_id)
}

export async function getPublishedTenants(): Promise<Tenant[]> {
  const { data, error } = await db()
    .from('tenants')
    .select('*')
    .eq('storefront_published', true)
    .eq('status', 'active')
    .order('name')

  if (error || !data) return []
  return data as Tenant[]
}

export async function getAllTenants(): Promise<Tenant[]> {
  const { data, error } = await db()
    .from('tenants')
    .select('*')
    .order('created_at', { ascending: false })

  if (error || !data) return []
  return data as Tenant[]
}

// --- Write operations ---

export async function createTenant(input: {
  slug: string
  name: string
  email: string
  phone?: string
  industry?: string
  website?: string
  instagram?: string
  description?: string
  seo_title?: string
  seo_description?: string
}): Promise<Tenant | null> {
  const { data, error } = await db()
    .from('tenants')
    .insert({
      slug: input.slug.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
      name: input.name,
      email: input.email,
      phone: input.phone || null,
      industry: input.industry || null,
      website: input.website || null,
      instagram: input.instagram || null,
      description: input.description || null,
      seo_title: input.seo_title || null,
      seo_description: input.seo_description || null,
      plan: 'starter',
      status: 'onboarding',
      onboarding_step: 1,
    })
    .select()
    .single()

  if (error || !data) {
    console.error('[createTenant] insert failed', { error, slugAttempted: input.slug, email: input.email })
    return null
  }
  return data as Tenant
}

export async function updateTenant(id: string, updates: Partial<Tenant>): Promise<Tenant | null> {
  const { data, error } = await db()
    .from('tenants')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error || !data) {
    console.error('[updateTenant] update failed', { error, tenantId: id, updateKeys: Object.keys(updates) })
    return null
  }
  return data as Tenant
}

// --- Public visibility ---

/**
 * Returns a tenant by slug only if it's active and storefront is published.
 * Use this for public storefront pages — returns null for inactive/unpublished tenants.
 */
export async function getPublicTenant(slug: string): Promise<Tenant | null> {
  const { data, error } = await db()
    .from('tenants')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'active')
    .eq('storefront_published', true)
    .single()

  if (error || !data) return null
  return data as Tenant
}

// --- Tenant Users ---

export async function addTenantUser(tenantId: string, userId: string, role: 'owner' | 'operator' | 'viewer'): Promise<TenantUser | null> {
  const { data, error } = await db()
    .from('tenant_users')
    .insert({
      tenant_id: tenantId,
      user_id: userId,
      role,
      accepted_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (error || !data) return null
  return data as TenantUser
}

export async function getUserTenantRole(tenantId: string, userId: string): Promise<TenantUser | null> {
  const { data, error } = await db()
    .from('tenant_users')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('user_id', userId)
    .single()

  if (error || !data) return null
  return data as TenantUser
}

// --- Completeness score ---

export function calculateCompletenessScore(tenant: Tenant): number {
  let score = 0
  if (tenant.logo_url) score += 10
  if (tenant.banner_url) score += 5
  if (tenant.description) score += 10
  if (tenant.tagline) score += 5
  if (tenant.primary_color && tenant.primary_color !== '#000000') score += 5
  if (tenant.cta_text && tenant.cta_text !== 'Contactar') score += 10
  if (tenant.cta_url) score += 5
  if (tenant.industry) score += 5
  if (tenant.phone) score += 5
  if (tenant.instagram) score += 5
  if (tenant.website) score += 5
  if (tenant.seo_title) score += 5
  if (tenant.seo_description) score += 5
  return Math.min(score, 100)
}
