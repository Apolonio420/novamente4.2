import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/supabase-admin', () => ({ supabaseAdmin: {} }))

const sendEmailMock = vi.fn(async (_opts: any): Promise<{ ok: boolean; id?: string; error?: string }> => ({ ok: true, id: 'email-1' }))
vi.mock('@/lib/email', () => ({ sendEmail: (opts: any) => sendEmailMock(opts) }))

// notifyPartnerDebt manda por Telegram (fetch directo a la Bot API) — los
// tokens/chat_id se leen de process.env a nivel de MÓDULO (const top-level),
// así que tienen que estar seteados antes de que se evalúe el import. Un
// `process.env.X = ...` de nivel de archivo NO alcanza: en ESM los módulos
// importados se evalúan antes que el resto del código del archivo que
// importa, sin importar el orden textual. `vi.hoisted` sí corre antes que
// cualquier import (incluidos los vi.mock).
vi.hoisted(() => {
  process.env.TELEGRAM_BOT_TOKEN = 'test-bot-token'
  process.env.TELEGRAM_CHAT_ID_SALES = 'test-chat-id-sales'
})

import { notifyPartnerWebSale, notifyPartnerDebt, CUANDO_COBRA_TXT, CUANDO_COBRA_CREDITO_TXT } from './notifications'

beforeEach(() => {
  sendEmailMock.mockClear()
  sendEmailMock.mockResolvedValue({ ok: true, id: 'email-1' })
  global.fetch = vi.fn(async () => ({
    ok: true,
    json: async () => ({ ok: true, result: {} }),
  })) as any
})

function saleArgs(overrides: Partial<Parameters<typeof notifyPartnerWebSale>[1]> = {}) {
  return {
    orderNumber: 'NOV-1',
    customerName: 'Juan Pérez',
    credit: {
      amount: 16800,
      needsReview: false,
      breakdown: [
        { item: 'Remera Aura', qty: 1, unit: 30000, color: 'negro', talle: 'M', doble_estampa: false, costo_base: 13200, recargo_doble: 0, cost: 13200, descuento: 0, ganancia: 16800 },
      ],
    },
    ...overrides,
  }
}

describe('notifyPartnerWebSale', () => {
  it('sin email de tenant → false, no manda mail', async () => {
    const sent = await notifyPartnerWebSale({ name: 'Sin mail' }, saleArgs())
    expect(sent).toBe(false)
    expect(sendEmailMock).not.toHaveBeenCalled()
  })

  it("payoutMode 'credit' → el texto dice que queda como saldo a favor y NO avisa de alias/CBU faltante", async () => {
    const sent = await notifyPartnerWebSale(
      { name: 'Sponsors', email: 'sponsors@x.com', bank_alias: null, bank_cbu: null },
      saleArgs({ payoutMode: 'credit' }),
    )
    expect(sent).toBe(true)
    expect(sendEmailMock).toHaveBeenCalledTimes(1)
    const { to, subject, html } = sendEmailMock.mock.calls[0][0]
    expect(to).toBe('sponsors@x.com')
    expect(subject).toContain('16.800')
    expect(html).toContain(CUANDO_COBRA_CREDITO_TXT)
    expect(html).not.toContain(CUANDO_COBRA_TXT)
    expect(html).not.toContain('Todavía no cargaste tu alias o CBU')
  })

  it("payoutMode 'cash' sin alias/CBU cargado → avisa que falta cargarlo", async () => {
    const sent = await notifyPartnerWebSale(
      { name: 'Tienda A', email: 'a@x.com', bank_alias: null, bank_cbu: null },
      saleArgs({ payoutMode: 'cash' }),
    )
    expect(sent).toBe(true)
    const { html } = sendEmailMock.mock.calls[0][0]
    expect(html).toContain(CUANDO_COBRA_TXT)
    expect(html).toContain('Todavía no cargaste tu alias o CBU')
  })

  it("payoutMode 'cash' CON alias cargado → no avisa de falta de datos bancarios", async () => {
    const sent = await notifyPartnerWebSale(
      { name: 'Tienda A', email: 'a@x.com', bank_alias: 'a.alias', bank_cbu: null },
      saleArgs({ payoutMode: 'cash' }),
    )
    expect(sent).toBe(true)
    const { html } = sendEmailMock.mock.calls[0][0]
    expect(html).toContain(CUANDO_COBRA_TXT)
    expect(html).not.toContain('Todavía no cargaste tu alias o CBU')
  })

  it('payoutMode ausente (undefined) se comporta como cash (aCredito=false)', async () => {
    await notifyPartnerWebSale({ name: 'Tienda A', email: 'a@x.com', bank_alias: null, bank_cbu: null }, saleArgs())
    const { html } = sendEmailMock.mock.calls[0][0]
    expect(html).toContain(CUANDO_COBRA_TXT)
    expect(html).toContain('Todavía no cargaste tu alias o CBU')
  })

  it('sendEmail falla → devuelve false', async () => {
    sendEmailMock.mockResolvedValue({ ok: false, error: 'boom' })
    const sent = await notifyPartnerWebSale({ name: 'Tienda A', email: 'a@x.com' }, saleArgs({ payoutMode: 'cash' }))
    expect(sent).toBe(false)
  })
})

