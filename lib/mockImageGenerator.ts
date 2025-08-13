/**
 * Mock image generator for development and fallback
 */

export async function generateMockImage(prompt: string): Promise<string> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 2000))

  // Generate a placeholder image URL with the prompt
  const encodedPrompt = encodeURIComponent(prompt.slice(0, 50))
  const mockImageUrl = `https://via.placeholder.com/1024x1024/4F46E5/FFFFFF?text=${encodedPrompt}`

  console.log("🎭 Generated mock image:", mockImageUrl)
  return mockImageUrl
}

export function createMockImageBlob(prompt: string): string {
  // Create a simple SVG as a mock image
  const svg = `
    <svg width="1024" height="1024" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#f3f4f6"/>
      <text x="50%" y="50%" text-anchor="middle" dy=".3em" font-family="Arial, sans-serif" font-size="24" fill="#374151">
        Mock Image: ${prompt.slice(0, 30)}...
      </text>
    </svg>
  `

  const blob = new Blob([svg], { type: "image/svg+xml" })
  return URL.createObjectURL(blob)
}

export default {
  generateMockImage,
  createMockImageBlob,
}
