import { type NextRequest, NextResponse } from 'next/server'
import { MercadoPagoConfig, Preference } from 'mercadopago'
import { updateTenant, getTenantById } from '@/lib/partners/tenant'
import { PLAN_NAMES } from '@/lib/partners/plans'
import { getUsdToArs } from '@/lib/partners/currency'
import {
  createRecurringSubscription,
  resolveAnnualPriceUsd,
  isGrowthPromoEligible,
  type PaidPlan,
  type PromoLock,
} from '@/lib/partners/subscription'

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

    // ── Mensual → suscripción recurrente (débito automático vía PreApproval) ──
    // El plan NO se cambia acá: lo activa el webhook cuando MP confirma la
    // autorización (subscription_preapproval authorized). Anual sigue abajo
    // como pago único (Preference).
    if (billingCycle === 'monthly') {
      const result = await createRecurringSubscription({
        tenantId,
        tenantEmail: tenant.email,
        plan: plan as 'growth' | 'pro',
        baseUrl: process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000',
        nowISO: new Date().toISOString(),
      })
      if (!result.ok) {
        return NextResponse.json(
          { error: 'Error al crear la suscripción', details: result.error },
          { status: 500 },
        )
      }
      return NextResponse.json({
        init_point: result.init_point,
        preapproval_id: result.preapproval_id,
        price_ars: result.price_ars,
        price_usd: result.price_usd,
        billing_cycle: 'monthly',
        recurring: true,
        promo: result.promo,
      })
    }

    // ── Anual → pago único (Preference). Aplica la promo de primer año (50% OFF
    // en Growth) si el tenant es elegible (cupo de 100 partners) y es su PRIMER
    // pago. La renovación del año siguiente ya tiene last_payment_at → full. ──
    const typedPlan = plan as PaidPlan
    const isFirstPayment = !tenant.last_payment_at
    const promoEligible = isFirstPayment && (await isGrowthPromoEligible(typedPlan))
    const priceUSD = resolveAnnualPriceUsd(typedPlan, promoEligible)
    const rate = await getUsdToArs()
    const priceARS = Math.round(priceUSD * rate)
    const planName = PLAN_NAMES[typedPlan]
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    const timestamp = Date.now()
    const externalReference = `partner_sub_${tenantId}_${timestamp}_annual`

    // Save plan choice + billing cycle + promo lock to tenant
    const subscriptionStartedAt = new Date().toISOString()
    const subscriptionExpiresAt = calculateExpiresAt('annual')
    const promo: PromoLock | null = promoEligible
      ? { price_usd: priceUSD, expires_at: subscriptionExpiresAt }
      : null
    const metadata = {
      ...((tenant.metadata as Record<string, unknown>) ?? {}),
      subscription_type: 'one_time',
      promo,
    }

    await updateTenant(tenantId, {
      plan: typedPlan,
      billing_cycle: 'annual' as BillingCycle,
      subscription_started_at: subscriptionStartedAt,
      subscription_expires_at: subscriptionExpiresAt,
      metadata,
    } as any)

    const discountNote = promoEligible ? ' (50% OFF primer año)' : ' (15% descuento)'

    // Create MercadoPago preference (one-time payment)
    // Renewal reminders handled by cron + webhook extends expiration on payment
    const preference = new Preference(client)

    const preferenceData = {
      items: [
        {
          id: `partners-${plan}-annual`,
          title: `Novamente Partners - Plan ${planName} (Anual)`,
          quantity: 1,
          unit_price: priceARS,
          currency_id: 'ARS',
          description: `Suscripción anual al plan ${planName} de Novamente Partners${discountNote}`,
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

    console.log('Creating partner annual subscription preference:', {
      tenant: tenant.name,
      plan,
      priceUSD,
      priceARS,
      promoEligible,
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
      billing_cycle: 'annual',
      expires_at: subscriptionExpiresAt,
      promo,
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
