import { describe, it, expect } from 'vitest'
import { resolvePriceUsd, addMonths, promoExpired, GROWTH_PROMO } from './subscription'

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
