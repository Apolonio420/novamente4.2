import { NextRequest, NextResponse } from 'next/server'
import { requireTenantPermission } from '@/lib/partners/permissions'
import { getUserTenantRole } from '@/lib/partners/tenant'
import {
  getDesignConfig,
  getAvailableStyles,
  getAvailableGarments,
  updateDesignConfig,
  validateDesignAccess,
  resolveDesignEngineMode,
} from '@/lib/partners/design-engine'
import { getAllPublicGarmentPricing } from '@/lib/partners/garment-pricing.server'
import type { Plan } from '@/lib/partners/types'

// Plan del tenant puede venir en variantes (mayusculas, etc.) — normalizar al
// tipo que espera el pricing engine, igual que ya hacian los componentes cliente.
function normalizePricingPlan(plan: string | null | undefined): 'starter' | 'growth' | 'pro' {
  const p = (plan || '').toLowerCase()
  if (p === 'pro') return 'pro'
  if (p === 'growth') return 'growth'
  return 'starter'
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireTenantPermission(request, 'designs:read')
    if (!auth.ok) return auth.response
    const tenant = auth.tenant
    const config = await getDesignConfig(tenant.id)

    // Check access
    const access = validateDesignAccess(
      resolveDesignEngineMode(tenant),
      tenant.plan as Plan,
      'config',
    )

    const styles = getAvailableStyles(config)
    const garments = getAvailableGarments(config)

    // Precios ya derivados por plan (sin `cost` crudo, ver hallazgo [1] del
    // review de 2026-07-03 — INNEGOCIABLE que el costo de produccion viaje al bundle).
    const pricing = getAllPublicGarmentPricing(normalizePricingPlan(tenant.plan))

    return NextResponse.json({
      config,
      styles,
      garments,
      pricing,
      access: access.allowed
        ? { allowed: true, mode: access.mode }
        : { allowed: false, reason: (access as any).reason },
      plan: tenant.plan,
      designEngineMode: resolveDesignEngineMode(tenant),
    })
  } catch (error: any) {
    console.error('GET /api/partners/design/config error:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await requireTenantPermission(request, 'designs:write')
    if (!auth.ok) return auth.response
    const tenant = auth.tenant
    const userId = auth.userId

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
