/**
 * POST /api/public/design/feedback — caritas (😞 😐 😊) debajo de cada imagen
 * de /crear. Upsert por id (el cliente genera un uuid por imagen), así cambiar
 * de carita actualiza la fila en vez de sumar votos.
 *
 * Público: valida con parseImageFeedback (solo URLs de imágenes nuestras),
 * guarda ip_hash (nunca la IP) y corta a 120 votos por hora por visitante.
 * Si la tabla todavía no existe (migración sin correr) devuelve 200 con
 * saved:false: las caritas nunca rompen /crear.
 */
import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { hashClientIp } from "@/lib/security/public-image-guard"
import { parseImageFeedback } from "@/lib/designer/image-feedback"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const MAX_PER_HOUR = 120

function isMissingTable(error: { code?: string; message?: string }): boolean {
  return (
    error.code === "42P01" ||
    error.code === "PGRST205" ||
    error.code === "PGRST204" ||
    /does not exist|could not find the table|schema cache/i.test(error.message ?? "")
  )
}

export async function POST(req: NextRequest) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 })
  }
  const parsed = parseImageFeedback(body)
  if ("error" in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 })
  const f = parsed.value

  const ipHash = hashClientIp(req)
  const table = () => supabaseAdmin.from("studio_image_feedback") as any

  try {
    const since = new Date(Date.now() - 3600_000).toISOString()
    const { count, error: countError } = await table()
      .select("id", { count: "exact", head: true })
      .eq("ip_hash", ipHash)
      .gte("created_at", since)
    if (countError) {
      if (isMissingTable(countError)) return NextResponse.json({ saved: false })
      throw countError
    }
    if ((count ?? 0) >= MAX_PER_HOUR) return NextResponse.json({ error: "Demasiados votos" }, { status: 429 })

    const cookieStore = await cookies()
    const sessionId = cookieStore.get("novamente_session_id")?.value?.slice(0, 80) ?? null

    const { error } = await table().upsert(
      {
        id: f.id,
        rating: f.rating,
        operation: f.operation,
        prompt: f.prompt,
        image_url: f.imageUrl,
        garment_type: f.garmentType,
        garment_color: f.garmentColor,
        session_id: sessionId,
        ip_hash: ipHash,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" },
    )
    if (error) {
      if (isMissingTable(error)) return NextResponse.json({ saved: false })
      throw error
    }
    return NextResponse.json({ saved: true })
  } catch (e: any) {
    console.error("[design/feedback]", e?.message)
    return NextResponse.json({ saved: false }, { status: 500 })
  }
}
