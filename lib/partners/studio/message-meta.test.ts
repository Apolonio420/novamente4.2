import { describe, it, expect, vi, beforeEach } from 'vitest'

const authFetch = vi.fn()
vi.mock('@/lib/partners/auth-fetch', () => ({ authFetch: (...a: any[]) => authFetch(...a) }))

import {
  buildMessageMeta,
  sanitizeMessageMeta,
  messageFieldsFromMeta,
  isMissingMetaColumnError,
  insertMessageWithMeta,
} from './message-meta'
import { saveStudioMessage, fetchSessionMessages } from './session-service'

const FULL = {
  type: 'mockup',
  side: 'back',
  garmentColor: 'black',
  designImageUrl: 'https://cdn.example.com/art.png',
  stampMode: 'chest-logo',
  placement: 'center',
  stampWidthCm: 8,
}

describe('buildMessageMeta / sanitizeMessageMeta', () => {
  it('arma meta con los 6 campos de un mockup', () => {
    expect(buildMessageMeta(FULL)).toEqual({
      side: 'back', garmentColor: 'black', designImageUrl: 'https://cdn.example.com/art.png',
      stampMode: 'chest-logo', placement: 'center', stampWidthCm: 8,
    })
  })
  it('mensajes de texto → null (no se escribe la columna)', () => {
    expect(buildMessageMeta({ ...FULL, type: 'text' })).toBeNull()
  })
  it('mockup sin campos → null', () => {
    expect(buildMessageMeta({ type: 'mockup' })).toBeNull()
  })
  it('descarta valores inválidos y claves desconocidas', () => {
    expect(sanitizeMessageMeta({ side: 'left', stampMode: 'huge', stampWidthCm: -3, hack: 'x', placement: 'center' }))
      .toEqual({ placement: 'center' })
    expect(sanitizeMessageMeta({ stampWidthCm: NaN })).toBeNull()
    expect(sanitizeMessageMeta('nope')).toBeNull()
    expect(sanitizeMessageMeta([1])).toBeNull()
    expect(sanitizeMessageMeta({ designImageUrl: 'x'.repeat(3000) })).toBeNull()
  })
  it('meta null (mensajes viejos) → {} al leer', () => {
    expect(messageFieldsFromMeta(null)).toEqual({})
  })
})

describe('isMissingMetaColumnError', () => {
  it('detecta PGRST204, 42703 y mensaje de schema cache', () => {
    expect(isMissingMetaColumnError({ code: 'PGRST204' })).toBe(true)
    expect(isMissingMetaColumnError({ code: '42703' })).toBe(true)
    expect(isMissingMetaColumnError({ message: "Could not find the 'meta' column of 'partner_design_messages' in the schema cache" })).toBe(true)
    expect(isMissingMetaColumnError({ code: '23505', message: 'duplicate' })).toBe(false)
    expect(isMissingMetaColumnError(null)).toBe(false)
  })
})

describe('insertMessageWithMeta', () => {
  const row = { session_id: 's1', role: 'assistant' }
  const meta = { side: 'front' as const }

  it('con meta OK: un solo insert con meta', async () => {
    const insert = vi.fn().mockResolvedValue({ error: null })
    const r = await insertMessageWithMeta(insert, row, meta)
    expect(insert).toHaveBeenCalledTimes(1)
    expect(insert).toHaveBeenCalledWith({ ...row, meta })
    expect(r).toEqual({ error: null, metaDropped: false })
  })
  it('sin meta: insert sin la clave meta', async () => {
    const insert = vi.fn().mockResolvedValue({ error: null })
    await insertMessageWithMeta(insert, row, null)
    expect(insert).toHaveBeenCalledWith(row)
  })
  it('PGRST204 → reintenta sin meta y guarda', async () => {
    const insert = vi.fn()
      .mockResolvedValueOnce({ error: { code: 'PGRST204', message: 'meta' } })
      .mockResolvedValueOnce({ error: null })
    const r = await insertMessageWithMeta(insert, row, meta)
    expect(insert).toHaveBeenCalledTimes(2)
    expect(insert).toHaveBeenLastCalledWith(row)
    expect(r).toEqual({ error: null, metaDropped: true })
  })
  it('42703 → reintenta sin meta', async () => {
    const insert = vi.fn()
      .mockResolvedValueOnce({ error: { code: '42703' } })
      .mockResolvedValueOnce({ error: null })
    expect((await insertMessageWithMeta(insert, row, meta)).metaDropped).toBe(true)
  })
  it('otro error NO reintenta', async () => {
    const insert = vi.fn().mockResolvedValue({ error: { code: '23503', message: 'fk' } })
    const r = await insertMessageWithMeta(insert, row, meta)
    expect(insert).toHaveBeenCalledTimes(1)
    expect(r.error).toEqual({ code: '23503', message: 'fk' })
  })
})

describe('session-service: round trip del print spec', () => {
  beforeEach(() => authFetch.mockReset())

  it('saveStudioMessage envía meta para un mockup', async () => {
    authFetch.mockResolvedValue({ ok: true })
    await saveStudioMessage('s1', { role: 'assistant', content: '', imageUrl: 'm.png', ...FULL } as any)
    const body = JSON.parse(authFetch.mock.calls[0][1].body)
    expect(body.meta).toEqual(buildMessageMeta(FULL))
  })
  it('saveStudioMessage manda meta null para texto', async () => {
    authFetch.mockResolvedValue({ ok: true })
    await saveStudioMessage('s1', { role: 'user', content: 'hola', type: 'text' } as any)
    expect(JSON.parse(authFetch.mock.calls[0][1].body).meta).toBeNull()
  })
  it('fetchSessionMessages devuelve el print spec al recargar', async () => {
    authFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ messages: [
        { id: 'a', role: 'assistant', type: 'mockup', image_url: 'm.png', created_at: '2026-11-01T10:00:00Z', meta: buildMessageMeta(FULL) },
        { id: 'b', role: 'assistant', type: 'mockup', image_url: 'old.png', created_at: '2026-10-01T10:00:00Z', meta: null },
      ] }),
    })
    const [withMeta, legacy] = await fetchSessionMessages('s1')
    expect(withMeta).toMatchObject({
      side: 'back', garmentColor: 'black', designImageUrl: 'https://cdn.example.com/art.png',
      stampMode: 'chest-logo', placement: 'center', stampWidthCm: 8,
    })
    // mensaje viejo (meta null): sin print spec → el guard de la página sigue aplicando
    expect(legacy.designImageUrl).toBeUndefined()
    expect(legacy.side).toBeUndefined()
  })
})
