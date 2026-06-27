import { NextRequest, NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"
import { uploadFile } from "@/lib/cloudflare-r2"
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit"

export const runtime = "nodejs"

const limiter = rateLimit({ limit: 7, windowSeconds: 60, prefix: "lifestyle" })

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
}

function ok(data: unknown, status = 200) {
  return new NextResponse(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...CORS },
  })
}

export async function OPTIONS() {
  return ok({ ok: true })
}

type Scenario = "palermo_street" | "rooftop_sunset" | "caminito" | "fan_zone" | "cafe_san_telmo"

const SCENARIO_PROMPTS: Record<Scenario, string> = {
  palermo_street:
    "Young Argentinian person (early 20s, friendly natural expression) wearing exactly this t-shirt as shown in the reference image. Standing in a sunlit Palermo Buenos Aires street with cafés and trees, golden hour, cinematic lifestyle photography, shot on Sony A7IV with 50mm f1.4, candid editorial style. The t-shirt design must remain exactly as in the reference. Hyperrealistic, 4K, no text overlays.",
  rooftop_sunset:
    "Young Argentinian person (early 20s, confident expression) wearing exactly this t-shirt as shown in the reference image. On a sunset Buenos Aires rooftop overlooking the city skyline, arms slightly raised, magic hour sky, warm orange tones, urban editorial photography, shot on Sony A7IV. The t-shirt design must remain exactly as in the reference. Hyperrealistic, 4K, no text overlays.",
  caminito:
    "Young Argentinian person (early 20s, joyful expression) wearing exactly this t-shirt as shown in the reference image. Walking through Caminito La Boca, colorful houses background, late afternoon warm light, vibrant street culture, candid travel photography, shot on Canon R5 35mm. The t-shirt design must remain exactly as in the reference. Hyperrealistic, 4K, no text overlays.",
  fan_zone:
    "Young Argentinian person (early 20s, intense confident expression) wearing exactly this t-shirt as shown in the reference image. In an outdoor stadium fan-zone, energetic crowd blurred behind them, stadium floodlights, dynamic sports photography, high contrast, shot on Nikon Z9. The t-shirt design must remain exactly as in the reference. Hyperrealistic, 4K, no text overlays.",
  cafe_san_telmo:
    "Young Argentinian person (early 20s, relaxed thoughtful expression) wearing exactly this t-shirt as shown in the reference image. Sitting at an outdoor café table in San Telmo with a cortado coffee, cobblestone street behind, mid-afternoon natural light, editorial lifestyle photography, shallow depth of field. The t-shirt design must remain exactly as in the reference. Hyperrealistic, 4K, no text overlays.",
}

const ALL_SCENARIOS = Object.keys(SCENARIO_PROMPTS) as Scenario[]

export async function POST(req: NextRequest) {
  const { success, resetAt } = limiter.check(req)
  if (!success) return rateLimitResponse(resetAt)

  try {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) return ok({ error: "Missing GEMINI_API_KEY" }, 500)

    const body = (await req.json()) as {
      mockupUrl: string
      garmentType: string
      scenario?: Scenario
    }

    if (!body.mockupUrl) return ok({ error: "mockupUrl is required" }, 400)

    const scenario: Scenario =
      body.scenario && SCENARIO_PROMPTS[body.scenario]
        ? body.scenario
        : ALL_SCENARIOS[Math.floor(Math.random() * ALL_SCENARIOS.length)]

    // Download mockup image and convert to base64
    const { resolveAbsoluteUrl } = await import("@/lib/absolute-url")
    const mockupRes = await fetch(resolveAbsoluteUrl(body.mockupUrl, req))
    if (!mockupRes.ok) return ok({ error: "Failed to fetch mockupUrl" }, 400)
    const mockupBuffer = Buffer.from(await mockupRes.arrayBuffer())
    const mockupBase64 = mockupBuffer.toString("base64")
    const mockupMime = mockupRes.headers.get("content-type") || "image/png"

    const prompt = SCENARIO_PROMPTS[scenario]

    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({
      model: process.env.GEMINI_DESIGN_MODEL || "gemini-3.1-flash-image",
    })

    const result = await model.generateContent([
      {
        inlineData: {
          mimeType: mockupMime,
          data: mockupBase64,
        },
      },
      prompt,
    ])

    // Extract image from response
    let imageBase64: string | null = null
    for (const cand of result.response?.candidates ?? []) {
      for (const part of cand?.content?.parts ?? []) {
        // @ts-ignore
        const inline = part?.inlineData
        // @ts-ignore
        if (inline?.mimeType?.startsWith("image/") && typeof inline?.data === "string") {
          // @ts-ignore
          imageBase64 = inline.data
          break
        }
      }
      if (imageBase64) break
    }

    if (!imageBase64) {
      return ok({ error: "Gemini did not return an image. Try again." }, 502)
    }

    const buffer = Buffer.from(imageBase64, "base64")
    const key = `v1/lifestyle/${Date.now()}-${Math.random().toString(36).substring(2, 7)}.png`
    const { url: lifestyleUrl } = await uploadFile(buffer, key, "image/png")

    return ok({ lifestyleUrl, scenario })
  } catch (e: any) {
    return ok({ error: e?.message ?? "Error generating lifestyle image" }, 500)
  }
}
