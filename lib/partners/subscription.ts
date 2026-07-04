// Suscripciones recurrentes de partners (débito automático mensual vía
// MercadoPago PreApproval "sin plan"). El partner autoriza la tarjeta una vez
// en el init_point y MP debita solo cada mes. El plan del tenant NO se cambia
// acá: lo activa el webhook al recibir `subscription_preapproval` (status
// authorized). Ver app/api/partners/webhook/mercadopago/route.ts.
//
// Promo de lanzamiento: Growth a US$25/mes (50% off) para los primeros 100
// partners que paguen, fijo por 12 meses; después pasa a US$50/mes (el cron
// partners/check-subscriptions sube el monto del PreApproval al vencer la promo).
import { MercadoPagoConfig, PreApproval } from 'mercadopago'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getUsdToArs } from './currency'
import { PLAN_PRICING_USD, PLAN_PRICING_ANNUAL_USD, PLAN_NAMES, PLAN_FEATURES } from './plans'
import type { Plan, Tenant } from './types'

const db = () => supabaseAdmin as any

export type PaidPlan = Exclude<Plan, 'starter'>

// ── Promo de lanzamiento ───────────────────────────────────────────────────
export const GROWTH_PROMO = {
  priceUsd: 25, // 50% off
  standardUsd: 50,
  maxPartners: 100, // primeros 100 partners pagos
  months: 12, // dura 12 meses, después → standardUsd
} as const

export interface PromoLock {
  price_usd: number
  expires_at: string // ISO: cuándo termina la promo y pasa a precio standard
}

export interface SubscriptionMeta {
  subscription_type?: 'recurring' | 'one_time' | 'cancelled' | 'paused'
  pending_plan?: Plan
  promo?: PromoLock | null
  [k: string]: unknown
}

// ── Promo eligibility / pricing (puro + testeable) ───────────────────────────

/** Precio en USD del plan mensual, contemplando la promo de Growth si aplica. */
export function resolvePriceUsd(
  plan: PaidPlan,
  promoEligible: boolean,
): number {
  if (plan === 'growth' && promoEligible) return GROWTH_PROMO.priceUsd
  return PLAN_PRICING_USD[plan]
}

/** % de descuento de la promo de lanzamiento (derivado de GROWTH_PROMO: 25/50 = 0.5). */
export const GROWTH_PROMO_PCT = 1 - GROWTH_PROMO.priceUsd / GROWTH_PROMO.standardUsd

/**
 * Precio ANUAL en USD (pago único), contemplando la promo de primer año de Growth.
 * El anual de lista (PLAN_PRICING_ANNUAL_USD) ya viene con -15%; la promo aplica
 * el mismo 50% sobre ese total, SOLO el primer año. Pro nunca tiene promo.
 * Ej. Growth: $510 → $255 (≈ US$21,25/mes). Renovación = full $510.
 */
export function resolveAnnualPriceUsd(
  plan: PaidPlan,
  promoEligible: boolean,
): number {
  const list = PLAN_PRICING_ANNUAL_USD[plan]
  if (plan === 'growth' && promoEligible) return Math.round(list * (1 - GROWTH_PROMO_PCT))
  return list
}

/** Suma `months` meses a una fecha y devuelve ISO. */
export function addMonths(fromISO: string, months: number): string {
  const d = new Date(fromISO)
  d.setMonth(d.getMonth() + months)
  return d.toISOString()
}

/**
 * Calcula el nuevo vencimiento al procesar un pago de renovación (hallazgo [19]
 * del review docs/reviews/REVIEW-caminos-de-plata-2026-07-03.md).
 *
 * Regla de negocio: si la suscripción SIGUE VIGENTE al momento del pago (pago
 * a tiempo o anticipado), el nuevo período se suma desde el vencimiento actual
 * — no desde hoy — para no robarle días al partner que paga antes de tiempo.
 * Si la suscripción YA VENCIÓ (pago atrasado), el nuevo período arranca desde
 * la fecha del pago (hoy): no hay período muerto retroactivo que sumar ni
 * restar por el tiempo que estuvo vencida.
 */
export function computeRenewalExpiration(
  currentExpiresAt: string | null | undefined,
  nowISO: string,
  months: number,
): string {
  const stillActive = !!currentExpiresAt && new Date(currentExpiresAt).getTime() > new Date(nowISO).getTime()
  const base = stillActive ? (currentExpiresAt as string) : nowISO
  return addMonths(base, months)
}

