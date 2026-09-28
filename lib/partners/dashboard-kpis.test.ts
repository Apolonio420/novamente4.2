import { beforeEach, describe, expect, it, vi } from 'vitest'

// Mock de supabase que reproduce el schema REAL de prod: partner_orders no
// tiene payment_status, y pedirla en el select devuelve 42703 (así quedaban
// los KPIs del partner siempre en 0).
const h = vi.hoisted(() => {
  const state = {
    orders: [] as any[],
    leadsCount: 0,
    ordersError: null as null | { code: string; message: string },
    selects: [] as Array<{ table: string; cols: string }>,
  }
  const from = (table: string) => {
    let cols = ''
    const q: any = {
      select: (c: string) => { cols = c; state.selects.push({ table, cols: c }); return q },
      eq: () => q,
      gte: () => q,
      order: () => q,
      then: (resolve: (v: unknown) => unknown, reject: (e: unknown) => unknown) => {
        let result: unknown
        if (table === 'partner_leads') result = { count: state.leadsCount, error: null }
        else if (cols.includes('payment_status')) {
          result = { data: null, error: { code: '42703', message: 'column partner_orders.payment_status does not exist' } }
        } else if (state.ordersError) result = { data: null, error: state.ordersError }
        else result = { data: state.orders, error: null }
        return Promise.resolve(result).then(resolve, reject)
      },
    }
    return q
  }
  return { state, client: { from } }
})

vi.mock('@/lib/supabase-admin', () => ({ supabaseAdmin: h.client }))

import { getDashboardKPIs } from './dashboard-kpis'

const daysAgo = (d: number) => new Date(Date.now() - d * 86_400_000).toISOString()

beforeEach(() => {
  h.state.selects.length = 0
  h.state.ordersError = null
  h.state.leadsCount = 6
  h.state.orders = [
    // Venta web bridgeada por sale-effects: status confirmed, sin payment_status (caso 9852).
    { id: 'web', status: 'confirmed', payment_id: 'transfer:NOV-20260926-9852', total: 111_400, created_at: daysAgo(2),
      items: [{ name: 'Hoodie', quantity: 2, unit_price: 55_700 }] },
    { id: 'manual-pend', status: 'pending', payment_id: null, total: 30_000, created_at: daysAgo(3),
      items: [{ name: 'Remera', quantity: 1, unit_price: 30_000 }] },
    { id: 'exc-pagada', status: 'exception', payment_id: 'mp-1', total: 10_000, created_at: daysAgo(4),
      items: [{ name: 'Gorra', quantity: 1, unit_price: 10_000 }] },
    { id: 'exc-impaga', status: 'exception', payment_id: null, total: 7_000, created_at: daysAgo(4), items: [] },
    { id: 'entregada', status: 'delivered', payment_id: null, total: 20_000, created_at: daysAgo(10),
      items: [{ name: 'Remera', quantity: 1, unit_price: 20_000 }] },
    { id: 'cancelada', status: 'cancelled', payment_id: 'mp-2', total: 50_000, created_at: daysAgo(1), items: [] },
    { id: 'mes-anterior', status: 'producing', payment_id: null, total: 60_000, created_at: daysAgo(40), items: [] },
  ]
})

describe('getDashboardKPIs', () => {
  it('no pide payment_status a partner_orders (la columna no existe en prod)', async () => {
    await getDashboardKPIs('tenant-sponsors')
    const ordersSelect = h.state.selects.find((s) => s.table === 'partner_orders')
    expect(ordersSelect?.cols).toBeDefined()
    expect(ordersSelect?.cols).not.toContain('payment_status')
  })

  it('cuenta como venta lo pagado según status (confirmed/producing/shipped/delivered + exception con pago)', async () => {
    const k = await getDashboardKPIs('tenant-sponsors')

    // web 111.400 + exception pagada 10.000 + entregada 20.000
    expect(k.revenue30d).toBe(141_400)
    expect(k.orders30d).toBe(3)
    expect(k.revenuePrev30d).toBe(60_000)
    expect(k.ordersPrev30d).toBe(1)
    expect(k.revenueChangePct).toBe(136)
    expect(k.avgOrderValue).toBe(47_133)
    expect(k.topProduct).toEqual({ name: 'Hoodie', units: 2, revenue: 111_400 })
    expect(k.leadsThisMonth).toBe(6)
    expect(k.conversionRate).toBe(50)
  })

  it('desglose por estado: pendientes, pagados sin enviar y enviados', async () => {
    const k = await getDashboardKPIs('tenant-sponsors')

    expect(k.pendingOrders).toBe(1)
    // web (confirmed) + exception pagada + producing del mes anterior
    expect(k.approvedOrders).toBe(3)
    expect(k.fulfilledOrders).toBe(1)
    expect(k.ordersByDay).toHaveLength(30)
    expect(k.ordersByDay.reduce((s, d) => s + d.revenue, 0)).toBe(141_400)
  })

  it('si la query de pedidos falla, tira error en vez de devolver KPIs en 0', async () => {
    h.state.ordersError = { code: '42703', message: 'column partner_orders.algo does not exist' }
    await expect(getDashboardKPIs('tenant-sponsors')).rejects.toThrow(/partner_orders/)
  })
})
