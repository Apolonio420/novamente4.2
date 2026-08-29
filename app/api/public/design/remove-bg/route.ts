// Background removal en cascada: determinístico (gratis) → Gemini con gate de
// alpha real → remove.bg (API paga) → error honesto.
//
// Lo que había: se le pedía a Gemini "fondo transparente" y se subía SU salida
// tal cual. Gemini NUNCA devuelve alpha: pinta el damero de transparencia como
// píxeles opacos (verificado 28/08/2026 con un diseño real: salió RGB opaco
// con el cuadriculado pintado, listo para imprimirse). Es el mismo bug del
// path de partners arreglado el 26/08 — esta era la variante pública, la que
// usa el chip "Sin fondo" de /crear.
import { NextRequest, NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"
import { uploadFile } from "@/lib/cloudflare-r2"
import { resolveAbsoluteUrl } from "@/lib/absolute-url"
import { corsHeaders, preflightResponse } from "@/lib/security/cors"
import { guardPublicImageGen } from "@/lib/security/public-image-guard"
import { meterPublicImageGen } from "@/lib/security/meter-usage"
import { hasRealAlpha, magentaKey } from "@/lib/mockup/perfect-stamp"

export const runtime = "nodejs"
export const maxDuration = 60

// Remove-bg NUNCA necesita pro — misma cadena que su gemelo
// app/api/magic-remove-bg/route.ts (GEMINI_REMOVE_BG_MODEL, default flash-image).
const IMAGE_MODEL = process.env.GEMINI_REMOVE_BG_MODEL ?? "gemini-2.5-flash-image"

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

    let outBuffer: Buffer | null = null
    let method = ""
    let geminiCalls = 0

    // 1) Determinístico (gratis): blanco liso, damero pintado, y el pelado por
    //    capas para arte "tipo póster" (placa lisa + marco degradé — el caso
    //    que ni Gemini ni remove.bg resuelven). El pelado es agresivo y va SOLO
    //    acá, donde la persona pidió sacar el fondo explícitamente — nunca en
    //    los caminos automáticos de mockup.
    try {
      const { removeWhiteBackground } = await import("@/lib/designer/remove-white-bg")
      const { removeCheckerboardBackground } = await import("@/lib/designer/remove-checkerboard-bg")
      const { removeFlatLayeredBackground } = await import("@/lib/designer/remove-flat-bg")
      let det = imgBuffer
      let removed = false
      const w = await removeWhiteBackground(det)
      if (w.removed) { det = w.buffer as Buffer; removed = true }
      const c = await removeCheckerboardBackground(det)
      if (c.removed) { det = c.buffer as Buffer; removed = true }
      const f = await removeFlatLayeredBackground(det)
      if (f.removed) { det = f.buffer; removed = true }
      if (removed && (await hasRealAlpha(det))) {
        outBuffer = det
        method = "deterministico"
      }
    } catch (e) {
      console.warn("[remove-bg] pase determinístico falló:", (e as Error)?.message)
    }

    // 2) Gemini — pero su salida vale SOLO si trae alpha de verdad. Si vuelve
    //    opaca (damero pintado) se DESCARTA: además de no ser transparente,
    //    re-renderiza el arte y lo cambia.
    if (!outBuffer) {
      try {
        const genAI = new GoogleGenerativeAI(apiKey)
        const model = genAI.getGenerativeModel({ model: IMAGE_MODEL })
        const result = await model.generateContent([
          {
            inlineData: {
              mimeType: mimeType as "image/png" | "image/jpeg" | "image/webp",
              data: imgBuffer.toString("base64"),
            },
          },
          BG_REMOVAL_PROMPT,
        ])
        geminiCalls++
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
        if (imageBase64) {
          const candidato = await magentaKey(Buffer.from(imageBase64, "base64"))
          if (await hasRealAlpha(candidato)) {
            outBuffer = candidato
            method = "gemini"
          } else {
            console.warn("[remove-bg] Gemini devolvió imagen SIN alpha real → descartada")
          }
        }
      } catch (e) {
        console.warn("[remove-bg] Gemini falló:", (e as Error)?.message)
      }
    }

    // 3) remove.bg — la API paga, último recurso. Alpha real garantizado.
    if (!outBuffer && process.env.REMOVE_BG_KEY) {
      try {
        const form = new FormData()
        form.append("image_file", new Blob([new Uint8Array(imgBuffer)]), "design.png")
        form.append("size", "auto")
        form.append("format", "png")
        const r = await fetch("https://api.remove.bg/v1.0/removebg", {
          method: "POST",
          headers: { "X-Api-Key": process.env.REMOVE_BG_KEY },
          body: form,
        })
        if (r.ok) {
          const candidato = Buffer.from(await r.arrayBuffer())
          if (await hasRealAlpha(candidato)) {
            outBuffer = candidato
            method = "removebg"
          }
        } else {
          console.warn("[remove-bg] remove.bg respondió", r.status)
        }
      } catch (e) {
        console.warn("[remove-bg] remove.bg falló:", (e as Error)?.message)
      }
    }

    // La medición va ANTES del early-return: las llamadas a Gemini se hicieron
    // aunque el resultado se haya descartado.
    if (geminiCalls > 0) {
      await meterPublicImageGen({ endpoint: "public/design/remove-bg", model: IMAGE_MODEL })
    }

    if (!outBuffer) {
      // Devolver el original diciendo "listo" sería mentir; devolver el damero,
      // peor (se imprime). Error claro y el diseño queda como estaba.
      return ok({ error: "No pudimos separar el fondo de esta imagen 😅 Probá con otra versión del diseño." }, 502)
    }

    const key = `v1/no-bg/${Date.now()}-${Math.random().toString(36).substring(2, 7)}.png`
    const { url } = await uploadFile(outBuffer, key, "image/png")

    return ok({ success: true, images: [{ url }], method })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error("[remove-bg] error:", msg)
    return ok({ error: msg }, 500)
  }
}
