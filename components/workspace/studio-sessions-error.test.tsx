import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

// impl plano (no vi.fn): vitest reporta como no manejado un rechazo devuelto por un mock
let impl: (...a: any[]) => Promise<any> = async () => ({ ok: true, json: async () => ({}) })
const authFetch = { mockResolvedValue: (v: any) => { impl = async () => v }, mockNetworkError: () => { impl = async () => { throw new TypeError('Failed to fetch') } }, mockReset: () => {} }
vi.mock('@/lib/partners/auth-fetch', () => ({ authFetch: (...a: any[]) => impl(...a) }))

import { StudioSessionsError as ErrorState } from './studio-sessions-error'
import { fetchStudioSessions, StudioSessionsError } from '@/lib/partners/studio/session-service'

describe('fetchStudioSessions distingue error de vacío', () => {
  beforeEach(() => authFetch.mockReset())

  it('200 con sesiones → las devuelve', async () => {
    authFetch.mockResolvedValue({ ok: true, status: 200, json: async () => ({ sessions: [{ id: 's1' }] }) })
    expect(await fetchStudioSessions()).toEqual([{ id: 's1' }])
  })
  it('200 sin sesiones → [] (vacío legítimo)', async () => {
    authFetch.mockResolvedValue({ ok: true, status: 200, json: async () => ({ sessions: [] }) })
    expect(await fetchStudioSessions()).toEqual([])
  })
  it('401 → tira kind=auth', async () => {
    authFetch.mockResolvedValue({ ok: false, status: 401 })
    await expect(fetchStudioSessions()).rejects.toMatchObject({ name: 'StudioSessionsError', kind: 'auth' })
  })
  it('500 → tira kind=server', async () => {
    authFetch.mockResolvedValue({ ok: false, status: 500 })
    const err = await fetchStudioSessions().catch((e) => e)
    expect(err).toBeInstanceOf(StudioSessionsError)
    expect(err.kind).toBe('server')
  })
  it('falla de red → kind=server', async () => {
    authFetch.mockNetworkError()
    const err = await fetchStudioSessions().catch((e) => e)
    expect(err).toBeInstanceOf(StudioSessionsError)
    expect(err.kind).toBe('server')
  })
})

describe('<StudioSessionsError />', () => {
  it('server → "Reintentar" llama onRetry', () => {
    const onRetry = vi.fn()
    render(<ErrorState kind="server" onRetry={onRetry} />)
    expect(screen.getByText(/No pudimos cargar tus sesiones/)).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: /Reintentar/ }))
    expect(onRetry).toHaveBeenCalledTimes(1)
  })
  it('auth → "Tu sesión venció" con link a login con redirect al Studio', () => {
    render(<ErrorState kind="auth" onRetry={() => {}} />)
    expect(screen.getByText('Tu sesión venció')).toBeTruthy()
    const link = screen.getByRole('link', { name: /Volver a entrar/ })
    expect(link.getAttribute('href')).toBe('/partners/login?redirect=/workspace/design-engine')
    expect(screen.queryByRole('button')).toBeNull()
  })
})
