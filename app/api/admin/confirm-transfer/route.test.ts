// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextRequest } from "next/server"

vi.hoisted(() => { process.env.TRANSFER_CONFIRM_SECRET = "test-secret" })
const db = vi.hoisted(() => ({ getOrderByNumber: vi.fn(), updateOrder: vi.fn() }))
const mail = vi.hoisted(() => ({ sendEmail: vi.fn() }))
vi.mock("@/lib/db", () => db)
vi.mock("@/lib/email", () => mail)
vi.mock("@/lib/notifications", () => ({ notifySale: vi.fn() }))

import { GET, POST } from "./route"
import { transferConfirmSig } from "@/lib/payments/transfer-confirm"

const ORDER = "NOV-20260926-9852"
const pending = () => ({
  id: "o1", order_number: ORDER, payment_method: "transferencia", payment_status: "pending",
  total: 111400, customer_email: "cliente@example.com", customer_first_name: "Seba", items: [{ item_name: "Buzo", quantity: 1, product_size: "L" }],
})
const url = (sig = transferConfirmSig(ORDER, "manual")) =>
  `https://www.novamente.ar/api/admin/confirm-transfer?order=${ORDER}&op=manual&sig=${sig}`
const post = (sig = transferConfirmSig(ORDER, "manual")) => {
  const f = new FormData()
  f.set("order", ORDER); f.set("op", "manual"); f.set("sig", sig)
  return new NextRequest("https://www.novamente.ar/api/admin/confirm-transfer", { method: "POST", body: f })
}

beforeEach(() => {
  vi.clearAllMocks()
  db.getOrderByNumber.mockResolvedValue(pending())
  db.updateOrder.mockResolvedValue(true)
  mail.sendEmail.mockResolvedValue({ ok: true })
})

describe("confirm-transfer", () => {
  it("GET (lo que hace un preview de Telegram / escáner de mail) NO confirma ni manda mails", async () => {
    const res = await GET(new NextRequest(url()))
    const html = await res.text()
    expect(res.status).toBe(200)
    expect(html).toContain('method="POST"')
    expect(db.updateOrder).not.toHaveBeenCalled()
    expect(mail.sendEmail).not.toHaveBeenCalled()
  })

  it("POST con firma válida confirma y avisa al cliente", async () => {
    const res = await POST(post())
    expect(res.status).toBe(200)
    expect(db.updateOrder).toHaveBeenCalledWith("o1", expect.objectContaining({ payment_status: "approved", payment_id: "manual" }))
    expect(mail.sendEmail).toHaveBeenCalledWith(expect.objectContaining({ to: "cliente@example.com" }))
  })

  it("POST con firma inválida no toca nada", async () => {
    const res = await POST(post("x".repeat(64)))
    expect(res.status).toBe(400)
    expect(db.updateOrder).not.toHaveBeenCalled()
  })

  it("POST sobre orden ya aprobada es idempotente", async () => {
    db.getOrderByNumber.mockResolvedValue({ ...pending(), payment_status: "approved", payment_id: "123" })
    const res = await POST(post())
    expect(await res.text()).toContain("ya estaba confirmado")
    expect(db.updateOrder).not.toHaveBeenCalled()
  })
})
