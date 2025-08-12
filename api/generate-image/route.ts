import { NextResponse } from "next/server"
import { generateImage } from "@/lib/openai"
import { generateMockImage } from "@/lib/mockImageGenerator"
import { saveGeneratedImage } from "@/lib/db"
import { optimizePrompt } from "@/lib/promptOptimizer"

// Explicitly set the runtime to Node.js
export const runtime = "nodejs"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { prompt, layout = "square" } = body

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 })
    }

    // Optimize the prompt for print-ready designs
    const optimizedPrompt = optimizePrompt(prompt, { layout })

    // Determine image size based on layout
    const sizeMap = {
      square: { width: 1024, height: 1024 },
      tall: { width: 1024, height: 1792 },
      wide: { width: 1792, height: 1024 },
    }
    const size = sizeMap[layout as keyof typeof sizeMap]

    let imageUrl: string

    // In development or preview environments, use mock images
    if (process.env.NODE_ENV !== "production" || !process.env.OPENAI_API_KEY) {
      console.log("Using mock image generator for development/preview")
      imageUrl = await generateMockImage(optimizedPrompt)
    } else {
      // In production with API key, use OpenAI
      try {
        imageUrl = await generateImage(optimizedPrompt, size.width, size.height)
      } catch (error) {
        console.error("OpenAI API error:", error)
        const errorMessage = error instanceof Error ? error.message : "Failed to generate image"
        return NextResponse.json({ error: errorMessage }, { status: 500 })
      }
    }

    // Save the generated image to the database
    await saveGeneratedImage({
      url: imageUrl,
      prompt: prompt,
      optimizedPrompt: optimizedPrompt,
    })

    return NextResponse.json({
      imageUrl,
      optimizedPrompt,
    })
  } catch (error) {
    console.error("Error in generate-image API route:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
