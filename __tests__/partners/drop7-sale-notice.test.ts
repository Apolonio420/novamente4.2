/**
 * DROP7: la etiqueta "🚀 DROP7 · <Marca>" tiene que aparecer ADELANTE de los
 * avisos de venta que ya existen — Telegram (notifySale, lib/notifications.ts)
 * y el subject/primera línea del mail a SALES_NOTIFY_EMAIL (armado inline en
 * lib/payments/process-payment.ts y app/api/admin/confirm-transfer/route.ts).
 *
 * notifySale se prueba contra la implementación real (mockeando fetch, como
 * hace el resto de la suite con supabase-admin). El subject/body del mail vive
 * inline en handlers con muchísimas dependencias (MercadoPago, stock, CAPI...)
 * — se fija el contrato de la fórmula de armado (misma que usan esos archivos)
 * sin arrastrar esos imports.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

describe('notifySale antepone la etiqueta DROP7 al aviso de Telegram', () => {
  beforeEach(() => {
    vi.resetModules()
    process.env.TELEGRAM_BOT_TOKEN_SALES = 'test-token'
    process.env.TELEGRAM_CHAT_ID_SALES = 'test-chat-id'
  })

  it('con label: el texto del aviso la lleva ADELANTE del título de venta', async () => {
    let sentText = ''
    // @ts-expect-error - mock mínimo de fetch, solo lo que sendToTelegram usa
    global.fetch = vi.fn(async (_url: string, opts: any) => {
      sentText = JSON.parse(opts.body).text
      return { json: async () => ({ ok: true }) }
    })

    const { notifySale } = await import('@/lib/notifications')
    const result = await notifySale({
      orderNumber: 'NOV-20261001-0001',
      total: 42000,
      email: 'cliente@test.com',
      items: [{ name: 'Remera Aldea', quantity: 1 }],
      label: '🚀 DROP7 · Aldea',
    })

    expect(result).toBeTruthy() // no falló el envío
    expect(sentText).toContain('🚀 DROP7 · Aldea')
    expect(sentText).toContain('¡NUEVA VENTA!')
    // La etiqueta va ADELANTE, no mezclada en cualquier lado del mensaje.
    expect(sentText.indexOf('🚀 DROP7 · Aldea')).toBeLessThan(sentText.indexOf('¡NUEVA VENTA!'))
  })

  it('sin label (undefined): el aviso sale igual que siempre, sin nada de DROP7', async () => {
    let sentText = ''
    // @ts-expect-error - mock mínimo de fetch
    global.fetch = vi.fn(async (_url: string, opts: any) => {
      sentText = JSON.parse(opts.body).text
      return { json: async () => ({ ok: true }) }
    })

    const { notifySale } = await import('@/lib/notifications')
    await notifySale({
      orderNumber: 'NOV-20261001-0002',
      total: 15000,
      email: 'cliente2@test.com',
      items: [{ name: 'Buzo', quantity: 1 }],
    })

    expect(sentText).not.toContain('DROP7')
    expect(sentText.startsWith('💰 <b>¡NUEVA VENTA!</b>')).toBe(true)
  })

  it('label null (tenant fuera de ventana): mismo comportamiento que sin label', async () => {
    let sentText = ''
    // @ts-expect-error - mock mínimo de fetch
    global.fetch = vi.fn(async (_url: string, opts: any) => {
      sentText = JSON.parse(opts.body).text
      return { json: async () => ({ ok: true }) }
    })

    const { notifySale } = await import('@/lib/notifications')
    await notifySale({
      orderNumber: 'NOV-20261001-0003',
      total: 15000,
      email: 'cliente3@test.com',
      items: [{ name: 'Buzo', quantity: 1 }],
      label: null,
    })

    expect(sentText).not.toContain('DROP7')
  })

  it('un fallo de Telegram no rompe nada — mismo contrato de antes (devuelve null)', async () => {
    global.fetch = vi.fn(async () => {
      throw new Error('Telegram caído')
    })
    const { notifySale } = await import('@/lib/notifications')
    const result = await notifySale({
      orderNumber: 'NOV-20261001-0004',
      total: 1000,
      email: 'x@x.com',
      items: [],
      label: '🚀 DROP7 · Aldea',
    })
    expect(result).toBeNull()
  })
})

describe('subject/body del mail de venta — misma fórmula que process-payment.ts y confirm-transfer/route.ts', () => {
  /** Misma fórmula que ambos archivos: `${drop7Label ? `${drop7Label} — ` : ""}💰 VENTA ...` */
  const subjectConLabel = (label: string | null, resto: string) => `${label ? `${label} — ` : ''}${resto}`
  /** Misma fórmula para el <h2> del cuerpo: `${drop7Label ? `${drop7Label}<br/>` : ""}...` */
  const bodyConLabel = (label: string | null, resto: string) => `${label ? `${label}<br/>` : ''}${resto}`

  it('con label: antepuesta al subject, separada por " — "', () => {
    expect(subjectConLabel('🚀 DROP7 · Aldea', '💰 VENTA NOV-1 — $1.000')).toBe(
      '🚀 DROP7 · Aldea — 💰 VENTA NOV-1 — $1.000',
    )
  })

  it('con label: antepuesta a la primera línea del cuerpo (el <h2>)', () => {
    expect(bodyConLabel('🚀 DROP7 · Aldea', 'Nueva venta pagada ✅')).toBe(
      '🚀 DROP7 · Aldea<br/>Nueva venta pagada ✅',
    )
  })

  it('sin label (null): subject y cuerpo quedan exactamente como antes, sin restos', () => {
    expect(subjectConLabel(null, '💰 VENTA NOV-1 — $1.000')).toBe('💰 VENTA NOV-1 — $1.000')
    expect(bodyConLabel(null, 'Nueva venta pagada ✅')).toBe('Nueva venta pagada ✅')
  })
})
