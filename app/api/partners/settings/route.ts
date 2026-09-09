import { NextRequest, NextResponse } from 'next/server'
import { requireTenantPermission } from '@/lib/partners/permissions'
import { updateTenantResult } from '@/lib/partners/tenant'
import { normalizeIndustry, isIndustrySlug } from '@/lib/partners/industry'
import { PLAN_FEATURES } from '@/lib/partners/plans'

const SETTINGS_FIELDS = [
  'name', 'slug', 'email', 'phone', 'website', 'instagram',
  'industry', 'country', 'currency',
  'commerce_mode', 'storefront_published',
  'plan', 'status',
  'max_products', 'max_leads_per_month',
  'seo_indexable', 'seo_title', 'seo_description',
  'custom_faqs',
  'bank_cbu', 'bank_alias',
  'onboarding_dismissed_business_model',
] as const

const WRITABLE_FIELDS = [
  'name', 'email', 'phone', 'website', 'instagram',
  'industry', 'country', 'currency',
  'commerce_mode', 'storefront_published',
  'seo_title', 'seo_description',
  'custom_faqs',
  'bank_cbu', 'bank_alias',
  'onboarding_dismissed_business_model',
] as const

export async function GET(request: NextRequest) {
  try {
    const auth = await requireTenantPermission(request, 'settings:read')
    if (!auth.ok) return auth.response
    const tenant = auth.tenant

    const settings: Record<string, any> = {}
    for (const field of SETTINGS_FIELDS) {
      settings[field] = (tenant as any)[field] ?? null
    }

    // Texto libre original del partner (ver lib/partners/industry.ts) — el
    // form de Configuracion lo usa para prellenar el campo industry sin
    // pisarlo con el slug normalizado en un guardado que no lo toca.
    const rawIndustryMeta = (tenant as any).metadata?.industry_raw
    settings.industry_raw = typeof rawIndustryMeta === 'string' ? rawIndustryMeta : null

    // Bank details are owner-only. Operators/viewers must not see them.
    if (auth.role !== 'owner') {
      settings.bank_cbu = null
      settings.bank_alias = null
    }

    return NextResponse.json({ settings })
  } catch (error) {
    console.error('GET /api/partners/settings error:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Owner-only: settings include bank details (changing them would redirect
    // withdrawals) and other tenant configuration.
    const auth = await requireTenantPermission(request, 'settings:write')
    if (!auth.ok) return auth.response
    const tenant = auth.tenant
    const body = await request.json()

    // Build whitelisted updates
    const updates: Record<string, any> = {}

    for (const field of WRITABLE_FIELDS) {
      if (field in body) {
        updates[field] = body[field]
      }
    }

    // Guard: una cuenta SUSPENDIDA (fraude/abuso — la única suspensión que
    // queda; el impago ya no suspende, degrada a Starter, ver cron
    // check-subscriptions) no puede republicarse a si misma. Sin esto el
    // partner podia esquivar la suspension con un PUT directo a este endpoint
    // aunque el UI no le ofrezca el boton.
    if (updates.storefront_published === true && tenant.status === 'suspended') {
      return NextResponse.json(
        { error: 'Tu cuenta está suspendida. Contactanos para reactivarla.' },
        { status: 403 },
      )
    }

    // `metadata` es JSON y tambien guarda datos de suscripcion (pending_plan,
    // subscription_type, last_mp_payment_id, etc. — camino de plata): SIEMPRE
    // read-modify-write, nunca pisar el objeto entero. Ambos bloques de abajo
    // acumulan sobre `metadataPatch` para no pisarse entre si si el mismo
    // request toca storefront_published E industry.
    const currentMetadata = ((tenant as any).metadata ?? {}) as Record<string, unknown>
    let metadataPatch: Record<string, unknown> | null = null

    // Marca/limpia el apagado manual del storefront. computeAutoPublishUpdates
    // (lib/partners/auto-publish.ts) respeta esta marca para no volver a
    // prender sola una tienda que el partner apago a proposito.
    if ('storefront_published' in updates) {
      if (updates.storefront_published === false && tenant.storefront_published === true) {
        metadataPatch = { ...(metadataPatch ?? currentMetadata), storefront_hidden_manually: true }
      } else if (updates.storefront_published === true && currentMetadata.storefront_hidden_manually) {
        const { storefront_hidden_manually: _drop, ...rest } = (metadataPatch ?? currentMetadata)
        metadataPatch = rest
      }
    }

    // `industry` — el form de Configuración manda ahora el slug directo
    // (selector sobre INDUSTRY_CATEGORIES, ver app/workspace/settings/page.tsx)
    // más un `industry_raw` aparte con el matiz descriptivo ("Contanos más").
    // Si `industry` ya es un slug válido se respeta tal cual — renormalizar
    // un slug ya canónico no está garantizado a sobrevivir el fold+match de
    // normalizeIndustry (pensado para texto libre, no para sus propias
    // salidas). Texto libre (llamadas viejas que no separan industry_raw)
    // sigue normalizándose igual que antes.
    if ('industry' in updates) {
      const incomingIndustry = updates.industry
      const rawIndustry = typeof incomingIndustry === 'string' ? incomingIndustry.trim() : ''
      updates.industry = isIndustrySlug(incomingIndustry)
        ? incomingIndustry
        : normalizeIndustry(incomingIndustry)

      // Compat: si el body no manda industry_raw aparte, preserva el
      // comportamiento previo — guardar el texto libre de `industry` en
      // metadata cuando no era ya un slug, para no perder matiz descriptivo
      // (lo usan los generadores de copy con IA) en llamadas que todavía
      // mandan solo `industry` como texto libre.
      if (!('industry_raw' in body) && rawIndustry && !isIndustrySlug(incomingIndustry)) {
        metadataPatch = { ...(metadataPatch ?? currentMetadata), industry_raw: rawIndustry }
      }
    }

    // industry_raw explícito manda sobre el fallback de arriba: "" limpia
    // metadata.industry_raw, texto no vacío lo setea (trim + max 160).
    if ('industry_raw' in body) {
      const rawFromBody = typeof body.industry_raw === 'string' ? body.industry_raw.trim().slice(0, 160) : ''
      metadataPatch = { ...(metadataPatch ?? currentMetadata), industry_raw: rawFromBody }
    }

    if (metadataPatch) {
      updates.metadata = metadataPatch
    }

    // Special handling for status transitions (only active <-> paused)
    if ('status' in body) {
      const currentStatus = tenant.status
      const requestedStatus = body.status

      if (
        (requestedStatus === 'paused' && currentStatus === 'active') ||
        (requestedStatus === 'active' && currentStatus === 'paused')
      ) {
        updates.status = requestedStatus
      }
      // Any other status transition is silently ignored
    }

    // Truncate SEO fields to max length
    if (typeof updates.seo_title === 'string') {
      updates.seo_title = updates.seo_title.slice(0, 60)
    }
    if (typeof updates.seo_description === 'string') {
      updates.seo_description = updates.seo_description.slice(0, 160)
    }

    // Validate bank_cbu: exactly 22 numeric digits or null
    if ('bank_cbu' in updates) {
      if (updates.bank_cbu === null || updates.bank_cbu === '') {
        updates.bank_cbu = null
      } else if (typeof updates.bank_cbu === 'string' && /^\d{22}$/.test(updates.bank_cbu)) {
        // valid
      } else {
        return NextResponse.json({ error: 'CBU inválido: debe tener exactamente 22 dígitos numéricos' }, { status: 400 })
      }
    }

    // Validate bank_alias: letters, numbers, dot, hyphen
    if ('bank_alias' in updates) {
      if (updates.bank_alias === null || updates.bank_alias === '') {
        updates.bank_alias = null
      } else if (typeof updates.bank_alias === 'string' && /^[a-zA-Z0-9.\-]{1,50}$/.test(updates.bank_alias)) {
        // valid
      } else {
        return NextResponse.json({ error: 'Alias inválido: solo letras, números, punto y guion (máx 50 caracteres)' }, { status: 400 })
      }
    }

    // custom_faqs es Pro-only, pero el panel manda el campo aunque el partner
    // no lo haya tocado (y rechazar el request COMPLETO por eso dejaba a todo
    // plan no-Pro sin poder guardar NADA en Configuración). Solo se rechaza un
    // alta/edición real: si viene igual a lo guardado se ignora el campo, y
    // vaciar FAQs heredadas siempre está permitido.
    if ('custom_faqs' in updates && !PLAN_FEATURES[tenant.plan].customFaqs) {
      const stored = (tenant as any).custom_faqs ?? null
      const incoming = Array.isArray(updates.custom_faqs) && updates.custom_faqs.length > 0
        ? updates.custom_faqs
        : null
      if (JSON.stringify(incoming) === JSON.stringify(stored)) {
        delete updates.custom_faqs
      } else if (incoming === null) {
        updates.custom_faqs = null
      } else {
        return NextResponse.json(
          { error: 'Las preguntas frecuentes personalizadas son una funcion Pro. Actualiza tu plan para usarlas.' },
          { status: 403 },
        )
      }
    }

    // Validate custom_faqs (max 10 entries, Pro only)
    if ('custom_faqs' in updates) {
      if (Array.isArray(updates.custom_faqs)) {
        updates.custom_faqs = updates.custom_faqs
          .slice(0, 10)
          .filter((f: any) => f?.question && f?.answer)
          .map((f: any) => ({ question: String(f.question), answer: String(f.answer) }))
      } else {
        updates.custom_faqs = null
      }
    }

    // Explicitly block plan and slug changes
    delete updates.plan
    delete updates.slug

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ settings: tenant })
    }

    const { data: updated, error: updateError } = await updateTenantResult(tenant.id, updates)

    if (!updated) {
      // Surface WHAT failed instead of an opaque 500 — a missing column shows up
      // as PGRST204 / "...schema cache". Logged loudly so it never hides again.
      const missingColumn =
        updateError?.code === 'PGRST204' ||
        /column .* (does not exist|schema cache)/i.test(updateError?.message || '')
      console.error('[settings] PUT save failed', {
        tenantId: tenant.id,
        fields: Object.keys(updates),
        code: updateError?.code,
        message: updateError?.message,
      })
      return NextResponse.json(
        {
          error: 'No se pudieron guardar los cambios',
          detail: updateError?.message,
          code: updateError?.code,
          ...(missingColumn && { hint: 'missing_column' }),
        },
        { status: 500 },
      )
    }

    // Return the same shape as GET
    const settings: Record<string, any> = {}
    for (const field of SETTINGS_FIELDS) {
      settings[field] = (updated as any)[field] ?? null
    }
    const rawIndustryMeta = (updated as any).metadata?.industry_raw
    settings.industry_raw = typeof rawIndustryMeta === 'string' ? rawIndustryMeta : null

    return NextResponse.json({ settings })
  } catch (error) {
    console.error('PUT /api/partners/settings error:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