/** ¿La promo de un tenant ya venció (corresponde subir a precio standard)? */
export function promoExpired(promo: PromoLock | null | undefined, nowISO: string): boolean {
  if (!promo?.expires_at) return false
  return new Date(promo.expires_at).getTime() <= new Date(nowISO).getTime()
}

// ── DB-dependent ─────────────────────────────────────────────────────────────

/**
 * Cuántos partners ya tienen al menos un pago registrado (para el cupo de 100).
 *
 * Decisión de negocio (confirmada en el punto 2 del ticket de subscription
 * semantics, 2026-07): el cupo de la promo Growth se consume en el PRIMER PAGO
 * ACREDITADO (last_payment_at), NO en la creación de la suscripción/checkout.
 * Crear un PreApproval o una Preference (createRecurringSubscription,
 * /api/partners/subscribe anual) NUNCA debe tocar last_payment_at — solo lo
 * setean activateRecurringTenant/registerRecurringCharge y el webhook de pago
 * único, todos disparados por un evento de pago real de MP. Esto ya cierra el
 * borde "el primer pago falla": como last_payment_at nunca se seteó, el cupo
 * jamás se consumió y el tenant puede reintentar el checkout re-evaluando
 * elegibilidad desde cero. Ver test 'quota semantics' en subscription.test.ts.
 */
export async function countPaidPartners(): Promise<number> {
  const { count, error } = await db()
    .from('tenants')
    .select('id', { count: 'exact', head: true })
    .not('last_payment_at', 'is', null)
    .in('plan', ['growth', 'pro'])
  if (error) {
    console.error('[subscription] countPaidPartners failed:', error.message)
    // fail-safe: si no podemos contar, NO damos promo (cobramos full)
    return GROWTH_PROMO.maxPartners
  }
  return count ?? 0
}

/** Growth mensual + dentro del cupo de 100 partners pagos → elegible a promo. */
export async function isGrowthPromoEligible(plan: PaidPlan): Promise<boolean> {
  if (plan !== 'growth') return false
  const paid = await countPaidPartners()
  return paid < GROWTH_PROMO.maxPartners
}

function mpClient(): MercadoPagoConfig {
  const token = process.env.MP_ACCESS_TOKEN
  if (!token) throw new Error('MP_ACCESS_TOKEN no configurado')
  return new MercadoPagoConfig({ accessToken: token })
}

export interface CreateRecurringResult {
  ok: boolean
  init_point?: string
  preapproval_id?: string
  price_usd?: number
  price_ars?: number
  promo?: PromoLock | null
  error?: string
}

/**
 * Cancela un PreApproval existente en MP (status → 'cancelled'). Se llama antes
 * de crear uno nuevo para el mismo tenant, para no dejar dos suscripciones
 * debitando en paralelo (hallazgo [4] del review de caminos de plata). Trata
 * 'ya cancelado / no encontrado' como éxito (nada que cancelar); cualquier otro
 * error de la API se propaga para abortar la creación del nuevo PreApproval.
 */
async function cancelExistingPreapproval(preapprovalId: string): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const current: any = await new PreApproval(mpClient()).get({ id: preapprovalId })
    if (current?.status === 'cancelled') return { ok: true }
    await new PreApproval(mpClient()).update({
      id: preapprovalId,
      body: { status: 'cancelled' },
    })
    return { ok: true }
  } catch (e: any) {
    const status = e?.status ?? e?.statusCode ?? e?.response?.status
    // 404: el preapproval ya no existe en MP — no hay nada que cancelar, no bloqueamos el alta nueva.
    if (status === 404) return { ok: true }
    console.error('[subscription] cancelExistingPreapproval failed:', preapprovalId, e?.message || e)
    return { ok: false, error: e?.message || 'No se pudo cancelar la suscripción anterior en MercadoPago' }
  }
}

/**
 * Crea una suscripción recurrente (PreApproval sin plan). Devuelve el init_point
 * donde el partner autoriza la tarjeta. NO cambia el plan del tenant (eso lo hace
 * el webhook). Guarda el preapproval id + la promo en metadata para reconciliar.
 *
 * Antes de crear el PreApproval nuevo, si el tenant ya tiene uno activo/pending
 * registrado (mp_subscription_id), lo cancela primero — evita que un upgrade o
 * un reintento de checkout dejen dos suscripciones debitando en paralelo
 * (hallazgo [4]). Si la cancelación del viejo falla, se aborta sin crear el
 * nuevo: mejor fallar explícito que arriesgar un doble débito.
 */
