import { type NextRequest, NextResponse } from 'next/server'
import { MercadoPagoConfig, Payment } from 'mercadopago'
import { updateTenant, getTenantById } from '@/lib/partners/tenant'
import { PLAN_FEATURES, PLAN_PRICING_USD } from '@/lib/partners/plans'
import type { Plan } from '@/lib/partners/types'

const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN!,
})

/**
 * Extract paymentId from multiple possible sources (same pattern as main webhook)
 */
function resolvePaymentId(body: any, request: NextRequest): string | null {
  const bodyId = body?.data?.id
  if (bodyId) return String(bodyId)

  const url = new URL(request.url)

  const dataId = url.searchParams.get('data.id')
  if (dataId) return dataId

  const topicId = url.searchParams.get('id')
  const topic = url.searchParams.get('topic')
  if (topicId && topic === 'payment') return topicId

  return null
}

/**
 * Extract tenant_id from external_reference format: partner_sub_{tenantId}_{timestamp}[_{billingCycle}]
 */
function extractTenantId(externalReference: string): string | null {
  // New format: partner_sub_{tenantId}_{timestamp}_{billingCycle}
  const matchNew = externalReference.match(/^partner_sub_(.+)_\d+_(monthly|annual)$/)
  if (matchNew) return matchNew[1]
  // Legacy format: partner_sub_{tenantId}_{timestamp}
  const matchLegacy = externalReference.match(/^partner_sub_(.+)_\d+$/)
  return matchLegacy ? matchLegacy[1] : null
}

/**
 * Extract billing cycle from external_reference. Defaults to 'monthly' for legacy references.
 */
function extractBillingCycle(externalReference: string): 'monthly' | 'annual' {
  if (externalReference.endsWith('_annual')) return 'annual'
  return 'monthly'
}

/**
 * Calculate new subscription_expires_at based on billing cycle
 */
function calculateNewExpiration(billingCycle: 'monthly' | 'annual'): string {
  const now = new Date()
  if (billingCycle === 'annual') {
    now.setFullYear(now.getFullYear() + 1)
  } else {
    now.setMonth(now.getMonth() + 1)
  }
  return now.toISOString()
}

