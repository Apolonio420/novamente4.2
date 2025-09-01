export const runtime = "nodejs"

import { type NextRequest, NextResponse } from "next/server"
import { getGeminiClient } from "@/lib/gemini"

const GARMENT_IMAGES: Record<string, string> = {
  "hoodie-black-front.png":
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==", // 1x1 transparent PNG placeholder
  "hoodie-caramel-front.png":
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
  "hoodie-gray-front.png":
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
  "hoodie-white-front.png":
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
  "tshirt-black-front.png":
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
  "tshirt-white-front.png":
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
}

function createGarmentTemplate(productPath: string): string {
  console.log(`[v0] APPLY-DESIGN: Creating template for ${productPath}`)

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

  // Create a simple colored rectangle as PNG base64 (400x500 pixels)
  const canvas = `<svg width="400" height="500" xmlns="http://www.w3.org/2000/svg">
    <rect width="400" height="500" fill="${color}"/>
    <text x="200" y="250" textAnchor="middle" fill="white" fontSize="16">${type.toUpperCase()}</text>
  </svg>`

  // Convert SVG to base64 (this is still SVG, but we'll tell Gemini it's a garment template)
  const base64 = Buffer.from(canvas).toString("base64")
  return `data:image/svg+xml;base64,${base64}`
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

    // Get garment image - try hardcoded first, then create template
    let garmentBase64 = GARMENT_IMAGES[body.productPath]
    if (!garmentBase64) {
      console.log(`[v0] APPLY-DESIGN: No hardcoded image for ${body.productPath}, creating template`)
      garmentBase64 = createGarmentTemplate(body.productPath)
    }

    console.log("[v0] APPLY-DESIGN: Using garment template")

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
