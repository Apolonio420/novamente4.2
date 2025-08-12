import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { imageUrl, styleName } = await request.json()

    console.log("[SERVER] === PROCESSING STYLE IMAGE ===")
    console.log("[SERVER] Style name:", styleName)
    console.log("[SERVER] Original URL:", imageUrl)

    // Validate input
    if (!imageUrl || typeof imageUrl !== "string") {
      console.error("[SERVER] Invalid image URL provided:", imageUrl)
      return NextResponse.json({ error: "Invalid image URL format - must be a string" }, { status: 400 })
    }

    // Validate HTTPS URL
    if (!imageUrl.startsWith("https://")) {
      console.error("[SERVER] URL must be HTTPS:", imageUrl)
      return NextResponse.json({ error: "Image URL must be a valid HTTPS URL" }, { status: 400 })
    }

    // Validate that it's a style image URL
    const isValidStyleUrl =
      imageUrl.includes("novamente-storefront.vercel.app/styles/") ||
      imageUrl.includes("/styles/") ||
      (imageUrl.startsWith("https://") && imageUrl.includes("styles"))

    if (!isValidStyleUrl) {
      console.error("[SERVER] Not a valid style image URL:", imageUrl)
      return NextResponse.json({ error: "URL must be a style image" }, { status: 400 })
    }

    // Check if Remove.bg API key is available
    if (!process.env.REMOVE_BG_KEY) {
      console.error("[SERVER] Remove.bg API key not configured")
      return NextResponse.json({ error: "Background removal service not configured" }, { status: 500 })
    }

    console.log("[SERVER] Calling Remove.bg API...")
    console.log("[SERVER] API Key available:", !!process.env.REMOVE_BG_KEY)

    // Call Remove.bg API with optimized settings for style images
    const removeResponse = await fetch("https://api.remove.bg/v1.0/removebg", {
      method: "POST",
      headers: {
        "X-Api-Key": process.env.REMOVE_BG_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        image_url: imageUrl,
        size: "auto",
        format: "png",
        type: "auto", // Let remove.bg auto-detect the best type
        crop: false, // Don't crop, keep original dimensions
        scale: "original", // Keep original scale
      }),
    })

    console.log("[SERVER] Remove.bg response status:", removeResponse.status)
    console.log("[SERVER] Remove.bg response ok:", removeResponse.ok)

    if (!removeResponse.ok) {
      const errorText = await removeResponse.text()
      console.error("[SERVER] Remove.bg API error:", removeResponse.status, errorText)

      // Return more specific error messages
      if (removeResponse.status === 402) {
        return NextResponse.json(
          {
            error: "Remove.bg API quota exceeded",
            fallbackUrl: imageUrl,
          },
          { status: 402 },
        )
      } else if (removeResponse.status === 400) {
        return NextResponse.json(
          {
            error: "Invalid image format or URL",
            fallbackUrl: imageUrl,
          },
          { status: 400 },
        )
      } else if (removeResponse.status === 403) {
        return NextResponse.json(
          {
            error: "Remove.bg API key invalid",
            fallbackUrl: imageUrl,
          },
          { status: 403 },
        )
      } else {
        return NextResponse.json(
          {
            error: `Remove.bg API error: ${removeResponse.statusText}`,
            fallbackUrl: imageUrl,
          },
          { status: removeResponse.status },
        )
      }
    }

    const imageBuffer = await removeResponse.arrayBuffer()
    console.log("[SERVER] Successfully processed style image")
    console.log("[SERVER] Processed image size:", imageBuffer.byteLength, "bytes")

    if (imageBuffer.byteLength === 0) {
      console.error("[SERVER] Received empty image buffer")
      return NextResponse.json(
        {
          error: "Received empty image from Remove.bg",
          fallbackUrl: imageUrl,
        },
        { status: 500 },
      )
    }

    // Convert to base64
    const base64Image = Buffer.from(imageBuffer).toString("base64")
    const processedImageUrl = `data:image/png;base64,${base64Image}`

    console.log("[SERVER] Base64 conversion successful")
    console.log("[SERVER] Base64 length:", base64Image.length)

    return NextResponse.json({
      success: true,
      processedImageUrl,
      originalUrl: imageUrl,
      styleName,
      processedAt: new Date().toISOString(),
      stats: {
        originalSize: "unknown",
        processedSize: imageBuffer.byteLength,
        base64Length: base64Image.length,
      },
    })
  } catch (error) {
    console.error("[SERVER] Error processing style image:", error)

    // Try to extract the original URL for fallback
    let fallbackUrl = null
    try {
      const body = await request.json()
      fallbackUrl = body.imageUrl
    } catch {
      // Ignore if we can't parse the body again
    }

    return NextResponse.json(
      {
        error: "Failed to process style image",
        details: error instanceof Error ? error.message : "Unknown error",
        fallbackUrl,
      },
      { status: 500 },
    )
  }
}
