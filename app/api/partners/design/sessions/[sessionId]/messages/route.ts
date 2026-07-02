import { NextRequest, NextResponse } from 'next/server'
import { requireTenantPermission } from '@/lib/partners/permissions'
import { supabaseAdmin } from '@/lib/supabase-admin'

const db = () => supabaseAdmin as any

export const dynamic = 'force-dynamic'

// GET: List messages for a session
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  try {
    const auth = await requireTenantPermission(request, 'designs:read')
    if (!auth.ok) return auth.response
    const tenant = auth.tenant
    const { sessionId } = await params

    // Verify session belongs to tenant
    const { data: session } = await db()
      .from('partner_design_sessions')
      .select('id')
      .eq('id', sessionId)
      .eq('tenant_id', tenant.id)
      .single()

    if (!session) {
      return NextResponse.json({ error: 'Sesion no encontrada' }, { status: 404 })
    }

    const { data, error } = await db()
      .from('partner_design_messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('[studio messages] list error:', error)
      return NextResponse.json({ messages: [] })
    }

    return NextResponse.json({ messages: data || [] })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// POST: Save a message
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  try {
    const auth = await requireTenantPermission(request, 'designs:write')
    if (!auth.ok) return auth.response
    const tenant = auth.tenant
    const { sessionId } = await params

    // Verify session belongs to tenant
    const { data: session } = await db()
      .from('partner_design_sessions')
      .select('id')
      .eq('id', sessionId)
      .eq('tenant_id', tenant.id)
      .single()

    if (!session) {
      return NextResponse.json({ error: 'Sesion no encontrada' }, { status: 404 })
    }

    const body = await request.json()

    const { error } = await db()
      .from('partner_design_messages')
      .insert({
        session_id: sessionId,
        tenant_id: tenant.id,
        role: body.role,
        content: body.content || '',
        image_url: body.image_url || null,
        attached_image_url: body.attached_image_url || null,
        type: body.type || 'text',
        style_applied: body.style_applied || null,
        style_name: body.style_name || null,
        prompt_used: body.prompt_used || null,
        garment_key: body.garment_key || null,
        moderation_status: body.moderation_status || 'passed',
        error: body.error || null,
      })

    if (error) {
      console.error('[studio messages] save error:', error)
      return NextResponse.json({ error: 'Error guardando mensaje' }, { status: 500 })
    }

    // Update session counters
    const imageUrl = body.image_url || null
    const updateData: any = {
      updated_at: new Date().toISOString(),
    }
    if (imageUrl) {
      updateData.last_image_url = imageUrl
    }

    // Increment message_count
    await db().rpc('increment_session_message_count', { sid: sessionId }).catch(() => {
      // Fallback: just update timestamp
    })

    await db()
      .from('partner_design_sessions')
      .update(updateData)
      .eq('id', sessionId)

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