export async function createRecurringSubscription(args: {
  tenantId: string
  tenantEmail: string
  plan: PaidPlan
  baseUrl: string
  nowISO: string
}): Promise<CreateRecurringResult> {
  const { tenantId, tenantEmail, plan, baseUrl, nowISO } = args
  if (!tenantEmail) return { ok: false, error: 'El tenant no tiene email para la suscripción' }

  try {
    const { data: existing } = await db().from('tenants').select('mp_subscription_id').eq('id', tenantId).single()
    const existingPreapprovalId: string | null = existing?.mp_subscription_id ?? null
    if (existingPreapprovalId) {
      const cancelled = await cancelExistingPreapproval(existingPreapprovalId)
      if (cancelled.ok === false) {
        return { ok: false, error: `No se pudo cancelar la suscripción anterior: ${cancelled.error}` }
      }
    }

    const promoEligible = await isGrowthPromoEligible(plan)
    const priceUsd = resolvePriceUsd(plan, promoEligible)
    const rate = await getUsdToArs()
    const priceARS = Math.round(priceUsd * rate)
    const planName = PLAN_NAMES[plan]
    const promo: PromoLock | null = promoEligible
      ? { price_usd: GROWTH_PROMO.priceUsd, expires_at: addMonths(nowISO, GROWTH_PROMO.months) }
      : null
    const externalReference = `partner_sub_${tenantId}_${Date.parse(nowISO)}_monthly`

    const preapproval = await new PreApproval(mpClient()).create({
      body: {
        reason: `Novamente Partners - Plan ${planName} (Mensual)`,
        external_reference: externalReference,
        payer_email: tenantEmail,
        back_url: `${baseUrl}/partners/payment/success?tenant_id=${tenantId}`,
        status: 'pending',
        auto_recurring: {
          frequency: 1,
          frequency_type: 'months',
          transaction_amount: priceARS,
          currency_id: 'ARS',
        },
      },
    })

    if (!preapproval?.id || !preapproval?.init_point) {
      return { ok: false, error: 'MercadoPago no devolvió init_point para la suscripción' }
    }

    await persistPendingSubscription(tenantId, { preapprovalId: preapproval.id, pendingPlan: plan, promo, nowISO })

    return {
      ok: true,
      init_point: preapproval.init_point,
      preapproval_id: preapproval.id,
      price_usd: priceUsd,
      price_ars: priceARS,
      promo,
    }
  } catch (e: any) {
    console.error('[subscription] createRecurringSubscription failed:', e?.message || e)
    return { ok: false, error: e?.message || 'Error al crear la suscripción en MercadoPago' }
  }
}

/** Guarda preapproval id + promo en metadata. NO toca el plan (eso es del webhook). */
async function persistPendingSubscription(
  tenantId: string,
  args: { preapprovalId: string; pendingPlan: Plan; promo: PromoLock | null; nowISO: string },
): Promise<void> {
  const { data: t } = await db().from('tenants').select('metadata').eq('id', tenantId).single()
  const metadata: SubscriptionMeta = { ...(t?.metadata ?? {}) }
  metadata.subscription_type = 'recurring'
  metadata.pending_plan = args.pendingPlan
  metadata.promo = args.promo
  await db()
    .from('tenants')
    .update({ mp_subscription_id: args.preapprovalId, billing_cycle: 'monthly', metadata, updated_at: args.nowISO })
    .eq('id', tenantId)
}

/**
 * Activa el tenant cuando MP confirma la suscripción (preapproval authorized).
 * Aplica las features del plan, incluido design_engine_mode (esto arregla que
 * antes el Studio quedaba `disabled` aún pagando).
 *
 * El vencimiento se calcula con computeRenewalExpiration: si el tenant venía
 * de una suscripción todavía vigente (ej. reactivación antes de vencer), el
 * mes nuevo se suma desde ese vencimiento vigente, no desde hoy (hallazgo [19]).
 */
