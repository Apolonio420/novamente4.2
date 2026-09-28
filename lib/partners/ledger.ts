/**
 * Ledger financiero del partner.
 *
 * Cada venta web confirmada de una tienda partner acredita la GANANCIA del
 * partner en partner_ledger_entries. Balance = SUM(credit) − SUM(debit). Los
 * pagos al partner (partner_payouts) generan un debit.
 *
 * Ganancia por prenda (reglas de Juan, 27/09/2026 — PLAN-PARTNER-VENTAS-PAYOUTS.md):
 *   PVP (order_items.unit_price, sin el +10% de tarjeta, que va aparte y queda
 *   para Novamente) − costo partner (precio de su plan + $3.500 si la prenda se
 *   estampó en las dos caras — lib/partners/partner-cost.ts, fuente única).
 *   Si el pedido usó un código de descuento de un partner, el descuento sale de
 *   la ganancia de ESE partner (prorrateado entre sus ítems). El envío (pagado o
 *   gratis) no toca la ganancia del partner.
 *
 * A quién se le acredita: cada ítem al dueño de SU producto (partner_products.
 * tenant_id), no al tenant_id del pedido — un carrito puede mezclar productos de
 * un partner con prendas propias de Novamente (/crear, liquidación) o con
 * productos de otro partner. Los ítems sin producto de partner no se acreditan a
 * nadie (quedan listados en metadata.excluded). Una entry por (tenant, pedido).
 *
 * Producto del ítem (en orden): order_items.partner_product_id → prefijo UUID de
 * order_items.metadata.itemId (el checkout por transferencia no guardaba la
 * columna hasta 27/09) → nombre (legacy, solo entre los productos del tenant del
 * pedido).
 *
 * Si algo no cierra (costo irresoluble, PVP por debajo del costo, ganancia
 * negativa, descuento de un partner sin ítems suyos) la entry queda
 * status='needs_review' (no cuenta como disponible) para que la resuelva un
 * admin — nunca se clampea a 0 en silencio.
 *
 * metadata.breakdown NUNCA lleva costo del proveedor ni margen de Novamente: la
 * lee el workspace del partner (con whitelist) y el admin interno (platform),
 * que calcula el costo Dreamful por su cuenta con `clase_estampa`.
 */
import { supabaseAdmin } from '@/lib/supabase-admin'
import {
  costoPartnerUnitario,
  esDobleEstampaItem,
  claseEstampaProveedor,
  guessGarmentKey,
  type ClaseEstampaProveedor,
} from './partner-cost'
import type { Plan } from './types'

// Re-export: app/api/partners/orders/route.ts lo importa desde acá.
export { guessGarmentKey }

export interface OrderItemLike {
  id?: string | null
  item_name?: string | null
  product_type?: string | null
  product_color?: string | null
  product_size?: string | null
  quantity?: number | null
  unit_price?: number | null
  total_price?: number | null
  partner_product_id?: string | null
  front_design_url?: string | null
  back_design_url?: string | null
  metadata?: Record<string, unknown> | null
}

export interface PartnerProductLite {
  id?: string
  tenant_id?: string
  name: string
  category: string | null
  metadata: Record<string, unknown> | null
}

export interface BreakdownLine {
  /** Nombre del ítem tal como quedó en el pedido. */
  item: string
  order_item_id: string | null
  product_id: string | null
  qty: number
  /** PVP unitario. */
  unit: number
  garment_key: string | null
  color: string | null
  talle: string | null
  doble_estampa: boolean
  /** Precio del plan por prenda (sin recargo). null = irresoluble. */
  costo_base: number | null
  /** Recargo por doble estampa por prenda (0 si es simple). */
  recargo_doble: number
  /** Costo partner por prenda = costo_base + recargo_doble. null = irresoluble. */
  cost: number | null
  /** Parte del descuento del pedido asignada a esta línea (total de la línea). */
  descuento: number
  /** (unit − cost) × qty − descuento. null si el costo es irresoluble. */
  ganancia: number | null
  /** Tamaño de estampa para el costo del proveedor (uso interno de platform). */
  clase_estampa: ClaseEstampaProveedor
  bajo_costo?: boolean
  via: string
}

