import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { normalizeR2Key } from "@/lib/r2"
import { getSignedR2Url } from "@/lib/cloudflare-r2"

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

    const imageData = data as any;
    console.log("✅ Imagen encontrada:", {
      id: imageData.id,
      hasBgRemoved: imageData.has_bg_removed,
      url: (imageData.url as string | null)?.substring(0, 50) + "...",
    })

    // Normalizar clave y generar URL pública/proxy
    const resolveUrl = async (maybeKeyOrUrl: string | null): Promise<string | null> => {
      if (!maybeKeyOrUrl) return null
      const { toPublicR2Url } = await import("@/lib/r2")
      return toPublicR2Url(maybeKeyOrUrl)
    }

    const storageKey = (data as any).storage_key || (data as any).url || ''
    const resolvedUrl = await resolveUrl(storageKey)
    const resolvedUrlWithoutBg = await resolveUrl((data as any).url_without_bg || null)

    return NextResponse.json({
      success: true,
      image: {
        id: imageData.id,
        url: resolvedUrl || imageData.url,
        prompt: imageData.prompt,
        has_bg_removed: imageData.has_bg_removed || false,
        url_without_bg: resolvedUrlWithoutBg || null,
        created_at: imageData.created_at,
        user_id: imageData.user_id,
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