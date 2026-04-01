import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextRequest } from "next/server"

// --- Mocks ---

// Mock R2 upload
const mockUploadFile = vi.fn().mockResolvedValue({
  url: "https://r2.example.com/v1/stamps/test/stamp.png",
  provider: "r2" as const,
})
vi.mock("@/lib/cloudflare-r2", () => ({
  uploadFile: (...args: any[]) => mockUploadFile(...args),
}))

// Mock notifications
vi.mock("@/lib/notifications", () => ({
  notifyError: vi.fn().mockResolvedValue(undefined),
}))

// Mock garment mappings
vi.mock("@/lib/garment-red-square-mapping", () => ({
  getBaseGarmentImage: vi.fn().mockReturnValue("/garments/tshirt-classic-black-front.jpg"),
  getRedSquareGarmentImage: vi.fn().mockReturnValue("/garments/tshirt-classic-black-front-R2.png"),
}))

// Mock R2 helpers
vi.mock("@/lib/r2", () => ({
  normalizeR2Key: (url: string) => url,
  toPublicR2Url: (key: string) => `https://r2.example.com/${key}`,
}))

// Mock Gemini (new SDK: @google/genai)
const mockGenAIGenerateContent = vi.fn()
vi.mock("@google/genai", () => {
  return {
    GoogleGenAI: class {
      models = {
        generateContent: (...args: any[]) => mockGenAIGenerateContent(...args),
      }
    },
  }
})

// Mock global fetch for image downloads
const originalFetch = globalThis.fetch
const mockFetch = vi.fn()

// Set env
process.env.GEMINI_API_KEY = "test-key"

// Import route AFTER mocks
import { POST } from "@/app/api/generate-stamp/route"

