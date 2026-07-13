import { NextRequest, NextResponse } from 'next/server'
import { requireTenantPermission } from '@/lib/partners/permissions'
import { updateTenantResult } from '@/lib/partners/tenant'
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

    // custom_faqs is Pro only — el comentario decia "Pro only" pero nunca se
    // aplicaba, cualquier plan podia escribir FAQs personalizadas via la API.
    if ('custom_faqs' in updates && !PLAN_FEATURES[tenant.plan].customFaqs) {
      return NextResponse.json(
        { error: 'Las preguntas frecuentes personalizadas son una funcion Pro. Actualiza tu plan para usarlas.' },
        { status: 403 },
      )
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

    return NextResponse.json({ settings })
  } catch (error) {
    console.error('PUT /api/partners/settings error:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
