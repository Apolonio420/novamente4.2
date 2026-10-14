import { type NextRequest, NextResponse } from 'next/server'
import { MercadoPagoConfig, Payment, PreApproval } from 'mercadopago'
import { getTenantById } from '@/lib/partners/tenant'
import { PLAN_FEATURES, PLAN_PRICING_USD } from '@/lib/partners/plans'
import { activateRecurringTenant, registerRecurringCharge, registerPaymentFailure, registerSinglePayment, casUpdateTenant, getAuthorizedPayment, computeRenewalExpiration, isGenuinePreapprovalActivation } from '@/lib/partners/subscription'
import { supabaseAdmin } from '@/lib/supabase-admin'
import type { Plan } from '@/lib/partners/types'
import { isPaymentAlreadyProcessed, isSuspectedDoubleCharge, isAuthorizedPaymentAlreadyProcessed } from '@/lib/partners/webhook-guards'

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
/** External reference de un preapproval mensual: `partner_sub_{tenant}_{ts}_monthly` (sin plan). */
function isRecurringChargeReference(externalReference: string): boolean {
  return /^partner_sub_.+_\d+_monthly$/.test(externalReference)
}

function extractPlan(externalReference: string): Exclude<Plan, 'starter'> | null {
  const match = externalReference.match(/^partner_sub_.+_\d+_(?:monthly|annual)_(growth|pro)$/)
  return (match?.[1] as Exclude<Plan, 'starter'> | undefined) ?? null
}

/**
 * Un cobro aprobado que no se pudo aplicar al tenant (plan sin activar /
 * período sin extender) es plata cobrada sin servicio. Antes solo quedaba un
 * console.error y el webhook respondía 200, así que MP no reintentaba y nadie
 * se enteraba (auditoría workspace partner 08/10). Ahora: aviso a "🚨 Urgente"
 * (cooldown por id de MP, ver notifyError) y el caller responde 500 para que
 * MP reintente — los guards de idempotencia hacen seguro el reintento.
 */
async function alertUnappliedCharge(ctx: { kind: string; mpId: string; tenantLabel: string; error?: unknown }) {
  const detail = ctx.error instanceof Error ? ctx.error.message : ctx.error ? String(ctx.error) : 'sin detalle'
  console.error('Cobro aprobado sin aplicar al tenant:', ctx.kind, ctx.mpId, ctx.tenantLabel, detail)
  try {
    const { notifyError, escapeTelegramHtml } = await import('@/lib/notifications')
    await notifyError({
      urgent: true,
      area: 'Suscripción partner (MercadoPago)',
      endpoint: '/api/partners/webhook/mercadopago',
      message: escapeTelegramHtml(
        `${ctx.kind}: cobro ${ctx.mpId} aprobado pero NO aplicado a ${ctx.tenantLabel}. MP va a reintentar y lo aplica solo. NO activar a mano sin registrar también la marca last_mp_authorized_payment_id (o last_mp_payment_id) del cobro en la metadata del tenant: si no, el reintento de MP suma OTRO mes. Si en 1 h no se aplicó, registrar esa marca junto con la activación. Detalle: ${detail}`,
      ),
      dedupeKey: `mp-partner-unapplied:${ctx.mpId}`,
    })
  } catch (e) {
    console.error('No se pudo avisar el cobro sin aplicar:', e)
  }
}

/**
 * Clasifica una falla al consultar a MP según su status HTTP (en el SDK viene
 * en `err.status`; en getAuthorizedPayment, también `err.status`).
 *  - 'drop':  400/404 → id inexistente/ajeno: reintentar no sirve → 200 + log.
 *  - 'auth':  401/403 → token vencido/revocado: reintentar tampoco sirve hasta
 *             que un humano lo arregle, pero MP reintenta igual → 500 + alerta.
 *  - 'retry': 429, 5xx, red o sin status → 500 para que MP reintente.
 */
function classifyMpError(err: any): 'drop' | 'auth' | 'retry' {
  const raw = err?.status ?? err?.statusCode ?? err?.cause?.status
  const status = Number(raw)
  if (status === 400 || status === 404) return 'drop'
  if (status === 401 || status === 403) return 'auth'
  return 'retry'
}

/**
 * Token de MP vencido/revocado: TODOS los cobros de partners fallan. dedupeKey
 * GLOBAL (no por id de cobro) para no spamear una alerta por cada reintento.
 */
