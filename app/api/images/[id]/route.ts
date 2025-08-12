import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    console.log("🖼️ Proxying image request for ID:", id)

    // Try to get the original URL from our database first
    let imageUrl = null

    // If we have the URL stored, use it
    if (id.startsWith("temp_")) {
      try {
        const tempResponse = await fetch(`${request.nextUrl.origin}/api/temp-image?id=${id}`)
        if (tempResponse.ok) {
          const tempData = await tempResponse.json()
          imageUrl = tempData.data?.imageUrl
        }
      } catch (error) {
        console.log("Could not fetch from temp storage:", error)
      }
    }

    // If no URL found, try to construct it (fallback)
    if (!imageUrl) {
      // This is a fallback - in practice, we should have the URL stored
      console.log("No stored URL found for ID:", id)
      return NextResponse.json({ error: "Image not found" }, { status: 404 })
    }

    console.log("🔄 Fetching image from:", imageUrl.substring(0, 100) + "...")

    // Fetch the image
    const imageResponse = await fetch(imageUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; NovaMente/1.0)",
      },
    })

    if (!imageResponse.ok) {
      console.error("❌ Failed to fetch image:", imageResponse.status, imageResponse.statusText)
      return NextResponse.json({ error: "Failed to fetch image" }, { status: imageResponse.status })
    }

    const imageBuffer = await imageResponse.arrayBuffer()
    const contentType = imageResponse.headers.get("content-type") || "image/png"

    console.log("✅ Image proxied successfully, size:", imageBuffer.byteLength, "bytes")

    return new NextResponse(imageBuffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
        "Access-Control-Allow-Origin": "*",
      },
    })
  } catch (error) {
    console.error("❌ Error proxying image:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
