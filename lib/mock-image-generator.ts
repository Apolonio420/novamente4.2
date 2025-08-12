const mockImages = [
  "https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=512&h=512&fit=crop",
  "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=512&h=512&fit=crop",
  "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=512&h=512&fit=crop",
  "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=512&h=512&fit=crop",
  "https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=512&h=512&fit=crop",
]

export function generateMockImage(prompt: string, style?: string): string {
  // Use prompt and style to deterministically select an image
  const hash = prompt.split("").reduce((a, b) => {
    a = (a << 5) - a + b.charCodeAt(0)
    return a & a
  }, 0)

  const index = Math.abs(hash) % mockImages.length
  return mockImages[index]
}

export function getMockImageData(prompt: string, style?: string) {
  return {
    imageUrl: generateMockImage(prompt, style),
    prompt: prompt,
    style: style || "mock",
    isMock: true,
    message: "Esta es una imagen de demostración. Conecta tu API key de OpenAI para generar imágenes reales.",
  }
}
