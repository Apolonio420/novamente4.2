import { NextRequest, NextResponse } from "next/server"
import { r2Client, BUCKET_NAME } from "@/lib/cloudflare-r2"
import { GetObjectCommand } from "@aws-sdk/client-s3"
import { normalizeR2Key } from "@/lib/r2"

// Endpoint proxy que sirve imágenes de R2 directamente
// Ej: /api/r2-public?key=images/<uuid>/original/file.png → Stream de imagen

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const rawKey = searchParams.get("key") || ""

    if (!rawKey) {
      return NextResponse.json({ error: "key requerido" }, { status: 400 })
    }

    // Normalizar la clave usando la función de utilidad (maneja prefijos, URLs, etc.)
    const normalizedKey = normalizeR2Key(rawKey)

    if (!normalizedKey) {
      console.error("R2-PUBLIC: Could not normalize key from:", rawKey.substring(0, 100))
      return NextResponse.json({ error: "key inválido" }, { status: 400 })
    }

    // Validación básica de seguridad
    if (normalizedKey.includes("..") || normalizedKey.startsWith("/")) {
      return NextResponse.json({ error: "key inválido" }, { status: 400 })
    }

    console.log("R2-PUBLIC: Fetching image", {
      rawKey: rawKey.substring(0, 100),
      normalizedKey: normalizedKey.substring(0, 100),
      bucket: BUCKET_NAME
    })

    // 1. INTENTAR DESCARGAR DESDE R2
    let response
    let r2Buffer: Buffer | null = null

    try {
      const command = new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: normalizedKey,
      })
      response = await r2Client.send(command)

      if (response.Body) {
        if (typeof (response.Body as any).transformToByteArray === 'function') {
          const uint8Array = await (response.Body as any).transformToByteArray()
          r2Buffer = Buffer.from(uint8Array)
        } else {
          const chunks: Buffer[] = []
          for await (const chunk of (response.Body as any)) {
            chunks.push(Buffer.from(chunk))
          }
          r2Buffer = Buffer.concat(chunks)
        }
      }
    } catch (r2Error: any) {
      const isSSL = r2Error.message?.includes('EPROTO') || r2Error.code === 'EPROTO'
      const is404 = r2Error.name === 'NoSuchKey' || r2Error.$metadata?.httpStatusCode === 404

      if (!is404) {
        console.warn(`⚠️ R2-PUBLIC: R2 failed (${isSSL ? 'SSL Error' : r2Error.message}). Trying Supabase fallback...`)
      }
    }

    // 2. FALLBACK A SUPABASE SI R2 FALLÓ O NO TIENE BODY
    if (!r2Buffer) {
      try {
        const { supabaseAdmin } = await import('@/lib/supabase-admin')
        const bucket = 'generated-images'

        console.log(`🔍 R2-PUBLIC: Trying Supabase fallback for ${normalizedKey}...`)
        const { data, error } = await supabaseAdmin.storage
          .from(bucket)
          .download(normalizedKey)

        if (error || !data) {
          console.error(`❌ R2-PUBLIC: Failed to find image in both R2 and Supabase:`, normalizedKey)
          return NextResponse.json({ error: "Imagen no encontrada en ningún almacenamiento" }, { status: 404 })
        }

        const arrayBuffer = await data.arrayBuffer()
        r2Buffer = Buffer.from(arrayBuffer)
        console.log(`✅ R2-PUBLIC: Image found in Supabase fallback!`)
      } catch (sbError: any) {
        console.error(`❌ R2-PUBLIC: Supabase fallback also failed:`, sbError.message)
        return NextResponse.json({ error: "Error recuperando imagen" }, { status: 500 })
      }
    }

    const contentType = response?.ContentType || 'image/png'
    return new Response(new Uint8Array(r2Buffer), {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000',
      },
    })
  } catch (error: any) {
    console.error("R2-PUBLIC: Fatal error:", error.message)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}


