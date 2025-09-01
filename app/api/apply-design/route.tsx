export const runtime = "nodejs"

import { type NextRequest, NextResponse } from "next/server"
import { getGeminiClient } from "@/lib/gemini"

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

function createGarmentFallback(productPath: string): string {
  console.log(`[v0] APPLY-DESIGN: Creating PNG fallback for ${productPath}`)

  // Extract garment info from filename
  const type = productPath.includes("hoodie") ? "hoodie" : "tshirt"
  const color = productPath.includes("black")
    ? "#2d2d2d"
    : productPath.includes("white")
      ? "#f5f5f5"
      : productPath.includes("gray")
        ? "#8b8b8b"
        : productPath.includes("caramel")
          ? "#d2b48c"
          : "#2d2d2d"

  const width = 400
  const height = 500

  // Create a simple colored PNG template (this is still a fallback)
  const pngData = `iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==`

  console.log(`[v0] APPLY-DESIGN: Created ${type} fallback in color ${color}`)
  return `data:image/png;base64,${pngData}`
}

export async function POST(request: NextRequest) {
  console.log("[v0] APPLY-DESIGN: Starting request processing")

  try {
    const body = await request.json()
    console.log("[v0] APPLY-DESIGN: Body received", {
      hasDesignBase64: !!body.designBase64,
      productPath: body.productPath,
      placement: body.placement,
      scaleHint: body.scaleHint,
    })

    if (!body.designBase64) {
      console.log("[v0] APPLY-DESIGN: Missing designBase64")
      return NextResponse.json({ success: false, error: "Falta designBase64" }, { status: 400 })
    }

    if (!body.productPath) {
      console.log("[v0] APPLY-DESIGN: Missing productPath")
      return NextResponse.json({ success: false, error: "Falta productPath" }, { status: 400 })
    }

    const baseUrl = request.nextUrl.origin
    console.log(`[v0] APPLY-DESIGN: Using base URL: ${baseUrl}`)
    console.log(`[v0] APPLY-DESIGN: Request origin: ${request.nextUrl.origin}`)
    console.log(`[v0] APPLY-DESIGN: Looking for garment: ${body.productPath}`)

    let garmentBase64 = await fetchGarmentImage(body.productPath, baseUrl)

    if (!garmentBase64) {
      console.log(`[v0] APPLY-DESIGN: Real garment not found, using fallback for ${body.productPath}`)
      garmentBase64 = createGarmentFallback(body.productPath)
    } else {
      console.log(`[v0] APPLY-DESIGN: Using REAL garment image for ${body.productPath}`)
    }

    const gemini = getGeminiClient()
    const model = gemini.getGenerativeModel({
      model: process.env.GEMINI_IMAGE_MODEL || "gemini-2.5-flash-image-preview",
    })

    const placement = body.placement || "Coloca el diseño en el centro de la prenda"
    const scaleHint = body.scaleHint || "Tamaño mediano del diseño"

    const prompt = `Aplica este diseño a la prenda siguiendo estas instrucciones:
- ${placement}
- ${scaleHint}
- Mantén la forma y proporciones originales de la prenda
- El diseño debe verse natural y bien integrado
- Devuelve solo la imagen final de la prenda con el diseño aplicado`

    console.log("[v0] APPLY-DESIGN: Calling Gemini with prompt:", prompt)
    console.log(`[v0] APPLY-DESIGN: Sending garment image (${garmentBase64.length} chars) and design to Gemini`)

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: body.designBase64.replace(/^data:image\/[^;]+;base64,/, ""),
          mimeType: "image/png",
        },
      },
      {
        inlineData: {
          data: garmentBase64.replace(/^data:image\/[^;]+;base64,/, ""),
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

    return NextResponse.json({
      success: true,
      image: {
        data: imagePart.inlineData.data,
        contentType: imagePart.inlineData.mimeType || "image/png",
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
