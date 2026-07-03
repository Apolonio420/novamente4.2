/**
 * Partner product variants (SKU / color / talle / disponibilidad / precio / imagen).
 *
 * The partner_product_variants table existed but had no API. Variants used to live
 * only inside partner_products.metadata (colors[] × sizes[]); this module activates
 * the real table with tenant-scoped CRUD and the publish-time validation (minimum
 * margin + availability). A SQL migration backfills variants from metadata.
 *
 * Tenant scoping: variants have no tenant_id of their own — they belong to a product.
 * Every operation verifies the product belongs to the caller's tenant; a foreign
 * product returns 404 (never reveals existence).
 */
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getPartnerPlanPrice, ALL_GARMENT_PRICING } from './garment-pricing.server'
import type { Plan } from './types'

const db = () => supabaseAdmin as any

export const VARIANT_AVAILABILITY = ['available', 'out_of_stock', 'preorder', 'discontinued'] as const

export interface PartnerVariant {
  id: string
  product_id: string
  sku: string | null
  color: string | null
  size: string | null
  material: string | null
  price: number | null
  image_url: string | null
  availability: string
  attributes: Record<string, unknown>
  created_at: string
}

export interface VariantInput {
  sku?: string | null
  color?: string | null
  size?: string | null
  material?: string | null
  price?: number | null
  image_url?: string | null
  availability?: string | null
  attributes?: Record<string, unknown>
}

export interface VariantResult {
  ok: boolean
  status: number
  error?: string
  variant?: PartnerVariant
}

// ---------------------------------------------------------------------------
// Pure validation
// ---------------------------------------------------------------------------

/**
 * Validate variant fields. On create (requireIdentifier=true) a variant must have
 * at least one identifying attribute; on partial update that rule is relaxed.
 */
export function validateVariantInput(input: VariantInput, requireIdentifier = true): { ok: boolean; reason?: string } {
  if (input.price != null && (input.price as any) !== '') {
    const n = Number(input.price)
    if (!Number.isFinite(n) || n < 0) {
      return { ok: false, reason: 'El precio de la variante debe ser un monto positivo' }
    }
  }
  if (input.availability != null && !(VARIANT_AVAILABILITY as readonly string[]).includes(input.availability)) {
    return { ok: false, reason: 'Disponibilidad de variante inválida' }
  }
  if (requireIdentifier && !input.sku && !input.color && !input.size) {
    return { ok: false, reason: 'La variante necesita al menos SKU, color o talle' }
  }
  return { ok: true }
}

export const MIN_PUBLISH_MARGIN_ARS = 0 // price must strictly exceed production cost

/** Publish gate: price set, margin over production cost, and availability. */
export function validateProductForPublish(input: {
  price?: number | null
  cost?: number | null
  variants?: Array<{ availability?: string | null; price?: number | string | null }>
}): { ok: boolean; reason?: string } {
  const price = Number(input.price) || 0
  if (price <= 0) {
    return { ok: false, reason: 'Necesitás definir un precio antes de publicar este producto.' }
  }
  if (input.cost != null && Number.isFinite(Number(input.cost))) {
    const margin = price - Number(input.cost)
    if (margin <= MIN_PUBLISH_MARGIN_ARS) {
      return {
        ok: false,
        reason: `El precio ($${price.toLocaleString('es-AR')}) no cubre el costo de producción ($${Number(input.cost).toLocaleString('es-AR')}). Subí el precio para tener margen.`,
      }
    }
  }
  if (input.variants && input.variants.length > 0) {
    const availableVariants = input.variants.filter((v) => (v.availability ?? 'available') === 'available')
    if (availableVariants.length === 0) {
      return {
        ok: false,
        reason: 'No hay ninguna variante disponible. Marcá al menos una como disponible antes de publicar.',
      }
    }

    // A variant price overrides the catalog price at checkout, so validating
    // only the parent product would still allow an available loss-making SKU.
    if (input.cost != null && Number.isFinite(Number(input.cost))) {
      const cost = Number(input.cost)
      for (const variant of availableVariants) {
        const effectivePrice = variant.price == null ? price : Number(variant.price)
        if (!Number.isFinite(effectivePrice) || effectivePrice <= 0 || effectivePrice - cost <= MIN_PUBLISH_MARGIN_ARS) {
          return {
            ok: false,
            reason: `El precio de una variante disponible no cubre el costo de producción ($${cost.toLocaleString('es-AR')}).`,
          }
        }
      }
    }
  }
  return { ok: true }
}

