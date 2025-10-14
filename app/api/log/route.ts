import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { tag = "log", payload = null, ts = new Date().toISOString() } = body || {}
    // Log en consola del servidor (Node) durante desarrollo
    console.log(`🧩 [SERVER-LOG] ${tag} @ ${ts}`, payload)
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("[SERVER-LOG] Error parsing body:", err)
    return NextResponse.json({ ok: false }, { status: 400 })
  }
}


