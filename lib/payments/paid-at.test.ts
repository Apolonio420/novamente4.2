import { describe, it, expect, vi } from "vitest"
import { isMissingColumnError, markPaidAtIfMissing } from "./paid-at"

function makeSupabaseStub(result: { error: unknown }) {
  const isMock = vi.fn().mockResolvedValue(result)
  const eqMock = vi.fn().mockReturnValue({ is: isMock })
  const updateMock = vi.fn().mockReturnValue({ eq: eqMock })
  const fromMock = vi.fn().mockReturnValue({ update: updateMock })
  return { from: fromMock, updateMock, eqMock, isMock }
}

describe("isMissingColumnError", () => {
  it("reconoce PGRST204 (postgrest, columna ausente del schema cacheado)", () => {
    expect(isMissingColumnError({ code: "PGRST204" })).toBe(true)
  })
  it("reconoce 42703 (postgres nativo)", () => {
    expect(isMissingColumnError({ code: "42703" })).toBe(true)
  })
  it("reconoce por mensaje si el code no viene", () => {
    expect(isMissingColumnError({ message: "column orders.paid_at does not exist" })).toBe(true)
  })
  it("no confunde otros errores", () => {
    expect(isMissingColumnError({ code: "23505", message: "duplicate key" })).toBe(false)
  })
  it("tolera null/undefined", () => {
    expect(isMissingColumnError(null)).toBe(false)
    expect(isMissingColumnError(undefined)).toBe(false)
  })
})

describe("markPaidAtIfMissing", () => {
  it("hace UPDATE condicional .is(paid_at, null) sobre orders/id", async () => {
    const stub = makeSupabaseStub({ error: null })
    await markPaidAtIfMissing(stub as any, "order-1")
    expect(stub.from).toHaveBeenCalledWith("orders")
    expect(stub.updateMock).toHaveBeenCalledWith({ paid_at: expect.any(String) })
    expect(stub.eqMock).toHaveBeenCalledWith("id", "order-1")
    expect(stub.isMock).toHaveBeenCalledWith("paid_at", null)
  })

  it("nunca lanza si el error es columna ausente (PGRST204) — solo loguea", async () => {
    const stub = makeSupabaseStub({ error: { code: "PGRST204", message: "col missing" } })
    const spy = vi.spyOn(console, "error").mockImplementation(() => {})
    await expect(markPaidAtIfMissing(stub as any, "order-2")).resolves.toBeUndefined()
    expect(spy).not.toHaveBeenCalled()
    spy.mockRestore()
  })

  it("loguea (pero no lanza) otros errores reales", async () => {
    const stub = makeSupabaseStub({ error: { code: "23505", message: "conflict" } })
    const spy = vi.spyOn(console, "error").mockImplementation(() => {})
    await expect(markPaidAtIfMissing(stub as any, "order-3")).resolves.toBeUndefined()
    expect(spy).toHaveBeenCalled()
    spy.mockRestore()
  })

  it("nunca lanza si supabase explota (excepción)", async () => {
    const from = vi.fn(() => { throw new Error("conexión caída") })
    const spy = vi.spyOn(console, "error").mockImplementation(() => {})
    await expect(markPaidAtIfMissing({ from } as any, "order-4")).resolves.toBeUndefined()
    expect(spy).toHaveBeenCalled()
    spy.mockRestore()
  })
})
