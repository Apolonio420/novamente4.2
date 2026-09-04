/**
 * createOrder no debe fallar nunca por la atribución de marketing: si la
 * migración migrations/20260806_orders_attribution.sql todavía no corrió en
 * la DB, el primer insert falla con "column ... does not exist" (42703) — acá
 * probamos que createOrder reintenta UNA vez sin esas columnas y el pedido se
 * crea igual, sin exponer el error al comprador.
 */
import { describe, it, expect, vi, beforeEach } from "vitest"

const ATTRIBUTION_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
  "fbclid",
  "gclid",
  "landing_page",
  "referrer",
]

const h = vi.hoisted(() => ({
  insertCalls: [] as any[],
}))

vi.mock("@/lib/auth", () => ({
  getCurrentUser: async () => null,
}))

vi.mock("@vercel/blob", () => ({
  put: vi.fn(),
}))

vi.mock("@/lib/supabase-admin", () => ({
  supabaseAdmin: {
    from: (table: string) => {
      if (table === "orders") {
        return {
          select: (cols: string) => ({
            eq: () => ({
              single: async () => {
                // select("id") = chequeo de unicidad de order_number → "no existe"
                if (cols === "id") return { data: null, error: { message: "not found" } }
                // select("*") = getOrderById, al final de createOrder
                return {
                  data: { id: "order-test-1", order_number: "NOV-TEST-0001" },
                  error: null,
                }
              },
            }),
          }),
          insert: (payload: any) => {
            h.insertCalls.push(payload)
            const attempt = h.insertCalls.length
            return {
              select: () => ({
                single: async () => {
                  if (attempt === 1) {
                    // simula: migración de atribución no aplicada todavía en la DB
                    return {
                      data: null,
                      error: {
                        code: "42703",
                        message: 'column "utm_source" of relation "orders" does not exist',
                      },
                    }
                  }
                  return { data: { id: "order-test-1", order_number: "NOV-TEST-0001" }, error: null }
                },
              }),
            }
          },
          delete: () => ({ eq: async () => ({ error: null }) }),
        }
      }
      if (table === "order_items") {
        return {
          insert: async () => ({ error: null }),
          select: () => ({
            eq: () => ({
              order: async () => ({ data: [], error: null }),
            }),
          }),
        }
      }
      return {}
    },
  },
}))

import { createOrder } from "./db"

describe("createOrder — fallback ante columnas de atribución faltantes (42703)", () => {
  beforeEach(() => {
    h.insertCalls.length = 0
  })

  it("reintenta el insert sin las columnas de atribución y el pedido se crea igual", async () => {
    const order = await createOrder({
      customer_email: "test@test.com",
      customer_first_name: "Test",
      customer_last_name: "User",
      payment_method: "transferencia",
      subtotal: 100,
      shipping_cost: 0,
      total: 100,
      utm_source: "google",
      utm_medium: "cpc",
      utm_campaign: "malvinas",
      items: [
        {
          item_name: "Remera",
          product_type: "remera",
          product_color: "negro",
          product_size: "M",
          quantity: 1,
          unit_price: 100,
          total_price: 100,
        },
      ],
    } as any)

    // hubo exactamente 2 intentos de insert en "orders"
    expect(h.insertCalls.length).toBe(2)

    // el primer intento SÍ manda las columnas de atribución
    expect(h.insertCalls[0].utm_source).toBe("google")
    expect(h.insertCalls[0].utm_medium).toBe("cpc")
    expect(h.insertCalls[0].utm_campaign).toBe("malvinas")

    // el segundo intento (retry) NO debe tener NINGUNA key de atribución
    for (const key of ATTRIBUTION_KEYS) {
      expect(h.insertCalls[1]).not.toHaveProperty(key)
    }

    // y el pedido se creó igual — el comprador nunca ve el error
    expect(order).not.toBeNull()
  })

  it("no manda columnas de atribución vacías/ausentes en el insert original", async () => {
    await createOrder({
      customer_email: "test2@test.com",
      customer_first_name: "Test",
      customer_last_name: "User",
      payment_method: "transferencia",
      subtotal: 50,
      shipping_cost: 0,
      total: 50,
      // sin atribución: ningún campo utm_*/fbclid/gclid/landing_page/referrer
      items: [
        {
          item_name: "Remera",
          product_type: "remera",
          product_color: "negro",
          product_size: "M",
          quantity: 1,
          unit_price: 50,
          total_price: 50,
        },
      ],
    } as any)

    // como no hay atribución, el primer insert ya no debería tener ninguna key
    // de atribución (así que ni siquiera dispara el flujo de retry)
    expect(h.insertCalls.length).toBe(1)
    for (const key of ATTRIBUTION_KEYS) {
      expect(h.insertCalls[0]).not.toHaveProperty(key)
    }
  })
})
