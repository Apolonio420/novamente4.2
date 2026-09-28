import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock de supabase: .from().select().eq()...contains().limit() y .eq() final son
// thenables que devuelven lo que el test encola; insert().select().single() idem.
const h = vi.hoisted(() => {
  const state = {
    previo: [] as any[],
    previoPedido: [] as any[],
    entries: [] as any[],
    inserts: [] as any[],
    insertError: null as any,
  }
  const makeQuery = (table: string) => {
    let contains: any = null
    const q: any = {
      select: () => q,
      eq: () => q,
      contains: (_col: string, val: any) => {
        contains = val
        return q
      },
      limit: () => q,
      insert: (row: any) => {
        state.inserts.push({ table, row })
        state.entries.push({ type: row.type, amount: row.amount, status: row.status })
        return {
          select: () => ({
            single: () => Promise.resolve(state.insertError ? { data: null, error: state.insertError } : { data: { id: 'new-entry' }, error: null }),
          }),
        }
      },
      then: (resolve: any) =>
        resolve(
          contains?.idempotency_key
            ? { data: state.previo, error: null }
            : contains?.order_id
              ? { data: state.previoPedido, error: null }
              : { data: state.entries, error: null },
        ),
    }
    return q
  }
  return { state, client: { from: (t: string) => makeQuery(t) } }
})

vi.mock('@/lib/supabase-admin', () => ({ supabaseAdmin: h.client }))

import { validarAjuste, claveAjuste, asientoAjuste, aplicarAjuste, MAX_AJUSTE_ARS } from './ledger-adjust'

const base = {
  tenantId: 'b3de2939-3e5f-4c5b-b1f2-b1cbdeeb9a3b',
  amount: 3500,
  motivo: 'Bonificación doble estampa primer pedido',
  autorizadoPor: 'juan (vía Claude)',
  orderId: '165791fe-c341-4523-bffa-f2726b25ea2a',
  orderNumber: 'NOV-20260926-9852',
}

beforeEach(() => {
  h.state.previo = []
  h.state.previoPedido = []
  h.state.entries = [{ type: 'credit', amount: 16800, status: 'confirmed' }]
  h.state.inserts = []
  h.state.insertError = null
})

describe('validarAjuste', () => {
  it('acepta un ajuste válido', () => {
    expect(validarAjuste(base)).toEqual({ ok: true })
  })
  it('rechaza monto 0, no entero o sobre el tope', () => {
    expect(validarAjuste({ ...base, amount: 0 }).ok).toBe(false)
    expect(validarAjuste({ ...base, amount: 10.5 }).ok).toBe(false)
    expect(validarAjuste({ ...base, amount: MAX_AJUSTE_ARS + 1 }).ok).toBe(false)
    expect(validarAjuste({ ...base, amount: -(MAX_AJUSTE_ARS + 1) }).ok).toBe(false)
  })
  it('exige motivo (≥10 caracteres) y quién autoriza', () => {
    expect(validarAjuste({ ...base, motivo: 'corto' }).ok).toBe(false)
    expect(validarAjuste({ ...base, autorizadoPor: '  ' }).ok).toBe(false)
  })
})

describe('claveAjuste / asientoAjuste', () => {
  it('la clave es estable y cambia si cambia el monto o el motivo', () => {
    expect(claveAjuste(base)).toBe(claveAjuste({ ...base }))
    expect(claveAjuste(base)).toBe(claveAjuste({ ...base, motivo: `  ${base.motivo.toUpperCase()} ` }))
    expect(claveAjuste(base)).not.toBe(claveAjuste({ ...base, amount: 3000 }))
    expect(claveAjuste(base)).not.toBe(claveAjuste({ ...base, motivo: 'Otro motivo distinto' }))
  })
  it('monto positivo = credit; negativo = debit con monto absoluto; order_id solo en metadata', () => {
    const c = asientoAjuste(base)
    expect(c).toMatchObject({ type: 'credit', amount: 3500, source: 'adjustment', status: 'confirmed', order_id: null })
    expect(c.metadata).toMatchObject({ order_id: base.orderId, order_number: base.orderNumber, autorizado_por: 'juan (vía Claude)' })
    expect(c.concept).toContain('NOV-20260926-9852')
    const d = asientoAjuste({ ...base, amount: -2000 })
    expect(d).toMatchObject({ type: 'debit', amount: 2000 })
  })
})

describe('aplicarAjuste', () => {
  it('dry-run: no inserta y muestra el saldo después', async () => {
    const r = await aplicarAjuste(base, { execute: false })
    expect(r).toMatchObject({ ok: true, dryRun: true, saldoAntes: 16800, saldoDespues: 20300 })
    expect(h.state.inserts).toHaveLength(0)
  })
  it('execute: inserta un asiento y el saldo queda en 20.300', async () => {
    const r = await aplicarAjuste(base, { execute: true })
    expect(r).toMatchObject({ ok: true, dryRun: false, entryId: 'new-entry', saldoAntes: 16800, saldoDespues: 20300 })
    expect(h.state.inserts).toHaveLength(1)
    expect(h.state.inserts[0].table).toBe('partner_ledger_entries')
  })
  it('idempotente: si ya existe el mismo ajuste no inserta', async () => {
    h.state.previo = [{ id: 'existente' }]
    const r = await aplicarAjuste(base, { execute: true })
    expect(r).toMatchObject({ ok: true, yaExistia: true, entryId: 'existente' })
    expect(h.state.inserts).toHaveLength(0)
  })
  it('reconoce un ajuste cargado a mano (sin clave) del mismo pedido, mismo sentido y monto', async () => {
    h.state.previoPedido = [{ id: 'manual-sql', type: 'credit', amount: 3500 }]
    const r = await aplicarAjuste({ ...base, motivo: 'Otro texto de motivo para el mismo ajuste' }, { execute: true })
    expect(r).toMatchObject({ ok: true, yaExistia: true, entryId: 'manual-sql' })
    expect(h.state.inserts).toHaveLength(0)
  })
  it('un ajuste del mismo pedido pero de OTRO monto no bloquea', async () => {
    h.state.previoPedido = [{ id: 'otro', type: 'credit', amount: 1000 }]
    const r = await aplicarAjuste(base, { execute: true })
    expect(r).toMatchObject({ ok: true, entryId: 'new-entry' })
    expect(h.state.inserts).toHaveLength(1)
  })
  it('inválido: no toca la DB', async () => {
    const r = await aplicarAjuste({ ...base, amount: 0 }, { execute: true })
    expect(r.ok).toBe(false)
    expect(h.state.inserts).toHaveLength(0)
  })
  it('error de insert se devuelve, no se lanza', async () => {
    h.state.insertError = { message: 'boom' }
    const r = await aplicarAjuste(base, { execute: true })
    expect(r).toMatchObject({ ok: false, error: 'boom' })
  })
})
