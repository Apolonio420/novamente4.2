/**
 * withAdRef taggea los links de WhatsApp con el ad id de Meta (ver contrato
 * completo en el docstring de lib/wa-ref.ts). El bot parsea el token
 * " · a:<b36>" tal cual — estos tests fijan el contrato byte a byte.
 */
import { describe, it, expect } from "vitest"
import { withAdRef, computeAdToken, UNTAGGED_PREFILL_REFS } from "./wa-ref"
import { ATTRIBUTION_TTL_MS } from "./attribution"
import { getWhatsAppLink, WHATSAPP_MESSAGES, WHATSAPP_URL_BASE } from "./config/links"

const now = Date.now()
const validAttribution = { utm_id: "120250007405950484", ts: now }
// BigInt("120250007405950484").toString(36)
const TOKEN_18_DIGIT = "ww12irybggk"

/**
 * Inverso de BigInt(n).toString(36), vía BigInt (sin pasar por Number).
 * Sin literales `36n`/`0n`: el target del proyecto es ES6 (ver tsconfig.json).
 */
function fromBase36(token: string): bigint {
  const digits = "0123456789abcdefghijklmnopqrstuvwxyz"
  const base = BigInt(36)
  return token.split("").reduce((acc, ch) => acc * base + BigInt(digits.indexOf(ch)), BigInt(0))
}

