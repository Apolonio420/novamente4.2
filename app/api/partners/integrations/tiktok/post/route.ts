import { NextRequest, NextResponse } from 'next/server'
import { getRequestTenant } from '@/lib/partners/auth'
import { supabaseAdmin } from '@/lib/supabase-admin'
import {
  publishToTikTokFileUpload,
  resolveTikTokAccessToken,
} from '@/lib/partners/tiktok-poster'
import { getSignedR2Url } from '@/lib/cloudflare-r2'
import { normalizeR2Key } from '@/lib/r2'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(req: NextRequest) {
  const ctx = await getRequestTenant(req)
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const accessToken = await resolveTikTokAccessToken(ctx.tenant.id)
  if (!accessToken) {
    return NextResponse.json(
      { error: 'TikTok no está conectado. Conectalo primero en Integraciones.' },
      { status: 400 },
    )
  }

  let body: {
    videoUrl?: string
    videoKey?: string
    caption?: string
    mode?: string
    scheduledAt?: string
  }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const videoUrl = body.videoUrl?.trim()
  const videoKey = body.videoKey?.trim() ?? null
  const caption = (body.caption ?? '').slice(0, 2200)
  const mode = body.mode ?? 'now'
  const scheduledAt = body.scheduledAt ?? null

  if (!videoUrl) {
    return NextResponse.json(
      { error: 'Falta videoUrl (subí el video primero al endpoint upload-url)' },
      { status: 400 },
    )
  }
  if (mode === 'schedule') {
    if (!scheduledAt) return NextResponse.json({ error: 'Falta scheduledAt' }, { status: 400 })
    if (Number.isNaN(Date.parse(scheduledAt))) {
      return NextResponse.json({ error: 'scheduledAt inválido' }, { status: 400 })
    }
  }

  // Schedule path → save row, cron picks it up.
  if (mode === 'schedule' && scheduledAt) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabaseAdmin as any)
      .from('tiktok_scheduled_posts')
      .insert({
        tenant_id: ctx.tenant.id,
        video_url: videoUrl,
        video_r2_key: videoKey,
        caption,
        scheduled_at: new Date(scheduledAt).toISOString(),
        status: 'pending',
      })
      .select('id')
      .single()
    if (error) {
      return NextResponse.json(
        { error: `No se pudo programar: ${error.message}` },
        { status: 500 },
      )
    }
    return NextResponse.json({
      ok: true,
      mode: 'schedule',
      scheduled_id: data?.id,
      scheduled_at: scheduledAt,
      video_url: videoUrl,
    })
  }

  // Now path → fetch the binary from R2 (signed GET) and stream it to TikTok
  // via FILE_UPLOAD. PULL_FROM_URL is rejected by TikTok with
  // url_ownership_unverified unless the source domain is verified in the dev
  // portal — which our R2 endpoint isn't.
  const key = videoKey ?? normalizeR2Key(videoUrl)
  let videoBuffer: Buffer
  try {
    const signed = await getSignedR2Url(key, 600)
    const r2Res = await fetch(signed)
    if (!r2Res.ok) throw new Error(`R2 GET ${r2Res.status}`)
    videoBuffer = Buffer.from(await r2Res.arrayBuffer())
  } catch (e) {
    return NextResponse.json(
      { error: `Failed to fetch video from R2: ${e instanceof Error ? e.message : 'unknown'}` },
      { status: 500 },
    )
  }

  const result = await publishToTikTokFileUpload({
    tenantId: ctx.tenant.id,
    videoBuffer,
    caption,
    mode: 'inbox',
  })

  if (!result.success) {
    return NextResponse.json(
      { error: result.error ?? 'TikTok publish failed', video_url: videoUrl },
      { status: 502 },
    )
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabaseAdmin as any).from('tiktok_scheduled_posts').insert({
    tenant_id: ctx.tenant.id,
    video_url: videoUrl,
    video_r2_key: videoKey,
    caption,
    scheduled_at: new Date().toISOString(),
    status: 'sent',
    publish_id: result.publishId,
    sent_at: new Date().toISOString(),
  })

  return NextResponse.json({
    ok: true,
    mode: 'now',
    publish_id: result.publishId,
    video_url: videoUrl,
  })
}
