import { NextResponse } from 'next/server'

/**
 * Server-side cookie setter for auth session.
 * The Supabase JS client stores tokens in localStorage,
 * but the middleware needs them in cookies.
 * This endpoint bridges the gap.
 */
export async function POST(request: Request) {
  try {
    const { access_token, refresh_token } = await request.json()

    if (!access_token) {
      return NextResponse.json({ error: 'Missing access_token' }, { status: 400 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
    const ref = supabaseUrl.match(/\/\/([^.]+)/)?.[1] || 'sb'
    const cookieName = `sb-${ref}-auth-token`
    const cookieValue = JSON.stringify([access_token, refresh_token || ''])

    const response = NextResponse.json({ ok: true })

    response.cookies.set(cookieName, cookieValue, {
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      sameSite: 'lax',
      httpOnly: false, // middleware needs to read it
    })

    return response
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}

export async function DELETE() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const ref = supabaseUrl.match(/\/\/([^.]+)/)?.[1] || 'sb'
  const cookieName = `sb-${ref}-auth-token`

  const response = NextResponse.json({ ok: true })
  response.cookies.set(cookieName, '', { path: '/', maxAge: 0 })
  return response
}
