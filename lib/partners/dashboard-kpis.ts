/**
 * KPIs del dashboard del partner — derivados de partner_orders + partner_leads.
 */
import { supabaseAdmin } from '@/lib/supabase-admin'

const db = () => supabaseAdmin as any

export interface DashboardKPIs {
  revenue30d: number
  revenuePrev30d: number
  revenueChangePct: number
  orders30d: number
  ordersPrev30d: number
  avgOrderValue: number
  topProduct: { name: string; units: number; revenue: number } | null
  leadsThisMonth: number
  conversionRate: number // orders / leads %
  pendingOrders: number
  approvedOrders: number
  fulfilledOrders: number
  ordersByDay: Array<{ date: string; count: number; revenue: number }>
}

const MS_DAY = 24 * 60 * 60 * 1000

export async function getDashboardKPIs(tenantId: string): Promise<DashboardKPIs> {
  const now = new Date()
  const t30d = new Date(now.getTime() - 30 * MS_DAY).toISOString()
  const t60d = new Date(now.getTime() - 60 * MS_DAY).toISOString()

  // Ordenes ultimos 60 dias
  const { data: ordersRaw } = await db()
    .from('partner_orders')
    .select('id, total, items, status, payment_status, created_at')
    .eq('tenant_id', tenantId)
    .gte('created_at', t60d)
    .order('created_at', { ascending: false })

  const orders = (ordersRaw || []) as any[]
  const isPaid = (o: any) => o.payment_status === 'approved' || ['confirmed', 'producing', 'shipped', 'delivered'].includes(o.status)
  const isFulfilled = (o: any) => ['shipped', 'delivered'].includes(o.status)

  const last30 = orders.filter(o => new Date(o.created_at).getTime() > now.getTime() - 30 * MS_DAY)
  const prev30 = orders.filter(o => {
    const t = new Date(o.created_at).getTime()
    return t > now.getTime() - 60 * MS_DAY && t <= now.getTime() - 30 * MS_DAY
  })

  const revenue30d = last30.filter(isPaid).reduce((sum, o) => sum + (o.total || 0), 0)
  const revenuePrev30d = prev30.filter(isPaid).reduce((sum, o) => sum + (o.total || 0), 0)
  const revenueChangePct = revenuePrev30d > 0
    ? Math.round(((revenue30d - revenuePrev30d) / revenuePrev30d) * 100)
    : revenue30d > 0 ? 100 : 0

  const orders30d = last30.filter(isPaid).length
  const ordersPrev30d = prev30.filter(isPaid).length
  const avgOrderValue = orders30d > 0 ? Math.round(revenue30d / orders30d) : 0

  // Top product (por revenue)
  const productMap = new Map<string, { name: string; units: number; revenue: number }>()
  for (const o of last30.filter(isPaid)) {
    for (const item of (o.items || []) as any[]) {
      const name = item.name || 'Producto'
      const prev = productMap.get(name) || { name, units: 0, revenue: 0 }
      prev.units += item.quantity || 1
      prev.revenue += (item.unit_price || 0) * (item.quantity || 1)
      productMap.set(name, prev)
    }
  }
  const topProduct = Array.from(productMap.values()).sort((a, b) => b.revenue - a.revenue)[0] || null

  // Leads ultimos 30 dias (ventana rolling, consistente con orders30d)
  const { count: leadsCount } = await db()
    .from('partner_leads')
    .select('id', { count: 'exact', head: true })
    .eq('tenant_id', tenantId)
    .gte('created_at', t30d)
  const leadsThisMonth = leadsCount || 0

  const conversionRate = leadsThisMonth > 0
    ? Math.round((orders30d / leadsThisMonth) * 100)
    : 0

  // Status breakdown
  const pendingOrders = orders.filter(o => o.status === 'pending').length
  const approvedOrders = orders.filter(o => isPaid(o) && !isFulfilled(o)).length
  const fulfilledOrders = orders.filter(isFulfilled).length

  // Daily breakdown (30 dias)
  const byDay = new Map<string, { count: number; revenue: number }>()
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now.getTime() - i * MS_DAY)
    const key = d.toISOString().slice(0, 10)
    byDay.set(key, { count: 0, revenue: 0 })
  }
  for (const o of last30.filter(isPaid)) {
    const key = o.created_at.slice(0, 10)
    const entry = byDay.get(key)
    if (entry) {
      entry.count += 1
      entry.revenue += o.total || 0
    }
  }
  const ordersByDay = Array.from(byDay.entries()).map(([date, v]) => ({ date, ...v }))

  return {
    revenue30d,
    revenuePrev30d,
    revenueChangePct,
    orders30d,
    ordersPrev30d,
    avgOrderValue,
    topProduct,
    leadsThisMonth,
    conversionRate,
    pendingOrders,
    approvedOrders,
    fulfilledOrders,
    ordersByDay,
  }
}
