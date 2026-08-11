// El dueño respondió al hallazgo Orlando con un segundo pedido: si un partner
// apaga su tienda A PROPOSITO desde Configuración, el auto-publish (disparado
// al publicar un producto o editar branding — ver lib/partners/auto-publish.ts)
// no la tiene que volver a prender sola. La marca vive en
// metadata.storefront_hidden_manually, seteada/limpiada por este endpoint.
//
// metadata es una columna JSON que TAMBIEN guarda datos de suscripción
// (pending_plan, subscription_type, last_mp_payment_id — camino de plata via
// lib/partners/subscription.ts y el webhook de MercadoPago). Estos tests
// verifican explícitamente que el read-modify-write NUNCA pisa esas claves.
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

const h = vi.hoisted(() => ({
  tenant: {} as Record<string, unknown>,
  updateTenantResultMock: vi.fn(),
}))

vi.mock('@/lib/partners/permissions', () => ({
  requireTenantPermission: vi.fn(async () => ({
    ok: true,
    tenant: h.tenant,
    role: 'owner',
    userId: 'user-1',
    email: 'owner@acme.com',
    isPlatformAdmin: false,
  })),
}))

vi.mock('@/lib/partners/tenant', () => ({
  updateTenantResult: (id: string, updates: Record<string, unknown>) => h.updateTenantResultMock(id, updates),
}))

import { PUT } from '@/app/api/partners/settings/route'

function makeRequest(body: unknown) {
  return new NextRequest('http://localhost:3000/api/partners/settings', {
    method: 'PUT',
    body: JSON.stringify(body),
    headers: { 'content-type': 'application/json' },
  })
}

// Metadata "de camino de plata" que SIEMPRE debe sobrevivir intacta.
const paymentMetadata = {
  subscription_type: 'recurring',
  pending_plan: 'growth',
  last_mp_payment_id: 'payment-999',
}

const baseTenant = {
  id: 'tenant-1',
  plan: 'starter',
  storefront_published: true,
  metadata: { ...paymentMetadata },
}

beforeEach(() => {
  vi.clearAllMocks()
  h.tenant = { ...baseTenant, metadata: { ...baseTenant.metadata } }
  h.updateTenantResultMock.mockImplementation(async (_id: string, updates: Record<string, unknown>) => ({
    data: { ...h.tenant, ...updates },
    error: null,
  }))
})

describe('PUT /api/partners/settings — apagado manual del storefront (metadata.storefront_hidden_manually)', () => {
  it('(b) true→false: marca storefront_hidden_manually=true preservando el resto de metadata (pending_plan, subscription_type, last_mp_payment_id)', async () => {
    h.tenant.storefront_published = true
    const res = await PUT(makeRequest({ storefront_published: false }))
    expect(res.status).toBe(200)

    expect(h.updateTenantResultMock).toHaveBeenCalledTimes(1)
    const [, updates] = h.updateTenantResultMock.mock.calls[0]
    expect(updates.storefront_published).toBe(false)
    expect(updates.metadata).toEqual({
      ...paymentMetadata,
      storefront_hidden_manually: true,
    })
  })

  it('(c) false→true con la marca puesta: publica Y limpia storefront_hidden_manually', async () => {
    h.tenant.storefront_published = false
    h.tenant.metadata = { ...paymentMetadata, storefront_hidden_manually: true }

    const res = await PUT(makeRequest({ storefront_published: true }))
    expect(res.status).toBe(200)

    const [, updates] = h.updateTenantResultMock.mock.calls[0]
    expect(updates.storefront_published).toBe(true)
    // (d) el resto de metadata (camino de plata) sigue intacto
    expect(updates.metadata).toEqual(paymentMetadata)
    expect('storefront_hidden_manually' in (updates.metadata as object)).toBe(false)
  })

  it('true→true (republicar algo que ya estaba publicado, sin marca previa) no inventa metadata', async () => {
    h.tenant.storefront_published = true
    // metadata SIN storefront_hidden_manually
    const res = await PUT(makeRequest({ storefront_published: true }))
    expect(res.status).toBe(200)

    const [, updates] = h.updateTenantResultMock.mock.calls[0]
    expect(updates.metadata).toBeUndefined()
  })

  it('false→false (ya estaba apagada, no es una transicion real desde true) no marca de nuevo', async () => {
    h.tenant.storefront_published = false
    const res = await PUT(makeRequest({ storefront_published: false }))
    expect(res.status).toBe(200)

    const [, updates] = h.updateTenantResultMock.mock.calls[0]
    expect(updates.metadata).toBeUndefined()
  })

  it('cambiar un campo no relacionado (name) no toca metadata para nada', async () => {
    h.tenant.storefront_published = true
    const res = await PUT(makeRequest({ name: 'Nueva Marca SRL' }))
    expect(res.status).toBe(200)

    const [, updates] = h.updateTenantResultMock.mock.calls[0]
    expect(updates.name).toBe('Nueva Marca SRL')
    expect(updates.metadata).toBeUndefined()
  })
})
