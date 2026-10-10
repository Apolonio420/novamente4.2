/**
 * ORIGEN: la sesión del partner dropeaba ~1h después del login en /workspace
 * porque la cookie sb-<ref>-auth-token se escribía una sola vez al loguearse
 * y nunca se volvía a sincronizar cuando supabase-js renovaba el
 * access_token en segundo plano. Estos tests fijan:
 *  - shouldSync: la decisión pura de cuándo hace falta (re)escribir la cookie.
 *  - el dedupe real end-to-end (mismo token no dispara un segundo POST).
 *  - que SIGNED_OUT nunca dispara un POST, sólo DELETE.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { shouldSync, handleAuthEventForSync, __resetSessionSyncForTests } from './session-sync'

describe('shouldSync (pura)', () => {
  it('SIGNED_IN / TOKEN_REFRESHED / INITIAL_SESSION con token nuevo → true', () => {
    expect(shouldSync('SIGNED_IN', 'tok-nuevo', null)).toBe(true)
    expect(shouldSync('TOKEN_REFRESHED', 'tok-nuevo', 'tok-viejo')).toBe(true)
    expect(shouldSync('INITIAL_SESSION', 'tok-nuevo', null)).toBe(true)
  })

  it('dedupe: mismo token que el último sincronizado → false', () => {
    expect(shouldSync('TOKEN_REFRESHED', 'tok-x', 'tok-x')).toBe(false)
  })

  it('sin access token → false', () => {
    expect(shouldSync('SIGNED_IN', null, null)).toBe(false)
    expect(shouldSync('SIGNED_IN', undefined, 'tok-viejo')).toBe(false)
  })

  it('SIGNED_OUT u otros eventos no listados → false (se manejan aparte)', () => {
    expect(shouldSync('SIGNED_OUT', 'tok-x', null)).toBe(false)
    expect(shouldSync('USER_UPDATED', 'tok-x', null)).toBe(false)
    expect(shouldSync('PASSWORD_RECOVERY', 'tok-x', null)).toBe(false)
  })
})

describe('handleAuthEventForSync — debounce, dedupe y orden POST/DELETE', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    __resetSessionSyncForTests()
    global.fetch = vi.fn().mockResolvedValue({ ok: true })
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  async function flush() {
    await vi.runAllTimersAsync()
  }

  it('TOKEN_REFRESHED con token nuevo → un POST a /api/auth/set-session', async () => {
    handleAuthEventForSync('TOKEN_REFRESHED', { access_token: 'tok-1', refresh_token: 'r-1' })
    await flush()

    expect(global.fetch).toHaveBeenCalledTimes(1)
    const [url, opts] = (global.fetch as any).mock.calls[0]
    expect(url).toBe('/api/auth/set-session')
    expect(opts.method).toBe('POST')
    expect(JSON.parse(opts.body)).toEqual({ access_token: 'tok-1', refresh_token: 'r-1' })
  })

  it('dedupe real: el mismo token dos veces seguidas sólo sincroniza una vez', async () => {
    handleAuthEventForSync('SIGNED_IN', { access_token: 'tok-1', refresh_token: 'r-1' })
    await flush()
    expect(global.fetch).toHaveBeenCalledTimes(1)

    // Mismo evento, mismo token — ya sincronizado, no debe pegarle a la red otra vez.
    handleAuthEventForSync('TOKEN_REFRESHED', { access_token: 'tok-1', refresh_token: 'r-1' })
    await flush()
    expect(global.fetch).toHaveBeenCalledTimes(1)
  })

  it('ráfaga SIGNED_IN + TOKEN_REFRESHED casi juntos → el debounce colapsa en un solo POST', async () => {
    handleAuthEventForSync('SIGNED_IN', { access_token: 'tok-1', refresh_token: 'r-1' })
    vi.advanceTimersByTime(100)
    handleAuthEventForSync('TOKEN_REFRESHED', { access_token: 'tok-2', refresh_token: 'r-2' })
    await flush()

    expect(global.fetch).toHaveBeenCalledTimes(1)
    const [, opts] = (global.fetch as any).mock.calls[0]
    expect(JSON.parse(opts.body).access_token).toBe('tok-2')
  })

  it('SIGNED_OUT nunca dispara un POST — sólo DELETE', async () => {
    handleAuthEventForSync('SIGNED_OUT', null)
    await flush()

    expect(global.fetch).toHaveBeenCalledTimes(1)
    const [url, opts] = (global.fetch as any).mock.calls[0]
    expect(url).toBe('/api/auth/set-session')
    expect(opts.method).toBe('DELETE')
  })

  it('token nuevo pendiente de debounce + SIGNED_OUT inmediato → el logout gana (no resucita la cookie)', async () => {
    handleAuthEventForSync('TOKEN_REFRESHED', { access_token: 'tok-1', refresh_token: 'r-1' })
    // Logout llega ANTES de que venza el debounce del refresh.
    handleAuthEventForSync('SIGNED_OUT', null)
    await flush()

    // El timer del POST se cancela — el único write que llega a la red es el DELETE.
    expect(global.fetch).toHaveBeenCalledTimes(1)
    expect((global.fetch as any).mock.calls[0][1].method).toBe('DELETE')
  })

  it('después de SIGNED_OUT, un login nuevo con el mismo token vuelve a sincronizar', async () => {
    handleAuthEventForSync('SIGNED_IN', { access_token: 'tok-1', refresh_token: 'r-1' })
    await flush()
    expect(global.fetch).toHaveBeenCalledTimes(1)

    handleAuthEventForSync('SIGNED_OUT', null)
    await flush()
    expect(global.fetch).toHaveBeenCalledTimes(2)

    // Mismo token que antes del logout — como lastSyncedToken se resetea, debe sincronizar igual.
    handleAuthEventForSync('SIGNED_IN', { access_token: 'tok-1', refresh_token: 'r-1' })
    await flush()
    expect(global.fetch).toHaveBeenCalledTimes(3)
  })
})
