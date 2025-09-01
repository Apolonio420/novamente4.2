import { NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"

export const runtime = "nodejs"

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
}

function jsonResponse(data: any, status = 200) {
  return new NextResponse(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS },
  })
}

export async function OPTIONS() {
  return jsonResponse({ ok: true })
}

export async function POST(req: Request) {
  console.log("[v0] APPLY-DESIGN: Starting request processing")

  try {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      console.error("[v0] APPLY-DESIGN: Missing GEMINI_API_KEY")
      return jsonResponse({ error: "Missing GEMINI_API_KEY" }, 500)
    }

    const body = await req.json()
    console.log("[v0] APPLY-DESIGN: Body received", {
      hasDesignBase64: !!body.designBase64,
      productPath: body.productPath,
      placement: body.placement || "chest",
      scaleHint: body.scaleHint || "medium",
    })

    if (!body.designBase64) {
      return jsonResponse({ error: "Falta designBase64" }, 400)
    }

    let productDataUrl: string

    if (body.productBase64) {
      productDataUrl = body.productBase64
      console.log("[v0] APPLY-DESIGN: Using provided productBase64")
    } else if (body.productPath) {
      try {
        const url = new URL(req.url)
        const baseUrl = `${url.protocol}//${url.host}`
        const imageUrl = `${baseUrl}/garments/${body.productPath}`

        console.log("[v0] APPLY-DESIGN: Fetching image from:", imageUrl)

        const response = await fetch(imageUrl)
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        const arrayBuffer = await response.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)

        const mimeType = body.productPath.toLowerCase().endsWith(".png") ? "image/png" : "image/jpeg"
        productDataUrl = `data:${mimeType};base64,${buffer.toString("base64")}`
        console.log("[v0] APPLY-DESIGN: Image fetched and converted successfully")
      } catch (error: any) {
        console.error("[v0] APPLY-DESIGN: Failed to fetch image:", error.message)
        return jsonResponse({ error: `No se pudo cargar la imagen: ${body.productPath}` }, 404)
      }
    } else {
      return jsonResponse({ error: "Debe enviar productBase64 o productPath" }, 400)
    }

    const placement = body.placement || "chest"
    const scale = body.scaleHint || "medium"

    const placementMap: Record<string, string> = {
      chest: "centrada en el pecho",
      back: "centrada en la espalda",
      left: "en el lado izquierdo",
      right: "en el lado derecho",
    }

    const scaleMap: Record<string, string> = {
      small: "tamaño pequeño (25% del ancho)",
      medium: "tamaño medio (45% del ancho)",
      large: "tamaño grande (65% del ancho)",
    }

    const prompt = `Superpone la estampa sobre la prenda de manera realista. Ubicación: ${placementMap[placement] || placementMap.chest}. Tamaño: ${scaleMap[scale] || scaleMap.medium}. Mantén las arrugas y sombras naturales.`

    console.log("[v0] APPLY-DESIGN: Calling Gemini API")

    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({
      model: process.env.GEMINI_IMAGE_MODEL || "gemini-2.5-flash-image-preview",
    })

    // Parse data URLs
    const productB64 = productDataUrl.split(",")[1]
    const productMime = productDataUrl.match(/data:(.*?);base64/)?.[1] || "image/png"

    const designB64 = body.designBase64.split(",")[1]
    const designMime = body.designBase64.match(/data:(.*?);base64/)?.[1] || "image/png"

    const result = await model.generateContent([
      { text: prompt },
      { inlineData: { data: productB64, mimeType: productMime } },
      { inlineData: { data: designB64, mimeType: designMime } },
    ])

    let imageData: string | null = null

    const candidates = result.response?.candidates || []
    for (const candidate of candidates) {
      const parts = candidate?.content?.parts || []
      for (const part of parts) {
        if (part && typeof part === "object" && "inlineData" in part) {
          const inlineData = part.inlineData as any
          if (inlineData?.mimeType?.startsWith("image/")) {
            imageData = inlineData.data
            break
          }
        }
      }
      if (imageData) break
    }

    if (!imageData) {
      console.error("[v0] APPLY-DESIGN: No image returned from Gemini")
      return jsonResponse({ error: "No se pudo generar la imagen fusionada" }, 502)
    }

    console.log("[v0] APPLY-DESIGN: Success - image generated")
    return jsonResponse({
      success: true,
      image: {
        data: imageData,
        contentType: "image/png",
      },
    })
  } catch (error: any) {
    console.error("[v0] APPLY-DESIGN: Error:", error.message)
    return jsonResponse({ error: error.message || "Error aplicando diseño" }, 500)
  }
}
