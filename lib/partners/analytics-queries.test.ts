import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// Mock de supabase: `from()` chainable con soporte de `.range()` para poder
// probar paginación real (PostgREST corta en 1000 filas por default).
const h = vi.hoisted(() => {
  const state = { rows: [] as any[] }
  const from = (_table: string) => {
    const filters: Record<string, string> = {}
    let gteVal: string | null = null
    let range: { from: number; to: number } | null = null
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
      not: () => q,
      order: () => q,
      range: (from: number, to: number) => {
        range = { from, to }
        return q
      },
      then: (resolve: (v: unknown) => unknown, reject: (e: unknown) => unknown) => {
        let rows = state.rows.filter((r) => {
          if (filters.tenant_id && r.tenant_id !== filters.tenant_id) return false
          if (filters.event_type && r.event_type !== filters.event_type) return false
          if (gteVal && r.created_at < gteVal) return false
          return true
        })
        if (range) rows = rows.slice(range.from, range.to + 1)
        return Promise.resolve({ data: rows, error: null }).then(resolve, reject)
      },
    }
    return q
  }
  return { state, client: { from } }
})

vi.mock('@/lib/supabase-admin', () => ({ supabaseAdmin: h.client }))

import { getVisitStats, paginateRange } from './analytics-queries'

beforeEach(() => {
  h.state.rows = []
})

afterEach(() => {
  vi.useRealTimers()
})

describe('paginateRange', () => {
  it('pagea con .range() hasta traer más de 1000 filas (mock de 2500 en páginas de 1000)', async () => {
    const totalRows = 2500
    const all = Array.from({ length: totalRows }, (_, i) => ({ id: i }))

    let calls = 0
    const rows = await paginateRange<{ id: number }>(({ from, to }) => {
      calls++
      return Promise.resolve({ data: all.slice(from, to + 1), error: null })
    })

    expect(rows).toHaveLength(totalRows)
    expect(rows[0]).toEqual({ id: 0 })
    expect(rows.at(-1)).toEqual({ id: totalRows - 1 })
    expect(calls).toBe(3) // 1000 + 1000 + 500
  })

  it('tira el error de la página en vez de devolver filas parciales en silencio', async () => {
    await expect(
      paginateRange(() => Promise.resolve({ data: null, error: { message: 'boom' } }))
    ).rejects.toThrow('boom')
  })
})

describe('getVisitStats', () => {
  it('trae más de 1000 eventos paginando (antes el .select() sin .range() se cortaba en 1000)', async () => {
    const now = new Date()
    h.state.rows = Array.from({ length: 1500 }, (_, i) => ({
      tenant_id: 't1',
      event_type: 'page_view',
      created_at: now.toISOString(),
      visitor_id: `v${i}`,
    }))

    const stats = await getVisitStats('t1', 7)
    expect(stats.total).toBe(1500)
    expect(stats.unique).toBe(1500)
  })

  it('bucketea "Visitas por día" por día ART, no UTC', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-10-09T12:00:00.000Z')) // "hoy" = 09/10 ART

    h.state.rows = [
      { tenant_id: 't1', event_type: 'page_view', created_at: '2026-10-09T01:30:00.000Z', visitor_id: 'v1' },
    ]
    const stats = await getVisitStats('t1', 2) // días: [08/10, 09/10]
    expect(stats.byDay.map((d) => d.date)).toEqual(['2026-10-08', '2026-10-09'])
    expect(stats.byDay[0]).toEqual({ date: '2026-10-08', total: 1, unique: 1 })
    expect(stats.byDay[1]).toEqual({ date: '2026-10-09', total: 0, unique: 0 })
  })
})
