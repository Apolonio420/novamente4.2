import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getTenantByUserId } from '@/lib/partners/tenant'
import { createTicket } from '@/lib/partners/support'
import type { Plan } from '@/lib/partners/types'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const ADMIN_EMAILS = [
  'apolonio@novamente.ar',
  'sambu@novamente.ar',
  'moishe@novamente.ar',
  'izzaga@novamente.ar',
]

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

/** Get or create the internal "Novamente" tenant for admin tickets */
async function getOrCreateInternalTenant(): Promise<{ id: string; plan: string } | null> {
  const db = supabaseAdmin as any

  // Try to find existing internal tenant
  const { data: existing } = await db
    .from('tenants')
    .select('id, plan')
    .eq('slug', 'novamente-internal')
    .single()

  if (existing) return existing

  // Create it
  const { data: created, error } = await db
    .from('tenants')
    .insert({
      slug: 'novamente-internal',
      name: 'Novamente (Internal)',
      owner_email: 'apolonio@novamente.ar',
      plan: 'pro',
      status: 'active',
    })
    .select('id, plan')
    .single()

  if (error) {
    console.error('Failed to create internal tenant:', error)
    return null
  }
  return created
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

    const email = userData.user.email?.toLowerCase() || ''
    const isAdmin = ADMIN_EMAILS.includes(email)

    // For admins without a tenant, use the internal Novamente tenant
    let tenant = await getTenantByUserId(userData.user.id)
    if (!tenant && isAdmin) {
      tenant = await getOrCreateInternalTenant() as any
    }
    if (!tenant) {
      return NextResponse.json({ error: 'No se encontró tenant' }, { status: 403 })
    }

    const enrichedDesc = `${description || ''}\n\n---\n${isAdmin ? `Admin: ${email}\n` : ''}Página: ${pageUrl || 'N/A'}\nContexto: ${JSON.stringify(pageContext || {})}`

    const validCategories = ['general', 'billing', 'technical', 'feature_request']
    const ticketCategory = validCategories.includes(category) ? category : 'general'

    const ticket = await createTicket(
      tenant.id,
      subject,
      enrichedDesc,
      ticketCategory as 'general' | 'billing' | 'technical' | 'feature_request',
      (tenant as any).plan as Plan,
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
