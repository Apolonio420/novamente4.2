/**
 * Follow-up por email para checkouts de suscripción mensual abandonados.
 *
 * Universo: tenants con metadata.subscription_type='recurring_pending' Y
 * last_payment_at IS NULL — el partner empezó el checkout de MercadoPago
 * (PreApproval) pero nunca autorizó el débito (ver persistPendingSubscription
 * en ./subscription.ts). Hasta 3 emails por checkout: el primero a las 24h de
 * creado, el segundo a los 7 días del primero, el tercero a los 14 días del
 * primero. Se registran en metadata.subscription_followups (array de ISO
 * timestamps) para no duplicar envíos entre corridas del cron.
 *
 * Separado de check-subscriptions (que gestiona vencimiento/suspensión) y de
 * ./subscription.ts (que gestiona el ciclo de vida real con MP) para no tocar
 * ninguno de los dos módulos existentes más de lo imprescindible.
 */
import { PLAN_NAMES } from './plans'
import type { Plan, Tenant } from './types'
import type { SubscriptionMeta } from './subscription'

export const PENDING_FOLLOWUP_BASE_URL = 'https://www.novamente.ar'
export const PENDING_FOLLOWUP_MAX_SENDS = 3
const HOUR_MS = 3600_000

export type FollowupDecision =
  | { send: true; stage: 1 | 2 | 3 }
  | { send: false; reason: string }

/**
 * Decide si corresponde mandar el próximo email de follow-up, en función de
 * cuánto hace que se creó el checkout (pending_since, o el fallback si el
 * tenant es de datos viejos migrados sin ese campo) y de cuáles ya se
 * mandaron (subscription_followups). Función pura para poder testear los
 * bordes de tiempo sin tocar la DB.
 */
export function decideNextFollowup(
  meta: Pick<SubscriptionMeta, 'pending_since' | 'subscription_followups'> | null | undefined,
  fallbackSinceISO: string,
  nowISO: string,
): FollowupDecision {
  const sent = Array.isArray(meta?.subscription_followups) ? (meta!.subscription_followups as string[]) : []
  if (sent.length >= PENDING_FOLLOWUP_MAX_SENDS) {
    return { send: false, reason: `ya se enviaron los ${PENDING_FOLLOWUP_MAX_SENDS} emails` }
  }

  const sinceISO = meta?.pending_since || fallbackSinceISO
  const sinceMs = new Date(sinceISO).getTime()
  const nowMs = new Date(nowISO).getTime()
  if (Number.isNaN(sinceMs)) {
    return { send: false, reason: `pending_since/fallback inválido: ${sinceISO}` }
  }

  if (sent.length === 0) {
    if (nowMs - sinceMs >= 24 * HOUR_MS) return { send: true, stage: 1 }
    return { send: false, reason: 'checkout con menos de 24h' }
  }

  const firstSentMs = new Date(sent[0]).getTime()
  if (Number.isNaN(firstSentMs)) {
    return { send: false, reason: `subscription_followups[0] inválido: ${sent[0]}` }
  }
  const targetDays = sent.length === 1 ? 7 : 14
  if (nowMs - firstSentMs >= targetDays * 24 * HOUR_MS) {
    return { send: true, stage: (sent.length + 1) as 2 | 3 }
  }
  return { send: false, reason: `esperando +${targetDays}d desde el primer email` }
}

export function planLabel(meta: Pick<SubscriptionMeta, 'pending_plan'> | null | undefined, tenantPlan: Plan): string {
  const plan = (meta?.pending_plan as Plan | undefined) || tenantPlan
  return PLAN_NAMES[plan] || plan
}

/** Email HTML — mismo look & feel que recoveryHtml en app/api/cron/abandoned-checkout. */
export function pendingSubscriptionFollowupHtml(opts: {
  tenantName: string
  planName: string
  billingUrl: string
}): string {
  return `<!DOCTYPE html><html><body style="margin:0;background:#f5f5f5;font-family:Arial,Helvetica,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px"><tr><td align="center">
    <table width="480" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:14px;overflow:hidden">
      <tr><td style="background:#111;padding:20px 28px;color:#fff;font-size:18px;font-weight:bold">Novamente</td></tr>
      <tr><td style="padding:28px">
        <p style="font-size:17px;color:#111;margin:0 0 6px"><b>¡Hola ${opts.tenantName}!</b></p>
        <p style="font-size:14px;color:#555;line-height:1.5;margin:0 0 18px">
          Empezaste tu suscripción al plan <b>${opts.planName}</b> de Novamente Partners y el pago quedó sin completar.
          Tu tienda y todos los beneficios del plan ${opts.planName} te siguen esperando — no perdiste nada de lo que ya armaste.
        </p>
        <a href="${opts.billingUrl}" style="display:inline-block;background:#111;color:#fff;text-decoration:none;font-size:15px;font-weight:bold;padding:13px 30px;border-radius:8px">
          Completar suscripción →
        </a>
        <p style="font-size:12px;color:#999;margin:22px 0 0;line-height:1.5">
          ¿Tuviste algún problema con el pago? Respondé este mail o escribinos por
          <a href="https://wa.me/5492235169720" style="color:#666">WhatsApp</a> y te ayudamos.
        </p>
      </td></tr>
      <tr><td style="background:#fafafa;padding:14px 28px;font-size:11px;color:#aaa">
        Novamente Partners · novamente.ar
      </td></tr>
    </table>
  </td></tr></table></body></html>`
}

export function pendingSubscriptionFollowupSubject(planName: string): string {
  return `Te quedó a un paso tu plan ${planName} de Novamente`
}

/** Construye el HTML + subject para un tenant dado, listos para pasar a sendEmail. */
export function buildPendingSubscriptionFollowupEmail(
  tenant: Pick<Tenant, 'name' | 'plan'>,
  meta: Pick<SubscriptionMeta, 'pending_plan'> | null | undefined,
): { subject: string; html: string } {
  const planName = planLabel(meta, tenant.plan)
  return {
    subject: pendingSubscriptionFollowupSubject(planName),
    html: pendingSubscriptionFollowupHtml({
      tenantName: tenant.name,
      planName,
      billingUrl: `${PENDING_FOLLOWUP_BASE_URL}/workspace/billing`,
    }),
  }
}
