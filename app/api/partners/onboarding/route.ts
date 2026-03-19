import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { createTenant, updateTenant, addTenantUser, getTenantBySlug } from '@/lib/partners/tenant'

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

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { step, tenantId, data } = body

    if (!step) {
      return NextResponse.json({ error: 'Missing step field' }, { status: 400 })
    }

    // --- Step 1: Datos Básicos ---
    if (step === 1) {
      const { name, email, phone, country, currency, industry, website, instagram, description, seo_title, seo_description } = data || {}

      if (!name || !email) {
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
        return NextResponse.json({ error: 'tenantId is required' }, { status: 400 })
      }

      const { logo_url, banner_url, primary_color, secondary_color, accent_color, font_preference, tagline, about_text } = data || {}

      const updated = await updateTenant(tenantId, {
        logo_url,
        banner_url,
        primary_color,
        secondary_color,
        accent_color,
        font_preference,
        tagline,
        about_text,
        onboarding_step: 2,
      })

      if (!updated) {
        return NextResponse.json({ error: 'Failed to update tenant branding' }, { status: 500 })
      }

      return NextResponse.json({ tenant: { id: tenantId } })
    }

    // --- Step 7: Plan ---
    if (step === 7) {
      if (!tenantId) {
        return NextResponse.json({ error: 'tenantId is required' }, { status: 400 })
      }

      const { plan } = data || {}

      if (!plan) {
        return NextResponse.json({ error: 'plan is required' }, { status: 400 })
      }

      const updated = await updateTenant(tenantId, {
        plan,
        onboarding_step: 7,
      })

      if (!updated) {
        return NextResponse.json({ error: 'Failed to update tenant plan' }, { status: 500 })
      }

      return NextResponse.json({ tenant: { id: tenantId } })
    }

    // --- Step 8: Activate ---
    if (step === 8) {
      if (!tenantId) {
        return NextResponse.json({ error: 'tenantId is required' }, { status: 400 })
      }

      const updates: Record<string, any> = {
        status: 'active',
        onboarding_completed: true,
        storefront_published: true,
        onboarding_step: 8,
      }

      if (data?.plan) {
        updates.plan = data.plan
      }

      const updated = await updateTenant(tenantId, updates)

      if (!updated) {
        return NextResponse.json({ error: 'Failed to activate tenant' }, { status: 500 })
      }

      return NextResponse.json({ tenant: { id: tenantId } })
    }

    return NextResponse.json({ error: `Unknown step: ${step}` }, { status: 400 })
  } catch (error) {
    console.error('Onboarding API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
