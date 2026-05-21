import { NextRequest, NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"
import { uploadFile } from "@/lib/cloudflare-r2"
import { toPublicR2Url } from "@/lib/r2"
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit"
import { optimizeDesignPrompt } from "@/lib/designer/prompt-optimizer"
import type { GarmentColorway, PrintArea } from "@/lib/designer/types"

export const runtime = "nodejs"

const limiter = rateLimit({ limit: 10, windowSeconds: 60, prefix: 'gen-img' })

// ==== Config ====
const IMAGE_MODEL = process.env.GEMINI_IMAGE_MODEL || "gemini-3.1-flash-image-preview"
const TEXT_MODEL = process.env.GEMINI_TEXT_MODEL || "gemini-1.5-pro"
const DEBUG = (process.env.DEBUG_GEMINI || "").toLowerCase() === "true"

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
}

type OptimizerOptions = { styleId?: string; colorway?: GarmentColorway; printArea?: PrintArea }
type Body =
  | ({ prompt: string; n?: number; size?: { width: number; height: number } } & OptimizerOptions)
  | ({ instruction: string; lastPrompt: string; n?: number; size?: { width: number; height: number } } & OptimizerOptions)

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
  // Rate limit: 10 requests/min per IP
  const { success, resetAt } = limiter.check(req)
  if (!success) return rateLimitResponse(resetAt)

  const t0 = Date.now()
  try {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) return ok({ error: "Missing GEMINI_API_KEY" }, 500)

    const body = (await req.json()) as Body
    const genAI = new GoogleGenerativeAI(apiKey)

    // 1) Resolver prompt final (inicial o iteración)
    let basePrompt = ""
    if ("prompt" in body && typeof body.prompt === "string") {
      basePrompt = body.prompt.trim()
    } else if ("instruction" in body && typeof body.instruction === "string" && (body as any).lastPrompt) {
      const textModel = genAI.getGenerativeModel({ model: TEXT_MODEL })
      const sys = [
        "Eres un experto en arte para estampas.",
        "Reescribe el PROMPT ORIGINAL aplicando la INSTRUCCIÓN.",
        "Incluye composición, escala y ubicación. Devuelve SOLO el nuevo prompt.",
      ].join(" ")
      const user = `PROMPT ORIGINAL:\n${(body as any).lastPrompt}\n\nINSTRUCCIÓN:\n${body.instruction}`
      const tText0 = Date.now()
      const tRes = await textModel.generateContent([`${sys}\n\n${user}`])
      const tText1 = Date.now()
      basePrompt = tRes.response.text().trim()
      console.log("GEN-IMG prompt-iter resolved", {
        ms: tText1 - tText0,
        promptLen: basePrompt.length,
        preview: DEBUG ? basePrompt.slice(0, 140) : undefined,
      })
    } else {
      return ok({ error: "Body inválido. Usa {prompt} o {instruction,lastPrompt}" }, 400)
    }

    if (!basePrompt) {
      return ok({ error: "El prompt está vacío. Escribe qué imagen querés generar." }, 400)
    }

    // 2) Determinar aspect ratio
    const size = (body as any).size
    let aspectRatioHint = ""

    if (size?.width && size?.height) {
      if (size.width > size.height) {
        aspectRatioHint = " Composición HORIZONTAL (landscape orientation, wider than tall)."
      } else if (size.height > size.width) {
        aspectRatioHint = " Composición VERTICAL (portrait orientation, taller than wide)."
      } else {
        aspectRatioHint = " Composición CUADRADA (square, equal width and height)."
      }
      console.log("GEN-IMG aspect ratio:", { width: size.width, height: size.height, hint: aspectRatioHint })
    }

    // 3) Optimizar prompt — opcional via flag `raw`
    //    - raw=true: usa el prompt del user TAL CUAL + guard minimo anti-prenda
    //    - raw=false (default): pasa por optimizer que fuerza estilo vectorial textile
    const { styleId, colorway, printArea } = body as OptimizerOptions
    const rawMode = (body as { raw?: boolean }).raw === true
    const garmentColor = (body as { garmentColor?: string }).garmentColor

    let finalPrompt: string
    let optimized = { optimizedPrompt: "", styleApplied: null as string | null, variants: [] as string[] }

    if (rawMode) {
      // Print-ready layer: aplica reglas de contraste, separacion de bordes y
      // safety rules segun el color de prenda destino. Reemplaza al optimizer
      // textil viejo cuando el flow del nuevo /crear usa raw=true.
      const { buildPrintReadyPrompt } = await import("@/lib/designer/print-ready-prompt")
      finalPrompt = `${buildPrintReadyPrompt(basePrompt, { garmentColor })}${aspectRatioHint}`
    } else {
      optimized = optimizeDesignPrompt(basePrompt, styleId, { colorway, printArea })
      const hardGuard =
        "SOLO una ilustración aislada. PROHIBIDO: prendas, remeras, buzos, hoodies, sweaters, ropa, personas, mockups, fotografía de producto, escenas, marcos, texto superpuesto."
      finalPrompt = `${optimized.optimizedPrompt}. ${hardGuard}${aspectRatioHint}`.trim()
    }

    console.log("GEN-IMG optimizer", {
      styleApplied: optimized.styleApplied,
      optimizedLen: optimized.optimizedPrompt.length,
      finalLen: finalPrompt.length,
      preview: DEBUG ? finalPrompt.slice(0, 200) : undefined,
    })

    const n = Math.max(1, Math.min(4, (body as any).n ?? 1))
    const model = genAI.getGenerativeModel({ model: IMAGE_MODEL })

    // 3) Función para generar e intentar extraer imágenes
    async function runOnce(prompt: string) {
      const res = await model.generateContent([prompt])
      const imagesBase64: string[] = []
      for (const cand of res.response?.candidates ?? []) {
        for (const part of cand?.content?.parts ?? []) {
          // @ts-ignore
          const inline = part?.inlineData
          // @ts-ignore
          if (inline?.mimeType?.startsWith("image/") && typeof inline?.data === "string") {
            // @ts-ignore
            imagesBase64.push(inline.data)
            if (imagesBase64.length >= n) break
          }
        }
        if (imagesBase64.length >= n) break
      }
      const fallbackText = res.response?.text?.()
      return { imagesBase64, fallbackText }
    }

    // 4) Primer intento
    const tGen0 = Date.now()
    let { imagesBase64, fallbackText } = await runOnce(finalPrompt)
    const tGen1 = Date.now()

    // 5) Si vino texto en vez de imagen, reintentar reforzando
    if (!imagesBase64.length) {
      console.warn(
        "GEN-IMG no images (1st). fallbackText:",
        DEBUG ? fallbackText : fallbackText ? `len=${fallbackText.length}` : null,
      )
      const reinforced = "RESPONDE SOLO CON UNA IMAGEN (inlineData). No devuelvas texto.\n" + finalPrompt
      const tGen2 = Date.now()
      const retry = await runOnce(reinforced)
      const tGen3 = Date.now()
      imagesBase64 = retry.imagesBase64
      fallbackText = retry.fallbackText
      console.log("GEN-IMG retry", { ms: tGen3 - tGen2, gotImages: !!imagesBase64.length })
    }

    // 5b) Quality check — si Gemini devolvió una imagen muy plana (mostly
    // one color = washed-out o casi vacía) reintentamos con prompt reforzado.
    // Solo aplicamos en raw mode (sin optimizer textile que ya constrains).
    if (rawMode && imagesBase64.length && imagesBase64[0]) {
      try {
        const sharp = (await import("sharp")).default
        const buf = Buffer.from(imagesBase64[0], "base64")
        const stats = await sharp(buf).stats()
        // stdev promedio across channels. Si < 18 = imagen muy plana.
        const avgStdev =
          stats.channels.reduce((acc, c) => acc + c.stdev, 0) / Math.max(1, stats.channels.length)
        console.log("GEN-IMG quality check stdev:", avgStdev.toFixed(1))
        if (avgStdev < 18) {
          console.warn("GEN-IMG low quality detected (flat image) — retrying")
          const stronger =
            finalPrompt +
            " The design MUST have rich contrast, multiple visual elements, and clear silhouettes — do NOT return a blank, washed-out or single-color image."
          const retry2 = await runOnce(stronger)
          if (retry2.imagesBase64.length) {
            const buf2 = Buffer.from(retry2.imagesBase64[0]!, "base64")
            const stats2 = await sharp(buf2).stats()
            const avg2 =
              stats2.channels.reduce((acc, c) => acc + c.stdev, 0) /
              Math.max(1, stats2.channels.length)
            console.log("GEN-IMG retry stdev:", avg2.toFixed(1))
            // Solo reemplaza si el retry es mejor
            if (avg2 > avgStdev) imagesBase64 = retry2.imagesBase64
          }
        }
      } catch (e) {
        console.warn("GEN-IMG quality check failed:", (e as Error).message)
      }
    }

    if (!imagesBase64.length) {
      return ok(
        {
          error:
            "Gemini devolvió texto en lugar de imagen. Intentá un prompt más específico (p. ej., 'león realista, primer plano, fondo transparente').",
          debugText: DEBUG ? fallbackText : undefined,
        },
        502,
      )
    }

    const out = await Promise.all(imagesBase64.map(async (b64) => {
      const buffer = Buffer.from(b64, 'base64')
      const timestamp = Date.now()
      const storageKey = `v1/raw-designs/${timestamp}-${Math.random().toString(36).substring(2, 7)}.png`

      try {
        const { url: publicUrl, provider } = await uploadFile(buffer, storageKey, "image/png")
        console.log(`[STORAGE] Generated image saved to ${provider.toUpperCase()}: ${storageKey}`)
        return {
          data: b64,
          url: publicUrl,
          hasBgRemoved: false,
          storageProvider: provider
        }
      } catch (err: any) {
        console.error(`[STORAGE] Failed to save generated image:`, err.message)
        return {
          data: b64,
          url: `data:image/png;base64,${b64}`,
          hasBgRemoved: false,
          isFallback: true
        }
      }
    }))
    const t1 = Date.now()
    console.log("GEN-IMG done", { totalMs: t1 - t0, count: out.length })

    return ok({
      success: true,
      promptUsed: finalPrompt,
      styleApplied: optimized.styleApplied,
      variants: optimized.variants,
      images: out,
    })
  } catch (e: any) {
    const t1 = Date.now()
    // 🔔 Notificar por Telegram
    try {
      const { notifyError } = await import("@/lib/notifications")
      await notifyError({
        area: "Generador de Imágenes (Gemini)",
        endpoint: "/api/generate-image",
        message: e.message || "Unknown error"
      })
    } catch (notifErr: any) {
      console.error("❌ Error sending error notification:", notifErr.message)
    }

    return ok({ error: e?.message ?? "Error generando imagen" }, 500)
  }
}
