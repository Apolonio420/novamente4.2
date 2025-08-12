import { type NextRequest, NextResponse } from "next/server"
import { generateMockImage } from "@/lib/mockImageGenerator"
import { optimizePrompt } from "@/lib/promptOptimizer"
import { saveImage } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    console.log("🎨 Starting image generation...")

    const { prompt, resolution = "1024x1024", style } = await request.json()

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 })
    }

    // Get current user
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    console.log("📝 Original prompt:", prompt)

    // Optimize the prompt
    const optimizedPrompt = await optimizePrompt(prompt, { style })
    console.log("✨ Optimized prompt:", optimizedPrompt)

    // Generate image using OpenAI or mock
    let imageUrl: string

    if (process.env.OPENAI_API_KEY) {
      try {
        console.log("🤖 Generating image with DALL-E 3...")
        console.log("📝 Prompt:", optimizedPrompt)

        const response = await fetch("https://api.openai.com/v1/images/generations", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "dall-e-3",
            prompt: optimizedPrompt,
            n: 1,
            size: resolution as "1024x1024" | "1024x1792" | "1792x1024",
            quality: "standard",
            response_format: "url",
          }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          console.error("❌ OpenAI API error:", errorData)
          throw new Error(`OpenAI API error: ${response.status}`)
        }

        const data = await response.json()
        imageUrl = data.data[0].url
        console.log("✅ Image generated successfully:", imageUrl)
      } catch (error) {
        console.error("❌ OpenAI generation failed, using mock:", error)
        imageUrl = await generateMockImage(optimizedPrompt)
      }
    } else {
      console.log("🎭 Using mock image generator (no OpenAI API key)")
      imageUrl = await generateMockImage(optimizedPrompt)
    }

    // Save to database
    const savedImage = await saveImage({
      prompt: optimizedPrompt,
      imageUrl,
      userId: user.id,
      resolution,
      style: style || null,
    })

    console.log("💾 Image saved to database:", savedImage.id)

    return NextResponse.json({
      success: true,
      imageUrl,
      imageId: savedImage.id,
      optimizedPrompt,
    })
  } catch (error) {
    console.error("❌ Error generating image:", error)
    return NextResponse.json({ error: "Failed to generate image" }, { status: 500 })
  }
}
