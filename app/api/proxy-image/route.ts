import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const imageUrl = searchParams.get("url")

  if (!imageUrl) {
    return NextResponse.json({ error: "URL parameter is required" }, { status: 400 })
  }

  // Solo permitir URLs de DALL-E (Azure Blob Storage)
  if (!imageUrl.includes("oaidalleapiprodscus.blob.core.windows.net")) {
    return NextResponse.json({ error: "Invalid image source" }, { status: 403 })
  }

  console.log("🔄 Proxying image:", imageUrl)

  try {
    // Verificar si la URL ha expirado antes de intentar cargarla
    const urlObj = new URL(imageUrl)
    const seParam = urlObj.searchParams.get("se") // Azure Blob Storage expiry parameter

    if (seParam) {
      const expiryDate = new Date(seParam)
      const now = new Date()

      if (expiryDate <= now) {
        console.log("❌ Image URL has expired")
        return NextResponse.json({ error: "Image URL has expired" }, { status: 410 })
      }
    }

    // Estrategia 1: Fetch básico con timeout más corto
    console.log("📡 Strategy 1: Basic fetch")
    const response = await fetch(imageUrl, {
      method: "GET",
      signal: AbortSignal.timeout(10000), // 10 segundos
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; NovaMente/1.0)",
      },
    })

    if (response.ok) {
      const contentType = response.headers.get("content-type") || "image/png"
      const imageBuffer = await response.arrayBuffer()

      console.log("✅ Strategy 1 successful")
      return new NextResponse(imageBuffer, {
        headers: {
          "Content-Type": contentType,
          "Cache-Control": "public, max-age=3600", // Cache por 1 hora
          "Access-Control-Allow-Origin": "*",
        },
      })
    }

    console.log("❌ Strategy 1 failed with status:", response.status)

    // Si el primer intento falla, intentar con headers diferentes
    console.log("📡 Strategy 2: With different headers")
    const response2 = await fetch(imageUrl, {
      method: "GET",
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        Accept: "image/webp,image/apng,image/*,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        Referer: "https://chat.openai.com/",
      },
      signal: AbortSignal.timeout(10000),
    })

    if (response2.ok) {
      const contentType = response2.headers.get("content-type") || "image/png"
      const imageBuffer = await response2.arrayBuffer()

      console.log("✅ Strategy 2 successful")
      return new NextResponse(imageBuffer, {
        headers: {
          "Content-Type": contentType,
          "Cache-Control": "public, max-age=3600",
          "Access-Control-Allow-Origin": "*",
        },
      })
    }

    console.log("❌ Strategy 2 failed with status:", response2.status)

    // Si ambos fallan, devolver error específico
    return NextResponse.json(
      {
        error: "Failed to fetch image from source",
        details: `HTTP ${response.status}: ${response.statusText}`,
        expired: seParam ? new Date(seParam) <= new Date() : false,
      },
      { status: 502 },
    )
  } catch (error) {
    console.error("❌ Proxy error:", error)

    // Manejar diferentes tipos de errores
    if (error instanceof Error) {
      if (error.name === "AbortError") {
        return NextResponse.json({ error: "Request timeout" }, { status: 408 })
      }
      if (error.message.includes("fetch")) {
        return NextResponse.json({ error: "Network error" }, { status: 502 })
      }
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
