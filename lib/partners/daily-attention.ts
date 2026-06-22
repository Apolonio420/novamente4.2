import { supabaseAdmin } from '@/lib/supabase-admin'
import { getPartnerPlanPrice } from './garment-pricing'
import type { Plan } from './types'

const db = () => supabaseAdmin as any

export type AttentionPriority = 'critical' | 'warning' | 'info'
export type AttentionEntity = 'lead' | 'order' | 'catalog' | 'finance' | 'feed'

export interface DailyAttentionItem {
  id: string
  priority: AttentionPriority
  entity: AttentionEntity
  title: string
  reason: string
  dueAt: string | null
  actionUrl: string
  actionLabel: string
}

const HOUR = 60 * 60 * 1000
const TERMINAL_FULFILLMENT = new Set(['delivered', 'cancelled'])

function priorityWeight(priority: AttentionPriority) {
  return priority === 'critical' ? 0 : priority === 'warning' ? 1 : 2
}

/**
 * Computes a compact, actionable queue instead of a decorative activity feed.
 * Every item must point to the workspace surface that resolves it.
 */
export async function getDailyAttention(tenant: { id: string; plan: Plan }): Promise<DailyAttentionItem[]> {
  const now = Date.now()
  const staleLeadAt = new Date(now - 24 * HOUR).toISOString()
  const staleOrderAt = new Date(now - 48 * HOUR).toISOString()

  const [leadsRes, ordersRes, productsRes, payoutsRes] = await Promise.all([
    db()
      .from('partner_leads')
      .select('id, name, status, created_at, next_action_at')
      .eq('tenant_id', tenant.id)
      .in('status', ['new', 'contacted', 'qualified'])
      .order('created_at', { ascending: true })
      .limit(100),
    db()
      .from('partner_orders')
      .select('id, status, fulfillment_status, updated_at, fulfillment_updated_at, estimated_delivery_at')
      .eq('tenant_id', tenant.id)
      .order('updated_at', { ascending: true })
      .limit(100),
    db()
      .from('partner_products')
      .select('id, name, status, price, images, metadata')
      .eq('tenant_id', tenant.id)
      .in('status', ['draft', 'ready', 'published'])
      .limit(150),
    db()
      .from('partner_payouts')
      .select('id, amount, status, requested_at')
      .eq('tenant_id', tenant.id)
      .eq('status', 'requested')
      .order('requested_at', { ascending: true })
      .limit(25),
  ])

  const items: DailyAttentionItem[] = []
  for (const lead of leadsRes.data || []) {
    const nextActionAt = lead.next_action_at ? new Date(lead.next_action_at).getTime() : null
    const createdAt = new Date(lead.created_at).getTime()
    const overdueAction = nextActionAt !== null && nextActionAt <= now
    const noResponse = lead.status === 'new' && createdAt <= new Date(staleLeadAt).getTime()
    if (!overdueAction && !noResponse) continue

    const displayName = lead.name || 'Lead sin nombre'
    items.push({
      id: `lead:${lead.id}`,
      priority: noResponse && now - createdAt > 48 * HOUR ? 'critical' : 'warning',
      entity: 'lead',
      title: overdueAction ? `Seguimiento vencido: ${displayName}` : `Responder a ${displayName}`,
      reason: overdueAction ? 'La próxima acción ya venció.' : 'Este lead nuevo lleva más de 24 h sin respuesta.',
      dueAt: lead.next_action_at || lead.created_at,
      actionUrl: '/workspace/leads?attention=true',
      actionLabel: 'Abrir lead',
    })
  }

  for (const order of ordersRes.data || []) {
    const fulfillment = order.fulfillment_status || 'awaiting_art_approval'
    if (TERMINAL_FULFILLMENT.has(fulfillment)) continue
    if (fulfillment === 'exception') {
      items.push({
        id: `order:${order.id}`,
        priority: 'critical',
        entity: 'order',
        title: `Pedido #${order.id.slice(0, 8)} con incidencia`,
        reason: 'La operación requiere intervención manual antes de continuar.',
        dueAt: order.fulfillment_updated_at || order.updated_at,
        actionUrl: `/workspace/orders?order=${order.id}`,
        actionLabel: 'Resolver incidencia',
      })
      continue
    }
    const updatedAt = new Date(order.fulfillment_updated_at || order.updated_at).getTime()
    const eta = order.estimated_delivery_at ? new Date(order.estimated_delivery_at).getTime() : null
    const etaOverdue = eta !== null && eta < now
    const stale = updatedAt < new Date(staleOrderAt).getTime()
    if (!etaOverdue && !stale) continue

    items.push({
      id: `order:${order.id}`,
      priority: etaOverdue ? 'critical' : 'warning',
      entity: 'order',
      title: `Pedido #${order.id.slice(0, 8)} necesita seguimiento`,
      reason: etaOverdue ? 'La fecha estimada de entrega ya venció.' : 'No tiene movimiento operativo hace más de 48 h.',
      dueAt: order.estimated_delivery_at || order.fulfillment_updated_at || order.updated_at,
      actionUrl: `/workspace/orders?order=${order.id}`,
      actionLabel: 'Ver pedido',
    })
  }

  for (const product of productsRes.data || []) {
    const missingPrice = !product.price || Number(product.price) <= 0
    const missingImage = !Array.isArray(product.images) || product.images.length === 0
    const metadata = (product.metadata || {}) as Record<string, unknown>
    const garmentKey = typeof metadata.garmentKey === 'string' ? metadata.garmentKey : null
    const cost = garmentKey ? getPartnerPlanPrice(garmentKey, tenant.plan) : null
    const lowMargin = product.status === 'published' && cost !== null && Number(product.price || 0) <= cost

    if (product.status === 'published' && (missingPrice || missingImage)) {
      items.push({
        id: `feed:${product.id}`,
        priority: 'critical',
        entity: 'feed',
        title: `${product.name} no está listo para vender`,
        reason: missingPrice ? 'Falta un precio válido.' : 'Falta una imagen de producto.',
        dueAt: null,
        actionUrl: '/workspace/catalog',
        actionLabel: 'Corregir producto',
      })
    } else if (lowMargin) {
      items.push({
        id: `catalog:${product.id}`,
        priority: 'warning',
        entity: 'catalog',
        title: `${product.name} se vende sin margen`,
        reason: 'El precio de venta es igual o menor al costo de producción del plan.',
        dueAt: null,
        actionUrl: '/workspace/catalog',
        actionLabel: 'Revisar precio',
      })
    } else if (product.status !== 'published' && (missingPrice || missingImage)) {
      items.push({
        id: `catalog:${product.id}`,
        priority: 'info',
        entity: 'catalog',
        title: `${product.name} está incompleto`,
        reason: `${missingPrice ? 'Definí el precio' : 'Subí una imagen'} para poder publicarlo.`,
        dueAt: null,
        actionUrl: '/workspace/catalog',
        actionLabel: 'Completar producto',
      })
    }
  }

  for (const payout of payoutsRes.data || []) {
    const requestedAt = new Date(payout.requested_at).getTime()
    if (requestedAt > now - 24 * HOUR) continue
    items.push({
      id: `payout:${payout.id}`,
      priority: requestedAt < now - 48 * HOUR ? 'critical' : 'warning',
      entity: 'finance',
      title: `Retiro de $${Number(payout.amount).toLocaleString('es-AR')} pendiente`,
      reason: 'La liquidación está pendiente de confirmación del equipo Novamente.',
      dueAt: payout.requested_at,
      actionUrl: '/workspace/finanzas',
      actionLabel: 'Ver liquidación',
    })
  }

  return items
    .sort((a, b) => {
      const priority = priorityWeight(a.priority) - priorityWeight(b.priority)
      if (priority !== 0) return priority
      return new Date(a.dueAt || 0).getTime() - new Date(b.dueAt || 0).getTime()
    })
    .slice(0, 12)
}
