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
  // 'recurring_pending': checkout mensual creado, MP todavía NO autorizó nada
  // (hallazgo [9] del review). 'recurring' se reserva para cuando el webhook
  // confirmó un authorized real (activateRecurringTenant). Ver
  // persistPendingSubscription / isGenuinePreapprovalActivation más abajo.
  subscription_type?: 'recurring' | 'recurring_pending' | 'one_time' | 'cancelled' | 'paused'
  pending_plan?: Plan
  promo?: PromoLock | null
  // ISO: cuándo se creó ESTE checkout mensual pendiente (usado por el cron
  // partners/pending-subscription-followup para saber hace cuánto está
  // esperando autorización — no se puede usar tenants.updated_at para esto
  // porque cualquier update del tenant lo pisa, ver updateTenant en
  // lib/partners/tenant.ts). Se refresca en cada persistPendingSubscription
  // (checkout nuevo = cuenta regresiva nueva).
  pending_since?: string
  // ISOs de los emails de recuperación de checkout ya enviados (idempotencia
  // del cron pending-subscription-followup), en orden de envío.
  subscription_followups?: string[]
  // true = un humano está gestionando el cobro con este partner mano a mano;
  // el cron pending-subscription-followup NO le manda emails automáticos.
  subscription_followup_optout?: boolean
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

/**
 * Growth + dentro del cupo de 100 partners pagos + PRIMER PAGO del tenant →
 * elegible a promo (hallazgos [14]/[20] del review docs/reviews/REVIEW-caminos-de-plata-2026-07-03.md).
 *
 * `isFirstPayment` por defecto es `true` para no cambiar la semántica de los
 * callers que todavía no conocen el tenant (ej. checks agnósticos de cupo).
 * El flujo anual (app/api/partners/subscribe/route.ts) ya pasa
 * `!tenant.last_payment_at`; el mensual (createRecurringSubscription) hace lo
 * mismo. Un tenant con last_payment_at poblado NO es elegible aunque haya
 * cupo: ya tuvo su promo de lanzamiento (o nunca la tuvo y ya pagó full), y
 * re-suscribirse no debe volver a regalarle el 50% off.
 */
