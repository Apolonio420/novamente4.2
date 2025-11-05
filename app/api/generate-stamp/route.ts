import { NextRequest, NextResponse } from "next/server"
import { GoogleGenAI } from "@google/genai"
import { uploadToR2, generateImageName } from "@/lib/cloudflare-r2"
import { v4 as uuidv4 } from "uuid"
import { z } from "zod"

export const runtime = "nodejs"

// Schema de validación con Zod
const generateStampSchema = z.object({
  designImageUrl: z.string().min(1, "designImageUrl es requerido"),
  garmentType: z.enum(['hoodie', 'tshirt'], { errorMap: () => ({ message: "garmentType debe ser 'hoodie' o 'tshirt'" }) }),
  garmentVariant: z.enum(['classic', 'oversize']).optional(),
  garmentColor: z.string().min(1, "garmentColor es requerido"),
  side: z.enum(['front', 'back'], { errorMap: () => ({ message: "side debe ser 'front' o 'back'" }) }),
  stampSize: z.enum(['R1', 'R2', 'R3'], { errorMap: () => ({ message: "stampSize debe ser 'R1', 'R2' o 'R3'" }) }),
  stampPosition: z.enum(['center', 'left']).optional(),
  prompt: z.string().optional(),
  originalImageId: z.string().optional(),
})

