import { type NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { updateTenant } from '@/lib/partners/tenant'
import { bumpPromoToStandardIfDue } from '@/lib/partners/subscription'
import { notifyError, notifySubscriptionExpiring, notifySubscriptionSuspended } from '@/lib/notifications'

// Nunca corrió por Vercel cron hasta ahora (no estaba en vercel.json — ver
// registro agregado 2026-07-18). Se agregan runtime/maxDuration siguiendo el
// mismo patrón que los demás crons de este directorio (abandoned-checkout,
// cleanup-tryon-selfies): loopea tenants y llama a la API de MP (promo bump),
// puede tardar más que el default de una function normal.
export const runtime = 'nodejs'
export const maxDuration = 120

const db = () => supabaseAdmin as any

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization')
  // Auth: cron nativo de Vercel (header x-vercel-cron) o Bearer CRON_SECRET —
  // mismo patrón que abandoned-checkout. Solo-Bearer dejaría el cron en 401
  // silencioso si CRON_SECRET no está seteado en el proyecto de Vercel.
  const isVercelCron = !!request.headers.get('x-vercel-cron')
  const cronSecret = process.env.CRON_SECRET
  const bearerOk = !!cronSecret && authHeader === `Bearer ${cronSecret}`

  if (!isVercelCron && !bearerOk) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const results = {
    expired_checked: 0,
    grace_period: 0,
    suspended: 0,
    dunning_sent: 0,
    promo_bumped: 0,
    pending_stale: 0,
    errors: [] as string[],
  }

  try {
    const now = new Date().toISOString()

    // 1. Find expired tenants (subscription_expires_at < NOW, plan != starter, status = active)
    const { data: expiredTenants, error: expiredError } = await db()
      .from('tenants')
      .select('*')
      .lt('subscription_expires_at', now)
      .neq('plan', 'starter')
      .eq('status', 'active')

    if (expiredError) {
      console.error('Error querying expired tenants:', expiredError)
      results.errors.push(`Query expired: ${expiredError.message}`)
    }

    if (expiredTenants && expiredTenants.length > 0) {
      results.expired_checked = expiredTenants.length

      for (const tenant of expiredTenants) {
        try {
          // Las suscripciones recurrentes las gestiona MercadoPago (débito + reintentos).
          // La baja llega por el webhook subscription_preapproval; no las suspendemos
          // por vencimiento acá para no cortar a un partner que MP sigue cobrando.
          //
          // Hallazgo [9]: este `continue` es SOLO para 'recurring' (autorizado real
          // por MP), nunca para 'recurring_pending' (checkout mensual creado, MP
          // todavía no autorizó nada — ver persistPendingSubscription en
          // lib/partners/subscription.ts). Un tenant en 'recurring_pending' cae en
          // la lógica normal de abajo (grace period → suspensión): si el checkout se
          // abandonó y nunca hubo un authorized, no hay ningún cobro de MP que
          // vigilar, así que debe tratarse como cualquier plan no recurrente vencido.
          if ((tenant.metadata as any)?.subscription_type === 'recurring') {
            continue
          }
          const currentFailures = tenant.payment_failures || 0

          if (currentFailures < 3) {
            // Grace period: increment failures, keep active
            await updateTenant(tenant.id, {
              payment_failures: currentFailures + 1,
            } as any)
            results.grace_period++

            console.log(`Tenant ${tenant.name}: payment failure ${currentFailures + 1}/3 (grace period)`)
          } else {
            // 3+ failures: suspend
            await updateTenant(tenant.id, {
              status: 'suspended',
              storefront_published: false,
            } as any)
            results.suspended++

            console.log(`Tenant ${tenant.name}: SUSPENDED (${currentFailures}+ payment failures)`)

            // Send Telegram notification
            try {
              await notifySubscriptionSuspended({
                name: tenant.name,
                plan: tenant.plan,
                email: tenant.email,
              })
            } catch (e) {
              console.error('Failed to send suspension notification:', e)
            }
          }
        } catch (e: any) {
          results.errors.push(`Tenant ${tenant.id}: ${e.message}`)
        }
      }
    }

    // 2. Find tenants expiring in next 3 days (dunning notifications)
    const threeDaysFromNow = new Date()
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3)

    const { data: expiringTenants, error: expiringError } = await db()
      .from('tenants')
      .select('*')
      .gt('subscription_expires_at', now)
      .lt('subscription_expires_at', threeDaysFromNow.toISOString())
      .neq('plan', 'starter')
      .eq('status', 'active')

    if (expiringError) {
      console.error('Error querying expiring tenants:', expiringError)
      results.errors.push(`Query expiring: ${expiringError.message}`)
    }

    if (expiringTenants && expiringTenants.length > 0) {
      for (const tenant of expiringTenants) {
        try {
          await notifySubscriptionExpiring({
            name: tenant.name,
            plan: tenant.plan,
            expiresAt: tenant.subscription_expires_at,
          })
          results.dunning_sent++

          console.log(`Dunning notification sent for tenant: ${tenant.name} (expires: ${tenant.subscription_expires_at})`)
        } catch (e: any) {
          console.error('Failed to send dunning notification:', e)
          results.errors.push(`Dunning ${tenant.id}: ${e.message}`)
        }
      }
    }

    // 3. Promo bump: suscripciones recurrentes cuya promo de 12 meses venció → subir a precio standard
    const { data: recurringTenants, error: recurringError } = await db()
      .from('tenants')
      .select('*')
      .eq('status', 'active')
      .eq('metadata->>subscription_type', 'recurring')
      .not('mp_subscription_id', 'is', null)

    if (recurringError) {
      results.errors.push(`Query recurring: ${recurringError.message}`)
    }

    if (recurringTenants && recurringTenants.length > 0) {
      for (const tenant of recurringTenants) {
        try {
          const bumped = await bumpPromoToStandardIfDue(tenant, now)
          if (bumped) results.promo_bumped++
        } catch (e: any) {
          results.errors.push(`Promo bump ${tenant.id}: ${e.message}`)
        }
      }
    }

    // 4. Reconciliación (hallazgo [8]): checkouts mensuales que quedaron en
    // 'recurring_pending' hace >48h. Dos causas posibles, ambas requieren ojo
    // humano: (a) el partner autorizó pero el webhook de suscripción nunca llegó
    // (URL de tópicos subscription_* mal apuntada en el dashboard de MP → MP
    // cobra y el tenant nunca se activa), o (b) abandonó el checkout (inofensivo,
    // el cron ya lo suspende por vencimiento — bloque 1). No podemos distinguir
    // (a) de (b) sin consultar MP, así que solo alertamos para revisión manual.
    const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString()
    const { data: stalePending, error: stalePendingError } = await db()
      .from('tenants')
      .select('id, name, email, mp_subscription_id, updated_at')
      .eq('metadata->>subscription_type', 'recurring_pending')
      .lt('updated_at', twoDaysAgo)

    if (stalePendingError) {
      results.errors.push(`Query recurring_pending: ${stalePendingError.message}`)
    }

    if (stalePending && stalePending.length > 0) {
      results.pending_stale = stalePending.length
      try {
        await notifyError({
          endpoint: '/api/cron/partners/check-subscriptions',
          area: 'suscripciones: recurring_pending >48h sin autorizar',
          message:
            `${stalePending.length} tenant(s) con checkout mensual creado hace >48h y nunca autorizado. ` +
            `Verificar en MP si el preapproval está authorized (webhook de tópicos subscription_* mal configurado → cobrado sin activar) ` +
            `o abandonado (sin acción): ` +
            stalePending
              .map((t: any) => `${t.name} <${t.email}> preapproval=${t.mp_subscription_id}`)
              .join(' · '),
        })
      } catch (e: any) {
        results.errors.push(`Alerta recurring_pending: ${e.message}`)
      }
    }

    console.log('Subscription check completed:', results)

    return NextResponse.json({
      ok: true,
      ...results,
    })
  } catch (error: any) {
    console.error('Subscription check cron error:', error)
    return NextResponse.json(
      { error: 'Internal error', details: error.message },
      { status: 500 }
    )
  }
}
