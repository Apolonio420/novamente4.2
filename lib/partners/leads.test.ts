import { describe, it, expect, beforeEach, vi } from 'vitest'

// Chainable Supabase mock that records every .eq(column, value) filter and
// resolves the terminal .select() with a configurable result.
const h = vi.hoisted(() => {
  const eqCalls: Array<[string, unknown]> = []
  const state: { result: { data: unknown; error: unknown } } = { result: { data: [], error: null } }
  const chain: any = {}
  chain.from = () => chain
  chain.update = () => chain
  chain.insert = () => chain
  chain.eq = (col: string, val: unknown) => { eqCalls.push([col, val]); return chain }
  chain.select = () => Promise.resolve(state.result)
  return { chain, eqCalls, state }
})

vi.mock('@/lib/supabase-admin', () => ({ supabaseAdmin: h.chain }))

import { updateLeadStatus } from './leads'

beforeEach(() => {
  h.eqCalls.length = 0
  h.state.result = { data: [], error: null }
})

describe('updateLeadStatus — aislamiento por tenant', () => {
  it('SIEMPRE filtra por id Y por tenant_id', async () => {
    h.state.result = { data: [{ id: 'lead-1' }], error: null }
    await updateLeadStatus('tenant-a', 'lead-1', 'contacted')

    const filtered = Object.fromEntries(h.eqCalls)
    expect(filtered['id']).toBe('lead-1')
    expect(filtered['tenant_id']).toBe('tenant-a')
  })

  it('cross-tenant: si ninguna fila del tenant coincide → false (no muta nada)', async () => {
    // El lead existe pero pertenece a otro tenant → el UPDATE filtrado no toca filas.
    h.state.result = { data: [], error: null }
    const ok = await updateLeadStatus('tenant-attacker', 'lead-de-otro-tenant', 'lost')
    expect(ok).toBe(false)
  })

  it('happy path: fila del propio tenant actualizada → true', async () => {
    h.state.result = { data: [{ id: 'lead-1' }], error: null }
    const ok = await updateLeadStatus('tenant-a', 'lead-1', 'qualified')
    expect(ok).toBe(true)
  })

  it('error de DB → false', async () => {
    h.state.result = { data: null, error: { message: 'boom' } }
    const ok = await updateLeadStatus('tenant-a', 'lead-1', 'new')
    expect(ok).toBe(false)
  })
})
