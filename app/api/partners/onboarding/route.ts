import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { createTenant, updateTenant, addTenantUser, getTenantBySlug } from '@/lib/partners/tenant'
import { requireTenantPermission } from '@/lib/partners/permissions'

const db = () => supabaseAdmin as any

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

function generatePassword(): string {
  return crypto.randomBytes(12).toString('base64url')
}

/** A paid plan choice is not an entitlement until Mercado Pago confirms it. */
function canActivateOnboardingWithoutPayment(tenant: {
  plan: string
  metadata?: Record<string, unknown>
}): boolean {
  const pendingPlan = tenant.metadata?.pending_plan
  return tenant.plan === 'starter' && pendingPlan !== 'growth' && pendingPlan !== 'pro'
}

export async function POST(request: NextRequest) {
  let body: any = null
  try {
    body = await request.json()
    const { step, tenantId, data } = body

    if (!step) {
      console.error('[onboarding] 400 missing step', { body })
      return NextResponse.json({ error: 'Missing step field' }, { status: 400 })
    }

    // --- Step 1: Datos Básicos ---
    if (step === 1) {
      const { name, email, phone, country, currency, industry, website, instagram, description, seo_title, seo_description } = data || {}

      if (!name || !email) {
        console.error('[onboarding] 400 step=1 missing name/email', { hasName: !!name, hasEmail: !!email, dataKeys: Object.keys(data || {}) })
        return NextResponse.json({ error: 'name and email are required' }, { status: 400 })
      }

      // Generate slug, handle duplicates
      let slug = generateSlug(name)
      const existing = await getTenantBySlug(slug)
      if (existing) {
        const suffix = crypto.randomBytes(3).toString('hex')
        slug = `${slug}-${suffix}`
      }

      // Create tenant
      const tenant = await createTenant({
        slug,
        name,
        email,
        phone,
        industry,
        website,
        instagram,
        description,
        seo_title,
        seo_description,
      })

      if (!tenant) {
        return NextResponse.json({ error: 'Failed to create tenant' }, { status: 500 })
      }

      // Update country/currency if provided (createTenant doesn't accept these)
      if (country || currency) {
        await updateTenant(tenant.id, {
          ...(country ? { country } : {}),
          ...(currency ? { currency } : {}),
        })
      }

      // Create Supabase Auth user — handle duplicate emails
      const password = generatePassword()
      let userId: string

      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      })

      if (createError) {
        // If email already exists, look up the existing user
        if (createError.message?.includes('already') || createError.status === 422) {
          const { data: listData } = await supabaseAdmin.auth.admin.listUsers()
          const existingUser = listData?.users?.find((u: any) => u.email === email)

          if (!existingUser) {
            return NextResponse.json({ error: 'Email conflict but user not found' }, { status: 500 })
          }

          userId = existingUser.id

          // Link existing user to tenant
          await addTenantUser(tenant.id, userId, 'owner')

          return NextResponse.json({
            tenant: { id: tenant.id },
            credentials: { email, password: null, existing_user: true },
          })
        }

        return NextResponse.json({ error: `Failed to create user: ${createError.message}` }, { status: 500 })
      }

      userId = newUser.user.id

      // Link user to tenant as owner
      await addTenantUser(tenant.id, userId, 'owner')

      return NextResponse.json({
        tenant: { id: tenant.id },
        credentials: { email, password },
      })
    }

    // --- Step 2: Identidad Visual ---
    if (step === 2) {
      if (!tenantId) {
        console.error('[onboarding] 400 step=2 missing tenantId', { body })
        return NextResponse.json({ error: 'tenantId is required' }, { status: 400 })
      }

      // Step 1 is public account creation. Every later mutation must be made
      // by the owner of the tenant being onboarded; the body never selects an
      // arbitrary tenant outside the membership-validated active tenant.
      const auth = await requireTenantPermission(request, 'settings:write')
      if (!auth.ok) return auth.response
      if (auth.tenant.id !== tenantId) {
        return NextResponse.json({ error: 'Tenant no encontrado' }, { status: 404 })
      }

      const { logo_url, banner_url, primary_color, secondary_color, accent_color, font_preference, tagline, about_text, visual_style } = data || {}

      const updated = await updateTenant(auth.tenant.id, {
        logo_url,
        banner_url,
        primary_color,
        secondary_color,
        accent_color,
        font_preference,
        tagline,
        about_text,
        visual_style,
        onboarding_step: 2,
      })

      if (!updated) {
        return NextResponse.json({ error: 'Failed to update tenant branding' }, { status: 500 })
      }

      return NextResponse.json({ tenant: { id: auth.tenant.id } })
    }

    // --- Step 7: Plan ---
    if (step === 7) {
      if (!tenantId) {
        console.error('[onboarding] 400 step=7 missing tenantId', { body })
        return NextResponse.json({ error: 'tenantId is required' }, { status: 400 })
      }

      const auth = await requireTenantPermission(request, 'billing:manage')
      if (!auth.ok) return auth.response
      if (auth.tenant.id !== tenantId) {
        return NextResponse.json({ error: 'Tenant no encontrado' }, { status: 404 })
      }

      const { plan, billing_cycle } = data || {}

      if (!['starter', 'growth', 'pro'].includes(plan)) {
        console.error('[onboarding] 400 step=7 missing plan', { tenantId, dataKeys: Object.keys(data || {}) })
        return NextResponse.json({ error: 'plan inválido' }, { status: 400 })
      }
      if (billing_cycle && !['monthly', 'annual'].includes(billing_cycle)) {
        return NextResponse.json({ error: 'billing_cycle inválido' }, { status: 400 })
      }

      // A plan choice is not a paid entitlement. Persist it as pending until
      // Mercado Pago confirms payment through the subscription flow.
      const updated = await updateTenant(auth.tenant.id, {
        metadata: {
          ...((auth.tenant as any).metadata || {}),
          pending_plan: plan,
          ...(billing_cycle ? { pending_billing_cycle: billing_cycle } : {}),
        },
        onboarding_step: 7,
      })

      if (!updated) {
        return NextResponse.json({ error: 'Failed to update tenant plan' }, { status: 500 })
      }

      return NextResponse.json({ tenant: { id: auth.tenant.id } })
    }

    // --- Step 9: Brief (onboarding questionnaire) ---
    if (step === 9) {
      if (!tenantId) {
        console.error('[onboarding] 400 step=9 missing tenantId', { body })
        return NextResponse.json({ error: 'tenantId is required' }, { status: 400 })
      }

      const auth = await requireTenantPermission(request, 'settings:write')
      if (!auth.ok) return auth.response
      if (auth.tenant.id !== tenantId) {
        return NextResponse.json({ error: 'Tenant no encontrado' }, { status: 404 })
      }

      const { brief } = data || {}

      // Save brief fields — only set industry if not already populated (avoid overwriting detailed value from step 1)
      const { data: currentTenant } = await db()
        .from('tenants')
        .select('industry')
        .eq('id', auth.tenant.id)
        .single()

      const updates: Record<string, unknown> = {
        onboarding_step: 9,
        updated_at: new Date().toISOString(),
      }
      if (brief?.businessType && !currentTenant?.industry) updates.industry = brief.businessType
      if (brief?.designStyle) updates.visual_style = brief.designStyle

      const { data: updated, error: updateError } = await db()
        .from('tenants')
        .update(updates)
        .eq('id', auth.tenant.id)
        .select()
        .single()

      if (updateError || !updated) {
        console.error('Brief save error:', updateError)
        return NextResponse.json({ error: `Failed to save brief: ${updateError?.message || 'unknown'}` }, { status: 500 })
      }

      return NextResponse.json({ tenant: { id: auth.tenant.id } })
    }

    // --- Step 8: Activate ---
    if (step === 8) {
      if (!tenantId) {
        console.error('[onboarding] 400 step=8 missing tenantId', { body })
        return NextResponse.json({ error: 'tenantId is required' }, { status: 400 })
      }

      const auth = await requireTenantPermission(request, 'settings:write')
      if (!auth.ok) return auth.response
      if (auth.tenant.id !== tenantId) {
        return NextResponse.json({ error: 'Tenant no encontrado' }, { status: 404 })
      }
      if (!canActivateOnboardingWithoutPayment(auth.tenant)) {
        return NextResponse.json(
          { error: 'La activación del plan pago se realiza al confirmar Mercado Pago' },
          { status: 409 },
        )
      }

      const updates: Record<string, any> = {
        status: 'active',
        onboarding_completed: true,
        storefront_published: true,
        onboarding_step: 8,
      }

      const updated = await updateTenant(auth.tenant.id, updates)

      if (!updated) {
        return NextResponse.json({ error: 'Failed to activate tenant' }, { status: 500 })
      }

      return NextResponse.json({ tenant: { id: auth.tenant.id } })
    }

    console.error('[onboarding] 400 unknown step', { step, body })
    return NextResponse.json({ error: `Unknown step: ${step}` }, { status: 400 })
  } catch (error) {
    console.error('[onboarding] 500 unhandled error', { error, body })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
