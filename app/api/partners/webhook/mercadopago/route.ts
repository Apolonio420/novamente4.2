import { type NextRequest, NextResponse } from 'next/server'
import { MercadoPagoConfig, Payment, PreApproval } from 'mercadopago'
import { updateTenant, getTenantById } from '@/lib/partners/tenant'
import { PLAN_FEATURES, PLAN_PRICING_USD } from '@/lib/partners/plans'
import { activateRecurringTenant, registerRecurringCharge, getAuthorizedPayment, computeRenewalExpiration, isGenuinePreapprovalActivation } from '@/lib/partners/subscription'
import { supabaseAdmin } from '@/lib/supabase-admin'
import type { Plan } from '@/lib/partners/types'
import { isPaymentAlreadyProcessed, isSuspectedDoubleCharge } from '@/lib/partners/webhook-guards'

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
 * Extract tenant_id from external_reference format:
 * partner_sub_{tenantId}_{timestamp}_{billingCycle}[_{plan}]
 */
function extractTenantId(externalReference: string): string | null {
  // New format: partner_sub_{tenantId}_{timestamp}_{billingCycle}
  const matchNew = externalReference.match(/^partner_sub_(.+)_\d+_(monthly|annual)(?:_(growth|pro))?$/)
  if (matchNew) return matchNew[1]
  // Legacy format: partner_sub_{tenantId}_{timestamp}
  const matchLegacy = externalReference.match(/^partner_sub_(.+)_\d+$/)
  return matchLegacy ? matchLegacy[1] : null
}

/**
 * Extract billing cycle from external_reference. Defaults to 'monthly' for legacy references.
 */
function extractBillingCycle(externalReference: string): 'monthly' | 'annual' {
  const match = externalReference.match(/^partner_sub_.+_\d+_(monthly|annual)(?:_(growth|pro))?$/)
  return match?.[1] === 'annual' ? 'annual' : 'monthly'
}

/** The requested paid plan is embedded by /api/partners/subscribe. */
function extractPlan(externalReference: string): Exclude<Plan, 'starter'> | null {
  const match = externalReference.match(/^partner_sub_.+_\d+_(?:monthly|annual)_(growth|pro)$/)
  return (match?.[1] as Exclude<Plan, 'starter'> | undefined) ?? null
}

/**
 * Calculate new subscription_expires_at based on billing cycle.
 *
 * If the subscription is still active at payment time (on-time / early
 * renewal), the new period is added on top of the CURRENT due date instead
 * of today — otherwise a payment arriving a few days before the due date
 * would "steal" days from the partner. If it's already expired (late
 * payment), the new period starts from today (the payment date), with no
 * retroactive dead period lost or gained (hallazgo [19] del review).
 */
function calculateNewExpiration(billingCycle: 'monthly' | 'annual', currentExpiresAt: string | null | undefined): string {
  const nowISO = new Date().toISOString()
  const months = billingCycle === 'annual' ? 12 : 1
  return computeRenewalExpiration(currentExpiresAt, nowISO, months)
}

/** data.id de un evento de suscripción (body o querystring). */
function resolveSubscriptionId(body: any, request: NextRequest): string | null {
  const bodyId = body?.data?.id
  if (bodyId) return String(bodyId)
  const url = new URL(request.url)
  return url.searchParams.get('data.id') || url.searchParams.get('id')
}

/**
 * subscription_preapproval: alta / cambio de estado de la suscripción recurrente.
 * status 'authorized' → activa el tenant (y prende el Studio). 'cancelled'/'paused'
 * → marca metadata (el acceso sigue hasta subscription_expires_at; el cron decide).
 */
