import { type NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { updateTenant } from '@/lib/partners/tenant'
import { bumpPromoToStandardIfDue } from '@/lib/partners/subscription'
import { notifySubscriptionExpiring, notifySubscriptionSuspended } from '@/lib/notifications'

const db = () => supabaseAdmin as any

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const results = {
    expired_checked: 0,
    grace_period: 0,
    suspended: 0,
    dunning_sent: 0,
    promo_bumped: 0,
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
