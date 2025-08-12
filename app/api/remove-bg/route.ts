import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { imageUrl } = await request.json()

    if (!imageUrl) {
      return NextResponse.json({ error: "Image URL is required" }, { status: 400 })
    }

    console.log("🔍 Processing image URL:", imageUrl)

    // Validate that it's a proper HTTP/HTTPS URL or base64
    let validUrl: URL | null = null
    let isBase64 = false

    if (imageUrl.startsWith("data:image/")) {
      console.log("📷 Base64 image detected")
      isBase64 = true
    } else {
      try {
        validUrl = new URL(imageUrl)
        if (!validUrl.protocol.startsWith("http")) {
          throw new Error("Invalid protocol")
        }
        console.log("🌐 Valid URL detected:", validUrl.href)
      } catch (urlError) {
        console.error("❌ Invalid URL format:", imageUrl)
        return NextResponse.json(
          {
            error: "Invalid image URL format - must be a valid HTTPS URL or base64",
            processedImageUrl: imageUrl,
            skipped: true,
          },
          { status: 400 },
        )
      }
    }

    // Check if Remove.bg API key is available
    if (!process.env.REMOVE_BG_KEY) {
      console.error("❌ Remove.bg API key not configured")
      return NextResponse.json(
        {
          processedImageUrl: imageUrl,
          skipped: true,
          error: "Background removal service not configured",
        },
        { status: 200 },
      )
    }

    console.log("🎯 Calling Remove.bg API...")

    // For URL-based images, use form-data instead of JSON
    let response: Response

    if (isBase64) {
      // For base64 images, use JSON format
      response = await fetch("https://api.remove.bg/v1.0/removebg", {
        method: "POST",
        headers: {
          "X-Api-Key": process.env.REMOVE_BG_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          image_file_b64: imageUrl.split(",")[1], // Remove data:image/png;base64, prefix
          size: "auto",
          format: "png",
        }),
      })
    } else {
      // For URL images, use form-data
      const formData = new FormData()
      formData.append("image_url", validUrl!.href)
      formData.append("size", "auto")
      formData.append("format", "png")

      response = await fetch("https://api.remove.bg/v1.0/removebg", {
        method: "POST",
        headers: {
          "X-Api-Key": process.env.REMOVE_BG_KEY,
        },
        body: formData,
      })
    }

    console.log("📡 Remove.bg API response status:", response.status)
    console.log("📡 Remove.bg API response headers:", Object.fromEntries(response.headers.entries()))

    if (!response.ok) {
      const errorText = await response.text()
      console.error("❌ Remove.bg API error:", response.status, errorText)

      // Try to parse as JSON first, if it fails, it's probably HTML
      let errorDetails = "Unknown error"
      try {
        const errorJson = JSON.parse(errorText)
        if (errorJson.errors && errorJson.errors.length > 0) {
          errorDetails = errorJson.errors[0].title || errorDetails
        }
      } catch (parseError) {
        // If it's HTML (like <!DOCTYPE), extract meaningful info
        if (errorText.includes("<!DOCTYPE")) {
          errorDetails = "API returned HTML error page - possibly invalid API key or service unavailable"
        } else {
          errorDetails = errorText.substring(0, 200)
        }
      }

      // Return original image if remove.bg fails
      console.log("🔄 Using original image as fallback")
      return NextResponse.json({
        processedImageUrl: imageUrl,
        skipped: true,
        error: `Remove.bg API error (${response.status}): ${errorDetails}`,
        fallback: true,
      })
    }

    // Check if response is actually an image
    const contentType = response.headers.get("content-type")
    console.log("📄 Response content-type:", contentType)

    if (!contentType || !contentType.includes("image")) {
      const responseText = await response.text()
      console.error("❌ Expected image but got:", contentType, responseText.substring(0, 200))

      return NextResponse.json({
        processedImageUrl: imageUrl,
        skipped: true,
        error: "Remove.bg API returned non-image response",
        fallback: true,
      })
    }

    console.log("✅ Background removed successfully")
    const data = await response.arrayBuffer()

    // Convert the image data to base64
    const base64Image = Buffer.from(data).toString("base64")
    const processedImageUrl = `data:image/png;base64,${base64Image}`

    return NextResponse.json({
      processedImageUrl,
      success: true,
      message: "Background removed successfully",
    })
  } catch (error) {
    console.error("💥 Error in remove-bg API:", error)

    // Extract original imageUrl from request for fallback
    let fallbackImageUrl = "/placeholder.svg"
    try {
      const requestBody = await request.json()
      fallbackImageUrl = requestBody.imageUrl || fallbackImageUrl
    } catch (parseError) {
      console.error("Could not parse request for fallback:", parseError)
    }

    return NextResponse.json(
      {
        processedImageUrl: fallbackImageUrl,
        skipped: true,
        error: error instanceof Error ? error.message : "Failed to remove background",
        fallback: true,
      },
      { status: 200 }, // Return 200 to avoid breaking the flow
    )
  }
}
