import { NextRequest, NextResponse } from 'next/server'
import { getTenantBySlug } from '@/lib/partners/tenant'
import { createLead, countLeadsThisMonth } from '@/lib/partners/leads'
import { getPlanFeatures } from '@/lib/partners/plans'
import { isPartnersCrmEnabled } from '@/lib/partners/feature-flags'

export async function POST(request: NextRequest) {
  if (!isPartnersCrmEnabled()) {
    return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
  }

  try {
    const body = await request.json()
    const { slug, name, email, phone, message, product_interest } = body

    if (!slug) {
      return NextResponse.json({ error: 'slug requerido' }, { status: 400 })
    }

    if (!name && !email && !phone) {
      return NextResponse.json({ error: 'Al menos un dato de contacto es requerido' }, { status: 400 })
    }

    const tenant = await getTenantBySlug(slug)
    if (!tenant || tenant.status !== 'active') {
      return NextResponse.json({ error: 'Partner no encontrado' }, { status: 404 })
    }

    // Check lead limit
    const features = getPlanFeatures(tenant.plan)
    const currentCount = await countLeadsThisMonth(tenant.id)
    if (currentCount >= features.maxLeadsPerMonth) {
      return NextResponse.json({ error: 'Límite de leads alcanzado para este mes' }, { status: 429 })
    }

    const lead = await createLead(tenant.id, {
      name,
      email,
      phone,
      message,
      source: 'storefront',
      product_interest,
    })

    if (!lead) {
      return NextResponse.json({ error: 'Error al guardar el contacto' }, { status: 500 })
    }

    // Non-blocking Telegram notification
    import('@/lib/notifications').then(({ notifyNewLead }) =>
      notifyNewLead({
        tenantName: tenant.name,
        tenantSlug: tenant.slug,
        leadName: name,
        leadEmail: email,
        leadPhone: phone,
        message,
      })
    ).catch(e => console.error('Telegram lead notification failed:', e))

    return NextResponse.json({ success: true, leadId: lead.id })
  } catch (error) {
    console.error('Lead creation error:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
