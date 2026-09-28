import { describe, it, expect } from 'vitest'
import { payoutModeDe } from './payout-mode'

describe('payoutModeDe', () => {
  it("metadata.payout_mode === 'credit' → 'credit'", () => {
    expect(payoutModeDe({ payout_mode: 'credit' })).toBe('credit')
  })

  it("metadata.payout_mode === 'cash' → 'cash'", () => {
    expect(payoutModeDe({ payout_mode: 'cash' })).toBe('cash')
  })

  it('metadata null → cash (default)', () => {
    expect(payoutModeDe(null)).toBe('cash')
  })

  it('metadata undefined → cash (default)', () => {
    expect(payoutModeDe(undefined)).toBe('cash')
  })

  it('metadata sin la clave payout_mode → cash', () => {
    expect(payoutModeDe({})).toBe('cash')
    expect(payoutModeDe({ other_key: 'x' })).toBe('cash')
  })

  it('cualquier otro valor de payout_mode (typo, mayúsculas, no-string) → cash', () => {
    expect(payoutModeDe({ payout_mode: 'Credit' })).toBe('cash')
    expect(payoutModeDe({ payout_mode: 'credito' })).toBe('cash')
    expect(payoutModeDe({ payout_mode: 1 })).toBe('cash')
    expect(payoutModeDe({ payout_mode: true })).toBe('cash')
    expect(payoutModeDe({ payout_mode: null })).toBe('cash')
  })
})
