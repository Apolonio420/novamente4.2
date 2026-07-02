import { beforeEach, describe, expect, it, vi } from 'vitest'

const h = vi.hoisted(() => {
  const eqCalls: Array<[string, unknown]> = []
  const state = { result: { data: [{ id: 'booking-a' }] as any, error: null as any } }
  const chain: any = {
    from: () => chain,
    update: () => chain,
    eq: (column: string, value: unknown) => { eqCalls.push([column, value]); return chain },
    select: () => chain,
    then: (resolve: (value: unknown) => unknown) => resolve(state.result),
  }
  return { chain, eqCalls, state }
})

vi.mock('@/lib/supabase-admin', () => ({ supabaseAdmin: h.chain }))

import { cancelBooking } from './onboarding-call'

beforeEach(() => {
  h.eqCalls.length = 0
  h.state.result = { data: [{ id: 'booking-a' }], error: null }
})

describe('cancelBooking', () => {
  it('can only cancel a booking inside the supplied tenant', async () => {
    await cancelBooking('tenant-a', 'booking-a')

    expect(h.eqCalls).toContainEqual(['id', 'booking-a'])
    expect(h.eqCalls).toContainEqual(['tenant_id', 'tenant-a'])
  })

  it('returns false when the tenant-scoped update affects no booking', async () => {
    h.state.result = { data: [], error: null }
    await expect(cancelBooking('tenant-a', 'booking-b')).resolves.toBe(false)
  })
})
