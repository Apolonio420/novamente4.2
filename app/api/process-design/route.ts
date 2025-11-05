import { NextRequest, NextResponse } from "next/server"
import { GoogleGenAI } from "@google/genai"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { uploadToR2, generateImageName } from "@/lib/cloudflare-r2"
import { normalizeR2Key, getPublicR2Url } from "@/lib/r2"
import { v4 as uuidv4 } from "uuid"
import { createClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"
import { checkGenerationLimit } from "@/lib/auth"

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! })

// Schema de validación (manual, se puede cambiar a Zod después)
interface ProcessDesignBody {
  prompt: string
  model?: string
  imageUrl: string
  imageUrlNoBg?: string
  meta?: any
  userId?: string | null
}

function validateBody(body: any): { valid: boolean; error?: string; data?: ProcessDesignBody } {
  if (!body || typeof body !== 'object') {
    return { valid: false, error: 'Body debe ser un objeto' }
  }

  if (!body.imageUrl || typeof body.imageUrl !== 'string' || body.imageUrl.trim().length === 0) {
    return { valid: false, error: 'imageUrl es requerido y debe ser un string no vacío' }
  }

  if (!body.prompt || typeof body.prompt !== 'string' || body.prompt.trim().length === 0) {
    return { valid: false, error: 'prompt es requerido y debe ser un string no vacío' }
  }

  return {
    valid: true,
    data: {
      prompt: body.prompt.trim(),
      model: body.model,
      imageUrl: body.imageUrl.trim(),
      imageUrlNoBg: body.imageUrlNoBg?.trim(),
      meta: body.meta,
      userId: body.userId,
    }
  }
}

