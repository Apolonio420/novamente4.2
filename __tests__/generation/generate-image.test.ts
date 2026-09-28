import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextRequest } from "next/server"

// --- Mocks ---

// Guard publico (rate-limit por IP + topes, DB-backed): tiene su propia suite
// en lib/security/public-image-guard.test.ts. Aca solo importa que el route
// lo consulte y respete su respuesta.
const mockGuard = vi.fn()
vi.mock("@/lib/security/public-image-guard", () => ({
  guardPublicImageGen: (...args: any[]) => mockGuard(...args),
}))

// Metering de costo (escribe en api_usage) y telemetria (lib/db): sin DB en tests
const mockMeter = vi.fn().mockResolvedValue(undefined)
vi.mock("@/lib/security/meter-usage", () => ({
  meterPublicImageGen: (...args: any[]) => mockMeter(...args),
}))
vi.mock("@/lib/db", () => ({
  saveGeneratedImage: vi.fn().mockResolvedValue(undefined),
}))

// Mock R2 upload
const mockUploadFile = vi.fn().mockResolvedValue({
  url: "https://r2.example.com/v1/raw-designs/test.png",
  provider: "r2" as const,
})
vi.mock("@/lib/cloudflare-r2", () => ({
  uploadFile: (...args: any[]) => mockUploadFile(...args),
}))

vi.mock("@/lib/r2", () => ({
  toPublicR2Url: (key: string) => `https://r2.example.com/${key}`,
}))

// Mock notifications
vi.mock("@/lib/notifications", () => ({
  notifyError: vi.fn().mockResolvedValue(undefined),
}))

// Gemini, SDK viejo (@google/generative-ai): el route solo lo usa para
// reescribir el prompt en modo iteracion (instruction + lastPrompt).
const mockTextGenerateContent = vi.fn()
vi.mock("@google/generative-ai", () => {
  return {
    GoogleGenerativeAI: class {
      getGenerativeModel() {
        return {
          generateContent: (...args: any[]) => mockTextGenerateContent(...args),
        }
      }
    },
  }
})

// Gemini, SDK nuevo (@google/genai): la generacion de imagen va por aca desde
// que el route pasa imageConfig.aspectRatio. Forma de la respuesta: candidates
// directo en el resultado (no bajo `.response`) y `text` es un getter.
const mockImageGenerateContent = vi.fn()
vi.mock("@google/genai", () => {
  return {
    GoogleGenAI: class {
      models = {
        generateContent: (...args: any[]) => mockImageGenerateContent(...args),
      }
    },
  }
})

// Set env
process.env.GEMINI_API_KEY = "test-key"

// Import route AFTER mocks
import { POST } from "@/app/api/generate-image/route"

