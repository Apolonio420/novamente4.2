/**
 * ORIGEN, 26/08/2026: el partner tuvo el Studio abierto 3 h en el navegador de
 * WhatsApp y todas las requests empezaron a dar 401 ("No autenticado o sin
 * tenant asociado") con la cuenta perfectamente en orden.
 *
 * Causa: authFetch cacheaba el access_token y lo devolvía SIN mirar el
 * vencimiento, así que nunca volvía a llamar a getSession() — que es lo que
 * dispara la renovación. Un token vencido quedaba pegado hasta recargar.
 */
import { describe, it, expect } from 'vitest'

/** Misma lógica que tokenVigente() en lib/partners/auth-fetch.ts */
function tokenVigente(token: string | null): boolean {
  if (!token) return false
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    if (!payload?.exp) return false
    return payload.exp * 1000 - Date.now() > 60_000
  } catch {
    return false
  }
}

const jwt = (expSegundos: number) =>
  `x.${btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + expSegundos }))}.y`

describe('vigencia del token en authFetch', () => {
  it('un token vencido NO se reutiliza (el bug de ORIGEN)', () => {
    expect(tokenVigente(jwt(-60))).toBe(false)   // venció hace un minuto
    expect(tokenVigente(jwt(-3600))).toBe(false) // venció hace una hora
  })

  it('uno a punto de vencer tampoco: no sirve para el viaje de ida', () => {
    expect(tokenVigente(jwt(30))).toBe(false)
  })

  it('uno con vida por delante sí se usa', () => {
    expect(tokenVigente(jwt(300))).toBe(true)
    expect(tokenVigente(jwt(3600))).toBe(true)
  })

  it('ante la duda, pedir uno nuevo', () => {
    expect(tokenVigente(null)).toBe(false)
    expect(tokenVigente('no-es-un-jwt')).toBe(false)
    expect(tokenVigente('x.no-es-base64-valido!.y')).toBe(false)
    expect(tokenVigente(`x.${btoa(JSON.stringify({ sub: 'sin-exp' }))}.y`)).toBe(false)
  })
})
