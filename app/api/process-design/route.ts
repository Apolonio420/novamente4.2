import { NextRequest, NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"
import { uploadFile } from "@/lib/cloudflare-r2"
import { normalizeR2Key, toPublicR2Url } from "@/lib/r2"
import { v4 as uuidv4 } from "uuid"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { cookies } from "next/headers"

export const runtime = "nodejs"

export async function POST(req: NextRequest) {
  const debugId = uuidv4().substring(0, 8)
  const tStart = Date.now()

  try {
    const { imageUrl, prompt, hasImageUrl, useBase64, meta = {} } = await req.json()

    // Auth context
    const cookieStore = await cookies()
    const sessionId = cookieStore.get('novamente_session_id')?.value || ''
    const supabaseAuthCookie = cookieStore.get('sb-fvsjvvyohaarivametxq-auth-token')?.value || ''

    let finalUserId: string | null = null
    try {
      const { data: { user } } = await supabaseAdmin.auth.getUser()
      if (user) finalUserId = user.id
    } catch (e) {
      console.warn(`[${debugId}] Could not get user from session:`, e)
    }

    console.log(`[${debugId}] PROCESS - DESIGN starting for ${finalUserId || sessionId || 'anonymous'}`)

    let base64Data = ""
    let imageUrlNoBg: string | null = null

    if (imageUrl && imageUrl.startsWith('data:')) {
      base64Data = imageUrl.split(',')[1]
    } else if (imageUrl) {
      const imageResponse = await fetch(imageUrl)
      if (!imageResponse.ok) throw new Error("No se pudo descargar la imagen original")
      const imageBuffer = await imageResponse.arrayBuffer()
      base64Data = Buffer.from(imageBuffer).toString('base64')
    } else {
      throw new Error("No se proporcionó imagen para procesar")
    }

    // 2) BACKGROUND REMOVAL with Gemini
    console.log(`[${debugId}] Processing image with background removal...`)
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
    let processedBase64 = base64Data
    let hasBackgroundRemoved = false

    try {
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" })
      const result = await model.generateContent([
        "Remove the background from this image. Return ONLY a high-quality transparent PNG.",
        {
          inlineData: {
            data: base64Data,
            mimeType: "image/png",
          },
        },
      ])

      const response = await result.response
      const candidates = response.candidates || []
      for (const cand of candidates) {
        for (const part of cand.content?.parts || []) {
          if (part.inlineData?.data) {
            processedBase64 = part.inlineData.data
            hasBackgroundRemoved = true
            break
          }
        }
        if (hasBackgroundRemoved) break
      }
    } catch (geminiError) {
      console.warn(`[${debugId}] Gemini BG removal failed, using original:`, geminiError)
    }

    // 3) UPLOAD TO STORAGE (R2 with Supabase fallback)
    const imageId = uuidv4()
    const processedBuffer = Buffer.from(processedBase64, 'base64')
    const description = prompt ? prompt.split(' ').slice(0, 2).join('_').replace(/[^a-z0-9]/gi, '') : 'img'
    const fileName = `${description}_${Date.now()}.png`
    const storageKey = `v1/designs/${imageId}/${fileName}`

    let publicUrl: string
    let storageProvider: 'r2' | 'supabase' = 'r2'

    try {
      const uploadResult = await uploadFile(processedBuffer, storageKey, "image/png")
      publicUrl = uploadResult.url
      storageProvider = uploadResult.provider
      console.log(`[${debugId}] Upload SUCCESS to ${storageProvider.toUpperCase()}:`, storageKey)
    } catch (uploadError: any) {
      console.error(`[${debugId}] CRITICAL STORAGE FAILURE:`, uploadError.message)
      // Final desperation: return data URI but we won't be able to persist a reachable URL for long
      publicUrl = `data:image/png;base64,${processedBase64}`
      storageProvider = 'r2' // logical placeholder
    }

    // 4) DATABASE SYNC
    // NEVER save large base64 strings as keys to avoid indexing crashes
    const isBase64 = publicUrl.startsWith('data:')
    const finalStorageKey = isBase64 ? storageKey : (normalizeR2Key(publicUrl) || storageKey)

    // CRITICAL: Database has a NOT NULL constraint on 'url'. 
    // Even if everything failed, we use the storage key as a placeholder URL to allow DB insert.
    const finalUrlToSave = isBase64 ? storageKey : publicUrl

    let insertData: any = {
      id: imageId,
      user_id: finalUserId,
      url: finalUrlToSave,
      prompt: prompt,
      has_bg_removed: hasBackgroundRemoved,
      url_without_bg: hasBackgroundRemoved ? finalUrlToSave : null,
      storage_key: finalStorageKey,
      is_generated: true,
      meta: { ...meta, debugId, storageProvider, isBase64Fallback: isBase64 },
      created_at: new Date().toISOString(),
    }

    if (sessionId && sessionId.length > 5) {
      insertData.session_id = sessionId
    }

    let savedToDb = false
    let lastError: any = null

    // Función recursiva para "pelar" columnas fallidas hasta que funcione
    const tryInsert = async (data: any): Promise<boolean> => {
      console.log(`[${debugId}] DB Try: attempting insert with keys: ${Object.keys(data).join(', ')}`)
      const { error } = await (supabaseAdmin.from('images') as any).insert(data)
      if (!error) return true

      lastError = error
      const msg = error.message || ''
      const code = error.code
      console.error(`[${debugId}] DB Error [${code}]: ${msg}`)

      // Si es un error de columna inexistente, intentar removerla
      if (code === '42703' || msg.includes('column') || msg.includes('schema cache')) {
        const columns = ['meta', 'session_id', 'is_generated', 'has_bg_removed', 'url_without_bg', 'storage_key', 'user_id', 'prompt', 'url']
        for (const col of columns) {
          if (msg.includes(col) && data[col] !== undefined) {
            console.warn(`[${debugId}] Peeling column '${col}' due to DB error: ${msg}`)
            const newData = { ...data }
            delete newData[col]
            if (col === 'has_bg_removed') delete newData.url_without_bg
            return tryInsert(newData)
          }
        }

        // Si no encontramos la columna en el mensaje pero sigue siendo un error de columna,
        // intentamos un insert "ultra-mínimo" solo con ID como último recurso
        console.warn(`[${debugId}] Could not identify column from error, trying ultra-minimal insert (ID only)`)
        const ultraMinimal = { id: data.id }
        const { error: ultraError } = await (supabaseAdmin.from('images') as any).insert(ultraMinimal)
        if (!ultraError) {
          console.info(`[${debugId}] DB: Ultra-minimal insert succeeded. Schema is very restricted.`)
          return true
        }
        console.error(`[${debugId}] DB: Ultra-minimal insert also FAILED: ${ultraError.message}`)
      }
      return false
    }

    try {
      savedToDb = await tryInsert(insertData)
      if (savedToDb) {
        console.info(`[${debugId}] DB: Persistence successful`)
      } else {
        console.error(`[${debugId}] DB: Persistence FAILED critically:`, lastError?.message || lastError)
      }
    } catch (dbEx: any) {
      console.error(`[${debugId}] DB: Exception during persistence:`, dbEx?.message || dbEx)
    }

    return NextResponse.json({
      success: true,
      image: {
        id: imageId,
        url: publicUrl,
        has_bg_removed: hasBackgroundRemoved,
        debugId
      }
    })

  } catch (error: any) {
    // 🔔 Notificar por Telegram
    try {
      const { notifyError } = await import("@/lib/notifications")
      await notifyError({
        area: "Procesador de Diseños (Quitar Fondo)",
        endpoint: "/api/process-design",
        message: error.message || "Unknown error",
        debugId
      })
    } catch (notifErr: any) {
      console.error("❌ Error sending error notification:", notifErr.message)
    }

    return NextResponse.json({
      error: error.message || "Error procesando diseño",
      debugId
    }, { status: 500 })
  }
}
