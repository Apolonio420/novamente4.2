import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, value, rating, id, page } = body

    // Log to server console for now — can be replaced with DB insert or external analytics
    console.log(`[Web Vital] ${name}: ${value.toFixed(1)} (${rating}) — ${page} [${id}]`)

    return NextResponse.json({ ok: true }, { status: 200 })
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 })
  }
}
