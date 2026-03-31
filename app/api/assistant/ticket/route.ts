import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getTenantByUserId } from '@/lib/partners/tenant'
import { createTicket } from '@/lib/partners/support'
import type { Plan } from '@/lib/partners/types'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function extractToken(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization')
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.replace('Bearer ', '')
  }

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

export async function POST(request: NextRequest) {
  try {
    const token = extractToken(request)
    if (!token) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { data: userData, error: authError } = await (supabaseAdmin as any).auth.getUser(token)
    if (authError || !userData?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const body = await request.json()
    const { subject, description, category, pageUrl, pageContext } = body

    if (!subject) {
      return NextResponse.json({ error: 'Asunto requerido' }, { status: 400 })
    }

    const tenant = await getTenantByUserId(userData.user.id)
    if (!tenant) {
      return NextResponse.json({ error: 'No se encontró tenant' }, { status: 403 })
    }

    const enrichedDesc = `${description || ''}\n\n---\nPágina: ${pageUrl || 'N/A'}\nContexto: ${JSON.stringify(pageContext || {})}`

    const validCategories = ['general', 'billing', 'technical', 'feature_request']
    const ticketCategory = validCategories.includes(category) ? category : 'general'

    const ticket = await createTicket(
      tenant.id,
      subject,
      enrichedDesc,
      ticketCategory as 'general' | 'billing' | 'technical' | 'feature_request',
      tenant.plan as Plan,
    )

    if (!ticket) {
      return NextResponse.json({ error: 'Error creando ticket' }, { status: 500 })
    }

    // Fire-and-forget triage trigger
    const triageUrl = process.env.PLATFORM_TRIAGE_URL
    if (triageUrl) {
      fetch(triageUrl, { headers: { 'x-cron-secret': process.env.CRON_SECRET || '' } }).catch(() => {})
    }

    return NextResponse.json({ ticket }, { status: 201 })
  } catch (error) {
    console.error('POST /api/assistant/ticket error:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
