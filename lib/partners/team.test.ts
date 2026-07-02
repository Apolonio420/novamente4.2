import { describe, it, expect, beforeEach, vi } from 'vitest'

const h = vi.hoisted(() => {
  const state = {
    rpcResult: { data: null as any, error: null as any },
    singleResult: { data: null as any, error: null as any },
    awaitResult: { data: null as any, error: null as any },
  }
  const chain: any = {
    rpc: (_n: string, _a: any) => Promise.resolve(state.rpcResult),
    from: () => chain,
    insert: () => chain,
    update: () => chain,
    delete: () => chain,
    select: () => chain,
    eq: () => chain,
    is: () => chain,
    order: () => chain,
    single: () => Promise.resolve(state.singleResult),
    then: (resolve: any) => resolve(state.awaitResult), // makes `await chain` resolve awaitResult
  }
  return { chain, state }
})

vi.mock('@/lib/supabase-admin', () => ({ supabaseAdmin: h.chain }))

import { validateInviteRole, inviteMember, removeMember } from './team'

beforeEach(() => {
  h.state.rpcResult = { data: null, error: null }
  h.state.singleResult = { data: null, error: null }
  h.state.awaitResult = { data: null, error: null }
})

describe('validateInviteRole', () => {
  it('permite operator y viewer', () => {
    expect(validateInviteRole('operator')).toBe(true)
    expect(validateInviteRole('viewer')).toBe(true)
  })
  it('rechaza owner y cualquier otro', () => {
    expect(validateInviteRole('owner')).toBe(false)
    expect(validateInviteRole('admin')).toBe(false)
    expect(validateInviteRole('')).toBe(false)
  })
})

describe('inviteMember', () => {
  it('rechaza invitar como owner (no escalamiento) → 400', async () => {
    const r = await inviteMember('t1', 'inviter', 'x@y.com', 'owner')
    expect(r.ok).toBe(false)
    expect(r.status).toBe(400)
  })

  it('rechaza email inválido → 400', async () => {
    const r = await inviteMember('t1', 'inviter', 'no-arroba', 'operator')
    expect(r.ok).toBe(false)
    expect(r.status).toBe(400)
  })

  it('usuario inexistente → 404', async () => {
    h.state.rpcResult = { data: null, error: null }
    const r = await inviteMember('t1', 'inviter', 'ghost@acme.com', 'operator')
    expect(r.ok).toBe(false)
    expect(r.status).toBe(404)
  })

  it('ya es miembro (unique violation) → 409', async () => {
    h.state.rpcResult = { data: 'user-9', error: null }
    h.state.singleResult = { data: null, error: { code: '23505' } }
    const r = await inviteMember('t1', 'inviter', 'dup@acme.com', 'operator')
    expect(r.ok).toBe(false)
    expect(r.status).toBe(409)
  })

  it('invitación válida → ok + pending', async () => {
    h.state.rpcResult = { data: 'user-9', error: null }
    h.state.singleResult = { data: { id: 'm1' }, error: null }
    const r = await inviteMember('t1', 'inviter', 'new@acme.com', 'viewer')
    expect(r.ok).toBe(true)
    expect(r.membershipId).toBe('m1')
    expect(r.pending).toBe(true)
  })
})

describe('removeMember', () => {
  it('no se puede quitar a un owner → 403', async () => {
    h.state.singleResult = { data: { id: 'm-owner', role: 'owner' }, error: null }
    const r = await removeMember('t1', 'm-owner')
    expect(r.ok).toBe(false)
    expect(r.status).toBe(403)
  })

  it('miembro inexistente → 404', async () => {
    h.state.singleResult = { data: null, error: null }
    const r = await removeMember('t1', 'nope')
    expect(r.ok).toBe(false)
    expect(r.status).toBe(404)
  })

  it('quita operator/viewer → ok', async () => {
    h.state.singleResult = { data: { id: 'm2', role: 'operator' }, error: null }
    h.state.awaitResult = { data: null, error: null }
    const r = await removeMember('t1', 'm2')
    expect(r.ok).toBe(true)
  })
})
