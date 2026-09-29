import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { sendToProduction, type ProductionRequest } from './production'

/**
 * A3b (PLAN-FICHAS-ENVIO-PROVEEDOR.md §3) + review Opus 28/09: sendToProduction
 * manda `partner_order_id` (ancla de idempotencia en platform-master). SOLO
 * `code:'rechazado'` es definitivo — TODO LO DEMÁS (sin code, timeout de este
 * fetch o de platform-master, error de red, HTTP no-200) se traduce/propaga
 * como `code:'incierto'`, para que el caller (app/api/partners/orders/route.ts)
 * nunca le diga al partner "cargalo a mano" cuando en realidad no sabemos si
 * el pedido ya entró a producción.
 */

const REQ: ProductionRequest = {
  tenant: { id: 'tenant-1', name: 'Tienda Test', slug: 'tienda-test' },
  cliente: 'Juan Pérez',
  telefono: '5491122334455',
  direccion: 'Calle Falsa 123',
  notas: 'Urgente',
  partnerOrderId: 'partner-order-99',
  items: [
    {
      producto: 'Remera Aura Oversize',
      color: 'Negro',
      talle: 'M',
      cantidad: 1,
      doble_estampa: 'No',
      pvp: 30000,
      precio_partner: 22500,
    },
  ],
}

const ORIGINAL_ENV = { ...process.env }
const fetchMock = vi.fn()

beforeEach(() => {
  vi.clearAllMocks()
  process.env.PLATFORM_API_BASE_URL = 'https://admin.novamente.ar'
  process.env.BOT_API_SECRET = 'test-secret'
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  process.env = { ...ORIGINAL_ENV }
  vi.unstubAllGlobals()
})

describe('sendToProduction — partner_order_id', () => {
  it('manda partner_order_id en el body al endpoint interno', async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ ok: true, pedido_numero: 'P-1' }) })

    const result = await sendToProduction(REQ)

    expect(result).toEqual({ ok: true, pedido_numero: 'P-1' })
    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, init] = fetchMock.mock.calls[0]!
    expect(url).toBe('https://admin.novamente.ar/api/partners/orders/submit')
    const sentBody = JSON.parse((init as RequestInit).body as string)
    expect(sentBody.partner_order_id).toBe('partner-order-99')
  })

  it('sin partnerOrderId: manda partner_order_id undefined (JSON.stringify lo omite)', async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ ok: true, pedido_numero: 'P-1' }) })
    const { partnerOrderId: _omit, ...reqSinId } = REQ

    await sendToProduction(reqSinId)

    const sentBody = JSON.parse((fetchMock.mock.calls[0]![1] as RequestInit).body as string)
    expect(sentBody.partner_order_id).toBeUndefined()
  })
})

describe('sendToProduction — SOLO "rechazado" es definitivo (review Opus 28/09)', () => {
  it('platform-master responde code:"rechazado" → se propaga tal cual (definitivo)', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ ok: false, code: 'rechazado', error: 'SKU inválido' }),
    })

    const result = await sendToProduction(REQ)
    expect(result.ok).toBe(false)
    expect(result.code).toBe('rechazado')
  })

  it('platform-master responde code:"incierto" → se propaga tal cual', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 502,
      json: async () => ({ ok: false, code: 'incierto', error: 'timeout interno' }),
    })

    const result = await sendToProduction(REQ)
    expect(result.ok).toBe(false)
    expect(result.code).toBe('incierto')
  })

  it('un timeout de ESTE fetch (AbortSignal.timeout) se traduce a code:"incierto"', async () => {
    const timeoutErr = Object.assign(new Error('The operation was aborted'), { name: 'TimeoutError' })
    fetchMock.mockRejectedValue(timeoutErr)

    const result = await sendToProduction(REQ)
    expect(result.ok).toBe(false)
    expect(result.code).toBe('incierto')
  })

  it('un error de conexión (no timeout) TAMBIÉN se marca como incierto (todo error de red, sin distinguir)', async () => {
    const connErr = Object.assign(new Error('ECONNREFUSED'), { name: 'FetchError' })
    fetchMock.mockRejectedValue(connErr)

    const result = await sendToProduction(REQ)
    expect(result.ok).toBe(false)
    expect(result.code).toBe('incierto')
  })

  it('un rechazo SIN code explícito ahora se trata como incierto, no como definitivo', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ ok: false, error: 'SKU inválido' }),
    })

    const result = await sendToProduction(REQ)
    expect(result.ok).toBe(false)
    expect(result.code).toBe('incierto')
    expect(result.error).toBe('SKU inválido')
  })

  it('HTTP no-200 sin code explícito también es incierto (no asume definitivo)', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ ok: false, error: 'internal' }),
    })

    const result = await sendToProduction(REQ)
    expect(result.code).toBe('incierto')
  })
})

describe('sendToProduction — timeout de 55s (review Opus 28/09: corre dentro de after(), el partner no espera)', () => {
  it('usa un AbortSignal con timeout de 55s, no 25s', async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ ok: true, pedido_numero: 'P-1' }) })
    const abortSpy = vi.spyOn(AbortSignal, 'timeout')

    await sendToProduction(REQ)

    expect(abortSpy).toHaveBeenCalledWith(55_000)
    abortSpy.mockRestore()
  })
})

describe('sendToProduction — configuración faltante', () => {
  it('sin PLATFORM_API_BASE_URL/BOT_API_SECRET no llama a fetch', async () => {
    delete process.env.PLATFORM_API_BASE_URL
    delete process.env.BOT_API_SECRET

    const result = await sendToProduction(REQ)
    expect(result.ok).toBe(false)
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
