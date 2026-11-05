import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextRequest } from "next/server"
import { parseImageFeedback } from "@/lib/designer/image-feedback"

const upsert = vi.fn()
const countResult = { count: 0, error: null as any }
vi.mock("@/lib/supabase-admin", () => ({
  supabaseAdmin: {
    from: () => ({
      select: () => ({ eq: () => ({ gte: () => Promise.resolve(countResult) }) }),
      upsert: (...args: any[]) => upsert(...args),
    }),
  },
}))
vi.mock("next/headers", () => ({ cookies: async () => ({ get: () => ({ value: "sess-123456" }) }) }))

import { POST } from "@/app/api/public/design/feedback/route"

const ID = "3f2b8c1e-9a4d-4e7b-8c2a-1d5e6f7a8b9c"
const good = {
  id: ID,
  rating: 1,
  operation: "edit",
  prompt: "haceme el delfín más chico",
  imageUrl: "https://pub-abc.r2.dev/v1/edited-designs/1793899072521-gu3u9.png",
  garmentType: "remera",
  garmentColor: "blanco",
}
const req = (body: unknown) =>
  new NextRequest("http://localhost:3000/api/public/design/feedback", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-forwarded-for": "1.2.3.4" },
    body: JSON.stringify(body),
  })

beforeEach(() => {
  vi.clearAllMocks()
  countResult.count = 0
  countResult.error = null
  upsert.mockResolvedValue({ error: null })
})

describe("parseImageFeedback", () => {
  it("acepta una carita válida", () => {
    expect(parseImageFeedback(good)).toMatchObject({ ok: true, value: { rating: 1, operation: "edit" } })
  })
  it.each([
    [{ ...good, rating: 5 }, "rating"],
    [{ ...good, operation: "hackear" }, "operation"],
    [{ ...good, id: "1" }, "id"],
    [{ ...good, imageUrl: "https://evil.example.com/x.png" }, "imageUrl"],
    [{ ...good, imageUrl: "data:image/png;base64,AAAA" }, "imageUrl"],
  ])("rechaza %o (%s)", (body, campo) => {
    const r = parseImageFeedback(body)
    expect(r.ok).toBe(false)
    expect("error" in r && r.error).toMatch(campo)
  })
  it("acepta el proxy propio y corta el prompt largo", () => {
    const r = parseImageFeedback({ ...good, imageUrl: "/api/proxy-image?key=v1/raw-designs/x.png", prompt: "a".repeat(5000) })
    expect(r.ok && r.value.prompt?.length).toBe(1000)
  })
})

describe("POST /api/public/design/feedback", () => {
  it("guarda rating, operación, prompt e imagen con ip_hash (no la IP)", async () => {
    const res = await POST(req(good))
    expect(await res.json()).toEqual({ saved: true })
    const [row, opts] = upsert.mock.calls[0]
    expect(row).toMatchObject({ id: ID, rating: 1, operation: "edit", prompt: good.prompt, image_url: good.imageUrl, session_id: "sess-123456" })
    expect(row.ip_hash).toMatch(/^[0-9a-f]{32}$/)
    expect(JSON.stringify(row)).not.toContain("1.2.3.4")
    expect(opts).toEqual({ onConflict: "id" })
  })
  it("si la tabla no existe todavía, no rompe /crear", async () => {
    countResult.error = { code: "PGRST205", message: "Could not find the table 'public.studio_image_feedback' in the schema cache" }
    const res = await POST(req(good))
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ saved: false })
  })
  it("corta a 120 votos por hora por visitante", async () => {
    countResult.count = 120
    expect((await POST(req(good))).status).toBe(429)
    expect(upsert).not.toHaveBeenCalled()
  })
  it("400 con body inválido", async () => {
    expect((await POST(req({ ...good, rating: 0 }))).status).toBe(400)
  })
})
