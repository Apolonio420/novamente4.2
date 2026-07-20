/**
 * Emails al PARTNER durante el ciclo de vida de su suscripción, disparados
 * desde app/api/cron/partners/check-subscriptions/route.ts junto a los avisos
 * de Telegram existentes (que solo llegan al equipo, nunca al partner). Mismo
 * look & feel (tabla 480px) que ./pending-subscription-followup.ts y
 * ./subscription-activated-email.ts.
 *
 * Separado del cron para poder testear el armado del HTML/subject y la lógica
 * de dedupe sin mockear sendEmail ni Supabase.
 */
import { PLAN_NAMES } from './plans'
import type { Plan } from './types'

export const SUBSCRIPTION_LIFECYCLE_BILLING_URL = 'https://www.novamente.ar/workspace/billing'

function planName(plan: string): string {
  return PLAN_NAMES[plan as Plan] || plan
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })
}

function shell(bodyHtml: string): string {
  return `<!DOCTYPE html><html><body style="margin:0;background:#f5f5f5;font-family:Arial,Helvetica,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px"><tr><td align="center">
    <table width="480" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:14px;overflow:hidden">
      <tr><td style="background:#111;padding:20px 28px;color:#fff;font-size:18px;font-weight:bold">Novamente</td></tr>
      <tr><td style="padding:28px">
        ${bodyHtml}
      </td></tr>
      <tr><td style="background:#fafafa;padding:14px 28px;font-size:11px;color:#aaa">
        Novamente Partners · novamente.ar
      </td></tr>
    </table>
  </td></tr></table></body></html>`
}

// ---------------------------------------------------------------------------
// 1. Dunning — la suscripción vence en ≤3 días
// ---------------------------------------------------------------------------

export function subscriptionExpiringSubject(plan: string, expiresAtISO: string): string {
  return `Tu plan ${planName(plan)} vence el ${formatDate(expiresAtISO)}`
}

export function subscriptionExpiringHtml(opts: {
  tenantName: string
  plan: string
  expiresAtISO: string
  billingUrl: string
}): string {
  return shell(`
    <p style="font-size:17px;color:#111;margin:0 0 6px"><b>¡Hola ${opts.tenantName}!</b></p>
    <p style="font-size:14px;color:#555;line-height:1.5;margin:0 0 18px">
      Tu plan <b>${planName(opts.plan)}</b> de Novamente Partners vence el
      <b>${formatDate(opts.expiresAtISO)}</b>. Renovalo antes de esa fecha para que tu tienda
      siga activa sin cortes.
    </p>
    <a href="${opts.billingUrl}" style="display:inline-block;background:#111;color:#fff;text-decoration:none;font-size:15px;font-weight:bold;padding:13px 30px;border-radius:8px">
      Renovar mi plan →
    </a>
    <p style="font-size:12px;color:#999;margin:22px 0 0;line-height:1.5">
      ¿Alguna duda con el pago? Respondé este mail o escribinos por
      <a href="https://wa.me/5492235169720" style="color:#666">WhatsApp</a> y te ayudamos.
    </p>
  `)
}

export function buildSubscriptionExpiringEmail(
  tenant: { name: string; plan: string },
  expiresAtISO: string,
): { subject: string; html: string } {
  return {
    subject: subscriptionExpiringSubject(tenant.plan, expiresAtISO),
    html: subscriptionExpiringHtml({
      tenantName: tenant.name,
      plan: tenant.plan,
      expiresAtISO,
      billingUrl: SUBSCRIPTION_LIFECYCLE_BILLING_URL,
    }),
  }
}

/** Dedupe por período: no reenviar mientras subscription_expires_at no cambie. */
export function shouldSendExpiryEmail(
  metadata: Record<string, unknown> | null | undefined,
  expiresAtISO: string | null | undefined,
): boolean {
  if (!expiresAtISO) return false
  return metadata?.expiry_email_sent_for !== expiresAtISO
}

// ---------------------------------------------------------------------------
// 2. Suspensión — 3 fallas de pago, tienda offline
// ---------------------------------------------------------------------------

export function subscriptionSuspendedSubject(): string {
  return 'Pausamos tu tienda por un problema con el pago'
}

export function subscriptionSuspendedHtml(opts: { tenantName: string; plan: string; billingUrl: string }): string {
  return shell(`
    <p style="font-size:17px;color:#111;margin:0 0 6px"><b>Hola ${opts.tenantName},</b></p>
    <p style="font-size:14px;color:#555;line-height:1.5;margin:0 0 18px">
      No pudimos procesar el pago de tu plan <b>${planName(opts.plan)}</b> después de varios intentos,
      así que tu tienda quedó pausada (offline) por ahora. Nada se perdió — tus productos,
      diseños y pedidos siguen guardados tal como los dejaste.
    </p>
    <p style="font-size:14px;color:#555;line-height:1.5;margin:0 0 18px">
      Para reactivarla, solo tenés que poner el pago al día.
    </p>
    <a href="${opts.billingUrl}" style="display:inline-block;background:#111;color:#fff;text-decoration:none;font-size:15px;font-weight:bold;padding:13px 30px;border-radius:8px">
      Reactivar mi tienda →
    </a>
    <p style="font-size:12px;color:#999;margin:22px 0 0;line-height:1.5">
      Si tuviste un problema con la tarjeta o el pago, respondé este mail o escribinos por
      <a href="https://wa.me/5492235169720" style="color:#666">WhatsApp</a> y lo resolvemos juntos.
    </p>
  `)
}

export function buildSubscriptionSuspendedEmail(tenant: { name: string; plan: string }): {
  subject: string
  html: string
} {
  return {
    subject: subscriptionSuspendedSubject(),
    html: subscriptionSuspendedHtml({
      tenantName: tenant.name,
      plan: tenant.plan,
      billingUrl: SUBSCRIPTION_LIFECYCLE_BILLING_URL,
    }),
  }
}

/** Mismo esquema de dedupe que el email de vencimiento, sobre su propia marca. */
export function shouldSendSuspensionEmail(
  metadata: Record<string, unknown> | null | undefined,
  expiresAtISO: string | null | undefined,
): boolean {
  if (!expiresAtISO) return false
  return metadata?.suspension_email_sent_for !== expiresAtISO
}