export async function isGrowthPromoEligible(plan: PaidPlan, isFirstPayment = true): Promise<boolean> {
  if (plan !== 'growth') return false
  if (!isFirstPayment) return false
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
 *
 * La elegibilidad a la promo Growth se decide con isFirstPayment = !last_payment_at
 * (hallazgos [14]/[20]): mismo criterio que el flujo anual en
 * app/api/partners/subscribe/route.ts. Un tenant con last_payment_at poblado
 * (ya pagó alguna vez) nunca vuelve a recibir el 50% off al re-suscribirse.
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
    const { data: existing } = await db()
      .from('tenants')
      .select('mp_subscription_id, last_payment_at')
      .eq('id', tenantId)
      .single()
    const existingPreapprovalId: string | null = existing?.mp_subscription_id ?? null
    if (existingPreapprovalId) {
      const cancelled = await cancelExistingPreapproval(existingPreapprovalId)
      if (cancelled.ok === false) {
        return { ok: false, error: `No se pudo cancelar la suscripción anterior: ${cancelled.error}` }
      }
    }

    // Hallazgo [14]/[20]: el mensual otorgaba la promo Growth sin verificar
    // primer pago (a diferencia del anual, que ya chequea !tenant.last_payment_at
    // en app/api/partners/subscribe/route.ts). Mismo criterio acá: un tenant
    // que ya acreditó un pago (re-suscripción, cambio de plan, reintento tras
    // cancelar) paga precio full, nunca vuelve a entrar a la promo de lanzamiento.
    const isFirstPayment = !existing?.last_payment_at
    const promoEligible = await isGrowthPromoEligible(plan, isFirstPayment)
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

/**
 * Guarda preapproval id + promo en metadata. NO toca el plan (eso es del webhook).
 *
 * Hallazgo [9] del review: esto corre al CREAR el checkout mensual, antes de
 * que MP autorice nada — acá se escribe 'recurring_pending', NUNCA 'recurring'.
 * 'recurring' queda reservado para activateRecurringTenant, que solo corre
 * tras un authorized real confirmado por el webhook. Escribir 'recurring' acá
 * (como hacía antes) rompía dos cosas: (1) el cron check-subscriptions hace
 * `continue` para 'recurring' → un checkout mensual abandonado (nunca
 * autorizado) desactivaba para siempre la suspensión por vencimiento del
 * tenant; (2) isGenuinePreapprovalActivation veía subscription_type ya
 * 'recurring' en un tenant 'active' con este mismo preapproval_id (caso
 * upgrade de plan de un tenant ya activo) y descartaba el PRIMER authorized
 * genuino como si fuera un evento espurio — MP debitaba y el plan nuevo nunca
 * se aplicaba (interacción con el fix [15]).
 */
async function persistPendingSubscription(
  tenantId: string,
  args: { preapprovalId: string; pendingPlan: Plan; promo: PromoLock | null; nowISO: string },
): Promise<void> {
  const { data: t } = await db().from('tenants').select('metadata').eq('id', tenantId).single()
  const metadata: SubscriptionMeta = { ...(t?.metadata ?? {}) }
  metadata.subscription_type = 'recurring_pending'
  metadata.pending_plan = args.pendingPlan
  metadata.promo = args.promo
  // Checkout nuevo → cuenta regresiva del follow-up (pending-subscription-followup)
  // arranca de cero: nueva fecha de referencia, se olvidan los recordatorios
  // que se hayan mandado para un checkout anterior abandonado.
  metadata.pending_since = args.nowISO
  metadata.subscription_followups = []
  await db()
    .from('tenants')
    .update({ mp_subscription_id: args.preapprovalId, billing_cycle: 'monthly', metadata, updated_at: args.nowISO })
    .eq('id', tenantId)
}

/**
 * Hallazgo [15] del review: MP notifica `subscription_preapproval` con
 * status='authorized' no solo en el alta, sino en CUALQUIER evento posterior
 * sobre un preapproval que sigue autorizado — incluido el propio bump de monto
 * que dispara bumpPromoToStandardIfDue (cron) y reintentos/duplicados de
 * notificación de MP. Antes de este guard, activateRecurringTenant corría de
 * nuevo en esos casos y regalaba un mes gratis (extendía subscription_expires_at
 * y refrescaba last_payment_at) sin que hubiera un cobro real detrás.
 *
 * Un evento de preapproval 'authorized' representa un cobro real / merece
 * extender el vencimiento SOLO cuando es:
 *   - un alta nueva (el tenant todavía no tiene este preapproval activado), o
 *   - una reactivación (el tenant venía 'cancelled'/'paused'/'suspended').
 * Si el tenant YA está 'active', con este mismo mp_subscription_id y
 * subscription_type ya 'recurring', el evento es un update sobre un preapproval
 * ya activo (bump de monto, notificación duplicada, etc.) — no un cobro nuevo.
 * El cobro mensual real se confirma aparte vía `subscription_authorized_payment`
 * (ver handleAuthorizedPaymentEvent → registerRecurringCharge), que sí es la
 * única fuente de verdad para extender fecha + last_payment_at mes a mes.
 *
 * Interacción con el hallazgo [9]: en un upgrade mensual de un tenant YA
 * 'active', persistPendingSubscription deja mp_subscription_id apuntando al
 * preapproval NUEVO pero metadata.subscription_type = 'recurring_pending'
 * (no 'recurring') hasta que MP autorice. Por eso el chequeo de abajo compara
 * contra 'recurring' explícito: con 'recurring_pending' el guard NO matchea
 * alreadyActiveOnThisPreapproval → el primer authorized de ese preapproval se
 * trata como genuino y sí activa el plan nuevo. No hace falta listar
 * 'recurring_pending' acá a mano; alcanza con que 'recurring' sea el único
 * valor que dispara el early-return.
 */
export function isGenuinePreapprovalActivation(
  tenant: Pick<Tenant, 'status' | 'mp_subscription_id' | 'metadata'>,
  preapprovalId: string,
): boolean {
  const meta = (tenant.metadata ?? {}) as SubscriptionMeta
  const alreadyActiveOnThisPreapproval =
    tenant.status === 'active' &&
    tenant.mp_subscription_id === preapprovalId &&
    meta.subscription_type === 'recurring'
  return !alreadyActiveOnThisPreapproval
}

/**
 * Activa el tenant cuando MP confirma la suscripción (preapproval authorized).
 * Aplica las features del plan, incluido design_engine_mode (esto arregla que
 * antes el Studio quedaba `disabled` aún pagando).
 *
 * El vencimiento se calcula con computeRenewalExpiration: si el tenant venía
 * de una suscripción todavía vigente (ej. reactivación antes de vencer), el
 * mes nuevo se suma desde ese vencimiento vigente, no desde hoy (hallazgo [19]).
 *
 * IMPORTANTE (hallazgo [15]): el caller (handlePreapprovalEvent) debe llamar
 * a esta función SOLO cuando isGenuinePreapprovalActivation(...) es true — acá
 * no se vuelve a chequear para mantener esta función enfocada en "cómo activar",
 * no en "cuándo". Ver el comentario de isGenuinePreapprovalActivation arriba.
 */
export async function activateRecurringTenant(tenant: Tenant, preapprovalId: string, nowISO: string): Promise<void> {
  const meta: SubscriptionMeta = { ...(tenant.metadata ?? {}) }
  const plan: PaidPlan = (meta.pending_plan as PaidPlan) || (tenant.plan === 'starter' ? 'growth' : (tenant.plan as PaidPlan))
  const features = PLAN_FEATURES[plan]

  // Hallazgo [9]: acá (y SOLO acá, tras un authorized real) pasa de
  // 'recurring_pending' a 'recurring'. Ver persistPendingSubscription.
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
