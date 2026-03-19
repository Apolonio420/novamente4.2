import { type NextRequest, NextResponse } from 'next/server'
import { getTenantById } from '@/lib/partners/tenant'

export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const tenantId = url.searchParams.get('tenant_id')

  if (!tenantId) {
    return NextResponse.json({ error: 'tenant_id requerido' }, { status: 400 })
  }

  const tenant = await getTenantById(tenantId)
  if (!tenant) {
    return NextResponse.json({ error: 'Tenant no encontrado' }, { status: 404 })
  }

  return NextResponse.json({
    tenant: {
      name: tenant.name,
      plan: tenant.plan,
      status: tenant.status,
      storefront_published: tenant.storefront_published,
      onboarding_completed: tenant.onboarding_completed,
    },
  })
}
