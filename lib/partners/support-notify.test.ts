import { describe, it, expect, vi, beforeEach } from 'vitest'

const { notifyUrgent, wasAlertSentRecently } = vi.hoisted(() => ({
  notifyUrgent: vi.fn(async (_m: string) => true),
  wasAlertSentRecently: vi.fn(async (_k: string, _w?: number) => false),
}))

vi.mock('next/server', () => ({ after: (fn: () => unknown) => void fn() }))
vi.mock('@/lib/notifications', () => ({
  notifyUrgent,
  escapeTelegramHtml: (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'),
}))
vi.mock('@/lib/alerts/alert-cooldown', () => ({
  checkAlertCooldown: vi.fn(async () => ({ send: true, repeatedCount: 0 })),
  formatRepeatedSuffix: () => '',
  wasAlertSentRecently,
}))

import { notifySupportTicketCreated } from './support-notify'
import { bugDigestKey, bugPathMessageKey, parseErrorTicketContext } from '@/lib/alerts/workspace-error-keys'

const base = {
  tenantName: 'Tienda <X>',
  subject: 'Error en /workspace/catalog',
  description: 'Ruta: /workspace/catalog\nError: boom',
  ticketId: 't-1',
}

beforeEach(() => {
  notifyUrgent.mockClear()
  wasAlertSentRecently.mockReset()
  wasAlertSentRecently.mockResolvedValue(false)
})

describe('notifySupportTicketCreated', () => {
  it('ticket común (sin errorContext): avisa a Urgente, sin consultar dedupe', async () => {
    await notifySupportTicketCreated(base)
    expect(notifyUrgent).toHaveBeenCalledTimes(1)
    expect(wasAlertSentRecently).not.toHaveBeenCalled()
    expect(notifyUrgent.mock.calls[0][0]).toContain('Tienda &lt;X&gt;')
  })

  it('ticket de pantalla de error con bug-report previo por digest → NO manda 2º Urgente', async () => {
    wasAlertSentRecently.mockImplementation(async (k: string) => k === bugDigestKey('tenant-1', 'dig123'))
    const r = await notifySupportTicketCreated({
      ...base, tenantId: 'tenant-1',
      errorContext: { digest: 'dig123', path: '/workspace/catalog', message: 'boom' },
    })
    expect(r).toBeNull()
    expect(notifyUrgent).not.toHaveBeenCalled()
  })

  it('sin digest pero mismo tenant+ruta+mensaje → NO manda', async () => {
    wasAlertSentRecently.mockImplementation(
      async (k: string) => k === bugPathMessageKey('tenant-1', '/workspace/catalog', 'boom 123'),
    )
    await notifySupportTicketCreated({
      ...base, tenantId: 'tenant-1',
      errorContext: { path: '/workspace/catalog', message: 'boom 999' }, // dígitos se normalizan
    })
    expect(notifyUrgent).not.toHaveBeenCalled()
  })

  it('error-screen sin aviso previo (ej. error transitorio) → manda y menciona digest', async () => {
    await notifySupportTicketCreated({
      ...base, tenantId: 'tenant-1',
      errorContext: { digest: 'dig<1>', path: '/workspace/catalog', message: 'boom' },
    })
    expect(notifyUrgent).toHaveBeenCalledTimes(1)
    const text = notifyUrgent.mock.calls[0][0]
    expect(text).toContain('pantalla de error')
    expect(text).toContain('dig&lt;1&gt;')
  })

  it('otro tenant con mismo digest no se suprime (la clave incluye tenantId)', async () => {
    wasAlertSentRecently.mockImplementation(async (k: string) => k === bugDigestKey('tenant-A', 'd'))
    await notifySupportTicketCreated({ ...base, tenantId: 'tenant-B', errorContext: { digest: 'd' } })
    expect(notifyUrgent).toHaveBeenCalledTimes(1)
  })
})

describe('parseErrorTicketContext', () => {
  it('acepta digest solo o path+message; rechaza lo demás', () => {
    expect(parseErrorTicketContext({ digest: 'a' })).toEqual({ digest: 'a', path: undefined, message: undefined })
    expect(parseErrorTicketContext({ path: '/p', message: 'm' })).toMatchObject({ path: '/p', message: 'm' })
    expect(parseErrorTicketContext({ path: '/p' })).toBeNull()
    expect(parseErrorTicketContext('x')).toBeNull()
    expect(parseErrorTicketContext(null)).toBeNull()
  })
})
