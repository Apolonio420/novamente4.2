import { NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"
import fs from "node:fs/promises"
import path from "node:path"

export const runtime = "nodejs"

// ==== Config ====
const IMAGE_MODEL = process.env.GEMINI_IMAGE_MODEL || "gemini-2.5-flash-image-preview"
const DEBUG = (process.env.DEBUG_GEMINI || "").toLowerCase() === "true"

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
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

type Body = {
  designBase64: string // data:image/png;base64,...
  productBase64?: string // data:image/jpeg;base64,...
  productPath?: string // ej: "hoodie/front.jpg" (en /public/garments)
  placement?: "chest" | "back" | "left" | "right"
  scaleHint?: "small" | "medium" | "large"
}

// Helpers
function dataUrlToInline(dataUrl: string) {
  const [hdr, b64] = dataUrl.split(",")
  if (!hdr || !b64) throw new Error("Data URL inválida")
  const mime = /data:(.*?);base64/.exec(hdr)?.[1] || "image/png"
  return { inlineData: { data: b64, mimeType: mime } }
}

function bufferToDataUrl(buf: Buffer, mime: string) {
  return `data:${mime};base64,` + buf.toString("base64")
}

function mimeFromExt(ext: string) {
  const e = ext.toLowerCase()
  if (e === ".jpg" || e === ".jpeg") return "image/jpeg"
  if (e === ".png") return "image/png"
  if (e === ".webp") return "image/webp"
  return "image/png"
}

function placementText(p?: Body["placement"]) {
  switch (p) {
    case "chest":
      return "centrada en el pecho"
    case "back":
      return "centrada en la espalda"
    case "left":
      return "en el lado izquierdo del frente"
    case "right":
      return "en el lado derecho del frente"
    default:
      return "centrada en el frente"
  }
}

function scaleText(s?: Body["scaleHint"]) {
  switch (s) {
    case "small":
      return "tamaño pequeño (20–30% del ancho del frente)"
    case "large":
      return "tamaño grande (60–70% del ancho del frente)"
    default:
      return "tamaño medio (40–50% del ancho del frente)"
  }
}

export async function POST(req: Request) {
  const t0 = Date.now()

  console.log("[v0] APPLY-DESIGN: Endpoint accessed")

  try {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      console.log("[v0] APPLY-DESIGN: Missing GEMINI_API_KEY")
      return ok({ error: "Missing GEMINI_API_KEY" }, 500)
    }

    const body = (await req.json()) as Body
    console.log("[v0] APPLY-DESIGN: Request body received", {
      hasDesignBase64: !!body.designBase64,
      hasProductBase64: !!body.productBase64,
      productPath: body.productPath,
      placement: body.placement,
      scaleHint: body.scaleHint,
    })

    if (!body.designBase64) return ok({ error: "Falta designBase64" }, 400)

    // 1) Preparar prenda: base64 o archivo en /public/garments/*
    let productDataUrl: string | undefined
    if (body.productBase64) {
      productDataUrl = body.productBase64
      console.log("[v0] APPLY-DESIGN: Using productBase64")
    } else if (body.productPath) {
      console.log("[v0] APPLY-DESIGN: Looking for file:", body.productPath)

      try {
        const possiblePaths = [
          path.join(process.cwd(), "public", "garments", body.productPath),
          path.join("public", "garments", body.productPath),
          path.join("/app", "public", "garments", body.productPath),
          path.join("/var/task", "app", "public", "garments", body.productPath),
          // Additional paths for v0 runtime
          path.join("/var/task", "public", "garments", body.productPath),
          path.join(process.cwd(), "app", "public", "garments", body.productPath),
        ]

        console.log("[v0] APPLY-DESIGN: Trying paths:", possiblePaths)

        let buf: Buffer | null = null
        let foundPath: string | null = null

        for (const testPath of possiblePaths) {
          try {
            buf = await fs.readFile(testPath)
            foundPath = testPath
            console.log("[v0] APPLY-DESIGN: Found file at:", testPath)
            break
          } catch (e) {
            console.log("[v0] APPLY-DESIGN: Path not found:", testPath)
            continue
          }
        }

        if (!buf) {
          console.error("[v0] APPLY-DESIGN: Could not find file at any path:", possiblePaths)
          return ok({ error: `No se pudo encontrar el archivo: ${body.productPath}` }, 404)
        }

        const mime = mimeFromExt(path.extname(body.productPath))
        productDataUrl = bufferToDataUrl(buf, mime)
        console.log("[v0] APPLY-DESIGN: File loaded successfully, mime:", mime)
      } catch (e: any) {
        console.error("[v0] APPLY-DESIGN: File read error:", e.message)
        return ok({ error: `Error leyendo archivo: ${e.message}` }, 500)
      }
    } else {
      return ok({ error: "Debe enviar productBase64 o productPath" }, 400)
    }

    const promptText = [
      "Superpone la estampa (segunda imagen) sobre la prenda (primera imagen) con aspecto realista:",
      "respetá arrugas, sombras e iluminación, como impresión integrada a la tela.",
      `Ubicación: ${placementText(body.placement)}.`,
      `Tamaño: ${scaleText(body.scaleHint)}.`,
      "No alteres colores ni detalles fuera del área de estampado.",
    ].join(" ")

    console.log("[v0] APPLY-DESIGN: Calling Gemini with prompt")

    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: IMAGE_MODEL })

    // ✅ SDK: array con texto + partes inline (product primero, luego design)
    const res = await model.generateContent([
      { text: promptText },
      dataUrlToInline(productDataUrl),
      dataUrlToInline(body.designBase64),
    ])

    // Extraer primera imagen resultante
    let outB64: string | null = null
    for (const cand of res.response?.candidates ?? []) {
      for (const part of cand?.content?.parts ?? []) {
        // @ts-ignore
        const inline = part?.inlineData
        // @ts-ignore
        if (inline?.mimeType?.startsWith("image/") && typeof inline?.data === "string") {
          // @ts-ignore
          outB64 = inline.data
          break
        }
      }
      if (outB64) break
    }

    if (!outB64) {
      const txt = res.response?.text?.()
      console.warn(
        "[v0] APPLY-DESIGN: No images returned. fallbackText:",
        DEBUG ? txt : txt ? `len=${txt.length}` : null,
      )
      return ok({ error: "Gemini no devolvió imagen fusionada" }, 502)
    }

    const t1 = Date.now()
    console.log("[v0] APPLY-DESIGN: Success", { ms: t1 - t0, placement: body.placement, scale: body.scaleHint })
    return ok({ success: true, image: { data: outB64, contentType: "image/png" } })
  } catch (e: any) {
    const t1 = Date.now()
    console.error("[v0] APPLY-DESIGN: FATAL ERROR", {
      ms: t1 - t0,
      message: e?.message,
      status: e?.status,
      code: e?.code,
      details: e?.details,
    })
    return ok({ error: e?.message ?? "Error aplicando diseño" }, 500)
  }
}
