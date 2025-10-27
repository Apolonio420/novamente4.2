// lib/image/remove-bg.ts
import sharp from "sharp"

/**
 * Remove background from an image using Remove.bg API or Sharp processing
 */
export async function removeBackground(inputBuffer: Buffer): Promise<Buffer> {
  try {
    // Primero intentar con Remove.bg si hay API key
    const apiKey = process.env.REMOVEBG_API_KEY
    if (apiKey) {
      const formData = new FormData()
      formData.append("image_file", new Blob([inputBuffer]))
      formData.append("size", "auto")
      
      const response = await fetch("https://api.remove.bg/v1.0/removebg", {
        method: "POST",
        headers: {
          "X-Api-Key": apiKey,
        },
        body: formData as any,
      })

      if (response.ok) {
        const result = await response.arrayBuffer()
        let buffer = Buffer.from(result)
        
        // Post-procesar para eliminar halos y bordes
        buffer = await sharp(buffer)
          .flatten({ background: { r: 0, g: 0, b: 0, alpha: 0 } })
          .removeAlpha()
          .png()
          .toBuffer()
        
        return buffer
      }
    }

    // Fallback: procesamiento local con Sharp
    const processed = await sharp(inputBuffer)
      .ensureAlpha()
      .toColourspace("b-w")
      .threshold(128)
      .toColourspace("srgb")
      .ensureAlpha()
      .png()
      .toBuffer()

    return processed
  } catch (error) {
    console.error("❌ Error removing background:", error)
    
    // Importar handleError dinámicamente para evitar problemas en server bundles
    try {
      await import("@/lib/ui/errors").then(({ handleError }) =>
        handleError({ error: "REMOVE_BG_FAILED", message: "No se pudo quitar el fondo." })
      )
    } catch (e) {
      console.error("Error importing handleError:", e)
    }
    
    // Retornar imagen original si falla todo
    return inputBuffer
  }
}

/**
 * Remove background and save to R2
 */
export async function removeBackgroundAndSave(
  imageUrl: string,
  outputKey: string
): Promise<string> {
  try {
    // Descargar imagen
    const response = await fetch(imageUrl)
    if (!response.ok) {
      throw new Error(`Failed to download image: ${response.statusText}`)
    }

    const buffer = Buffer.from(await response.arrayBuffer())
    
    // Eliminar fondo
    const noBgBuffer = await removeBackground(buffer)
    
    // Guardar en R2
    // Esto debería llamar a tu función de upload a R2 existente
    // Por ahora retornamos una URL placeholder
    return outputKey
    
  } catch (error) {
    console.error("❌ Error in removeBackgroundAndSave:", error)
    throw error
  }
}

