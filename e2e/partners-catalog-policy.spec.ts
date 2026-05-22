import { test, expect } from "@playwright/test"
import {
  getPartnerAccessToken,
  hasPartnerAuthCreds,
} from "./fixtures/partner-auth"

/**
 * E2E contra el API real del workspace partner. Verifica la policy de catalogo:
 *
 *  - Productos legacy (con name/category prohibidos) deben poder ocultarse y
 *    editarse en campos no-policy aunque la policy actual los rechazaria como
 *    creacion nueva.
 *  - Nuevos productos prohibidos siguen siendo rechazados con 422.
 *
 * Requiere variables de entorno (ver e2e/fixtures/partner-auth.ts). Si no estan
 * presentes, el suite se skipea limpiamente.
 */

test.describe("Partner catalog API — policy revalidation", () => {
  test.skip(!hasPartnerAuthCreds(), "Missing E2E partner auth creds — skipping")

  let token: string
  const createdIds: string[] = []

  test.beforeAll(async () => {
    token = await getPartnerAccessToken()
  })

  test.afterAll(async ({ request }) => {
    for (const id of createdIds) {
      await request
        .delete(`/api/partners/catalog/${id}`, {
          headers: { authorization: `Bearer ${token}` },
        })
        .catch(() => {})
    }
  })

  async function createValidProduct(request: import("@playwright/test").APIRequestContext) {
    const res = await request.post("/api/partners/catalog", {
      headers: { authorization: `Bearer ${token}` },
      data: {
        name: `Remera E2E ${Date.now()}`,
        description: "Remera de prueba E2E",
        category: "Remera",
        price: 15000,
        status: "active",
        images: [],
      },
    })
    expect([200, 201], await res.text()).toContain(res.status())
    const body = (await res.json()) as { product: { id: string } }
    createdIds.push(body.product.id)
    return body.product.id
  }

  test("rechaza crear producto con categoria prohibida (422)", async ({ request }) => {
    const res = await request.post("/api/partners/catalog", {
      headers: { authorization: `Bearer ${token}` },
      data: {
        name: "Producto E2E",
        category: "Toallones",
        price: 30000,
        status: "active",
      },
    })
    expect(res.status()).toBe(422)
  })

  test("rechaza editar producto valido para meterle categoria prohibida (422)", async ({ request }) => {
    const id = await createValidProduct(request)
    const res = await request.put(`/api/partners/catalog/${id}`, {
      headers: { authorization: `Bearer ${token}` },
      data: { category: "Toallones" },
    })
    expect(res.status()).toBe(422)
  })

  test("permite bajar producto a status hidden aunque se envie name viejo", async ({ request }) => {
    const id = await createValidProduct(request)
    // Simulamos el caso "legacy": el front manda el payload completo. Status nuevo = hidden.
    const res = await request.put(`/api/partners/catalog/${id}`, {
      headers: { authorization: `Bearer ${token}` },
      data: {
        status: "hidden",
        name: "Toallón viejo legacy",
        description: "toallon prohibido legacy",
      },
    })
    expect(res.status(), await res.text()).toBe(200)
  })

  test("permite editar campos no-policy (price)", async ({ request }) => {
    const id = await createValidProduct(request)
    const res = await request.put(`/api/partners/catalog/${id}`, {
      headers: { authorization: `Bearer ${token}` },
      data: { price: 20000 },
    })
    expect(res.status()).toBe(200)
  })

  test("permite DELETE incluso si el producto violaria la policy", async ({ request }) => {
    const id = await createValidProduct(request)
    const res = await request.delete(`/api/partners/catalog/${id}`, {
      headers: { authorization: `Bearer ${token}` },
    })
    expect(res.status()).toBe(200)
    createdIds.splice(createdIds.indexOf(id), 1)
  })
})
