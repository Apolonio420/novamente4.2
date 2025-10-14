import { NextRequest, NextResponse } from "next/server"
import { uploadToR2, generateImageName } from "@/lib/cloudflare-r2"
import { getGarmentMapping } from "@/lib/garment-mappings"
import { v4 as uuidv4 } from "uuid"
import { createCanvas, loadImage } from "canvas"

export async function POST(request: NextRequest) {
  try {
    console.log("GENERATE-MOCKUP starting...")
    
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
    const designUrl = designImageUrl.startsWith('http') 
      ? designImageUrl 
      : `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}${designImageUrl}`
    
    console.log('Descargando imagen de diseño desde:', designUrl)
    const designResponse = await fetch(designUrl)
    console.log('Respuesta de diseño:', designResponse.status, designResponse.statusText)
    if (!designResponse.ok) {
      throw new Error(`Error descargando imagen de diseño: ${designResponse.status}`)
    }
    const designBuffer = await designResponse.arrayBuffer()
    console.log('Buffer de diseño descargado, tamaño:', designBuffer.byteLength)

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
    } catch (error) {
      console.error('Error cargando imagen de prenda:', error)
      throw new Error(`Error cargando imagen de prenda: ${error.message}`)
    }

    // 6) Cargar y dibujar el diseño en la posición correcta
    console.log('Cargando imagen de diseño...')
    try {
      const designImage = await loadImage(Buffer.from(designBuffer))
      console.log('Imagen de diseño cargada, dibujando...')
      
      const { x, y, width, height } = mapping.coordinates
      console.log('Coordenadas del diseño:', { x, y, width, height })
      ctx.drawImage(designImage, x, y, width, height)
      console.log('Diseño dibujado exitosamente')
    } catch (error) {
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
      } catch {}
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



