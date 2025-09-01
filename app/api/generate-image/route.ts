import { NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"

export const runtime = "nodejs"

// ==== Config ====
const IMAGE_MODEL = process.env.GEMINI_IMAGE_MODEL || "gemini-1.5-flash"
const TEXT_MODEL = process.env.GEMINI_TEXT_MODEL || "gemini-1.5-pro"
const DEBUG = (process.env.DEBUG_GEMINI || "").toLowerCase() === "true"

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
}

type Body = { prompt: string; n?: number } | { instruction: string; lastPrompt: string; n?: number }

function ok(data: unknown, status = 200) {
  return new NextResponse(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...CORS },
  })
}

export async function OPTIONS() {
  return ok({ ok: true })
}

export async function POST(req: Request) {
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

    // 2) Forzar intención de imagen
    const forcePrefix =
      "Crea UNA imagen para estampa, estilo limpio, SIN texto superpuesto," +
      " PNG con fondo transparente si corresponde. Evita marcos o mockups." +
      " Composición clara, altos contrastes, ideal para impresión en prenda. "
    const finalPrompt = `${forcePrefix}\n${basePrompt}`.trim()

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

    const out = imagesBase64.map((b64) => ({ data: b64, contentType: "image/png" }))
    const t1 = Date.now()
    console.log("GEN-IMG done", { totalMs: t1 - t0, count: out.length })

    return ok({ success: true, promptUsed: finalPrompt, images: out })
  } catch (e: any) {
    const t1 = Date.now()
    console.error("GEN-IMG FATAL", {
      ms: t1 - t0,
      message: e?.message,
      status: e?.status,
      code: e?.code,
      details: e?.details,
    })
    return ok({ error: e?.message ?? "Error generando imagen" }, 500)
  }
}
