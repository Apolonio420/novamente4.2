import { NextRequest, NextResponse } from 'next/server'
import { resolveRequestUser, resolveActiveTenant } from '@/lib/partners/permissions'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { CURRENT_TERMS_VERSION } from '@/lib/partners/terms-version'

// El 401 casi siempre es una sesión vencida, no una cuenta rota.
const SESSION_EXPIRED_MESSAGE = 'Se venció tu sesión. Volvé a entrar en /partners/login y seguí donde estabas.'
// Sesión válida, pero sin membership aceptada en ningún tenant — distinto de
// una sesión vencida. Antes esto también devolvía 401 con el texto de
// arriba, lo que hacía pensar al partner que su cuenta estaba rota cuando en
// realidad nunca tuvo (o todavía no aceptó) una tienda (bug reportado 08/10:
// app/workspace/layout.tsx tragaba el error y mostraba un workspace vacío).
const NO_TENANT_MESSAGE =
  'Tu usuario todavía no tiene una tienda asociada. Si te invitaron, aceptá la invitación desde el mail; si no, escribinos por WhatsApp.'
// x-tenant-id apunta a un tenant del que el usuario ya no es miembro (ej. una
// selección vieja en localStorage después de que lo sacaron del equipo).
const TENANT_NOT_ALLOWED_MESSAGE = 'No tenés acceso a esa tienda.'

export async function GET(request: NextRequest) {
  try {
    const user = await resolveRequestUser(request)
    if (!user) {
      return NextResponse.json(
        { error: SESSION_EXPIRED_MESSAGE, code: 'SESSION_EXPIRED' },
        { status: 401 },
      )
    }

    const resolution = await resolveActiveTenant(request, user)

    if (resolution.kind === 'no_membership') {
      return NextResponse.json({ error: NO_TENANT_MESSAGE, code: 'NO_TENANT' }, { status: 403 })
    }
    if (resolution.kind === 'forbidden_tenant') {
      return NextResponse.json(
        { error: TENANT_NOT_ALLOWED_MESSAGE, code: 'TENANT_NOT_ALLOWED' },
        { status: 404 },
      )
    }

    const { tenant } = resolution

    // Clickwrap: al ingresar el propio Partner a su workspace registramos la
    // aceptacion de la version vigente de T&C (una sola vez por version, se
    // conserva la fecha de la primera aceptacion). No aplica a administradores
    // de plataforma que visualizan tiendas ajenas. Best-effort: nunca rompe la
    // respuesta.
    try {
      if (!user.isPlatformAdmin) {
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
              terms_accepted_by: user.userId,
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
