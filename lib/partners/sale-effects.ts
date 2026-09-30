/**
 * Efectos de una VENTA WEB de tienda partner, con el pago ya confirmado.
 *
 * Un solo lugar para lo que antes vivía inline en process-payment (y solo corría
 * para Mercado Pago — las transferencias confirmadas por link nunca acreditaban
 * al partner, caso NOV-20260926-9852):
 *   1. Ganancia al ledger de cada partner dueño de ítems (creditOrderMargin).
 *   2. Bridge a partner_orders (el pedido aparece en el panel del partner).
 *   3. Mail al partner con el detalle (solo si `notifyPartner`).
 *   4. Telegram a Novamente: "💸 Deuda partner …" (solo la primera vez que se acredita).
 *
 * Lo llaman: runConfirmedOrderEffects (webhook MP + /api/payments/confirm),
 * /api/admin/confirm-transfer (POST) y el barrido (lib/partners/ledger-sweep.ts,
 * con notifyPartner=false: un pedido que se acredita tarde no le dispara un mail
 * automático al partner — Novamente lo avisa a mano desde el aviso de Telegram).
 *
 * Seguro de re-ejecutar: el crédito es idempotente (unique index), el bridge
 * busca antes de insertar (y hay unique index tenant+payment_id), el mail lleva
 * guard persistido en metadata (partner_notified_tenants) y el Telegram solo sale
 * cuando el crédito se insertó en esta corrida. No lanza.
 */
import { supabaseAdmin } from '@/lib/supabase-admin'
import { updateOrder } from '@/lib/db'
import { creditOrderMargin, type CreditResult, type OrderItemLike, type TenantCredit } from './ledger'
import { payoutModeDe } from './payout-mode'
import { drop7LabelForTenants } from './drop7'

export interface SaleOrder {
  id: string
  tenant_id: string | null
  order_number?: string | null
  payment_method?: string | null
  payment_id?: string | null
  customer_first_name?: string | null
  customer_last_name?: string | null
  customer_email?: string | null
  customer_phone?: string | null
  shipping_address?: string | null
  shipping_city?: string | null
  shipping_postal_code?: string | null
  shipping_cost?: number | null
  currency?: string | null
  items?: OrderItemLike[] | null
  metadata?: Record<string, unknown> | null
  /** Fecha de creación del pedido — solo se usa para la etiqueta DROP7. */
  created_at?: string | null
}

/**
 * Clave de la venta en partner_orders.payment_id. MP: el id del pago (único).
 * Transferencia: `transfer:<nro pedido>` — el nro. de operación NO sirve de clave
 * (el link de confirmación lleva op="manual" por defecto y dos pedidos distintos
 * se pisarían en la misma fila).
 */
export function partnerSaleKey(order: SaleOrder, paymentId?: string | null): string {
  if (order.payment_method === 'transferencia') return `transfer:${order.order_number || order.id}`
  const pid = paymentId ?? order.payment_id
  if (pid && pid !== 'manual') return String(pid)
  return `web:${order.id}`
}

const customerName = (o: SaleOrder) =>
  `${o.customer_first_name || ''} ${o.customer_last_name || ''}`.trim() || null

async function bridgePartnerOrders(order: SaleOrder, saleKey: string, credits: TenantCredit[]): Promise<void> {
  const sb = supabaseAdmin as any
  for (const c of credits) {
    const ids = new Set(c.breakdown.map((l) => l.order_item_id).filter(Boolean))
    const items = (order.items || []).filter((it) => it.id && ids.has(it.id))
    if (!items.length) continue
    try {
      // No pisar un bridge existente: el partner puede haber avanzado el estado
      // de fulfillment; re-escribir 'confirmed' lo haría retroceder.
      const { data: existing } = await sb
        .from('partner_orders')
        .select('id')
        .eq('tenant_id', c.tenantId)
        .eq('payment_id', saleKey)
        .limit(1)
      if (existing?.length) continue

      const total = c.breakdown.reduce((s, l) => s + l.unit * l.qty - l.descuento, 0)
      const { error } = await sb.from('partner_orders').insert({
        tenant_id: c.tenantId,
        customer_name: customerName(order),
        customer_email: order.customer_email || null,
        customer_phone: order.customer_phone || null,
        items,
        total: Math.round(total),
        currency: order.currency || 'ARS',
        status: 'confirmed',
        fulfillment_status: 'queued_for_production',
        payment_id: saleKey,
        // Ojo: partner_orders en prod NO tiene payment_status (la migración vieja
        // create_partner_orders_table.sql no refleja el esquema real) — mandarlo
        // hacía fallar el insert con PGRST204 (así nunca funcionó el bridge de MP).
        shipping_info: {
          source: 'web',
          address: order.shipping_address || null,
          city: order.shipping_city || null,
          postal_code: order.shipping_postal_code || null,
          cost: order.shipping_cost || 0,
        },
        notes: `Venta web ${order.order_number || order.id} — la produce y despacha Novamente.`,
      })
      if (error && error.code !== '23505') console.error('❌ Error bridgeando a partner_orders:', error.message)
      else if (!error) console.log('✅ Venta bridgeada a partner_orders para tenant:', c.tenantId)
    } catch (e: any) {
      console.error('❌ Exception bridgeando partner_orders:', e?.message)
    }
  }
}

