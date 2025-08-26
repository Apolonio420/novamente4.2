import { type NextRequest, NextResponse } from "next/server"
import OpenAI from "openai"
import { saveGeneratedImage } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"
import { getOrCreateAnonIdServer } from "@/lib/anon"
import { optimizePrompt } from "@/lib/promptOptimizer"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const { prompt, size = "1024x1024" } = await request.json()

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 })
    }

    console.log("🎨 Generating image with prompt:", prompt)

    // Validar que el prompt no contenga contenido inapropiado
    if (
      prompt.toLowerCase().includes("javier milei") ||
      prompt.toLowerCase().includes("milei") ||
      prompt.toLowerCase().includes("político") ||
      prompt.toLowerCase().includes("presidente")
    ) {
      console.log("❌ Blocked political content")
      return NextResponse.json(
        { error: "No se pueden generar imágenes de figuras políticas o personas reales" },
        { status: 400 },
      )
    }

    // Optimizar el prompt
    console.log("🔄 Auto-optimizing prompt with OpenAI...")
    const optimizedPrompt = await optimizePrompt(prompt)
    console.log("📤 Using optimized prompt:", optimizedPrompt)

    // Generar imagen con DALL-E
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: optimizedPrompt,
      n: 1,
      size: size as "1024x1024" | "1792x1024" | "1024x1792", // Support different image sizes
      quality: "standard",
      response_format: "url",
    })

    const imageUrl = response.data[0]?.url

    if (!imageUrl) {
      console.error("❌ No image URL returned from OpenAI")
      return NextResponse.json({ error: "No image generated" }, { status: 500 })
    }

    // Validar que la URL sea de DALL-E (Azure Blob Storage)
    if (!imageUrl.includes("oaidalleapiprodscus.blob.core.windows.net")) {
      console.error("❌ Invalid image URL - not from DALL-E:", imageUrl)
      return NextResponse.json({ error: "Invalid image source" }, { status: 500 })
    }

    console.log("✅ Image generated successfully:", imageUrl)

    // Obtener usuario actual - Handle auth errors gracefully
    let userId: string | null = null
    try {
      const user = await getCurrentUser()
      userId = user?.id || null
    } catch (authError) {
      console.error("Error getting current user:", authError)
      // Use anon ID for server-side anonymous users
      userId = getOrCreateAnonIdServer()
    }

    // Guardar imagen en la base de datos - PASAR PARÁMETROS INDIVIDUALES CORRECTAMENTE
    console.log("💾 Attempting to save image to database...")
    const savedImage = await saveGeneratedImage(imageUrl, prompt, userId)

    if (savedImage) {
      console.log("✅ Image saved to database successfully")
      return NextResponse.json({
        imageUrl:
          savedImage.urlWithoutBg && savedImage.hasBgRemoved
            ? savedImage.urlWithoutBg
            : savedImage.storage_url || imageUrl,
        prompt,
        revisedPrompt: response.data[0]?.revised_prompt,
      })
    } else {
      console.log("⚠️ Failed to save image to database, but generation was successful")
      return NextResponse.json({
        imageUrl,
        prompt,
        revisedPrompt: response.data[0]?.revised_prompt,
      })
    }
  } catch (error: any) {
    console.error("❌ Error generating image:", error)

    // Manejar errores específicos de OpenAI
    if (error?.error?.code === "content_policy_violation") {
      return NextResponse.json(
        { error: "El contenido solicitado viola las políticas de contenido. Intenta con una descripción diferente." },
        { status: 400 },
      )
    }

    if (error?.error?.code === "rate_limit_exceeded") {
      return NextResponse.json(
        { error: "Límite de generación alcanzado. Intenta nuevamente en unos minutos." },
        { status: 429 },
      )
    }

    return NextResponse.json({ error: "Error interno del servidor al generar la imagen" }, { status: 500 })
  }
}
