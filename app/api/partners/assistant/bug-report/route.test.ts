import { describe, it, expect, vi, beforeEach } from 'vitest'

const { notifyUrgent, notifyError, checkAlertCooldown, markAlertSent } = vi.hoisted(() => ({
  notifyUrgent: vi.fn(async (_m: string) => true),
  notifyError: vi.fn(async () => true),
  checkAlertCooldown: vi.fn(async (_k: string) => ({ send: true, repeatedCount: 0 })),
  markAlertSent: vi.fn(async (_k: string) => {}),
}))

vi.mock('next/server', async () => {
  const actual = await vi.importActual<any>('next/server')
  return { ...actual, after: (fn: () => unknown) => void fn() }
})
vi.mock('@/lib/partners/permissions', () => ({
  getRequestTenant: async () => ({ tenant: { id: 'tenant-1', name: 'Tienda' } }),
}))
vi.mock('@/lib/supabase-admin', () => {
  const b: any = {}
  b.select = () => b
  b.eq = () => b
  b.gte = () => Promise.resolve({ count: 0, error: null })
  b.insert = () => b
  b.single = () => Promise.resolve({ data: { id: 'bug-1' }, error: null })
  return { supabaseAdmin: { from: () => b } }
})
vi.mock('@/lib/notifications', () => ({
  notifyUrgent, notifyError, escapeTelegramHtml: (s: string) => s,
}))
vi.mock('@/lib/alerts/alert-cooldown', () => ({
  checkAlertCooldown, markAlertSent, formatRepeatedSuffix: () => '',
}))

import { POST } from './route'
import { bugDigestKey, bugPathMessageKey } from '@/lib/alerts/workspace-error-keys'

const flush = () => new Promise((r) => setTimeout(r, 0))

function req(body: unknown) {
  return new Request('http://localhost/api/partners/assistant/bug-report', {
    method: 'POST', body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' },
  }) as any
}
const payload = {
  description: 'Error automático en /workspace/catalog: boom',
  errorMessage: 'boom',
  errorDigest: 'dig123',
  sourceUrl: 'https://novamente.ar/workspace/catalog?x=1',
}

beforeEach(() => {
  vi.clearAllMocks()
  checkAlertCooldown.mockResolvedValue({ send: true, repeatedCount: 0 })
})

describe('POST bug-report — claves de dedupe para el ticket', () => {
  it('usa la clave tenant+ruta+mensaje y marca tenant+digest', async () => {
    const res = await POST(req(payload))
    await flush()
    expect(res.status).toBe(200)
    expect(checkAlertCooldown).toHaveBeenCalledWith(bugPathMessageKey('tenant-1', '/workspace/catalog', 'boom'))
    expect(markAlertSent).toHaveBeenCalledWith(bugDigestKey('tenant-1', 'dig123'))
    expect(notifyUrgent).toHaveBeenCalledTimes(1)
  })

  it('marca el digest aunque el cooldown suprima este envío', async () => {
    checkAlertCooldown.mockResolvedValue({ send: false, repeatedCount: 0 })
    await POST(req(payload))
    await flush()
    expect(markAlertSent).toHaveBeenCalledWith(bugDigestKey('tenant-1', 'dig123'))
    expect(notifyUrgent).not.toHaveBeenCalled()
  })

  it('error transitorio (ChunkLoadError) no va a Urgente ni marca el digest', async () => {
    await POST(req({ ...payload, errorMessage: 'ChunkLoadError: Loading chunk 5 failed' }))
    await flush()
    expect(notifyUrgent).not.toHaveBeenCalled()
    expect(markAlertSent).not.toHaveBeenCalled()
    expect(notifyError).toHaveBeenCalled()
  })

  it('sin digest no marca clave de digest', async () => {
    const { errorDigest, ...noDigest } = payload
    await POST(req(noDigest))
    expect(markAlertSent).not.toHaveBeenCalled()
  })
})
