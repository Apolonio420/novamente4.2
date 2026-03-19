import { type NextRequest, NextResponse } from 'next/server'
import { MercadoPagoConfig, Preference } from 'mercadopago'
import { updateTenant, getTenantById } from '@/lib/partners/tenant'
import { PLAN_PRICING_USD, PLAN_PRICING_ANNUAL_USD, PLAN_NAMES } from '@/lib/partners/plans'
import { getUsdToArs } from '@/lib/partners/currency'
import type { Plan } from '@/lib/partners/types'

const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN!,
})

type BillingCycle = 'monthly' | 'annual'

function calculateExpiresAt(billingCycle: BillingCycle): string {
  const now = new Date()
  if (billingCycle === 'annual') {
    now.setFullYear(now.getFullYear() + 1)
  } else {
    now.setMonth(now.getMonth() + 1)
  }
  return now.toISOString()
}

export async function POST(request: NextRequest) {
  try {
    const { tenantId, plan, billingCycle = 'monthly' } = await request.json()

    if (!tenantId || !plan) {
      return NextResponse.json(
        { error: 'tenantId y plan son requeridos' },
        { status: 400 }
      )
    }

    if (plan !== 'growth' && plan !== 'pro') {
      return NextResponse.json(
        { error: 'Plan debe ser growth o pro' },
        { status: 400 }
      )
    }

    if (billingCycle !== 'monthly' && billingCycle !== 'annual') {
      return NextResponse.json(
        { error: 'billingCycle debe ser monthly o annual' },
        { status: 400 }
      )
    }

    // Verify tenant exists
    const tenant = await getTenantById(tenantId)
    if (!tenant) {
      return NextResponse.json(
        { error: 'Tenant no encontrado' },
        { status: 404 }
      )
    }

    // Calculate price based on billing cycle
    const typedPlan = plan as Plan
    const priceUSD = billingCycle === 'annual'
      ? PLAN_PRICING_ANNUAL_USD[typedPlan]
      : PLAN_PRICING_USD[typedPlan]
    const rate = await getUsdToArs()
    const priceARS = Math.round(priceUSD * rate)
    const planName = PLAN_NAMES[typedPlan]
    const cycleLabel = billingCycle === 'annual' ? 'Anual' : 'Mensual'
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    const timestamp = Date.now()
    const externalReference = `partner_sub_${tenantId}_${timestamp}_${billingCycle}`

    // Save plan choice and billing cycle to tenant
    const subscriptionStartedAt = new Date().toISOString()
    const subscriptionExpiresAt = calculateExpiresAt(billingCycle as BillingCycle)

    await updateTenant(tenantId, {
      plan: typedPlan,
      billing_cycle: billingCycle as BillingCycle,
      subscription_started_at: subscriptionStartedAt,
      subscription_expires_at: subscriptionExpiresAt,
    } as any)

    // Create MercadoPago preference (one-time payment)
    // Renewal reminders handled by cron + webhook extends expiration on payment
    const preference = new Preference(client)

    const preferenceData = {
      items: [
        {
          id: `partners-${plan}-${billingCycle}`,
          title: `Novamente Partners - Plan ${planName} (${cycleLabel})`,
          quantity: 1,
          unit_price: priceARS,
          currency_id: 'ARS',
          description: `Suscripción ${cycleLabel.toLowerCase()} al plan ${planName} de Novamente Partners${billingCycle === 'annual' ? ' (15% descuento)' : ''}`,
        },
      ],
      back_urls: {
        success: `${baseUrl}/partners/payment/success?tenant_id=${tenantId}`,
        failure: `${baseUrl}/partners/payment/failure?tenant_id=${tenantId}`,
        pending: `${baseUrl}/partners/payment/pending?tenant_id=${tenantId}`,
      },
      notification_url: `${baseUrl}/api/partners/webhook/mercadopago`,
      external_reference: externalReference,
      statement_descriptor: 'NOVAMENTE PARTNERS',
      auto_return: 'approved' as const,
    }

    console.log('Creating partner subscription preference:', {
      tenant: tenant.name,
      plan,
      billingCycle,
      priceUSD,
      priceARS,
      externalReference,
    })

    const result = await preference.create({ body: preferenceData })

    console.log('MercadoPago preference created:', {
      id: result.id,
      init_point: result.init_point,
    })

    return NextResponse.json({
      init_point: result.init_point,
      preference_id: result.id,
      external_reference: externalReference,
      price_ars: priceARS,
      price_usd: priceUSD,
      billing_cycle: billingCycle,
      expires_at: subscriptionExpiresAt,
    })
  } catch (error: any) {
    console.error('Partner subscribe error:', error)
    return NextResponse.json(
      {
        error: 'Error al crear preferencia de pago',
        details: error?.message || 'Unknown error',
      },
      { status: 500 }
    )
  }
}
