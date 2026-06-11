/**
 * GET /api/public/design/mine — últimos diseños generados por ESTA sesión
 * (cookie novamente_session_id). Permite recuperar trabajo previo en /crear
 * sin login: antes, si cerrabas la pestaña perdías todo.
 */
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const sessionId = cookieStore.get('novamente_session_id')?.value
    if (!sessionId || sessionId.length < 6) return NextResponse.json({ designs: [] })

    const { data } = await (supabaseAdmin as any)
      .from('images')
      .select('id, url, prompt, created_at')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false })
      .limit(24)

    const designs = (data ?? []).filter((d: any) => d.url && !String(d.url).startsWith('data:'))
    return NextResponse.json({ designs })
  } catch (e: any) {
    console.error('[design/mine]', e?.message)
    return NextResponse.json({ designs: [] })
  }
}
