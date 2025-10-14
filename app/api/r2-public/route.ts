import { NextRequest, NextResponse } from "next/server"

// Cache simple en memoria para URLs válidas
const urlCache = new Map<string, { url: string; timestamp: number }>()
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutos

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const encodedKey = searchParams.get("key")
    if (!encodedKey) {
      return NextResponse.json({ error: "key is required" }, { status: 400 })
    }

    // Decodificar la key (puede estar doblemente codificada)
    let key = decodeURIComponent(encodedKey)
    
    // Si la key contiene parámetros de URL (como X-Amz-*), extraer solo la parte del path
    if (key.includes('?')) {
      const urlParts = key.split('?')
      key = urlParts[0]
    }

    console.log("R2-PUBLIC: Decoded key:", key)

    // Verificar cache primero
    const cached = urlCache.get(key)
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return NextResponse.redirect(cached.url, 307)
    }

    // key esperado: "<category>/<uuid>/<filename>"
    const { getPublicR2Url, getSignedR2Url } = await import("@/lib/cloudflare-r2")
    
    // Siempre usar URL firmada para garantizar acceso
    // Las URLs públicas de R2 no están funcionando correctamente
    const workingUrl = await getSignedR2Url(key, 86400) // 24 horas
    urlCache.set(key, { url: workingUrl, timestamp: Date.now() })
    
    return NextResponse.redirect(workingUrl, 307)
  } catch (error) {
    console.error("/api/r2-public error:", error)
    return NextResponse.json({ error: "failed to resolve R2 URL" }, { status: 500 })
  }
}


