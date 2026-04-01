import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextRequest } from "next/server"

// --- Mocks ---

// Mock rate-limit to always allow
vi.mock("@/lib/rate-limit", () => ({
  rateLimit: () => ({
    check: () => ({ success: true, resetAt: Date.now() + 60000 }),
  }),
  rateLimitResponse: () =>
    new Response(JSON.stringify({ error: "Rate limited" }), { status: 429 }),
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

// Mock Gemini
const mockGenerateContent = vi.fn()
vi.mock("@google/generative-ai", () => {
  return {
    GoogleGenerativeAI: class {
      getGenerativeModel() {
        return {
          generateContent: (...args: any[]) => mockGenerateContent(...args),
        }
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

// Helper: Gemini returns an image
function mockGeminiImage(base64 = "iVBORw0KGgoAAAANSUhEUg==") {
  mockGenerateContent.mockResolvedValue({
    response: {
      candidates: [
        {
          content: {
            parts: [
              { inlineData: { mimeType: "image/png", data: base64 } },
            ],
          },
        },
      ],
      text: () => undefined,
    },
  })
}

// Helper: Gemini returns only text (no image)
function mockGeminiTextOnly(text = "I cannot generate images") {
  mockGenerateContent.mockResolvedValue({
    response: {
      candidates: [
        {
          content: {
            parts: [{ text }],
          },
        },
      ],
      text: () => text,
    },
  })
}

describe("POST /api/generate-image", () => {
  beforeEach(() => {
    vi.clearAllMocks()
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
    mockGenerateContent
      .mockResolvedValueOnce({
        response: {
          candidates: [{ content: { parts: [{ text: "no image" }] } }],
          text: () => "no image",
        },
      })
      .mockResolvedValueOnce({
        response: {
          candidates: [
            {
              content: {
                parts: [
                  { inlineData: { mimeType: "image/png", data: "abc123" } },
                ],
              },
            },
          ],
          text: () => undefined,
        },
      })

    const res = await POST(makeRequest({ prompt: "a cat" }))
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.success).toBe(true)
    // Gemini was called twice (initial + retry)
    expect(mockGenerateContent).toHaveBeenCalledTimes(2)
  })

  it("returns 502 when both attempts return text", async () => {
    mockGeminiTextOnly()

    const res = await POST(makeRequest({ prompt: "a cat" }))
    const json = await res.json()

    expect(res.status).toBe(502)
    expect(json.error).toContain("texto en lugar de imagen")
    expect(mockGenerateContent).toHaveBeenCalledTimes(2)
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
    // Text model resolves new prompt, then image model generates
    mockGenerateContent
      .mockResolvedValueOnce({
        response: { text: () => "modified prompt with blue sky" },
      })
      .mockResolvedValueOnce({
        response: {
          candidates: [
            {
              content: {
                parts: [
                  { inlineData: { mimeType: "image/png", data: "abc" } },
                ],
              },
            },
          ],
          text: () => undefined,
        },
      })

    const res = await POST(
      makeRequest({
        instruction: "make the sky blue",
        lastPrompt: "a landscape",
      })
    )
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.success).toBe(true)
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
    mockGenerateContent.mockRejectedValue(new Error("API quota exceeded"))

    const res = await POST(makeRequest({ prompt: "test" }))
    const json = await res.json()

    expect(res.status).toBe(500)
    expect(json.error).toContain("API quota exceeded")
  })

  it("respects n parameter for multiple images", async () => {
    mockGenerateContent.mockResolvedValue({
      response: {
        candidates: [
          {
            content: {
              parts: [
                { inlineData: { mimeType: "image/png", data: "img1" } },
                { inlineData: { mimeType: "image/png", data: "img2" } },
              ],
            },
          },
        ],
        text: () => undefined,
      },
    })

    const res = await POST(makeRequest({ prompt: "dual", n: 2 }))
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.images).toHaveLength(2)
  })
})
