import OpenAI from "openai"

// Create a function to get the OpenAI client only when needed
export function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY

  if (!apiKey) {
    throw new Error("OpenAI API key is not configured")
  }

  // Create the OpenAI client with the proper configuration
  return new OpenAI({
    apiKey,
    // We don't need dangerouslyAllowBrowser because we'll ensure this only runs on the server
  })
}

export async function generateImage(prompt: string, width = 1024, height = 1024) {
  try {
    console.log("🔄 OPENAI: Starting image generation")
    console.log("📏 DIMENSIONS:", `${width}x${height}`)

    const openai = getOpenAIClient()

    // Determine the size string based on dimensions
    let size: "1024x1024" | "1792x1024" | "1024x1792" = "1024x1024"

    if (width === 1792 && height === 1024) {
      size = "1792x1024"
    } else if (width === 1024 && height === 1792) {
      size = "1024x1792"
    }

    console.log("📊 OPENAI SIZE PARAMETER:", size)
    console.log("🔍 OPENAI PROMPT LENGTH:", prompt.length)

    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt,
      n: 1,
      size,
      quality: "hd",
    })

    const imageUrl = response.data[0]?.url

    if (!imageUrl) {
      throw new Error("No image URL returned from OpenAI")
    }

    console.log("✅ OPENAI: Image generated successfully")
    return imageUrl
  } catch (error) {
    console.error("❌ OPENAI ERROR:", error)

    // Provide more specific error messages based on the error type
    if (error instanceof Error) {
      if (error.message.includes("API key")) {
        throw new Error("OpenAI API key is invalid or missing")
      }

      if (error.message.includes("rate limit")) {
        throw new Error("OpenAI API rate limit exceeded. Please try again later.")
      }

      throw error
    }

    throw new Error("Unknown error occurred during image generation")
  }
}

// Export the openai instance for direct use
export const openai = getOpenAIClient()
