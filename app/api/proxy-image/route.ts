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

  console.log("🔄 Proxying image:", imageUrl.substring(0, 100) + "...")

  try {
    const url = new URL(imageUrl)
    const seParam = url.searchParams.get("se") // Expiration time
    if (seParam) {
      const expirationTime = new Date(seParam)
      const now = new Date()
      // Agregar buffer de 5 minutos para evitar errores de timing
      const bufferTime = new Date(now.getTime() + 5 * 60 * 1000)

      if (bufferTime > expirationTime) {
        console.log("⏰ Image URL has expired or will expire soon")
        return generatePlaceholderImage()
      }
    }
  } catch (error) {
    console.log("⚠️ Could not parse URL for expiration check:", error)
  }

  // Estrategia 1: Fetch básico
  try {
    console.log("📡 Strategy 1: Basic fetch")
    const response = await fetch(imageUrl, {
      method: "GET",
      signal: AbortSignal.timeout(10000), // Reducido a 10 segundos
    })

    if (response.ok) {
      const contentType = response.headers.get("content-type") || "image/png"
      const imageBuffer = await response.arrayBuffer()

      console.log("✅ Strategy 1 successful")
      return new NextResponse(imageBuffer, {
        headers: {
          "Content-Type": contentType,
          "Cache-Control": "public, max-age=3600", // Reducido cache a 1 hora
          "Access-Control-Allow-Origin": "*",
        },
      })
    }

    if (response.status === 403 || response.status === 404) {
      console.log("🔒 Image access denied or not found, likely expired")
      return generatePlaceholderImage()
    }
  } catch (error) {
    console.log("❌ Strategy 1 failed:", error)
  }

  // Estrategia 2: Con User-Agent básico
  try {
    console.log("📡 Strategy 2: With User-Agent")
    const response = await fetch(imageUrl, {
      method: "GET",
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; ImageProxy/1.0)",
      },
      signal: AbortSignal.timeout(10000),
    })

    if (response.ok) {
      const contentType = response.headers.get("content-type") || "image/png"
      const imageBuffer = await response.arrayBuffer()

      console.log("✅ Strategy 2 successful")
      return new NextResponse(imageBuffer, {
        headers: {
          "Content-Type": contentType,
          "Cache-Control": "public, max-age=3600",
          "Access-Control-Allow-Origin": "*",
        },
      })
    }

    if (response.status === 403 || response.status === 404) {
      console.log("🔒 Image access denied or not found, likely expired")
      return generatePlaceholderImage()
    }
  } catch (error) {
    console.log("❌ Strategy 2 failed:", error)
  }

  console.log("❌ All strategies failed, returning placeholder")
  return generatePlaceholderImage()
}

function generatePlaceholderImage() {
  const svg = `
    <svg width="400" height="400" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#f8fafc;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#e2e8f0;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="400" height="400" fill="url(#bg)"/>
      <rect x="80" y="80" width="240" height="240" fill="#ffffff" stroke="#cbd5e1" stroke-width="2" rx="12" opacity="0.8"/>
      <circle cx="200" cy="160" r="24" fill="#94a3b8"/>
      <rect x="160" y="200" width="80" height="6" fill="#94a3b8" rx="3"/>
      <rect x="170" y="215" width="60" height="4" fill="#cbd5e1" rx="2"/>
      <text x="200" y="280" text-anchor="middle" fill="#64748b" font-family="system-ui, -apple-system, sans-serif" font-size="12" font-weight="500">Imagen no disponible</text>
      <text x="200" y="300" text-anchor="middle" fill="#94a3b8" font-family="system-ui, -apple-system, sans-serif" font-size="10">La imagen ha expirado</text>
    </svg>
  `

  return new NextResponse(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=3600",
      "Access-Control-Allow-Origin": "*",
    },
  })
}
