/**
 * sanitizeAttribution corre server-side sobre el payload de atribución que
 * manda el navegador (untrusted): tiene que whitelistear a las 9 columnas de
 * migrations/20260806_orders_attribution.sql, aceptar solo strings, y cortar
 * cualquier valor larguísimo. Nunca debe tirar ni dejar pasar claves ajenas.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import {
  sanitizeAttribution,
  ATTRIBUTION_FIELDS,
  ATTRIBUTION_STORAGE_KEY,
  ATTRIBUTION_TTL_MS,
  captureAttribution,
  externalSourceHost,
  getStoredAttribution,
} from "./attribution"

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

/**
 * Captura en el navegador: last-touch de campaña + primer touch orgánico
 * (referrer externo sin UTM). Antes una visita orgánica llegaba al checkout
 * sin nada y la venta quedaba 'desconocido' en sale_attributions.
 */
describe("externalSourceHost", () => {
  it("devuelve el host de un referrer externo real", () => {
    expect(externalSourceHost("https://l.instagram.com/?u=x")).toBe("l.instagram.com")
    expect(externalSourceHost("https://www.google.com/")).toBe("google.com")
    expect(externalSourceHost("https://chatgpt.com/")).toBe("chatgpt.com")
  })

  it("trata como internos novamente.ar, www y subdominios (partners/admin)", () => {
    expect(externalSourceHost("https://novamente.ar/p/x")).toBeNull()
    expect(externalSourceHost("https://www.novamente.ar/")).toBeNull()
    expect(externalSourceHost("https://lcitea.novamente.ar/")).toBeNull()
    expect(externalSourceHost("https://admin.novamente.ar/")).toBeNull()
    expect(externalSourceHost("https://preview-x.vercel.app/a", "preview-x.vercel.app")).toBeNull()
  })

  it("no confunde dominios parecidos con el propio", () => {
    expect(externalSourceHost("https://novamente.ar.evil.com/")).toBe("novamente.ar.evil.com")
    expect(externalSourceHost("https://notnovamente.ar/")).toBe("notnovamente.ar")
  })

  it("descarta vueltas de pago y login (no son fuente de tráfico)", () => {
    expect(externalSourceHost("https://www.mercadopago.com.ar/checkout/v1/redirect")).toBeNull()
    expect(externalSourceHost("https://mercadopago.com/")).toBeNull()
    expect(externalSourceHost("https://www.mercadolibre.com.ar/")).toBeNull()
    expect(externalSourceHost("https://accounts.google.com/o/oauth2")).toBeNull()
    expect(externalSourceHost("https://abcd.supabase.co/auth/v1/callback")).toBeNull()
  })

  it("vacío o no parseable → null", () => {
    expect(externalSourceHost("")).toBeNull()
    expect(externalSourceHost(null)).toBeNull()
    expect(externalSourceHost("no es una url")).toBeNull()
  })
})

describe("captureAttribution", () => {
  const stored = () => JSON.parse(window.localStorage.getItem(ATTRIBUTION_STORAGE_KEY) ?? "null")
  const NOW = new Date("2026-11-09T12:00:00Z").getTime()

  beforeEach(() => {
    window.localStorage.clear()
    vi.useFakeTimers()
    vi.setSystemTime(NOW)
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it("visita orgánica sin UTM con referrer externo → guarda referrer + landing", () => {
    const rec = captureAttribution("", "/buzos-egresados", "https://l.instagram.com/?u=abc")
    expect(rec).not.toBeNull()
    expect(stored()).toMatchObject({
      referrer: "https://l.instagram.com/?u=abc",
      landing_page: "/buzos-egresados",
      utm_source: null,
      utm_medium: null,
      fbclid: null,
      gclid: null,
      utm_id: null,
      ts: NOW,
    })
    expect(getStoredAttribution()).toMatchObject({
      referrer: "https://l.instagram.com/?u=abc",
      landing_page: "/buzos-egresados",
    })
  })

  it("visita directa (sin referrer) → no guarda nada", () => {
    expect(captureAttribution("", "/", "")).toBeNull()
    expect(stored()).toBeNull()
  })

  it("referrer interno (novamente.ar / www / subdominio) → no guarda nada", () => {
    expect(captureAttribution("", "/a", "https://www.novamente.ar/")).toBeNull()
    expect(captureAttribution("", "/a", "https://lcitea.novamente.ar/")).toBeNull()
    expect(stored()).toBeNull()
  })

  it("vuelta de MercadoPago → no guarda nada", () => {
    expect(captureAttribution("", "/checkout/success", "https://www.mercadopago.com.ar/")).toBeNull()
    expect(stored()).toBeNull()
  })

  it("orgánico NO pisa un touch de campaña vigente (navegación SPA mantiene el referrer)", () => {
    captureAttribution("?utm_source=meta&utm_medium=paid&utm_campaign=egresados", "/p/x?utm_source=meta", "https://l.facebook.com/")
    const before = stored()
    vi.setSystemTime(NOW + 60_000)
    expect(captureAttribution("", "/otra", "https://l.instagram.com/")).toBeNull()
    expect(stored()).toEqual(before)
    expect(stored().utm_medium).toBe("paid")
  })

  it("orgánico NO pisa el primer touch orgánico (ni landing ni ts)", () => {
    captureAttribution("", "/landing-1", "https://www.google.com/")
    vi.setSystemTime(NOW + 24 * 60 * 60 * 1000)
    expect(captureAttribution("", "/landing-2", "https://chatgpt.com/")).toBeNull()
    expect(stored()).toMatchObject({ referrer: "https://www.google.com/", landing_page: "/landing-1", ts: NOW })
  })

  it("una campaña posterior SÍ pisa el touch orgánico (last-touch de campaña gana)", () => {
    captureAttribution("", "/landing-1", "https://www.google.com/")
    vi.setSystemTime(NOW + 60_000)
    captureAttribution("?utm_source=meta&utm_medium=paid&utm_id=120200000000000000", "/p/x", "https://l.facebook.com/")
    expect(stored()).toMatchObject({
      utm_source: "meta",
      utm_medium: "paid",
      utm_id: "120200000000000000",
      landing_page: "/p/x",
      referrer: "https://l.facebook.com/",
      ts: NOW + 60_000,
    })
  })

  it("campaña vencida (>30 días) deja entrar el touch orgánico", () => {
    captureAttribution("?utm_source=meta&utm_medium=paid", "/p/x", "")
    vi.setSystemTime(NOW + ATTRIBUTION_TTL_MS + 1)
    const rec = captureAttribution("", "/buzos", "https://www.google.com/")
    expect(rec).not.toBeNull()
    expect(stored()).toMatchObject({ utm_source: null, referrer: "https://www.google.com/", landing_page: "/buzos" })
  })

  it("touch de campaña con referrer interno guarda referrer null (como antes)", () => {
    captureAttribution("?utm_source=meta&utm_medium=paid", "/p/x", "https://www.novamente.ar/")
    expect(stored()).toMatchObject({ utm_source: "meta", referrer: null, landing_page: "/p/x" })
  })

  it("sin campaña y sin referrer no toca un registro existente", () => {
    captureAttribution("?gclid=abc", "/p/x", "")
    const before = stored()
    expect(captureAttribution("", "/otra", "")).toBeNull()
    expect(stored()).toEqual(before)
  })
})
