// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextRequest } from "next/server"

vi.hoisted(() => { process.env.TRANSFER_CONFIRM_SECRET = "test-secret" })
const db = vi.hoisted(() => ({ getOrderByNumber: vi.fn(), updateOrder: vi.fn() }))
const mail = vi.hoisted(() => ({ sendEmail: vi.fn() }))
const saleEffects = vi.hoisted(() => ({
  runPartnerSaleEffects: vi.fn(async (..._args: any[]) => ({ meta: {}, credit: { margin: 0, needsReview: false, credits: [], excluded: [] } })),
  partnerSaleKey: vi.fn((..._args: any[]) => "transfer:NOV-20260926-9852"),
}))
const paidAt = vi.hoisted(() => ({ markPaidAtIfMissing: vi.fn(async () => undefined) }))
vi.mock("@/lib/db", () => db)
vi.mock("@/lib/email", () => mail)
vi.mock("@/lib/notifications", () => ({ notifySale: vi.fn() }))
vi.mock("@/lib/partners/sale-effects", () => saleEffects)
vi.mock("@/lib/supabase-admin", () => ({ supabaseAdmin: {} }))
vi.mock("@/lib/payments/paid-at", () => paidAt)

import { GET, POST } from "./route"
import { transferConfirmSig } from "@/lib/payments/transfer-confirm"

const ORDER = "NOV-20260926-9852"
const pending = (tenantId: string | null = null) => ({
  id: "o1", order_number: ORDER, payment_method: "transferencia", payment_status: "pending",
  total: 111400, customer_email: "cliente@example.com", customer_first_name: "Seba", items: [{ item_name: "Buzo", quantity: 1, product_size: "L" }],
  tenant_id: tenantId,
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
    // Fecha de venta = fecha de COBRO (03/10/2026): confirmar transferencia marca paid_at.
    expect(paidAt.markPaidAtIfMissing).toHaveBeenCalledWith({}, "o1")
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
    expect(saleEffects.runPartnerSaleEffects).not.toHaveBeenCalled()
    expect(paidAt.markPaidAtIfMissing).not.toHaveBeenCalled()
  })

  // 27/09/2026 (NOV-20260926-9852): una transferencia confirmada por este link
  // NUNCA acreditaba nada al partner. POST ahora corre los mismos efectos que
  // un pago de MercadoPago aprobado (ganancia al ledger, bridge, mail).
  describe("venta de tienda partner", () => {
    it("orden CON tenant_id: pone status confirmed y llama runPartnerSaleEffects 1 vez con la saleKey de transferencia y notifyPartner true", async () => {
      db.getOrderByNumber.mockResolvedValue(pending("tenant-sponsors"))

      const res = await POST(post())

      expect(res.status).toBe(200)
      expect(db.updateOrder).toHaveBeenCalledWith(
        "o1",
        expect.objectContaining({ payment_status: "approved", status: "confirmed", payment_id: "manual" }),
      )
      expect(saleEffects.runPartnerSaleEffects).toHaveBeenCalledTimes(1)
      const [orderArg, optsArg] = saleEffects.runPartnerSaleEffects.mock.calls[0]
      expect(orderArg).toMatchObject({ id: "o1", tenant_id: "tenant-sponsors", payment_status: "approved", status: "confirmed" })
      expect(optsArg.notifyPartner).toBe(true)
      expect(optsArg.saleKey).toBe("transfer:NOV-20260926-9852")
      expect(saleEffects.partnerSaleKey).toHaveBeenCalledWith(orderArg)
    })

    it("orden SIN tenant_id: no llama runPartnerSaleEffects", async () => {
      db.getOrderByNumber.mockResolvedValue(pending(null))

      const res = await POST(post())

      expect(res.status).toBe(200)
      expect(db.updateOrder).toHaveBeenCalled() // la orden igual se confirma
      expect(saleEffects.runPartnerSaleEffects).not.toHaveBeenCalled()
    })
  })
})
