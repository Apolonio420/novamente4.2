/**
 * Ruteo de avisos de PLATA al grupo nuevo "Ventas Novamente" (chat id
 * -5481590647, creado 10/2026) vs. el resto de los avisos, que se quedan en
 * "Chats Novamente" (TELEGRAM_CHAT_ID_SALES — nombre legacy de la env var).
 *
 * notifySale, notifyTeamManualSale, notifyPartnerDebt y
 * notifyPossibleDoubleCharge van a Ventas (sendToVentas en
 * lib/notifications.ts) — venta nueva/confirmada, venta manual del equipo,
 * deuda/payout de partner y doble cobro son todos avisos de plata. Todo lo
 * demás (solicitudes de partner, suscripciones, leads) NO es plata en sí y
 * sigue yendo a Chats sin cambios — ver el describe de "no se mueven" más
 * abajo.
 *
 * Se prueba contra la implementación real mockeando fetch, mismo patrón que
 * __tests__/partners/drop7-sale-notice.test.ts (vi.resetModules + import
 * dinámico por test, así cada uno puede variar TELEGRAM_CHAT_ID_VENTAS antes
 * de que el módulo lea process.env a nivel de archivo).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

const VENTAS_DEFAULT_CHAT_ID = '-5481590647'

beforeEach(() => {
  vi.resetModules()
  process.env.TELEGRAM_BOT_TOKEN_SALES = 'test-sales-token'
  process.env.TELEGRAM_CHAT_ID_SALES = 'test-chat-id-sales'
  delete process.env.TELEGRAM_CHAT_ID_VENTAS
})

function chatIdsSent(fetchMock: any): string[] {
  return fetchMock.mock.calls.map((call: any[]) => JSON.parse(call[1].body).chat_id)
}

function textsSent(fetchMock: any): string[] {
  return fetchMock.mock.calls.map((call: any[]) => JSON.parse(call[1].body).text)
}

describe('avisos de plata van a "Ventas Novamente"', () => {
  it('sin TELEGRAM_CHAT_ID_VENTAS seteada, notifySale usa el default hardcodeado -5481590647', async () => {
    global.fetch = vi.fn().mockResolvedValue({ json: async () => ({ ok: true, result: {} }) }) as any

    const { notifySale } = await import('./notifications')
    const result = await notifySale({ orderNumber: 'NOV-1', total: 10000, email: 'a@a.com', items: [] })

    expect(result).toBeTruthy()
    expect(chatIdsSent(global.fetch)).toEqual([VENTAS_DEFAULT_CHAT_ID])
  })

  it('con TELEGRAM_CHAT_ID_VENTAS seteada, notifySale manda a ESA chat id (override), no al default', async () => {
    process.env.TELEGRAM_CHAT_ID_VENTAS = '-100999888777'
    global.fetch = vi.fn().mockResolvedValue({ json: async () => ({ ok: true, result: {} }) }) as any

    const { notifySale } = await import('./notifications')
    await notifySale({ orderNumber: 'NOV-1', total: 10000, email: 'a@a.com', items: [] })

    expect(chatIdsSent(global.fetch)).toEqual(['-100999888777'])
  })

  it('notifyTeamManualSale (venta cargada por partner) también va a Ventas', async () => {
    global.fetch = vi.fn().mockResolvedValue({ json: async () => ({ ok: true, result: {} }) }) as any

    const { notifyTeamManualSale } = await import('./notifications')
    await notifyTeamManualSale('Tienda X', { items: [], pvpTotal: 1000, partnerTotal: 800, produce: false })

    expect(chatIdsSent(global.fetch)).toEqual([VENTAS_DEFAULT_CHAT_ID])
  })

  it('notifyPartnerDebt (deuda/payout de venta partner) va a Ventas', async () => {
    global.fetch = vi.fn().mockResolvedValue({ json: async () => ({ ok: true, result: {} }) }) as any

    const { notifyPartnerDebt } = await import('./notifications')
    await notifyPartnerDebt({
      tenantSlug: 'x',
      orderNumber: 'NOV-1',
      amount: 1000,
      needsReview: false,
      hasBankData: true,
      partnerNotified: true,
    })
    expect(chatIdsSent(global.fetch)).toEqual([VENTAS_DEFAULT_CHAT_ID])
  })

  it('notifyPossibleDoubleCharge (doble cobro) va a Ventas', async () => {
    global.fetch = vi.fn().mockResolvedValue({ json: async () => ({ ok: true, result: {} }) }) as any

    const { notifyPossibleDoubleCharge } = await import('./notifications')
    await notifyPossibleDoubleCharge({
      tenantName: 'X',
      amountArs: 1000,
      previousPaymentId: 'p1',
      newPaymentId: 'p2',
      previousPaymentDate: new Date().toISOString(),
      newPaymentDate: new Date().toISOString(),
    })
    expect(chatIdsSent(global.fetch)).toEqual([VENTAS_DEFAULT_CHAT_ID])
  })
})

describe('avisos que NO son venta/pago se quedan en Chats, aunque Ventas tenga otro chat id configurado', () => {
  beforeEach(() => {
    // Distinto del de Chats a propósito: si alguno de estos avisos se
    // cruzara a Ventas por error, el test lo detectaría.
    process.env.TELEGRAM_CHAT_ID_VENTAS = '-100999888777'
    global.fetch = vi.fn().mockResolvedValue({ json: async () => ({ ok: true, result: {} }) }) as any
  })

  it('notifyPartnerApplication (solicitud de partner) sigue en Chats', async () => {
    const { notifyPartnerApplication } = await import('./notifications')
    await notifyPartnerApplication({ fullName: 'Juan', email: 'j@j.com' })
    expect(chatIdsSent(global.fetch)).toEqual(['test-chat-id-sales'])
  })

  it('notifyPartnerSubscription (suscripción) sigue en Chats', async () => {
    const { notifyPartnerSubscription } = await import('./notifications')
    await notifyPartnerSubscription({
      tenantName: 'Tienda X',
      plan: 'growth',
      priceUsd: 10,
      priceArs: 10000,
      billingCycle: 'monthly',
      tenantEmail: 't@t.com',
      tenantSlug: 'x',
    })
    expect(chatIdsSent(global.fetch)).toEqual(['test-chat-id-sales'])
  })

  it('notifyNewLead (lead) sigue en Chats', async () => {
    const { notifyNewLead } = await import('./notifications')
    await notifyNewLead({ tenantName: 'X', tenantSlug: 'x', leadName: 'L', leadEmail: 'l@l.com' })
    expect(chatIdsSent(global.fetch)).toEqual(['test-chat-id-sales'])
  })

  it('sendSalesTelegram (mensaje libre, lo usa el payout reminder) sigue en Chats', async () => {
    const { sendSalesTelegram } = await import('./notifications')
    await sendSalesTelegram('aviso libre')
    expect(chatIdsSent(global.fetch)).toEqual(['test-chat-id-sales'])
  })
})

describe('sendToVentas — robustez 400/403 SOLO para el chat de Ventas', () => {
  it('403 sin migrate_to_chat_id (bot expulsado / chat no encontrado) → reintenta UNA vez a Chats con prefijo de aviso', async () => {
    global.fetch = vi
      .fn()
      .mockResolvedValueOnce({
        json: async () => ({ ok: false, error_code: 403, description: 'Forbidden: bot was kicked from the group chat' }),
      })
      .mockResolvedValueOnce({ json: async () => ({ ok: true, result: {} }) }) as any

    const { notifySale } = await import('./notifications')
    const result = await notifySale({ orderNumber: 'NOV-1', total: 10000, email: 'a@a.com', items: [] })

    expect(global.fetch).toHaveBeenCalledTimes(2)
    expect(chatIdsSent(global.fetch)).toEqual([VENTAS_DEFAULT_CHAT_ID, 'test-chat-id-sales'])
    expect(textsSent(global.fetch)[1]).toContain('⚠️ (no se pudo mandar a Ventas Novamente)')
    expect(result).toBeTruthy() // el reintento a Chats salió bien
  })

  it('400 CON parameters.migrate_to_chat_id (grupo migró a supergrupo) → reintenta UNA vez a ESE chat id (no a Chats) y avisa por consola', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    global.fetch = vi
      .fn()
      .mockResolvedValueOnce({
        json: async () => ({
          ok: false,
          error_code: 400,
          description: 'Bad Request: group chat was upgraded to a supergroup chat',
          parameters: { migrate_to_chat_id: -100123456789 },
        }),
      })
      .mockResolvedValueOnce({ json: async () => ({ ok: true, result: {} }) }) as any

    const { notifySale } = await import('./notifications')
    const result = await notifySale({ orderNumber: 'NOV-1', total: 10000, email: 'a@a.com', items: [] })

    expect(global.fetch).toHaveBeenCalledTimes(2)
    expect(chatIdsSent(global.fetch)).toEqual([VENTAS_DEFAULT_CHAT_ID, '-100123456789'])
    expect(result).toBeTruthy()
    expect(warnSpy.mock.calls.some((c) => String(c[0]).includes('TELEGRAM_CHAT_ID_VENTAS'))).toBe(true)

    warnSpy.mockRestore()
  })

  it('timeout (fetch tira excepción) → NUNCA reintenta: un solo intento y devuelve null', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('timeout')) as any

    const { notifySale } = await import('./notifications')
    const result = await notifySale({ orderNumber: 'NOV-1', total: 10000, email: 'a@a.com', items: [] })

    expect(global.fetch).toHaveBeenCalledTimes(1)
    expect(result).toBeNull()
  })

  it('5xx (error_code 500) → NUNCA reintenta: un solo intento y devuelve null', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      json: async () => ({ ok: false, error_code: 500, description: 'Internal Server Error' }),
    }) as any

    const { notifySale } = await import('./notifications')
    const result = await notifySale({ orderNumber: 'NOV-1', total: 10000, email: 'a@a.com', items: [] })

    expect(global.fetch).toHaveBeenCalledTimes(1)
    expect(result).toBeNull()
  })
})
