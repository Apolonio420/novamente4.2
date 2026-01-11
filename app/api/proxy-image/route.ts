import { NextRequest, NextResponse } from "next/server"
import { r2Client, BUCKET_NAME } from "@/lib/cloudflare-r2"
import { GetObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3"
import { normalizeR2Key } from "@/lib/r2"

export async function GET(req: NextRequest) {
  const key = req.nextUrl.searchParams.get('key')

  if (!key) {
    return NextResponse.json({ error: 'missing key' }, { status: 400 })
  }

  // Normalizar la clave
  const normalizedKey = normalizeR2Key(key)

  if (!normalizedKey) {
    console.error('❌ Proxy-Image: Could not normalize key:', key.substring(0, 50))
    return NextResponse.json({ error: 'Invalid key' }, { status: 400 })
  }

  try {
    // 1. INTENTAR DESCARGAR DESDE R2
    let response
    let buffer: Buffer | null = null
    let contentType = 'image/png'

    try {
      const getCommand = new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: normalizedKey,
      })
      response = await r2Client.send(getCommand)

      if (response.Body) {
        contentType = response.ContentType || 'image/png'
        if (typeof (response.Body as any).transformToByteArray === 'function') {
          const uint8Array = await (response.Body as any).transformToByteArray()
          buffer = Buffer.from(uint8Array)
        } else {
          const chunks: Buffer[] = []
          for await (const chunk of (response.Body as any)) {
            chunks.push(Buffer.from(chunk))
          }
          buffer = Buffer.concat(chunks)
        }
      }
    } catch (r2Error: any) {
      const isSSL = r2Error.message?.includes('EPROTO') || r2Error.code === 'EPROTO'
      const is404 = r2Error.name === 'NoSuchKey' || r2Error.name === 'NotFound' || r2Error.$metadata?.httpStatusCode === 404

      if (!is404) {
        console.warn(`⚠️ Proxy-Image: R2 failed (${isSSL ? 'SSL Error' : r2Error.message}). Trying Supabase fallback...`)
      }
    }

    // 2. FALLBACK A SUPABASE SI R2 FALLÓ
    if (!buffer) {
      try {
        const { supabaseAdmin } = await import('@/lib/supabase-admin')
        const bucket = 'images'

        const { data, error } = await supabaseAdmin.storage
          .from(bucket)
          .download(normalizedKey)

        if (error || !data) {
          // Si no está en 'images', probar en 'generated-images' por si acaso hay restos
          const { data: secondTry } = await supabaseAdmin.storage.from('generated-images').download(normalizedKey)
          if (secondTry) {
            const arrayBuffer = await secondTry.arrayBuffer()
            buffer = Buffer.from(arrayBuffer)
            console.log(`✅ Proxy-Image: Image found in generated-images fallback!`)
          } else {
            return new NextResponse('Not found', { status: 404 })
          }
        } else {
          const arrayBuffer = await data.arrayBuffer()
          buffer = Buffer.from(arrayBuffer)
          console.log(`✅ Proxy-Image: Image found in Supabase fallback!`)
        }
      } catch (sbError: any) {
        console.error(`❌ Proxy-Image: Supabase fallback failed:`, sbError.message)
        return new NextResponse('Error retrieving image', { status: 500 })
      }
    }

    // Headers
    const headers = new Headers()
    headers.set('Content-Type', contentType)
    headers.set('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400')
    headers.set('Access-Control-Allow-Origin', '*')

    return new NextResponse(buffer, {
      status: 200,
      headers,
    })
  } catch (error: any) {
    console.error('❌ Proxy-Image: Fatal error:', error?.message || error)
    return new NextResponse('Not found', { status: 404 })
  }
}
