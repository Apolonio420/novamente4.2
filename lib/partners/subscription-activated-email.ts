/**
 * Emails de alta de suscripción paga (preapproval de MercadoPago autorizado, o
 * pago único anual aprobado). Dos emails:
 *   1. Bienvenida al partner (subscriptionActivatedHtml) — mismo look & feel
 *      (tabla 480px) que pendingSubscriptionFollowupHtml en
 *      ./pending-subscription-followup.ts.
 *   2. Copia interna corta para el equipo (adminSubscriptionActivatedHtml).
 *
 * Separado de lib/notifications.ts (que orquesta el envío + Telegram) para
 * poder testear el armado del HTML/subject sin mockear sendEmail.
 */
import { PLAN_FEATURES, PLAN_NAMES } from './plans'
import type { Plan } from './types'

export const SUBSCRIPTION_ACTIVATED_BILLING_URL = 'https://www.novamente.ar/workspace/billing'

export type BillingCycle = 'monthly' | 'annual'

function ars(n: number): string {
  return `$${Math.round(n).toLocaleString('es-AR')} ARS`
}

/**
 * Beneficios reales del plan (derivados de PLAN_FEATURES, no inventados) para
 * mostrar en el email de bienvenida sin hardcodear copy por plan.
 */
export function planBenefitBullets(plan: Plan): string[] {
  const f = PLAN_FEATURES[plan]
  const bullets: string[] = []
  if (f.storefrontDesigner) bullets.push('Diseñador de tienda personalizado')
  if (f.seoIndexable) bullets.push('Tienda indexable en Google (SEO)')
  if (f.badgeRemovable) bullets.push('Sin marca de agua de Novamente')
  if (f.chatbot) bullets.push('Chatbot de atención automática')
  if (f.analytics !== 'none') bullets.push(`Analíticas ${f.analytics === 'advanced' ? 'avanzadas' : 'básicas'}`)
  if (f.supportLevel !== 'none') bullets.push(`Soporte por ${f.supportLevel === 'whatsapp' ? 'WhatsApp' : 'email'}`)
  if (f.onboardingCall) bullets.push('Llamada de onboarding')
  if (f.feedExport) bullets.push('Exportación de feed de productos')
  return bullets
}

export function subscriptionActivatedSubject(planName: string): string {
  return `¡Bienvenido al plan ${planName} de Novamente! 🎉`
}

/** Email al partner — mismo estilo de tabla 480px que pendingSubscriptionFollowupHtml. */
export function subscriptionActivatedHtml(opts: {
  tenantName: string
  planName: string
  plan: Plan
  billingCycle: BillingCycle
  amountArs?: number
  billingUrl: string
}): string {
  const cycleLabel = opts.billingCycle === 'annual' ? 'año' : 'mes'
  const amountLine =
    opts.amountArs && opts.amountArs > 0
      ? `<p style="font-size:14px;color:#555;margin:0 0 18px"><b>Monto:</b> ${ars(opts.amountArs)} / ${cycleLabel}</p>`
      : ''
  const bullets = planBenefitBullets(opts.plan)
  const bulletsHtml = bullets.length
    ? `<ul style="font-size:14px;color:#333;line-height:1.6;margin:0 0 18px;padding-left:20px">
        ${bullets.map((b) => `<li>${b}</li>`).join('')}
      </ul>`
    : ''

  return `<!DOCTYPE html><html><body style="margin:0;background:#f5f5f5;font-family:Arial,Helvetica,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px"><tr><td align="center">
    <table width="480" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:14px;overflow:hidden">
      <tr><td style="background:#111;padding:20px 28px;color:#fff;font-size:18px;font-weight:bold">Novamente</td></tr>
      <tr><td style="padding:28px">
        <p style="font-size:17px;color:#111;margin:0 0 6px"><b>¡Hola ${opts.tenantName}!</b></p>
        <p style="font-size:14px;color:#555;line-height:1.5;margin:0 0 18px">
          Tu suscripción al plan <b>${opts.planName}</b> de Novamente Partners ya está <b>activa</b>. Gracias por confiar en nosotros.
        </p>
        ${amountLine}
        ${bulletsHtml}
        <a href="${opts.billingUrl}" style="display:inline-block;background:#111;color:#fff;text-decoration:none;font-size:15px;font-weight:bold;padding:13px 30px;border-radius:8px">
          Gestionar mi suscripción →
        </a>
        <p style="font-size:12px;color:#999;margin:22px 0 0;line-height:1.5">
          ¿Alguna duda? Respondé este mail o escribinos por
          <a href="https://wa.me/5492235169720" style="color:#666">WhatsApp</a> y te ayudamos.
        </p>
      </td></tr>
      <tr><td style="background:#fafafa;padding:14px 28px;font-size:11px;color:#aaa">
        Novamente Partners · novamente.ar
      </td></tr>
    </table>
  </td></tr></table></body></html>`
}