export interface MarginResult {
  margin: number
  needsReview: boolean
  breakdown: BreakdownLine[]
  reasons: string[]
}

const UUID_PREFIX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i

/**
 * id del partner_product de un ítem: la columna, o el prefijo UUID de
 * metadata.itemId (`<productId>-<talle>-<color>-<ts>`, lo arma AddToCartButtons).
 */
export function partnerProductIdDeItem(item: OrderItemLike): string | null {
  if (item.partner_product_id) return item.partner_product_id
  const itemId = (item.metadata as Record<string, unknown> | null | undefined)?.itemId
  if (typeof itemId === 'string') {
    const m = itemId.match(UUID_PREFIX)
    if (m) return m[0].toLowerCase()
  }
  return null
}

/** Match legacy por nombre ("Nombre — Marca" empieza con el nombre del producto). El más largo gana. */
function matchPorNombre(item: OrderItemLike, products: PartnerProductLite[]): PartnerProductLite | null {
  const itemName = (item.item_name || '').toLowerCase()
  if (!itemName) return null
  const candidatos = products
    .filter((p) => p.name && itemName.startsWith(p.name.toLowerCase()))
    .sort((a, b) => b.name.length - a.name.length)
  return candidatos[0] || null
}

/** Producto de un ítem: por id (columna o metadata.itemId) y, si no, por nombre. */
export function matchProduct(item: OrderItemLike, products: PartnerProductLite[]): PartnerProductLite | null {
  const id = partnerProductIdDeItem(item)
  if (id) {
    const byId = products.find((p) => p.id && p.id.toLowerCase() === id)
    if (byId) return byId
  }
  return matchPorNombre(item, products)
}

/** Reparte `total` entre las líneas proporcional a `pesos` (enteros; la última absorbe el redondeo). */
function prorratear(total: number, pesos: number[]): number[] {
  const suma = pesos.reduce((a, b) => a + b, 0)
  if (!(total > 0) || suma <= 0) return pesos.map(() => 0)
  let restante = Math.round(total)
  return pesos.map((w, i) => {
    if (i === pesos.length - 1) return restante
    const share = Math.min(restante, Math.round((w / suma) * total))
    restante -= share
    return share
  })
}

/**
 * Ganancia del partner para SUS ítems de un pedido (los del mismo tenant).
 * Pura: sin DB. `products` son los productos donde buscar el de cada ítem.
 * `discountARS` = descuento a cargo de este partner (se prorratea entre sus ítems).
 */
export function computeOrderMargin(
  items: OrderItemLike[],
  products: PartnerProductLite[],
  plan: Plan,
  opts: { discountARS?: number } = {},
): MarginResult {
  const reasons: string[] = []
  let needsReview = false

  const lineas = items.map((it) => {
    const qty = Number(it.quantity) || 1
    const unit = Number(it.unit_price) || (Number(it.total_price) || 0) / qty
    return { it, qty, unit }
  })
  const descuentos = prorratear(Number(opts.discountARS) || 0, lineas.map((l) => l.unit * l.qty))

  const breakdown: BreakdownLine[] = lineas.map(({ it, qty, unit }, idx) => {
    const product = matchProduct(it, products)
    const meta = (product?.metadata || {}) as Record<string, unknown>
    const doble = esDobleEstampaItem(it, product?.metadata)
    const costo = costoPartnerUnitario({
      metadata: product?.metadata,
      plan,
      doble,
      fallbacks: [
        typeof meta.model === 'string' ? meta.model : null,
        product?.category,
        it.product_type,
        it.item_name,
      ],
    })
    const descuento = descuentos[idx]
    const line: BreakdownLine = {
      item: it.item_name || '?',
      order_item_id: it.id || null,
      product_id: product?.id || partnerProductIdDeItem(it),
      qty,
      unit,
      garment_key: costo?.garmentKey ?? null,
      color: it.product_color && it.product_color !== 'unknown' ? it.product_color : (typeof meta.color === 'string' ? meta.color : null),
      talle: it.product_size && it.product_size !== 'unknown' ? it.product_size : null,
      doble_estampa: doble,
      costo_base: costo?.base ?? null,
      recargo_doble: costo?.recargoDoble ?? 0,
      cost: costo?.total ?? null,
      descuento,
      ganancia: null,
      clase_estampa: claseEstampaProveedor(it, product?.metadata),
      via: costo?.via ?? 'unresolved',
    }
    if (!costo) {
      needsReview = true
      reasons.push(`costo_irresoluble:${line.item}`)
      return line
    }
    line.ganancia = Math.round((unit - costo.total) * qty - descuento)
    if (unit < costo.total) {
      line.bajo_costo = true
      needsReview = true
      reasons.push(`pvp_bajo_costo:${line.item}`)
    }
    return line
  })

  const margin = breakdown.reduce((sum, l) => sum + (l.ganancia ?? 0), 0)
  if (margin < 0) {
    needsReview = true
    reasons.push('ganancia_negativa')
  }
  return { margin: Math.round(margin), needsReview, breakdown, reasons }
}

