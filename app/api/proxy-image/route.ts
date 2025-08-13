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
    const url = new URL(imageUrl)
    const seParam = url.searchParams.get("se") // Expiration time
    if (seParam) {
      const expirationTime = new Date(seParam)
      const now = new Date()
      if (now > expirationTime) {
        console.log("⏰ Image URL has expired")
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
      signal: AbortSignal.timeout(15000), // 15 segundos
    })

    if (response.ok) {
      const contentType = response.headers.get("content-type") || "image/png"
      const imageBuffer = await response.arrayBuffer()

      console.log("✅ Strategy 1 successful")
      return new NextResponse(imageBuffer, {
        headers: {
          "Content-Type": contentType,
          "Cache-Control": "public, max-age=31536000",
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
      signal: AbortSignal.timeout(15000),
    })

    if (response.ok) {
      const contentType = response.headers.get("content-type") || "image/png"
      const imageBuffer = await response.arrayBuffer()

      console.log("✅ Strategy 2 successful")
      return new NextResponse(imageBuffer, {
        headers: {
          "Content-Type": contentType,
          "Cache-Control": "public, max-age=31536000",
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

  // Estrategia 3: Headers completos
  try {
    console.log("📡 Strategy 3: Full headers")
    const response = await fetch(imageUrl, {
      method: "GET",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        Accept: "image/webp,image/apng,image/*,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept-Encoding": "gzip, deflate, br",
        Referer: "https://chat.openai.com/",
        Origin: "https://chat.openai.com",
      },
      signal: AbortSignal.timeout(15000),
    })

    if (response.ok) {
      const contentType = response.headers.get("content-type") || "image/png"
      const imageBuffer = await response.arrayBuffer()

      console.log("✅ Strategy 3 successful")
      return new NextResponse(imageBuffer, {
        headers: {
          "Content-Type": contentType,
          "Cache-Control": "public, max-age=31536000",
          "Access-Control-Allow-Origin": "*",
        },
      })
    }

    if (response.status === 403 || response.status === 404) {
      console.log("🔒 Image access denied or not found, likely expired")
      return generatePlaceholderImage()
    }
  } catch (error) {
    console.log("❌ Strategy 3 failed:", error)
  }

  // Estrategia 4: URL sin decodificar
  try {
    console.log("📡 Strategy 4: Raw URL")
    const rawUrl = decodeURIComponent(imageUrl)
    const response = await fetch(rawUrl, {
      method: "GET",
      signal: AbortSignal.timeout(15000),
    })

    if (response.ok) {
      const contentType = response.headers.get("content-type") || "image/png"
      const imageBuffer = await response.arrayBuffer()

      console.log("✅ Strategy 4 successful")
      return new NextResponse(imageBuffer, {
        headers: {
          "Content-Type": contentType,
          "Cache-Control": "public, max-age=31536000",
          "Access-Control-Allow-Origin": "*",
        },
      })
    }

    if (response.status === 403 || response.status === 404) {
      console.log("🔒 Image access denied or not found, likely expired")
      return generatePlaceholderImage()
    }
  } catch (error) {
    console.log("❌ Strategy 4 failed:", error)
  }

  console.log("❌ All strategies failed, returning placeholder")
  return generatePlaceholderImage()
}

function generatePlaceholderImage() {
  // SVG placeholder simple
  const svg = `
    <svg width="400" height="400" xmlns="http://www.w3.org/2000/svg">
      <rect width="400" height="400" fill="#f3f4f6"/>
      <rect x="50" y="50" width="300" height="300" fill="#e5e7eb" stroke="#d1d5db" stroke-width="2" rx="8"/>
      <circle cx="150" cy="150" r="30" fill="#9ca3af"/>
      <rect x="120" y="220" width="160" height="8" fill="#9ca3af" rx="4"/>
      <rect x="140" y="240" width="120" height="6" fill="#d1d5db" rx="3"/>
      <text x="200" y="320" text-anchor="middle" fill="#6b7280" font-family="Arial, sans-serif" font-size="14">Imagen no disponible</text>
    </svg>
  `

  return new NextResponse(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=3600", // Cache por 1 hora
      "Access-Control-Allow-Origin": "*",
    },
  })
}