export async function POST(request: NextRequest) {
  // Generar ID de debug para correlación
  const debugId = uuidv4()
  
  try {
    console.log(`[${debugId}] PROCESS-DESIGN starting...`)
    
    const body = await request.json()
    
    // Validar payload
    const validation = validateBody(body)
    if (!validation.valid) {
      console.error(`[${debugId}] Validation failed:`, validation.error)
      return NextResponse.json(
        { error: validation.error || 'Invalid body', debugId },
        { status: 422, headers: { 'X-Debug-Id': debugId } }
      )
    }

    const { prompt, imageUrl, imageUrlNoBg, model, meta, userId } = validation.data!

    // Obtener userId de la sesión si no se proporciona
    let finalUserId = userId || null
    let isAuthenticated = false
    
    if (!finalUserId) {
      try {
        const cookieStore = await cookies()
        
        // Buscar todas las cookies de Supabase (normalmente tienen el formato sb-<project-ref>-auth-token)
        const allCookies = cookieStore.getAll()
        const supabaseCookies = allCookies.filter(c => 
          c.name.includes('sb-') && c.name.includes('-auth-token')
        )
        
        console.log(`[${debugId}] Cookies found:`, allCookies.map(c => c.name))
        console.log(`[${debugId}] Supabase auth cookies:`, supabaseCookies.map(c => c.name))
        
        // Crear cliente de Supabase que lea las cookies automáticamente
        // Supabase necesita métodos get, set y remove para funcionar correctamente
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          {
            cookies: {
              get(name: string) {
                const cookie = cookieStore.get(name)
                return cookie?.value
              },
              set(name: string, value: string, options: any) {
                // No hacer nada en el servidor, las cookies se manejan en el cliente
              },
              remove(name: string, options: any) {
                // No hacer nada en el servidor
              },
            },
            auth: {
              persistSession: false, // No persistir en el servidor
              autoRefreshToken: false, // No refrescar en el servidor
            },
          }
        )
        
        // Intentar obtener el usuario desde las cookies de Supabase
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        
        if (!authError && user) {
          finalUserId = user.id
          isAuthenticated = true
          console.log(`[${debugId}] ✅ User authenticated via cookies:`, user.id.substring(0, 8))
        } else {
          // Si no hay usuario en cookies, intentar con header Authorization
          const authHeader = request.headers.get('authorization')
          if (authHeader) {
            const token = authHeader.replace('Bearer ', '')
            const { data: { user: userFromHeader }, error: headerError } = await supabase.auth.getUser(token)
            if (!headerError && userFromHeader) {
              finalUserId = userFromHeader.id
              isAuthenticated = true
              console.log(`[${debugId}] ✅ User authenticated via header:`, userFromHeader.id.substring(0, 8))
            } else {
              console.log(`[${debugId}] ⚠️ Auth check failed - error:`, authError?.message || headerError?.message)
            }
          } else {
            console.log(`[${debugId}] ⚠️ No auth header found and no user in cookies`)
            if (supabaseCookies.length > 0) {
              console.log(`[${debugId}] ⚠️ Supabase cookies exist but getUser() failed - possible cookie format issue`)
            }
          }
        }
      } catch (authError) {
        console.log(`[${debugId}] ❌ Could not get user from session:`, authError)
        if (authError instanceof Error) {
          console.log(`[${debugId}] Auth error details:`, authError.message)
        }
      }
    } else {
      // Si userId viene en el body, asumimos que está autenticado
      isAuthenticated = true
    }

    // Obtener sessionId SOLO para usuarios NO autenticados
    let sessionId: string | null = null
    if (!isAuthenticated && !finalUserId) {
      try {
        const cookieStore = await cookies()
        sessionId = cookieStore.get('novamente_session_id')?.value || null
        
        // Validar límite SOLO para invitados (no autenticados)
        if (sessionId) {
          const { canGenerate, remaining } = await checkGenerationLimit(sessionId)
          if (!canGenerate) {
            console.log(`[${debugId}] Generation limit reached for session:`, sessionId)
            return NextResponse.json(
              { error: 'Alcanzaste el límite de 10 imágenes sin iniciar sesión.', debugId },
              { status: 429, headers: { 'X-Debug-Id': debugId } }
            )
          }
        }
      } catch (limitError) {
        console.warn(`[${debugId}] Could not validate generation limit:`, limitError)
      }
    }

    console.log(`[${debugId}] PROCESS-DESIGN input`, {
      hasImageUrl: !!imageUrl,
      hasPrompt: !!prompt,
      userId: finalUserId,
      isAuthenticated,
      sessionId: sessionId ? sessionId.substring(0, 8) + '...' : null,
      imageUrlPreview: imageUrl.substring(0, 100) + "..."
    })

    // 1) Obtener imagen (puede ser URL o base64)
    let base64Data: string
    
    if (imageUrl.startsWith('data:')) {
      // Es base64 directo
      base64Data = imageUrl.split(',')[1]
      console.log(`[${debugId}] Using base64 data, size:`, base64Data.length)
    } else if (imageUrl.startsWith('blob:')) {
      // Es blob URL, no se puede hacer fetch desde el servidor
      console.log(`[${debugId}] Blob URL detected, cannot process from server`)
      throw new Error("No se puede procesar URLs blob desde el servidor")
    } else {
      // Es URL, descargar
      console.log(`[${debugId}] Downloading image from URL...`)
      // Soportar rutas relativas de assets públicos (p.ej. /styles/...) convirtiéndolas a absolutas
      let urlToFetch = imageUrl
      try {
        if (typeof imageUrl === 'string' && imageUrl.startsWith('/')) {
          // request.url es absoluta (http(s)://host/...) → base para construir la URL final
          urlToFetch = new URL(imageUrl, request.url).toString()
          console.log(`[${debugId}] Resolved relative URL:`, urlToFetch.substring(0, 100))
        }
      } catch (resolveErr) {
        console.log(`[${debugId}] Error resolving URL:`, resolveErr)
      }
      const imageResponse = await fetch(urlToFetch)
      if (!imageResponse.ok) {
        console.log(`[${debugId}] Error downloading image:`, imageResponse.status)
        throw new Error(`Error descargando imagen: ${imageResponse.status}`)
      }
      
      const imageBuffer = await imageResponse.arrayBuffer()
      base64Data = Buffer.from(imageBuffer).toString('base64')
      console.log(`[${debugId}] Image downloaded, size:`, base64Data.length)
      console.log(`[${debugId}] Image content type:`, imageResponse.headers.get('content-type'))
    }

    // 2) Procesamiento de imagen con remoción de fondo
    console.log(`[${debugId}] Processing image with background removal...`)
    
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
      
      console.log(`[${debugId}] Gemini response received`)
      
      // Extraer imagen base64 de la respuesta de Gemini
      for (const part of result.candidates[0].content.parts) {
        if (part.inlineData) {
          processedBase64 = part.inlineData.data
          hasBackgroundRemoved = true
          console.log(`[${debugId}] Background removed successfully`)
          break
        }
      }
      
      if (!hasBackgroundRemoved) {
        console.warn(`[${debugId}] Gemini failed, using original image`)
      }
    } catch (geminiError) {
      console.error(`[${debugId}] Gemini error, using original image:`, geminiError)
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
      console.log(`[${debugId}] Uploaded to R2:`, r2Key)
    } catch (uploadError) {
      console.error(`[${debugId}] Error uploading to R2:`, uploadError)
      throw new Error("Error subiendo imagen procesada a R2")
    }

    // 5) Normalizar clave R2 (sin firmas ni proxy) - siempre guardar solo el key
    const cleanKey = normalizeR2Key(publicUrl) || r2Key
    if (!cleanKey) {
      console.error(`[${debugId}] Failed to normalize R2 key from:`, publicUrl.substring(0, 100))
      throw new Error('No se pudo normalizar la clave de almacenamiento')
    }

    // Normalizar imageUrlNoBg si existe
    const cleanKeyNoBg = imageUrlNoBg ? normalizeR2Key(imageUrlNoBg) : null

    // 6) Guardar en base de datos con supabaseAdmin (bypass RLS)
    console.log(`[${debugId}] Inserting to DB:`, {
      imageId,
      finalUserId,
      sessionId: sessionId ? sessionId.substring(0, 8) + '...' : null,
      hasBackgroundRemoved,
      cleanKey: cleanKey.substring(0, 50) + '...',
      cleanKeyNoBg: cleanKeyNoBg ? cleanKeyNoBg.substring(0, 50) + '...' : null
    })
    
    // Preparar datos para insert (solo campos que sabemos que existen)
    const insertData: any = {
      id: imageId,
      url: cleanKey,
      prompt: prompt,
      user_id: finalUserId,
      created_at: new Date().toISOString(),
    }

    // Agregar campos opcionales si existen en el schema
    // has_bg_removed y url_without_bg
    if (hasBackgroundRemoved !== undefined) {
      insertData.has_bg_removed = hasBackgroundRemoved
    }
    if (hasBackgroundRemoved && (cleanKeyNoBg || cleanKey)) {
      insertData.url_without_bg = cleanKeyNoBg || cleanKey
    }

    // Agregar session_id solo si existe (puede fallar si la columna no existe)
    if (sessionId && sessionId.length > 10) {
      insertData.session_id = sessionId
    }

    let dbData: any = null
    let dbError: any = null

    // Intentar insert primero (sin storage_key que puede no existir)
    const { data, error } = await supabaseAdmin
      .from("images")
      .insert(insertData)
      .select()
      .single()

    dbData = data
    dbError = error

    // Si falla por columna inexistente, intentar identificar cuál y removerla
    if (dbError && ((dbError as any).code === '42703' || (dbError as any).code === 'PGRST204' || (dbError as any).message?.includes('column') || (dbError as any).message?.includes('schema cache'))) {
      const errorMsg = (dbError as any).message || ''
      console.log(`[${debugId}] Column missing error detected:`, errorMsg)
      
      // Detectar qué columna falta
      let retryData = { ...insertData }
      
      if (errorMsg.includes('storage_key')) {
        console.log(`[${debugId}] storage_key column missing, removing from insert`)
        delete retryData.storage_key
      }
      if (errorMsg.includes('session_id')) {
        console.log(`[${debugId}] session_id column missing, removing from insert`)
        delete retryData.session_id
      }
      if (errorMsg.includes('has_bg_removed')) {
        console.log(`[${debugId}] has_bg_removed column missing, removing from insert`)
        delete retryData.has_bg_removed
        delete retryData.url_without_bg
      }
      if (errorMsg.includes('url_without_bg')) {
        console.log(`[${debugId}] url_without_bg column missing, removing from insert`)
        delete retryData.url_without_bg
      }
      
      // Reintentar sin las columnas que faltan
      const retry = await supabaseAdmin
        .from('images')
        .insert(retryData)
        .select()
        .single()
      
      dbData = retry.data
      dbError = retry.error
    }

    // Verificar si hubo error después del retry
    if (dbError) {
      console.error(`[${debugId}] Database insert error:`, {
        code: (dbError as any).code,
        message: (dbError as any).message,
        details: (dbError as any).details,
        hint: (dbError as any).hint,
        finalUserId,
        sessionId: sessionId ? sessionId.substring(0, 8) + '...' : null,
        imageId,
        cleanKey: cleanKey.substring(0, 50)
      })
      
      // Si es un error de RLS o auth, devolver 401/403
      if ((dbError as any).code === '42501' || (dbError as any).message?.includes('permission') || (dbError as any).message?.includes('policy')) {
        return NextResponse.json(
          { error: 'No tienes permiso para guardar esta imagen. Iniciá sesión.', debugId },
          { status: 403, headers: { 'X-Debug-Id': debugId } }
        )
      }
      
      throw new Error(`Error guardando en base de datos: ${(dbError as any).message || 'Unknown error'}`)
    }

    if (!dbData) {
      console.error(`[${debugId}] No data returned from insert but no error reported`)
      throw new Error('No se pudo confirmar el guardado en base de datos')
    }

    // Generar URLs públicas para la respuesta
    const publicImageUrl = getPublicR2Url(cleanKey)
    const publicImageUrlNoBg = cleanKeyNoBg || (hasBackgroundRemoved ? getPublicR2Url(cleanKey) : null)

    console.log(`[${debugId}] PROCESS-DESIGN success:`, {
      imageId,
      publicImageUrl: publicImageUrl.substring(0, 80) + '...',
      hasBgRemoved: hasBackgroundRemoved,
    })

    return NextResponse.json({
      success: true,
      image: {
        id: imageId,
        url: publicImageUrl,
        url_without_bg: publicImageUrlNoBg,
        storage_key: cleanKey,
        prompt: prompt,
        has_bg_removed: hasBackgroundRemoved,
        created_at: dbData.created_at,
      },
      debugId
    }, { 
      status: 200,
      headers: { 'X-Debug-Id': debugId } 
    })

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Error procesando diseño"
    const errorCause = error instanceof Error ? error.cause : undefined
    
    console.error(`[${debugId}] PROCESS-DESIGN error:`, {
      message: errorMessage,
      cause: errorCause,
      stack: error instanceof Error ? error.stack : undefined
    })
    
    return NextResponse.json(
      { 
        error: errorMessage,
        debugId
      }, 
      { 
        status: 500,
        headers: { 'X-Debug-Id': debugId }
      }
    )
  }
}