export async function POST(request: NextRequest) {
  const debugId = uuidv4()
  try {
    console.log(`[${debugId}] 🎨 STAMP-GEN: Starting stamp generation...`)
    
    let body: any
    try {
      body = await request.json()
    } catch (parseErr: any) {
      console.error(`[${debugId}] STAMP-GEN: Error parsing JSON:`, parseErr.message)
      return NextResponse.json({ 
        error: "Body inválido (JSON malformado)",
        debugId 
      }, { 
        status: 400,
        headers: { 'X-Debug-Id': debugId }
      })
    }

    // Validar con Zod
    const validationResult = generateStampSchema.safeParse(body)
    if (!validationResult.success) {
      const errors = validationResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
      console.error(`[${debugId}] STAMP-GEN: Validation failed:`, errors)
      console.error(`[${debugId}] STAMP-GEN: Received params:`, {
        designImageUrl: body.designImageUrl?.substring(0, 100),
        garmentType: body.garmentType,
        garmentVariant: body.garmentVariant,
        garmentColor: body.garmentColor,
        side: body.side,
        stampSize: body.stampSize,
        stampPosition: body.stampPosition,
        originalImageId: body.originalImageId
      })
      return NextResponse.json({ 
        error: `Parámetros inválidos: ${errors}`,
        debugId 
      }, { 
        status: 400,
        headers: { 'X-Debug-Id': debugId }
      })
    }

    const { 
      designImageUrl,
      garmentType, 
      garmentVariant,
      garmentColor, 
      side, 
      stampSize, 
      stampPosition,
      prompt,
      originalImageId,
    } = validationResult.data

    console.log(`[${debugId}] STAMP-GEN: Received params →`, {
      designImageUrl: designImageUrl.substring(0, 100) + '...',
      garmentType,
      garmentVariant,
      garmentColor,
      side,
      stampSize,
      stampPosition,
      originalImageId
    })

    // Resolver id base para agrupar derivados bajo la misma carpeta en R2
    const resolveBaseImageId = (): string => {
      if (originalImageId && typeof originalImageId === 'string') return originalImageId
      try {
        const url = String(designImageUrl)
        const matchProcessed = url.match(/\/processed\/([^\/]+)/)
        if (matchProcessed?.[1]) return matchProcessed[1]
        const matchImages = url.match(/\/images\/([^\/]+)/)
        if (matchImages?.[1]) return matchImages[1]
      } catch {}
      return uuidv4()
    }
    const baseImageId = resolveBaseImageId()

    // Inicializar Gemini
    const genAI = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY!,
    })

    // Helper para descargar imagen con reintentos y fallback a proxy
    const fetchImageWithRetry = async (url: string, maxRetries = 2, originalDesignUrl?: string): Promise<Buffer> => {
      let lastError: Error | null = null
      let currentUrl = url
      
      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          console.log(`[${debugId}] STAMP-GEN: Fetching designImageUrl (attempt ${attempt + 1}/${maxRetries + 1}) →`, currentUrl.substring(0, 100) + "...")
          
          const response = await fetch(currentUrl, {
            signal: AbortSignal.timeout(30000), // 30 segundos timeout
          })
          
          if (!response.ok) {
            // Si es 404 y no estamos usando el proxy, intentar usar el proxy como fallback
            if (response.status === 404 && attempt < maxRetries && !currentUrl.includes('/api/r2-public') && originalDesignUrl) {
              console.warn(`[${debugId}] STAMP-GEN: 404 error, trying proxy fallback...`)
              try {
                // Si la URL original era del proxy, usarla directamente
                if (originalDesignUrl.startsWith('/api/r2-public')) {
                  currentUrl = new URL(originalDesignUrl, request.url).toString()
                  console.log(`[${debugId}] STAMP-GEN: Using original proxy URL as fallback`)
                  continue
                }
                // Si no, intentar extraer la clave y usar el proxy
                const { normalizeR2Key } = await import("@/lib/r2")
                const key = normalizeR2Key(originalDesignUrl)
                if (key) {
                  const encodedKey = encodeURIComponent(key)
                  currentUrl = new URL(`/api/r2-public?key=${encodedKey}`, request.url).toString()
                  console.log(`[${debugId}] STAMP-GEN: Using proxy with extracted key as fallback`)
                  continue
                }
              } catch (proxyErr: any) {
                console.warn(`[${debugId}] STAMP-GEN: Could not create proxy URL:`, proxyErr.message)
              }
            }
            
            // Si es 403/404 y es URL firmada, intentar regenerar
            if ((response.status === 403 || response.status === 404) && attempt < maxRetries && currentUrl.includes('X-Amz-')) {
              console.warn(`[${debugId}] STAMP-GEN: URL expired (${response.status}), regenerating signed URL...`)
              const { normalizeR2Key } = await import("@/lib/r2")
              const { getSignedR2Url } = await import("@/lib/cloudflare-r2")
              const key = normalizeR2Key(currentUrl)
              if (key) {
                currentUrl = await getSignedR2Url(key, 3600)
                console.log(`[${debugId}] STAMP-GEN: Regenerated signed URL, retrying...`)
                continue
              }
            }
            
            throw new Error(`HTTP ${response.status}: ${response.statusText}`)
          }
          
          const buffer = await response.arrayBuffer()
          const size = buffer.byteLength
          console.log(`[${debugId}] STAMP-GEN: Image fetched OK →`, { size, url: currentUrl.substring(0, 100) })
          return Buffer.from(buffer)
          
        } catch (err: any) {
          lastError = err
          console.error(`[${debugId}] STAMP-GEN: Fetch attempt ${attempt + 1} failed:`, err.message)
          
          if (attempt < maxRetries && (err.message.includes('expired') || err.message.includes('403') || err.message.includes('404'))) {
            // Último intento: usar el proxy si no lo estamos usando ya
            if (!currentUrl.includes('/api/r2-public') && originalDesignUrl) {
              try {
                if (originalDesignUrl.startsWith('/api/r2-public')) {
                  currentUrl = new URL(originalDesignUrl, request.url).toString()
                  console.log(`[${debugId}] STAMP-GEN: Last attempt with original proxy URL`)
                  continue
                }
                const { normalizeR2Key } = await import("@/lib/r2")
                const key = normalizeR2Key(originalDesignUrl)
                if (key) {
                  const encodedKey = encodeURIComponent(key)
                  currentUrl = new URL(`/api/r2-public?key=${encodedKey}`, request.url).toString()
                  console.log(`[${debugId}] STAMP-GEN: Last attempt with proxy`)
                  continue
                }
              } catch (proxyErr: any) {
                console.error(`[${debugId}] STAMP-GEN: Could not use proxy fallback:`, proxyErr.message)
              }
            }
          }
        }
      }
      
      throw new Error(`Error descargando imagen después de ${maxRetries + 1} intentos: ${lastError?.message}`)
    }

    // 1) Descargar la imagen de diseño (sin fondo)
    console.log(`[${debugId}] STAMP-GEN: Fetching designImageUrl →`, designImageUrl.substring(0, 100) + "...")
    
    // Normalizar la URL del diseño para que sea accesible desde el servidor
    let absoluteDesignUrl = designImageUrl
    try {
      if (designImageUrl.startsWith('/api/r2-public')) {
        // Si viene del proxy, usar el proxy directamente (convertir a URL absoluta)
        // El proxy ya sabe cómo acceder a R2 correctamente
        absoluteDesignUrl = new URL(designImageUrl, request.url).toString()
        console.log(`[${debugId}] STAMP-GEN: Using proxy URL directly:`, absoluteDesignUrl.substring(0, 150))
      } else if (designImageUrl.startsWith('/api/')) {
        // Otros endpoints de proxy - convertir a URL absoluta
        absoluteDesignUrl = new URL(designImageUrl, request.url).toString()
        console.log(`[${debugId}] STAMP-GEN: Converted relative proxy URL to absolute`)
      } else if (designImageUrl.includes('r2.dev') || designImageUrl.includes('r2.cloudflarestorage.com')) {
        // Si es URL de R2 (pública o firmada), intentar extraer clave y regenerar URL firmada
        // Pero si falla, intentar usar el proxy en su lugar
        try {
          const { normalizeR2Key } = await import("@/lib/r2")
          const { getSignedR2Url } = await import("@/lib/cloudflare-r2")
          const key = normalizeR2Key(designImageUrl)
          if (key) {
            absoluteDesignUrl = await getSignedR2Url(key, 3600)
            console.log(`[${debugId}] STAMP-GEN: Using signed URL for R2 image`)
          } else {
            // Si no se pudo normalizar, usar la URL original
            console.warn(`[${debugId}] STAMP-GEN: Could not normalize key, using original URL`)
          }
        } catch (r2Err: any) {
          console.warn(`[${debugId}] STAMP-GEN: Could not get signed URL, using proxy fallback:`, r2Err.message)
          // Fallback: usar el proxy con la clave extraída si es posible
          try {
            const { normalizeR2Key } = await import("@/lib/r2")
            const key = normalizeR2Key(designImageUrl)
            if (key) {
              const encodedKey = encodeURIComponent(key)
              absoluteDesignUrl = new URL(`/api/r2-public?key=${encodedKey}`, request.url).toString()
              console.log(`[${debugId}] STAMP-GEN: Using proxy fallback with normalized key`)
            }
          } catch (fallbackErr: any) {
            console.warn(`[${debugId}] STAMP-GEN: Proxy fallback also failed:`, fallbackErr.message)
            // Último recurso: usar la URL original
          }
        }
      }
    } catch (urlErr: any) {
      console.error(`[${debugId}] STAMP-GEN: Error normalizing URL:`, {
        error: urlErr.message,
        stack: urlErr.stack,
        designImageUrl: designImageUrl.substring(0, 150)
      })
      // No lanzar error inmediatamente, intentar con la URL original
      console.warn(`[${debugId}] STAMP-GEN: Will try with original URL as fallback`)
    }
    
    // Descargar con reintentos (pasar la URL original para fallback)
    let designBuffer = await fetchImageWithRetry(absoluteDesignUrl, 2, designImageUrl)
    
    // Si la imagen es de estilos inspiradores (/styles/), aplicar remoción de fondo automáticamente
    const isStyleImage = designImageUrl.includes('/styles/') || absoluteDesignUrl.includes('/styles/')
    if (isStyleImage) {
      console.log(`[${debugId}] STAMP-GEN: Style image detected, applying background removal...`)
      try {
        // Convertir buffer a base64 para la API de remoción de fondo
        const styleImageBase64 = designBuffer.toString('base64')
        const styleImageDataUrl = `data:image/png;base64,${styleImageBase64}`
        
        // Llamar al endpoint de remoción de fondo (espera base64 con prefijo data:image)
        const removeBgUrl = new URL('/api/remove-bg', request.url).toString()
        const removeBgResponse = await fetch(removeBgUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            imageUrl: styleImageDataUrl,
          }),
        })
        
        if (removeBgResponse.ok) {
          const removeBgData = await removeBgResponse.json()
          if (removeBgData.success && removeBgData.processedImageUrl) {
            // Extraer el base64 de la imagen procesada
            const processedBase64 = removeBgData.processedImageUrl.split(',')[1]
            designBuffer = Buffer.from(processedBase64, 'base64')
            console.log(`[${debugId}] STAMP-GEN: Background removed successfully from style image`)
          } else {
            console.warn(`[${debugId}] STAMP-GEN: Background removal skipped or failed, using original image`)
          }
        } else {
          console.warn(`[${debugId}] STAMP-GEN: Background removal API error, using original image`)
        }
      } catch (bgRemovalError: any) {
        console.warn(`[${debugId}] STAMP-GEN: Error removing background from style image:`, bgRemovalError.message)
        // Continuar con la imagen original si falla la remoción de fondo
      }
    }
    
    const designBase64 = designBuffer.toString('base64')
    console.log(`[${debugId}] STAMP-GEN: Design image processed successfully →`, { sizeBytes: designBase64.length, isStyleImage })

    // 2) Obtener la imagen base de la prenda
    console.log(`[${debugId}] STAMP-GEN: Getting base garment image...`)
    const { getBaseGarmentImage } = await import("@/lib/garment-red-square-mapping")
    const baseGarmentPath = getBaseGarmentImage(
      garmentType as 'hoodie' | 'tshirt',
      garmentVariant as 'classic' | 'oversize' || 'classic',
      garmentColor as 'black' | 'gray' | 'caramel' | 'white' | 'model',
      side as 'front' | 'back'
    )

    if (!baseGarmentPath) {
      throw new Error(`No se encontró imagen base para: ${garmentType}-${garmentVariant}-${garmentColor}-${side}`)
    }

    console.log(`[${debugId}] STAMP-GEN: Downloading base garment image →`, baseGarmentPath)
    const baseGarmentBuffer = await fetchImageWithRetry(new URL(baseGarmentPath, request.url).toString())
    const baseGarmentBase64 = baseGarmentBuffer.toString('base64')
    console.log(`[${debugId}] STAMP-GEN: Base garment downloaded →`, { sizeBytes: baseGarmentBase64.length })

    // 3) Obtener la imagen de referencia con cuadrado rojo
    console.log(`[${debugId}] STAMP-GEN: Getting red square reference image...`)
    const { getRedSquareGarmentImage } = await import("@/lib/garment-red-square-mapping")
    const redSquarePath = getRedSquareGarmentImage(
      garmentType as 'hoodie' | 'tshirt',
      garmentVariant as 'classic' | 'oversize' || 'classic',
      garmentColor as 'black' | 'gray' | 'caramel' | 'white' | 'model',
      side as 'front' | 'back',
      stampSize as 'R1' | 'R2' | 'R3',
      stampPosition as 'center' | 'left' | undefined
    )

    if (!redSquarePath) {
      throw new Error(`No se encontró imagen de referencia con cuadrado rojo para: ${garmentType}-${garmentVariant}-${garmentColor}-${side}-${stampSize}-${stampPosition}`)
    }

    console.log(`[${debugId}] STAMP-GEN: Downloading red square reference →`, redSquarePath)
    const redSquareBuffer = await fetchImageWithRetry(new URL(redSquarePath, request.url).toString())
    const redSquareBase64 = redSquareBuffer.toString('base64')
    console.log(`[${debugId}] STAMP-GEN: Red square reference downloaded →`, { sizeBytes: redSquareBase64.length })

    // 4) Generar el estampado con Gemini
    console.log(`[${debugId}] STAMP-GEN: Calling Gemini for stamp generation...`)
    console.log(`[${debugId}] STAMP-GEN: Image sizes →`, {
      designBytes: designBase64.length,
      baseGarmentBytes: baseGarmentBase64.length,
      redSquareBytes: redSquareBase64.length
    })
    
    const stampPrompt = `You are a professional garment printing expert. I need you to create a high-quality stamp/print on a garment.

CRITICAL INSTRUCTIONS:
1. Use the design image (transparent background) as the stamp/print
2. Place it EXACTLY where the red square indicates on the reference image
3. The red square shows the exact position, size, and area where the stamp should be placed
4. The base garment image shows the CORRECT garment type - use this exact garment
5. The reference image with red square shows the EXACT size and position - follow it precisely
6. Maintain the design's quality and proportions
7. Make sure the stamp looks natural and professional on the garment
8. The final result should be a realistic garment with the design properly stamped

SIZE REFERENCE (follow the red square exactly):
- R1: SMALL LOGO - the red square will be very small (about 8-12% of the garment width)
- R2: MEDIUM LOGO - the red square will be medium (about 20-25% of the garment width)  
- R3: LARGE LOGO - the red square will be large (about 30-40% of the garment width)

CRITICAL: The red square in the reference image shows the EXACT size the stamp should be. 
- If the red square is SMALL (R1), make the logo SMALL - like a small chest logo
- If the red square is MEDIUM (R2), make the logo MEDIUM - like a medium chest design
- If the red square is LARGE (R3), make the logo LARGE - like a large front design
- The stamp should fill the red square area completely but not exceed it
- For R1 (small), think of it like a small brand logo on a t-shirt

IMPORTANT: Use the base garment image as the foundation and place the design exactly where the red square indicates. Do not change the garment type or size.

Generate a high-quality, realistic garment with the design properly stamped in the indicated area.`

    let result
    try {
      result = await genAI.models.generateContent({
        model: "gemini-2.5-flash-image-preview",
        contents: [
          {
            text: stampPrompt
          },
          {
            text: "IMAGE 1: Design to be stamped (transparent background)"
          },
          {
            inlineData: {
              data: designBase64,
              mimeType: "image/png",
            },
          },
          {
            text: "IMAGE 2: Base garment (the correct garment type to use)"
          },
          {
            inlineData: {
              data: baseGarmentBase64,
              mimeType: "image/jpeg",
            },
          },
          {
            text: "IMAGE 3: Reference image with red square showing EXACT position and size for the stamp"
          },
          {
            inlineData: {
              data: redSquareBase64,
              mimeType: "image/png",
            },
          },
        ],
      })
    } catch (geminiErr: any) {
      console.error(`[${debugId}] STAMP-GEN: Gemini API error:`, {
        message: geminiErr.message,
        code: geminiErr.code,
        status: geminiErr.status
      })
      throw new Error(`Error llamando a Gemini: ${geminiErr.message}`)
    }

    console.log(`[${debugId}] STAMP-GEN: Gemini response received`)

    // 5) Extraer la imagen generada
    let stampedImageBase64: string | null = null

    try {
      if (result.candidates && result.candidates[0] && result.candidates[0].content) {
        const content = result.candidates[0].content
        
        if (content.parts && content.parts.length > 0) {
          for (const part of content.parts) {
            if (part.inlineData && part.inlineData.data) {
              stampedImageBase64 = part.inlineData.data
              console.log(`[${debugId}] STAMP-GEN: Found image data in response`)
              break
            }
          }
        }
      }
    } catch (extractErr: any) {
      console.error(`[${debugId}] STAMP-GEN: Error extracting image from Gemini response:`, extractErr.message)
    }

    if (!stampedImageBase64) {
      console.error(`[${debugId}] STAMP-GEN: No image data found in Gemini response`)
      console.error(`[${debugId}] STAMP-GEN: Response structure:`, {
        hasCandidates: !!result.candidates,
        candidatesCount: result.candidates?.length || 0,
        firstCandidate: result.candidates?.[0] ? {
          hasContent: !!result.candidates[0].content,
          partsCount: result.candidates[0].content?.parts?.length || 0
        } : null
      })
      throw new Error("Gemini no devolvió una imagen válida")
    }
    
    console.log(`[${debugId}] STAMP-GEN: Image extracted from Gemini →`, { sizeBytes: stampedImageBase64.length })

    // 6) Subir imagen estampada a Cloudflare R2
    console.log(`[${debugId}] STAMP-GEN: Uploading mockup to R2...`)
    const stampId = uuidv4()
    const stampedBuffer = Buffer.from(stampedImageBase64, 'base64')
    
    const description = prompt ? prompt.split(' ').slice(0, 2).join(' ') : 'estampado'
    // Nombre con tokens descriptivos: tipo_variant_color_side_size_pos
    const token = [
      String(garmentType || '').toLowerCase(),
      String(garmentVariant || 'classic').toLowerCase(),
      String(garmentColor || '').toLowerCase(),
      String(side || '').toLowerCase(),
      String(stampSize || '').toUpperCase(),
      (stampPosition ? String(stampPosition).toLowerCase() : undefined),
    ]
      .filter(Boolean)
      .join('_')

    const fileName = generateImageName(description, token)
    // Guardar bajo la carpeta de la imagen base: images/<baseId>/stamps/<stampId>/<fileName>
    const r2Key = `images/${baseImageId}/stamps/${stampId}/${fileName}`
    
    let publicUrl: string
    try {
      publicUrl = await uploadToR2(stampedBuffer, r2Key, "image/png")
      console.log(`[${debugId}] STAMP-GEN: Uploaded to R2 →`, { r2Key, publicUrl: publicUrl.substring(0, 100) })
    } catch (uploadError: any) {
      console.error(`[${debugId}] STAMP-GEN: Error uploading to R2:`, {
        message: uploadError.message,
        stack: uploadError.stack
      })
      throw new Error(`Error subiendo imagen estampada: ${uploadError.message}`)
    }

    // 7) No guardar estampas derivadas en la base de datos (solo en R2)
    // Se devuelve la URL pública y metadatos para uso inmediato

    console.log(`[${debugId}] STAMP-GEN: Mockup generated OK →`, { mockupUrl: publicUrl.substring(0, 100) })

    return NextResponse.json({ 
      success: true, 
      publicUrl, 
      r2Key,
      stampId,
      baseImageId,
      debugId
    }, { 
      status: 200,
      headers: { 'X-Debug-Id': debugId }
    })

  } catch (error: any) {
    // Si el error ya tiene un debugId (de un paso anterior), usarlo; si no, crear uno nuevo
    const finalDebugId = error.debugId || uuidv4()
    console.error(`[${finalDebugId}] STAMP-GEN: Error generating stamp:`, {
      message: error.message,
      stack: error.stack,
      name: error.name,
      code: error.code,
      cause: error.cause
    })
    return NextResponse.json({ 
      error: error.message || "Error generando estampado",
      debugId: finalDebugId
    }, { 
      status: 500,
      headers: { 'X-Debug-Id': finalDebugId }
    })
  }
}
