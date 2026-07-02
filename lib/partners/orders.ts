import { supabaseAdmin } from '@/lib/supabase-admin'

const db = () => supabaseAdmin as any

export type FulfillmentStatus =
  | 'awaiting_art_approval'
  | 'queued_for_production'
  | 'in_production'
  | 'quality_check'
  | 'ready_to_ship'
  | 'shipped'
  | 'delivered'
  | 'exception'
  | 'cancelled'

export interface PartnerOrder {
  id: string
  tenant_id: string
  customer_name: string | null
  customer_email: string | null
  customer_phone: string | null
  items: Array<{
    product_id?: string
    name: string
    variant?: string
    quantity: number
    unit_price: number
    // Campos partner-safe extra (carga manual). NUNCA costo del proveedor ni margen.
    partner_price?: number       // lo que el partner nos transfiere (lo conoce)
    color?: string
    talle?: string
    doble_estampa?: 'Si' | 'No' | 'Chica'
    mockup_url?: string
  }>
  total: number | null
  currency: string
  // `exception` is a visible legacy-compatible terminal state. It mirrors an
  // operational fulfillment incident so existing list/filter consumers never
  // hide an order that needs manual attention.
  status: 'pending' | 'confirmed' | 'producing' | 'shipped' | 'delivered' | 'exception' | 'cancelled'
  payment_id: string | null
  payment_status: 'pending' | 'approved' | 'rejected' | 'refunded'
  shipping_info: Record<string, unknown>
  notes: string | null
  fulfillment_status: FulfillmentStatus
  estimated_delivery_at: string | null
  carrier: string | null
  tracking_number: string | null
  tracking_url: string | null
  exception_reason: string | null
  fulfillment_updated_at: string
  created_at: string
  updated_at: string
}

export interface PartnerOrderEvent {
  id: string
  tenant_id: string
  order_id: string
  actor_user_id: string | null
  type: 'created' | 'status_changed' | 'fulfillment_changed' | 'tracking_updated' | 'note' | 'exception'
  from_status: string | null
  to_status: string | null
  body: string | null
  metadata: Record<string, unknown>
  created_at: string
}

export async function getOrdersByTenant(
  tenantId: string,
  filters?: { status?: string; limit?: number; offset?: number }
): Promise<PartnerOrder[]> {
  let query = db()
    .from('partner_orders')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })

  if (filters?.status) {
    query = query.eq('status', filters.status)
  }
  if (filters?.limit) {
    query = query.limit(filters.limit)
  }
  if (filters?.offset) {
    query = query.range(filters.offset, filters.offset + (filters.limit || 20) - 1)
  }

  const { data, error } = await query
  if (error || !data) return []
  return data as PartnerOrder[]
}

export async function getOrderById(id: string): Promise<PartnerOrder | null> {
  const { data, error } = await db()
    .from('partner_orders')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !data) return null
  return data as PartnerOrder
}

export async function createOrder(
  tenantId: string,
  input: {
    customer_name?: string
    customer_email?: string
    customer_phone?: string
    items: PartnerOrder['items']
    total?: number
    currency?: string
    payment_id?: string
    notes?: string
    shipping_info?: Record<string, unknown>
  }
): Promise<PartnerOrder | null> {
  const { data, error } = await db()
    .from('partner_orders')
    .insert({
      tenant_id: tenantId,
      customer_name: input.customer_name || null,
      customer_email: input.customer_email || null,
      customer_phone: input.customer_phone || null,
      items: input.items,
      total: input.total || null,
      currency: input.currency || 'ARS',
      payment_id: input.payment_id || null,
      notes: input.notes || null,
      shipping_info: input.shipping_info || {},
    })
    .select()
    .single()

  if (error || !data) return null
  await createOrderEvent(tenantId, data.id, null, 'created').catch(() => {})
  return data as PartnerOrder
}

export async function updateOrderStatus(
  tenantId: string,
  id: string,
  status: PartnerOrder['status']
): Promise<PartnerOrder | null> {
  const { data, error } = await db()
    .from('partner_orders')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .select()
    .single()

  if (error || !data) return null
  return data as PartnerOrder
}

export async function updateOrder(
  tenantId: string,
  id: string,
  updates: Partial<Pick<PartnerOrder,
    'notes' | 'shipping_info' | 'payment_status' | 'status' | 'fulfillment_status'
    | 'estimated_delivery_at' | 'carrier' | 'tracking_number' | 'tracking_url' | 'exception_reason'
  >>,
): Promise<PartnerOrder | null> {
  const { data, error } = await db()
    .from('partner_orders')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('tenant_id', tenantId)
    .eq('id', id)
    .select()
    .single()

  if (error || !data) return null
  return data as PartnerOrder
}

export async function getOrderEvents(
  tenantId: string,
  orderId: string,
  limit = 100,
): Promise<PartnerOrderEvent[]> {
  const { data, error } = await db()
    .from('partner_order_events')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('order_id', orderId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error || !data) return []
  return data as PartnerOrderEvent[]
}

export async function createOrderEvent(
  tenantId: string,
  orderId: string,
  actorUserId: string | null,
  type: PartnerOrderEvent['type'],
  options: {
    fromStatus?: string | null
    toStatus?: string | null
    body?: string | null
    metadata?: Record<string, unknown>
  } = {},
): Promise<PartnerOrderEvent | null> {
  const { data, error } = await db()
    .from('partner_order_events')
    .insert({
      tenant_id: tenantId,
      order_id: orderId,
      actor_user_id: actorUserId,
      type,
      from_status: options.fromStatus || null,
      to_status: options.toStatus || null,
      body: options.body || null,
      metadata: options.metadata || {},
    })
    .select()
    .single()

  if (error || !data) return null
  return data as PartnerOrderEvent
}

export async function countOrdersByTenant(tenantId: string): Promise<number> {
  const { count, error } = await db()
    .from('partner_orders')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', tenantId)

  if (error) return 0
  return count || 0
}

export async function countOrdersByStatus(
  tenantId: string,
  status: PartnerOrder['status']
): Promise<number> {
  const { count, error } = await db()
    .from('partner_orders')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', tenantId)
    .eq('status', status)

  if (error) return 0
  return count || 0
}
