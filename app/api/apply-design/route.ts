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
  console.log("[v0] APPLY-DESIGN: OPTIONS request received")
  return jsonResponse({ ok: true })
}

export async function POST(req: Request) {
  console.log("[v0] APPLY-DESIGN: === POST REQUEST STARTED ===")
  console.log("[v0] APPLY-DESIGN: Request URL:", req.url)
  console.log("[v0] APPLY-DESIGN: Request method:", req.method)
  console.log("[v0] APPLY-DESIGN: Request headers:", Object.fromEntries(req.headers.entries()))

  try {
    console.log("[v0] APPLY-DESIGN: Checking environment variables...")
    const apiKey = process.env.GEMINI_API_KEY
    const imageModel = process.env.GEMINI_IMAGE_MODEL
    console.log("[v0] APPLY-DESIGN: Environment check:", {
      hasGeminiApiKey: !!apiKey,
      geminiImageModel: imageModel || "gemini-2.5-flash-image-preview (default)",
    })

    if (!apiKey) {
      console.error("[v0] APPLY-DESIGN: ERROR - Missing GEMINI_API_KEY")
      return jsonResponse({ error: "Missing GEMINI_API_KEY" }, 500)
    }

    console.log("[v0] APPLY-DESIGN: Parsing request body...")
    const body = await req.json()
    console.log("[v0] APPLY-DESIGN: Body received:", {
      hasDesignBase64: !!body.designBase64,
      designBase64Length: body.designBase64?.length || 0,
      hasProductBase64: !!body.productBase64,
      productBase64Length: body.productBase64?.length || 0,
      productPath: body.productPath,
      placement: body.placement || "chest",
      scaleHint: body.scaleHint || "medium",
    })

    if (!body.designBase64) {
      console.error("[v0] APPLY-DESIGN: ERROR - Missing designBase64")
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

        console.log("[v0] APPLY-DESIGN: Fetching image from URL:", imageUrl)
        console.log("[v0] APPLY-DESIGN: Base URL:", baseUrl)
        console.log("[v0] APPLY-DESIGN: Product path:", body.productPath)

        const response = await fetch(imageUrl)
        console.log("[v0] APPLY-DESIGN: Fetch response status:", response.status)
        console.log("[v0] APPLY-DESIGN: Fetch response ok:", response.ok)
        console.log("[v0] APPLY-DESIGN: Fetch response headers:", Object.fromEntries(response.headers.entries()))

        if (!response.ok) {
          console.error("[v0] APPLY-DESIGN: ERROR - Fetch failed:", response.status, response.statusText)
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        console.log("[v0] APPLY-DESIGN: Converting response to array buffer...")
        const arrayBuffer = await response.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)
        console.log("[v0] APPLY-DESIGN: Buffer size:", buffer.length, "bytes")

        const mimeType = body.productPath.toLowerCase().endsWith(".png") ? "image/png" : "image/jpeg"
        productDataUrl = `data:${mimeType};base64,${buffer.toString("base64")}`
        console.log("[v0] APPLY-DESIGN: Image converted to data URL successfully")
        console.log("[v0] APPLY-DESIGN: Data URL length:", productDataUrl.length)
        console.log("[v0] APPLY-DESIGN: MIME type:", mimeType)
      } catch (error: any) {
        console.error("[v0] APPLY-DESIGN: ERROR - Failed to fetch image:", error)
        console.error("[v0] APPLY-DESIGN: Error name:", error.name)
        console.error("[v0] APPLY-DESIGN: Error message:", error.message)
        console.error("[v0] APPLY-DESIGN: Error stack:", error.stack)
        return jsonResponse({ error: `No se pudo cargar la imagen: ${body.productPath}` }, 404)
      }
    } else {
      console.error("[v0] APPLY-DESIGN: ERROR - Missing both productBase64 and productPath")
      return jsonResponse({ error: "Debe enviar productBase64 o productPath" }, 400)
    }

    const placement = body.placement || "chest"
    const scale = body.scaleHint || "medium"

    console.log("[v0] APPLY-DESIGN: Processing placement and scale...")
    console.log("[v0] APPLY-DESIGN: Placement:", placement)
    console.log("[v0] APPLY-DESIGN: Scale:", scale)

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
    console.log("[v0] APPLY-DESIGN: Generated prompt:", prompt)

    console.log("[v0] APPLY-DESIGN: Initializing Gemini AI...")
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({
      model: process.env.GEMINI_IMAGE_MODEL || "gemini-2.5-flash-image-preview",
    })
    console.log("[v0] APPLY-DESIGN: Gemini model initialized")

    // Parse data URLs
    console.log("[v0] APPLY-DESIGN: Parsing data URLs...")
    const productB64 = productDataUrl.split(",")[1]
    const productMime = productDataUrl.match(/data:(.*?);base64/)?.[1] || "image/png"

    const designB64 = body.designBase64.split(",")[1] || body.designBase64
    const designMime = body.designBase64.match(/data:(.*?);base64/)?.[1] || "image/png"

    console.log("[v0] APPLY-DESIGN: Data URL parsing results:", {
      productB64Length: productB64?.length || 0,
      productMime,
      designB64Length: designB64?.length || 0,
      designMime,
    })

    console.log("[v0] APPLY-DESIGN: Calling Gemini API...")
    const startTime = Date.now()

    const result = await model.generateContent([
      { text: prompt },
      { inlineData: { data: productB64, mimeType: productMime } },
      { inlineData: { data: designB64, mimeType: designMime } },
    ])

    const endTime = Date.now()
    console.log("[v0] APPLY-DESIGN: Gemini API call completed in", endTime - startTime, "ms")
    console.log("[v0] APPLY-DESIGN: Gemini response:", {
      hasCandidates: !!result.response?.candidates,
      candidatesLength: result.response?.candidates?.length || 0,
    })

    let imageData: string | null = null

    const candidates = result.response?.candidates || []
    console.log("[v0] APPLY-DESIGN: Processing", candidates.length, "candidates...")

    for (let i = 0; i < candidates.length; i++) {
      const candidate = candidates[i]
      console.log("[v0] APPLY-DESIGN: Processing candidate", i + 1)
      console.log("[v0] APPLY-DESIGN: Candidate has content:", !!candidate?.content)
      console.log("[v0] APPLY-DESIGN: Candidate parts length:", candidate?.content?.parts?.length || 0)

      const parts = candidate?.content?.parts || []
      for (let j = 0; j < parts.length; j++) {
        const part = parts[j]
        console.log("[v0] APPLY-DESIGN: Processing part", j + 1, "of candidate", i + 1)
        console.log("[v0] APPLY-DESIGN: Part type:", typeof part)
        console.log(
          "[v0] APPLY-DESIGN: Part has inlineData:",
          !!(part && typeof part === "object" && "inlineData" in part),
        )

        if (part && typeof part === "object" && "inlineData" in part) {
          const inlineData = part.inlineData as any
          console.log("[v0] APPLY-DESIGN: InlineData mimeType:", inlineData?.mimeType)
          console.log("[v0] APPLY-DESIGN: InlineData has data:", !!inlineData?.data)
          console.log("[v0] APPLY-DESIGN: InlineData data length:", inlineData?.data?.length || 0)

          if (inlineData?.mimeType?.startsWith("image/")) {
            imageData = inlineData.data
            console.log("[v0] APPLY-DESIGN: Found image data!")
            break
          }
        }
      }
      if (imageData) break
    }

    if (!imageData) {
      console.error("[v0] APPLY-DESIGN: ERROR - No image data found in Gemini response")
      console.error("[v0] APPLY-DESIGN: Full response structure:", JSON.stringify(result.response, null, 2))
      return jsonResponse({ error: "No se pudo generar la imagen fusionada" }, 502)
    }

    console.log("[v0] APPLY-DESIGN: SUCCESS - Image generated successfully")
    console.log("[v0] APPLY-DESIGN: Final image data length:", imageData.length)
    console.log("[v0] APPLY-DESIGN: === POST REQUEST COMPLETED ===")

    return jsonResponse({
      success: true,
      image: {
        data: imageData,
        contentType: "image/png",
      },
    })
  } catch (error: any) {
    console.error("[v0] APPLY-DESIGN: FATAL ERROR:", error)
    console.error("[v0] APPLY-DESIGN: Error name:", error.name)
    console.error("[v0] APPLY-DESIGN: Error message:", error.message)
    console.error("[v0] APPLY-DESIGN: Error stack:", error.stack)
    console.log("[v0] APPLY-DESIGN: === POST REQUEST FAILED ===")
    return jsonResponse({ error: error.message || "Error aplicando diseño" }, 500)
  }
}
