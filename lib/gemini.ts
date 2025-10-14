import { GoogleGenerativeAI } from "@google/generative-ai"

// Create a function to get the Gemini client only when needed
export function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY

  if (!apiKey) {
    throw new Error("Gemini API key is not configured")
  }

  return new GoogleGenerativeAI(apiKey)
}

export async function generateImage(prompt: string, width = 1024, height = 1024) {
  try {
    console.log("🔄 GEMINI: Starting image generation")
    console.log("📏 DIMENSIONS:", `${width}x${height}`)

    const genAI = getGeminiClient()
    const model = genAI.getGenerativeModel({
      model: process.env.GEMINI_IMAGE_MODEL || "gemini-2.5-flash-image-preview",
    })

    console.log("🔍 GEMINI PROMPT LENGTH:", prompt.length)

    const result = await model.generateContent([prompt])
    const response = await result.response
    const imageUrl = response.text()

    if (!imageUrl) {
      throw new Error("No image URL returned from Gemini")
    }

    console.log("✅ GEMINI: Image generated successfully")
    return imageUrl
  } catch (error) {
    console.error("❌ GEMINI ERROR:", error)

    // Provide more specific error messages based on the error type
    if (error instanceof Error) {
      if (error.message.includes("API key")) {
        throw new Error("Gemini API key is invalid or missing")
      }

      if (error.message.includes("rate limit")) {
        throw new Error("Gemini API rate limit exceeded. Please try again later.")
      }

      throw error
    }

    throw new Error("Unknown error occurred during image generation")
  }
}

export async function optimizePrompt(prompt: string): Promise<string> {
  try {
    console.log("🔄 GEMINI: Optimizing prompt")

    const genAI = getGeminiClient()
    const model = genAI.getGenerativeModel({
      model: process.env.GEMINI_TEXT_MODEL || "gemini-1.5-pro",
    })

    const optimizationPrompt = `Optimize this image generation prompt to be more detailed and specific for better results. Keep it under 400 characters and maintain the original intent: "${prompt}"`

    const result = await model.generateContent([optimizationPrompt])
    const response = await result.response
    const optimizedPrompt = response.text()

    console.log("✅ GEMINI: Prompt optimized successfully")
    return optimizedPrompt || prompt
  } catch (error) {
    console.error("❌ GEMINI PROMPT OPTIMIZATION ERROR:", error)
    return prompt // Fallback to original prompt
  }
}

export const gemini = new Proxy({} as GoogleGenerativeAI, {
  get(target, prop) {
    const client = getGeminiClient()
    return client[prop as keyof GoogleGenerativeAI]
  },
})
