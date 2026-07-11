import { type NextRequest, NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"
import { corsHeaders, preflightResponse } from "@/lib/security/cors"
import { guardPublicImageGen } from "@/lib/security/public-image-guard"
import { meterPublicImageGen } from "@/lib/security/meter-usage"

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

export async function OPTIONS(request: NextRequest) {
  return preflightResponse(request)
}

export async function POST(request: NextRequest) {
  const ch = corsHeaders(request)

  // Rate-limit por IP + tope diario global (DB-backed). Reemplaza el
  // rate-limiter viejo en memoria (inutil en serverless — auditoria
  // 2026-07-11) y agrega CORS con allowlist (antes no tenia ninguno).
  const guard = await guardPublicImageGen(request, "remove-background")
  if (!guard.allowed) {
    return NextResponse.json({ error: guard.message }, { status: guard.status, headers: ch })
  }

  try {
    const body = await request.json()
    const { imageBase64 } = body

    if (!imageBase64) {
      return NextResponse.json({ error: "imageBase64 es requerido" }, { status: 400, headers: ch })
    }


    // Extract base64 data from data URL
    const base64Data = imageBase64.replace(/^data:image\/[a-z]+;base64,/, "")

    const modelName = process.env.GEMINI_IMAGE_MODEL || "gemini-1.5-flash"
    const model = genAI.getGenerativeModel({ model: modelName })

    const prompt = `Remove the background from this image completely, leaving only the main subject with transparent background. Make sure the edges are clean and smooth. Return the image with transparent background.`

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64Data,
          mimeType: "image/png",
        },
      },
    ])

    const response = await result.response
    const text = response.text()

    // For now, we'll use a simple approach - in a real implementation,
    // you might want to use a specialized background removal service
    // Since Gemini doesn't directly support background removal,
    // we'll return the original image for now and suggest using a dedicated service


    // Return the original image for now - in production you'd use a proper background removal service
    await meterPublicImageGen({ endpoint: "remove-background", model: modelName })

    return NextResponse.json({
      success: true,
      image: {
        data: base64Data,
        contentType: "image/png",
      },
    }, { headers: ch })
  } catch (error) {
    console.error("Error removing background:", error)
    return NextResponse.json({ error: "Error al remover el fondo de la imagen" }, { status: 500, headers: ch })
  }
}
