import { NextRequest, NextResponse } from 'next/server'
import { requireTenantPermission } from '@/lib/partners/permissions'
import { getPlanFeatures } from '@/lib/partners/plans'
import { supabaseAdmin } from '@/lib/supabase-admin'

/**
 * GET /api/partners/meta-business
 * Returns the tenant's Meta Business setup progress and pixel ID.
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await requireTenantPermission(request, 'marketing:read')
    if (!auth.ok) return auth.response
    const tenant = auth.tenant
    const features = getPlanFeatures(tenant.plan)

    if (!features.metaBusinessSetup) {
      return NextResponse.json(
        { error: 'Meta Business Setup requiere plan Pro', plan: tenant.plan },
        { status: 403 },
      )
    }

    // These fields may exist on the DB row but not on the Tenant type yet
    const tenantAny = tenant as unknown as Record<string, unknown>

    return NextResponse.json({
      meta_pixel_id: tenantAny.meta_pixel_id ?? null,
      meta_setup_progress: tenantAny.meta_setup_progress ?? {
        pixel_installed: false,
        facebook_page: false,
        instagram_business: false,
        business_suite: false,
        product_catalog: false,
      },
      plan: tenant.plan,
    })
  } catch (error) {
    console.error('GET /api/partners/meta-business error:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

/**
 * PATCH /api/partners/meta-business
 * Update Meta Business setup progress and/or pixel ID.
 * Body: { meta_pixel_id?: string, meta_setup_progress?: object }
 */
export async function PATCH(request: NextRequest) {
  try {
    const auth = await requireTenantPermission(request, 'marketing:write')
    if (!auth.ok) return auth.response
    const tenant = auth.tenant
    const features = getPlanFeatures(tenant.plan)

    if (!features.metaBusinessSetup) {
      return NextResponse.json(
        { error: 'Meta Business Setup requiere plan Pro', plan: tenant.plan },
        { status: 403 },
      )
    }

    const body = await request.json()
    const updates: Record<string, unknown> = {}

    // Validate and set pixel ID
    if (body.meta_pixel_id !== undefined) {
      const pixelId = String(body.meta_pixel_id).trim()
      if (pixelId && !/^\d+$/.test(pixelId)) {
        return NextResponse.json(
          { error: 'El Pixel ID debe ser numerico' },
          { status: 400 },
        )
      }
      updates.meta_pixel_id = pixelId || null
    }

    // Validate and set progress
    if (body.meta_setup_progress !== undefined) {
      const progress = body.meta_setup_progress
      if (typeof progress !== 'object' || progress === null) {
        return NextResponse.json(
          { error: 'meta_setup_progress debe ser un objeto' },
          { status: 400 },
        )
      }
      // Only allow known keys
      const allowed = ['pixel_installed', 'facebook_page', 'instagram_business', 'business_suite', 'product_catalog']
      const sanitized: Record<string, boolean> = {}
      for (const key of allowed) {
        if (key in progress) {
          sanitized[key] = Boolean(progress[key])
        }
      }
      updates.meta_setup_progress = sanitized
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No hay campos para actualizar' }, { status: 400 })
    }

    updates.updated_at = new Date().toISOString()

    const { error: dbError } = await supabaseAdmin
      .from('tenants')
      .update(updates as never)
      .eq('id', tenant.id)

    if (dbError) {
      console.error('PATCH meta-business DB error:', dbError)
      return NextResponse.json({ error: 'Error al guardar' }, { status: 500 })
    }

    return NextResponse.json({ ok: true, ...updates })
  } catch (error) {
    console.error('PATCH /api/partners/meta-business error:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
