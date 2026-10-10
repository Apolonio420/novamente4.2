import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// Mock de supabase: un `from()` chainable que filtra en memoria por los
// mismos .eq()/.gte() que usa el código real, para poder probar bucketing
// por día sin pegarle a una DB.
const h = vi.hoisted(() => {
  const state = { rows: [] as any[] }
  const from = (_table: string) => {
    const filters: Record<string, string> = {}
    let gteVal: string | null = null
    const q: any = {
      select: () => q,
      eq: (col: string, val: string) => {
        filters[col] = val
        return q
      },
      gte: (_col: string, val: string) => {
        gteVal = val
        return q
      },
      order: () => q,
      then: (resolve: (v: unknown) => unknown, reject: (e: unknown) => unknown) => {
        const rows = state.rows.filter((r) => {
          if (filters.tenant_id && r.tenant_id !== filters.tenant_id) return false
          if (filters.event_type && r.event_type !== filters.event_type) return false
          if (gteVal && r.created_at < gteVal) return false
          return true
        })
        return Promise.resolve({ data: rows, error: null }).then(resolve, reject)
      },
    }
    return q
  }
  return { state, client: { from } }
})

vi.mock('@/lib/supabase-admin', () => ({ supabaseAdmin: h.client }))

import { getMetricTimeSeries } from './analytics'

beforeEach(() => {
  h.state.rows = []
})

afterEach(() => {
  vi.useRealTimers()
})

describe('getMetricTimeSeries', () => {
  it('orders: cuenta EVENTOS, no visitantes únicos — 2 pedidos del mismo visitor_id el mismo día cuentan 2', async () => {
    const today = new Date().toISOString()
    h.state.rows = [
      { tenant_id: 't1', event_type: 'order_created', created_at: today, visitor_id: 'v1' },
      { tenant_id: 't1', event_type: 'order_created', created_at: today, visitor_id: 'v1' },
    ]
    const series = await getMetricTimeSeries('t1', 'orders', 7)
    expect(series.at(-1)).toBe(2)
  })

  it('leads: misma lógica — no se dedup por visitante', async () => {
    const today = new Date().toISOString()
    h.state.rows = [
      { tenant_id: 't1', event_type: 'lead_submit', created_at: today, visitor_id: 'v1' },
      { tenant_id: 't1', event_type: 'lead_submit', created_at: today, visitor_id: 'v1' },
      { tenant_id: 't1', event_type: 'lead_submit', created_at: today, visitor_id: 'v2' },
    ]
    const series = await getMetricTimeSeries('t1', 'leads', 7)
    expect(series.at(-1)).toBe(3)
  })

  it('unique_visitors: sigue de-dup por visitor_id (a diferencia de orders/leads)', async () => {
    const today = new Date().toISOString()
    h.state.rows = [
      { tenant_id: 't1', event_type: 'page_view', created_at: today, visitor_id: 'v1' },
      { tenant_id: 't1', event_type: 'page_view', created_at: today, visitor_id: 'v1' },
      { tenant_id: 't1', event_type: 'page_view', created_at: today, visitor_id: 'v2' },
    ]
    const series = await getMetricTimeSeries('t1', 'unique_visitors', 7)
    expect(series.at(-1)).toBe(2)
  })

  it('bucketea por día ART, no UTC: un pedido a las 2026-10-09T01:30Z cuenta el 2026-10-08 ART', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-10-09T12:00:00.000Z')) // "hoy" = 09/10 ART

    h.state.rows = [
      { tenant_id: 't1', event_type: 'order_created', created_at: '2026-10-09T01:30:00.000Z', visitor_id: 'v1' },
    ]
    const series = await getMetricTimeSeries('t1', 'orders', 2) // [08/10, 09/10]
    expect(series).toEqual([1, 0])
  })
})