export interface TenantCredit {
  tenantId: string
  /** Monto acreditado (≥ 0). */
  amount: number
  /** Ganancia calculada (puede ser < 0 si quedó en revisión). */
  computed: number
  needsReview: boolean
  breakdown: BreakdownLine[]
  reasons: string[]
  /** true = se insertó ahora; false = ya existía (idempotencia) o falló. */
  inserted: boolean
  alreadyExisted: boolean
  error?: string
}

export interface CreditResult {
  /** Ganancia acreditada al tenant del pedido (compat con los callers viejos). */
  margin: number
  needsReview: boolean
  credits: TenantCredit[]
  /** Ítems que no son de ningún partner (prendas propias de Novamente, etc.). */
  excluded: Array<{ item: string; order_item_id: string | null }>
}

export interface OrderForCredit {
  id: string
  tenant_id: string | null
  order_number?: string | null
  items?: OrderItemLike[] | null
  metadata?: Record<string, unknown> | null
}

const PRODUCT_COLS = 'id, tenant_id, name, category, metadata'

export interface PlannedCredit {
  tenantId: string
  plan: Plan
  /** Monto a acreditar (≥ 0). */
  amount: number
  /** Ganancia calculada (puede ser < 0 si queda en revisión). */
  computed: number
  needsReview: boolean
  breakdown: BreakdownLine[]
  reasons: string[]
  descuento: number
}

/**
 * Calcula (SIN escribir nada) qué se le acreditaría a cada partner por un
 * pedido. Lo usan creditOrderMargin y el dry-run del barrido.
 */
