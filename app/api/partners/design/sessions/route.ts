import { NextRequest, NextResponse } from 'next/server'
import { getRequestTenant } from '@/lib/partners/auth'
import { supabaseAdmin } from '@/lib/supabase-admin'

const db = () => supabaseAdmin as any

export const dynamic = 'force-dynamic'

// GET: List sessions for current tenant
export async function GET(request: NextRequest) {
  try {
    const result = await getRequestTenant(request)
    if (!result) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    const { tenant } = result

    const { data, error } = await db()
      .from('partner_design_sessions')
      .select('id, title, selected_style, selected_garment, message_count, last_image_url, created_at, updated_at')
      .eq('tenant_id', tenant.id)
      .order('updated_at', { ascending: false })
      .limit(50)

    if (error) {
      console.error('[studio sessions] list error:', error)
      return NextResponse.json({ sessions: [] })
    }

    return NextResponse.json({
      sessions: (data || []).map((s: any) => ({
        id: s.id,
        title: s.title,
        selectedStyle: s.selected_style,
        selectedGarment: s.selected_garment,
        messageCount: s.message_count || 0,
        lastImageUrl: s.last_image_url,
        createdAt: s.created_at,
        updatedAt: s.updated_at,
      })),
    })
  } catch (err: any) {
    console.error('[studio sessions] GET error:', err)
    return NextResponse.json({ sessions: [] })
  }
}

// POST: Create new session
export async function POST(request: NextRequest) {
  try {
    const result = await getRequestTenant(request)
    if (!result) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    const { userId, tenant } = result
    const body = await request.json()

    const { data, error } = await db()
      .from('partner_design_sessions')
      .insert({
        tenant_id: tenant.id,
        user_id: userId,
        title: body.title || null,
        selected_style: body.selectedStyle || null,
        selected_garment: body.selectedGarment || 'aura-oversize-tshirt',
      })
      .select('id')
      .single()

    if (error || !data) {
      console.error('[studio sessions] create error:', error)
      return NextResponse.json({ error: 'Error creando sesion' }, { status: 500 })
    }

    // Fire-and-forget: set first_design_at once
    db()
      .from('tenants')
      .update({ first_design_at: new Date().toISOString() })
      .eq('id', tenant.id)
      .is('first_design_at', null)

    return NextResponse.json({ id: data.id })
  } catch (err: any) {
    console.error('[studio sessions] POST error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
