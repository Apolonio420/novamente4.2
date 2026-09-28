import { type NextRequest, NextResponse } from 'next/server'
import { sweepPartnerCredits } from '@/lib/partners/ledger-sweep'
import { esLunesArgentina, sendWeeklyPayoutReminder } from '@/lib/partners/payout-reminder'
import { notifyError } from '@/lib/notifications'

/**
 * GET /api/cron/partners/ledger-sweep — diario 08:15 ART (vercel.json).
 *
 * 1. Barrido: acredita la ganancia de las ventas web de partners que quedaron
 *    pagadas sin crédito en el ledger (lib/partners/ledger-sweep.ts). Cada crédito
 *    nuevo avisa por Telegram ("💸 Deuda partner …"); no le manda mail al partner.
 * 2. Los lunes: recordatorio de pagos a partners de la semana
 *    (lib/partners/payout-reminder.ts). Solo si hay algo para pagar o revisar.
 *
 * `?dry=1` → solo reporta qué acreditaría (no escribe, no avisa).
 * Auth: Bearer CRON_SECRET (lo manda Vercel en el cron nativo), igual que los
 * demás crons de partners.
 */
export const runtime = 'nodejs'
export const maxDuration = 120

export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET
  const bearerOk = !!cronSecret && request.headers.get('authorization') === `Bearer ${cronSecret}`
  if (!bearerOk) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const dryRun = request.nextUrl.searchParams.get('dry') === '1'
  const result: Record<string, unknown> = { dryRun }

  try {
    const sweep = await sweepPartnerCredits({ dryRun })
    result.scanned = sweep.scanned
    result.missing = sweep.missing.map((e) => ({
      order: e.order.order_number || e.order.id,
      planned: e.planned?.map((c) => ({ tenantId: c.tenantId, amount: c.amount, needsReview: c.needsReview, reasons: c.reasons })),
      credited: e.credited,
      error: e.error,
    }))
    const errores = sweep.missing.filter((e) => e.error)
    if (errores.length && !dryRun) {
      await notifyError({
        endpoint: '/api/cron/partners/ledger-sweep',
        area: 'Ganancias partners',
        message: `No se pudo acreditar ${errores.length} venta(s) de partner: ${errores
          .map((e) => `${e.order.order_number || e.order.id} (${e.error})`)
          .join('; ')}`,
      }).catch(() => null)
    }
  } catch (e: any) {
    result.sweepError = e?.message || String(e)
    if (!dryRun) {
      await notifyError({
        endpoint: '/api/cron/partners/ledger-sweep',
        area: 'Ganancias partners',
        message: String(result.sweepError),
      }).catch(() => null)
    }
  }

  if (!dryRun && esLunesArgentina()) {
    try {
      const r = await sendWeeklyPayoutReminder()
      result.weeklyReminder = { sent: r.sent, hadContent: !!r.message }
    } catch (e: any) {
      result.weeklyReminderError = e?.message || String(e)
    }
  }

  return NextResponse.json(result)
}