export async function activateRecurringTenant(tenant: Tenant, preapprovalId: string, nowISO: string): Promise<void> {
  const meta: SubscriptionMeta = { ...(tenant.metadata ?? {}) }
  const plan: PaidPlan = (meta.pending_plan as PaidPlan) || (tenant.plan === 'starter' ? 'growth' : (tenant.plan as PaidPlan))
  const features = PLAN_FEATURES[plan]

  meta.subscription_type = 'recurring'
  delete meta.pending_plan // ya activado

  await db()
    .from('tenants')
    .update({
      plan,
      status: 'active',
      storefront_published: true,
      onboarding_completed: true,
      design_engine_mode: features.designEngine, // ← arregla Studio bloqueado aún pagando
      max_products: features.maxProducts,
      max_leads_per_month: features.maxLeadsPerMonth,
      seo_indexable: features.seoIndexable,
      billing_cycle: 'monthly',
      mp_subscription_id: preapprovalId,
      subscription_started_at: tenant.subscription_started_at ?? nowISO,
      subscription_expires_at: computeRenewalExpiration(tenant.subscription_expires_at, nowISO, 1),
      last_payment_at: nowISO,
      payment_failures: 0,
      metadata: meta,
      updated_at: nowISO,
    })
    .eq('id', tenant.id)
}

/**
 * Registra un cobro recurrente exitoso: extiende el período y limpia fallas.
 * Usa computeRenewalExpiration para no robarle días al partner que paga antes
 * de vencer (hallazgo [19]) — necesita leer el vencimiento vigente del tenant.
 */
export async function registerRecurringCharge(tenantId: string, nowISO: string): Promise<void> {
  const { data: tenant } = await db()
    .from('tenants')
    .select('subscription_expires_at')
    .eq('id', tenantId)
    .single()

  await db()
    .from('tenants')
    .update({
      status: 'active',
      last_payment_at: nowISO,
      subscription_expires_at: computeRenewalExpiration(tenant?.subscription_expires_at, nowISO, 1),
      payment_failures: 0,
      updated_at: nowISO,
    })
    .eq('id', tenantId)
}

/**
 * Consulta un authorized_payment (cobro recurrente) por la REST API de MP.
 * El SDK v2.9.0 no tiene cliente para este recurso, así que vamos directo.
 * Devuelve el preapproval_id y si el cobro fue exitoso.
 */
export async function getAuthorizedPayment(
  authorizedPaymentId: string,
): Promise<{ preapprovalId: string | null; approved: boolean; status: string } | null> {
  const token = process.env.MP_ACCESS_TOKEN
  if (!token) return null
  try {
    const res = await fetch(`https://api.mercadopago.com/authorized_payments/${authorizedPaymentId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) {
      console.error('[subscription] getAuthorizedPayment HTTP', res.status)
      return null
    }
    const data: any = await res.json()
    const paymentStatus: string = data?.payment?.status || data?.status || 'unknown'
    const approved = data?.payment?.status === 'approved' || data?.status === 'processed'
    return { preapprovalId: data?.preapproval_id ?? null, approved, status: paymentStatus }
  } catch (e: any) {
    console.error('[subscription] getAuthorizedPayment failed:', e?.message || e)
    return null
  }
}

/**
 * Si la promo del tenant venció, sube el monto del PreApproval al precio standard
 * (US$50) y limpia la promo de metadata. Lo llama el cron check-subscriptions.
 * Devuelve true si hizo el bump.
 */
export async function bumpPromoToStandardIfDue(tenant: Tenant, nowISO: string): Promise<boolean> {
  const meta: SubscriptionMeta = { ...(tenant.metadata ?? {}) }
  if (meta.subscription_type !== 'recurring') return false
  if (!promoExpired(meta.promo, nowISO)) return false
  if (!tenant.mp_subscription_id) return false

  try {
    const rate = await getUsdToArs()
    const standardARS = Math.round(GROWTH_PROMO.standardUsd * rate)
    await new PreApproval(mpClient()).update({
      id: tenant.mp_subscription_id,
      body: {
        // El update de PreApproval solo permite cambiar monto + moneda (no la frecuencia)
        auto_recurring: {
          transaction_amount: standardARS,
          currency_id: 'ARS',
        },
      },
    })
    meta.promo = null
    await db().from('tenants').update({ metadata: meta, updated_at: nowISO }).eq('id', tenant.id)
    console.log(`[subscription] promo bump → standard for ${tenant.name} ($${standardARS} ARS)`)
    return true
  } catch (e: any) {
    console.error('[subscription] bumpPromoToStandardIfDue failed:', e?.message || e)
    return false
  }
}