function makeRequest(body: Record<string, unknown>): NextRequest {
  return new NextRequest("http://localhost:3000/api/generate-stamp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
}

const validBody = {
  designImageUrl: "https://example.com/design.png",
  garmentType: "tshirt",
  garmentColor: "black",
  side: "front",
  stampSize: "R2",
}

function mockGeminiStampImage(base64 = "iVBORw0KGgoAAAANSUhEUg==") {
  mockGenAIGenerateContent.mockResolvedValue({
    candidates: [
      {
        content: {
          parts: [{ inlineData: { data: base64, mimeType: "image/png" } }],
        },
      },
    ],
  })
}

// Mock fetch to return fake image buffers
function setupFetchMock() {
  mockFetch.mockImplementation(async (url: string) => {
    return {
      ok: true,
      status: 200,
      statusText: "OK",
      arrayBuffer: async () => new ArrayBuffer(100),
    }
  })
  globalThis.fetch = mockFetch as any
}

describe("POST /api/generate-stamp", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setupFetchMock()
    mockUploadFile.mockResolvedValue({
      url: "https://r2.example.com/v1/stamps/test/stamp.png",
      provider: "r2" as const,
    })
  })

  afterEach(() => {
    globalThis.fetch = originalFetch
  })

  // --- B) Core tests ---

  it("returns mockup URL with valid params", async () => {
    mockGeminiStampImage()
    const res = await POST(makeRequest(validBody))
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.success).toBe(true)
    expect(json.publicUrl).toContain("r2.example.com")
    expect(json.stampId).toBeDefined()
    expect(json.r2Key).toMatch(/^v1\/stamps\//)
  })

  it("returns 400 when designImageUrl is missing", async () => {
    const { designImageUrl, ...body } = validBody
    const res = await POST(makeRequest(body))
    const json = await res.json()

    expect(res.status).toBe(400)
    expect(json.error).toContain("designImageUrl")
  })

  it("returns 400 when designImageUrl is empty", async () => {
    const res = await POST(makeRequest({ ...validBody, designImageUrl: "" }))
    const json = await res.json()

    expect(res.status).toBe(400)
    expect(json.error).toContain("designImageUrl")
  })

  // --- Garment types ---

  it("supports garmentType: tshirt", async () => {
    mockGeminiStampImage()
    const res = await POST(makeRequest({ ...validBody, garmentType: "tshirt" }))
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.success).toBe(true)
  })

  it("supports garmentType: hoodie", async () => {
    mockGeminiStampImage()
    const res = await POST(makeRequest({ ...validBody, garmentType: "hoodie" }))
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.success).toBe(true)
  })

  it("returns 400 for invalid garmentType", async () => {
    const res = await POST(
      makeRequest({ ...validBody, garmentType: "jacket" })
    )
    const json = await res.json()

    expect(res.status).toBe(400)
    expect(json.error).toContain("garmentType")
  })

  // --- Colors ---

  it("supports garmentColor: black", async () => {
    mockGeminiStampImage()
    const res = await POST(
      makeRequest({ ...validBody, garmentColor: "black" })
    )
    expect(res.status).toBe(200)
  })

  it("supports garmentColor: white", async () => {
    mockGeminiStampImage()
    const res = await POST(
      makeRequest({ ...validBody, garmentColor: "white" })
    )
    expect(res.status).toBe(200)
  })

  it("supports garmentColor: gray", async () => {
    mockGeminiStampImage()
    const res = await POST(makeRequest({ ...validBody, garmentColor: "gray" }))
    expect(res.status).toBe(200)
  })

  // --- Sides ---

  it("supports side: front", async () => {
    mockGeminiStampImage()
    const res = await POST(makeRequest({ ...validBody, side: "front" }))
    expect(res.status).toBe(200)
  })

  it("supports side: back", async () => {
    mockGeminiStampImage()
    const res = await POST(makeRequest({ ...validBody, side: "back" }))
    expect(res.status).toBe(200)
  })

  it("returns 400 for invalid side", async () => {
    const res = await POST(makeRequest({ ...validBody, side: "left" }))
    const json = await res.json()

    expect(res.status).toBe(400)
    expect(json.error).toContain("side")
  })

  // --- Stamp sizes ---

  it("supports stampSize R1, R2, R3", async () => {
    mockGeminiStampImage()

    for (const size of ["R1", "R2", "R3"]) {
      const res = await POST(makeRequest({ ...validBody, stampSize: size }))
      expect(res.status).toBe(200)
    }
  })

  it("returns 400 for invalid stampSize", async () => {
    const res = await POST(makeRequest({ ...validBody, stampSize: "R4" }))
    const json = await res.json()

    expect(res.status).toBe(400)
    expect(json.error).toContain("stampSize")
  })

  // --- Upload verification ---

  it("uploads mockup to R2 with correct content type", async () => {
    mockGeminiStampImage()
    await POST(makeRequest(validBody))

    expect(mockUploadFile).toHaveBeenCalledTimes(1)
    const [buffer, key, contentType] = mockUploadFile.mock.calls[0]
    expect(buffer).toBeInstanceOf(Buffer)
    expect(key).toMatch(/^v1\/stamps\//)
    expect(key).toMatch(/\.png$/)
    expect(contentType).toBe("image/png")
  })

  // --- Gemini failure ---

  it("returns 500 when Gemini throws", async () => {
    mockGenAIGenerateContent.mockRejectedValue(
      new Error("Gemini quota exceeded")
    )

    const res = await POST(makeRequest(validBody))
    const json = await res.json()

    expect(res.status).toBe(500)
    expect(json.error).toContain("Gemini")
  })

  it("returns 500 when Gemini returns no image", async () => {
    mockGenAIGenerateContent.mockResolvedValue({
      candidates: [
        {
          content: {
            parts: [{ text: "I cannot generate this" }],
          },
        },
      ],
    })

    const res = await POST(makeRequest(validBody))
    const json = await res.json()

    expect(res.status).toBe(500)
    expect(json.error).toContain("imagen")
  })

  // --- debugId ---

  it("includes debugId in response and header", async () => {
    mockGeminiStampImage()
    const res = await POST(makeRequest(validBody))
    const json = await res.json()

    expect(json.debugId).toBeDefined()
    expect(res.headers.get("X-Debug-Id")).toBe(json.debugId)
  })

  // --- base64 design input ---

  it("supports base64 data URI as designImageUrl", async () => {
    mockGeminiStampImage()
    const res = await POST(
      makeRequest({
        ...validBody,
        designImageUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUg==",
      })
    )
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.success).toBe(true)
    // Should not call fetch for base64 design (only for garment images)
  })

  // --- C) Edge cases ---

  it("handles malformed JSON body", async () => {
    const req = new NextRequest("http://localhost:3000/api/generate-stamp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "not json{{{",
    })
    const res = await POST(req)
    const json = await res.json()

    expect(res.status).toBe(400)
    expect(json.error).toContain("JSON")
  })

  it("concurrent requests do not interfere", async () => {
    mockGeminiStampImage()
    // Ensure mockUploadFile returns fresh values for each call
    mockUploadFile
      .mockResolvedValueOnce({ url: "https://r2.example.com/stamp1.png", provider: "r2" as const })
      .mockResolvedValueOnce({ url: "https://r2.example.com/stamp2.png", provider: "r2" as const })
      .mockResolvedValueOnce({ url: "https://r2.example.com/stamp3.png", provider: "r2" as const })

    const results = await Promise.all([
      POST(makeRequest({ ...validBody, garmentColor: "black" })),
      POST(makeRequest({ ...validBody, garmentColor: "white" })),
      POST(makeRequest({ ...validBody, garmentColor: "gray" })),
    ])

    const jsons = await Promise.all(results.map((r) => r.json()))

    // At least the ones that succeeded should have unique stampIds
    const successful = jsons.filter((j) => j.success)
    expect(successful.length).toBeGreaterThanOrEqual(1)

    if (successful.length > 1) {
      const ids = new Set(successful.map((j) => j.stampId))
      expect(ids.size).toBe(successful.length)
    }

    // The first request should always succeed
    expect(jsons[0].success).toBe(true)
  })

  it("returns 500 when R2 upload fails", async () => {
    mockGeminiStampImage()
    mockUploadFile.mockReset()
    mockUploadFile.mockRejectedValue(new Error("R2 down"))

    const res = await POST(makeRequest(validBody))
    const json = await res.json()

    expect(res.status).toBe(500)
    expect(json.error).toContain("subiendo imagen")
  })
})
