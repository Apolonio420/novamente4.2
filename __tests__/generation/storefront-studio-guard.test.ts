/**
 * Scoping de la exencion de partner en storefront studio (fix del review
 * adversarial sobre ac4ee45): la exencion del guard publico SOLO aplica si
 * la sesion pertenece al MISMO tenant del slug. Cadena de explotacion que
 * este test cubre: signup gratis anonimo → sesion valida de tenant A →
 * POST al studio del storefront de tenant B (growth/pro, checkUsageLimit
 * unlimited) → sin este fix, bypass total del rate-limit/cap.
 */
import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextRequest } from "next/server"

// --- Mocks ---

const mockGetTenantBySlug = vi.fn()
vi.mock("@/lib/partners/tenant", () => ({
  getTenantBySlug: (...args: any[]) => mockGetTenantBySlug(...args),
}))

vi.mock("@/lib/partners/plans", () => ({
  getPlanFeatures: vi.fn().mockReturnValue({ storefrontDesigner: true }),
}))

vi.mock("@/lib/partners/design-engine", () => ({
  getDesignConfig: vi.fn().mockResolvedValue({}),
  buildTenantPrompt: vi.fn().mockReturnValue("prompt"),
  saveDesignAsset: vi.fn().mockResolvedValue(undefined),
  getAvailableGarments: vi.fn().mockReturnValue([{ key: "tshirt" }]),
}))

vi.mock("@/lib/gemini", () => ({
  getGeminiClient: vi.fn().mockReturnValue({
    getGenerativeModel: () => ({ generateContent: vi.fn() }),
  }),
}))

vi.mock("@/lib/cloudflare-r2", () => ({
  uploadFile: vi.fn().mockResolvedValue({ url: "https://r2.example.com/x.png", provider: "r2" }),
}))

vi.mock("@/lib/partners/studio/moderation", () => ({
  checkPromptModeration: vi.fn().mockReturnValue({ passed: true }),
  getGeminiSafetySettings: vi.fn().mockReturnValue([]),
}))

// checkUsageLimit devuelve NOT allowed para cortar el flujo del dueño
// antes de llegar a Gemini — lo que nos importa es si el guard corrio o no.
const mockCheckUsageLimit = vi.fn().mockResolvedValue({ allowed: false, usage: {} })
vi.mock("@/lib/partners/studio/usage-tracker", () => ({
  checkUsageLimit: (...args: any[]) => mockCheckUsageLimit(...args),
  recordUsage: vi.fn().mockResolvedValue(undefined),
}))

vi.mock("@/lib/partners/studio/prompt-builder", () => ({
  extractBrandEssence: vi.fn().mockReturnValue({}),
  buildBrandAwarePrompt: vi.fn().mockReturnValue("prompt"),
}))

vi.mock("@/lib/garment-mappings", () => ({
  getGarmentMapping: vi.fn().mockReturnValue({ garmentPath: "/garments/x.jpeg", coordinates: {} }),
}))

const mockGuard = vi.fn()
vi.mock("@/lib/security/public-image-guard", () => ({
  guardPublicImageGen: (...args: any[]) => mockGuard(...args),
}))

vi.mock("@/lib/security/meter-usage", () => ({
  meterPublicImageGen: vi.fn().mockResolvedValue(undefined),
}))

const mockGetRequestTenant = vi.fn()
vi.mock("@/lib/partners/permissions", () => ({
  getRequestTenant: (...args: any[]) => mockGetRequestTenant(...args),
}))

import { POST as generatePOST } from "@/app/api/storefront/[slug]/studio/generate/route"
import { POST as mockupPOST } from "@/app/api/storefront/[slug]/studio/mockup/route"

const VICTIM_TENANT = { id: "tenant-victima", plan: "growth", storefront_published: true }

function makeReq(path: string, body: Record<string, unknown>): NextRequest {
  return new NextRequest(`http://localhost:3000${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-forwarded-for": "1.2.3.4" },
    body: JSON.stringify(body),
  })
}

const params = { params: Promise.resolve({ slug: "tienda-victima" }) }

beforeEach(() => {
  vi.clearAllMocks()
  mockGetTenantBySlug.mockResolvedValue(VICTIM_TENANT)
  mockCheckUsageLimit.mockResolvedValue({ allowed: false, usage: {} })
  // Guard bloquea por default — si el route lo consulta, la request muere aca.
  mockGuard.mockResolvedValue({ allowed: false, status: 429, message: "rate limited" })
})

describe.each([
  ["studio/generate", generatePOST, { prompt: "un leon" }],
  ["studio/mockup", mockupPOST, { designImageUrl: "data:image/png;base64,aaa", garmentType: "tshirt" }],
])("POST /api/storefront/[slug]/%s — scoping de exencion", (_name, POST, body) => {
  it("ATACANTE: sesion valida de OTRO tenant NO exime — el guard corre y bloquea", async () => {
    mockGetRequestTenant.mockResolvedValue({
      userId: "user-atacante",
      tenant: { id: "tenant-atacante" },
      role: "owner",
    })

    const res = await POST(makeReq("/api/x", body), params as any)
    const json = await res.json()

    expect(mockGuard).toHaveBeenCalledTimes(1)
    expect(res.status).toBe(429)
    expect(json.error).toBe("rate limited")
    // Nunca debe llegar al cupo del plan de la victima
    expect(mockCheckUsageLimit).not.toHaveBeenCalled()
  })

  it("ANONIMO (sin sesion): el guard corre y bloquea", async () => {
    mockGetRequestTenant.mockResolvedValue(null)

    const res = await POST(makeReq("/api/x", body), params as any)

    expect(mockGuard).toHaveBeenCalledTimes(1)
    expect(res.status).toBe(429)
  })

  it("DUEÑO: sesion del MISMO tenant del slug queda exenta del guard (aplica su cupo de plan)", async () => {
    mockGetRequestTenant.mockResolvedValue({
      userId: "user-dueno",
      tenant: { id: VICTIM_TENANT.id },
      role: "owner",
    })

    const res = await POST(makeReq("/api/x", body), params as any)
    const json = await res.json()

    expect(mockGuard).not.toHaveBeenCalled()
    // Sigue de largo hasta el cupo del plan (mockeado como agotado)
    expect(mockCheckUsageLimit).toHaveBeenCalledWith(VICTIM_TENANT.id, VICTIM_TENANT.plan)
    expect(res.status).toBe(429)
    expect(json.error).toContain("límite de generaciones")
  })

  it("si getRequestTenant explota, se trata como anonimo (guard aplica, no fail-open)", async () => {
    mockGetRequestTenant.mockRejectedValue(new Error("supabase down"))

    const res = await POST(makeReq("/api/x", body), params as any)

    expect(mockGuard).toHaveBeenCalledTimes(1)
    expect(res.status).toBe(429)
  })
})