function makeRequest(body: Record<string, unknown>): NextRequest {
  return new NextRequest("http://localhost:3000/api/generate-image", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
}

function imageResponse(...base64s: string[]) {
  return {
    candidates: [
      {
        content: {
          parts: base64s.map((data) => ({ inlineData: { mimeType: "image/png", data } })),
        },
      },
    ],
    text: undefined,
    usageMetadata: { promptTokenCount: 10, candidatesTokenCount: 1290 },
  }
}

function textResponse(text: string) {
  return {
    candidates: [{ content: { parts: [{ text }] } }],
    text,
  }
}

// Helper: Gemini returns an image
function mockGeminiImage(base64 = "iVBORw0KGgoAAAANSUhEUg==") {
  mockImageGenerateContent.mockResolvedValue(imageResponse(base64))
}

// Helper: Gemini returns only text (no image)
function mockGeminiTextOnly(text = "I cannot generate images") {
  mockImageGenerateContent.mockResolvedValue(textResponse(text))
}

describe("POST /api/generate-image", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockImageGenerateContent.mockReset()
    mockTextGenerateContent.mockReset()
    mockGuard.mockResolvedValue({ allowed: true })
    mockUploadFile.mockResolvedValue({
      url: "https://r2.example.com/v1/raw-designs/test.png",
      provider: "r2" as const,
    })
  })

  // --- A) Core tests ---

  it("returns image URL with valid prompt", async () => {
    mockGeminiImage()
    const res = await POST(makeRequest({ prompt: "a red dragon" }))
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.success).toBe(true)
    expect(json.images).toHaveLength(1)
    expect(json.images[0].url).toContain("r2.example.com")
  })

  it("returns 400 when prompt is missing", async () => {
    const res = await POST(makeRequest({}))
    const json = await res.json()

    expect(res.status).toBe(400)
    expect(json.error).toBeTruthy()
  })

  it("returns 400 when prompt is empty string", async () => {
    const res = await POST(makeRequest({ prompt: "   " }))
    const json = await res.json()

    expect(res.status).toBe(400)
    expect(json.error).toContain("vacío")
  })

  it("retries when Gemini returns text instead of image", async () => {
    // First call returns text, second returns image
    mockImageGenerateContent
      .mockResolvedValueOnce(textResponse("no image"))
      .mockResolvedValueOnce(imageResponse("abc123"))

    const res = await POST(makeRequest({ prompt: "a cat" }))
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.success).toBe(true)
    // Gemini was called twice (initial + retry)
    expect(mockImageGenerateContent).toHaveBeenCalledTimes(2)
  })

  it("returns 502 when both attempts return text", async () => {
    mockGeminiTextOnly()

    const res = await POST(makeRequest({ prompt: "a cat" }))
    const json = await res.json()

    expect(res.status).toBe(502)
    expect(json.error).toContain("texto en lugar de imagen")
    expect(mockImageGenerateContent).toHaveBeenCalledTimes(2)
  })

  it("includes promptUsed field in response", async () => {
    mockGeminiImage()
    const res = await POST(makeRequest({ prompt: "sunset over mountains" }))
    const json = await res.json()

    expect(json.promptUsed).toBeDefined()
    expect(json.promptUsed).toContain("sunset over mountains")
  })

  it("uploads to R2 with correct content type", async () => {
    mockGeminiImage()
    await POST(makeRequest({ prompt: "a tree" }))

    expect(mockUploadFile).toHaveBeenCalledTimes(1)
    const [buffer, key, contentType] = mockUploadFile.mock.calls[0]
    expect(buffer).toBeInstanceOf(Buffer)
    expect(key).toMatch(/^v1\/raw-designs\//)
    expect(key).toMatch(/\.png$/)
    expect(contentType).toBe("image/png")
  })

  it("falls back to data URI when R2 upload fails", async () => {
    mockGeminiImage("dGVzdA==")
    mockUploadFile.mockRejectedValueOnce(new Error("R2 down"))

    const res = await POST(makeRequest({ prompt: "fallback test" }))
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.images[0].url).toContain("data:image/png;base64,")
    expect(json.images[0].isFallback).toBe(true)
  })

  // --- Instruction-based iteration ---

  it("accepts instruction + lastPrompt for iteration", async () => {
    // Text model (SDK viejo) resuelve el prompt nuevo, image model (SDK nuevo) genera
    mockTextGenerateContent.mockResolvedValueOnce({
      response: { text: () => "modified prompt with blue sky" },
    })
    mockImageGenerateContent.mockResolvedValueOnce(imageResponse("abc"))

    const res = await POST(
      makeRequest({
        instruction: "make the sky blue",
        lastPrompt: "a landscape",
      })
    )
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.success).toBe(true)
    expect(mockTextGenerateContent).toHaveBeenCalledTimes(1)
    expect(json.promptUsed).toContain("modified prompt with blue sky")
    const [params] = mockImageGenerateContent.mock.calls[0]
    expect(params.contents[0].text).toContain("modified prompt with blue sky")
  })

  // --- B) Guard, aspect ratio y metering ---

  it("returns the guard's status/message and never calls Gemini when the guard blocks", async () => {
    mockGuard.mockResolvedValueOnce({ allowed: false, status: 429, message: "Demasiadas solicitudes." })

    const res = await POST(makeRequest({ prompt: "a red dragon" }))
    const json = await res.json()

    expect(res.status).toBe(429)
    expect(json.error).toBe("Demasiadas solicitudes.")
    expect(mockImageGenerateContent).not.toHaveBeenCalled()
    expect(mockGuard).toHaveBeenCalledWith(expect.anything(), "generate-image", { prompt: "a red dragon" })
  })

  it("passes the closest supported aspectRatio to Gemini via imageConfig (1:1 by default)", async () => {
    mockGeminiImage()

    await POST(makeRequest({ prompt: "banner", size: { width: 1200, height: 800 } }))
    await POST(makeRequest({ prompt: "square" }))

    expect(mockImageGenerateContent.mock.calls[0][0].config.imageConfig.aspectRatio).toBe("3:2")
    expect(mockImageGenerateContent.mock.calls[1][0].config.imageConfig.aspectRatio).toBe("1:1")
  })

  it("meters the real cost with Gemini's usageMetadata after a successful generation", async () => {
    mockGeminiImage()

    await POST(makeRequest({ prompt: "a tree" }))

    expect(mockMeter).toHaveBeenCalledTimes(1)
    expect(mockMeter).toHaveBeenCalledWith(
      expect.objectContaining({
        endpoint: "public/generate-image",
        units: 1,
        usageMetadata: { promptTokenCount: 10, candidatesTokenCount: 1290 },
      })
    )
  })

  // --- C) Edge cases ---

  it("handles very long prompts", async () => {
    mockGeminiImage()
    const longPrompt = "a ".repeat(5000) + "dragon"
    const res = await POST(makeRequest({ prompt: longPrompt }))
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.success).toBe(true)
  })

  it("handles special characters in prompts", async () => {
    mockGeminiImage()
    const specialPrompt =
      'dragon with "fire" & <wings> / emblème français ñ 日本語 🔥'
    const res = await POST(makeRequest({ prompt: specialPrompt }))
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.promptUsed).toContain(specialPrompt)
  })

  it("concurrent requests do not interfere", async () => {
    mockGeminiImage()

    const [res1, res2, res3] = await Promise.all([
      POST(makeRequest({ prompt: "dragon" })),
      POST(makeRequest({ prompt: "unicorn" })),
      POST(makeRequest({ prompt: "phoenix" })),
    ])

    const [json1, json2, json3] = await Promise.all([
      res1.json(),
      res2.json(),
      res3.json(),
    ])

    expect(json1.success).toBe(true)
    expect(json2.success).toBe(true)
    expect(json3.success).toBe(true)

    // Each has its own promptUsed
    expect(json1.promptUsed).toContain("dragon")
    expect(json2.promptUsed).toContain("unicorn")
    expect(json3.promptUsed).toContain("phoenix")
  })

  it("returns 500 when Gemini throws an error", async () => {
    mockImageGenerateContent.mockRejectedValue(new Error("API quota exceeded"))

    const res = await POST(makeRequest({ prompt: "test" }))
    const json = await res.json()

    expect(res.status).toBe(500)
    expect(json.error).toContain("API quota exceeded")
  })

  it("respects n parameter for multiple images", async () => {
    mockImageGenerateContent.mockResolvedValue(imageResponse("img1", "img2"))

    const res = await POST(makeRequest({ prompt: "dual", n: 2 }))
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.images).toHaveLength(2)
  })
})
