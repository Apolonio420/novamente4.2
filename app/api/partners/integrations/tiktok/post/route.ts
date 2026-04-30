import { NextRequest, NextResponse } from 'next/server'
import { getRequestTenant } from '@/lib/partners/auth'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { publishToTikTok, resolveTikTokAccessToken } from '@/lib/partners/tiktok-poster'

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

  // Now path → publish via TikTok inbox API (drafts in user's TikTok app —
  // ideal for sandbox / app review, no Direct Post permission required).
  const result = await publishToTikTok({
    tenantId: ctx.tenant.id,
    videoUrl,
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
