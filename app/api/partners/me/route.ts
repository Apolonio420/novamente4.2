import { NextRequest, NextResponse } from 'next/server'
import { getRequestTenant, resolveRequestUser } from '@/lib/partners/auth'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { CURRENT_TERMS_VERSION } from '@/lib/partners/terms-version'

export async function GET(request: NextRequest) {
  try {
    const result = await getRequestTenant(request)

    if (!result) {
      return NextResponse.json(
        { error: 'Se venció tu sesión. Volvé a entrar en /partners/login y seguí donde estabas.' },
        { status: 401 },
      )
    }

    const { tenant, userId } = result

    // Clickwrap: al ingresar el propio Partner a su workspace registramos la
    // aceptacion de la version vigente de T&C (una sola vez por version, se
    // conserva la fecha de la primera aceptacion). No aplica a administradores
    // de plataforma que visualizan tiendas ajenas. Best-effort: nunca rompe la
    // respuesta.
    try {
      const user = await resolveRequestUser(request)
      if (user && !user.isPlatformAdmin) {
        const admin = supabaseAdmin as any
        const { data: cur } = await admin
          .from('tenants')
          .select('terms_version')
          .eq('id', tenant.id)
          .single()
        if (cur && cur.terms_version !== CURRENT_TERMS_VERSION) {
          await admin
            .from('tenants')
            .update({
              terms_version: CURRENT_TERMS_VERSION,
              terms_accepted_at: new Date().toISOString(),
              terms_accepted_by: userId,
            })
            .eq('id', tenant.id)
        }
      }
    } catch (err) {
      console.error('terms acceptance record failed:', err)
    }

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
      isAdmin: ['apolonio@novamente.ar', 'sambu@novamente.ar', 'moishe@novamente.ar', 'izzaga@novamente.ar'].includes(tenant.email?.toLowerCase?.() || ''),
    })
  } catch (error) {
    console.error('GET /api/partners/me error:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
