// buildStorefrontHealthMessage (lib/notifications.ts) es la parte pura del
// aviso de healthcheck de storefronts (ver
// app/api/cron/partners/storefront-health/route.ts). Gotcha real de este
// proyecto: un mensaje de Telegram con Markdown roto por `_` en un nombre se
// tragó avisos EN SILENCIO (el cron reportaba éxito, el mensaje nunca llegó).
// Acá el canal usa parse_mode:'HTML' (sendToTelegram), así que el riesgo
// equivalente es `&`/`<`/`>` sin escapar en nombres/slugs de tenant — estos
// tests cubren que se escapan.
import { describe, it, expect } from 'vitest'
import { buildStorefrontHealthMessage, escapeTelegramHtml } from './notifications'

describe('escapeTelegramHtml', () => {
  it('escapa &, < y > para no romper parse_mode HTML', () => {
    expect(escapeTelegramHtml('Tom & Jerry <script> "quotes"')).toBe('Tom &amp; Jerry &lt;script&gt; "quotes"')
  })

  it('no toca texto sin entities', () => {
    expect(escapeTelegramHtml('WOD ARMOR')).toBe('WOD ARMOR')
  })
})

describe('buildStorefrontHealthMessage', () => {
  it('escapa nombre/slug de tenant con caracteres que romperían el parseo HTML de Telegram', () => {
    const message = buildStorefrontHealthMessage({
      deadSilent: [{ slug: 'raro<slug>', name: 'Marca & Cía', publishedProducts: 2 }],
      brokenLive: [],
      emptyStorefrontCount: 0,
    })

    expect(message).toContain('Marca &amp; Cía')
    expect(message).toContain('raro&lt;slug&gt;')
    // Nunca debe viajar el literal sin escapar (rompería el parseo HTML de Telegram)
    expect(message).not.toContain('Marca & Cía')
    expect(message).not.toContain('raro<slug>')
  })

  it('incluye tiendas muertas y caídas, y la línea de vidriera vacía cuando hay actividad', () => {
    const message = buildStorefrontHealthMessage({
      deadSilent: [{ slug: 'orlando', name: 'Orlando', publishedProducts: 2 }],
      brokenLive: [{ slug: 'rota', name: 'Rota SA', reason: 'not_found_marker', detail: 'título="Not Found · Novamente"' }],
      emptyStorefrontCount: 10,
    })

    expect(message).toContain('Tiendas muertas silenciosas')
    expect(message).toContain('orlando')
    expect(message).toContain('Tiendas publicadas que NO cargan')
    expect(message).toContain('rota')
    expect(message).toContain('10 tienda(s) publicada(s) sin productos')
  })

  it('omite las secciones de una categoría vacía en vez de imprimir "(0)"', () => {
    const message = buildStorefrontHealthMessage({
      deadSilent: [{ slug: 'orlando', name: 'Orlando', publishedProducts: 1 }],
      brokenLive: [],
      emptyStorefrontCount: 0,
    })

    expect(message).not.toContain('Tiendas publicadas que NO cargan')
    expect(message).not.toContain('vidriera vacía')
  })
})
