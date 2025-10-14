import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"

export async function GET() {
  try {
    console.log("🔍 Fetching images from database...")
    
    // Obtener todas las imágenes recientes usando supabaseAdmin
    const { data, error } = await supabaseAdmin
      .from("images")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20)

    if (error) {
      console.error("❌ Error fetching images:", error)
      return NextResponse.json({ error: "Failed to fetch images" }, { status: 500 })
    }

    console.log(`✅ Found ${data?.length || 0} images in database`)
    
    const images = (data || []).map((item) => ({
      ...item,
      hasBgRemoved: item.has_bg_removed || false,
      urlWithoutBg: item.url_without_bg || null,
    }))

    return NextResponse.json({ images })
  } catch (error) {
    console.error("❌ Error fetching images:", error)
    return NextResponse.json({ error: "Failed to fetch images" }, { status: 500 })
  }
}
