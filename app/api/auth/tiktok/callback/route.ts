import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getTenantById } from '@/lib/partners/tenant'

export const dynamic = 'force-dynamic'

const TIKTOK_TOKEN_URL = 'https://open.tiktokapis.com/v2/oauth/token/'

interface TikTokTokenResponse {
  access_token?: string
  refresh_token?: string
  open_id?: string
  scope?: string
  expires_in?: number
  refresh_expires_in?: number
  token_type?: string
  error?: string
  error_description?: string
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const code = url.searchParams.get('code')
  const state = url.searchParams.get('state')
  const error = url.searchParams.get('error')
  const errorDesc = url.searchParams.get('error_description')

  if (error) {
    return NextResponse.json({ error, error_description: errorDesc }, { status: 400 })
  }
  if (!code || !state) {
    return NextResponse.json({ error: 'Missing code or state' }, { status: 400 })
  }

  const cookieState = req.cookies.get('tiktok_oauth_state')?.value
  if (!cookieState || cookieState !== state) {
    return NextResponse.json({ error: 'Invalid OAuth state' }, { status: 400 })
  }

  const clientKey = process.env.TIKTOK_CLIENT_KEY
  const clientSecret = process.env.TIKTOK_CLIENT_SECRET
  if (!clientKey || !clientSecret) {
    return NextResponse.json({ error: 'TikTok credentials not configured' }, { status: 500 })
  }

  const redirectUri = `${url.origin}/api/auth/tiktok/callback`

  const tokenRes = await fetch(TIKTOK_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_key: clientKey,
      client_secret: clientSecret,
      code,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
    }),
  })

  const data = (await tokenRes.json()) as TikTokTokenResponse
  if (!tokenRes.ok || !data.access_token) {
    return NextResponse.json({
      error: 'Token exchange failed',
      tiktok: data,
    }, { status: 502 })
  }

  // Multi-tenant: state encodes tenantId before the random nonce.
  // Persist tokens in tenants.metadata.tiktok_integration so each partner has their own.
  const tenantId = state.split(':')[0]
  if (!tenantId) {
    return NextResponse.json({ error: 'Invalid state encoding' }, { status: 400 })
  }
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })
  }
  const tenant = await getTenantById(tenantId)
  if (!tenant) {
    return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
  }
  const sb = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } })
  const integration = {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    open_id: data.open_id,
    scope: data.scope,
    expires_at: data.expires_in ? new Date(Date.now() + data.expires_in * 1000).toISOString() : null,
    refresh_expires_at: data.refresh_expires_in ? new Date(Date.now() + data.refresh_expires_in * 1000).toISOString() : null,
    connected_at: new Date().toISOString(),
  }
  const { error: updateError } = await sb
    .from('tenants')
    .update({
      metadata: {
        ...((tenant as { metadata?: Record<string, unknown> }).metadata ?? {}),
        tiktok_integration: integration,
      },
    })
    .eq('id', tenantId)
  if (updateError) {
    return NextResponse.json(
      {
        error: 'Failed to persist TikTok integration',
        detail: updateError.message,
        hint: /column.*metadata/i.test(updateError.message)
          ? 'Run scripts/sql/add_tenants_metadata.sql in Supabase to add the missing column'
          : undefined,
      },
      { status: 500 },
    )
  }

  const res = NextResponse.redirect(`${url.origin}/workspace/integrations/tiktok?connected=1`)
  res.cookies.delete('tiktok_oauth_state')
  return res
}
