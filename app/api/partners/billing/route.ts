import { NextRequest, NextResponse } from 'next/server'
import { getRequestTenant } from '@/lib/partners/auth'
import { updateTenant } from '@/lib/partners/tenant'
import { PLAN_FEATURES, PLAN_PRICING_USD } from '@/lib/partners/plans'
import type { Plan } from '@/lib/partners/types'

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

    // Calculate next billing date (subscription_started_at + 1 month, rolling)
    let nextBillingDate: string | null = null
    const startedAt = (tenant as any).subscription_started_at as string | null
    if (startedAt && tenant.plan !== 'starter') {
      const start = new Date(startedAt)
      const now = new Date()
      // Roll forward month by month until we find the next billing date
      const next = new Date(start)
      while (next <= now) {
        next.setMonth(next.getMonth() + 1)
      }
      nextBillingDate = next.toISOString()
    }

    return NextResponse.json({
      plan: tenant.plan,
      status: tenant.status,
      subscription_started_at: startedAt || null,
      billing_cycle: (tenant as any).billing_cycle || (tenant.plan !== 'starter' ? 'monthly' : null),
      next_billing_date: nextBillingDate,
      price_usd: PLAN_PRICING_USD[tenant.plan],
      tenant_id: tenant.id,
    })
  } catch (error) {
    console.error('GET /api/partners/billing error:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
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
    const { action } = body

    if (action === 'downgrade') {
      const targetPlan = body.plan as Plan
      if (!targetPlan || !PLAN_FEATURES[targetPlan]) {
        return NextResponse.json(
          { error: 'Plan invalido' },
          { status: 400 },
        )
      }

      const planOrder: Plan[] = ['starter', 'growth', 'pro']
      const currentIndex = planOrder.indexOf(tenant.plan)
      const targetIndex = planOrder.indexOf(targetPlan)

      if (targetIndex >= currentIndex) {
        return NextResponse.json(
          { error: 'Solo se puede hacer downgrade a un plan inferior' },
          { status: 400 },
        )
      }

      const features = PLAN_FEATURES[targetPlan]
      const updates: Record<string, any> = {
        plan: targetPlan,
        max_products: features.maxProducts,
        max_leads_per_month: features.maxLeadsPerMonth,
        seo_indexable: features.seoIndexable,
        design_engine_mode: features.designEngine,
      }

      // If downgrading to starter, clear subscription date
      if (targetPlan === 'starter') {
        updates.subscription_started_at = null
      }

      const updated = await updateTenant(tenant.id, updates)
      if (!updated) {
        return NextResponse.json(
          { error: 'Error al actualizar el plan' },
          { status: 500 },
        )
      }

      // Recalculate next billing
      let nextBillingDate: string | null = null
      const startedAt = (updated as any).subscription_started_at as string | null
      if (startedAt && updated.plan !== 'starter') {
        const start = new Date(startedAt)
        const now = new Date()
        const next = new Date(start)
        while (next <= now) {
          next.setMonth(next.getMonth() + 1)
        }
        nextBillingDate = next.toISOString()
      }

      return NextResponse.json({
        plan: updated.plan,
        status: updated.status,
        subscription_started_at: startedAt || null,
        billing_cycle: updated.plan !== 'starter' ? 'monthly' : null,
        next_billing_date: nextBillingDate,
        price_usd: PLAN_PRICING_USD[updated.plan],
        tenant_id: updated.id,
      })
    }

    if (action === 'cancel') {
      if (tenant.plan === 'starter') {
        return NextResponse.json(
          { error: 'No hay suscripcion activa para cancelar' },
          { status: 400 },
        )
      }

      const updated = await updateTenant(tenant.id, {
        status: 'paused',
      })

      if (!updated) {
        return NextResponse.json(
          { error: 'Error al cancelar la suscripcion' },
          { status: 500 },
        )
      }

      const startedAt = (updated as any).subscription_started_at as string | null
      let nextBillingDate: string | null = null
      if (startedAt) {
        const start = new Date(startedAt)
        const now = new Date()
        const next = new Date(start)
        while (next <= now) {
          next.setMonth(next.getMonth() + 1)
        }
        nextBillingDate = next.toISOString()
      }

      return NextResponse.json({
        plan: updated.plan,
        status: updated.status,
        subscription_started_at: startedAt || null,
        billing_cycle: updated.plan !== 'starter' ? 'monthly' : null,
        next_billing_date: nextBillingDate,
        price_usd: PLAN_PRICING_USD[updated.plan],
        tenant_id: updated.id,
      })
    }

    return NextResponse.json(
      { error: 'Accion no reconocida. Usa "downgrade" o "cancel".' },
      { status: 400 },
    )
  } catch (error) {
    console.error('POST /api/partners/billing error:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
