import { describe, it, expect } from 'vitest'
import { oldestUnpaidCredit, buildWeeklyPayoutMessage, esLunesArgentina, type PartnerBalance } from './payout-reminder'
import { payoutModeDe } from './payout-mode'

// Las tres funciones son puras (no tocan supabase) — no hace falta mockear nada.

describe('oldestUnpaidCredit — FIFO', () => {
  it('un crédito viejo ya cubierto por débitos no cuenta; devuelve el crédito más viejo AÚN impago', () => {
    const entries = [
      { tenant_id: 't1', type: 'credit' as const, amount: 10000, status: 'confirmed', created_at: '2026-01-01T00:00:00Z' },
      { tenant_id: 't1', type: 'credit' as const, amount: 5000, status: 'confirmed', created_at: '2026-01-02T00:00:00Z' },
      { tenant_id: 't1', type: 'debit' as const, amount: 12000, status: 'confirmed', created_at: '2026-01-03T00:00:00Z' },
    ]
    expect(oldestUnpaidCredit(entries)).toBe('2026-01-02T00:00:00Z')
  })

  it('sin créditos pendientes de cubrir → null', () => {
    const entries = [
      { tenant_id: 't1', type: 'credit' as const, amount: 10000, status: 'confirmed', created_at: '2026-01-01T00:00:00Z' },
      { tenant_id: 't1', type: 'debit' as const, amount: 10000, status: 'confirmed', created_at: '2026-01-02T00:00:00Z' },
    ]
    expect(oldestUnpaidCredit(entries)).toBeNull()
  })

  it('los créditos needs_review no cuentan para el FIFO', () => {
    const entries = [
      { tenant_id: 't1', type: 'credit' as const, amount: 10000, status: 'needs_review', created_at: '2026-01-01T00:00:00Z' },
      { tenant_id: 't1', type: 'credit' as const, amount: 5000, status: 'confirmed', created_at: '2026-01-02T00:00:00Z' },
    ]
    expect(oldestUnpaidCredit(entries)).toBe('2026-01-02T00:00:00Z')
  })
})

function balance(overrides: Partial<PartnerBalance> = {}): PartnerBalance {
  return {
    tenantId: 'tenant-1',
    slug: 'sponsors',
    name: 'Sponsors',
    bankAlias: 'sponsors.mp',
    bankCbu: null,
    payoutMode: 'cash',
    available: 0,
    pendingReview: 0,
    paid: 0,
    oldestUnpaidAt: null,
    ...overrides,
  }
}

describe('buildWeeklyPayoutMessage', () => {
  it('null si no hay nada para pagar ni revisar', () => {
    expect(buildWeeklyPayoutMessage([balance({ available: 0, pendingReview: 0 })])).toBeNull()
    expect(buildWeeklyPayoutMessage([])).toBeNull()
  })

  it('el total es la suma de lo disponible (no incluye needs_review ni negativos)', () => {
    const balances = [
      balance({ tenantId: 't1', slug: 'a', available: 10000 }),
      balance({ tenantId: 't2', slug: 'b', available: 20000 }),
    ]
    const msg = buildWeeklyPayoutMessage(balances)!
    expect(msg).toContain('$30.000')
  })

  it('sin alias ni CBU → aviso "⚠️ SIN alias/CBU"', () => {
    const msg = buildWeeklyPayoutMessage([balance({ available: 5000, bankAlias: null, bankCbu: null })])!
    expect(msg).toContain('⚠️ SIN alias/CBU')
  })

  it('con alias → lo muestra en vez del aviso de "sin datos"', () => {
    const msg = buildWeeklyPayoutMessage([balance({ available: 5000, bankAlias: 'mi.alias' })])!
    expect(msg).toContain('mi.alias')
    expect(msg).not.toContain('SIN alias/CBU')
  })

  it('impago hace más de 7 días → aviso de mora', () => {
    const now = new Date('2026-09-28T12:00:00Z')
    const oldestUnpaidAt = new Date(now.getTime() - 10 * 86_400_000).toISOString() // 10 días
    const msg = buildWeeklyPayoutMessage([balance({ available: 5000, oldestUnpaidAt })], now)!
    expect(msg).toContain('impago hace 10 días')
  })

  it('impago hace menos de 7 días → sin aviso de mora', () => {
    const now = new Date('2026-09-28T12:00:00Z')
    const oldestUnpaidAt = new Date(now.getTime() - 2 * 86_400_000).toISOString()
    const msg = buildWeeklyPayoutMessage([balance({ available: 5000, oldestUnpaidAt })], now)!
    expect(msg).not.toContain('impago hace')
  })

  it('incluye la sección de "en revisión" cuando hay pendingReview aunque no haya nada disponible', () => {
    const msg = buildWeeklyPayoutMessage([balance({ available: 0, pendingReview: 3000 })])!
    expect(msg).toContain('En revisión')
    expect(msg).toContain('$3.000')
  })
})

describe('buildWeeklyPayoutMessage — partners a crédito', () => {
  it('no suma a crédito al total a transferir y los lista aparte como NO transferir', () => {
    const msg = buildWeeklyPayoutMessage([
      balance({ tenantId: 'a', slug: 'cash-partner', available: 10000 }),
      balance({ tenantId: 'b', slug: 'sponsors', available: 23300, payoutMode: 'credit' }),
    ])!
    expect(msg).toContain('total $10.000')
    expect(msg).toContain('cash-partner')
    expect(msg).toMatch(/A crédito \(NO transferir[^)]*\): sponsors \$23\.300/)
    expect(msg).not.toMatch(/• <b>sponsors<\/b>/)
  })
  it('si solo hay saldos a crédito (nada para transferir ni revisar) no manda mensaje', () => {
    expect(buildWeeklyPayoutMessage([balance({ available: 23300, payoutMode: 'credit' })])).toBeNull()
  })

  // getPartnerBalances deriva payoutMode con payoutModeDe(tenant.metadata) — un
  // tenant sin metadata (o sin la clave payout_mode) tiene que caer a 'cash' y
  // sumar al total a transferir, no a la lista "A crédito".
  it('tenant con metadata sin payout_mode (o sin metadata) → payoutMode cash, suma al total a transferir', () => {
    const payoutModeSinMetadata = payoutModeDe(undefined)
    expect(payoutModeSinMetadata).toBe('cash')
    const msg = buildWeeklyPayoutMessage([
      balance({ tenantId: 'sin-metadata', slug: 'sin-metadata-partner', available: 7000, payoutMode: payoutModeSinMetadata }),
    ])!
    expect(msg).toContain('total $7.000')
    expect(msg).toContain('sin-metadata-partner')
    expect(msg).not.toContain('A crédito')
  })
})

describe('esLunesArgentina', () => {
  it('2026-09-28T02:00Z es domingo en Argentina (UTC-3) → false', () => {
    expect(esLunesArgentina(new Date('2026-09-28T02:00:00Z'))).toBe(false)
  })

  it('2026-09-28T12:00Z es lunes en Argentina (UTC-3) → true', () => {
    expect(esLunesArgentina(new Date('2026-09-28T12:00:00Z'))).toBe(true)
  })
})
