import { NextRequest, NextResponse } from 'next/server'
import { requireTenantPermission } from '@/lib/partners/permissions'
import { supabaseAdmin } from '@/lib/supabase-admin'

const db = () => supabaseAdmin as any

export const dynamic = 'force-dynamic'

// GET: Get session detail
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  try {
    const auth = await requireTenantPermission(request, 'designs:read')
    if (!auth.ok) return auth.response
    const tenant = auth.tenant
    const { sessionId } = await params

    const { data, error } = await db()
      .from('partner_design_sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('tenant_id', tenant.id)
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'Sesion no encontrada' }, { status: 404 })
    }

    return NextResponse.json({ session: data })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// DELETE: Delete session and its messages
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  try {
    const auth = await requireTenantPermission(request, 'designs:write')
    if (!auth.ok) return auth.response
    const tenant = auth.tenant
    const { sessionId } = await params

    // Verify ownership
    const { data: session } = await db()
      .from('partner_design_sessions')
      .select('id')
      .eq('id', sessionId)
      .eq('tenant_id', tenant.id)
      .single()

    if (!session) {
      return NextResponse.json({ error: 'Sesion no encontrada' }, { status: 404 })
    }

    // Delete messages first (cascade should handle this but be explicit)
    await db()
      .from('partner_design_messages')
      .delete()
      .eq('session_id', sessionId)

    await db()
      .from('partner_design_sessions')
      .delete()
      .eq('id', sessionId)

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