export async function POST(request: NextRequest) {
  let body: any = {}
  try {
    body = await request.json()
  } catch {
    // Empty body — continue
  }

  console.log('Partners MP webhook received:', {
    type: body.type,
    action: body.action,
    data: body.data,
  })

  const paymentId = resolvePaymentId(body, request)

  const url = new URL(request.url)
  const topic = url.searchParams.get('topic')
  const isPaymentEvent = body.type === 'payment' || topic === 'payment'

  if (!paymentId) {
    console.warn('Partners webhook: no paymentId, ignoring')
    return NextResponse.json({ received: true })
  }

  if (!isPaymentEvent) {
    console.log('Partners webhook: non-payment event, ignoring:', body.type || topic)
    return NextResponse.json({ received: true })
  }

  try {
    console.log('Processing partner payment ID:', paymentId)

    // Fetch payment details from MercadoPago
    const payment = new Payment(client)
    let paymentDetails: any

    try {
      paymentDetails = await payment.get({ id: paymentId })
    } catch (paymentError: any) {
      console.error('Error fetching payment details:', paymentError.message)
      return NextResponse.json({ received: true })
    }

    console.log('Partner payment details:', {
      id: paymentDetails.id,
      status: paymentDetails.status,
      external_reference: paymentDetails.external_reference,
      transaction_amount: paymentDetails.transaction_amount,
    })

    const externalReference = paymentDetails.external_reference
    if (!externalReference || !externalReference.startsWith('partner_sub_')) {
      console.warn('Not a partner subscription payment:', externalReference)
      return NextResponse.json({ received: true })
    }

    const tenantId = extractTenantId(externalReference)
    if (!tenantId) {
      console.error('Could not extract tenant_id from:', externalReference)
      return NextResponse.json({ received: true })
    }

    const tenant = await getTenantById(tenantId)
    if (!tenant) {
      console.error('Tenant not found:', tenantId)
      return NextResponse.json({ received: true })
    }

    // Handle payment status
    if (paymentDetails.status === 'approved') {
      console.log('Partner payment APPROVED for tenant:', tenant.name, 'Plan:', tenant.plan)

      // Get plan features to apply limits
      const features = PLAN_FEATURES[tenant.plan as Plan]

      // Extract billing cycle and calculate new expiration
      const billingCycle = extractBillingCycle(externalReference)
      const subscriptionExpiresAt = calculateNewExpiration(billingCycle)
      const now = new Date().toISOString()

      // Activate tenant + update subscription fields
      const updated = await updateTenant(tenantId, {
        status: 'active',
        storefront_published: true,
        onboarding_completed: true,
        max_products: features?.maxProducts ?? 999999,
        max_leads_per_month: features?.maxLeadsPerMonth ?? 999999,
        seo_indexable: features?.seoIndexable ?? false,
        billing_cycle: billingCycle,
        last_payment_at: now,
        subscription_expires_at: subscriptionExpiresAt,
        payment_failures: 0,
      } as any)

      if (updated) {
        console.log('Tenant activated:', tenant.name, 'Plan:', tenant.plan)

        // Notify sales team via Telegram
        try {
          const { notifyPartnerSubscription } = await import('@/lib/notifications')
          await notifyPartnerSubscription({
            tenantName: tenant.name,
            plan: tenant.plan,
            priceUsd: PLAN_PRICING_USD[tenant.plan as Plan] || 0,
            priceArs: paymentDetails.transaction_amount || 0,
            billingCycle: externalReference.includes('_annual_') ? 'annual' : 'monthly',
            tenantEmail: tenant.email,
            tenantSlug: tenant.slug,
          })
        } catch (e) {
          console.error('Telegram notification failed:', e)
        }

        // ── Meta CAPI — Purchase event para subscription de Partner ──
        // event_id = externalReference para dedup con Pixel cliente si ya existe.
        try {
          const { sendCapiPurchase } = await import('@/lib/meta/capi')
          const capiResult = await sendCapiPurchase(
            {
              orderId: String(externalReference || paymentDetails.id),
              value: Number(paymentDetails.transaction_amount) || 0,
              currency: paymentDetails.currency_id || 'ARS',
              actionSource: 'website',
              eventSourceUrl: `https://novamente.ar/workspace?tenant=${tenant.slug}`,
            },
            {
              email: tenant.email || undefined,
              externalId: String(tenantId),
            }
          )
          if (capiResult.ok) {
            console.log('✅ Meta CAPI Partner Purchase enviado:', tenant.name, '→ value:', paymentDetails.transaction_amount)
          } else if (capiResult.skipped === 'not_configured') {
            console.warn('⚠️ Meta CAPI no configurado — agregar META_PIXEL_ID y META_CAPI_ACCESS_TOKEN en Vercel')
          } else {
            console.error('❌ Meta CAPI falló (partner):', capiResult.error)
          }
        } catch (capiErr: any) {
          console.error('❌ Exception Meta CAPI (partner):', capiErr.message)
        }
      } else {
        console.error('Failed to activate tenant:', tenantId)
      }
    } else if (paymentDetails.status === 'rejected' || paymentDetails.status === 'cancelled') {
      console.log('Partner payment rejected/cancelled for tenant:', tenant.name)
      // Don't change tenant status — they can retry
    } else {
      console.log('Partner payment pending for tenant:', tenant.name, 'Status:', paymentDetails.status)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Error processing partner webhook:', error)
    return NextResponse.json({ received: true })
  }
}

export async function GET() {
  return NextResponse.json({ message: 'Partners MercadoPago webhook endpoint is active' })
}
