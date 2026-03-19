import { supabaseAdmin } from '@/lib/supabase-admin'

const db = () => supabaseAdmin as any
import type { PartnerProduct } from './types'

export async function getPublishedProducts(tenantId: string): Promise<PartnerProduct[]> {
  const { data, error } = await db()
    .from('partner_products')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('status', 'published')
    .order('sort_order')

  if (error || !data) return []
  return data as PartnerProduct[]
}

export async function getAllProducts(tenantId: string): Promise<PartnerProduct[]> {
  const { data, error } = await db()
    .from('partner_products')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('sort_order')

  if (error || !data) return []
  return data as PartnerProduct[]
}

export async function getProductBySlug(tenantId: string, slug: string): Promise<PartnerProduct | null> {
  const { data, error } = await db()
    .from('partner_products')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('slug', slug)
    .single()

  if (error || !data) return null
  return data as PartnerProduct
}

export async function createProduct(tenantId: string, input: {
  name: string
  description?: string
  category?: string
  price?: number
  images?: string[]
  tags?: string[]
  collection?: string
  metadata?: Record<string, unknown>
  status?: string
}): Promise<PartnerProduct | null> {
  const slug = input.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

  const { data, error } = await db()
    .from('partner_products')
    .insert({
      tenant_id: tenantId,
      name: input.name,
      description: input.description || null,
      category: input.category || null,
      slug,
      price: input.price || null,
      images: input.images || [],
      tags: input.tags || [],
      collection: input.collection || null,
      metadata: input.metadata || {},
      status: input.status || 'draft',
    })
    .select()
    .single()

  if (error || !data) return null
  return data as PartnerProduct
}

export async function updateProduct(productId: string, updates: Partial<PartnerProduct>): Promise<PartnerProduct | null> {
  const { data, error } = await db()
    .from('partner_products')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', productId)
    .select()
    .single()

  if (error || !data) return null
  return data as PartnerProduct
}

export async function deleteProduct(productId: string): Promise<boolean> {
  const { error } = await db()
    .from('partner_products')
    .delete()
    .eq('id', productId)

  return !error
}

export async function countProducts(tenantId: string): Promise<number> {
  const { count, error } = await db()
    .from('partner_products')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', tenantId)

  if (error) return 0
  return count || 0
}
