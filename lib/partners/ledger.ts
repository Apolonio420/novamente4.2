/**
 * Ledger financiero del partner.
 *
 * Cada venta confirmada de una tienda partner acredita el MARGEN del partner
 * (precio de venta − costo de producción Novamente) en partner_ledger_entries.
 * Balance = SUM(credit) − SUM(debit). Los retiros (partner_payouts) generan
 * un debit al solicitarse.
 *
 * Resolución del costo por item (en orden):
 *   1. metadata.cost_partner / cost_ars del partner_product matcheado
 *   2. metadata.garmentKey → getPartnerPlanPrice(key, plan del tenant)
 *   3. metadata.model / category → heurística a garment key
 * Si no se puede resolver, el margen del item es 0 y la entry queda
 * status='needs_review' para ajuste manual.
 */
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getPartnerPlanPrice, ALL_GARMENT_PRICING } from './garment-pricing'

type Plan = 'starter' | 'growth' | 'pro'

interface OrderItemLike {
  item_name?: string | null
  product_type?: string | null
  quantity?: number | null
  unit_price?: number | null
  total_price?: number | null
}

interface PartnerProductLite {
  name: string
  category: string | null
  metadata: Record<string, unknown> | null
}

/** Heurística model/categoría → garment key del pricing. */
function guessGarmentKey(raw: string): string | null {
  const s = raw.toLowerCase()
  if (/aura|oversize/.test(s) && /remera|tshirt|t-shirt|shirt/.test(s)) return 'aura-oversize-tshirt'
  if (/aldea|classic/.test(s) && /remera|tshirt|t-shirt|shirt/.test(s)) return 'aldea-classic-tshirt'
  if (/hoodie|boston|capucha/.test(s)) return 'buzo-hoodie-unisex'
  if (/crewneck|berlin|cuello redondo/.test(s)) return 'buzo-cuello-redondo'
  if (/crop|bahamas/.test(s)) return 'remera-crop-mujer'
  if (/musculosa|bali/.test(s)) return 'musculosa-bali'
  if (/buenos aires|mujer/.test(s) && /remera/.test(s)) return 'remera-clasica-mujer'
  if (/remera|tshirt|t-shirt/.test(s)) return 'aura-oversize-tshirt' // remera genérica → la más vendida
  if (/buzo/.test(s)) return 'buzo-hoodie-unisex'
  return null
}

/** Costo de producción de UN item. null = irresoluble. */
function resolveItemCost(
  item: OrderItemLike,
  products: PartnerProductLite[],
  plan: Plan,
): { cost: number | null; via: string } {
  const itemName = (item.item_name || '').toLowerCase()

  // 1) matchear partner_product por nombre (los items del checkout llevan "Nombre - Marca")
  const product = products.find((p) => p.name && itemName.startsWith(p.name.toLowerCase()))
  const meta = (product?.metadata || {}) as Record<string, unknown>

  const explicit = Number(meta.cost_partner ?? meta.cost_ars)
  if (Number.isFinite(explicit) && explicit > 0) return { cost: explicit, via: 'metadata.cost' }

  const gk = typeof meta.garmentKey === 'string' ? meta.garmentKey : null
  if (gk && ALL_GARMENT_PRICING[gk]) {
    const price = getPartnerPlanPrice(gk, plan)
    if (price) return { cost: price, via: `garmentKey:${gk}` }
  }

  const model = typeof meta.model === 'string' ? meta.model : null
  for (const candidate of [model, product?.category, item.product_type, item.item_name]) {
    if (!candidate) continue
    const guessed = guessGarmentKey(candidate)
    if (guessed) {
      const price = getPartnerPlanPrice(guessed, plan)
      if (price) return { cost: price, via: `guess:${guessed}` }
    }
  }

  return { cost: null, via: 'unresolved' }
}

export interface MarginResult {
  margin: number
  needsReview: boolean
  breakdown: Array<{ item: string; qty: number; unit: number; cost: number | null; via: string }>
}

/** Calcula el margen total del partner para una lista de items. */
export function computeOrderMargin(
  items: OrderItemLike[],
  products: PartnerProductLite[],
  plan: Plan,
): MarginResult {
  let margin = 0
  let needsReview = false
  const breakdown: MarginResult['breakdown'] = []
  for (const it of items) {
    const qty = Number(it.quantity) || 1
    const unit = Number(it.unit_price) || (Number(it.total_price) || 0) / qty
    const { cost, via } = resolveItemCost(it, products, plan)
    if (cost == null) {
      needsReview = true
    } else {
      margin += Math.max(0, unit - cost) * qty
    }
    breakdown.push({ item: it.item_name || '?', qty, unit, cost, via })
  }
  return { margin: Math.round(margin), needsReview, breakdown }
}

/**
 * Acredita el margen de una orden web confirmada al ledger del tenant.
 * Idempotente (unique index por tenant+order en credits). No lanza: loguea.
 * Devuelve el margen calculado para que el caller pueda informarlo (p.ej. en
 * la notificación al partner) sin recomputarlo.
 */
export async function creditOrderMargin(order: {
  id: string
  tenant_id: string
  order_number?: string | null
  items?: OrderItemLike[] | null
}): Promise<{ margin: number; needsReview: boolean }> {
  try {
    const sb = supabaseAdmin as any
    const [{ data: tenant }, { data: products }] = await Promise.all([
      sb.from('tenants').select('plan').eq('id', order.tenant_id).maybeSingle(),
      sb.from('partner_products').select('name, category, metadata').eq('tenant_id', order.tenant_id),
    ])
    const plan: Plan = (tenant?.plan as Plan) || 'starter'
    const { margin, needsReview, breakdown } = computeOrderMargin(order.items || [], products || [], plan)
    if (margin <= 0 && !needsReview) {
      console.log('[ledger] margen 0 sin review — no se acredita', order.id)
      return { margin: 0, needsReview: false }
    }
    const { error } = await sb.from('partner_ledger_entries').insert({
      tenant_id: order.tenant_id,
      order_id: order.id,
      source: 'web_order',
      type: 'credit',
      amount: margin,
      concept: `Margen venta ${order.order_number || order.id.slice(0, 8)}`,
      status: needsReview ? 'needs_review' : 'confirmed',
      metadata: { breakdown, plan },
    })
    if (error) {
      // 23505 = unique violation → ya acreditada (idempotencia), no es error
      if (error.code === '23505') console.log('[ledger] crédito ya existía para orden', order.id)
      else console.error('[ledger] error acreditando:', error.message)
    } else {
      console.log(`[ledger] ✅ acreditado $${margin} a tenant ${order.tenant_id} (orden ${order.order_number})${needsReview ? ' [NEEDS REVIEW]' : ''}`)
    }
    return { margin, needsReview }
  } catch (e: any) {
    console.error('[ledger] exception:', e?.message)
    return { margin: 0, needsReview: false }
  }
}

/** Balance actual del tenant (credits − debits, solo entries confirmadas + needs_review credits cuentan como pendientes). */
export async function getTenantBalance(tenantId: string): Promise<{
  available: number
  pendingReview: number
}> {
  const sb = supabaseAdmin as any
  const { data } = await sb
    .from('partner_ledger_entries')
    .select('type, amount, status')
    .eq('tenant_id', tenantId)
  let available = 0
  let pendingReview = 0
  for (const e of data || []) {
    const amt = Number(e.amount) || 0
    if (e.status === 'needs_review' && e.type === 'credit') pendingReview += amt
    else available += e.type === 'credit' ? amt : -amt
  }
  return { available: Math.round(available), pendingReview: Math.round(pendingReview) }
}
