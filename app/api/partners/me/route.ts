import { NextRequest, NextResponse } from 'next/server'
import { getRequestTenant } from '@/lib/partners/auth'

export async function GET(request: NextRequest) {
  try {
    const result = await getRequestTenant(request)

    if (!result) {
      return NextResponse.json(
        { error: 'No autenticado o sin tenant asociado' },
        { status: 401 },
      )
    }

    const { tenant } = result

    return NextResponse.json({
      tenant: {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        logo_url: tenant.logo_url,
        plan: tenant.plan,
        status: tenant.status,
        email: tenant.email,
      },
    })
  } catch (error) {
    console.error('GET /api/partners/me error:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
