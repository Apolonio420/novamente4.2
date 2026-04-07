import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

const ADMIN_EMAILS = [
  'apolonio@novamente.ar',
  'sambu@novamente.ar',
  'moishe@novamente.ar',
  'izzaga@novamente.ar',
]

function extractToken(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization')
  if (authHeader?.startsWith('Bearer ')) return authHeader.replace('Bearer ', '')

  const allCookies = request.cookies.getAll()
  for (const cookie of allCookies) {
    if (cookie.name.startsWith('sb-') && cookie.name.endsWith('-auth-token')) {
      try {
        const parsed = JSON.parse(cookie.value)
        return Array.isArray(parsed) ? parsed[0] : parsed
      } catch {
        return cookie.value
      }
    }
  }
  return null
}

export async function GET(request: NextRequest) {
  try {
    const token = extractToken(request)
    if (!token) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    const { data: userData, error: authError } = await supabaseAdmin.auth.getUser(token)
    if (authError || !userData?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const email = userData.user.email?.toLowerCase() || ''
    if (!ADMIN_EMAILS.includes(email)) {
      return NextResponse.json({ tenants: [] })
    }

    const { data, error } = await (supabaseAdmin as any)
      .from('tenants')
      .select('id, name, slug, logo_url, plan, status, email')
      .order('name')

    if (error) throw error

    return NextResponse.json({ tenants: data || [] })
  } catch (error) {
    console.error('GET /api/partners/tenants error:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
