import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: imageId } = await params

    if (!imageId) {
      return NextResponse.json({ error: "ID de imagen requerido" }, { status: 400 })
    }

    console.log("🔍 Buscando imagen procesada:", imageId)

    // Buscar la imagen en la base de datos
    const { data, error } = await supabaseAdmin
      .from("images")
      .select("*")
      .eq("id", imageId)
      .single()

    if (error) {
      console.error("❌ Error buscando imagen:", error)
      if (error.code === "PGRST116") {
        return NextResponse.json({ error: "Imagen no encontrada" }, { status: 404 })
      }
      return NextResponse.json({ error: "Error del servidor" }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: "Imagen no encontrada" }, { status: 404 })
    }

    console.log("✅ Imagen encontrada:", {
      id: data.id,
      hasBgRemoved: data.has_bg_removed,
      url: data.url?.substring(0, 50) + "...",
    })

    return NextResponse.json({
      success: true,
      image: {
        id: data.id,
        url: data.url,
        prompt: data.prompt,
        has_bg_removed: data.has_bg_removed || false,
        url_without_bg: data.url_without_bg,
        created_at: data.created_at,
        user_id: data.user_id,
      },
    })

  } catch (error) {
    console.error("❌ Error en GET /api/images/[id]:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}