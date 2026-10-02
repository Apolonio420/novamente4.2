import { describe, it, expect } from "vitest"
import { sanitizarEvento } from "./funnel"

const SID = "abc12345"

describe("sanitizarEvento", () => {
  it("checkout_view válido → lo normaliza", () => {
    const r = sanitizarEvento({ event: "checkout_view", session_id: SID, cart_value: 50000, items: 2, payment_method: "mercadopago" })
    expect(r).toEqual({
      event: "checkout_view",
      session_id: SID,
      valid: null,
      missing_fields: null,
      payment_method: "mercadopago",
      tenant_id: null,
      cart_value: 50000,
      items: 2,
    })
  })

  it("tenant_id UUID válido → lo conserva; inválido → null", () => {
    const uuid = "123e4567-e89b-12d3-a456-426614174000"
    expect(sanitizarEvento({ event: "checkout_view", session_id: SID, tenant_id: uuid })?.tenant_id).toBe(uuid)
    expect(sanitizarEvento({ event: "checkout_view", session_id: SID, tenant_id: "no-es-uuid" })?.tenant_id).toBeNull()
  })

  it("confirm_click válido con missing_fields vacío → null", () => {
    const r = sanitizarEvento({ event: "confirm_click", session_id: SID, valid: true, missing_fields: [] })
    expect(r?.valid).toBe(true)
    expect(r?.missing_fields).toBeNull()
  })

  it("confirm_click inválido con missing_fields conocidos → los conserva", () => {
    const r = sanitizarEvento({ event: "confirm_click", session_id: SID, valid: false, missing_fields: ["email", "phone"] })
    expect(r?.valid).toBe(false)
    expect(r?.missing_fields).toEqual(["email", "phone"])
  })

  it("missing_fields con ids desconocidos → los filtra", () => {
    const r = sanitizarEvento({
      event: "confirm_click",
      session_id: SID,
      valid: false,
      missing_fields: ["email", "<script>alert(1)</script>", "notAField", "phone"],
    })
    expect(r?.missing_fields).toEqual(["email", "phone"])
  })

  it("missing_fields duplicados → dedupe", () => {
    const r = sanitizarEvento({ event: "confirm_click", session_id: SID, valid: false, missing_fields: ["email", "email", "phone"] })
    expect(r?.missing_fields).toEqual(["email", "phone"])
  })

  it("order_created u payment_approved desde el cliente → rechazado (server-only)", () => {
    expect(sanitizarEvento({ event: "order_created", session_id: SID })).toBeNull()
    expect(sanitizarEvento({ event: "payment_approved", session_id: SID })).toBeNull()
  })

  it("evento desconocido → null", () => {
    expect(sanitizarEvento({ event: "algo_raro", session_id: SID })).toBeNull()
  })

  it("sin event → null", () => {
    expect(sanitizarEvento({ session_id: SID })).toBeNull()
  })

  it("body no-objeto → null", () => {
    expect(sanitizarEvento(null)).toBeNull()
    expect(sanitizarEvento("string")).toBeNull()
    expect(sanitizarEvento(42)).toBeNull()
    expect(sanitizarEvento(undefined)).toBeNull()
  })

  it("session_id corto → rechazado", () => {
    expect(sanitizarEvento({ event: "checkout_view", session_id: "abc" })).toBeNull()
  })

  it("session_id largo (>64) → rechazado", () => {
    expect(sanitizarEvento({ event: "checkout_view", session_id: "a".repeat(65) })).toBeNull()
  })

  it("session_id con caracteres inválidos → rechazado", () => {
    expect(sanitizarEvento({ event: "checkout_view", session_id: "abc 123!!" })).toBeNull()
  })

  it("session_id ausente → rechazado", () => {
    expect(sanitizarEvento({ event: "checkout_view" })).toBeNull()
  })

  it("payment_method inválido → null (no explota)", () => {
    const r = sanitizarEvento({ event: "checkout_view", session_id: SID, payment_method: "bitcoin" })
    expect(r?.payment_method).toBeNull()
  })

  it("cart_value negativo → null", () => {
    const r = sanitizarEvento({ event: "checkout_view", session_id: SID, cart_value: -100 })
    expect(r?.cart_value).toBeNull()
  })

  it("cart_value absurdamente grande → null", () => {
    const r = sanitizarEvento({ event: "checkout_view", session_id: SID, cart_value: 999_999_999_999 })
    expect(r?.cart_value).toBeNull()
  })

  it("cart_value no numérico → null", () => {
    const r = sanitizarEvento({ event: "checkout_view", session_id: SID, cart_value: "50000" })
    expect(r?.cart_value).toBeNull()
  })

  it("cart_value con decimales → redondea", () => {
    const r = sanitizarEvento({ event: "checkout_view", session_id: SID, cart_value: 1234.7 })
    expect(r?.cart_value).toBe(1235)
  })

  it("items negativo o no numérico → null", () => {
    expect(sanitizarEvento({ event: "checkout_view", session_id: SID, items: -1 })?.items).toBeNull()
    expect(sanitizarEvento({ event: "checkout_view", session_id: SID, items: "2" })?.items).toBeNull()
  })

  it("valid no-boolean → null (no lo inventa)", () => {
    const r = sanitizarEvento({ event: "confirm_click", session_id: SID, valid: "true" })
    expect(r?.valid).toBeNull()
  })

  it("missing_fields no-array → null", () => {
    const r = sanitizarEvento({ event: "confirm_click", session_id: SID, valid: false, missing_fields: "email" })
    expect(r?.missing_fields).toBeNull()
  })
})
