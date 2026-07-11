import { NextRequest, NextResponse } from "next/server"
import { GoogleGenAI } from "@google/genai"
import { uploadFile } from "@/lib/cloudflare-r2"
import { v4 as uuidv4 } from "uuid"
import { z } from "zod"
import { corsHeaders, preflightResponse } from "@/lib/security/cors"
import { guardPublicImageGen } from "@/lib/security/public-image-guard"
import { meterPublicImageGen } from "@/lib/security/meter-usage"

export const runtime = "nodejs"

export async function OPTIONS(req: NextRequest) {
  return preflightResponse(req)
}

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
  const baseHeaders = { 'X-Debug-Id': debugId, ...corsHeaders(request) }
  try {
    console.log(`[${debugId}] 🎨 STAMP-GEN: Starting stamp generation...`)

    // Rate-limit por IP + tope diario global (DB-backed). Este endpoint NO
    // tenia NINGUN limite antes — generacion ilimitada a nuestro costo
    // (auditoria 2026-07-11).
    const guard = await guardPublicImageGen(request, "generate-stamp")
    if (guard.allowed === false) {
      return NextResponse.json({ error: guard.message, debugId }, { status: guard.status, headers: baseHeaders })
    }

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
        headers: baseHeaders
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
        headers: baseHeaders
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
      } catch { }
      return uuidv4()
    }
    const baseImageId = resolveBaseImageId()

    // Inicializar Gemini
    const genAI = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY!,
    })

    // Helper para obtener imagen (usa fetch para evitar que Vercel bundlee archivos locales)
    const getImageBuffer = async (urlOrPath: string): Promise<Buffer> => {
      // Si es una ruta local de la carpeta public
      if (urlOrPath.startsWith('/garments/')) {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || `https://${request.headers.get('host')}`
        const fullUrl = `${baseUrl.replace(/\/$/, '')}${urlOrPath}`
        console.log(`[${debugId}] STAMP-GEN: Fetching local asset via URL (to avoid bundling) →`, fullUrl)
        return fetchImageWithRetry(fullUrl)
      }

      // Si es un data:uri (ya manejado arriba, pero por si acaso)
      if (urlOrPath.startsWith('data:')) {
        const base64 = urlOrPath.split(',')[1]
        return Buffer.from(base64, 'base64')
      }

      // Si es una URL remota
      return fetchImageWithRetry(urlOrPath)
    }

    const fetchImageWithRetry = async (url: string, maxRetries = 2): Promise<Buffer> => {
      let lastError: Error | null = null
      let currentUrl = url

      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          console.log(`[${debugId}] STAMP-GEN: Fetching remote URL (attempt ${attempt + 1}/${maxRetries + 1}) →`, currentUrl.substring(0, 100) + "...")
          const response = await fetch(currentUrl, { signal: AbortSignal.timeout(30000) })
          if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`)
          const buffer = await response.arrayBuffer()
          return Buffer.from(buffer)
        } catch (err: any) {
          lastError = err
          console.error(`[${debugId}] STAMP-GEN: Fetch attempt ${attempt + 1} failed:`, err.message)
        }
      }
      throw new Error(`Error descargando imagen después de ${maxRetries + 1} intentos: ${lastError?.message}`)
    }

    // 1) Descargar la imagen de diseño (soporta base64 o URL remota)
    console.log(`[${debugId}] STAMP-GEN: Processing designImageUrl →`, designImageUrl.substring(0, 100) + "...")

    let designBuffer: Buffer

    // normalizar la base si existe
    let absoluteDesignUrl: string | undefined

    if (designImageUrl.startsWith('data:')) {
      console.log(`[${debugId}] STAMP-GEN: Design is base64, converting directly...`)
      const base64Content = designImageUrl.split(',')[1]
      designBuffer = Buffer.from(base64Content, 'base64')
    } else {
      // Normalizar la URL del diseño para que sea accesible desde el servidor
      absoluteDesignUrl = designImageUrl
      try {
        if (designImageUrl.startsWith('/api/r2-public')) {
          absoluteDesignUrl = new URL(designImageUrl, request.url).toString()
        } else if (designImageUrl.startsWith('/api/')) {
          absoluteDesignUrl = new URL(designImageUrl, request.url).toString()
        } else if (designImageUrl.includes('r2.dev') || designImageUrl.includes('r2.cloudflarestorage.com')) {
          try {
            const { normalizeR2Key } = await import("@/lib/r2")
            const { getSignedR2Url } = await import("@/lib/cloudflare-r2")
            const key = normalizeR2Key(designImageUrl)
            if (key) {
              absoluteDesignUrl = await getSignedR2Url(key, 3600)
            }
          } catch (r2Err: any) {
            console.warn(`[${debugId}] STAMP-GEN: R2 sign error, using original URL`)
          }
        }
      } catch (urlErr) {
        console.warn(`[${debugId}] STAMP-GEN: URL normalizer failed, using raw URL`)
      }

      // Obtener buffer (soporta fs local si absoluteDesignUrl es para public)
      designBuffer = await getImageBuffer(absoluteDesignUrl)
    }

    // Si la imagen es de estilos inspiradores (/styles/), aplicar remoción de fondo automáticamente
    const isStyleImage = (designImageUrl.includes('/styles/') || (absoluteDesignUrl && absoluteDesignUrl.includes('/styles/')))
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

    console.log(`[${debugId}] STAMP-GEN: Getting base garment image buffer →`, baseGarmentPath)
    const baseGarmentBuffer = await getImageBuffer(baseGarmentPath)
    const baseGarmentBase64 = baseGarmentBuffer.toString('base64')
    console.log(`[${debugId}] STAMP-GEN: Base garment ready →`, { sizeBytes: baseGarmentBase64.length })

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

    console.log(`[${debugId}] STAMP-GEN: Getting red square reference buffer →`, redSquarePath)
    const redSquareBuffer = await getImageBuffer(redSquarePath)
    const redSquareBase64 = redSquareBuffer.toString('base64')
    console.log(`[${debugId}] STAMP-GEN: Red square reference ready →`, { sizeBytes: redSquareBase64.length })

    // 4) Generar el estampado con Gemini
    console.log(`[${debugId}] STAMP-GEN: Calling Gemini for stamp generation...`)
    console.log(`[${debugId}] STAMP-GEN: Image sizes →`, {
      designBytes: designBase64.length,
      baseGarmentBytes: baseGarmentBase64.length,
      redSquareBytes: redSquareBase64.length
    })

    const stampPrompt = `You are a professional industrial garment printer. 
Your task is to apply a design to a garment following STRICT PHYSICAL LIMITS.

🎯 OBJECTIVE:
Produce ONE realistic product photo of the garment with the design applied.

🚨 THE "RED SQUARE" IS A RIGID PRINTING BOUNDARY:
1. Look at IMAGE 3. The RED SQUARE is the ONLY place where ink is allowed.
2. PLACE the design (IMAGE 1) inside that exact square area on the garment (IMAGE 2).
3. If the design is bigger than the red square, you MUST SCALE IT DOWN or CROP IT. 
4. 🚨 ABSOLUTELY FORBIDDEN: Not a single pixel of the design can be outside the red square boundaries.
5. 🚨 SLEEVES AND HOOD ARE OFF-LIMITS: Never, under any circumstances, allow the design to touch the sleeves, hood, neck, or bottom edges of the garment.
6. If the red square is small, the design must be small.

✅ FINAL RESULT:
- One clean, professional image.
- NO red square visible in the final result (remove it).
- NO text, NO labels, NO side-by-side versions.
- The design should look like it's part of the fabric, but strictly confined to the area indicated by the red square.

STRICT BOUNDARY ENFORCEMENT. DO NOT CROSS THE RED LINES.`

    // A/B ciego 20 casos reales (2026-07-11): gemini-2.5-flash-image 13 vs
    // gemini-3-pro-image 4 (3 empates) para COLOCACIÓN DE ESTAMPA → default flash.
    // Rollback en minutos vía env (ver docs/ROLLBACK-gemini-models.md en platform-master).
    const stampModel = process.env.GEMINI_STAMP_MODEL ?? process.env.GEMINI_IMAGE_MODEL ?? "gemini-2.5-flash-image"

    let result
    try {
      result = await genAI.models.generateContent({
        model: stampModel,
        contents: [
          { text: stampPrompt },
          { inlineData: { data: designBase64, mimeType: "image/png" } },
          { inlineData: { data: baseGarmentBase64, mimeType: "image/jpeg" } },
          { inlineData: { data: redSquareBase64, mimeType: "image/png" } },
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

    // 6) Subir imagen estampada a almacenamiento resiliente
    console.log(`[${debugId}] STAMP-GEN: Uploading mockup...`)
    const stampId = uuidv4()
    const stampedBuffer = Buffer.from(stampedImageBase64, 'base64')
    // v1/stamps/${baseImageId}/${stampId}.png
    const storageKey = `v1/stamps/${baseImageId}/${stampId}.png`

    let publicUrl: string
    try {
      const uploadResult = await uploadFile(stampedBuffer, storageKey, "image/png")
      publicUrl = uploadResult.url
      console.log(`[${debugId}] STAMP-GEN: Upload SUCCESS to ${uploadResult.provider.toUpperCase()} →`, { storageKey, publicUrl: publicUrl.substring(0, 100) })
    } catch (uploadError: any) {
      console.error(`[${debugId}] STAMP-GEN: CRITICAL storage failure:`, uploadError.message)
      throw new Error(`Error subiendo imagen estampada: ${uploadError.message}`)
    }

    // 7) No guardar estampas derivadas en la base de datos (solo en R2)
    // Se devuelve la URL pública y metadatos para uso inmediato

    console.log(`[${debugId}] STAMP-GEN: Mockup generated OK →`, { mockupUrl: publicUrl.substring(0, 100) })

    await meterPublicImageGen({ endpoint: "generate-stamp", model: stampModel })

    return NextResponse.json({
      success: true,
      publicUrl,
      r2Key: storageKey,
      stampId,
      baseImageId,
      debugId
    }, {
      status: 200,
      headers: baseHeaders
    })

  } catch (error: any) {
    // Si el error ya tiene un debugId (de un paso anterior), usarlo; si no, crear uno nuevo
    const finalDebugId = error.debugId || uuidv4()
    // 🔔 Notificar por Telegram
    try {
      const { notifyError } = await import("@/lib/notifications")
      await notifyError({
        area: "Generador de Estampados (Mockups)",
        endpoint: "/api/generate-stamp",
        message: error.message || "Unknown error",
        debugId: finalDebugId
      })
    } catch (notifErr: any) {
      console.error("❌ Error sending error notification:", notifErr.message)
    }

    return NextResponse.json({
      error: error.message || "Error generando estampado",
      debugId: finalDebugId
    }, {
      status: 500,
      headers: { 'X-Debug-Id': finalDebugId, ...corsHeaders(request) }
    })
  }
}
