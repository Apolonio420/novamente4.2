import { NextRequest, NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"
import { uploadFile } from "@/lib/cloudflare-r2"
import { optimizeDesignPrompt } from "@/lib/designer/prompt-optimizer"
import { corsHeaders, preflightResponse } from "@/lib/security/cors"
import { guardPublicImageGen } from "@/lib/security/public-image-guard"
import { meterPublicImageGen } from "@/lib/security/meter-usage"

export const runtime = "nodejs"

// Mismo override que app/api/generate-image/route.ts — ver comentario ahi.
const IMAGE_MODEL =
  process.env.GEMINI_PUBLIC_DESIGN_MODEL || process.env.GEMINI_IMAGE_MODEL || "gemini-2.5-flash-image"

export async function OPTIONS(req: NextRequest) {
  return preflightResponse(req)
}

export async function POST(req: NextRequest) {
  function ok(data: unknown, status = 200) {
    return new NextResponse(JSON.stringify(data), {
      status,
      headers: { "Content-Type": "application/json", ...corsHeaders(req) },
    })
  }

  const guard = await guardPublicImageGen(req, "design-edit")
  if (!guard.allowed) return ok({ error: guard.message }, guard.status)

  try {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) return ok({ error: "Missing GEMINI_API_KEY" }, 500)

    const body = await req.json() as {
      previousImageUrl: string
      instruction: string
      mode?: "photo" | "illustration"
      raw?: boolean
      garmentColor?: string
    }
    const { previousImageUrl, instruction } = body
    // 'photo' = user-uploaded photo (preserva personas/fondo real)
    // 'illustration' = iterar sobre un design generado
    // raw=true → no aplica optimizer en illustration mode (prompt as-is)
    const mode = body.mode ?? "illustration"
    const rawMode = body.raw === true || mode === "photo"

    if (!previousImageUrl || !instruction?.trim()) {
      return ok({ error: "Se requieren previousImageUrl e instruction" }, 400)
    }

    // Download previous image from R2/URL. El upload endpoint devuelve URLs
    // relativas (/api/proxy-image?key=...) — las resolvemos a absolutas.
    const { resolveAbsoluteUrl } = await import("@/lib/absolute-url")
    const resolvedImageUrl = resolveAbsoluteUrl(previousImageUrl, req)
    const imgRes = await fetch(resolvedImageUrl)
    if (!imgRes.ok) {
      return ok({ error: `No se pudo descargar la imagen anterior (${imgRes.status})` }, 400)
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
    } else if (rawMode) {
      // Raw illustration: respect user prompt as-is, + print-ready layer
      // según el color de la prenda destino.
      const { buildPrintReadyPrompt } = await import("@/lib/designer/print-ready-prompt")
      const printReady = buildPrintReadyPrompt(
        `Edit this image with the following instruction: ${instruction.trim()}. Apply the change while preserving the overall composition.`,
        { garmentColor: body.garmentColor },
      )
      editInstruction = `${printReady} Respond ONLY with an image (inlineData). No text.`
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

    await meterPublicImageGen({ endpoint: "public/design/edit", model: IMAGE_MODEL })

    return ok({
      success: true,
      images: [{ url }],
      prompt: editInstruction,
    })
  } catch (e: any) {
    return ok({ error: e?.message ?? "Error editando imagen" }, 500)
  }
}
