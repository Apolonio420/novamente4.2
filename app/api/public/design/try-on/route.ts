import { NextRequest, NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"
import { uploadFile } from "@/lib/cloudflare-r2"
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit"

export const runtime = "nodejs"

// More restrictive limit — processes biometric data
const limiter = rateLimit({ limit: 3, windowSeconds: 60, prefix: "tryon" })

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

const TRY_ON_PROMPT =
  "Generate a realistic photo of the person in the first image wearing the exact t-shirt design from the second image. Keep the person's face, hair, body type and pose exactly the same. Replace their current shirt with the t-shirt design from the second image. Photorealistic, natural lighting, same background as the original photo. The design on the t-shirt must remain exactly as in the second reference. 4K quality."

export async function POST(req: NextRequest) {
  const { success, resetAt } = limiter.check(req)
  if (!success) return rateLimitResponse(resetAt)

  try {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) return ok({ error: "Missing GEMINI_API_KEY" }, 500)

    const body = (await req.json()) as {
      selfieUrl: string
      mockupUrl: string
      consentGiven: boolean
    }

    // Mandatory consent check (Ley 25.326 AR — biometric data)
    if (body.consentGiven !== true) {
      return ok(
        { error: "Consent required for biometric processing (Ley 25.326 AR)" },
        400
      )
    }

    if (!body.selfieUrl) return ok({ error: "selfieUrl is required" }, 400)
    if (!body.mockupUrl) return ok({ error: "mockupUrl is required" }, 400)

    // Download both images
    const [selfieRes, mockupRes] = await Promise.all([
      fetch(body.selfieUrl),
      fetch(body.mockupUrl),
    ])

    if (!selfieRes.ok) return ok({ error: "Failed to fetch selfieUrl" }, 400)
    if (!mockupRes.ok) return ok({ error: "Failed to fetch mockupUrl" }, 400)

    const [selfieBuffer, mockupBuffer] = await Promise.all([
      selfieRes.arrayBuffer().then((a) => Buffer.from(a)),
      mockupRes.arrayBuffer().then((a) => Buffer.from(a)),
    ])

    const selfieBase64 = selfieBuffer.toString("base64")
    const mockupBase64 = mockupBuffer.toString("base64")
    const selfieMime = selfieRes.headers.get("content-type") || "image/jpeg"
    const mockupMime = mockupRes.headers.get("content-type") || "image/png"

    const genAI = new GoogleGenerativeAI(apiKey)

    async function attemptGeneration(modelId: string): Promise<string | null> {
      const model = genAI.getGenerativeModel({ model: modelId })
      const result = await model.generateContent([
        {
          inlineData: {
            mimeType: selfieMime,
            data: selfieBase64,
          },
        },
        {
          inlineData: {
            mimeType: mockupMime,
            data: mockupBase64,
          },
        },
        TRY_ON_PROMPT,
      ])

      for (const cand of result.response?.candidates ?? []) {
        for (const part of cand?.content?.parts ?? []) {
          // @ts-ignore
          const inline = part?.inlineData
          // @ts-ignore
          if (inline?.mimeType?.startsWith("image/") && typeof inline?.data === "string") {
            // @ts-ignore
            return inline.data as string
          }
        }
      }
      return null
    }

    // Try primary model, fallback to secondary
    let imageBase64 =
      await attemptGeneration(
        process.env.GEMINI_DESIGN_MODEL || "gemini-3.1-flash-image-preview"
      ).catch(() => null)

    if (!imageBase64) {
      imageBase64 = await attemptGeneration("gemini-2.5-flash-preview-05-20").catch(() => null)
    }

    if (!imageBase64) {
      return ok({ error: "Gemini did not return an image. Try again." }, 502)
    }

    const buffer = Buffer.from(imageBase64, "base64")
    const key = `v1/try-on/${Date.now()}-${Math.random().toString(36).substring(2, 7)}.png`
    const { url: tryOnUrl } = await uploadFile(buffer, key, "image/png")

    // TODO: schedule cleanup job to delete selfieUrl R2 object after session ends
    // The selfie is not stored — it was downloaded from the pre-signed R2 URL provided by the client
    // and used only for this generation. The client must call DELETE /api/public/design/cleanup-selfie
    // passing the R2 key to remove it.

    return ok({ tryOnUrl })
  } catch (e: any) {
    return ok({ error: e?.message ?? "Error generating try-on image" }, 500)
  }
}