/**
 * A published product must keep passing the publish gate when a price or its
 * production-cost metadata changes. Content-only edits remain possible for
 * legacy products that predate the gate.
 */
export function needsPublishedProductValidation(
  currentStatus: string | null | undefined,
  updates: { status?: unknown; price?: unknown; metadata?: unknown; [key: string]: unknown },
): boolean {
  return updates.status === 'published'
    || (currentStatus === 'published' && (updates.price !== undefined || updates.metadata !== undefined))
}

/**
 * Production cost of a product (ARS): garment pricing (plan price) is always the
 * source of truth when garmentKey resolves — explicit metadata cost is only a
 * last-resort fallback (a partner writing metadata.cost_partner cannot override
 * the plan price and evade the publish margin gate).
 */
export function resolveProductCost(metadata: Record<string, unknown> | null | undefined, plan: Plan): number | null {
  const meta = metadata || {}
  const gk = typeof (meta as any).garmentKey === 'string' ? (meta as any).garmentKey : null
  if (gk && ALL_GARMENT_PRICING[gk]) {
    const price = getPartnerPlanPrice(gk, plan)
    if (price) return price
  }
  const explicit = Number((meta as any).cost_partner ?? (meta as any).cost_ars)
  if (Number.isFinite(explicit) && explicit > 0) return explicit
  return null
}

// ---------------------------------------------------------------------------
// Tenant-scoped CRUD
// ---------------------------------------------------------------------------

async function productBelongsToTenant(productId: string, tenantId: string): Promise<boolean> {
  const { data } = await db()
    .from('partner_products')
    .select('id')
    .eq('id', productId)
    .eq('tenant_id', tenantId)
    .single()
  return !!data
}

export async function listVariants(tenantId: string, productId: string): Promise<PartnerVariant[]> {
  if (!(await productBelongsToTenant(productId, tenantId))) return []
  const { data } = await db()
    .from('partner_product_variants')
    .select('*')
    .eq('product_id', productId)
    .order('created_at', { ascending: true })
  return (data || []) as PartnerVariant[]
}

export async function createVariant(tenantId: string, productId: string, input: VariantInput): Promise<VariantResult> {
  const valid = validateVariantInput(input)
  if (!valid.ok) return { ok: false, status: 400, error: valid.reason }
  if (!(await productBelongsToTenant(productId, tenantId))) {
    return { ok: false, status: 404, error: 'Producto no encontrado' }
  }

  const { data, error } = await db()
    .from('partner_product_variants')
    .insert({
      product_id: productId,
      sku: input.sku || null,
      color: input.color || null,
      size: input.size || null,
      material: input.material || null,
      price: input.price ?? null,
      image_url: input.image_url || null,
      availability: input.availability || 'available',
      attributes: input.attributes || {},
    })
    .select('*')
    .single()

  if (error || !data) return { ok: false, status: 500, error: 'No se pudo crear la variante' }
  return { ok: true, status: 200, variant: data as PartnerVariant }
}

export async function updateVariant(
  tenantId: string,
  productId: string,
  variantId: string,
  input: VariantInput,
): Promise<VariantResult> {
  const valid = validateVariantInput(input, false) // partial update: don't require an identifier
  if (!valid.ok) return { ok: false, status: 400, error: valid.reason }
  if (!(await productBelongsToTenant(productId, tenantId))) {
    return { ok: false, status: 404, error: 'Producto no encontrado' }
  }

  const updates: Record<string, unknown> = {}
  for (const field of ['sku', 'color', 'size', 'material', 'price', 'image_url', 'availability', 'attributes'] as const) {
    if (input[field] !== undefined) updates[field] = input[field]
  }
  if (Object.keys(updates).length === 0) return { ok: false, status: 400, error: 'No hay cambios' }

  const { data, error } = await db()
    .from('partner_product_variants')
    .update(updates)
    .eq('id', variantId)
    .eq('product_id', productId)
    .select('*')
    .single()

  if (error || !data) return { ok: false, status: 404, error: 'Variante no encontrada' }
  return { ok: true, status: 200, variant: data as PartnerVariant }
}

export async function deleteVariant(tenantId: string, productId: string, variantId: string): Promise<VariantResult> {
  if (!(await productBelongsToTenant(productId, tenantId))) {
    return { ok: false, status: 404, error: 'Producto no encontrado' }
  }
  const { data, error } = await db()
    .from('partner_product_variants')
    .delete()
    .eq('id', variantId)
    .eq('product_id', productId)
    .select('id')

  if (error || !data || data.length === 0) return { ok: false, status: 404, error: 'Variante no encontrada' }
  return { ok: true, status: 200 }
}
