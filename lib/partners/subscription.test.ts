import { describe, it, expect } from 'vitest'
import { resolvePriceUsd, resolveAnnualPriceUsd, GROWTH_PROMO_PCT, addMonths, promoExpired, GROWTH_PROMO, computeRenewalExpiration } from './subscription'

describe('GROWTH_PROMO config', () => {
  it('es 50% off del precio standard', () => {
    expect(GROWTH_PROMO.priceUsd).toBe(25)
    expect(GROWTH_PROMO.standardUsd).toBe(50)
    expect(GROWTH_PROMO.priceUsd * 2).toBe(GROWTH_PROMO.standardUsd)
  })
  it('cupo de 100 partners por 12 meses', () => {
    expect(GROWTH_PROMO.maxPartners).toBe(100)
    expect(GROWTH_PROMO.months).toBe(12)
  })
})

describe('resolvePriceUsd', () => {
  it('Growth con promo → US$25', () => {
    expect(resolvePriceUsd('growth', true)).toBe(25)
  })
  it('Growth sin promo → US$50', () => {
    expect(resolvePriceUsd('growth', false)).toBe(50)
  })
  it('Pro nunca tiene promo (siempre US$100)', () => {
    expect(resolvePriceUsd('pro', true)).toBe(100)
    expect(resolvePriceUsd('pro', false)).toBe(100)
  })
})

describe('GROWTH_PROMO_PCT', () => {
  it('es 50% (derivado de 25/50)', () => {
    expect(GROWTH_PROMO_PCT).toBe(0.5)
  })
})

describe('resolveAnnualPriceUsd', () => {
  it('Growth con promo → 50% del anual de lista ($510 → $255)', () => {
    expect(resolveAnnualPriceUsd('growth', true)).toBe(255)
  })
  it('Growth sin promo → anual de lista ($510)', () => {
    expect(resolveAnnualPriceUsd('growth', false)).toBe(510)
  })
  it('Pro nunca tiene promo anual (siempre $1020)', () => {
    expect(resolveAnnualPriceUsd('pro', true)).toBe(1020)
    expect(resolveAnnualPriceUsd('pro', false)).toBe(1020)
  })
})

describe('addMonths', () => {
  it('suma 1 mes', () => {
    expect(addMonths('2026-06-19T17:00:00.000Z', 1)).toBe('2026-07-19T17:00:00.000Z')
  })
  it('suma 12 meses (promo)', () => {
    expect(addMonths('2026-06-19T17:00:00.000Z', 12)).toBe('2027-06-19T17:00:00.000Z')
  })
})

describe('promoExpired', () => {
  const now = '2026-06-19T00:00:00.000Z'
  it('promo futura → no vencida', () => {
    expect(promoExpired({ price_usd: 25, expires_at: '2027-06-19T00:00:00.000Z' }, now)).toBe(false)
  })
  it('promo pasada → vencida', () => {
    expect(promoExpired({ price_usd: 25, expires_at: '2026-05-19T00:00:00.000Z' }, now)).toBe(true)
  })
  it('sin promo → no vencida', () => {
    expect(promoExpired(null, now)).toBe(false)
    expect(promoExpired(undefined, now)).toBe(false)
  })
})

// Hallazgo [19] del review: la renovación debe sumar el período desde el
// vencimiento VIGENTE cuando el pago llega a tiempo (no desde hoy, que le
// robaría días al partner), y desde HOY cuando la suscripción ya venció
// (pago atrasado, sin período muerto retroactivo).
describe('computeRenewalExpiration', () => {
  it('pago a tiempo (suscripción todavía activa): extiende desde el vencimiento vigente, no desde hoy', () => {
    // Vence 2027-04-01, paga anticipado el 2027-03-01 (mismo caso del hallazgo).
    const currentExpiresAt = '2027-04-01T00:00:00.000Z'
    const paymentNow = '2027-03-01T00:00:00.000Z'
    const result = computeRenewalExpiration(currentExpiresAt, paymentNow, 12)
    expect(result).toBe('2028-04-01T00:00:00.000Z') // +12 meses desde el vencimiento vigente, no 2028-03-01
  })

  it('pago mensual a tiempo: suma 1 mes desde el vencimiento vigente', () => {
    const currentExpiresAt = '2026-08-10T12:00:00.000Z'
    const paymentNow = '2026-08-05T12:00:00.000Z' // paga 5 días antes de vencer
    const result = computeRenewalExpiration(currentExpiresAt, paymentNow, 1)
    expect(result).toBe('2026-09-10T12:00:00.000Z')
  })

  it('pago atrasado (suscripción ya vencida): arranca desde la fecha del pago (hoy)', () => {
    const currentExpiresAt = '2026-06-01T00:00:00.000Z' // ya venció
    const paymentNow = '2026-06-15T00:00:00.000Z' // paga 2 semanas tarde
    const result = computeRenewalExpiration(currentExpiresAt, paymentNow, 1)
    expect(result).toBe('2026-07-15T00:00:00.000Z') // desde hoy, no desde el vencimiento pasado
  })

  it('sin vencimiento previo (alta nueva): arranca desde hoy', () => {
    const result = computeRenewalExpiration(null, '2026-07-03T12:00:00.000Z', 1)
    expect(result).toBe('2026-08-03T12:00:00.000Z')
  })

  it('vencimiento exactamente igual a ahora: se trata como ya vencido, arranca desde hoy', () => {
    const now = '2026-07-03T12:00:00.000Z'
    const result = computeRenewalExpiration(now, now, 1)
    expect(result).toBe('2026-08-03T12:00:00.000Z')
  })
})
