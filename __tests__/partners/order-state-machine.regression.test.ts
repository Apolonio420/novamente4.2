/**
 * REGRESIÓN — hallazgos del cross-review de Opus sobre la máquina de estados de
 * pedidos en codex/partner-daily-ops.
 *
 * Estos tests están escritos para FALLAR en el código actual y pasar una vez
 * corregidos (red → green). Cubren:
 *   P1 #1 — fulfillment 'exception' deja el status legacy desincronizado
 *   P1 #2 — el reverse-map puede empujar el pedido hacia atrás (shipped/delivered → producing)
 *   P2 #3 — el campo legacy 'status' del PUT no se valida (enum inválido → 500; salto ilegal → 200)
 *
 * NOTA DE REBASE: este archivo mockea '@/lib/partners/auth' (getRequestTenant),
 * que es lo que usa la rama hoy. Tras rebasar sobre opus/partner-foundation, la
 * ruta usará requireTenantPermission de '@/lib/partners/permissions'; actualizar
 * el mock como en __tests__/partners/catalog-update-policy.test.ts.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/partners/auth', () => ({ getRequestTenant: vi.fn() }))
vi.mock('@/lib/partners/orders', () => ({
  getOrderById: vi.fn(),
  updateOrder: vi.fn(),
  createOrderEvent: vi.fn().mockResolvedValue(null),
  getOrderEvents: vi.fn().mockResolvedValue([]),
}))

import { PUT } from '@/app/api/partners/orders/[id]/route'
import { getRequestTenant } from '@/lib/partners/auth'
import { getOrderById, updateOrder } from '@/lib/partners/orders'

const TENANT = 't1'
const m = {
  auth: getRequestTenant as unknown as ReturnType<typeof vi.fn>,
  getById: getOrderById as unknown as ReturnType<typeof vi.fn>,
  update: updateOrder as unknown as ReturnType<typeof vi.fn>,
}
const req = (body: any): any => ({ json: async () => body })
const params = (id = 'o1') => Promise.resolve({ id })
const lastUpdates = (): any => {
  const c = m.update.mock.calls
  return c.length ? c[c.length - 1][2] : null
}

beforeEach(() => {
  vi.clearAllMocks()
  m.auth.mockResolvedValue({ tenant: { id: TENANT }, userId: 'u1' })
  m.update.mockImplementation(async (_t: string, _id: string, u: any) => ({ id: 'o1', tenant_id: TENANT, ...u }))
})

describe('P1 #2 — el status legacy nunca debe retroceder por edición de fulfillment', () => {
  it('shipped + quality_check NO debe volver a producing', async () => {
    m.getById.mockResolvedValue({ id: 'o1', tenant_id: TENANT, status: 'shipped', fulfillment_status: 'shipped' })
    await PUT(req({ fulfillment_status: 'quality_check' }), { params: params() })
    expect(lastUpdates()?.status).not.toBe('producing') // RED hoy: escribe 'producing'
  })
  it('delivered + ready_to_ship NO debe volver a producing', async () => {
    m.getById.mockResolvedValue({ id: 'o1', tenant_id: TENANT, status: 'delivered', fulfillment_status: 'delivered' })
    await PUT(req({ fulfillment_status: 'ready_to_ship' }), { params: params() })
    expect(lastUpdates()?.status).not.toBe('producing') // RED hoy
  })
})

describe('P1 #1 — un pedido en fulfillment=exception no debe quedar enmascarado como producing/shipped', () => {
  // Si el fix se hace en la UI (badge/tabs/filtro leyendo fulfillment_status),
  // adaptar esta aserción al enfoque elegido.
  it('exception sobre un pedido producing no debe persistir status=producing', async () => {
    m.getById.mockResolvedValue({ id: 'o1', tenant_id: TENANT, status: 'producing', fulfillment_status: 'in_production' })
    await PUT(req({ fulfillment_status: 'exception', exception_reason: 'falta arte' }), { params: params() })
    const u = lastUpdates()
    const persisted = u && 'status' in u ? u.status : 'producing' // partial update: status queda stale
    expect(['producing', 'shipped', 'delivered']).not.toContain(persisted) // RED hoy: 'producing'
  })
})

describe('P2 #3 — validación del campo legacy status en el PUT', () => {
  it('status con enum inválido debe responder 400, no 500', async () => {
    m.getById.mockResolvedValue({ id: 'o1', tenant_id: TENANT, status: 'producing', fulfillment_status: 'in_production' })
    m.update.mockResolvedValue(null) // simula el rechazo de la CHECK constraint
    const res = await PUT(req({ status: 'foo' }), { params: params() })
    expect(res.status).toBe(400) // RED hoy: 500
  })
  it('salto ilegal delivered→pending debe rechazarse (no 200)', async () => {
    m.getById.mockResolvedValue({ id: 'o1', tenant_id: TENANT, status: 'delivered', fulfillment_status: 'delivered' })
    const res = await PUT(req({ status: 'pending' }), { params: params() })
    expect(res.status).not.toBe(200) // RED hoy: 200
  })
})
