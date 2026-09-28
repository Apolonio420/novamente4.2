import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock de supabase: .from().select().eq()...contains().limit() y .eq() final son
// thenables que devuelven lo que el test encola; insert().select().single() idem.
// .rpc() (usado por usarSaldo → partner_admin_apply_credit) se mockea aparte.
const h = vi.hoisted(() => {
  const state = {
    previo: [] as any[],
    previoPedido: [] as any[],
    entries: [] as any[],
    inserts: [] as any[],
    insertError: null as any,
    rpcCalls: [] as Array<{ name: string; params: any }>,
    rpcResult: { data: { ok: true, entry_id: 'credit-entry', idempotent: false }, error: null } as { data: any; error: any },
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
  const client = {
    from: (t: string) => makeQuery(t),
    rpc: (name: string, params: any) => {
      state.rpcCalls.push({ name, params })
      return Promise.resolve(state.rpcResult)
    },
  }
  return { state, client }
})

vi.mock('@/lib/supabase-admin', () => ({ supabaseAdmin: h.client }))

import { validarAjuste, claveAjuste, asientoAjuste, aplicarAjuste, MAX_AJUSTE_ARS, usarSaldo, claveUsoSaldo } from './ledger-adjust'

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
  h.state.rpcCalls = []
  h.state.rpcResult = { data: { ok: true, entry_id: 'credit-entry', idempotent: false }, error: null }
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
  it('el concepto es SOLO el motivo + " — pedido X" (sin prefijo "Bonificación:")', () => {
    const c = asientoAjuste({ ...base, motivo: 'Ajuste manual por error de cálculo' })
    expect(c.concept).toBe('Ajuste manual por error de cálculo — pedido NOV-20260926-9852')
    expect(c.concept.startsWith('Bonificación:')).toBe(false)
  })
  it('sin orderNumber, el concepto es solo el motivo (sin " — pedido")', () => {
    const c = asientoAjuste({ ...base, orderNumber: undefined })
    expect(c.concept).toBe(base.motivo)
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

const usoBase = {
  tenantId: 'b3de2939-3e5f-4c5b-b1f2-b1cbdeeb9a3b',
  amount: 5000,
  referencia: 'NOV-20260928-0001',
  autorizadoPor: 'juan (vía Claude)',
  nota: 'usado en pedido propio',
}

describe('claveUsoSaldo', () => {
  it('empieza con "use:" y es estable', () => {
    expect(claveUsoSaldo(usoBase)).toMatch(/^use:/)
    expect(claveUsoSaldo(usoBase)).toBe(claveUsoSaldo({ ...usoBase }))
  })
  it('cambia si cambia el monto o la referencia', () => {
    expect(claveUsoSaldo(usoBase)).not.toBe(claveUsoSaldo({ ...usoBase, amount: 1000 }))
    expect(claveUsoSaldo(usoBase)).not.toBe(claveUsoSaldo({ ...usoBase, referencia: 'NOV-otro' }))
  })
})

describe('usarSaldo — validaciones (no tocan la DB)', () => {
  it('falta tenantId', async () => {
    const r = await usarSaldo({ ...usoBase, tenantId: '' }, { execute: true })
    expect(r).toMatchObject({ ok: false })
    expect(h.state.rpcCalls).toHaveLength(0)
  })
  it('monto no entero o <= 0', async () => {
    expect((await usarSaldo({ ...usoBase, amount: 0 }, { execute: true })).ok).toBe(false)
    expect((await usarSaldo({ ...usoBase, amount: -100 }, { execute: true })).ok).toBe(false)
    expect((await usarSaldo({ ...usoBase, amount: 10.5 }, { execute: true })).ok).toBe(false)
    expect(h.state.rpcCalls).toHaveLength(0)
  })
  it('falta la referencia', async () => {
    const r = await usarSaldo({ ...usoBase, referencia: '  ' }, { execute: true })
    expect(r.ok).toBe(false)
    expect(h.state.rpcCalls).toHaveLength(0)
  })
  it('falta quién autorizó', async () => {
    const r = await usarSaldo({ ...usoBase, autorizadoPor: '' }, { execute: true })
    expect(r.ok).toBe(false)
    expect(h.state.rpcCalls).toHaveLength(0)
  })
})

describe('usarSaldo — saldo insuficiente', () => {
  it('monto > saldo disponible → error, no llama al rpc', async () => {
    h.state.entries = [{ type: 'credit', amount: 3000, status: 'confirmed' }]
    const r = await usarSaldo({ ...usoBase, amount: 5000 }, { execute: true })
    expect(r.ok).toBe(false)
    expect(r.saldoAntes).toBe(3000)
    expect(r.error).toContain('3.000')
    expect(r.error).toContain('5.000')
    expect(h.state.rpcCalls).toHaveLength(0)
  })
})

describe('usarSaldo — dry-run', () => {
  it('no llama al rpc y devuelve saldoDespues = saldoAntes - monto', async () => {
    const r = await usarSaldo(usoBase, { execute: false })
    expect(r).toMatchObject({ ok: true, dryRun: true, saldoAntes: 16800, saldoDespues: 11800 })
    expect(h.state.rpcCalls).toHaveLength(0)
  })
})

describe('usarSaldo — execute', () => {
  it('llama al rpc partner_admin_apply_credit con los params exactos y clave que empieza con "use:"', async () => {
    const r = await usarSaldo(usoBase, { execute: true })
    expect(r).toMatchObject({ ok: true, dryRun: false, entryId: 'credit-entry', saldoAntes: 16800 })
    expect(h.state.rpcCalls).toHaveLength(1)
    const call = h.state.rpcCalls[0]
    expect(call.name).toBe('partner_admin_apply_credit')
    expect(call.params).toMatchObject({
      p_tenant_id: usoBase.tenantId,
      p_amount: usoBase.amount,
      p_reference: usoBase.referencia,
      p_admin_email: usoBase.autorizadoPor,
      p_notes: usoBase.nota,
    })
    expect(call.params.p_idempotency_key).toMatch(/^use:/)
    expect(call.params.p_idempotency_key).toBe(claveUsoSaldo(usoBase))
  })
  it('recorta espacios de referencia y autorizadoPor antes de mandarlos al rpc', async () => {
    await usarSaldo({ ...usoBase, referencia: `  ${usoBase.referencia}  `, autorizadoPor: `  ${usoBase.autorizadoPor}  ` }, { execute: true })
    const call = h.state.rpcCalls[0]
    expect(call.params.p_reference).toBe(usoBase.referencia)
    expect(call.params.p_admin_email).toBe(usoBase.autorizadoPor)
  })
  it('idempotente: el rpc devuelve idempotent:true → yaExistia', async () => {
    h.state.rpcResult = { data: { ok: true, entry_id: 'ya-existente', idempotent: true }, error: null }
    const r = await usarSaldo(usoBase, { execute: true })
    expect(r).toMatchObject({ ok: true, yaExistia: true, entryId: 'ya-existente' })
  })
  it('error de saldo insuficiente devuelto por el rpc (carrera con otro uso)', async () => {
    h.state.rpcResult = { data: { ok: false, error: 'insufficient_funds', available: 1200 }, error: null }
    const r = await usarSaldo(usoBase, { execute: true })
    expect(r.ok).toBe(false)
    expect(r.error).toContain('Saldo insuficiente')
    expect(r.error).toContain('1200')
  })
  it('otro error del rpc se devuelve tal cual, no se lanza', async () => {
    h.state.rpcResult = { data: { ok: false, error: 'tenant_not_found' }, error: null }
    const r = await usarSaldo(usoBase, { execute: true })
    expect(r).toMatchObject({ ok: false, error: 'tenant_not_found' })
  })
  it('error de transporte del rpc (network/db) se devuelve, no se lanza', async () => {
    h.state.rpcResult = { data: null, error: { message: 'connection reset' } }
    const r = await usarSaldo(usoBase, { execute: true })
    expect(r).toMatchObject({ ok: false, error: 'connection reset', saldoAntes: 16800 })
  })
})
