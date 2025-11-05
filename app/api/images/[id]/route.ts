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

    console.log("✅ Imagen encontrada:", {
      id: data.id,
      hasBgRemoved: data.has_bg_removed,
      url: (data.url as string | null)?.substring(0, 50) + "...",
    })

    // Normalizar clave y generar URL firmada (funciona siempre, incluso si el bucket no es público)
    const resolveUrl = async (maybeKeyOrUrl: string | null): Promise<string | null> => {
      if (!maybeKeyOrUrl) return null
      try {
        const key = normalizeR2Key(maybeKeyOrUrl)
        if (!key) return null
        // Usar URL firmada para garantizar acceso
        return await getSignedR2Url(key, 86400) // 24 horas
      } catch (err) {
        console.error("⚠️ Error resolviendo URL firmada:", err)
        return null
      }
    }

    const key = normalizeR2Key((data as any).storage_key || (data as any).url || '')
    const resolvedUrl = key ? await resolveUrl(key) : (data.url as string | null)
    const urlWithoutBgKey = normalizeR2Key((data as any).url_without_bg || '')
    const resolvedUrlWithoutBg = urlWithoutBgKey ? await resolveUrl(urlWithoutBgKey) : ((data as any).url_without_bg as string | null)

    return NextResponse.json({
      success: true,
      image: {
        id: data.id,
        url: resolvedUrl || data.url,
        prompt: data.prompt,
        has_bg_removed: data.has_bg_removed || false,
        url_without_bg: resolvedUrlWithoutBg || null,
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