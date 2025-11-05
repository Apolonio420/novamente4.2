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

    // Descargar imagen desde R2 y servirla directamente
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: normalizedKey,
    })

    let response
    try {
      response = await r2Client.send(command)
    } catch (r2Error: any) {
      console.error("R2-PUBLIC: Error from R2:", {
        message: r2Error.message,
        code: r2Error.Code || r2Error.code,
        name: r2Error.name,
        key: normalizedKey.substring(0, 100),
        bucket: BUCKET_NAME
      })
      throw r2Error
    }
    
    if (!response.Body) {
      console.error("R2-PUBLIC: No body in response for key:", normalizedKey)
      return NextResponse.json({ error: "Imagen no encontrada" }, { status: 404 })
    }

    // Leer el cuerpo como buffer (el SDK de AWS S3 devuelve un stream que se puede convertir)
    let buffer: Buffer
    try {
      // Método preferido: transformToByteArray (más confiable)
      if (typeof (response.Body as any).transformToByteArray === 'function') {
        const uint8Array = await (response.Body as any).transformToByteArray()
        buffer = Buffer.from(uint8Array)
      } else {
        // Fallback: leer como stream
        const chunks: Buffer[] = []
        const stream = response.Body as any
        
        // Intentar diferentes métodos según el tipo de stream
        if (stream instanceof ReadableStream) {
          const reader = stream.getReader()
          while (true) {
            const { done, value } = await reader.read()
            if (done) break
            if (value) chunks.push(Buffer.from(value))
          }
        } else {
          // Intentar iterar directamente
          for await (const chunk of stream) {
            chunks.push(Buffer.from(chunk))
          }
        }
        buffer = Buffer.concat(chunks)
      }
    } catch (streamError: any) {
      console.error("R2-PUBLIC: Error reading stream:", streamError)
      return NextResponse.json({ 
        error: `Error leyendo imagen: ${streamError.message}` 
      }, { status: 500 })
    }

    const contentType = response.ContentType || 'image/png'
    console.log("R2-PUBLIC: Successfully fetched image, size:", buffer.length, "bytes")

    // Convertir Buffer a Uint8Array para Response
    return new Response(new Uint8Array(buffer), {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000', // 1 año
      },
    })

  } catch (error: any) {
    console.error("R2-PUBLIC: Error fetching image:", error)
    console.error("R2-PUBLIC: Error details:", {
      message: error.message,
      code: error.Code || error.code,
      name: error.name
    })
    return NextResponse.json({ 
      error: error.message || "Error obteniendo imagen" 
    }, { status: 500 })
  }
}