async function alertMpTokenInvalid(ctx: { where: string; mpId: string; error?: unknown }) {
  const detail = ctx.error instanceof Error ? ctx.error.message : ctx.error ? String(ctx.error) : 'sin detalle'
  console.error('MP rechazó el token (401/403):', ctx.where, ctx.mpId, detail)
  try {
    const { notifyError, escapeTelegramHtml } = await import('@/lib/notifications')
    await notifyError({
      urgent: true,
      area: 'Suscripción partner (MercadoPago)',
      endpoint: '/api/partners/webhook/mercadopago',
      message: escapeTelegramHtml(
        `MP_ACCESS_TOKEN rechazado (401/403) al consultar ${ctx.where} ${ctx.mpId}. Los cobros de partners NO se están aplicando: renovar/revisar el token en Vercel. Detalle: ${detail}`,
      ),
      dedupeKey: 'mp-partner-token',
    })
  } catch (e) {
    console.error('No se pudo avisar el token de MP inválido:', e)
  }
}

/** Respuesta para que MP reintente la notificación. */
function retryLater(reason: string) {
  return NextResponse.json({ received: false, retry: reason }, { status: 500 })
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
    let preapproval: any
    try {
      preapproval = await new PreApproval(client).get({ id })
    } catch (getError: any) {
      const kind = classifyMpError(getError)
      if (kind === 'drop') {
        console.warn('Preapproval inexistente/ajeno en MP (400/404), no se reintenta:', id, getError?.message || getError)
        return NextResponse.json({ received: true, skipped: 'preapproval_not_found' })
      }
      if (kind === 'auth') await alertMpTokenInvalid({ where: 'preapproval', mpId: id, error: getError })
      throw getError
    }
    const status = preapproval?.status
    const externalReference = preapproval?.external_reference || ''
    console.log('Preapproval event:', { id, status, externalReference })

    const tenantId = extractTenantId(externalReference)
    if (!tenantId) {
      console.warn('Preapproval sin tenantId en external_reference:', externalReference)
      return NextResponse.json({ received: true })
    }
    const tenant = await getTenantById(tenantId)
    if (!tenant) {
      // getTenantById devuelve null también ante un blip de DB: si es un alta
      // autorizada, no descartarla — avisar y que MP reintente.
      if (status === 'authorized') {
        await alertUnappliedCharge({ kind: 'Alta de suscripción recurrente (tenant no encontrado)', mpId: id, tenantLabel: `tenant ${tenantId}` })
        return retryLater('tenant_not_found')
      }
      return NextResponse.json({ received: true })
    }

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
      try {
        await activateRecurringTenant(tenant, id, now)
      } catch (activationError) {
        await alertUnappliedCharge({ kind: 'Alta de suscripción recurrente', mpId: id, tenantLabel: `${tenant.name} (${tenant.id})`, error: activationError })
        return retryLater('activation_failed')
      }
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
      // CAS sobre metadata FRESCA: no pisa las marcas de un cobro concurrente.
      try {
        await casUpdateTenant('preapproval cancelled/paused', tenant.id, now, (row) => ({
          metadata: { ...(row.metadata ?? {}), subscription_type: status },
        }))
      } catch {
        return retryLater('status_update_failed')
      }
      console.log(`Suscripción ${status} para`, tenant.name)
    }
    return NextResponse.json({ received: true })
  } catch (error: any) {
    // Falla de MP (GET preapproval) o de DB: 500 para que MP reintente. Seguro
    // porque el alta solo se aplica si isGenuinePreapprovalActivation.
    console.error('Error handling preapproval:', error?.message || error)
    return retryLater('preapproval_error')
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
    let ap: Awaited<ReturnType<typeof getAuthorizedPayment>>
    try {
      ap = await getAuthorizedPayment(id)
    } catch (fetchError: any) {
      console.error('Authorized payment: no se pudo consultar en MP', id, fetchError?.message || fetchError)
      const kind = classifyMpError(fetchError)
      if (kind === 'drop') {
        return NextResponse.json({ received: true, skipped: 'authorized_payment_not_found' })
      }
      if (kind === 'auth') await alertMpTokenInvalid({ where: 'authorized_payment', mpId: id, error: fetchError })
      if (!process.env.MP_ACCESS_TOKEN) {
        // Sin token se pierden TODOS los cobros: avisar (con cooldown).
        await alertUnappliedCharge({ kind: 'Cobro mensual recurrente (falta MP_ACCESS_TOKEN)', mpId: id, tenantLabel: 'tenant desconocido', error: fetchError })
      }
      return retryLater('authorized_payment_fetch_failed')
    }
    // Consultado OK pero sin preapproval: no es de una suscripción de partner.
    if (!ap.preapprovalId) return NextResponse.json({ received: true })

    const { data: tenant, error: tenantError } = await (supabaseAdmin as any)
      .from('tenants')
      .select('*')
      .eq('mp_subscription_id', ap.preapprovalId)
      .single()
    // PGRST116 = 0 filas (de verdad no hay tenant). Cualquier otro error es un
    // blip de DB: reintentar en vez de descartar un cobro.
    if (tenantError && tenantError.code !== 'PGRST116') {
      console.error('Authorized payment: error buscando tenant', ap.preapprovalId, tenantError.message)
      return retryLater('tenant_lookup_failed')
    }
    if (!tenant) {
      console.warn('Authorized payment sin tenant para preapproval', ap.preapprovalId)
      return NextResponse.json({ received: true })
    }

    const now = new Date().toISOString()
    if (ap.approved) {
      // Guard de idempotencia (síntoma [1] auditoría MP 2026-08-29): MP puede
      // reenviar el mismo subscription_authorized_payment (reintento webhook,
      // notificación duplicada). Sin este guard, registerRecurringCharge corría
      // de nuevo y extendía subscription_expires_at otro mes gratis por cada
      // reenvío — a diferencia del pago único y de subscription_preapproval,
      // que ya tenían guards análogos.
      if (isAuthorizedPaymentAlreadyProcessed(tenant.metadata, id)) {
        console.log('Authorized payment ya procesado, saltando — no se extiende de nuevo:', id, tenant.name)
        return NextResponse.json({ received: true, already_processed: true })
      }
      let outcome: 'applied' | 'duplicate'
      try {
        outcome = await registerRecurringCharge(tenant.id, now, id)
      } catch (chargeError) {
        await alertUnappliedCharge({ kind: 'Cobro mensual recurrente', mpId: id, tenantLabel: `${tenant.name} (${tenant.id})`, error: chargeError })
        return retryLater('charge_not_registered')
      }
      if (outcome === 'duplicate') {
        console.log('Authorized payment duplicado (detectado al escribir), sin extender de nuevo:', id, tenant.name)
        return NextResponse.json({ received: true, already_processed: true })
      }
      console.log('Cobro recurrente OK:', tenant.name)
    } else {
      // CAS sobre fila fresca + marca de id ya contado: ver registerPaymentFailure.
      let failureOutcome: 'applied' | 'duplicate'
      try {
        failureOutcome = await registerPaymentFailure(tenant.id, now, id)
      } catch (failureError) {
        console.error('Cobro recurrente fallido: no se pudo registrar la falla', id, (failureError as any)?.message)
        return retryLater('failure_not_registered')
      }
      if (failureOutcome === 'duplicate') {
        console.log('Cobro recurrente fallido ya contado, no suma de nuevo:', id, tenant.name)
        return NextResponse.json({ received: true, already_processed: true })
      }
      console.log('Cobro recurrente FALLÓ:', tenant.name, ap.status)
    }
    return NextResponse.json({ received: true })
  } catch (error: any) {
    // Falla de MP o de DB: 500 para que MP reintente (idempotente vía
    // isAuthorizedPaymentAlreadyProcessed).
    console.error('Error handling authorized payment:', error?.message || error)
    return retryLater('authorized_payment_error')
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
      // Sin el detalle del pago no sabemos si fue aprobado: que MP reintente.
      console.error('Error fetching payment details:', paymentError.message)
      const kind = classifyMpError(paymentError)
      if (kind === 'drop') {
        console.warn('Pago inexistente/ajeno en MP (400/404), no se reintenta:', paymentId)
        return NextResponse.json({ received: true, skipped: 'payment_not_found' })
      }
      if (kind === 'auth') await alertMpTokenInvalid({ where: 'payment', mpId: String(paymentId), error: paymentError })
      return retryLater('payment_fetch_failed')
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
      // Un pago aprobado sin tenant (blip de DB o tenant borrado) es plata sin
      // destino: avisar y reintentar. Pagos no aprobados se descartan como antes.
      if (paymentDetails.status === 'approved') {
        await alertUnappliedCharge({ kind: 'Pago de plan (tenant no encontrado)', mpId: String(paymentId), tenantLabel: `tenant ${tenantId}` })
        return retryLater('tenant_not_found')
      }
      return NextResponse.json({ received: true })
    }

    // Cobro de la suscripción RECURRENTE: MP crea un `payment` por cada débito
    // automático con el MISMO external_reference del preapproval
    // (`partner_sub_{tenant}_{ts}_monthly`, sin sufijo de plan) y manda además
    // `subscription_authorized_payment`. El período de ese cobro lo suma SOLO
    // registerRecurringCharge (idempotente por authorized_payment id); si este
    // flujo también lo aplicara, 1 cobro = 2 meses. Se corta SOLO si el payment
    // se identifica como débito recurrente (operation_type 'recurring_payment').
    // Los `_monthly` sin plan anteriores (pagos únicos viejos) siguen su curso;
    // si no se puede determinar, no se corta (no perder plata) y se avisa.
    if (isRecurringChargeReference(externalReference)) {
      if (paymentDetails.operation_type === 'recurring_payment') {
        console.log('Partner webhook: payment de suscripción recurrente, lo aplica subscription_authorized_payment — no se suma acá:', paymentId, externalReference)
        return NextResponse.json({ received: true, skipped: 'recurring_charge_handled_by_authorized_payment' })
      }
      if (paymentDetails.status === 'approved') {
        try {
          const { notifyError, escapeTelegramHtml } = await import('@/lib/notifications')
          await notifyError({
            urgent: true,
            area: 'Suscripción partner (MercadoPago)',
            endpoint: '/api/partners/webhook/mercadopago',
            message: escapeTelegramHtml(
              `payment ${paymentId} aprobado con referencia mensual (${externalReference}) sin operation_type 'recurring_payment': no se pudo determinar si es un débito recurrente. Se procesó por el flujo de pago único; si el tenant tiene suscripción recurrente, revisar que no haya sumado un mes de más junto al subscription_authorized_payment.`,
            ),
            dedupeKey: `mp-partner-monthly-ambiguous:${paymentId}`,
          })
        } catch (e) {
          console.error('No se pudo avisar el payment mensual ambiguo:', e)
        }
      }
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
      const now = new Date().toISOString()

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

      // Activar tenant + período por CAS sobre la fila FRESCA (no sobre la lectura
      // de arriba): preserva metadata ajena y la marca de idempotencia viaja en el
      // mismo UPDATE. 'duplicate' = otro webhook del mismo payment id ya lo aplicó.
      let outcome: 'applied' | 'duplicate' | null = null
      try {
        outcome = await registerSinglePayment(tenantId, now, String(paymentId), {
          plan: paidPlan,
          billingCycle,
          designEngineMode: features?.designEngine ?? 'disabled', // prende el Studio al pagar
          maxProducts: features?.maxProducts ?? 999999,
          maxLeadsPerMonth: features?.maxLeadsPerMonth ?? 999999,
          seoIndexable: features?.seoIndexable ?? false,
        })
      } catch (e) {
        console.error('registerSinglePayment falló:', e)
      }
      if (outcome === 'duplicate') {
        console.log('Partner webhook: payment ya aplicado (CAS), sin re-notificar:', paymentId, tenant.name)
        return NextResponse.json({ received: true, already_processed: true })
      }
      const updated = outcome === 'applied'

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
        await alertUnappliedCharge({ kind: 'Pago de plan (único/anual)', mpId: String(paymentId), tenantLabel: `${tenant.name} (${tenant.id})` })
        return retryLater('activation_failed')
      }
    } else if (paymentDetails.status === 'rejected' || paymentDetails.status === 'cancelled') {
      console.log('Partner payment rejected/cancelled for tenant:', tenant.name)
      // Don't change tenant status — they can retry
    } else {
      console.log('Partner payment pending for tenant:', tenant.name, 'Status:', paymentDetails.status)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    // Idempotente vía isPaymentAlreadyProcessed: reintentar es seguro.
    console.error('Error processing partner webhook:', error)
    return retryLater('payment_error')
  }
}

export async function GET() {
  return NextResponse.json({ message: 'Partners MercadoPago webhook endpoint is active' })
}
