/**
 * Multi-tenant TikTok publishing service for partners.
 *
 * Tokens come from `tenants.metadata.tiktok_integration` (saved by
 * /api/auth/tiktok/callback). Videos are uploaded to R2 first so we can use
 * TikTok's PULL_FROM_URL flow — same pattern as novamente-platform's
 * lib/robot/services/posting/tiktok.ts but per-tenant.
 */
import { uploadToR2 } from '@/lib/cloudflare-r2'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getTenantById } from '@/lib/partners/tenant'

const TIKTOK_INIT_URL = 'https://open.tiktokapis.com/v2/post/publish/video/init/'
const TIKTOK_INBOX_INIT_URL = 'https://open.tiktokapis.com/v2/post/publish/inbox/video/init/'
const TIKTOK_REFRESH_URL = 'https://open.tiktokapis.com/v2/oauth/token/'

interface TikTokIntegration {
  access_token: string
  refresh_token?: string
  open_id?: string
  scope?: string
  expires_at?: string | null
  refresh_expires_at?: string | null
  connected_at?: string | null
}

export interface PublishResult {
  success: boolean
  publishId?: string
  videoUrl?: string
  error?: string
}

async function refreshAccessToken(refreshToken: string): Promise<TikTokIntegration | null> {
  const clientKey = process.env.TIKTOK_CLIENT_KEY
  const clientSecret = process.env.TIKTOK_CLIENT_SECRET
  if (!clientKey || !clientSecret) return null

  const res = await fetch(TIKTOK_REFRESH_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_key: clientKey,
      client_secret: clientSecret,
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  })
  const data = (await res.json()) as {
    access_token?: string
    refresh_token?: string
    open_id?: string
    scope?: string
    expires_in?: number
    refresh_expires_in?: number
  }
  if (!res.ok || !data.access_token) return null
  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token ?? refreshToken,
    open_id: data.open_id,
    scope: data.scope,
    expires_at: data.expires_in
      ? new Date(Date.now() + data.expires_in * 1000).toISOString()
      : null,
    refresh_expires_at: data.refresh_expires_in
      ? new Date(Date.now() + data.refresh_expires_in * 1000).toISOString()
      : null,
  }
}

async function persistTokens(tenantId: string, integration: TikTokIntegration): Promise<void> {
  const tenant = await getTenantById(tenantId)
  if (!tenant) return
  const meta = ((tenant as { metadata?: Record<string, unknown> }).metadata ?? {}) as Record<string, unknown>
  const existing = (meta.tiktok_integration ?? {}) as Record<string, unknown>
  const merged = {
    ...meta,
    tiktok_integration: { ...existing, ...integration },
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabaseAdmin as any).from('tenants').update({ metadata: merged }).eq('id', tenantId)
}

export async function resolveTikTokAccessToken(tenantId: string): Promise<string | null> {
  const tenant = await getTenantById(tenantId)
  const integration = (tenant as { metadata?: { tiktok_integration?: TikTokIntegration } } | null)
    ?.metadata?.tiktok_integration
  if (!integration?.access_token) return null

  const expired = integration.expires_at
    ? new Date(integration.expires_at).getTime() <= Date.now() + 60_000
    : false
  if (!expired) return integration.access_token

  if (integration.refresh_token) {
    const refreshed = await refreshAccessToken(integration.refresh_token)
    if (refreshed) {
      await persistTokens(tenantId, refreshed)
      return refreshed.access_token
    }
  }
  return null
}

export async function uploadVideoToR2(
  buffer: Buffer,
  tenantId: string,
  contentType = 'video/mp4',
): Promise<{ key: string; url: string }> {
  const ext = contentType.includes('quicktime') ? 'mov' : contentType.includes('webm') ? 'webm' : 'mp4'
  const key = `tiktok/${tenantId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
  const url = await uploadToR2(buffer, key, contentType)
  return { key, url }
}

export interface PublishParams {
  tenantId: string
  videoUrl: string
  caption: string
  /** Sandbox apps must use SELF_ONLY. Approved apps can target PUBLIC. */
  privacyLevel?: 'PUBLIC_TO_EVERYONE' | 'MUTUAL_FOLLOW_FRIENDS' | 'SELF_ONLY'
  /** "direct" = post to feed. "inbox" = lands as draft in user's TikTok app. */
  mode?: 'direct' | 'inbox'
}

export async function publishToTikTok(params: PublishParams): Promise<PublishResult> {
  const accessToken = await resolveTikTokAccessToken(params.tenantId)
  if (!accessToken) {
    return { success: false, error: 'Tenant has no valid TikTok access token' }
  }

  const truncated =
    params.caption.length > 2000 ? params.caption.slice(0, 1997) + '...' : params.caption

  const url = params.mode === 'inbox' ? TIKTOK_INBOX_INIT_URL : TIKTOK_INIT_URL
  const body =
    params.mode === 'inbox'
      ? {
          source_info: { source: 'PULL_FROM_URL', video_url: params.videoUrl },
        }
      : {
          post_info: {
            title: truncated,
            privacy_level: params.privacyLevel ?? 'SELF_ONLY',
            disable_comment: false,
            disable_duet: false,
            disable_stitch: false,
          },
          source_info: { source: 'PULL_FROM_URL', video_url: params.videoUrl },
        }

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json; charset=UTF-8',
    },
    body: JSON.stringify(body),
  })

  const data = (await res.json()) as {
    data?: { publish_id?: string }
    error?: { code?: string; message?: string }
  }

  if (!res.ok || (data.error?.code && data.error.code !== 'ok')) {
    return {
      success: false,
      error: `[tiktok] ${data.error?.code ?? `HTTP ${res.status}`}: ${data.error?.message ?? 'unknown'}`,
      videoUrl: params.videoUrl,
    }
  }

  return { success: true, publishId: data.data?.publish_id, videoUrl: params.videoUrl }
}