/** Construye subject + html del email de bienvenida para un tenant dado. */
export function buildSubscriptionActivatedEmail(opts: {
  tenantName: string
  plan: Plan
  billingCycle: BillingCycle
  amountArs?: number
}): { subject: string; html: string } {
  const planName = PLAN_NAMES[opts.plan] || opts.plan
  return {
    subject: subscriptionActivatedSubject(planName),
    html: subscriptionActivatedHtml({
      tenantName: opts.tenantName,
      planName,
      plan: opts.plan,
      billingCycle: opts.billingCycle,
      amountArs: opts.amountArs,
      billingUrl: SUBSCRIPTION_ACTIVATED_BILLING_URL,
    }),
  }
}

export function adminSubscriptionActivatedSubject(tenantName: string, planName: string): string {
  return `💰 Nueva suscripción: ${tenantName} → ${planName}`
}

/** Copia interna corta — sin tabla, solo los datos operativos del alta. */
export function adminSubscriptionActivatedHtml(opts: {
  tenantName: string
  tenantSlug: string
  planName: string
  billingCycle: BillingCycle
  amountArs?: number
  tenantEmail: string
  tenantPhone?: string | null
  dateISO: string
}): string {
  const cycleLabel = opts.billingCycle === 'annual' ? 'Anual' : 'Mensual'
  const dateLabel = new Date(opts.dateISO).toLocaleString('es-AR')
  return `<div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;color:#1a1a1a">
    <h2 style="margin:0 0 12px">💰 Nueva suscripción activada</h2>
    <p style="margin:0 0 4px"><b>Tienda:</b> ${opts.tenantName} (${opts.tenantSlug})</p>
    <p style="margin:0 0 4px"><b>Plan:</b> ${opts.planName} — ${cycleLabel}</p>
    ${opts.amountArs ? `<p style="margin:0 0 4px"><b>Monto:</b> ${ars(opts.amountArs)}</p>` : ''}
    <p style="margin:0 0 4px"><b>Email:</b> ${opts.tenantEmail}</p>
    <p style="margin:0 0 4px"><b>Teléfono:</b> ${opts.tenantPhone || 'No indicado'}</p>
    <p style="margin:0 0 4px"><b>Fecha:</b> ${dateLabel}</p>
    <p style="margin:16px 0 0;color:#888;font-size:12px">novamente.ar/p/${opts.tenantSlug}</p>
  </div>`
}

export function buildAdminSubscriptionActivatedEmail(opts: {
  tenantName: string
  tenantSlug: string
  plan: Plan
  billingCycle: BillingCycle
  amountArs?: number
  tenantEmail: string
  tenantPhone?: string | null
  nowISO: string
}): { subject: string; html: string } {
  const planName = PLAN_NAMES[opts.plan] || opts.plan
  return {
    subject: adminSubscriptionActivatedSubject(opts.tenantName, planName),
    html: adminSubscriptionActivatedHtml({
      tenantName: opts.tenantName,
      tenantSlug: opts.tenantSlug,
      planName,
      billingCycle: opts.billingCycle,
      amountArs: opts.amountArs,
      tenantEmail: opts.tenantEmail,
      tenantPhone: opts.tenantPhone,
      dateISO: opts.nowISO,
    }),
  }
}
