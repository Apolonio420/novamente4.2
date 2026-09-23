// Auditoría 22/09/2026: lcitea (×6) y al-fa (×1) cargaron el precio "en
// miles" (40, 60, 36,2) y el checkout los hubiese cobrado tal cual —
// validateProductForPublish (variants.ts) solo corre al publicar/editar, no
// al cargar. Este archivo cubre el piso que ahora corre en el ALTA (POST),
// la EDICIÓN (PUT) y el IMPORT CSV — ver app/api/partners/catalog/route.ts,
// catalog/[id]/route.ts y catalog/import/route.ts.
import { describe, it, expect } from 'vitest'
import { validatePartnerProductPrice, MIN_PARTNER_PRODUCT_PRICE_ARS } from './product-policy'

describe('validatePartnerProductPrice', () => {
  it('rechaza un precio "cargado en miles" (40)', () => {
    const r = validatePartnerProductPrice(40)
    expect(r.ok).toBe(false)
    expect(r.reason).toMatch(/miles/)
  })

  it('rechaza 60', () => {
    expect(validatePartnerProductPrice(60).ok).toBe(false)
  })

  it('acepta un precio normal (55000)', () => {
    expect(validatePartnerProductPrice(55000)).toEqual({ ok: true })
  })

  it('acepta justo el piso ($1.000)', () => {
    expect(validatePartnerProductPrice(MIN_PARTNER_PRODUCT_PRICE_ARS)).toEqual({ ok: true })
  })

  it('rechaza justo debajo del piso ($999)', () => {
    expect(validatePartnerProductPrice(999).ok).toBe(false)
  })

  it('acepta null/undefined/"" (producto sin precio todavía, borrador)', () => {
    expect(validatePartnerProductPrice(null)).toEqual({ ok: true })
    expect(validatePartnerProductPrice(undefined)).toEqual({ ok: true })
    expect(validatePartnerProductPrice('')).toEqual({ ok: true })
  })

  it('acepta precio como string numérico (viene de un input HTML o de una fila CSV)', () => {
    expect(validatePartnerProductPrice('55000')).toEqual({ ok: true })
    expect(validatePartnerProductPrice('40').ok).toBe(false)
  })

  it('rechaza un precio que no es un número', () => {
    expect(validatePartnerProductPrice('abc').ok).toBe(false)
  })

  it('no bloquea 0 (no es el patrón "en miles")', () => {
    expect(validatePartnerProductPrice(0)).toEqual({ ok: true })
  })
})
