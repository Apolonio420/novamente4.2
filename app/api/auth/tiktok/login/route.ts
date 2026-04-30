import { NextRequest, NextResponse } from 'next/server'
import { randomBytes } from 'node:crypto'
import { getRequestTenant } from '@/lib/partners/auth'

export const dynamic = 'force-dynamic'

const TIKTOK_AUTH_URL = 'https://www.tiktok.com/v2/auth/authorize/'

/**
 * Initiates the TikTok OAuth flow scoped to the authenticated partner tenant.
 * Multi-tenant: each partner connects their own TikTok account, tokens stored
 * per tenant. Required for TikTok app review (the app must clearly serve
 * independent users, not a single internal account).
 */
export async function GET(req: NextRequest) {
  const clientKey = process.env.TIKTOK_CLIENT_KEY
  if (!clientKey) {
    return NextResponse.json({ error: 'TIKTOK_CLIENT_KEY not configured' }, { status: 500 })
  }

  const ctx = await getRequestTenant(req)
  if (!ctx) {
    const loginUrl = new URL('/partners/login', req.url)
    loginUrl.searchParams.set('redirect', '/partners/workspace/integrations/tiktok')
    return NextResponse.redirect(loginUrl)
  }

  const origin = new URL(req.url).origin
  const redirectUri = `${origin}/api/auth/tiktok/callback`
  const state = `${ctx.tenant.id}:${randomBytes(16).toString('hex')}`

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
