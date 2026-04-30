import { NextRequest, NextResponse } from 'next/server'
import { randomBytes } from 'node:crypto'

export const dynamic = 'force-dynamic'

const TIKTOK_AUTH_URL = 'https://www.tiktok.com/v2/auth/authorize/'

export async function GET(req: NextRequest) {
  const clientKey = process.env.TIKTOK_CLIENT_KEY
  if (!clientKey) {
    return NextResponse.json({ error: 'TIKTOK_CLIENT_KEY not configured' }, { status: 500 })
  }

  const origin = new URL(req.url).origin
  const redirectUri = `${origin}/api/auth/tiktok/callback`
  const state = randomBytes(16).toString('hex')

  const params = new URLSearchParams({
    client_key: clientKey,
    response_type: 'code',
    scope: 'user.info.basic,video.publish,video.upload',
    redirect_uri: redirectUri,
    state,
  })

  const res = NextResponse.redirect(`${TIKTOK_AUTH_URL}?${params}`)
  res.cookies.set('tiktok_oauth_state', state, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: 600,
    path: '/',
  })
  return res
}
