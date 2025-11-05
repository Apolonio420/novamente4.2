import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { toPublicR2Url, normalizeR2Key } from "@/lib/r2"

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
    
    const images = (data || []).map((item) => {
      const key = normalizeR2Key((item as any).storage_key || (item as any).url || '')
      const url = toPublicR2Url(key)
      const urlWithoutBg = toPublicR2Url(normalizeR2Key(item.url_without_bg || '')) || null
      return {
        ...item,
        url,
        hasBgRemoved: item.has_bg_removed || false,
        urlWithoutBg,
      }
    })

    return NextResponse.json({ images })
  } catch (error) {
    console.error("❌ Error fetching images:", error)
    return NextResponse.json({ error: "Failed to fetch images" }, { status: 500 })
  }
}
