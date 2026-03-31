import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getTenantByUserId } from '@/lib/partners/tenant'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const ADMIN_EMAILS = [
  'apolonio@novamente.ar',
  'sambu@novamente.ar',
  'moishe@novamente.ar',
  'izzaga@novamente.ar',
]

function extractToken(request: NextRequest): string | null {
  // 1. Try Authorization header
  const authHeader = request.headers.get('authorization')
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.replace('Bearer ', '')
  }

  // 2. Fallback: Supabase session cookie
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
    if (!token) {
      return NextResponse.json({ role: 'visitor' })
    }

    const { data: userData, error } = await (supabaseAdmin as any).auth.getUser(token)
    if (error || !userData?.user) {
      return NextResponse.json({ role: 'visitor' })
    }

    const email = userData.user.email?.toLowerCase()
    if (!email) {
      return NextResponse.json({ role: 'visitor' })
    }

    if (ADMIN_EMAILS.includes(email)) {
      return NextResponse.json({ role: 'admin', email })
    }

    // Check if user has a tenant via user_id
    const tenant = await getTenantByUserId(userData.user.id)
    if (tenant) {
      return NextResponse.json({
        role: 'partner',
        email,
        tenantSlug: tenant.slug,
        tenantId: tenant.id,
        tenantName: tenant.name,
      })
    }

    return NextResponse.json({ role: 'visitor', email })
  } catch {
    return NextResponse.json({ role: 'visitor' })
  }
}
