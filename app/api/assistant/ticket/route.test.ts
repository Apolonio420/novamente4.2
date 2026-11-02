// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

const h = vi.hoisted(() => ({
  user: { id: 'u1', email: 'partner@tienda.com' } as { id: string; email: string } | null,
  tenant: { id: 'tenant-1', name: 'Tienda <Rica>', plan: 'growth' } as unknown,
  ticket: { id: 'tk-1', subject: 'Necesito ayuda', priority: 'normal' } as unknown,
  notifyUrgent: vi.fn(async (_m: string) => true),
  cooldown: { send: true, repeatedCount: 0 },
  cooldownCalls: [] as Array<[string, number | undefined]>,
}))

vi.mock('next/server', async () => {
  const actual = await vi.importActual<any>('next/server')
  return { ...actual, after: (fn: () => unknown) => void fn() }
})
vi.mock('@/lib/supabase-admin', () => ({
  supabaseAdmin: { auth: { getUser: async () => ({ data: { user: h.user }, error: h.user ? null : { message: 'x' } }) } },
}))
vi.mock('@/lib/partners/tenant', () => ({ getTenantByUserId: async () => h.tenant }))
vi.mock('@/lib/partners/support', () => ({ createTicket: async () => h.ticket }))
vi.mock('@/lib/notifications', () => ({
  notifyUrgent: h.notifyUrgent,
  escapeTelegramHtml: (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'),
}))
vi.mock('@/lib/alerts/alert-cooldown', () => ({
  checkAlertCooldown: async (k: string, ms?: number) => { h.cooldownCalls.push([k, ms]); return h.cooldown },
  formatRepeatedSuffix: () => '',
  wasAlertSentRecently: async () => false,
  markAlertSent: async () => {},
}))

import { POST } from './route'

const flush = () => new Promise((r) => setTimeout(r, 0))
function req(body: unknown) {
  return new NextRequest('http://localhost/api/assistant/ticket', {
    method: 'POST',
    headers: { authorization: 'Bearer tok', 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}
const body = { subject: 'Necesito ayuda', description: 'No puedo <b>publicar</b> mi producto', pageUrl: '/workspace/catalog', pageContext: { a: 1 } }

beforeEach(() => {
  h.user = { id: 'u1', email: 'partner@tienda.com' }
  h.tenant = { id: 'tenant-1', name: 'Tienda <Rica>', plan: 'growth' }
  h.ticket = { id: 'tk-1', subject: 'Necesito ayuda', priority: 'normal' }
  h.cooldown = { send: true, repeatedCount: 0 }
  h.cooldownCalls.length = 0
  h.notifyUrgent.mockClear()
  h.notifyUrgent.mockResolvedValue(true)
})

describe('POST /api/assistant/ticket — aviso a Telegram', () => {
  it('ticket creado → avisa (HTML escapado, con origen, sin el JSON de contexto)', async () => {
    const res = await POST(req(body))
    await flush()
    expect(res.status).toBe(201)
    expect(h.notifyUrgent).toHaveBeenCalledTimes(1)
    const text = h.notifyUrgent.mock.calls[0][0]
    expect(text).toContain('Tienda &lt;Rica&gt;')
    expect(text).toContain('&lt;b&gt;publicar&lt;/b&gt;')
    expect(text).toContain('desde el asistente')
    expect(text).toContain('/workspace/catalog')
    expect(text).not.toContain('Contexto:')
    expect(text).toContain('admin.novamente.ar/dashboard/tickets?selected=tk-1')
  })

  it('cooldown por partner (10 min): suprimido → no avisa pero el ticket se crea igual', async () => {
    h.cooldown = { send: false, repeatedCount: 0 }
    const res = await POST(req(body))
    await flush()
    expect(res.status).toBe(201)
    expect(h.notifyUrgent).not.toHaveBeenCalled()
    expect(h.cooldownCalls[0]).toEqual(['assistant-ticket:tenant-1', 10 * 60 * 1000])
  })

  it('al volver a avisar cuenta los silenciados', async () => {
    h.cooldown = { send: true, repeatedCount: 4 }
    await POST(req(body))
    await flush()
    expect(h.notifyUrgent.mock.calls[0][0]).toContain('se silenciaron 4 pedidos')
  })

  it('si Telegram falla, la request NO falla', async () => {
    h.notifyUrgent.mockRejectedValue(new Error('telegram caído'))
    const res = await POST(req(body))
    await flush()
    expect(res.status).toBe(201)
  })

  it('admin del equipo → no avisa', async () => {
    h.user = { id: 'u2', email: 'sambu@novamente.ar' }
    const res = await POST(req(body))
    await flush()
    expect(res.status).toBe(201)
    expect(h.notifyUrgent).not.toHaveBeenCalled()
  })

  it('sin auth / sin asunto / ticket no creado → no avisa', async () => {
    h.user = null
    expect((await POST(req(body))).status).toBe(401)
    h.user = { id: 'u1', email: 'partner@tienda.com' }
    expect((await POST(req({ description: 'x' }))).status).toBe(400)
    h.ticket = null
    expect((await POST(req(body))).status).toBe(500)
    await flush()
    expect(h.notifyUrgent).not.toHaveBeenCalled()
  })
})
