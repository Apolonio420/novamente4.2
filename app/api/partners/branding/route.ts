import { NextRequest, NextResponse } from 'next/server'
import { getRequestTenant } from '@/lib/partners/auth'
import { updateTenant } from '@/lib/partners/tenant'
import { getPlanFeatures } from '@/lib/partners/plans'
import type { Plan } from '@/lib/partners/types'

const BRANDING_FIELDS = [
  'logo_url',
  'banner_url',
  'hero_url',
  'primary_color',
  'secondary_color',
  'accent_color',
  'font_preference',
  'tagline',
  'about_text',
  'cta_text',
  'cta_url',
  'visual_style',
] as const

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
      plan: tenant.plan,
      branding: {
        name: tenant.name,
        slug: tenant.slug,
        logo_url: tenant.logo_url,
        banner_url: tenant.banner_url,
        hero_url: tenant.hero_url,
        primary_color: tenant.primary_color,
        secondary_color: tenant.secondary_color,
        accent_color: tenant.accent_color,
        font_preference: tenant.font_preference,
        tagline: tenant.tagline,
        about_text: tenant.about_text,
        cta_text: tenant.cta_text,
        cta_url: tenant.cta_url,
        visual_style: tenant.visual_style,
      },
    })
  } catch (error) {
    console.error('GET /api/partners/branding error:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const result = await getRequestTenant(request)
    if (!result) {
      return NextResponse.json(
        { error: 'No autenticado o sin tenant asociado' },
        { status: 401 },
      )
    }

    const { tenant } = result
    const body = await request.json()
    const features = getPlanFeatures(tenant.plan as Plan)

    // Starter can only edit basic text fields; Growth+ gets full branding
    const STARTER_FIELDS = ['tagline', 'about_text', 'cta_text', 'cta_url'] as const
    const allowedFields = features.brandingFull ? BRANDING_FIELDS : STARTER_FIELDS

    // Whitelist: only allow branding fields
    const updates: Record<string, unknown> = {}
    for (const field of allowedFields) {
      if (field in body) {
        updates[field] = body[field]
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'No se enviaron campos de branding validos' },
        { status: 400 },
      )
    }

    const updated = await updateTenant(tenant.id, updates)

    if (!updated) {
      return NextResponse.json(
        { error: 'No se pudo actualizar el branding' },
        { status: 500 },
      )
    }

    return NextResponse.json({
      branding: {
        name: updated.name,
        slug: updated.slug,
        logo_url: updated.logo_url,
        banner_url: updated.banner_url,
        hero_url: updated.hero_url,
        primary_color: updated.primary_color,
        secondary_color: updated.secondary_color,
        accent_color: updated.accent_color,
        font_preference: updated.font_preference,
        tagline: updated.tagline,
        about_text: updated.about_text,
        cta_text: updated.cta_text,
        cta_url: updated.cta_url,
        visual_style: updated.visual_style,
      },
    })
  } catch (error) {
    console.error('PUT /api/partners/branding error:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
