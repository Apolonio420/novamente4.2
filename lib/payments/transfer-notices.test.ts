import { describe, it, expect } from "vitest"
import { awaitTransferNotices } from "./transfer-notices"

describe("awaitTransferNotices", () => {
  it("espera a que terminen los avisos y reporta ok", async () => {
    const r = await awaitTransferNotices([
      { name: "telegram_ventas", promise: new Promise((res) => setTimeout(() => res({ ok: true }), 20)) },
      { name: "email_ventas", promise: Promise.resolve({ ok: true }) },
    ])
    expect(r).toEqual({ telegram_ventas: "ok", email_ventas: "ok" })
  })

  it("marca 'falló' si Telegram devuelve null o el mail ok:false, sin lanzar", async () => {
    const r = await awaitTransferNotices([
      { name: "telegram_ventas", promise: Promise.resolve(null) },
      { name: "email_ventas", promise: Promise.resolve({ ok: false, error: "x" }) },
      { name: "email_cliente", promise: Promise.reject(new Error("boom")) },
    ])
    expect(r).toEqual({ telegram_ventas: "falló", email_ventas: "falló", email_cliente: "falló" })
  })

  it("corta por timeout un aviso colgado sin bloquear a los demás", async () => {
    const t0 = Date.now()
    const r = await awaitTransferNotices(
      [
        { name: "telegram_ventas", promise: new Promise(() => {}) },
        { name: "email_ventas", promise: Promise.resolve({ ok: true }) },
      ],
      50,
    )
    expect(r).toEqual({ telegram_ventas: "timeout", email_ventas: "ok" })
    expect(Date.now() - t0).toBeLessThan(500)
  })
})
