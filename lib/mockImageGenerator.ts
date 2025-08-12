/**
 * Mock image generator for development and testing
 * Provides fallback functionality when OpenAI API is not available
 */

export async function generateMockImage(prompt: string): Promise<string> {
  console.log("🎭 MOCK: Generating mock image for prompt:", prompt)

  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 2000))

  // Return a placeholder image URL
  const mockImageUrl = `/placeholder.svg?height=1024&width=1024&text=${encodeURIComponent(prompt.slice(0, 50))}`

  console.log("🎭 MOCK: Generated mock image URL:", mockImageUrl)
  return mockImageUrl
}

// Alias for backward compatibility
export const generateImage = generateMockImage
