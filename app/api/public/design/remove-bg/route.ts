// Background removal con Gemini Nano Banana 2 + prompt quirúrgico.
// Cambio @imgly client-side por server-side Gemini (más confiable —
// @imgly tenía CSP/WASM issues en prod).
import { NextRequest, NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"
import { uploadFile } from "@/lib/cloudflare-r2"
import { resolveAbsoluteUrl } from "@/lib/absolute-url"
import { corsHeaders, preflightResponse } from "@/lib/security/cors"
import { guardPublicImageGen } from "@/lib/security/public-image-guard"
import { meterPublicImageGen } from "@/lib/security/meter-usage"

export const runtime = "nodejs"
export const maxDuration = 60

const IMAGE_MODEL = process.env.GEMINI_IMAGE_MODEL || "gemini-3.1-flash-image"

export async function OPTIONS(req: NextRequest) {
  return preflightResponse(req)
}

const BG_REMOVAL_PROMPT = [
  "Task: precise background removal.",
  "Take the input image and output a PNG with the SAME subject(s) (people, animals, objects, text)",
  "but with the background ENTIRELY REPLACED by full transparency (alpha = 0).",
  "Rules:",
  "- DO NOT modify the subject's appearance, colors, pose, expression or features.",
  "- DO NOT add, remove or relocate any subject elements.",
  "- Cut along the natural edges of the subject — feather/anti-alias hair, fur and soft edges.",
  "- Everything that is NOT the main subject must be 100% transparent in the alpha channel.",
  "- Do NOT add a new background of any color (no white, no checkerboard, no fill).",
  "- Output must be a single PNG image with an alpha channel.",
  "Respond ONLY with the image (inlineData). No text.",
].join(" ")

export async function POST(req: NextRequest) {
  function ok(data: unknown, status = 200) {
    return new NextResponse(JSON.stringify(data), {
      status,
      headers: { "Content-Type": "application/json", ...corsHeaders(req) },
    })
  }

  const guard = await guardPublicImageGen(req, "remove-bg")
  if (!guard.allowed) return ok({ error: guard.message }, guard.status)

  try {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) return ok({ error: "Missing GEMINI_API_KEY" }, 500)

    // Soporta JSON (imageUrl) o FormData (file directo del browser)
    const ct = req.headers.get("content-type") || ""
    let imgBuffer: Buffer
    let mimeType: string

    if (ct.includes("application/json")) {
      const body = (await req.json()) as { imageUrl?: string }
      if (!body.imageUrl) return ok({ error: "imageUrl required" }, 400)
      const resolved = resolveAbsoluteUrl(body.imageUrl, req)
      const imgRes = await fetch(resolved)
      if (!imgRes.ok) return ok({ error: `No se pudo descargar la imagen (${imgRes.status})` }, 400)
      imgBuffer = Buffer.from(await imgRes.arrayBuffer())
      mimeType = imgRes.headers.get("content-type") || "image/png"
    } else if (ct.includes("multipart/form-data")) {
      const form = await req.formData()
      const file = form.get("file") as File | null
      if (!file) return ok({ error: "No file provided" }, 400)
      imgBuffer = Buffer.from(await file.arrayBuffer())
      mimeType = file.type || "image/png"
    } else {
      return ok({ error: "Content-Type must be application/json or multipart/form-data" }, 400)
    }

    const base64Data = imgBuffer.toString("base64")
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: IMAGE_MODEL })

    const result = await model.generateContent([
      {
        inlineData: {
          mimeType: mimeType as "image/png" | "image/jpeg" | "image/webp",
          data: base64Data,
        },
      },
      BG_REMOVAL_PROMPT,
    ])

    let imageBase64: string | null = null
    for (const cand of result.response?.candidates ?? []) {
      for (const part of cand?.content?.parts ?? []) {
        const inline = (part as { inlineData?: { mimeType?: string; data?: string } })?.inlineData
        if (inline?.mimeType?.startsWith?.("image/") && typeof inline?.data === "string") {
          imageBase64 = inline.data
          break
        }
      }
      if (imageBase64) break
    }

    if (!imageBase64) {
      return ok({ error: "Gemini no devolvió imagen. Intentá con otra imagen." }, 502)
    }

    const outBuffer = Buffer.from(imageBase64, "base64")
    const key = `v1/no-bg/${Date.now()}-${Math.random().toString(36).substring(2, 7)}.png`
    const { url } = await uploadFile(outBuffer, key, "image/png")

    await meterPublicImageGen({ endpoint: "public/design/remove-bg", model: IMAGE_MODEL })

    return ok({ success: true, images: [{ url }], method: "gemini" })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error("[remove-bg] error:", msg)
    return ok({ error: msg }, 500)
  }
}
