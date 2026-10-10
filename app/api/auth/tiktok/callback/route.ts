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

const INTEGRATION_PAGE = '/workspace/integrations/tiktok'

/**
 * Códigos cortos para el ?error= de la UI (app/workspace/integrations/tiktok/page.tsx),
 * NUNCA el texto crudo de TikTok/Supabase — ver TikTokErrorCode ahí para el
 * mapeo a mensaje en español.
 */
type TikTokCallbackErrorCode =
  | 'denied'
  | 'missing_params'
  | 'invalid_state'
  | 'not_configured'
  | 'token_exchange_failed'
  | 'invalid_state_encoding'
  | 'tenant_not_found'
  | 'save_failed'

/** Redirige a la pantalla de integración con un código corto y borra la cookie de state (antes los errores devolvían JSON crudo y el partner veía una pantalla en blanco sin saber qué pasó ni cómo reintentar). */
function redirectWithError(origin: string, code: TikTokCallbackErrorCode) {
  const res = NextResponse.redirect(`${origin}${INTEGRATION_PAGE}?error=${code}`)
  res.cookies.delete('tiktok_oauth_state')
  return res
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url)

  // PLATFORM ADMIN OAUTH: state sin prefijo "tenantId:" significa que el OAuth
  // lo inicio admin.novamente.ar (no un partner). Forward al callback del platform.
  const stateParam = url.searchParams.get('state')
  if (stateParam && !stateParam.includes(':')) {
    return NextResponse.redirect(`https://admin.novamente.ar${url.pathname}${url.search}`)
  }
  const code = url.searchParams.get('code')
  const state = url.searchParams.get('state')
  const error = url.searchParams.get('error')

  if (error) {
    // El usuario canceló/denegó en la pantalla de TikTok, o TikTok devolvió
    // otro error OAuth — el detalle (error_description) solo queda en logs.
    console.warn('[tiktok/callback] OAuth error de TikTok:', error, url.searchParams.get('error_description'))
    return redirectWithError(url.origin, 'denied')
  }
  if (!code || !state) {
    return redirectWithError(url.origin, 'missing_params')
  }

  const cookieState = req.cookies.get('tiktok_oauth_state')?.value
  if (!cookieState || cookieState !== state) {
    return redirectWithError(url.origin, 'invalid_state')
  }

  const clientKey = process.env.TIKTOK_CLIENT_KEY
  const clientSecret = process.env.TIKTOK_CLIENT_SECRET
  if (!clientKey || !clientSecret) {
    console.error('[tiktok/callback] TIKTOK_CLIENT_KEY/SECRET no configurados')
    return redirectWithError(url.origin, 'not_configured')
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
    console.error('[tiktok/callback] Token exchange falló:', data.error, data.error_description)
    return redirectWithError(url.origin, 'token_exchange_failed')
  }

  // Multi-tenant: state encodes tenantId before the random nonce.
  // Persist tokens in tenants.metadata.tiktok_integration so each partner has their own.
  const tenantId = state.split(':')[0]
  if (!tenantId) {
    return redirectWithError(url.origin, 'invalid_state_encoding')
  }
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceKey) {
    console.error('[tiktok/callback] Supabase no configurado')
    return redirectWithError(url.origin, 'not_configured')
  }
  const tenant = await getTenantById(tenantId)
  if (!tenant) {
    return redirectWithError(url.origin, 'tenant_not_found')
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
    console.error('[tiktok/callback] No se pudo persistir la integración:', updateError.message)
    return redirectWithError(url.origin, 'save_failed')
  }

  const res = NextResponse.redirect(`${url.origin}${INTEGRATION_PAGE}?connected=1`)
  res.cookies.delete('tiktok_oauth_state')
  return res
}
