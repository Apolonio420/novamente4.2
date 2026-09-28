import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/partners/finanzas — saldo + ventas + payoutMode + creditUsed.
// POST /api/partners/finanzas — desactivado (410).

const h = vi.hoisted(() => {
  const state = {
    entries: [] as any[],
    payouts: [] as any[],
  }
  function chainFor(table: string) {
    const chain: any = {
      select: () => chain,
      eq: () => chain,
      order: () => chain,
      limit: () => chain,
      then: (resolve: any) => {
        if (table === 'partner_ledger_entries') return resolve({ data: state.entries, error: null })
        if (table === 'partner_payouts') return resolve({ data: state.payouts, error: null })
        return resolve({ data: [], error: null })
      },
    }
    return chain
  }
  return { state, client: { from: (t: string) => chainFor(t) } }
})

vi.mock('@/lib/supabase-admin', () => ({ supabaseAdmin: h.client }))
vi.mock('@/lib/partners/permissions', () => ({ requireTenantPermission: vi.fn() }))

import { requireTenantPermission } from '@/lib/partners/permissions'
import { GET, POST } from './route'

const requirePermission = requireTenantPermission as ReturnType<typeof vi.fn>

const TENANT = {
  id: 'tenant-a',
  slug: 'sponsors',
  name: 'Sponsors',
  bank_alias: null,
  bank_cbu: null,
  metadata: { payout_mode: 'credit' },
}

function getReq() {
  return new NextRequest('http://localhost/api/partners/finanzas', { method: 'GET' })
}
function postReq() {
  return new NextRequest('http://localhost/api/partners/finanzas', { method: 'POST' })
}

beforeEach(() => {
  vi.clearAllMocks()
  h.state.entries = []
  h.state.payouts = []
  requirePermission.mockResolvedValue({ ok: true, tenant: TENANT })
})

describe('GET /api/partners/finanzas', () => {
  it('propaga el fallo de auth (401/403) sin tocar supabase', async () => {
    requirePermission.mockResolvedValue({ ok: false, response: NextResponse.json({ error: 'nope' }, { status: 401 }) })
    const res = await GET(getReq())
    expect(res.status).toBe(401)
  })

  it("payoutMode 'credit' desde tenant.metadata.payout_mode; creditUsed = suma de débitos credit_applied", async () => {
    h.state.entries = [
      {
        id: 'e1',
        type: 'credit',
        amount: 16800,
        concept: 'Venta web',
        status: 'confirmed',
        source: 'web_order',
        order_id: 'order-1',
        metadata: { order_number: 'NOV-1', breakdown: [] },
        created_at: '2026-01-01T00:00:00Z',
      },
      {
        id: 'e2',
        type: 'debit',
        amount: 5000,
        concept: 'Usado en pedido propio',
        status: 'confirmed',
        source: 'credit_applied',
        order_id: null,
        metadata: { motivo: 'x' },
        created_at: '2026-01-02T00:00:00Z',
      },
      {
        id: 'e3',
        type: 'debit',
        amount: 2000,
        concept: 'Usado en pedido propio 2',
        status: 'confirmed',
        source: 'credit_applied',
        order_id: null,
        metadata: null,
        created_at: '2026-01-03T00:00:00Z',
      },
    ]

    const res = await GET(getReq())
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.payoutMode).toBe('credit')
    expect(json.creditUsed).toBe(7000)
  })

  it("tenant sin metadata (o sin payout_mode) → payoutMode 'cash'", async () => {
    requirePermission.mockResolvedValue({ ok: true, tenant: { ...TENANT, metadata: {} } })
    const res = await GET(getReq())
    const json = await res.json()
    expect(json.payoutMode).toBe('cash')
  })

  it("entries de la respuesta NO incluyen 'metadata' (movimientos partner-safe)", async () => {
    h.state.entries = [
      {
        id: 'e1',
        type: 'credit',
        amount: 1000,
        concept: 'Venta web',
        status: 'confirmed',
        source: 'web_order',
        order_id: 'order-1',
        metadata: { order_number: 'NOV-1', breakdown: [], internal_note: 'no debería salir' },
        created_at: '2026-01-01T00:00:00Z',
      },
    ]
    const res = await GET(getReq())
    const json = await res.json()
    expect(json.entries).toHaveLength(1)
    expect(json.entries[0]).not.toHaveProperty('metadata')
    expect(json.entries[0]).toMatchObject({ id: 'e1', type: 'credit', amount: 1000, concept: 'Venta web', status: 'confirmed', source: 'web_order' })
  })

  it('sales: arma las ventas web (whitelist) a partir de las entries del tenant', async () => {
    h.state.entries = [
      {
        id: 'e1',
        type: 'credit',
        amount: 16800,
        concept: 'Venta web',
        status: 'confirmed',
        source: 'web_order',
        order_id: 'order-1',
        metadata: {
          order_number: 'NOV-1',
          breakdown: [{ item: 'Remera', qty: 1, unit: 16800, cost: 10000, descuento: 0, ganancia: 6800 }],
        },
        created_at: '2026-01-01T00:00:00Z',
      },
    ]
    const res = await GET(getReq())
    const json = await res.json()
    expect(json.sales).toHaveLength(1)
    expect(json.sales[0]).toMatchObject({ id: 'e1', orderNumber: 'NOV-1', ganancia: 16800, estado: 'a_cobrar' })
    expect(json.sales[0].lineas[0]).toMatchObject({ item: 'Remera', qty: 1, unit: 16800 })
  })
})

describe('POST /api/partners/finanzas — desactivado', () => {
  it('siempre 410, aunque el auth sea válido', async () => {
    const res = await POST(postReq())
    expect(res.status).toBe(410)
    const json = await res.json()
    expect(json.error).toContain('transfiere')
  })

  it('propaga el fallo de auth antes del 410', async () => {
    requirePermission.mockResolvedValue({ ok: false, response: NextResponse.json({ error: 'nope' }, { status: 403 }) })
    const res = await POST(postReq())
    expect(res.status).toBe(403)
  })
})
