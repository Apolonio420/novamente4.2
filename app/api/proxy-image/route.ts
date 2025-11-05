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
    console.error('❌ Could not normalize key:', key.substring(0, 50))
    return NextResponse.json({ error: 'Invalid key' }, { status: 400 })
  }

  // Validación básica de seguridad
  if (normalizedKey.includes("..") || normalizedKey.startsWith("/")) {
    return NextResponse.json({ error: 'Invalid key format' }, { status: 400 })
  }

  try {
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 Proxy checking R2:', normalizedKey.substring(0, 100))
    }

    // Verificar si el objeto existe usando HeadObject
    const headCommand = new HeadObjectCommand({
      Bucket: BUCKET_NAME,
      Key: normalizedKey,
    })

    try {
      await r2Client.send(headCommand)
    } catch (headError: any) {
      if (headError.name === 'NotFound' || headError.$metadata?.httpStatusCode === 404) {
        if (process.env.NODE_ENV === 'development') {
          console.log('❌ Object not found in R2:', normalizedKey.substring(0, 100))
        }
        return new NextResponse('Not found', { status: 404 })
      }
      throw headError
    }

    // Si existe, obtener el objeto
    const getCommand = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: normalizedKey,
    })

    const response = await r2Client.send(getCommand)

    if (!response.Body) {
      return new NextResponse('Not found', { status: 404 })
    }

    // Obtener content type
    const contentType = response.ContentType || 'image/png'

    // Convertir el stream a buffer y luego a respuesta
    const chunks: Uint8Array[] = []
    for await (const chunk of response.Body as any) {
      chunks.push(chunk)
    }
    const buffer = Buffer.concat(chunks)

    // Headers
    const headers = new Headers()
    headers.set('Content-Type', contentType)
    headers.set('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400')
    headers.set('Access-Control-Allow-Origin', '*')

    if (process.env.NODE_ENV === 'development') {
      console.log('✅ Proxy serving from R2:', normalizedKey.substring(0, 100))
    }

    return new NextResponse(buffer, {
      status: 200,
      headers,
    })
  } catch (error: any) {
    // Log error en desarrollo
    if (process.env.NODE_ENV === 'development') {
      console.error('❌ Proxy error:', error?.message || error, normalizedKey.substring(0, 100))
    }
    return new NextResponse('Not found', { status: 404 })
  }
}
