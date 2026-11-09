import { describe, it, expect, vi } from "vitest"

vi.mock("@/lib/supabase-admin", () => ({ supabaseAdmin: {} }))

import {
  canonicalPhone,
  deriveWebSaleOrigin,
  buildWebSaleAttributionRow,
  recordWebSaleAttribution,
  webPaymentMethod,
  type WebSaleOrder,
} from "./web-sale-attribution"

// Fila real de `orders` (leída de prod el 09/11, solo lectura): la única venta
// cobrada de noviembre, que quedó sin fila en sale_attributions.
const NOV_9051: WebSaleOrder = {
  id: "4e229956-ce9f-4171-be31-41a41dc6385f",
  order_number: "NOV-20261105-9051",
  total: 41030,
  tenant_id: null,
  customer_phone: "005492364507764",
  payment_method: "mercadopago",
  utm_source: null,
  utm_medium: null,
  utm_campaign: null,
  utm_content: null,
  utm_term: null,
  fbclid: null,
  gclid: null,
  landing_page: null,
  referrer: null,
}

// Única venta confirmada desde agosto con atribución (NOV-20260905-3401).
const NOV_3401_CHATGPT: WebSaleOrder = {
  ...NOV_9051,
  order_number: "NOV-20260905-3401",
  utm_source: "chatgpt.com",
  landing_page: "/malvinas?utm_source=chatgpt.com",
}

describe("canonicalPhone (mismo formato que sace_sessions.phone_e164)", () => {
  it("saca el prefijo internacional 00 del formulario web (NOV-20261105-9051)", () => {
    expect(canonicalPhone("005492364507764")).toBe("5492364507764")
  })
  it("normaliza las formas argentinas comunes a 549 + 10 dígitos", () => {
    expect(canonicalPhone("+54 9 236 450-7764")).toBe("5492364507764")
    expect(canonicalPhone("2364507764")).toBe("5492364507764")
    expect(canonicalPhone("02364507764")).toBe("5492364507764")
    expect(canonicalPhone("542364507764")).toBe("5492364507764")
  })
  it("vacío → vacío", () => {
    expect(canonicalPhone(null)).toBe("")
  })
})

describe("deriveWebSaleOrigin", () => {
  it("sin ningún rastro → desconocido (nunca inventa orgánico): caso NOV-20261105-9051", () => {
    expect(deriveWebSaleOrigin(NOV_9051, "")).toBe("desconocido")
  })
  it("anuncio de Meta con la convención de Novamente (utm_medium=paid) → ad", () => {
    expect(deriveWebSaleOrigin({ ...NOV_9051, utm_source: "meta", utm_medium: "paid", utm_campaign: "cyber_monday_2026", fbclid: "x" }, "")).toBe("ad")
  })
  it("paid_social (generador de links de partners), cpc → ad; gclid → ad", () => {
    expect(deriveWebSaleOrigin({ ...NOV_9051, utm_medium: "paid_social" }, "")).toBe("ad")
    expect(deriveWebSaleOrigin({ ...NOV_9051, utm_medium: "CPC" }, "")).toBe("ad")
    expect(deriveWebSaleOrigin({ ...NOV_9051, gclid: "abc" }, "")).toBe("ad")
  })
  it("fbclid suelto (link orgánico de FB/IG, sin utm pago) → organico", () => {
    expect(deriveWebSaleOrigin({ ...NOV_9051, fbclid: "IwAR..." }, "")).toBe("organico")
  })
  it("utm no paga o referrer externo → organico (caso real NOV-20260905-3401 de chatgpt.com)", () => {
    expect(deriveWebSaleOrigin(NOV_3401_CHATGPT, "")).toBe("organico")
    expect(deriveWebSaleOrigin({ ...NOV_9051, utm_source: "facebook", utm_medium: "organic" }, "")).toBe("organico")
    expect(deriveWebSaleOrigin({ ...NOV_9051, referrer: "https://l.instagram.com/" }, "")).toBe("organico")
  })
  it("referrer de novamente.ar o no parseable no cuenta como externo", () => {
    expect(deriveWebSaleOrigin({ ...NOV_9051, referrer: "https://www.novamente.ar/crear" }, "")).toBe("desconocido")
    expect(deriveWebSaleOrigin({ ...NOV_9051, referrer: "basura" }, "")).toBe("desconocido")
  })
  it("mail/outreach → outreach", () => {
    expect(deriveWebSaleOrigin({ ...NOV_9051, utm_source: "resend", utm_medium: "email" }, "")).toBe("outreach")
    expect(deriveWebSaleOrigin({ ...NOV_9051, utm_source: "outreach" }, "")).toBe("outreach")
  })
  it("tienda de partner gana sobre el anuncio (misma prioridad que el bot)", () => {
    expect(deriveWebSaleOrigin({ ...NOV_9051, tenant_id: "t1", utm_medium: "paid" }, "")).toBe("partner")
  })
  it("teléfono interno → interno (gana sobre todo)", () => {
    expect(deriveWebSaleOrigin({ ...NOV_9051, tenant_id: "t1" }, "+54 9 236 450 7764")).toBe("interno")
  })
})

describe("webPaymentMethod", () => {
  it("transferencia → transfer; MercadoPago → card (vocabulario del bot)", () => {
    expect(webPaymentMethod("transferencia")).toBe("transfer")
    expect(webPaymentMethod("transfer")).toBe("transfer")
    expect(webPaymentMethod("mercadopago")).toBe("card")
  })
})

