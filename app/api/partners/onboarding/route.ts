import { NextRequest, NextResponse } from 'next/server'
import { createTenant, updateTenant, addTenantUser } from '@/lib/partners/tenant'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { step, tenantId, data } = body

    // Step 1: Create tenant
    if (step === 1) {
      const { name, email, phone, country, currency, industry, website, instagram, description, seo_title, seo_description } = data

      if (!name || !email) {
        return NextResponse.json({ error: 'Nombre y email son requeridos' }, { status: 400 })
      }

      // Generate slug from name
      const slug = name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')

      // Smart defaults for SEO fields
      const finalSeoTitle = (seo_title || `${name} — Merch oficial en Novamente`).slice(0, 60)
      const finalSeoDesc = (seo_description || description || `Descubri los productos de ${name} en Novamente.`).slice(0, 160)

      const tenant = await createTenant({
        slug,
        name,
        email,
        phone,
        industry,
        website,
        instagram,
        description,
        seo_title: finalSeoTitle,
        seo_description: finalSeoDesc,
      })

      if (!tenant) {
        return NextResponse.json({ error: 'Error al crear partner. El slug puede estar en uso.' }, { status: 400 })
      }

      // If user is authenticated, link them as owner
      const authHeader = request.headers.get('authorization')
      if (authHeader) {
        const token = authHeader.replace('Bearer ', '')
        const { data: userData } = await supabaseAdmin.auth.getUser(token)
        if (userData?.user) {
          await addTenantUser(tenant.id, userData.user.id, 'owner')
        }
      }

      return NextResponse.json({ tenant })
    }

    // Steps 2-8: Update existing tenant
    if (!tenantId) {
      return NextResponse.json({ error: 'tenantId requerido para pasos 2-8' }, { status: 400 })
    }

    const updates: Record<string, unknown> = { onboarding_step: step }

    switch (step) {
      case 2: // Identity
        if (data.logo_url) updates.logo_url = data.logo_url
        if (data.banner_url) updates.banner_url = data.banner_url
        if (data.primary_color) updates.primary_color = data.primary_color
        if (data.secondary_color) updates.secondary_color = data.secondary_color
        if (data.accent_color) updates.accent_color = data.accent_color
        break

      case 3: // Partner type
        if (data.design_engine_mode) updates.design_engine_mode = data.design_engine_mode
        break

      case 4: // Visual style
        if (data.visual_style) updates.visual_style = data.visual_style
        break

      case 5: // Catalog (handled separately via catalog API)
        break

      case 6: // Commerce
        if (data.commerce_mode) updates.commerce_mode = data.commerce_mode
        if (data.cta_text) updates.cta_text = data.cta_text
        if (data.cta_url) updates.cta_url = data.cta_url
        break

      case 7: // Plan selection
        if (data?.plan) updates.plan = data.plan
        break

      case 8: // Publish / activate
        if (data?.plan) updates.plan = data.plan
        // Only activate immediately for starter plan — paid plans activate via webhook
        const plan = data?.plan || 'starter'
        if (plan === 'starter') {
          updates.onboarding_completed = true
          updates.storefront_published = true
          updates.status = 'active'
        } else {
          // For paid plans, mark onboarding complete but leave inactive until payment
          updates.onboarding_completed = true
          updates.status = 'onboarding' // stays in onboarding until payment confirmed
        }
        break
    }

    const updated = await updateTenant(tenantId, updates as any)
    if (!updated) {
      return NextResponse.json({ error: 'Error al actualizar' }, { status: 500 })
    }

    return NextResponse.json({ tenant: updated })
  } catch (error) {
    console.error('Onboarding error:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
