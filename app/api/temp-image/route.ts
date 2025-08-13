import { type NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"

export async function POST(request: NextRequest) {
  try {
    const { imageUrl, id } = await request.json()

    console.log("💾 Saving temporary image:", { id, imageUrl: imageUrl?.substring(0, 50) + "..." })

    if (!imageUrl || !id) {
      return NextResponse.json({ error: "Missing imageUrl or id" }, { status: 400 })
    }

    // Try to download and upload to Supabase Storage
    try {
      console.log("📥 Downloading image from OpenAI...")
      const imageResponse = await fetch(imageUrl)

      if (!imageResponse.ok) {
        throw new Error(`Failed to fetch image: ${imageResponse.status}`)
      }

      const imageBuffer = await imageResponse.arrayBuffer()
      const fileName = `temp-images/${id}.png`

      console.log("📤 Uploading to Supabase Storage...")
      const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
        .from("images")
        .upload(fileName, imageBuffer, {
          contentType: "image/png",
          upsert: true,
        })

      if (uploadError) {
        throw uploadError
      }

      // Get public URL
      const { data: urlData } = supabaseAdmin.storage.from("images").getPublicUrl(fileName)

      const publicUrl = urlData.publicUrl

      console.log("✅ Image uploaded successfully:", publicUrl)

      // Save to database
      const { error: dbError } = await supabaseAdmin.from("temp_images").upsert({
        id,
        image_url: publicUrl,
        original_url: imageUrl,
        created_at: new Date().toISOString(),
      })

      if (dbError) {
        console.warn("⚠️ Database save failed, but storage upload succeeded:", dbError)
      }

      return NextResponse.json({
        success: true,
        id,
        imageUrl: publicUrl,
        message: "Image saved successfully",
      })
    } catch (storageError) {
      console.warn("⚠️ Storage upload failed, falling back to original URL:", storageError)

      // Fallback: save original URL to database
      const { error: dbError } = await supabaseAdmin.from("temp_images").upsert({
        id,
        image_url: imageUrl,
        original_url: imageUrl,
        created_at: new Date().toISOString(),
      })

      if (dbError) {
        console.warn("⚠️ Database fallback also failed:", dbError)
      }

      return NextResponse.json({
        success: true,
        id,
        imageUrl: imageUrl,
        message: "Image saved with original URL",
      })
    }
  } catch (error) {
    console.error("❌ Error in temp-image POST:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    console.log("🔍 Loading temporary image:", id)

    if (!id) {
      return NextResponse.json({ error: "Missing id parameter" }, { status: 400 })
    }

    // Try to get from database first
    const { data, error } = await supabaseAdmin
      .from("temp_images")
      .select("image_url, original_url")
      .eq("id", id)
      .single()

    if (error || !data) {
      console.log("❌ Image not found in database:", error)
      return NextResponse.json({ error: "Image not found" }, { status: 404 })
    }

    console.log("✅ Image found:", data.image_url)
    return NextResponse.json({
      success: true,
      data: {
        imageUrl: data.image_url,
        originalUrl: data.original_url,
      },
    })
  } catch (error) {
    console.error("❌ Error in temp-image GET:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
