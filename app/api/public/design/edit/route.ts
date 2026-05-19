import { NextRequest, NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"
import { uploadFile } from "@/lib/cloudflare-r2"
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit"
import { optimizeDesignPrompt } from "@/lib/designer/prompt-optimizer"

export const runtime = "nodejs"

const limiter = rateLimit({ limit: 10, windowSeconds: 60, prefix: "design-edit" })

const IMAGE_MODEL = process.env.GEMINI_IMAGE_MODEL || "gemini-3.1-flash-image-preview"

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

export async function POST(req: NextRequest) {
  const { success, resetAt } = limiter.check(req)
  if (!success) return rateLimitResponse(resetAt)

  try {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) return ok({ error: "Missing GEMINI_API_KEY" }, 500)

    const body = await req.json() as {
      previousImageUrl: string
      instruction: string
      mode?: "photo" | "illustration"
    }
    const { previousImageUrl, instruction } = body
    // 'photo' = user-uploaded photo (preserva personas/fondo real)
    // 'illustration' = iterar sobre un design generado (textile/vectorial constraints)
    const mode = body.mode ?? "illustration"

    if (!previousImageUrl || !instruction?.trim()) {
      return ok({ error: "Se requieren previousImageUrl e instruction" }, 400)
    }

    // Download previous image from R2/URL
    const imgRes = await fetch(previousImageUrl)
    if (!imgRes.ok) {
      return ok({ error: "No se pudo descargar la imagen anterior" }, 400)
    }
    const imgBuffer = Buffer.from(await imgRes.arrayBuffer())
    const contentType = imgRes.headers.get("content-type") || "image/png"
    const base64Data = imgBuffer.toString("base64")

    // Modo PHOTO: respetar el contenido original (personas, mascotas, etc).
    // Modo ILLUSTRATION: forzar estilo textile/vectorial para uso en estampa.
    let editInstruction: string
    if (mode === "photo") {
      editInstruction = [
        `Apply this change to the image: ${instruction.trim()}.`,
        "PRESERVE the original subjects (faces, pets, objects), proportions, identity and overall composition exactly.",
        "Only apply the requested modification (e.g. remove background, change color, add element). Do NOT replace the subjects with something else.",
        "If the user asks to 'remove background' or 'sin fondo', output a transparent PNG with only the main subject isolated, clean alpha edges, no halo.",
        "If the user asks to make it suitable for a textile print/stamp, keep the subject realistic but simplify shadows and ensure clean edges.",
        "Respond ONLY with an image (inlineData). No text.",
      ].join(" ")
    } else {
      const { optimizedPrompt } = optimizeDesignPrompt(instruction)
      editInstruction = [
        `Edit this illustration: ${optimizedPrompt}.`,
        "Keep the same general composition and style but apply the requested change.",
        "SOLO una ilustración aislada. PROHIBIDO: prendas, remeras, buzos, hoodies, mockups, marcos, texto superpuesto.",
        "Respond ONLY with an image (inlineData). No text.",
      ].join(" ")
    }

    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: IMAGE_MODEL })

    const result = await model.generateContent([
      {
        inlineData: {
          mimeType: contentType as "image/png" | "image/jpeg" | "image/webp",
          data: base64Data,
        },
      },
      editInstruction,
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
      return ok(
        { error: "Gemini no devolvió imagen. Intentá un prompt más específico." },
        502,
      )
    }

    // Upload to R2
    const buffer = Buffer.from(imageBase64, "base64")
    const key = `v1/edited-designs/${Date.now()}-${Math.random().toString(36).substring(2, 7)}.png`
    const { url } = await uploadFile(buffer, key, "image/png")

    return ok({
      success: true,
      images: [{ url }],
      prompt: editInstruction,
    })
  } catch (e: any) {
    return ok({ error: e?.message ?? "Error editando imagen" }, 500)
  }
}