describe("buildWebSaleAttributionRow", () => {
  it("NOV-20261105-9051: venta confirmada, source web, cotizado y confirmado, origen desconocido", () => {
    const row = buildWebSaleAttributionRow(NOV_9051, { confirmedTotalArs: 41030, paymentMethod: "mercadopago" }, { internalPhonesEnv: "" })
    expect(row).toEqual({
      phone: "5492364507764",
      conversation_id: null,
      ctwa_clid: null,
      ad_campaign: null,
      ad_creative: null,
      ad_source_id: null,
      origin: "desconocido",
      tenant_slug: null,
      quoted_total_ars: 41030,
      confirmed_total_ars: 41030,
      payment_method: "card",
      source: "web",
      order_ref: "NOV-20261105-9051",
    })
  })
  it("confirmado = lo cobrado; cotizado = total del pedido (pueden diferir)", () => {
    const row = buildWebSaleAttributionRow({ ...NOV_9051, total: 41030 }, { confirmedTotalArs: 41031.5 }, { internalPhonesEnv: "" })!
    expect(row.quoted_total_ars).toBe(41030)
    expect(row.confirmed_total_ars).toBe(41031.5)
  })
  it("sin monto cobrado usa el total; campaña y creativo salen de utm_campaign/utm_content", () => {
    const row = buildWebSaleAttributionRow(
      { ...NOV_9051, utm_source: "meta", utm_medium: "paid", utm_campaign: "cyber_monday_2026", utm_content: "originals_30" },
      {},
      { internalPhonesEnv: "", tenantSlug: null },
    )!
    expect(row.confirmed_total_ars).toBe(41030)
    expect(row.ad_campaign).toBe("cyber_monday_2026")
    expect(row.ad_creative).toBe("originals_30")
    expect(row.origin).toBe("ad")
  })
  it("sin teléfono: clave web:<pedido> (phone es NOT NULL)", () => {
    expect(buildWebSaleAttributionRow({ ...NOV_9051, customer_phone: null }, {}, { internalPhonesEnv: "" })!.phone).toBe("web:NOV-20261105-9051")
  })
  it("sin número de pedido o sin monto → null (nada que atribuir)", () => {
    expect(buildWebSaleAttributionRow({ ...NOV_9051, order_number: null })).toBeNull()
    expect(buildWebSaleAttributionRow({ ...NOV_9051, total: 0 }, { confirmedTotalArs: 0 })).toBeNull()
  })
})

/** Cliente Supabase falso: registra inserts y deja controlar el lookup. */
function fakeClient(opts: { prior?: any; insertError?: any; throwOnInsert?: boolean; tenantSlug?: string } = {}) {
  const inserts: any[] = []
  const client = {
    from(table: string) {
      if (table === "tenants") {
        return { select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: opts.tenantSlug ? { slug: opts.tenantSlug } : null }) }) }) }
      }
      const chain: any = {
        select: () => chain,
        eq: () => chain,
        limit: () => chain,
        maybeSingle: async () => ({ data: opts.prior ?? null, error: null }),
        insert: async (row: any) => {
          if (opts.throwOnInsert) throw new Error("boom")
          inserts.push(row)
          return { error: opts.insertError ?? null }
        },
      }
      return chain
    },
  }
  return { client, inserts }
}

describe("recordWebSaleAttribution", () => {
  it("inserta una fila web para el pago aprobado", async () => {
    const { client, inserts } = fakeClient()
    expect(await recordWebSaleAttribution(NOV_9051, { confirmedTotalArs: 41030, paymentMethod: "mercadopago" }, client)).toBe("inserted")
    expect(inserts).toHaveLength(1)
    expect(inserts[0]).toMatchObject({ source: "web", order_ref: "NOV-20261105-9051", confirmed_total_ars: 41030 })
  })
  it("reintento (ya hay fila web de ese pedido) → exists, sin insertar otra", async () => {
    const { client, inserts } = fakeClient({ prior: { id: "sa1" } })
    expect(await recordWebSaleAttribution(NOV_9051, {}, client)).toBe("exists")
    expect(inserts).toHaveLength(0)
  })
  it("carrera perdida contra el índice único (23505) → exists", async () => {
    const { client } = fakeClient({ insertError: { code: "23505", message: "duplicate key" } })
    expect(await recordWebSaleAttribution(NOV_9051, {}, client)).toBe("exists")
  })
  it("migración sin aplicar (23514 del CHECK de source) → error, sin lanzar", async () => {
    const err = vi.spyOn(console, "error").mockImplementation(() => {})
    const { client } = fakeClient({ insertError: { code: "23514", message: "violates check constraint" } })
    expect(await recordWebSaleAttribution(NOV_9051, {}, client)).toBe("error")
    expect(String(err.mock.calls[0]?.join(" "))).toMatch(/20261109_sale_attributions_source_web/)
    err.mockRestore()
  })
  it("excepción del cliente → error, nunca lanza", async () => {
    const err = vi.spyOn(console, "error").mockImplementation(() => {})
    const { client } = fakeClient({ throwOnInsert: true })
    await expect(recordWebSaleAttribution(NOV_9051, {}, client)).resolves.toBe("error")
    err.mockRestore()
  })
  it("venta de partner: completa tenant_slug y origin partner", async () => {
    const { client, inserts } = fakeClient({ tenantSlug: "lebup" })
    await recordWebSaleAttribution({ ...NOV_9051, tenant_id: "t1" }, {}, client)
    expect(inserts[0]).toMatchObject({ tenant_slug: "lebup", origin: "partner" })
  })
  it("kill switch SALE_ATTRIBUTION_ENABLED=false → disabled, no escribe", async () => {
    vi.stubEnv("SALE_ATTRIBUTION_ENABLED", "false")
    const { client, inserts } = fakeClient()
    expect(await recordWebSaleAttribution(NOV_9051, {}, client)).toBe("disabled")
    expect(inserts).toHaveLength(0)
    vi.unstubAllEnvs()
  })
})
