import { beforeEach, describe, expect, it, vi } from 'vitest'

const h = vi.hoisted(() => {
  const eqCalls: Array<[string, unknown]> = []
  const state = { result: { data: { id: 'order-1' } as any, error: null as any } }
  const chain: any = {
    from: () => chain,
    update: () => chain,
    eq: (column: string, value: unknown) => { eqCalls.push([column, value]); return chain },
    select: () => chain,
    single: () => Promise.resolve(state.result),
  }
  return { chain, eqCalls, state }
})

vi.mock('@/lib/supabase-admin', () => ({ supabaseAdmin: h.chain }))

import { updateOrder, updateOrderStatus } from './orders'

beforeEach(() => {
  h.eqCalls.length = 0
  h.state.result = { data: { id: 'order-1' }, error: null }
})

describe('partner order mutations', () => {
  it('always scopes a generic update by order id and tenant id', async () => {
    await updateOrder('tenant-a', 'order-1', { status: 'cancelled' })

    expect(h.eqCalls).toContainEqual(['id', 'order-1'])
    expect(h.eqCalls).toContainEqual(['tenant_id', 'tenant-a'])
  })

  it('always scopes a status update by order id and tenant id', async () => {
    await updateOrderStatus('tenant-a', 'order-1', 'confirmed')

    expect(h.eqCalls).toContainEqual(['id', 'order-1'])
    expect(h.eqCalls).toContainEqual(['tenant_id', 'tenant-a'])
  })
})
