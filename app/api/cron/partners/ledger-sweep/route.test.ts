// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

const h = vi.hoisted(() => ({
  sweepPartnerCredits: vi.fn(async () => ({ dryRun: false, scanned: 0, missing: [] })),
  esLunesArgentina: vi.fn(() => false),
  sendWeeklyPayoutReminder: vi.fn(async () => ({ sent: false, message: null })),
  notifyError: vi.fn(async (..._args: any[]) => null),
}))

vi.mock('@/lib/partners/ledger-sweep', () => ({ sweepPartnerCredits: h.sweepPartnerCredits }))
vi.mock('@/lib/partners/payout-reminder', () => ({
  esLunesArgentina: h.esLunesArgentina,
  sendWeeklyPayoutReminder: h.sendWeeklyPayoutReminder,
}))
vi.mock('@/lib/notifications', () => ({ notifyError: h.notifyError }))

process.env.CRON_SECRET = 'test-cron-secret'

import { GET } from './route'

const req = (opts: { auth?: string; dry?: string } = {}) => {
  const url = new URL('https://www.novamente.ar/api/cron/partners/ledger-sweep')
  if (opts.dry) url.searchParams.set('dry', opts.dry)
  const headers = new Headers()
  if (opts.auth) headers.set('authorization', opts.auth)
  return new NextRequest(url, { headers })
}

beforeEach(() => {
  h.sweepPartnerCredits.mockClear()
  h.esLunesArgentina.mockClear()
  h.sendWeeklyPayoutReminder.mockClear()
  h.notifyError.mockClear()
  h.sweepPartnerCredits.mockResolvedValue({ dryRun: false, scanned: 0, missing: [] })
  h.esLunesArgentina.mockReturnValue(false)
})

describe('GET /api/cron/partners/ledger-sweep', () => {
  it('401 sin el Bearer correcto', async () => {
    const res = await GET(req())
    expect(res.status).toBe(401)
    expect(h.sweepPartnerCredits).not.toHaveBeenCalled()
  })

  it('401 con un Bearer incorrecto', async () => {
    const res = await GET(req({ auth: 'Bearer otra-cosa' }))
    expect(res.status).toBe(401)
  })

  it('con el Bearer correcto corre el barrido (dryRun false por default)', async () => {
    const res = await GET(req({ auth: 'Bearer test-cron-secret' }))
    expect(res.status).toBe(200)
    expect(h.sweepPartnerCredits).toHaveBeenCalledWith({ dryRun: false })
  })

  it('?dry=1 → dryRun true, y NO manda el recordatorio semanal aunque sea lunes', async () => {
    h.esLunesArgentina.mockReturnValue(true)
    const res = await GET(req({ auth: 'Bearer test-cron-secret', dry: '1' }))
    const body = await res.json()

    expect(body.dryRun).toBe(true)
    expect(h.sweepPartnerCredits).toHaveBeenCalledWith({ dryRun: true })
    expect(h.sendWeeklyPayoutReminder).not.toHaveBeenCalled()
  })

  it('los lunes (y NO dry) manda el recordatorio semanal', async () => {
    h.esLunesArgentina.mockReturnValue(true)
    h.sendWeeklyPayoutReminder.mockResolvedValue({ sent: true, message: 'hola' })

    const res = await GET(req({ auth: 'Bearer test-cron-secret' }))
    const body = await res.json()

    expect(h.sendWeeklyPayoutReminder).toHaveBeenCalledTimes(1)
    expect(body.weeklyReminder).toEqual({ sent: true, hadContent: true })
  })

  it('si hay errores en el barrido (no dry), avisa por notifyError', async () => {
    h.sweepPartnerCredits.mockResolvedValue({
      dryRun: false,
      scanned: 3,
      missing: [{ order: { id: 'o1', order_number: 'NOV-1' }, error: 'boom' }],
    })

    await GET(req({ auth: 'Bearer test-cron-secret' }))

    expect(h.notifyError).toHaveBeenCalledTimes(1)
    expect(h.notifyError.mock.calls[0][0]).toMatchObject({ area: 'Ganancias partners' })
  })

  it('en dry run, aunque haya errores, NO avisa por notifyError', async () => {
    h.sweepPartnerCredits.mockResolvedValue({
      dryRun: true,
      scanned: 3,
      missing: [{ order: { id: 'o1', order_number: 'NOV-1' }, error: 'boom' }],
    })

    await GET(req({ auth: 'Bearer test-cron-secret', dry: '1' }))

    expect(h.notifyError).not.toHaveBeenCalled()
  })
})
