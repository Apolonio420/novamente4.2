// /api/checkout armaba los back_urls de MercadoPago con NEXT_PUBLIC_BASE_URL
// fijo — una compra que arrancó en <slug>.novamente.ar volvía al apex y
// perdía el carrito. resolveCheckoutOrigin usa el origen del request SOLO si
// matchea la allowlist de dominios propios.
import { describe, it, expect } from 'vitest'
import { resolveCheckoutOrigin } from './origin'

const FALLBACK = 'https://www.novamente.ar'

describe('resolveCheckoutOrigin', () => {
  it('subdominio de partner (Origin) → usa ese origen', () => {
    expect(
      resolveCheckoutOrigin({ originHeader: 'https://lcitea.novamente.ar', fallback: FALLBACK }),
    ).toBe('https://lcitea.novamente.ar')
  })

  it('apex www → lo respeta tal cual', () => {
    expect(
      resolveCheckoutOrigin({ originHeader: 'https://www.novamente.ar', fallback: FALLBACK }),
    ).toBe('https://www.novamente.ar')
  })

  it('apex sin www → también permitido', () => {
    expect(
      resolveCheckoutOrigin({ originHeader: 'https://novamente.ar', fallback: FALLBACK }),
    ).toBe('https://novamente.ar')
  })

  it('dominio ajeno → NO lo usa, cae al fallback', () => {
    expect(
      resolveCheckoutOrigin({ originHeader: 'https://novamente.ar.evil.com', fallback: FALLBACK }),
    ).toBe(FALLBACK)
  })

  it('dominio que contiene "novamente.ar" pero no como sufijo real → rechaza', () => {
    expect(
      resolveCheckoutOrigin({ originHeader: 'https://notnovamente.ar', fallback: FALLBACK }),
    ).toBe(FALLBACK)
  })

  it('sin Origin, con Host de un subdominio propio → lo usa (https)', () => {
    expect(
      resolveCheckoutOrigin({ hostHeader: 'al-fa.novamente.ar', fallback: FALLBACK }),
    ).toBe('https://al-fa.novamente.ar')
  })

  it('localhost SIN allowLocalhost → rechaza (prod)', () => {
    expect(
      resolveCheckoutOrigin({ originHeader: 'http://localhost:3000', fallback: FALLBACK }),
    ).toBe(FALLBACK)
  })

  it('localhost CON allowLocalhost (dev) → lo permite', () => {
    expect(
      resolveCheckoutOrigin({ originHeader: 'http://localhost:3000', fallback: FALLBACK, allowLocalhost: true }),
    ).toBe('http://localhost:3000')
  })

  it('sin Origin ni Host → fallback', () => {
    expect(resolveCheckoutOrigin({ fallback: FALLBACK })).toBe(FALLBACK)
  })

  it('Origin mal formado → fallback, no explota', () => {
    expect(resolveCheckoutOrigin({ originHeader: 'no-es-una-url', fallback: FALLBACK })).toBe(FALLBACK)
  })
})
