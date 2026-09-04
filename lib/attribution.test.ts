/**
 * sanitizeAttribution corre server-side sobre el payload de atribución que
 * manda el navegador (untrusted): tiene que whitelistear a las 9 columnas de
 * migrations/20260806_orders_attribution.sql, aceptar solo strings, y cortar
 * cualquier valor larguísimo. Nunca debe tirar ni dejar pasar claves ajenas.
 */
import { describe, it, expect } from "vitest"
import { sanitizeAttribution, ATTRIBUTION_FIELDS } from "./attribution"

describe("sanitizeAttribution", () => {
  it("devuelve null si no hay input", () => {
    expect(sanitizeAttribution(null)).toBeNull()
    expect(sanitizeAttribution(undefined)).toBeNull()
  })

  it("devuelve null si el input no es un objeto", () => {
    expect(sanitizeAttribution("utm_source=google")).toBeNull()
    expect(sanitizeAttribution(123)).toBeNull()
    expect(sanitizeAttribution(true)).toBeNull()
  })

  it("devuelve null si el objeto no trae ningún campo útil", () => {
    expect(sanitizeAttribution({})).toBeNull()
    expect(sanitizeAttribution({ utm_source: "" })).toBeNull()
    expect(sanitizeAttribution({ utm_source: null })).toBeNull()
  })

  it("whitelistea: solo pasan las 9 columnas conocidas", () => {
    const out = sanitizeAttribution({
      utm_source: "google",
      malicious_column: "DROP TABLE orders",
      __proto__: "x",
      random_field: "y",
    })
    expect(out).not.toBeNull()
    expect(Object.keys(out!).sort()).toEqual([...ATTRIBUTION_FIELDS].sort())
    expect((out as any).malicious_column).toBeUndefined()
    expect((out as any).random_field).toBeUndefined()
    expect(out!.utm_source).toBe("google")
  })

  it("rechaza valores no-string (quedan en null, no rompen ni se cuelan)", () => {
    const out = sanitizeAttribution({
      utm_source: "google",
      utm_medium: 12345,
      utm_campaign: { nested: "object" },
      fbclid: ["array"],
      gclid: true,
    })
    expect(out).not.toBeNull()
    expect(out!.utm_source).toBe("google")
    expect(out!.utm_medium).toBeNull()
    expect(out!.utm_campaign).toBeNull()
    expect(out!.fbclid).toBeNull()
    expect(out!.gclid).toBeNull()
  })

  it("corta valores larguísimos a MAX_FIELD_LENGTH (500)", () => {
    const long = "a".repeat(1000)
    const out = sanitizeAttribution({ utm_campaign: long })
    expect(out).not.toBeNull()
    expect(out!.utm_campaign?.length).toBe(500)
  })

  it("trimea espacios y descarta strings vacíos tras el trim", () => {
    const out = sanitizeAttribution({ utm_source: "  google  ", utm_medium: "   " })
    expect(out).not.toBeNull()
    expect(out!.utm_source).toBe("google")
    expect(out!.utm_medium).toBeNull()
  })
})