export interface PartnerSaleEffectsResult {
  meta: Record<string, any>
  credit: CreditResult | null
  /** "🚀 DROP7 · <Marca>" si algún tenant de la venta está en su semana de lanzamiento, si no null. */
  drop7Label: string | null
}

export async function runPartnerSaleEffects(
  order: SaleOrder,
  opts: { saleKey: string; meta: Record<string, any>; notifyPartner?: boolean },
): Promise<PartnerSaleEffectsResult> {
  const meta: Record<string, any> = { ...opts.meta }
  let credit: CreditResult | null = null
  try {
    credit = await creditOrderMargin({
      id: order.id,
      tenant_id: order.tenant_id,
      order_number: order.order_number,
      items: order.items,
      metadata: order.metadata || meta,
    })
  } catch (e: any) {
    console.error('❌ Exception acreditando ganancia partner:', e?.message)
  }
  if (!credit) return { meta, credit, drop7Label: null }

  await bridgePartnerOrders(order, opts.saleKey, credit.credits)

  const sb = supabaseAdmin as any
  const ok = credit.credits.filter((c) => c.inserted || c.alreadyExisted)
  const tenantIds = ok.map((c) => c.tenantId)
  const { data: tenants } = tenantIds.length
    ? await sb.from('tenants').select('id, name, slug, email, bank_alias, bank_cbu, metadata').in('id', tenantIds)
    : { data: [] }
  const tenantById = new Map<string, any>((tenants || []).map((t: any) => [t.id, t]))

  // DROP7 (piloto lanzamiento 7 días): etiqueta si CUALQUIER tenant de la
  // venta está en su ventana. Solo lectura de metadata — nunca puede romper
  // el resto de los efectos de venta.
  let drop7Label: string | null = null
  try {
    drop7Label = drop7LabelForTenants(Array.from(tenantById.values()), order.created_at)
  } catch (e: any) {
    console.error('❌ Exception calculando etiqueta DROP7:', e?.message)
  }

  // Mail al partner (solo confirmaciones en vivo). Guard por tenant en metadata.
  // Pedidos avisados con el esquema viejo (un solo flag, sin lista por tenant): no re-avisar.
  const legacyAvisado = !!meta.partner_notified_at && !Array.isArray(meta.partner_notified_tenants)
  if (opts.notifyPartner && !legacyAvisado) {
    const avisados: string[] = Array.isArray(meta.partner_notified_tenants) ? [...meta.partner_notified_tenants] : []
    let changed = false
    for (const c of ok) {
      const t = tenantById.get(c.tenantId)
      if (!t?.email || avisados.includes(c.tenantId)) continue
      try {
        const { notifyPartnerWebSale } = await import('@/lib/notifications')
        const sent = await notifyPartnerWebSale(t, {
          orderNumber: order.order_number || order.id.slice(0, 8),
          customerName: customerName(order),
          credit: c,
          payoutMode: payoutModeDe(t.metadata),
        })
        if (sent) {
          avisados.push(c.tenantId)
          changed = true
        }
      } catch (e: any) {
        console.error('❌ Error avisando venta al partner:', e?.message)
      }
    }
    if (changed) {
      meta.partner_notified_tenants = avisados
      meta.partner_notified_at = new Date().toISOString()
      await updateOrder(order.id, { metadata: meta } as any)
    }
  }

  // Telegram a Novamente: solo cuando el crédito se creó en ESTA corrida.
  for (const c of credit.credits.filter((x) => x.inserted)) {
    try {
      const t = tenantById.get(c.tenantId)
      const { notifyPartnerDebt } = await import('@/lib/notifications')
      await notifyPartnerDebt({
        tenantSlug: t?.slug || c.tenantId.slice(0, 8),
        tenantName: t?.name || null,
        orderNumber: order.order_number || order.id.slice(0, 8),
        amount: c.amount,
        needsReview: c.needsReview,
        reasons: c.reasons,
        hasBankData: !!(t?.bank_alias || t?.bank_cbu),
        partnerNotified: !!opts.notifyPartner,
        payoutMode: payoutModeDe(t?.metadata),
      })
    } catch (e: any) {
      console.error('❌ Error avisando deuda partner por Telegram:', e?.message)
    }
  }

  return { meta, credit, drop7Label }
}
