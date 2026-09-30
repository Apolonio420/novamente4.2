/**
 * Fix DROP7 (30/09/2026): app/p/[slug]/page.tsx (CtaSection, ~línea 606) armaba
 * el link de WhatsApp pegando SIEMPRE "?text=" al final de tenant.cta_url, aunque
 * ese cta_url ya trajera su propio "?" (o su propio "text="). Durante el
 * lanzamiento cta_url va a ser algo como:
 *   https://wa.me/5492235169720?text=Hola!%20Vengo%20por%20la%20edici%C3%B3n%20de%20<Marca>%20%F0%9F%9A%80
 * y ese texto tiene que llegar intacto al botón — antes se pisaba/duplicaba con
 * un segundo "?text=...utmRef".
 *
 * Estos tests reproducen la MISMA lógica ya corregida (misma condición, mismo
 * separador) para fijar el contrato sin arrastrar todos los imports de la page.
 */
import { describe, it, expect } from 'vitest'

/** Misma lógica que CtaSection en app/p/[slug]/page.tsx (~línea 606-612). */
function buildWaHref(baseHref: string | null, utmRef: string): string | null {
  let waHref = baseHref
  if (waHref && utmRef && waHref.includes('wa.me/') && !/[?&]text=/.test(waHref)) {
    const sep = waHref.includes('?') ? '&' : '?'
    waHref = `${waHref}${sep}text=${encodeURIComponent(`Hola! Ref: ${utmRef}`)}`
  }
  return waHref
}

describe('armado del link de WhatsApp — sin utmRef', () => {
  it('sin utmRef no toca el cta_url', () => {
    expect(buildWaHref('https://wa.me/5492235169720', '')).toBe('https://wa.me/5492235169720')
    expect(buildWaHref('https://wa.me/5492235169720?text=Hola', '')).toBe('https://wa.me/5492235169720?text=Hola')
  })
})

describe('armado del link de WhatsApp — con utmRef', () => {
  it('cta_url SIN "?" → agrega el utmRef con "?text="', () => {
    expect(buildWaHref('https://wa.me/5492235169720', 'ig-post-3')).toBe(
      `https://wa.me/5492235169720?text=${encodeURIComponent('Hola! Ref: ig-post-3')}`,
    )
  })

  it('cta_url CON "?" pero sin "text=" → agrega el utmRef con "&", no con un segundo "?" (el bug)', () => {
    const conOtroParam = 'https://wa.me/5492235169720?source=ads'
    const resultado = buildWaHref(conOtroParam, 'ig-post-3')
    expect(resultado).toBe(`${conOtroParam}&text=${encodeURIComponent('Hola! Ref: ig-post-3')}`)
    expect((resultado!.match(/\?/g) || []).length).toBe(1) // un solo "?", nunca dos
  })

  it('cta_url DROP7 con su propio "?text=..." → llega INTACTO, no se pisa ni se duplica', () => {
    const dropCtaUrl =
      'https://wa.me/5492235169720?text=Hola!%20Vengo%20por%20la%20edici%C3%B3n%20de%20Aldea%20%F0%9F%9A%80'
    const resultado = buildWaHref(dropCtaUrl, 'ig-post-3')
    expect(resultado).toBe(dropCtaUrl)
    expect((resultado!.match(/text=/g) || []).length).toBe(1) // un solo "text=", nunca dos
  })

  it('link que no es de wa.me → no se toca aunque haya utmRef', () => {
    expect(buildWaHref('https://otra-cosa.com/contacto', 'ig-post-3')).toBe('https://otra-cosa.com/contacto')
  })

  it('sin cta_url (null) → sigue null', () => {
    expect(buildWaHref(null, 'ig-post-3')).toBeNull()
  })
})
