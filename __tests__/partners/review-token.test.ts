import { describe, it, expect, beforeEach, afterEach } from "vitest"
import { createReviewToken, verifyReviewToken, DEFAULT_TTL_DAYS } from "@/lib/partners/review-token"

/**
 * Token de compra verificada.
 *
 * El badge "Compra verificada" no se puede resolver contra `orders` (los clientes
 * de las tiendas partner cierran por WhatsApp y nunca pasan por el checkout web),
 * así que se firma un token que viaja en el link post-entrega. Lo que importa:
 * que un token no sirva para otro producto/tienda, que caduque, y que sin secreto
 * configurado falle CERRADO (nunca conceda el badge por defecto).
 */

const TENANT = "cabalaurbana"
const PRODUCT = "3f2b1a44-5c6d-4e7f-8a9b-0c1d2e3f4a5b"
const OTHER_PRODUCT = "9e8d7c66-5b4a-4392-8271-6f5e4d3c2b1a"
const DAY_MS = 86_400_000

let prevSecret: string | undefined
let prevJwt: string | undefined

beforeEach(() => {
  prevSecret = process.env.REVIEW_TOKEN_SECRET
  prevJwt = process.env.SUPABASE_JWT_SECRET
  process.env.REVIEW_TOKEN_SECRET = "test-secret-para-reseñas"
})

afterEach(() => {
  if (prevSecret === undefined) delete process.env.REVIEW_TOKEN_SECRET
  else process.env.REVIEW_TOKEN_SECRET = prevSecret
  if (prevJwt === undefined) delete process.env.SUPABASE_JWT_SECRET
  else process.env.SUPABASE_JWT_SECRET = prevJwt
})

describe("review token", () => {
  it("valida el token del par (tienda, producto) para el que se emitió", () => {
    const token = createReviewToken(TENANT, PRODUCT)
    expect(verifyReviewToken(token, TENANT, PRODUCT)).toBe(true)
  })

  it("entra cómodo en un mensaje de WhatsApp", () => {
    expect(createReviewToken(TENANT, PRODUCT).length).toBeLessThanOrEqual(24)
  })

  it("no sirve para otro producto de la misma tienda", () => {
    const token = createReviewToken(TENANT, PRODUCT)
    expect(verifyReviewToken(token, TENANT, OTHER_PRODUCT)).toBe(false)
  })

  it("no sirve para otra tienda", () => {
    const token = createReviewToken(TENANT, PRODUCT)
    expect(verifyReviewToken(token, "otra-tienda", PRODUCT)).toBe(false)
  })

  it("caduca pasado el TTL", () => {
    const now = Date.UTC(2026, 7, 11)
    const token = createReviewToken(TENANT, PRODUCT, 30, now)
    expect(verifyReviewToken(token, TENANT, PRODUCT, now + 29 * DAY_MS)).toBe(true)
    expect(verifyReviewToken(token, TENANT, PRODUCT, now + 31 * DAY_MS)).toBe(false)
  })

  it("el TTL por defecto sigue vivo a los 90 días", () => {
    const now = Date.UTC(2026, 7, 11)
    const token = createReviewToken(TENANT, PRODUCT, DEFAULT_TTL_DAYS, now)
    expect(verifyReviewToken(token, TENANT, PRODUCT, now + 90 * DAY_MS)).toBe(true)
  })

  it("rechaza firma alterada, expiración alterada y basura", () => {
    const token = createReviewToken(TENANT, PRODUCT)
    const [exp, sig] = token.split(".")

    // firma cambiada (mismo largo)
    const flipped = sig[0] === "a" ? "b" : "a"
    expect(verifyReviewToken(`${exp}.${flipped}${sig.slice(1)}`, TENANT, PRODUCT)).toBe(false)

    // expiración estirada a mano → la firma ya no cierra
    const farFuture = (parseInt(exp, 36) + 5000).toString(36)
    expect(verifyReviewToken(`${farFuture}.${sig}`, TENANT, PRODUCT)).toBe(false)

    for (const junk of ["", ".", "abc", `${exp}.`, `.${sig}`, "null", `${exp}.${sig}extra`]) {
      expect(verifyReviewToken(junk, TENANT, PRODUCT)).toBe(false)
    }
    expect(verifyReviewToken(null, TENANT, PRODUCT)).toBe(false)
    expect(verifyReviewToken(undefined, TENANT, PRODUCT)).toBe(false)
  })

  it("sin secreto configurado falla CERRADO", () => {
    const token = createReviewToken(TENANT, PRODUCT)
    delete process.env.REVIEW_TOKEN_SECRET
    delete process.env.SUPABASE_JWT_SECRET
    expect(verifyReviewToken(token, TENANT, PRODUCT)).toBe(false)
    expect(() => createReviewToken(TENANT, PRODUCT)).toThrow()
  })

  it("un token firmado con otro secreto no vale", () => {
    const token = createReviewToken(TENANT, PRODUCT)
    process.env.REVIEW_TOKEN_SECRET = "otro-secreto"
    expect(verifyReviewToken(token, TENANT, PRODUCT)).toBe(false)
  })

  it("cae a SUPABASE_JWT_SECRET si no hay REVIEW_TOKEN_SECRET", () => {
    delete process.env.REVIEW_TOKEN_SECRET
    process.env.SUPABASE_JWT_SECRET = "jwt-secret-de-prueba"
    const token = createReviewToken(TENANT, PRODUCT)
    expect(verifyReviewToken(token, TENANT, PRODUCT)).toBe(true)
  })
})
