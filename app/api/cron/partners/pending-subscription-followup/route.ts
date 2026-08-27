/**
 * Follow-up de checkouts de suscripción mensual abandonados.
 *
 * Un partner que arrancó el checkout mensual (PreApproval de MP) pero nunca
 * autorizó el débito queda en metadata.subscription_type='recurring_pending'
 * con last_payment_at null (ver persistPendingSubscription en
 * lib/partners/subscription.ts). Este cron le manda hasta 3 emails
 * recordándole completar la suscripción: a las 24h, a los 7 días y a los 14
 * días del primero. Lógica de timing + idempotencia (metadata.subscription_followups)
 * en lib/partners/pending-subscription-followup.ts, testeada aparte.
 *
 * Deliberadamente separado de check-subscriptions (vencimiento/suspensión) y
 * de subscription.ts (ciclo de vida real con MP) — no las toca.
 *
 * Corre por Vercel cron (vercel.json). Auth: Bearer CRON_SECRET o header
 * Bearer CRON_SECRET (Vercel lo manda solo), mismo patrón que
 * abandoned-checkout y cleanup-tryon-selfies. ?dry=1 para previsualizar sin
 * mandar mails ni escribir en la DB.
 */
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { sendEmail } from '@/lib/email'
import { updateTenant } from '@/lib/partners/tenant'
import {
  decideNextFollowup,
  buildPendingSubscriptionFollowupEmail,
} from '@/lib/partners/pending-subscription-followup'
import type { SubscriptionMeta } from '@/lib/partners/subscription'

export const runtime = 'nodejs'
export const maxDuration = 120

const MAX_PER_RUN = 30

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET
  const bearerOk = !!secret && request.headers.get('authorization') === `Bearer ${secret}`
  // El header x-vercel-cron lo puede mandar CUALQUIERA con un curl: no es una
  // credencial, es una etiqueta. Mientras CRON_SECRET no existiera, aceptarlo
  // era la única forma de que el cron corriera — pero también dejaba que
  // cualquiera lo disparara (uno de estos suspende partners y les manda mail).
  // CRON_SECRET ya está seteado en producción y Vercel lo manda solo en el
  // header Authorization, así que ahora se exige de verdad.
  if (!bearerOk) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const dry = request.nextUrl.searchParams.get('dry') === '1'

  const sb = supabaseAdmin as any
  const nowISO = new Date().toISOString()

  const { data: tenants, error } = await sb
    .from('tenants')
    .select('id, slug, name, email, plan, updated_at, metadata, last_payment_at')
    .eq('metadata->>subscription_type', 'recurring_pending')
    .is('last_payment_at', null)
    .limit(MAX_PER_RUN)

  if (error) {
    console.error('[pending-subscription-followup] query failed:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const results: Array<{ slug: string; status: string }> = []

  for (const tenant of tenants || []) {
    const meta: SubscriptionMeta = (tenant.metadata as SubscriptionMeta) || {}
    try {
      if (!tenant.email) {
        results.push({ slug: tenant.slug, status: 'skip: tenant sin email' })
        console.warn(`[pending-subscription-followup] ${tenant.slug} sin email, salteado`)
        continue
      }

      if (meta.subscription_followup_optout === true) {
        results.push({ slug: tenant.slug, status: 'skip: optout (cobro gestionado a mano)' })
        continue
      }

      const decision = decideNextFollowup(meta, tenant.updated_at, nowISO)
      if (decision.send === false) {
        results.push({ slug: tenant.slug, status: `skip: ${decision.reason}` })
        continue
      }

      if (dry) {
        results.push({ slug: tenant.slug, status: `DRY → stage ${decision.stage} a ${tenant.email}` })
        continue
      }

      const { subject, html } = buildPendingSubscriptionFollowupEmail(tenant, meta)
      const sent = await sendEmail({ to: tenant.email, subject, html })
      if (!sent.ok) {
        results.push({ slug: tenant.slug, status: `email error: ${sent.error}` })
        continue
      }

      const followups = Array.isArray(meta.subscription_followups) ? [...meta.subscription_followups] : []
      followups.push(nowISO)
      await updateTenant(tenant.id, {
        metadata: { ...meta, subscription_followups: followups } as any,
      } as any)

      results.push({ slug: tenant.slug, status: `✅ stage ${decision.stage} enviado a ${tenant.email}` })
    } catch (e: any) {
      results.push({ slug: tenant.slug, status: `error: ${e?.message?.slice(0, 160)}` })
      console.error(`[pending-subscription-followup] ${tenant.slug} failed:`, e)
    }
  }

  console.log('[pending-subscription-followup]', JSON.stringify(results))
  return NextResponse.json({ dry, candidates: (tenants || []).length, results })
}
