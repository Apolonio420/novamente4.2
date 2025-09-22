import { NextRequest, NextResponse } from "next/server"
import { uploadToR2, generateImageName } from "@/lib/cloudflare-r2"
import { getGarmentMapping } from "@/lib/garment-mappings"
import { v4 as uuidv4 } from "uuid"

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
      prompt 
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
    const designResponse = await fetch(designImageUrl)
    if (!designResponse.ok) {
      throw new Error(`Error descargando imagen de diseño: ${designResponse.status}`)
    }
    const designBuffer = await designResponse.arrayBuffer()

    // 3) Descargar la imagen de la prenda
    const garmentResponse = await fetch(`/garments/${mapping.garmentPath}`)
    if (!garmentResponse.ok) {
      throw new Error(`Error descargando imagen de prenda: ${garmentResponse.status}`)
    }
    const garmentBuffer = await garmentResponse.arrayBuffer()

    // 4) Crear canvas para combinar las imágenes
    const canvas = new OffscreenCanvas(400, 500) // Tamaño base del mapeo
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      throw new Error("Error creando contexto de canvas")
    }

    // 5) Cargar y dibujar la prenda de fondo
    const garmentBlob = new Blob([garmentBuffer], { type: 'image/jpeg' })
    const garmentImage = await createImageBitmap(garmentBlob)
    ctx.drawImage(garmentImage, 0, 0, 400, 500)

    // 6) Cargar y dibujar el diseño en la posición correcta
    const designBlob = new Blob([designBuffer], { type: 'image/png' })
    const designImage = await createImageBitmap(designBlob)
    
    const { x, y, width, height } = mapping.coordinates
    ctx.drawImage(designImage, x, y, width, height)

    // 7) Convertir canvas a buffer
    const finalCanvas = canvas.transferToImageBitmap()
    const finalBlob = await canvas.convertToBlob({ type: 'image/png' })
    const finalBuffer = Buffer.from(await finalBlob.arrayBuffer())

    // 8) Subir imagen final a R2
    const mockupId = uuidv4()
    const description = prompt ? prompt.split(' ').slice(0, 2).join(' ') : 'diseno'
    const fileName = generateImageName(description, 'estampado', `${garmentType}_${garmentColor}`, size)
    const r2Key = `mockups/${mockupId}/${fileName}`

    const publicUrl = await uploadToR2(finalBuffer, r2Key, "image/png")
    console.log("GENERATE-MOCKUP uploaded to R2:", r2Key)

    return NextResponse.json({
      success: true,
      mockupId,
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



