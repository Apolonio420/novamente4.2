import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { toPublicR2Url, normalizeR2Key } from "@/lib/r2"

const SESSION_COOKIE = "novamente_session_id"

export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const sessionId = cookieStore.get(SESSION_COOKIE)?.value
    const limit = Math.min(Number(req.nextUrl.searchParams.get("limit") || "20"), 50)

    // Try authenticated user first
    const authCookie = cookieStore.getAll().find(c => c.name.startsWith("sb-") && c.name.endsWith("-auth-token"))
    let userId: string | null = null

    if (authCookie?.value) {
      try {
        const token = authCookie.value.startsWith("base64-")
          ? Buffer.from(authCookie.value.slice(7), "base64").toString()
          : authCookie.value
        const { data } = await supabaseAdmin.auth.getUser(token)
        userId = data?.user?.id || null
      } catch {
        // Not authenticated, continue with session
      }
    }

    if (!userId && !sessionId) {
      return NextResponse.json({ images: [] })
    }

    let query = supabaseAdmin
      .from("images")
      .select("id, storage_key, url, prompt, created_at, has_bg_removed, url_without_bg, session_id, user_id")
      .order("created_at", { ascending: false })
      .limit(limit)

    if (userId) {
      query = query.eq("user_id", userId)
    } else {
      query = query.eq("session_id", sessionId!)
    }

    const { data, error } = await query

    if (error) {
      // session_id column might not exist yet
      if (error.code === "42703" || error.message?.includes("session_id")) {
        return NextResponse.json({ images: [], migration_needed: true })
      }
      console.error("Error fetching image history:", error)
      return NextResponse.json({ images: [] })
    }

    const images = (data || []).map((item) => {
      const key = normalizeR2Key(item.storage_key || item.url || "")
      const url = key ? toPublicR2Url(key) || `/api/proxy-image?key=${encodeURIComponent(key)}` : item.url
      return {
        id: item.id,
        url,
        prompt: item.prompt || "",
        created_at: item.created_at,
        has_bg_removed: item.has_bg_removed || false,
        url_without_bg: item.url_without_bg ? toPublicR2Url(normalizeR2Key(item.url_without_bg)) : null,
      }
    })

    return NextResponse.json({ images })
  } catch (error) {
    console.error("Error in image history API:", error)
    return NextResponse.json({ images: [] })
  }
}