function debtArgs(overrides: Partial<Parameters<typeof notifyPartnerDebt>[0]> = {}) {
  return {
    tenantSlug: 'sponsors',
    tenantName: 'Sponsors',
    orderNumber: 'NOV-1',
    amount: 16800,
    needsReview: false,
    hasBankData: false,
    partnerNotified: true,
    ...overrides,
  }
}

function lastTelegramText(): string {
  const call = (global.fetch as any).mock.calls[0]
  const body = JSON.parse(call[1].body)
  return body.text as string
}

describe('notifyPartnerDebt', () => {
  it("payoutMode 'credit' → arranca con \"🟢 Saldo a favor partner\", dice NO transferir y NO avisa de alias/CBU aunque hasBankData sea false", async () => {
    await notifyPartnerDebt(debtArgs({ payoutMode: 'credit', hasBankData: false }))
    expect(global.fetch).toHaveBeenCalledTimes(1)
    const text = lastTelegramText()
    expect(text).toContain('🟢 <b>Saldo a favor partner')
    expect(text).toContain('NO transferir')
    expect(text).not.toContain('El partner no tiene alias/CBU cargado')
    expect(text).toContain('Se descuenta cuando le tomemos un pedido propio')
    expect(text).not.toContain('💸')
  })

  it("payoutMode 'cash' sin datos bancarios → arranca con \"💸 Deuda partner\" y avisa de alias/CBU faltante", async () => {
    await notifyPartnerDebt(debtArgs({ payoutMode: 'cash', hasBankData: false }))
    const text = lastTelegramText()
    expect(text).toContain('💸 <b>Deuda partner')
    expect(text).toContain('El partner no tiene alias/CBU cargado')
    expect(text).toContain('Se paga en la tanda semanal')
    expect(text).not.toContain('🟢')
  })

  it("payoutMode 'cash' CON datos bancarios → no avisa de alias/CBU faltante", async () => {
    await notifyPartnerDebt(debtArgs({ payoutMode: 'cash', hasBankData: true }))
    const text = lastTelegramText()
    expect(text).not.toContain('El partner no tiene alias/CBU cargado')
  })

  it('payoutMode ausente se comporta como cash', async () => {
    await notifyPartnerDebt(debtArgs({ hasBankData: false }))
    const text = lastTelegramText()
    expect(text).toContain('💸 <b>Deuda partner')
  })

  it('needsReview true agrega el aviso de revisión', async () => {
    await notifyPartnerDebt(debtArgs({ needsReview: true, reasons: ['costo sin confirmar'] }))
    const text = lastTelegramText()
    expect(text).toContain('EN REVISIÓN')
    expect(text).toContain('costo sin confirmar')
  })

  it('partnerNotified false avisa que no se mandó mail automático', async () => {
    await notifyPartnerDebt(debtArgs({ partnerNotified: false }))
    const text = lastTelegramText()
    expect(text).toContain('NO se le mandó mail automático')
  })
})
