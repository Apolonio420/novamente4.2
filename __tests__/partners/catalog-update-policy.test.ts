import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextRequest } from "next/server"

vi.mock("@/lib/partners/permissions", () => ({
  requireTenantPermission: vi.fn(async () => ({
    ok: true,
    tenant: { id: "tenant-1", slug: "acme", plan: "starter" },
    role: "owner",
    userId: "user-1",
    email: "owner@acme.com",
    isPlatformAdmin: false,
  })),
}))

const existingLegacyProduct = {
  id: "prod-legacy",
  tenant_id: "tenant-1",
  name: "Toallón DIEGO ARMANDO",
  description: "Toallón de Maradona edicion limitada",
  category: "Toallones",
  status: "active",
}

let currentExisting: typeof existingLegacyProduct | null = existingLegacyProduct
const updateProductMock = vi.fn(async (id: string, updates: Record<string, unknown>) => ({
  ...(currentExisting ?? existingLegacyProduct),
  ...updates,
  id,
}))

vi.mock("@/lib/partners/catalog", () => ({
  updateProduct: (id: string, updates: Record<string, unknown>) => updateProductMock(id, updates),
  deleteProduct: vi.fn(),
}))

// Stub supabaseAdmin so the route's local getProductById returns our fixture.
vi.mock("@/lib/supabase-admin", () => {
  const builder = {
    from: () => builder,
    select: () => builder,
    eq: () => builder,
    single: async () => ({ data: currentExisting, error: null }),
  }
  return { supabaseAdmin: builder }
})

import { PUT } from "@/app/api/partners/catalog/[id]/route"

function makeRequest(body: unknown) {
  return new NextRequest("http://localhost:3000/api/partners/catalog/prod-legacy", {
    method: "PUT",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  })
}

const params = Promise.resolve({ id: "prod-legacy" })

describe("PUT /api/partners/catalog/[id] — policy revalidation", () => {
  beforeEach(() => {
    updateProductMock.mockClear()
    currentExisting = existingLegacyProduct
  })

  it("legacy product can be hidden even if its name violates policy", async () => {
    const req = makeRequest({ status: "hidden" })
    const res = await PUT(req, { params })
    expect(res.status).toBe(200)
    expect(updateProductMock).toHaveBeenCalledWith("prod-legacy", expect.objectContaining({ status: "hidden" }))
  })

  it("legacy product: bajar a draft mientras se manda name viejo no debe bloquear", async () => {
    const req = makeRequest({ status: "draft", name: existingLegacyProduct.name })
    const res = await PUT(req, { params })
    expect(res.status).toBe(200)
  })

  it("legacy product puede setear categoria vacia (Sin categoria) sin reintroducir su name legacy en policy", async () => {
    const req = makeRequest({ category: "" })
    const res = await PUT(req, { params })
    expect(res.status).toBe(200)
  })

  it("intentar setear una categoria prohibida nueva sigue bloqueando (422)", async () => {
    currentExisting = {
      ...existingLegacyProduct,
      name: "Remera Buena",
      description: "Remera de algodon",
      category: "Remera",
    }
    const req = makeRequest({ category: "Toallones" })
    const res = await PUT(req, { params })
    expect(res.status).toBe(422)
  })

  it("intentar setear un name con keyword prohibida sigue bloqueando (422)", async () => {
    currentExisting = {
      ...existingLegacyProduct,
      name: "Remera Buena",
      description: "",
      category: "Remera",
    }
    const req = makeRequest({ name: "Toallón nuevo" })
    const res = await PUT(req, { params })
    expect(res.status).toBe(422)
  })

  it("editar price en producto legacy no debe revalidar policy", async () => {
    const req = makeRequest({ price: 25000 })
    const res = await PUT(req, { params })
    expect(res.status).toBe(200)
  })
})
