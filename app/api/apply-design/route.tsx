export const runtime = "nodejs"

import { type NextRequest, NextResponse } from "next/server"
import { getGeminiClient } from "@/lib/gemini"
import { headers } from "next/headers"
import * as path from "path"

// Utility functions for file handling
function mimeFromExt(ext: string): string {
  switch (ext.toLowerCase()) {
    case ".png":
      return "image/png"
    case ".jpg":
    case ".jpeg":
      return "image/jpeg"
    case ".gif":
      return "image/gif"
    case ".webp":
      return "image/webp"
    default:
      return "image/png"
  }
}

function bufferToDataUrl(buffer: Buffer, mimeType: string): string {
  const base64 = buffer.toString("base64")
  return `data:${mimeType};base64,${base64}`
}

async function readGarmentFromPublicViaHTTP(fileRel: string, req: Request) {
  // origin de la request o VERCEL_URL como respaldo
  const h = headers()
  const hdrOrigin = h.get("origin")
  const vercel = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null
  const origin = hdrOrigin || vercel || "http://localhost:3000"
  const url = `${origin}/garments/${fileRel}`
  const resp = await fetch(url)
  if (!resp.ok) throw new Error(`fetch public failed: ${resp.status}`)
  const arrayBuf = await resp.arrayBuffer()
  const ext = path.extname(fileRel).toLowerCase()
  const mime = ext === ".png" ? "image/png" : ext === ".webp" ? "image/webp" : "image/jpeg"
  const b64 = Buffer.from(arrayBuf).toString("base64")
  return `data:${mime};base64,${b64}`
}

async function fetchGarmentImage(productPath: string, baseUrl: string): Promise<string | null> {
  const garmentUrl = `${baseUrl}/garments/${productPath}`
  console.log(`[v0] APPLY-DESIGN: Attempting to fetch garment from: ${garmentUrl}`)

  try {
    const response = await fetch(garmentUrl)
    console.log(`[v0] APPLY-DESIGN: Garment fetch response status: ${response.status}`)

    if (!response.ok) {
      console.log(`[v0] APPLY-DESIGN: Failed to fetch garment: ${response.status} ${response.statusText}`)
      return null
    }

    const arrayBuffer = await response.arrayBuffer()
    const base64 = Buffer.from(arrayBuffer).toString("base64")
    const contentType = response.headers.get("content-type") || "image/png"

    console.log(
      `[v0] APPLY-DESIGN: Successfully fetched garment image (${arrayBuffer.byteLength} bytes, ${contentType})`,
    )
    return `data:${contentType};base64,${base64}`
  } catch (error: any) {
    console.log(`[v0] APPLY-DESIGN: Error fetching garment: ${error.message}`)
    return null
  }
}

const SAFE_RE = /^[a-zA-Z0-9._-]+$/
const ALLOWED_EXT = new Set([".png", ".jpg", ".jpeg", ".webp"])

function isSafePath(p: string) {
  return SAFE_RE.test(p) && ALLOWED_EXT.has(path.extname(p).toLowerCase())
}

export async function POST(request: NextRequest) {
  console.log("[v0] APPLY-DESIGN: Starting request processing")

  try {
    const body = await request.json()

    console.log("APPLY-DESIGN input", {
      hasDesign: !!body.designBase64,
      src: body.productBase64 ? "base64" : "public",
      productPath: body.productPath,
      placement: body.placement,
      scaleHint: body.scaleHint,
    })

    if (!body.designBase64) {
      console.log("[v0] APPLY-DESIGN: Missing designBase64")
      return NextResponse.json({ success: false, error: "Falta designBase64" }, { status: 400 })
    }

    if (body.productPath && !isSafePath(body.productPath)) {
      console.log(`[v0] APPLY-DESIGN: Invalid productPath: ${body.productPath}`)
      return NextResponse.json({ success: false, error: "productPath inválido" }, { status: 400 })
    }

    let productDataUrl: string
    let methodUsed = ""

    if (body.productBase64) {
      // Use productBase64 directly
      console.log("[v0] APPLY-DESIGN: Using provided productBase64")
      productDataUrl = body.productBase64
      methodUsed = "base64"
    } else if (body.productPath) {
      // Siempre usar HTTP público para evitar que Next tracee todo public/garments en el bundle
      try {
        productDataUrl = await readGarmentFromPublicViaHTTP(body.productPath!, request)
        methodUsed = "http"
        console.log("[v0] APPLY-DESIGN: Successfully loaded garment via HTTP (no fs)")
      } catch (error: any) {
        console.log(`[v0] APPLY-DESIGN: HTTP load failed: ${error.message}`)
        return NextResponse.json({ success: false, error: "productPath invalido o no encontrado" }, { status: 400 })
      }
    } else {
      console.log("[v0] APPLY-DESIGN: Missing both productBase64 and productPath")
      return NextResponse.json({ success: false, error: "Se requiere productBase64 o productPath" }, { status: 400 })
    }

    const gemini = getGeminiClient()
    const model = gemini.getGenerativeModel({
      model: process.env.GEMINI_IMAGE_MODEL || "gemini-2.5-flash-image-preview",
    })

    const placement = body.placement || "Coloca el diseño en el centro de la prenda"
    const scaleHint = body.scaleHint || "Tamaño mediano del diseño"

    const promptText = `Aplica este diseño a la prenda siguiendo estas instrucciones:
- ${placement}
- ${scaleHint}
- Mantén la forma y proporciones originales de la prenda
- El diseño debe verse natural y bien integrado
- Devuelve solo la imagen final de la prenda con el diseño aplicado`

    if (process.env.DEBUG_GEMINI === "true") {
      console.log("APPLY-DESIGN debug", {
        promptText,
        methodUsed,
      })
    }

    console.log("[v0] APPLY-DESIGN: Calling Gemini with prompt:", promptText)

    const result = await model.generateContent([
      promptText,
      {
        inlineData: {
          data: body.designBase64.replace(/^data:image\/[^;]+;base64,/, ""),
          mimeType: "image/png",
        },
      },
      {
        inlineData: {
          data: productDataUrl.replace(/^data:image\/[^;]+;base64,/, ""),
          mimeType: "image/png",
        },
      },
    ])

    console.log("[v0] APPLY-DESIGN: Gemini response received")

    const response = await result.response
    const candidates = response.candidates

    if (!candidates || candidates.length === 0) {
      console.log("[v0] APPLY-DESIGN: No candidates in response")
      return NextResponse.json({ success: false, error: "No se pudo generar la imagen" }, { status: 500 })
    }

    const parts = candidates[0].content.parts
    const imagePart = parts.find((part) => part.inlineData)

    if (!imagePart || !imagePart.inlineData) {
      console.log("[v0] APPLY-DESIGN: No image data in response")
      return NextResponse.json({ success: false, error: "No se recibió imagen del modelo" }, { status: 500 })
    }

    console.log("[v0] APPLY-DESIGN: Successfully generated image")

    console.log("APPLY-DESIGN done", {
      placement: body.placement,
      scale: body.scaleHint,
    })

    return NextResponse.json({
      success: true,
      image: {
        data: imagePart.inlineData.data,
        contentType: "image/png",
      },
    })
  } catch (error: any) {
    console.error("[v0] APPLY-DESIGN: Error:", error.message)
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Error interno del servidor",
      },
      { status: 500 },
    )
  }
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  })
}