export async function planOrderCredits(
  order: OrderForCredit,
): Promise<{ credits: PlannedCredit[]; excluded: CreditResult['excluded'] }> {
  const sb = supabaseAdmin as any
  const items = order.items || []

  // 1) Productos referenciados por id + productos del tenant del pedido (match legacy por nombre).
  const ids = [...new Set(items.map(partnerProductIdDeItem).filter((x): x is string => !!x))]
  const [byIdRes, tenantRes] = await Promise.all([
    ids.length ? sb.from('partner_products').select(PRODUCT_COLS).in('id', ids) : Promise.resolve({ data: [] }),
    order.tenant_id
      ? sb.from('partner_products').select(PRODUCT_COLS).eq('tenant_id', order.tenant_id)
      : Promise.resolve({ data: [] }),
  ])
  const byId: PartnerProductLite[] = byIdRes?.data || []
  const deTenant: PartnerProductLite[] = tenantRes?.data || []

  // 2) Agrupar ítems por el tenant dueño de su producto.
  const grupos = new Map<string, { items: OrderItemLike[]; products: PartnerProductLite[] }>()
  const excluded: CreditResult['excluded'] = []
  for (const it of items) {
    const id = partnerProductIdDeItem(it)
    const product = (id && byId.find((p) => p.id?.toLowerCase() === id)) || matchPorNombre(it, deTenant) || null
    const tenantId = product?.tenant_id || null
    if (!product || !tenantId) {
      excluded.push({ item: it.item_name || '?', order_item_id: it.id || null })
      continue
    }
    const g = grupos.get(tenantId) || { items: [], products: [] }
    g.items.push(it)
    if (!g.products.includes(product)) g.products.push(product)
    grupos.set(tenantId, g)
  }

  // Un pedido con tenant_id pero sin ningún ítem reconocible es raro → revisión.
  const reasonsExtra = new Map<string, string[]>()
  const addReason = (t: string, r: string) => reasonsExtra.set(t, [...(reasonsExtra.get(t) || []), r])
  if (grupos.size === 0 && order.tenant_id) {
    grupos.set(order.tenant_id, { items: [], products: [] })
    addReason(order.tenant_id, 'sin_items_de_partner')
  }

  // 3) Descuento: a cargo del partner dueño del código (decisión Juan 27/09).
  const meta = (order.metadata || {}) as Record<string, unknown>
  const discountARS = Math.max(0, Number(meta.discount_ars) || 0)
  const descuentoPorTenant = new Map<string, number>()
  if (discountARS > 0) {
    let owner: string | null = null
    if (typeof meta.discount_code_id === 'string') {
      const { data: code } = await sb
        .from('partner_discount_codes')
        .select('tenant_id')
        .eq('id', meta.discount_code_id)
        .maybeSingle()
      owner = code?.tenant_id || null
    }
    // Código borrado/desconocido: el descuento se aplicó en la tienda del pedido.
    if (!owner) owner = order.tenant_id
    if (owner) {
      if (!grupos.has(owner)) {
        grupos.set(owner, { items: [], products: [] })
        addReason(owner, 'descuento_sin_items_propios')
      }
      descuentoPorTenant.set(owner, discountARS)
    }
  }

  // 4) Plan de cada tenant.
  const tenantIds = [...grupos.keys()]
  const { data: tenants } = tenantIds.length
    ? await sb.from('tenants').select('id, plan').in('id', tenantIds)
    : { data: [] }
  const planDe = new Map<string, Plan>((tenants || []).map((t: any) => [t.id, (t.plan as Plan) || 'starter']))

  // 5) Cálculo por tenant.
  const credits: PlannedCredit[] = []
  for (const [tenantId, g] of grupos) {
    const plan = planDe.get(tenantId) || 'starter'
    const descuento = descuentoPorTenant.get(tenantId) || 0
    const r = computeOrderMargin(g.items, g.products, plan, { discountARS: descuento })
    const reasons = [...r.reasons, ...(reasonsExtra.get(tenantId) || [])]
    credits.push({
      tenantId,
      plan,
      amount: Math.max(0, r.margin),
      computed: r.margin,
      needsReview: r.needsReview || reasons.length > 0,
      breakdown: r.breakdown,
      reasons,
      descuento,
    })
  }
  return { credits, excluded }
}

/**
 * Acredita la ganancia de una venta web confirmada al ledger de cada partner
 * dueño de sus ítems. Idempotente (unique index por tenant+order en credits:
 * re-correrla no duplica). Siempre deja una entry por partner, aunque la
 * ganancia sea 0, así el barrido sabe que el pedido ya se procesó.
 * No lanza: loguea y devuelve lo que pudo.
 */