async function handlePreapprovalEvent(body: any, request: NextRequest) {
  const id = resolveSubscriptionId(body, request)
  if (!id) return NextResponse.json({ received: true })
  try {
    const preapproval: any = await new PreApproval(client).get({ id })
    const status = preapproval?.status
    const externalReference = preapproval?.external_reference || ''
    console.log('Preapproval event:', { id, status, externalReference })

    const tenantId = extractTenantId(externalReference)
    if (!tenantId) {
      console.warn('Preapproval sin tenantId en external_reference:', externalReference)
      return NextResponse.json({ received: true })
    }
    const tenant = await getTenantById(tenantId)
    if (!tenant) return NextResponse.json({ received: true })

    const now = new Date().toISOString()

    if (status === 'authorized') {
      // Hallazgo [15]: 'authorized' llega también en eventos que NO son un cobro
      // nuevo (bump de monto del cron, notificaciones duplicadas de MP). Solo
      // otorgar el mes / extender vencimiento en un alta real o reactivación —
      // ver comentario de isGenuinePreapprovalActivation en lib/partners/subscription.ts.
      if (!isGenuinePreapprovalActivation(tenant, id)) {
        console.log('Preapproval authorized pero tenant ya activo en este preapproval — evento no representa un cobro nuevo, no se extiende:', tenant.name)
        return NextResponse.json({ received: true, skipped: 'already_active_on_preapproval' })
      }
      await activateRecurringTenant(tenant, id, now)
      console.log('Suscripción recurrente ACTIVADA:', tenant.name)
      const activatedPlan = ((tenant.metadata as any)?.pending_plan || tenant.plan) as Plan
      const activatedAmountArs = preapproval?.auto_recurring?.transaction_amount || 0
      try {
        const { notifyPartnerSubscription } = await import('@/lib/notifications')
        await notifyPartnerSubscription({
          tenantName: tenant.name,
          plan: activatedPlan,
          priceUsd: 0,
          priceArs: activatedAmountArs,
          billingCycle: 'monthly',
          tenantEmail: tenant.email,
          tenantSlug: tenant.slug,
        })
      } catch (e) {
        console.error('Telegram notification failed:', e)
      }
      // Emails de bienvenida (partner) + copia interna. No debe romper la
      // activación si Resend falla — ver notifySubscriptionActivatedEmails.
      try {
        const { notifySubscriptionActivatedEmails } = await import('@/lib/notifications')
        await notifySubscriptionActivatedEmails({
          tenantName: tenant.name,
          tenantSlug: tenant.slug,
          tenantEmail: tenant.email,
          tenantPhone: tenant.phone,
          plan: activatedPlan,
          billingCycle: 'monthly',
          amountArs: activatedAmountArs,
          nowISO: now,
        })
      } catch (e) {
        console.error('Subscription activated email failed:', e)
      }
    } else if (status === 'cancelled' || status === 'paused') {
      const meta = { ...((tenant.metadata as any) ?? {}), subscription_type: status }
      await updateTenant(tenant.id, { metadata: meta } as any)
      console.log(`Suscripción ${status} para`, tenant.name)
    }
    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error('Error handling preapproval:', error?.message || error)
    return NextResponse.json({ received: true })
  }
}

/**
 * subscription_authorized_payment: cada cobro automático mensual de la suscripción.
 * Aprobado → extiende +1 mes. Rechazado → suma una falla (el cron hace el dunning).
 */
