import { describe, it, expect, vi, beforeEach } from "vitest"
import { readFileSync } from "node:fs"
import path from "node:path"
import { NextRequest } from "next/server"

// Caso real 05/11 (/crear): "Hacé que el delfín esté como saliendo del agua y
// ajustá los tamaños para que sean más proporcionales…" → Gemini devolvió la
// misma imagen y se mostró como "Acá va la versión actualizada". Fixtures =
// imágenes reales de R2 achicadas a 128 px (entrada y salida de esa edición).
const FIX = path.join(__dirname, "fixtures/edit-change")
const png = (name: string) => readFileSync(path.join(FIX, `${name}.png`))

const mockGuard = vi.fn()
vi.mock("@/lib/security/public-image-guard", () => ({
  guardPublicImageGen: (...args: any[]) => mockGuard(...args),
}))
const mockMeter = vi.fn().mockResolvedValue(undefined)
vi.mock("@/lib/security/meter-usage", () => ({
  meterPublicImageGen: (...args: any[]) => mockMeter(...args),
}))
const mockUploadFile = vi.fn().mockResolvedValue({ url: "https://r2.example.com/v1/edited-designs/x.png", provider: "r2" })
vi.mock("@/lib/cloudflare-r2", () => ({
  uploadFile: (...args: any[]) => mockUploadFile(...args),
}))
vi.mock("@/lib/absolute-url", () => ({ resolveAbsoluteUrl: (u: string) => u }))

const mockGenerate = vi.fn()
const modelsUsed: string[] = []
vi.mock("@google/generative-ai", () => ({
  GoogleGenerativeAI: class {
    getGenerativeModel({ model }: { model: string }) {
      return { generateContent: (...args: any[]) => { modelsUsed.push(model); return mockGenerate(...args) } }
    }
  },
}))

process.env.GEMINI_API_KEY = "test-key"
import { POST } from "@/app/api/public/design/edit/route"

const geminiReturns = (buf: Buffer) => ({
  response: { candidates: [{ content: { parts: [{ inlineData: { mimeType: "image/png", data: buf.toString("base64") } }] } }] },
})

function req(instruction: string) {
  return new NextRequest("http://localhost:3000/api/public/design/edit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ previousImageUrl: "https://r2.example.com/in.png", instruction, mode: "illustration", raw: true, garmentColor: "blanco" }),
  })
}

const INSTRUCTION = "Hace que el delfin este como saliendo del agua y ajusta los tamaños para que sean mas proporcionales a la realidad. La camioneta que no tape tanto el mar"

beforeEach(() => {
  vi.clearAllMocks()
  modelsUsed.length = 0
  mockGuard.mockResolvedValue({ allowed: true })
  const input = png("delfin-in")
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(input, { status: 200, headers: { "content-type": "image/png" } })))
})

describe("POST /api/public/design/edit — misma imagen", () => {
  it("si Gemini devuelve la misma imagen dos veces, avisa unchanged y no sube nada", async () => {
    mockGenerate.mockResolvedValue(geminiReturns(png("delfin-out")))
    const res = await POST(req(INSTRUCTION))
    const data = await res.json()
    expect(data.unchanged).toBe(true)
    expect(data.images).toBeUndefined()
    expect(mockGenerate).toHaveBeenCalledTimes(2) // un solo reintento
    expect(mockMeter).toHaveBeenCalledTimes(2) // se factura cada llamada
    expect(mockUploadFile).not.toHaveBeenCalled()
    // el reintento usa un prompt reformulado, no el mismo
    const p1 = mockGenerate.mock.calls[0][0][1] as string
    const p2 = mockGenerate.mock.calls[1][0][1] as string
    expect(p2).not.toBe(p1)
    expect(p2).toMatch(/previous attempt returned this image practically UNCHANGED/)
    // el reintento va con 3.1-flash (flash, no pro): 2.5 se queda pegado
    expect(modelsUsed).toEqual(["gemini-2.5-flash-image", "gemini-3.1-flash-image"])
    expect(mockMeter.mock.calls.map((c) => c[0].model)).toEqual(["gemini-2.5-flash-image", "gemini-3.1-flash-image"])
    expect(modelsUsed.some((m) => /pro/.test(m))).toBe(false)
  })

  it("si el reintento revienta (503), avisa unchanged en vez de devolver 500", async () => {
    mockGenerate
      .mockResolvedValueOnce(geminiReturns(png("delfin-out")))
      .mockRejectedValueOnce(new Error("503 Service Unavailable"))
    const res = await POST(req(INSTRUCTION))
    expect(res.status).toBe(200)
    expect((await res.json()).unchanged).toBe(true)
  })

  it("si el reintento sí cambia, devuelve la imagen del reintento", async () => {
    mockGenerate
      .mockResolvedValueOnce(geminiReturns(png("delfin-out")))
      .mockResolvedValueOnce(geminiReturns(png("ocultista-in"))) // otra imagen = cambió
    const res = await POST(req(INSTRUCTION))
    const data = await res.json()
    expect(data.success).toBe(true)
    expect(data.attempts).toBe(2)
    expect(data.images[0].url).toBeTruthy()
    expect(mockUploadFile).toHaveBeenCalledTimes(1)
  })

  it("si la primera edición cambia, no reintenta (sin costo extra)", async () => {
    mockGenerate.mockResolvedValue(geminiReturns(png("ocultista-in")))
    const res = await POST(req(INSTRUCTION))
    const data = await res.json()
    expect(data.success).toBe(true)
    expect(data.attempts).toBe(1)
    expect(mockGenerate).toHaveBeenCalledTimes(1)
    expect(mockMeter).toHaveBeenCalledTimes(1)
  })

  it("manda la imagen actual (la de entrada) y la instrucción del usuario a Gemini", async () => {
    mockGenerate.mockResolvedValue(geminiReturns(png("ocultista-in")))
    await POST(req(INSTRUCTION))
    const [parts] = mockGenerate.mock.calls[0]
    expect(parts[0].inlineData.data).toBe(png("delfin-in").toString("base64"))
    expect(parts[1]).toContain(INSTRUCTION)
    expect(parts[1]).not.toMatch(/preserving the overall composition/i)
  })
})
