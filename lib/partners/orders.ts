import { supabaseAdmin } from '@/lib/supabase-admin'

const db = () => supabaseAdmin as any

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
  }>
  total: number | null
  currency: string
  status: 'pending' | 'confirmed' | 'producing' | 'shipped' | 'delivered' | 'cancelled'
  payment_id: string | null
  payment_status: 'pending' | 'approved' | 'rejected' | 'refunded'
  shipping_info: Record<string, unknown>
  notes: string | null
  created_at: string
  updated_at: string
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
    })
    .select()
    .single()

  if (error || !data) return null
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
  updates: Partial<Pick<PartnerOrder, 'notes' | 'shipping_info' | 'payment_status' | 'status'>>
): Promise<PartnerOrder | null> {
  const { data, error } = await db()
    .from('partner_orders')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .select()
    .single()

  if (error || !data) return null
  return data as PartnerOrder
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
