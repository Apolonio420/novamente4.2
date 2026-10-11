// @vitest-environment node
//
// Auditoría workspace 08/10/2026: tickets y mensajes del partner solo se
// insertaban, sin aviso a Telegram. Ahora: ticket nuevo → 🚨 Urgente siempre;
// mensaje de seguimiento → máx. un aviso por ticket cada 30 min; super
// acción pedida → Urgente. Nunca se manda Telegram real: se mockea
// lib/notifications y el cooldown.
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

const h = vi.hoisted(() => ({
  notifyUrgent: vi.fn(async (_m: string) => ({ ok: true })),
  cooldown: vi.fn(async (_k: string) => ({ send: true, repeatedCount: 0 })),
  createTicket: vi.fn(),
  getTicketById: vi.fn(),
  addMessage: vi.fn(),
  superInsert: vi.fn(),
}))

vi.mock('next/server', async (orig) => ({
  ...(await orig<typeof import('next/server')>()),
  after: (fn: () => unknown) => {
    void fn()
  },
}))

vi.mock('@/lib/notifications', () => ({
  notifyUrgent: (m: string) => h.notifyUrgent(m),
  escapeTelegramHtml: (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'),
}))
vi.mock('@/lib/alerts/alert-cooldown', () => ({
  checkAlertCooldown: (k: string) => h.cooldown(k),
  formatRepeatedSuffix: (n: number) => (n > 0 ? ` (se repitió ${n} veces)` : ''),
}))
vi.mock('@/lib/partners/permissions', () => ({
  requireTenantPermission: vi.fn(async () => ({
    ok: true,
    tenant: { id: 't1', name: 'Marca <Uno> & Co', plan: 'pro' },
    role: 'owner',
  })),
}))
vi.mock('@/lib/partners/support', () => ({
  createTicket: (...a: unknown[]) => h.createTicket(...a),
  getTickets: vi.fn(),
  getTicketById: (...a: unknown[]) => h.getTicketById(...a),
  addMessage: (...a: unknown[]) => h.addMessage(...a),
  updateTicketStatus: vi.fn(),
}))
vi.mock('@/lib/supabase-admin', () => ({
  supabaseAdmin: {
    from: (table: string) => {
      if (table === 'super_credits') {
        return {
          select: () => ({ eq: () => ({ eq: () => ({ single: async () => ({ data: { id: 'c1', credits_remaining: 2 } }) }) }) }),
          update: () => ({ eq: () => ({ gt: async () => ({ error: null }) }) }),
        }
      }
      return {
        insert: (row: unknown) => ({
          select: () => ({ single: async () => h.superInsert(row) }),
        }),
      }
    },
  },
}))

import { POST as createTicketRoute } from '@/app/api/partners/support/route'
import { POST as addMessageRoute } from '@/app/api/partners/support/[ticketId]/route'
import { POST as superActionRoute } from '@/app/api/partners/assistant/super-action/route'

const json = (url: string, body: unknown) =>
  new NextRequest(url, { method: 'POST', body: JSON.stringify(body), headers: { 'content-type': 'application/json' } })

beforeEach(() => {
  vi.clearAllMocks()
  h.cooldown.mockResolvedValue({ send: true, repeatedCount: 0 })
  h.notifyUrgent.mockResolvedValue({ ok: true })
})

describe('soporte partner → Telegram Urgente', () => {
  it('ticket nuevo avisa con tenant, asunto, extracto, link al admin y HTML escapado', async () => {
    h.createTicket.mockResolvedValue({ id: 'tk-1', subject: 'No carga <mi> tienda', description: 'x'.repeat(500), priority: 'priority' })
    const res = await createTicketRoute(json('http://l/api/partners/support', { subject: 'a', description: 'b' }))
    expect(res.status).toBe(201)
    await new Promise((r) => setTimeout(r, 0))
    expect(h.notifyUrgent).toHaveBeenCalledTimes(1)
    const msg = h.notifyUrgent.mock.calls[0][0]
    expect(msg).toContain('Marca &lt;Uno&gt; &amp; Co')
    expect(msg).toContain('No carga &lt;mi&gt; tienda')
    expect(msg).toContain('https://admin.novamente.ar/dashboard/tickets?selected=tk-1')
    expect(msg).not.toContain('x'.repeat(250)) // extracto ~200
  })

  it('si el aviso falla, el ticket igual se crea (201)', async () => {
    h.createTicket.mockResolvedValue({ id: 'tk-1', subject: 's', description: 'd', priority: 'normal' })
    h.notifyUrgent.mockRejectedValue(new Error('telegram caído'))
    const res = await createTicketRoute(json('http://l/api/partners/support', { subject: 'a', description: 'b' }))
    expect(res.status).toBe(201)
  })

  it('no avisa si el ticket no se creó', async () => {
    h.createTicket.mockResolvedValue(null)
    const res = await createTicketRoute(json('http://l/api/partners/support', { subject: 'a', description: 'b' }))
    expect(res.status).toBe(500)
    expect(h.notifyUrgent).not.toHaveBeenCalled()
  })

  it('mensaje de seguimiento: avisa si el cooldown por ticket lo permite, con clave por ticket', async () => {
    h.getTicketById.mockResolvedValue({ id: 'tk-1', subject: 'Asunto' })
    h.addMessage.mockResolvedValue({ id: 'm1', message: 'sigo sin poder' })
    const res = await addMessageRoute(json('http://l/x', { message: 'sigo sin poder' }), { params: Promise.resolve({ ticketId: 'tk-1' }) })
    expect(res.status).toBe(201)
    await new Promise((r) => setTimeout(r, 0))
    expect(h.cooldown).toHaveBeenCalledWith('support-msg:tk-1')
    expect(h.notifyUrgent).toHaveBeenCalledTimes(1)
  })

  it('mensaje de seguimiento dentro de la ventana de 30 min NO avisa', async () => {
    h.cooldown.mockResolvedValue({ send: false, repeatedCount: 0 })
    h.getTicketById.mockResolvedValue({ id: 'tk-1', subject: 'Asunto' })
    h.addMessage.mockResolvedValue({ id: 'm2', message: 'otra vez' })
    const res = await addMessageRoute(json('http://l/x', { message: 'otra vez' }), { params: Promise.resolve({ ticketId: 'tk-1' }) })
    expect(res.status).toBe(201)
    await new Promise((r) => setTimeout(r, 0))
    expect(h.notifyUrgent).not.toHaveBeenCalled()
  })

  it('super acción pedida avisa a Urgente', async () => {
    h.superInsert.mockResolvedValue({ data: { id: 'sa-1' }, error: null })
    const res = await superActionRoute(json('http://l/x', { actionType: 'bug_fix', description: 'arreglen mi tienda' }))
    expect(res.status).toBe(200)
    await new Promise((r) => setTimeout(r, 0))
    expect(h.notifyUrgent).toHaveBeenCalledTimes(1)
    expect(h.notifyUrgent.mock.calls[0][0]).toContain('SUPER ACCIÓN')
  })
})
