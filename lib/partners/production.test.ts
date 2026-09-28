import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { sendToProduction, type ProductionRequest } from './production'

/**
 * A3b (PLAN-FICHAS-ENVIO-PROVEEDOR.md §3): sendToProduction manda
 * `partner_order_id` (ancla de idempotencia en platform-master) y traduce un
 * timeout — el suyo propio o el que platform-master reporta como
 * `code:'incierto'` — en el mismo `code:'incierto'`, para que el caller
 * (app/api/partners/orders/route.ts) nunca le diga al partner "cargalo a
 * mano" cuando en realidad no sabemos si el pedido ya entró a producción.
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

describe('sendToProduction — code "incierto"', () => {
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

  it('un error de conexión (no timeout) NO se marca como incierto', async () => {
    const connErr = Object.assign(new Error('ECONNREFUSED'), { name: 'FetchError' })
    fetchMock.mockRejectedValue(connErr)

    const result = await sendToProduction(REQ)
    expect(result.ok).toBe(false)
    expect(result.code).toBeUndefined()
  })

  it('un rechazo definitivo (sin code) sigue sin marcarse como incierto', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ ok: false, error: 'SKU inválido' }),
    })

    const result = await sendToProduction(REQ)
    expect(result.ok).toBe(false)
    expect(result.code).toBeUndefined()
    expect(result.error).toBe('SKU inválido')
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