describe("withAdRef", () => {
  it("NV-WEB: taggea el link genérico", () => {
    const url = getWhatsAppLink(WHATSAPP_MESSAGES.GENERIC)
    const out = withAdRef(url, validAttribution)
    const text = decodeURIComponent(new URL(out).searchParams.get("text")!)
    expect(text).toBe(`Hola Novamente! Quiero info de merchandising. (ref · NV-WEB · a:${TOKEN_18_DIGIT})`)
  })

  it("NV-FAQ: taggea el link de preguntas frecuentes", () => {
    const url = getWhatsAppLink(WHATSAPP_MESSAGES.FAQ)
    const out = withAdRef(url, validAttribution)
    const text = decodeURIComponent(new URL(out).searchParams.get("text")!)
    expect(text.endsWith(`(ref · NV-FAQ · a:${TOKEN_18_DIGIT})`)).toBe(true)
  })

  it("NV-PDP: taggea el link de detalle de producto", () => {
    const url = getWhatsAppLink(WHATSAPP_MESSAGES.PRODUCT_DETAIL)
    const out = withAdRef(url, validAttribution)
    const text = decodeURIComponent(new URL(out).searchParams.get("text")!)
    expect(text.endsWith(`(ref · NV-PDP · a:${TOKEN_18_DIGIT})`)).toBe(true)
  })

  it("NV-PARTNER: taggea el link de partners", () => {
    const url = getWhatsAppLink(WHATSAPP_MESSAGES.PARTNER)
    const out = withAdRef(url, validAttribution)
    const text = decodeURIComponent(new URL(out).searchParams.get("text")!)
    expect(text.endsWith(`(ref · NV-PARTNER · a:${TOKEN_18_DIGIT})`)).toBe(true)
  })

  it("NV-EGR2026: taggea el link de buzos de egresados (app/buzos-egresados/page.tsx)", () => {
    const original = "Hola! Quiero cotizar buzos de egresados para mi curso 🎓 (ref · NV-EGR2026)"
    const url = `${WHATSAPP_URL_BASE}?text=${encodeURIComponent(original)}`
    const out = withAdRef(url, validAttribution)
    const text = decodeURIComponent(new URL(out).searchParams.get("text")!)
    expect(text).toBe(`Hola! Quiero cotizar buzos de egresados para mi curso 🎓 (ref · NV-EGR2026 · a:${TOKEN_18_DIGIT})`)
  })

  it("NV-MAYOR: agrega el ref tag al prefill de remeras-por-mayor, que hoy no trae ninguno", () => {
    const [{ text: original }] = UNTAGGED_PREFILL_REFS
    const url = `${WHATSAPP_URL_BASE}?text=${encodeURIComponent(original)}`
    const out = withAdRef(url, validAttribution)
    const text = decodeURIComponent(new URL(out).searchParams.get("text")!)
    expect(text).toBe(`${original} (ref · NV-MAYOR · a:${TOKEN_18_DIGIT})`)
  })

  it("NV-DEPORTE: agrega el ref tag al prefill de indumentaria-deportiva, que hoy no trae ninguno", () => {
    const [, { text: original }] = UNTAGGED_PREFILL_REFS
    const url = `${WHATSAPP_URL_BASE}?text=${encodeURIComponent(original)}`
    const out = withAdRef(url, validAttribution)
    const text = decodeURIComponent(new URL(out).searchParams.get("text")!)
    expect(text).toBe(`${original} (ref · NV-DEPORTE · a:${TOKEN_18_DIGIT})`)
  })

  it("sin atribución (null) → el link queda EXACTAMENTE igual", () => {
    const url = getWhatsAppLink(WHATSAPP_MESSAGES.GENERIC)
    expect(withAdRef(url, null)).toBe(url)
    expect(withAdRef(url, undefined)).toBe(url)
  })

  it("atribución vencida (fuera del TTL de 30 días) → el link queda igual", () => {
    const url = getWhatsAppLink(WHATSAPP_MESSAGES.GENERIC)
    const expired = { utm_id: "120250007405950484", ts: now - ATTRIBUTION_TTL_MS - 1 }
    expect(withAdRef(url, expired)).toBe(url)
  })

  it("utm_id no numérico → el link queda igual", () => {
    const url = getWhatsAppLink(WHATSAPP_MESSAGES.GENERIC)
    const bad = { utm_id: "abc123", ts: now }
    expect(withAdRef(url, bad)).toBe(url)
  })

  it("utm_id vacío o null → el link queda igual", () => {
    const url = getWhatsAppLink(WHATSAPP_MESSAGES.GENERIC)
    expect(withAdRef(url, { utm_id: null, ts: now })).toBe(url)
    expect(withAdRef(url, { utm_id: "", ts: now })).toBe(url)
  })

  it("encodea el text= con encodeURIComponent (%20/!), NO con URLSearchParams (+/%21)", () => {
    // Regresión: URL.searchParams.set()+toString() encodea distinto
    // (application/x-www-form-urlencoded: espacio="+", "!"="%21") que el
    // resto del código (encodeURIComponent: espacio="%20", "!" literal).
    // wa.me espera el estilo encodeURIComponent — "+" se arriesga a llegar
    // literal al mensaje prefijado en WhatsApp.
    const url = getWhatsAppLink(WHATSAPP_MESSAGES.GENERIC) // tiene "!" y espacios
    const out = withAdRef(url, validAttribution)
    expect(out).not.toContain("+")
    expect(out).not.toContain("%21")
    expect(out).toContain("Hola%20Novamente!%20Quiero")
  })

  it("id de 18 dígitos redondea correctamente vía BigInt (no Number, que pierde precisión > 2^53)", () => {
    const id = "120250007405950484"
    const url = getWhatsAppLink(WHATSAPP_MESSAGES.GENERIC)
    const out = withAdRef(url, { utm_id: id, ts: now })
    const text = decodeURIComponent(new URL(out).searchParams.get("text")!)
    expect(text).toContain(`a:${TOKEN_18_DIGIT}`)
    // Round-trip manual en base36 (vía BigInt, sin pasar por Number en ningún punto)
    // confirma que el token no perdió dígitos.
    expect(fromBase36(TOKEN_18_DIGIT).toString()).toBe(id)
    // Contraste: Number(id).toString(36) da un token DISTINTO (pierde precisión
    // por encima de 2^53) — si withAdRef usara Number en vez de BigInt, este
    // test de arriba fallaría.
    expect(Number(id).toString(36)).not.toBe(TOKEN_18_DIGIT)
  })

  it("preserva otros parámetros de la URL ademas de text", () => {
    const url = `${WHATSAPP_URL_BASE}?utm_source=internal&text=${encodeURIComponent(WHATSAPP_MESSAGES.GENERIC)}&foo=bar`
    const out = withAdRef(url, validAttribution)
    const parsed = new URL(out)
    expect(parsed.searchParams.get("utm_source")).toBe("internal")
    expect(parsed.searchParams.get("foo")).toBe("bar")
    expect(decodeURIComponent(parsed.searchParams.get("text")!)).toContain(`a:${TOKEN_18_DIGIT}`)
  })

  it("un link ya taggeado no se taggea dos veces (idempotente)", () => {
    const url = getWhatsAppLink(WHATSAPP_MESSAGES.GENERIC)
    const once = withAdRef(url, validAttribution)
    const twice = withAdRef(once, validAttribution)
    expect(twice).toBe(once)
    const text = decodeURIComponent(new URL(twice).searchParams.get("text")!)
    expect(text.match(/a:[0-9a-z]+/g)?.length).toBe(1)
  })

  it("un texto sin ref tag que no matchea ninguno de los 2 prefills conocidos queda igual", () => {
    const url = `${WHATSAPP_URL_BASE}?text=${encodeURIComponent("Hola, un mensaje cualquiera sin ref tag")}`
    expect(withAdRef(url, validAttribution)).toBe(url)
  })

  it("un link que no es wa.me/api.whatsapp.com del número comercial queda igual (ej. número de un partner)", () => {
    const url = `https://wa.me/5491122223333?text=${encodeURIComponent(WHATSAPP_MESSAGES.GENERIC)}`
    expect(withAdRef(url, validAttribution)).toBe(url)
  })

  it("una URL sin parámetro text queda igual", () => {
    const url = `${WHATSAPP_URL_BASE}?foo=bar`
    expect(withAdRef(url, validAttribution)).toBe(url)
  })

  it("utm_id demasiado corto (<6 dígitos) o demasiado largo (>20 dígitos) no aplica", () => {
    const url = getWhatsAppLink(WHATSAPP_MESSAGES.GENERIC)
    expect(withAdRef(url, { utm_id: "123", ts: now })).toBe(url)
    expect(withAdRef(url, { utm_id: "1".repeat(21), ts: now })).toBe(url)
  })
})

describe("computeAdToken", () => {
  it("null/undefined → null", () => {
    expect(computeAdToken(null)).toBeNull()
    expect(computeAdToken(undefined)).toBeNull()
  })

  it("respeta el TTL exacto de 30 días", () => {
    expect(computeAdToken({ utm_id: "123456", ts: now - ATTRIBUTION_TTL_MS + 1000 }, now)).not.toBeNull()
    expect(computeAdToken({ utm_id: "123456", ts: now - ATTRIBUTION_TTL_MS - 1000 }, now)).toBeNull()
  })

  it("usa BigInt para ids de 18 dígitos (round-trip exacto)", () => {
    const id = "120250007405950484"
    const token = computeAdToken({ utm_id: id, ts: now }, now)
    expect(token).toBe(TOKEN_18_DIGIT)
    expect(fromBase36(token!).toString()).toBe(id)
  })
})
