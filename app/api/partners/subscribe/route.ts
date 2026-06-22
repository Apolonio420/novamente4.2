import { type NextRequest, NextResponse } from 'next/server'
import { MercadoPagoConfig, Preference } from 'mercadopago'
import { requireTenantPermission } from '@/lib/partners/permissions'
import { PLAN_PRICING_USD, PLAN_PRICING_ANNUAL_USD, PLAN_NAMES } from '@/lib/partners/plans'
import { getUsdToArs } from '@/lib/partners/currency'
import { createRecurringSubscription } from '@/lib/partners/subscription'
import type { Plan } from '@/lib/partners/types'

const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN!,
})

type BillingCycle = 'monthly' | 'annual'

export async function POST(request: NextRequest) {
  try {
    const auth = await requireTenantPermission(request, 'billing:manage')
    if (!auth.ok) return auth.response
    const tenant = auth.tenant

    // tenantId is deliberately not accepted from the request body. The active
    // tenant was already membership-validated by requireTenantPermission.
    const { plan, billingCycle = 'monthly' } = await request.json()

    if (!plan) {
      return NextResponse.json(
        { error: 'plan es requerido' },
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

    // ── Mensual → suscripción recurrente (débito automático vía PreApproval) ──
    // El plan NO se cambia acá: lo activa el webhook cuando MP confirma la
    // autorización (subscription_preapproval authorized). Anual sigue abajo
    // como pago único (Preference).
    if (billingCycle === 'monthly') {
      const result = await createRecurringSubscription({
        tenantId: tenant.id,
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
    // The plan is embedded in the server-created payment reference so the webhook can
    // activate it only after Mercado Pago returns an approved payment. Do not
    // persist plan, billing cycle or an annual expiration before that event.
    const externalReference = `partner_sub_${tenant.id}_${timestamp}_${billingCycle}_${typedPlan}`

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
        success: `${baseUrl}/partners/payment/success?tenant_id=${tenant.id}`,
        failure: `${baseUrl}/partners/payment/failure?tenant_id=${tenant.id}`,
        pending: `${baseUrl}/partners/payment/pending?tenant_id=${tenant.id}`,
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
      payment_pending: true,
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
