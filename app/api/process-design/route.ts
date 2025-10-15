import { NextRequest, NextResponse } from "next/server"
import { GoogleGenAI } from "@google/genai"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { uploadToR2, generateImageName } from "@/lib/cloudflare-r2"
import { v4 as uuidv4 } from "uuid"
import { createClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"
import { checkGenerationLimit } from "@/lib/auth"

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

    // Obtener userId de la sesión si no se proporciona
    let finalUserId = userId
    if (!finalUserId) {
      try {
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )
        
        const authHeader = request.headers.get('authorization')
        if (authHeader) {
          const token = authHeader.replace('Bearer ', '')
          const { data: { user } } = await supabase.auth.getUser(token)
          finalUserId = user?.id || null
        }
      } catch (authError) {
        console.log("PROCESS-DESIGN: Could not get user from session:", authError)
      }
    }

    // Límite para invitados: 10 por sessionId
    if (!finalUserId) {
      try {
        // Asegurar que exista sesión; si no, crearla y setear cookie en la respuesta final
        const cookieStore = cookies()
        let sessionId = (await cookieStore).get('novamente_session_id')?.value
        if (!sessionId) {
          // Crear uno efímero para validación; la cookie persistente se establece desde /api/user/session al montar el generador
          sessionId = crypto.randomUUID()
        }
        if (!sessionId) {
          return NextResponse.json({ error: 'Falta sessionId. Recargá la página para iniciar sesión anónima.' }, { status: 429 })
        }
        const { canGenerate, remaining } = await checkGenerationLimit(sessionId)
        if (!canGenerate) {
          return NextResponse.json({ error: 'Alcanzaste el límite de 10 imágenes sin iniciar sesión.' }, { status: 429 })
        }
      } catch (limitError) {
        console.warn('No se pudo validar límite de generación:', limitError)
      }
    }

    console.log("PROCESS-DESIGN input", {
      hasImageUrl: !!imageUrl,
      hasPrompt: !!prompt,
      userId: finalUserId,
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
    // Estructura base para toda imagen generada
    // images/<imageId>/original/<fileName>
    const r2Key = `images/${imageId}/original/${fileName}`
    
    let publicUrl: string
    try {
      publicUrl = await uploadToR2(processedBuffer, r2Key, "image/png")
      console.log("PROCESS-DESIGN uploaded to R2:", r2Key)
    } catch (uploadError) {
      console.error("Error subiendo imagen procesada a R2:", uploadError)
      throw new Error("Error subiendo imagen procesada")
    }

    // 5) Convertir URL R2 a URL estable antes de guardar
    let stableUrl = publicUrl
    if (publicUrl.includes("r2.dev") || publicUrl.includes("r2.cloudflarestorage.com")) {
      try {
        // Extraer key de la URL R2
        const urlMatch = publicUrl.match(/\/novamente\/(.+)$/)
        if (urlMatch) {
          const key = urlMatch[1]
          stableUrl = `/api/r2-public?key=${encodeURIComponent(key)}`
          console.log("✅ Converted processed image URL to stable proxy:", imageId)
        }
      } catch (conversionError) {
        console.error("⚠️ Error converting processed image URL:", conversionError)
      }
    }

    // 6) Guardar en base de datos
    // Intentar insertar con session_id si existe la columna
    let insertError: any = null
    const sessionId = finalUserId ? null : (await (async () => { const c = cookies(); return (await c).get('novamente_session_id')?.value || null })())
    
    console.log("PROCESS-DESIGN: Intentando insert con datos:", {
      imageId,
      finalUserId,
      sessionId,
      hasBackgroundRemoved,
      urlLength: stableUrl?.length
    })
    
    const { data: dbData, error: dbError } = await supabaseAdmin
      .from("images")
      .insert({
        id: imageId,
        url: stableUrl,
        prompt: prompt || "Imagen procesada",
        user_id: finalUserId || null,
        session_id: sessionId,
        has_bg_removed: hasBackgroundRemoved,
        url_without_bg: hasBackgroundRemoved ? stableUrl : null,
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    console.log("PROCESS-DESIGN: Resultado del primer insert:", {
      hasData: !!dbData,
      error: dbError ? {
        code: (dbError as any).code,
        message: (dbError as any).message,
        details: (dbError as any).details
      } : null
    })

    if (dbError && (dbError as any).code === '42703') {
      console.log("PROCESS-DESIGN: Columna session_id no existe, reintentando sin session_id")
      // Columna session_id no existe: reintentar sin session_id
      const retry = await supabaseAdmin
        .from('images')
        .insert({
          id: imageId,
          url: stableUrl,
          prompt: prompt || 'Imagen procesada',
          user_id: finalUserId || null,
          has_bg_removed: hasBackgroundRemoved,
          url_without_bg: hasBackgroundRemoved ? stableUrl : null,
          created_at: new Date().toISOString(),
        })
        .select()
        .single()
      
      console.log("PROCESS-DESIGN: Resultado del retry sin session_id:", {
        hasData: !!retry.data,
        error: retry.error ? {
          code: (retry.error as any).code,
          message: (retry.error as any).message,
          details: (retry.error as any).details
        } : null
      })
      
      insertError = retry.error
    }

    if ((dbError && (dbError as any).code !== '42703') || insertError) {
      console.error('PROCESS-DESIGN: Error final guardando en BD:', {
        originalError: dbError,
        retryError: insertError,
        finalUserId,
        sessionId,
        imageId
      })
      throw new Error('Error guardando en base de datos')
    }

    console.log("PROCESS-DESIGN success", {
      imageId,
      publicUrl,
      hasBgRemoved: hasBackgroundRemoved,
    })

    return NextResponse.json({
      success: true,
      imageId,
      imageUrl: stableUrl,
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
