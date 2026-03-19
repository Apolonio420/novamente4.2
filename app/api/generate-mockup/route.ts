import { NextRequest, NextResponse } from "next/server"
import { uploadToR2, generateImageName } from "@/lib/cloudflare-r2"
import { getGarmentMapping } from "@/lib/garment-mappings"
import { v4 as uuidv4 } from "uuid"
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit"

const limiter = rateLimit({ limit: 5, windowSeconds: 60, prefix: 'mockup' })

export async function POST(request: NextRequest) {
  const { success, resetAt } = limiter.check(request)
  if (!success) return rateLimitResponse(resetAt)

  try {

    // Dynamic import for canvas to support Vercel deployment
    let createCanvas, loadImage;
    if (process.env.NODE_ENV === 'production') {
      try {
        const { createCanvas: napiCreateCanvas, loadImage: napiLoadImage } = require('@napi-rs/canvas');
        createCanvas = napiCreateCanvas;
        loadImage = napiLoadImage;
      } catch (e) {
        console.warn("Failed to load @napi-rs/canvas, falling back to canvas:", e);
        const { createCanvas: nodeCanvasCreateCanvas, loadImage: nodeCanvasLoadImage } = require('canvas');
        createCanvas = nodeCanvasCreateCanvas;
        loadImage = nodeCanvasLoadImage;
      }
    } else {
      const { createCanvas: nodeCanvasCreateCanvas, loadImage: nodeCanvasLoadImage } = require('canvas');
      createCanvas = nodeCanvasCreateCanvas;
      loadImage = nodeCanvasLoadImage;
    }

    const body = await request.json()
    const {
      designImageUrl,
      garmentType,
      garmentColor,
      side,
      size = 'R3',
      prompt,
      originalImageId, // id de la imagen generada base
    } = body

    if (!designImageUrl || !garmentType || !garmentColor || !side) {
      return NextResponse.json({
        error: "designImageUrl, garmentType, garmentColor y side son requeridos"
      }, { status: 400 })
    }


    // 1) Obtener el mapeo de la prenda
    const mapping = getGarmentMapping(garmentType, garmentColor, side)
    if (!mapping) {
      return NextResponse.json({
        error: `No se encontró mapeo para ${garmentType}-${garmentColor}-${side}`
      }, { status: 400 })
    }

    // 2) Descargar la imagen del diseño
    let designBuffer: Buffer | null = null

    // Intentar resolver como key de R2 primero para evitar fetch externo innecesario
    const { normalizeR2Key } = await import("@/lib/r2")
    const storageKey = normalizeR2Key(designImageUrl)

    if (storageKey && !storageKey.startsWith('http')) {
      try {
        const { r2Client, BUCKET_NAME } = await import("@/lib/cloudflare-r2")
        const { GetObjectCommand } = await import("@aws-sdk/client-s3")
        const command = new GetObjectCommand({
          Bucket: BUCKET_NAME,
          Key: storageKey,
        })
        const r2Response = await r2Client.send(command)
        if (r2Response.Body) {
          if (typeof (r2Response.Body as any).transformToByteArray === 'function') {
            const uint8Array = await (r2Response.Body as any).transformToByteArray()
            designBuffer = Buffer.from(uint8Array)
          } else {
            const chunks: Buffer[] = []
            for await (const chunk of (r2Response.Body as any)) {
              chunks.push(Buffer.from(chunk))
            }
            designBuffer = Buffer.concat(chunks)
          }
        }
      } catch (r2Error: any) {
      }
    }

    // Si no se pudo descargar directamente, usar fetch (para URLs externas o fallbacks)
    if (!designBuffer) {
      const designUrl = designImageUrl.startsWith('http')
        ? designImageUrl
        : `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}${designImageUrl}`

      const designResponse = await fetch(designUrl)
      if (!designResponse.ok) {
        throw new Error(`Error descargando imagen de diseño: ${designResponse.status}`)
      }
      const arrayBuffer = await designResponse.arrayBuffer()
      designBuffer = Buffer.from(arrayBuffer)
    }

    // 3) Descargar la imagen de la prenda
    const garmentUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}${mapping.garmentPath}`
    const garmentResponse = await fetch(garmentUrl)
    if (!garmentResponse.ok) {
      throw new Error(`Error descargando imagen de prenda: ${garmentResponse.status}`)
    }
    const garmentBuffer = await garmentResponse.arrayBuffer()

    // 4) Crear canvas para combinar las imágenes
    const canvas = createCanvas(400, 500) // Tamaño base del mapeo
    const ctx = canvas.getContext('2d')

    // 5) Cargar y dibujar la prenda de fondo
    try {
      const garmentImage = await loadImage(Buffer.from(garmentBuffer))
      ctx.drawImage(garmentImage, 0, 0, 400, 500)
    } catch (error: any) {
      console.error('Error cargando imagen de prenda:', error)
      throw new Error(`Error cargando imagen de prenda: ${error.message}`)
    }

    // 6) Cargar y dibujar el diseño en la posición correcta
    try {
      const designImage = await loadImage(Buffer.from(designBuffer))

      const { x: mapX, y: mapY, width: mapWidth, height: mapHeight } = mapping.coordinates

      // Ajustar tamaño según stampSize (R1, R2, R3)
      let scaleFactor = 1.0
      switch (size) {
        case 'R1': scaleFactor = 0.35; break; // Logo pequeño
        case 'R2': scaleFactor = 0.65; break; // Estampado mediano
        case 'R3': scaleFactor = 1.0; break;  // Full
        default: scaleFactor = 1.0; break;
      }

      const drawWidth = mapWidth * scaleFactor
      const drawHeight = mapHeight * scaleFactor // Asumimos que el height también escala proporcionalmente al área de impresión

      // Calcular posición centrada en el área de impresión
      // Opcional: si supported positions (left, center) se pasaran, aquí sería el lugar
      const drawX = mapX + (mapWidth - drawWidth) / 2
      const drawY = mapY + (mapHeight - drawHeight) / 2

      ctx.drawImage(designImage, drawX, drawY, drawWidth, drawHeight)
    } catch (error: any) {
      console.error('Error cargando imagen de diseño:', error)
      throw new Error(`Error cargando imagen de diseño: ${error.message}`)
    }

    // 7) Convertir canvas a buffer
    const finalBuffer = canvas.toBuffer('image/png')

    // 8) Subir imagen final a R2 agrupando por imagen base
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

    const mockupId = uuidv4()
    const description = prompt ? prompt.split(' ').slice(0, 2).join(' ') : 'diseno'
    // token descriptivo consistente con stamps
    const token = [
      String(garmentType || '').toLowerCase(),
      String(garmentColor || '').toLowerCase(),
      String(side || '').toLowerCase(),
      String(size || '').toUpperCase(),
    ].filter(Boolean).join('_')
    const fileName = generateImageName(description, token)
    // images/<baseId>/mockups/<mockupId>/<fileName>
    const r2Key = `images/${baseImageId}/mockups/${mockupId}/${fileName}`

    const publicUrl = await uploadToR2(finalBuffer, r2Key, "image/png")

    return NextResponse.json({
      success: true,
      mockupId,
      baseImageId,
      publicUrl,
      r2Key,
      mapping: {
        garmentType,
        garmentColor,
        side,
        size,
        coordinates: mapping.coordinates
      }
    })

  } catch (error: any) {
    console.error("GENERATE-MOCKUP error:", error)
    return NextResponse.json({
      error: error.message || "Error generando mockup"
    }, { status: 500 })
  }
}



