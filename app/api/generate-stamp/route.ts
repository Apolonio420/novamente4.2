import { NextRequest, NextResponse } from "next/server"
import { GoogleGenAI } from "@google/genai"
import { uploadToR2, generateImageName } from "@/lib/cloudflare-r2"
import { v4 as uuidv4 } from "uuid"

export const runtime = "nodejs"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      designImageUrl, // Imagen sin fondo
      garmentType, 
      garmentVariant,
      garmentColor, 
      side, 
      stampSize, 
      stampPosition,
      prompt 
    } = body

    if (!designImageUrl || !garmentType || !garmentColor || !side || !stampSize) {
      return NextResponse.json({ error: "Faltan parámetros para generar el estampado" }, { status: 400 })
    }

    console.log("🎨 STAMP-GEN: Starting stamp generation...")
    console.log("STAMP-GEN params:", { garmentType, garmentVariant, garmentColor, side, stampSize, stampPosition })

    // Inicializar Gemini
    const genAI = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY!,
    })

    // 1) Descargar la imagen de diseño (sin fondo)
    console.log("STAMP-GEN: Downloading design image...")
    const designResponse = await fetch(designImageUrl)
    if (!designResponse.ok) {
      throw new Error(`Error descargando imagen de diseño: ${designResponse.status}`)
    }
    const designBuffer = await designResponse.arrayBuffer()
    const designBase64 = Buffer.from(designBuffer).toString('base64')

    // 2) Obtener la imagen base de la prenda
    const { getBaseGarmentImage } = await import("@/lib/garment-red-square-mapping")
    const baseGarmentPath = getBaseGarmentImage(
      garmentType as 'hoodie' | 'tshirt',
      garmentVariant as 'classic' | 'oversize' || 'classic',
      garmentColor as 'black' | 'gray' | 'caramel' | 'white' | 'model',
      side as 'front' | 'back'
    )

    console.log("STAMP-GEN: Downloading base garment image:", baseGarmentPath)
    const baseGarmentResponse = await fetch(new URL(baseGarmentPath, request.url))
    if (!baseGarmentResponse.ok) {
      throw new Error(`Error descargando imagen base de prenda: ${baseGarmentResponse.status}`)
    }
    const baseGarmentBuffer = await baseGarmentResponse.arrayBuffer()
    const baseGarmentBase64 = Buffer.from(baseGarmentBuffer).toString('base64')

    // 3) Obtener la imagen de referencia con cuadrado rojo
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
      throw new Error("No se encontró imagen de referencia con cuadrado rojo")
    }

    console.log("STAMP-GEN: Downloading red square reference:", redSquarePath)
    const redSquareResponse = await fetch(new URL(redSquarePath, request.url))
    if (!redSquareResponse.ok) {
      throw new Error(`Error descargando imagen de referencia: ${redSquareResponse.status}`)
    }
    const redSquareBuffer = await redSquareResponse.arrayBuffer()
    const redSquareBase64 = Buffer.from(redSquareBuffer).toString('base64')

    // 4) Generar el estampado con Gemini
    console.log("STAMP-GEN: Calling Gemini for stamp generation...")
    console.log("STAMP-GEN: Design image size:", designBase64.length, "bytes")
    console.log("STAMP-GEN: Base garment image size:", baseGarmentBase64.length, "bytes")
    console.log("STAMP-GEN: Red square reference size:", redSquareBase64.length, "bytes")
    
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

    const result = await genAI.models.generateContent({
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

    console.log("STAMP-GEN: Gemini response received")

    // 5) Extraer la imagen generada
    let stampedImageBase64: string | null = null

    if (result.candidates && result.candidates[0] && result.candidates[0].content) {
      const content = result.candidates[0].content
      
      if (content.parts && content.parts.length > 0) {
        for (const part of content.parts) {
          if (part.inlineData && part.inlineData.data) {
            stampedImageBase64 = part.inlineData.data
            console.log("STAMP-GEN: Found image data in response")
            break
          }
        }
      }
    }

    if (!stampedImageBase64) {
      console.error("STAMP-GEN: No image data found in Gemini response")
      console.log("STAMP-GEN: Raw response:", JSON.stringify(result, null, 2))
      throw new Error("Gemini no devolvió una imagen válida")
    }

    // 6) Subir imagen estampada a Cloudflare R2
    const stampId = uuidv4()
    const stampedBuffer = Buffer.from(stampedImageBase64, 'base64')
    
    const description = prompt ? prompt.split(' ').slice(0, 2).join(' ') : 'estampado'
    const fileName = generateImageName(description, 'estampado', stampSize)
    const r2Key = `stamps/${stampId}/${fileName}`
    
    let publicUrl: string
    try {
      publicUrl = await uploadToR2(stampedBuffer, r2Key, "image/png")
      console.log("STAMP-GEN: Uploaded to R2:", r2Key)
    } catch (uploadError) {
      console.error("STAMP-GEN: Error uploading to R2:", uploadError)
      throw new Error("Error subiendo imagen estampada")
    }

    // 7) Guardar la nueva imagen (sin cache por ahora para evitar problemas)
    const { supabaseAdmin } = await import("@/lib/supabase-admin")

    // Guardar la nueva imagen
    const { data: dbData, error: dbError } = await supabaseAdmin
      .from("images")
      .insert({
        id: stampId,
        url: publicUrl,
        prompt: prompt || `Estampado ${garmentType} ${stampSize}`,
        user_id: null,
        has_bg_removed: false,
        url_without_bg: null,
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (dbError) {
      console.error("STAMP-GEN: Error saving to database:", dbError)
    } else {
      console.log("STAMP-GEN: Saved to database:", stampId)
    }

    console.log("STAMP-GEN: Success! Generated stamp:", publicUrl)

    return NextResponse.json({ 
      success: true, 
      publicUrl, 
      r2Key,
      stampId 
    }, { status: 200 })

  } catch (error: any) {
    console.error("STAMP-GEN: Error generating stamp:", error)
    return NextResponse.json({ 
      error: error.message || "Error generando estampado" 
    }, { status: 500 })
  }
}
