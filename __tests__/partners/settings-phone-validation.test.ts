// Bug (auditoría workspace 08/10/2026): PUT /api/partners/settings guardaba
// `phone` tal cual, sin validar — la tienda pública arma el link de WhatsApp
// con ese valor (app/p/[slug]/page.tsx, [product]/page.tsx) y un celular mal
// formado rompe el botón. Estos tests verifican que el endpoint ahora:
//  - normaliza un teléfono argentino válido a formato WhatsApp (549...),
//  - rechaza con 422 un teléfono inválido,
//  - NO toca `phone` si el valor no cambió (no reescribe filas existentes —
//    evita que un teléfono legacy mal formado bloquee guardados no
//    relacionados, mismo criterio que el guard de custom_faqs en esta ruta).
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

const baseTenant = {
  id: 'tenant-1',
  plan: 'starter',
  country: 'AR',
  phone: null as string | null,
  storefront_published: true,
  metadata: {},
}

beforeEach(() => {
  vi.clearAllMocks()
  h.tenant = { ...baseTenant }
  h.updateTenantResultMock.mockImplementation(async (_id: string, updates: Record<string, unknown>) => ({
    data: { ...h.tenant, ...updates },
    error: null,
  }))
})

describe('PUT /api/partners/settings — validación de teléfono', () => {
  it('normaliza un celular argentino sin el 9 al formato WhatsApp', async () => {
    const res = await PUT(makeRequest({ phone: '011 1234-5678' }))
    expect(res.status).toBe(200)
    const [, updates] = h.updateTenantResultMock.mock.calls[0]
    expect(updates.phone).toBe('5491112345678')
  })

  it('rechaza con 422 un teléfono inválido y NO llama a updateTenantResult', async () => {
    const res = await PUT(makeRequest({ phone: '123' }))
    expect(res.status).toBe(422)
    const json = await res.json()
    expect(json.error).toMatch(/inválido/i)
    expect(h.updateTenantResultMock).not.toHaveBeenCalled()
  })

  it('borra el teléfono si se manda vacío', async () => {
    h.tenant.phone = '5491112345678'
    const res = await PUT(makeRequest({ phone: '' }))
    expect(res.status).toBe(200)
    const [, updates] = h.updateTenantResultMock.mock.calls[0]
    expect(updates.phone).toBeNull()
  })

  it('acepta un número uruguayo con "+" sin aplicarle la lógica argentina', async () => {
    h.tenant.country = 'UY'
    const res = await PUT(makeRequest({ phone: '+598 98 123 456' }))
    expect(res.status).toBe(200)
    const [, updates] = h.updateTenantResultMock.mock.calls[0]
    expect(updates.phone).toBe('59898123456')
  })

  it('NO reescribe la fila si el teléfono mandado es exactamente el ya guardado (aunque sea un valor legacy mal formado)', async () => {
    h.tenant.phone = '011-1234-5678' // legacy, nunca normalizado
    const res = await PUT(makeRequest({ phone: '011-1234-5678', name: 'Nueva Marca' }))
    expect(res.status).toBe(200)
    const [, updates] = h.updateTenantResultMock.mock.calls[0]
    expect('phone' in updates).toBe(false)
    expect(updates.name).toBe('Nueva Marca')
  })

  it('un guardado no relacionado (solo name) con phone legacy sin cambios no rompe por 422', async () => {
    h.tenant.phone = 'texto no telefonico'
    const res = await PUT(makeRequest({ phone: 'texto no telefonico', name: 'Otra Marca' }))
    expect(res.status).toBe(200)
  })
})
