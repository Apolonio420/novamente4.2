import { NextRequest, NextResponse } from 'next/server'
import { listR2Objects, deleteFromR2 } from '@/lib/cloudflare-r2'

/**
 * Limpieza de selfies subidas para el try-on (app/api/public/design/try-on)
 * bajo el prefijo v1/selfies/ en R2. El cliente ya intenta borrar la selfie
 * apenas termina de usarla (DELETE /api/public/design/cleanup-selfie), pero
 * eso es best-effort (falla si cierran la pestaña, se corta la red, etc.).
 * Este cron es el respaldo: borra cualquier selfie con más de 24h, por
 * privacidad de datos biométricos (Ley 25.326 AR — el consentimiento del
 * usuario es solo para procesar, no para retener).
 *
 * Corre por Vercel cron (vercel.json). Auth: Bearer CRON_SECRET o header
 * x-vercel-cron (invocación nativa de Vercel).
 */
export const runtime = 'nodejs'
export const maxDuration = 120

const SELFIE_PREFIX = 'v1/selfies/'
const MAX_AGE_MS = 24 * 3600_000 // 24h

export async function GET(request: NextRequest) {
  // Auth: cron nativo de Vercel o Bearer CRON_SECRET
  const isVercelCron = !!request.headers.get('x-vercel-cron')
  const secret = process.env.CRON_SECRET
  const bearerOk = !!secret && request.headers.get('authorization') === `Bearer ${secret}`
  if (!isVercelCron && !bearerOk) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const dry = request.nextUrl.searchParams.get('dry') === '1'

  try {
    const cutoff = Date.now() - MAX_AGE_MS
    const objects = await listR2Objects(SELFIE_PREFIX)

    let deleted = 0
    const errors: string[] = []

    for (const o of objects) {
      // el key lleva timestamp: v1/selfies/{ts}-{random}.ext — fallback a lastModified
      const tsMatch = /v1\/selfies\/(\d{10,13})-/.exec(o.key)
      const ts = tsMatch ? Number(tsMatch[1]) : o.lastModified?.getTime() ?? 0
      const ms = ts < 1e12 ? ts * 1000 : ts
      if (ms > 0 && ms < cutoff) {
        if (dry) {
          deleted++
          continue
        }
        try {
          await deleteFromR2(o.key)
          deleted++
        } catch (e: any) {
          errors.push(`${o.key}: ${e?.message?.slice(0, 120)}`)
        }
      }
    }

    console.log('[cleanup-tryon-selfies]', JSON.stringify({ dry, scanned: objects.length, deleted, errors }))
    return NextResponse.json({ dry, scanned: objects.length, deleted, errors })
  } catch (e: any) {
    console.error('[cleanup-tryon-selfies] failed:', e?.message || e)
    return NextResponse.json({ error: e?.message ?? 'Cleanup failed' }, { status: 500 })
  }
}
