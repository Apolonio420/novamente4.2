import { NextRequest, NextResponse } from 'next/server'
import { getRequestTenant } from '@/lib/partners/auth'
import { getUserTenantRole } from '@/lib/partners/tenant'
import {
  getDesignConfig,
  getAvailableStyles,
  getAvailableGarments,
  updateDesignConfig,
  validateDesignAccess,
} from '@/lib/partners/design-engine'
import type { Plan } from '@/lib/partners/types'

export async function GET(request: NextRequest) {
  try {
    const result = await getRequestTenant(request)
    if (!result) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { tenant } = result
    const config = await getDesignConfig(tenant.id)

    // Check access
    const access = validateDesignAccess(
      config.mode || tenant.design_engine_mode,
      tenant.plan as Plan,
      'config',
    )

    const styles = getAvailableStyles(config)
    const garments = getAvailableGarments(config)

    return NextResponse.json({
      config,
      styles,
      garments,
      access: access.allowed
        ? { allowed: true, mode: access.mode }
        : { allowed: false, reason: (access as any).reason },
      plan: tenant.plan,
      designEngineMode: tenant.design_engine_mode,
    })
  } catch (error: any) {
    console.error('GET /api/partners/design/config error:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const result = await getRequestTenant(request)
    if (!result) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { userId, tenant } = result

    // Only owner/operator can update config
    const role = await getUserTenantRole(tenant.id, userId)
    if (!role || role.role === 'viewer') {
      return NextResponse.json(
        { error: 'No tenes permisos para modificar la configuracion' },
        { status: 403 },
      )
    }

    const body = await request.json()

    // Whitelist allowed fields
    const allowed: Record<string, unknown> = {}
    if (body.palette !== undefined) allowed.palette = body.palette
    if (body.forbidden_colors !== undefined) allowed.forbidden_colors = body.forbidden_colors
    if (body.tone !== undefined) allowed.tone = body.tone
    if (body.preferred_background !== undefined) allowed.preferred_background = body.preferred_background
    if (body.logo_usage !== undefined) allowed.logo_usage = body.logo_usage
    if (body.supported_garments !== undefined) allowed.supported_garments = body.supported_garments
    if (body.supported_styles !== undefined) allowed.supported_styles = body.supported_styles
    if (body.custom_prompts !== undefined) allowed.custom_prompts = body.custom_prompts

    if (Object.keys(allowed).length === 0) {
      return NextResponse.json({ error: 'No se proporcionaron campos para actualizar' }, { status: 400 })
    }

    const updated = await updateDesignConfig(tenant.id, allowed)

    if (!updated) {
      return NextResponse.json({ error: 'No se pudo actualizar la configuracion' }, { status: 500 })
    }

    return NextResponse.json({ config: updated })
  } catch (error: any) {
    console.error('PUT /api/partners/design/config error:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