export async function creditOrderMargin(order: OrderForCredit): Promise<CreditResult> {
  const empty: CreditResult = { margin: 0, needsReview: false, credits: [], excluded: [] }
  try {
    const sb = supabaseAdmin as any
    const { credits: planned, excluded } = await planOrderCredits(order)

    const credits: TenantCredit[] = []
    for (const p of planned) {
      const credit: TenantCredit = {
        tenantId: p.tenantId,
        amount: p.amount,
        computed: p.computed,
        needsReview: p.needsReview,
        breakdown: p.breakdown,
        reasons: p.reasons,
        inserted: false,
        alreadyExisted: false,
      }
      const { error } = await sb.from('partner_ledger_entries').insert({
        tenant_id: p.tenantId,
        order_id: order.id,
        source: 'web_order',
        type: 'credit',
        amount: p.amount,
        concept: `Ganancia venta ${order.order_number || order.id.slice(0, 8)}`,
        status: p.needsReview ? 'needs_review' : 'confirmed',
        metadata: {
          version: 2,
          order_number: order.order_number || null,
          plan: p.plan,
          breakdown: p.breakdown,
          descuento: p.descuento,
          computed: p.computed,
          reasons: p.reasons,
          excluded,
        },
      })
      if (error) {
        // 23505 = unique violation → ya acreditada (idempotencia), no es error
        if (error.code === '23505') {
          credit.alreadyExisted = true
          console.log('[ledger] crédito ya existía para orden', order.id, 'tenant', p.tenantId)
        } else {
          credit.error = error.message
          console.error('[ledger] error acreditando:', error.message)
        }
      } else {
        credit.inserted = true
        console.log(
          `[ledger] ✅ acreditado $${p.amount} a tenant ${p.tenantId} (orden ${order.order_number})${p.needsReview ? ` [NEEDS REVIEW: ${p.reasons.join(', ')}]` : ''}`,
        )
      }
      credits.push(credit)
    }

    const own = credits.find((c) => c.tenantId === order.tenant_id)
    return {
      margin: own?.amount ?? 0,
      needsReview: credits.some((c) => c.needsReview),
      credits,
      excluded,
    }
  } catch (e: any) {
    console.error('[ledger] exception:', e?.message)
    return empty
  }
}

/**
 * Revierte la ganancia acreditada de una orden (refund/chargeback), como asiento
 * inverso por cada partner con crédito confirmado — nunca borra ni edita la
 * entry original (trazabilidad contable). Si ya se le pagó, su saldo queda
 * negativo y se compensa con las próximas ventas (decisión Juan 27/09).
 * Idempotente por (tenant, orden): un reverso existente no se repite. Si nunca
 * hubo credit confirmado (needs_review o sin crédito), no hace nada. No lanza.
 */
export async function reverseOrderMargin(order: {
  id: string
  tenant_id?: string | null
  order_number?: string | null
}): Promise<{ reversed: boolean; amount: number }> {
  try {
    const sb = supabaseAdmin as any

    const { data: credits } = await sb
      .from('partner_ledger_entries')
      .select('id, tenant_id, amount')
      .eq('order_id', order.id)
      .eq('type', 'credit')
      .eq('source', 'web_order')
      .eq('status', 'confirmed')
    if (!credits?.length) {
      console.log('[ledger] sin crédito confirmado previo — nada que revertir para orden', order.id)
      return { reversed: false, amount: 0 }
    }

    const { data: reversals } = await sb
      .from('partner_ledger_entries')
      .select('tenant_id')
      .eq('order_id', order.id)
      .eq('source', 'order_refund')
    const yaRevertidos = new Set((reversals || []).map((r: any) => r.tenant_id))

    let total = 0
    for (const c of credits) {
      if (yaRevertidos.has(c.tenant_id)) {
        console.log('[ledger] reverso ya existía para orden', order.id, 'tenant', c.tenant_id)
        continue
      }
      const amount = Number(c.amount) || 0
      if (amount <= 0) continue
      const { error } = await sb.from('partner_ledger_entries').insert({
        tenant_id: c.tenant_id,
        order_id: order.id,
        source: 'order_refund',
        type: 'debit',
        amount,
        concept: `Reverso por reembolso venta ${order.order_number || order.id.slice(0, 8)}`,
        status: 'confirmed',
        metadata: { reverses_entry_id: c.id },
      })
      if (error) {
        if (error.code === '23505') console.log('[ledger] reverso ya existía (constraint) para orden', order.id)
        else console.error('[ledger] error revirtiendo ganancia:', error.message)
        continue
      }
      total += amount
      console.log(`[ledger] ↩️ reversado $${amount} del tenant ${c.tenant_id} (orden ${order.order_number || order.id})`)
    }
    return { reversed: total > 0, amount: total }
  } catch (e: any) {
    console.error('[ledger] exception revirtiendo ganancia:', e?.message)
    return { reversed: false, amount: 0 }
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