async function handleAuthorizedPaymentEvent(body: any, request: NextRequest) {
  const id = resolveSubscriptionId(body, request)
  if (!id) return NextResponse.json({ received: true })
  try {
    const ap = await getAuthorizedPayment(id)
    if (!ap?.preapprovalId) return NextResponse.json({ received: true })

    const { data: tenant } = await (supabaseAdmin as any)
      .from('tenants')
      .select('*')
      .eq('mp_subscription_id', ap.preapprovalId)
      .single()
    if (!tenant) {
      console.warn('Authorized payment sin tenant para preapproval', ap.preapprovalId)
      return NextResponse.json({ received: true })
    }

    const now = new Date().toISOString()
    if (ap.approved) {
      await registerRecurringCharge(tenant.id, now)
      console.log('Cobro recurrente OK:', tenant.name)
    } else {
      await updateTenant(tenant.id, { payment_failures: (tenant.payment_failures || 0) + 1 } as any)
      console.log('Cobro recurrente FALLÓ:', tenant.name, ap.status)
    }
    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error('Error handling authorized payment:', error?.message || error)
    return NextResponse.json({ received: true })
  }
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

  const url = new URL(request.url)
  const topic = url.searchParams.get('topic')
  const eventType = body.type || topic || ''

  // ── Suscripciones recurrentes (débito automático) ──
  if (eventType === 'subscription_preapproval') {
    return handlePreapprovalEvent(body, request)
  }
  if (eventType === 'subscription_authorized_payment') {
    return handleAuthorizedPaymentEvent(body, request)
  }

  // ── Pago único (one-time / anual) ──
  const paymentId = resolvePaymentId(body, request)
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

    // Guard de idempotencia — MP reenvía webhooks (reintentos, notificaciones
    // duplicadas, o un replay manual de un id viejo). Si este payment id ya fue
    // aplicado a este tenant, no re-ejecutar los efectos (hallazgo [3] del review).
    if (paymentDetails.status === 'approved' && isPaymentAlreadyProcessed(tenant.metadata, String(paymentId))) {
      console.log('Partner webhook: payment ya procesado, saltando efectos:', paymentId, tenant.name)
      return NextResponse.json({ received: true, already_processed: true })
    }

    // Handle payment status
    if (paymentDetails.status === 'approved') {
      const paidPlan = extractPlan(externalReference)
        || ((tenant.metadata as any)?.pending_plan as Exclude<Plan, 'starter'> | undefined)
        || (tenant.plan === 'starter' ? 'growth' : tenant.plan as Exclude<Plan, 'starter'>)
      console.log('Partner payment APPROVED for tenant:', tenant.name, 'Plan:', paidPlan)

      // Get plan features to apply limits
      const features = PLAN_FEATURES[paidPlan]

      // Extract billing cycle and calculate new expiration
      const billingCycle = extractBillingCycle(externalReference)
      const subscriptionExpiresAt = calculateNewExpiration(billingCycle, tenant.subscription_expires_at)
      const now = new Date().toISOString()
      const metadata = { ...((tenant.metadata as any) ?? {}), last_mp_payment_id: String(paymentId) }

      // Sospecha de doble cobro (hallazgo [18]): un payment id distinto llega
      // aprobado mientras el período activo actual todavía no venció. NO
      // bloquea el cobro — solo alerta para auditoría manual.
      if (isSuspectedDoubleCharge(tenant, String(paymentId), now)) {
        const previousPaymentId = String((tenant.metadata as any)?.last_mp_payment_id)
        console.warn('⚠️ Posible doble cobro detectado:', tenant.name, previousPaymentId, '→', paymentId)
        try {
          const { notifyPossibleDoubleCharge } = await import('@/lib/notifications')
          await notifyPossibleDoubleCharge({
            tenantName: tenant.name,
            amountArs: Number(paymentDetails.transaction_amount) || 0,
            previousPaymentId,
            newPaymentId: String(paymentId),
            previousPaymentDate: tenant.last_payment_at || 'desconocida',
            newPaymentDate: now,
          })
        } catch (e) {
          console.error('Error enviando alerta de doble cobro:', e)
        }
      }

      // Activate tenant + update subscription fields
      const updated = await updateTenant(tenantId, {
        plan: paidPlan,
        status: 'active',
        storefront_published: true,
        onboarding_completed: true,
        design_engine_mode: features?.designEngine ?? 'disabled', // prende el Studio al pagar
        max_products: features?.maxProducts ?? 999999,
        max_leads_per_month: features?.maxLeadsPerMonth ?? 999999,
        seo_indexable: features?.seoIndexable ?? false,
        billing_cycle: billingCycle,
        last_payment_at: now,
        subscription_started_at: tenant.subscription_started_at ?? now,
        subscription_expires_at: subscriptionExpiresAt,
        payment_failures: 0,
        metadata,
      } as any)

      if (updated) {
        console.log('Tenant activated:', tenant.name, 'Plan:', paidPlan)

        // Notify sales team via Telegram
        const paidBillingCycle = externalReference.includes('_annual_') ? 'annual' : 'monthly'
        try {
          const { notifyPartnerSubscription } = await import('@/lib/notifications')
          await notifyPartnerSubscription({
            tenantName: tenant.name,
            plan: paidPlan,
            priceUsd: PLAN_PRICING_USD[paidPlan] || 0,
            priceArs: paymentDetails.transaction_amount || 0,
            billingCycle: paidBillingCycle,
            tenantEmail: tenant.email,
            tenantSlug: tenant.slug,
          })
        } catch (e) {
          console.error('Telegram notification failed:', e)
        }

        // Emails de bienvenida (partner) + copia interna. No debe romper la
        // activación si Resend falla — ver notifySubscriptionActivatedEmails.
        try {
          const { notifySubscriptionActivatedEmails } = await import('@/lib/notifications')
          await notifySubscriptionActivatedEmails({
            tenantName: tenant.name,
            tenantSlug: tenant.slug,
            tenantEmail: tenant.email,
            tenantPhone: tenant.phone,
            plan: paidPlan,
            billingCycle: paidBillingCycle,
            amountArs: paymentDetails.transaction_amount || 0,
            nowISO: now,
          })
        } catch (e) {
          console.error('Subscription activated email failed:', e)
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
