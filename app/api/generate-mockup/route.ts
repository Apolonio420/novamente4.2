import { NextRequest, NextResponse } from "next/server"
import { uploadToR2, generateImageName } from "@/lib/cloudflare-r2"
import { getGarmentMapping } from "@/lib/garment-mappings"
import { v4 as uuidv4 } from "uuid"

export async function POST(request: NextRequest) {
  try {
    console.log("GENERATE-MOCKUP starting...")

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

    console.log("GENERATE-MOCKUP input", {
      designImageUrl: designImageUrl.substring(0, 50) + "...",
      garmentType,
      garmentColor,
      side,
      size
    })

    // 1) Obtener el mapeo de la prenda
    const mapping = getGarmentMapping(garmentType, garmentColor, side)
    if (!mapping) {
      return NextResponse.json({
        error: `No se encontró mapeo para ${garmentType}-${garmentColor}-${side}`
      }, { status: 400 })
    }

    // 2) Descargar la imagen del diseño
    console.log('Resolviendo imagen de diseño:', designImageUrl.substring(0, 50))
    let designBuffer: Buffer | null = null

    // Intentar resolver como key de R2 primero para evitar fetch externo innecesario
    const { normalizeR2Key } = await import("@/lib/r2")
    const storageKey = normalizeR2Key(designImageUrl)

    if (storageKey && !storageKey.startsWith('http')) {
      console.log('Intentando descarga directa desde Storage usando key:', storageKey)
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
          console.log('✅ Descarga directa desde R2 exitosa, tamaño:', designBuffer.length)
        }
      } catch (r2Error: any) {
        console.warn('⚠️ Falló descarga directa desde R2, intentando fallback a fetch:', r2Error.message)
      }
    }

    // Si no se pudo descargar directamente, usar fetch (para URLs externas o fallbacks)
    if (!designBuffer) {
      const designUrl = designImageUrl.startsWith('http')
        ? designImageUrl
        : `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}${designImageUrl}`

      console.log('Descargando imagen de diseño vía fetch desde:', designUrl)
      const designResponse = await fetch(designUrl)
      if (!designResponse.ok) {
        throw new Error(`Error descargando imagen de diseño: ${designResponse.status}`)
      }
      const arrayBuffer = await designResponse.arrayBuffer()
      designBuffer = Buffer.from(arrayBuffer)
      console.log('✅ Imagen de diseño descargada vía fetch, tamaño:', designBuffer.length)
    }

    // 3) Descargar la imagen de la prenda
    const garmentUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}${mapping.garmentPath}`
    console.log('Descargando imagen de prenda desde:', garmentUrl)
    const garmentResponse = await fetch(garmentUrl)
    console.log('Respuesta de prenda:', garmentResponse.status, garmentResponse.statusText)
    if (!garmentResponse.ok) {
      throw new Error(`Error descargando imagen de prenda: ${garmentResponse.status}`)
    }
    const garmentBuffer = await garmentResponse.arrayBuffer()
    console.log('Buffer de prenda descargado, tamaño:', garmentBuffer.byteLength)

    // 4) Crear canvas para combinar las imágenes
    console.log('Creando canvas...')
    const canvas = createCanvas(400, 500) // Tamaño base del mapeo
    const ctx = canvas.getContext('2d')
    console.log('Canvas creado exitosamente')

    // 5) Cargar y dibujar la prenda de fondo
    console.log('Cargando imagen de prenda...')
    try {
      const garmentImage = await loadImage(Buffer.from(garmentBuffer))
      console.log('Imagen de prenda cargada, dibujando...')
      ctx.drawImage(garmentImage, 0, 0, 400, 500)
      console.log('Prenda dibujada exitosamente')
    } catch (error: any) {
      console.error('Error cargando imagen de prenda:', error)
      throw new Error(`Error cargando imagen de prenda: ${error.message}`)
    }

    // 6) Cargar y dibujar el diseño en la posición correcta
    console.log('Cargando imagen de diseño...')
    try {
      const designImage = await loadImage(Buffer.from(designBuffer))
      console.log('Imagen de diseño cargada, dibujando...')

      const { x: mapX, y: mapY, width: mapWidth, height: mapHeight } = mapping.coordinates
      console.log('Coordenadas del mapeo:', { mapX, mapY, mapWidth, mapHeight })

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

      console.log('Dibujando diseño escalado:', { size, scaleFactor, drawX, drawY, drawWidth, drawHeight })
      ctx.drawImage(designImage, drawX, drawY, drawWidth, drawHeight)
      console.log('Diseño dibujado exitosamente')
    } catch (error: any) {
      console.error('Error cargando imagen de diseño:', error)
      throw new Error(`Error cargando imagen de diseño: ${error.message}`)
    }

    // 7) Convertir canvas a buffer
    console.log('Convirtiendo canvas a buffer...')
    const finalBuffer = canvas.toBuffer('image/png')
    console.log('Buffer generado, tamaño:', finalBuffer.length)

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

    console.log("Subiendo a R2 con key:", r2Key)
    const publicUrl = await uploadToR2(finalBuffer, r2Key, "image/png")
    console.log("GENERATE-MOCKUP uploaded to R2:", r2Key)
    console.log("URL pública generada:", publicUrl)

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



