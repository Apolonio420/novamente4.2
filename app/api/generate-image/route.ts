import { type NextRequest, NextResponse } from "next/server"
import { openai } from "@/lib/openai"
import { saveGeneratedImage } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"
import { optimizePrompt } from "@/lib/promptOptimizer"

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json()

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 })
    }

    console.log("🎨 Generating image with prompt:", prompt)

    // Optimizar el prompt
    const optimizedPrompt = await optimizePrompt(prompt)
    console.log("📤 Using optimized prompt:", optimizedPrompt)

    // Generar imagen con DALL-E
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: optimizedPrompt,
      n: 1,
      size: "1024x1024",
      quality: "standard",
      response_format: "url",
    })

    const imageUrl = response.data[0]?.url

    if (!imageUrl) {
      console.error("❌ No image URL received from OpenAI")
      return NextResponse.json({ error: "Failed to generate image" }, { status: 500 })
    }

    console.log("✅ Image generated successfully:", imageUrl.substring(0, 100) + "...")

    // Obtener usuario actual
    const user = await getCurrentUser()
    const userId = user?.id || null

    // Guardar imagen en la base de datos - PASAR PARÁMETROS INDIVIDUALES
    const savedImage = await saveGeneratedImage(imageUrl, prompt, userId)

    if (savedImage) {
      console.log("✅ Image saved to database")
    } else {
      console.log("⚠️ Failed to save image to database, but generation was successful")
    }

    return NextResponse.json({
      url: imageUrl,
      prompt: prompt,
      optimizedPrompt: optimizedPrompt,
      userId: userId,
    })
  } catch (error) {
    console.error("❌ Error generating image:", error)
    return NextResponse.json({ error: "Failed to generate image" }, { status: 500 })
  }
}
