import { NextRequest, NextResponse } from "next/server"
import { GoogleGenAI } from "@google/genai"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { uploadToR2, generateImageName } from "@/lib/cloudflare-r2"
import { v4 as uuidv4 } from "uuid"

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! })

export async function POST(request: NextRequest) {
  try {
    console.log("PROCESS-DESIGN starting...")
    
    const body = await request.json()
    const { imageUrl, prompt, userId } = body

    if (!imageUrl) {
      console.log("PROCESS-DESIGN error: imageUrl es requerido")
      return NextResponse.json({ error: "imageUrl es requerido" }, { status: 400 })
    }

    console.log("PROCESS-DESIGN input", {
      hasImageUrl: !!imageUrl,
      hasPrompt: !!prompt,
      userId,
      imageUrl: imageUrl.substring(0, 100) + "..."
    })

    // 1) Obtener imagen (puede ser URL o base64)
    let base64Data: string
    
    if (imageUrl.startsWith('data:')) {
      // Es base64 directo
      base64Data = imageUrl.split(',')[1]
      console.log("PROCESS-DESIGN using base64 data, size:", base64Data.length)
    } else if (imageUrl.startsWith('blob:')) {
      // Es blob URL, no se puede hacer fetch desde el servidor
      console.log("PROCESS-DESIGN blob URL detected, cannot process from server")
      throw new Error("No se puede procesar URLs blob desde el servidor")
    } else {
      // Es URL, descargar
      console.log("PROCESS-DESIGN downloading image...")
      const imageResponse = await fetch(imageUrl)
      if (!imageResponse.ok) {
        console.log("PROCESS-DESIGN error downloading image:", imageResponse.status)
        throw new Error(`Error descargando imagen: ${imageResponse.status}`)
      }
      
      const imageBuffer = await imageResponse.arrayBuffer()
      base64Data = Buffer.from(imageBuffer).toString('base64')
      console.log("PROCESS-DESIGN image downloaded, size:", base64Data.length)
      console.log("PROCESS-DESIGN image content type:", imageResponse.headers.get('content-type'))
    }

    // 2) Procesamiento de imagen con remoción de fondo
    console.log("PROCESS-DESIGN: Processing image with background removal...")
    
    let processedBase64 = base64Data
    let hasBackgroundRemoved = false

    // Procesar con Gemini para remover fondo
    const bgRemovalPrompt = `Remove background, keep subject only, transparent PNG.`
    
    try {
      const result = await genAI.models.generateContent({
        model: "gemini-2.5-flash-image-preview",
        contents: [
          {
            text: bgRemovalPrompt
          },
          {
            inlineData: {
              data: base64Data,
              mimeType: "image/png",
            },
          },
        ],
      })
      
      console.log("PROCESS-DESIGN Gemini response received")
      
      // Extraer imagen base64 de la respuesta de Gemini
      for (const part of result.candidates[0].content.parts) {
        if (part.inlineData) {
          processedBase64 = part.inlineData.data
          hasBackgroundRemoved = true
          console.log("PROCESS-DESIGN: Background removed successfully")
          break
        }
      }
      
      if (!hasBackgroundRemoved) {
        console.warn("PROCESS-DESIGN: Gemini failed, using original image")
      }
    } catch (geminiError) {
      console.error("PROCESS-DESIGN: Gemini error, using original image:", geminiError)
    }

    // 3) Subir imagen procesada a Cloudflare R2
    const imageId = uuidv4()
    const processedBuffer = Buffer.from(processedBase64, 'base64')
    
    // Generar nombre descriptivo basado en el prompt
    const description = prompt ? prompt.split(' ').slice(0, 2).join(' ') : 'imagen'
    const fileName = generateImageName(description, 'sinfondo')
    const r2Key = `processed/${imageId}/${fileName}`
    
    let publicUrl: string
    try {
      publicUrl = await uploadToR2(processedBuffer, r2Key, "image/png")
      console.log("PROCESS-DESIGN uploaded to R2:", r2Key)
    } catch (uploadError) {
      console.error("Error subiendo imagen procesada a R2:", uploadError)
      throw new Error("Error subiendo imagen procesada")
    }

    // 5) Guardar en base de datos
    const { data: dbData, error: dbError } = await supabaseAdmin
      .from("images")
      .insert({
        id: imageId,
        url: publicUrl,
        prompt: prompt || "Imagen procesada",
        user_id: userId || null,
        has_bg_removed: hasBackgroundRemoved,
        url_without_bg: hasBackgroundRemoved ? publicUrl : null,
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (dbError) {
      console.error("Error guardando en BD:", dbError)
      throw new Error("Error guardando en base de datos")
    }

    console.log("PROCESS-DESIGN success", {
      imageId,
      publicUrl,
      hasBgRemoved: hasBackgroundRemoved,
    })

    return NextResponse.json({
      success: true,
      imageId,
      imageUrl: publicUrl,
      hasBgRemoved: hasBackgroundRemoved,
      prompt: prompt || "Imagen procesada",
    })

  } catch (error) {
    console.error("Error en process-design:", error)
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : "Error procesando diseño" 
      }, 
      { status: 500 }
    )
  }
}
