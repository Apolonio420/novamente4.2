import { NextRequest, NextResponse } from 'next/server'
import { getRequestTenant } from '@/lib/partners/auth'
import { supabaseAdmin } from '@/lib/supabase-admin'
import {
  publishToTikTok,
  resolveTikTokAccessToken,
  uploadVideoToR2,
} from '@/lib/partners/tiktok-poster'

export const dynamic = 'force-dynamic'
export const maxDuration = 300
export const runtime = 'nodejs'

const ALLOWED_TYPES = ['video/mp4', 'video/quicktime', 'video/webm']
const MAX_BYTES = 287 * 1024 * 1024

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

  let form: FormData
  try {
    form = await req.formData()
  } catch {
    return NextResponse.json({ error: 'Invalid multipart payload' }, { status: 400 })
  }

  const video = form.get('video')
  const caption = String(form.get('caption') ?? '').slice(0, 2200)
  const mode = String(form.get('mode') ?? 'now')
  const scheduledAt = form.get('scheduled_at') ? String(form.get('scheduled_at')) : null

  if (!(video instanceof File)) {
    return NextResponse.json({ error: 'Falta el video' }, { status: 400 })
  }
  if (!ALLOWED_TYPES.includes(video.type)) {
    return NextResponse.json({ error: `Formato no soportado: ${video.type}` }, { status: 400 })
  }
  if (video.size > MAX_BYTES) {
    return NextResponse.json({ error: 'El video supera el tamaño permitido' }, { status: 400 })
  }
  if (mode === 'schedule') {
    if (!scheduledAt) {
      return NextResponse.json({ error: 'Falta scheduled_at' }, { status: 400 })
    }
    if (Number.isNaN(Date.parse(scheduledAt))) {
      return NextResponse.json({ error: 'scheduled_at inválido' }, { status: 400 })
    }
  }

  const buffer = Buffer.from(await video.arrayBuffer())
  let r2: { key: string; url: string }
  try {
    r2 = await uploadVideoToR2(buffer, ctx.tenant.id, video.type)
  } catch (e) {
    return NextResponse.json(
      { error: `Falló la subida a R2: ${e instanceof Error ? e.message : 'unknown'}` },
      { status: 500 },
    )
  }

  // Schedule path → just save to DB, cron will pick it up later.
  if (mode === 'schedule' && scheduledAt) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabaseAdmin as any)
      .from('tiktok_scheduled_posts')
      .insert({
        tenant_id: ctx.tenant.id,
        video_url: r2.url,
        video_r2_key: r2.key,
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
      video_url: r2.url,
    })
  }

  // Now path → call TikTok immediately. Defaults to inbox so reviewers/sandbox
  // users can confirm in the TikTok app; the demo script in the partner spec
  // expects this exact end-to-end flow.
  const result = await publishToTikTok({
    tenantId: ctx.tenant.id,
    videoUrl: r2.url,
    caption,
    mode: 'inbox',
  })

  if (!result.success) {
    return NextResponse.json(
      { error: result.error ?? 'TikTok publish failed', video_url: r2.url },
      { status: 502 },
    )
  }

  // Track the publish for analytics / status polling later.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabaseAdmin as any).from('tiktok_scheduled_posts').insert({
    tenant_id: ctx.tenant.id,
    video_url: r2.url,
    video_r2_key: r2.key,
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
    video_url: r2.url,
  })
}
