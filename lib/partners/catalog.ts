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

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'producto'
}

/**
 * Genera un slug único dentro del tenant. La tabla tiene UNIQUE (tenant_id, slug),
 * asi que si el partner reusa un nombre (reintento tras un éxito no percibido, o
 * dos productos legítimos con el mismo nombre) sufijamos -2, -3, … en vez de
 * chocar con la constraint y tirar un 500 genérico.
 */
async function generateUniqueSlug(tenantId: string, name: string): Promise<string> {
  const base = slugify(name)
  const { data } = await db()
    .from('partner_products')
    .select('slug')
    .eq('tenant_id', tenantId)
    .like('slug', `${base}%`)

  const taken = new Set<string>((data || []).map((r: { slug: string }) => r.slug))
  if (!taken.has(base)) return base
  for (let i = 2; i < 1000; i++) {
    const candidate = `${base}-${i}`
    if (!taken.has(candidate)) return candidate
  }
  // Fallback ultra improbable: sufijo aleatorio
  return `${base}-${Math.random().toString(36).slice(2, 7)}`
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
  const buildRow = (slug: string) => ({
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

  const slug = await generateUniqueSlug(tenantId, input.name)
  const { data, error } = await db()
    .from('partner_products')
    .insert(buildRow(slug))
    .select()
    .single()

  if (!error && data) return data as PartnerProduct

  // Carrera: otro insert tomó el mismo slug entre el check y el insert (23505).
  // Reintentamos una vez con un sufijo aleatorio.
  if (error?.code === '23505') {
    const retrySlug = `${slug}-${Math.random().toString(36).slice(2, 7)}`
    const retry = await db()
      .from('partner_products')
      .insert(buildRow(retrySlug))
      .select()
      .single()
    if (!retry.error && retry.data) return retry.data as PartnerProduct
  }

  return null
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
