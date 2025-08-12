export async function generateImage(prompt: string, size = "1024x1024") {
  // Construye un placeholder dinámico basado en el prompt (máx 20 caracteres)
  // https://dummyimage.com/{size}/bg/fg&text=...
  const [width, height] = size.split("x")
  const clean = encodeURIComponent(prompt.slice(0, 20))
  return `https://dummyimage.com/${width}x${height}/cccccc/000000&text=${clean}`
}
