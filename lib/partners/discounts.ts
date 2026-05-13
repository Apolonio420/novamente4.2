/**
 * Helpers para codigos de descuento del partner.
 */
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

function db() {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

export type DiscountType = 'percentage' | 'fixed'

export interface PartnerDiscountCode {
  id: string
  tenant_id: string
  code: string
  description: string | null
  discount_type: DiscountType
  discount_value: number
  min_purchase_ars: number
  max_uses: number | null
  uses_count: number
  starts_at: string
  ends_at: string | null
  active: boolean
  created_at: string
  updated_at: string
}

export async function listDiscountCodes(tenantId: string): Promise<PartnerDiscountCode[]> {
  const { data, error } = await db()
    .from('partner_discount_codes')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })
  if (error || !data) return []
  return data as PartnerDiscountCode[]
}

export interface CreateDiscountInput {
  code: string
  description?: string
  discount_type: DiscountType
  discount_value: number
  min_purchase_ars?: number
  max_uses?: number | null
  starts_at?: string | null
  ends_at?: string | null
}

export async function createDiscountCode(
  tenantId: string,
  input: CreateDiscountInput,
): Promise<PartnerDiscountCode | null> {
  const code = input.code.toUpperCase().replace(/\s+/g, '').slice(0, 32)
  if (!code) return null
  if (!['percentage', 'fixed'].includes(input.discount_type)) return null
  if (input.discount_value <= 0) return null
  if (input.discount_type === 'percentage' && input.discount_value > 100) return null

  const { data, error } = await db()
    .from('partner_discount_codes')
    .insert({
      tenant_id: tenantId,
      code,
      description: input.description ?? null,
      discount_type: input.discount_type,
      discount_value: input.discount_value,
      min_purchase_ars: input.min_purchase_ars ?? 0,
      max_uses: input.max_uses ?? null,
      starts_at: input.starts_at ?? new Date().toISOString(),
      ends_at: input.ends_at ?? null,
      active: true,
    })
    .select()
    .single()
  if (error || !data) return null
  return data as PartnerDiscountCode
}

export async function updateDiscountCode(
  id: string,
  tenantId: string,
  updates: Partial<{
    description: string | null
    discount_value: number
    min_purchase_ars: number
    max_uses: number | null
    starts_at: string | null
    ends_at: string | null
    active: boolean
  }>,
): Promise<PartnerDiscountCode | null> {
  const { data, error } = await db()
    .from('partner_discount_codes')
    .update(updates)
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .select()
    .single()
  if (error || !data) return null
  return data as PartnerDiscountCode
}

export async function deleteDiscountCode(id: string, tenantId: string): Promise<boolean> {
  const { error } = await db()
    .from('partner_discount_codes')
    .delete()
    .eq('id', id)
    .eq('tenant_id', tenantId)
  return !error
}

/** Aplica un codigo de descuento a un subtotal. Devuelve { valid, discountARS, finalARS, reason }. */
export interface ApplyResult {
  valid: boolean
  discountARS: number
  finalARS: number
  reason?: string
}

export function applyDiscount(code: PartnerDiscountCode | null, subtotalARS: number, now = new Date()): ApplyResult {
  if (!code) return { valid: false, discountARS: 0, finalARS: subtotalARS, reason: 'Codigo no encontrado' }
  if (!code.active) return { valid: false, discountARS: 0, finalARS: subtotalARS, reason: 'Codigo inactivo' }
  const nowTs = now.getTime()
  if (new Date(code.starts_at).getTime() > nowTs) {
    return { valid: false, discountARS: 0, finalARS: subtotalARS, reason: 'Codigo no esta vigente todavia' }
  }
  if (code.ends_at && new Date(code.ends_at).getTime() < nowTs) {
    return { valid: false, discountARS: 0, finalARS: subtotalARS, reason: 'Codigo vencido' }
  }
  if (code.max_uses !== null && code.uses_count >= code.max_uses) {
    return { valid: false, discountARS: 0, finalARS: subtotalARS, reason: 'Codigo agotado' }
  }
  if (subtotalARS < code.min_purchase_ars) {
    return {
      valid: false,
      discountARS: 0,
      finalARS: subtotalARS,
      reason: `Compra minima de $${code.min_purchase_ars.toLocaleString('es-AR')} requerida`,
    }
  }

  const discountARS =
    code.discount_type === 'percentage'
      ? Math.round((subtotalARS * code.discount_value) / 100)
      : Math.min(code.discount_value, subtotalARS)

  return {
    valid: true,
    discountARS,
    finalARS: Math.max(0, subtotalARS - discountARS),
  }
}
