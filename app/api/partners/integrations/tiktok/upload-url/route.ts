import { NextRequest, NextResponse } from 'next/server'
import { requireTenantPermission } from '@/lib/partners/permissions'
import { getPresignedUploadUrl } from '@/lib/cloudflare-r2'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const ALLOWED_TYPES = ['video/mp4', 'video/quicktime', 'video/webm']

export async function POST(req: NextRequest) {
  const auth = await requireTenantPermission(req, 'marketing:write')
  if (!auth.ok) return auth.response

  let body: { contentType?: string; size?: number; ext?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const contentType = body.contentType ?? 'video/mp4'
  if (!ALLOWED_TYPES.includes(contentType)) {
    return NextResponse.json({ error: `Tipo no soportado: ${contentType}` }, { status: 400 })
  }

  const ext =
    body.ext ??
    (contentType.includes('quicktime') ? 'mov' : contentType.includes('webm') ? 'webm' : 'mp4')
  const key = `tiktok/${auth.tenant.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`

  try {
    const { url, publicUrl } = await getPresignedUploadUrl(key, contentType, 60 * 10)
    return NextResponse.json({ uploadUrl: url, publicUrl, key })
  } catch (e) {
    return NextResponse.json(
      { error: `No se pudo generar URL: ${e instanceof Error ? e.message : 'unknown'}` },
      { status: 500 },
    )
  }
}
