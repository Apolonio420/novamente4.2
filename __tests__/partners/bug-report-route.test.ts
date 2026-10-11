// @vitest-environment node
//
// Auditoría workspace 08/10/2026: /api/partners/assistant/bug-report no tenía
// caller y confiaba en user_metadata.tenant_id. Ahora exige tenant autenticado
// (membresía validada), limita por tenant, guarda siempre y avisa a Urgente
// con cooldown por tenant+ruta+mensaje. Telegram y cooldown mockeados.
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

const h = vi.hoisted(() => ({
  ctx: { userId: 'u1', tenant: { id: 't1', name: 'Marca <A>' }, role: 'viewer' } as any,
  notifyUrgent: vi.fn(async (_m: string) => ({ ok: true })),
  notifyError: vi.fn(async (_e: unknown) => ({ digest: true })),
  cooldown: vi.fn(async (_k: string) => ({ send: true, repeatedCount: 0 })),
  count: 0,
  insertRow: vi.fn(),
  insertResult: { data: { id: 'bug-1' }, error: null } as any,
}))

vi.mock('next/server', async (orig) => ({
  ...(await orig<typeof import('next/server')>()),
  after: (fn: () => unknown) => {
    void fn()
  },
}))
vi.mock('@/lib/partners/permissions', () => ({ getRequestTenant: vi.fn(async () => h.ctx) }))
vi.mock('@/lib/notifications', () => ({
  notifyUrgent: (m: string) => h.notifyUrgent(m),
  notifyError: (e: unknown) => h.notifyError(e),
  escapeTelegramHtml: (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'),
}))
vi.mock('@/lib/alerts/alert-cooldown', () => ({
  checkAlertCooldown: (k: string) => h.cooldown(k),
  formatRepeatedSuffix: (n: number) => (n > 0 ? ` (x${n})` : ''),
}))
vi.mock('@/lib/supabase-admin', () => ({
  supabaseAdmin: {
    from: () => ({
      select: () => ({ eq: () => ({ gte: async () => ({ count: h.count, error: null }) }) }),
      insert: (row: unknown) => {
        h.insertRow(row)
        return { select: () => ({ single: async () => h.insertResult }) }
      },
    }),
  },
}))

import { POST, BUG_REPORT_LIMIT } from '@/app/api/partners/assistant/bug-report/route'

const req = (body: unknown) =>
  new NextRequest('http://l/api/partners/assistant/bug-report', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'content-type': 'application/json' },
  })
const payload = {
  description: 'Error automático',
  errorMessage: 'Cannot read <x> of undefined',
  errorDigest: 'abc123',
  sourceUrl: 'https://www.novamente.ar/workspace/catalog?tab=2',
}
const tick = () => new Promise((r) => setTimeout(r, 0))

beforeEach(() => {
  vi.clearAllMocks()
  h.ctx = { userId: 'u1', tenant: { id: 't1', name: 'Marca <A>' }, role: 'viewer' }
  h.count = 0
  h.insertResult = { data: { id: 'bug-1' }, error: null }
  h.cooldown.mockResolvedValue({ send: true, repeatedCount: 0 })
})

describe('POST /api/partners/assistant/bug-report', () => {
  it('sin tenant autenticado → 401 y no guarda ni avisa', async () => {
    h.ctx = null
    const res = await POST(req(payload))
    expect(res.status).toBe(401)
    expect(h.insertRow).not.toHaveBeenCalled()
    expect(h.notifyUrgent).not.toHaveBeenCalled()
  })

  it('guarda con el tenant de la membresía (no de user_metadata) y avisa a Urgente (también a un viewer)', async () => {
    const res = await POST(req(payload))
    expect(res.status).toBe(200)
    await tick()
    expect(h.insertRow.mock.calls[0][0]).toMatchObject({ tenant_id: 't1', error_digest: 'abc123', reporter_type: 'partner' })
    expect(h.notifyUrgent).toHaveBeenCalledTimes(1)
    const msg = h.notifyUrgent.mock.calls[0][0]
    expect(msg).toContain('Marca &lt;A&gt;')
    expect(msg).toContain('/workspace/catalog')
    expect(msg).not.toContain('tab=2') // la ruta va sin query
    expect(msg).toContain('abc123')
    expect(msg).toContain('Cannot read &lt;x&gt;')
  })

  it('misma clave tenant+ruta+mensaje: el cooldown suprime el aviso pero igual guarda', async () => {
    h.cooldown.mockResolvedValue({ send: false, repeatedCount: 0 })
    const res = await POST(req(payload))
    expect(res.status).toBe(200)
    await tick()
    expect(h.insertRow).toHaveBeenCalledTimes(1)
    expect(h.notifyUrgent).not.toHaveBeenCalled()
  })

  it('la clave del cooldown es estable ante distinto digest/números y distinta entre tenants o rutas', async () => {
    await POST(req(payload))
    await POST(req({ ...payload, errorDigest: 'zzz', errorMessage: 'Cannot read <x> of undefined 99' }))
    h.ctx = { ...h.ctx, tenant: { id: 't2', name: 'Otra' } }
    await POST(req(payload))
    await POST(req({ ...payload, sourceUrl: 'https://www.novamente.ar/workspace/orders' }))
    await tick()
    const keys = h.cooldown.mock.calls.map((c) => c[0])
    expect(keys[0]).toBe(keys[1])
    expect(keys[2]).not.toBe(keys[0])
    expect(keys[3]).not.toBe(keys[0])
  })

  it('rate limit por tenant: al llegar al tope → 429 sin insertar ni avisar', async () => {
    h.count = BUG_REPORT_LIMIT
    const res = await POST(req(payload))
    expect(res.status).toBe(429)
    expect(h.insertRow).not.toHaveBeenCalled()
    expect(h.notifyUrgent).not.toHaveBeenCalled()
  })

  it('si el insert falla igual avisa (no se pierde en silencio) y responde 500', async () => {
    h.insertResult = { data: null, error: { message: 'boom' } }
    const res = await POST(req(payload))
    expect(res.status).toBe(500)
    await tick()
    expect(h.notifyUrgent).toHaveBeenCalledTimes(1)
    expect(h.notifyUrgent.mock.calls[0][0]).toContain('No se pudo guardar')
  })

  it('error pasajero (chunk viejo tras deploy / red): guarda pero va al resumen, no a Urgente', async () => {
    const res = await POST(req({ ...payload, errorMessage: 'ChunkLoadError: Loading chunk 123 failed.' }))
    expect(res.status).toBe(200)
    await tick()
    expect(h.insertRow).toHaveBeenCalledTimes(1)
    expect(h.notifyUrgent).not.toHaveBeenCalled()
    expect(h.notifyError).toHaveBeenCalledTimes(1)
    expect(h.notifyError.mock.calls[0][0]).not.toHaveProperty('urgent', true)
  })

  it('body inválido → 400', async () => {
    const res = await POST(req({ nope: true }))
    expect(res.status).toBe(400)
  })
})
