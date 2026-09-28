/**
 * Barrido de ventas web de partners SIN crédito en el ledger — red de seguridad.
 *
 * Hay varios caminos que marcan una orden como pagada: webhook/confirm de MP y el
 * link de transferencia (ambos corren runPartnerSaleEffects), pero también el
 * confirm manual de ventas del admin de platform (novamente-platform-master
 * app/api/admin/ventas/confirm) y cualquier edición a mano en la DB, que NO
 * acreditan. Además un proceso puede morir entre confirmar y acreditar. Este
 * barrido encuentra las órdenes aprobadas de tiendas partner sin crédito y les
 * corre los mismos efectos (idempotentes), SIN mail automático al partner — el
 * aviso de Telegram a Novamente dice que hay que avisarle a mano.
 *
 * Lo corren: el cron diario /api/cron/partners/ledger-sweep y el script
 * scripts/partner-ledger-sweep.ts (dry-run por defecto).
 */
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getOrderById } from '@/lib/db'
import { planOrderCredits, type PlannedCredit } from './ledger'
import { runPartnerSaleEffects, partnerSaleKey } from './sale-effects'

export interface SweepOrder {
  id: string
  order_number: string | null
  tenant_id: string
  payment_method: string | null
  created_at: string
  total: number | null
}

export interface SweepEntry {
  order: SweepOrder
  /** dry-run: lo que se acreditaría. */
  planned?: PlannedCredit[]
  /** ejecución: lo que se acreditó. */
  credited?: Array<{ tenantId: string; amount: number; needsReview: boolean; inserted: boolean; reasons: string[] }>
  error?: string
}

export interface SweepResult {
  dryRun: boolean
  scanned: number
  missing: SweepEntry[]
}

const PAGE = 1000
const CHUNK = 200

/** Órdenes de tiendas partner, pagadas y no canceladas, que no tienen crédito web_order. */
export async function findOrdersMissingCredit(opts: { sinceDays?: number } = {}): Promise<{
  scanned: number
  missing: SweepOrder[]
}> {
  const sb = supabaseAdmin as any
  const since = new Date(Date.now() - (opts.sinceDays ?? 180) * 86_400_000).toISOString()

  const orders: SweepOrder[] = []
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await sb
      .from('orders')
      .select('id, order_number, tenant_id, payment_method, created_at, total, status')
      .not('tenant_id', 'is', null)
      .eq('payment_status', 'approved')
      .gte('created_at', since)
      .order('created_at', { ascending: true })
      .range(from, from + PAGE - 1)
    if (error) throw new Error(`findOrdersMissingCredit(orders): ${error.message}`)
    for (const o of data || []) if (o.status !== 'cancelled') orders.push(o)
    if (!data || data.length < PAGE) break
  }

  const conCredito = new Set<string>()
  for (let i = 0; i < orders.length; i += CHUNK) {
    const ids = orders.slice(i, i + CHUNK).map((o) => o.id)
    const { data, error } = await sb
      .from('partner_ledger_entries')
      .select('order_id')
      .eq('type', 'credit')
      .eq('source', 'web_order')
      .in('order_id', ids)
    if (error) throw new Error(`findOrdersMissingCredit(ledger): ${error.message}`)
    for (const e of data || []) conCredito.add(e.order_id)
  }

  return { scanned: orders.length, missing: orders.filter((o) => !conCredito.has(o.id)) }
}

export async function sweepPartnerCredits(opts: {
  dryRun: boolean
  sinceDays?: number
  /** Limita a estas órdenes (ids) — para correr una sola a mano. */
  onlyOrderIds?: string[]
}): Promise<SweepResult> {
  const { scanned, missing } = await findOrdersMissingCredit({ sinceDays: opts.sinceDays })
  const target = opts.onlyOrderIds?.length ? missing.filter((o) => opts.onlyOrderIds!.includes(o.id)) : missing

  const entries: SweepEntry[] = []
  for (const o of target) {
    const entry: SweepEntry = { order: o }
    try {
      const full: any = await getOrderById(o.id)
      if (!full) throw new Error('no se pudo leer la orden con sus ítems')
      if (opts.dryRun) {
        entry.planned = (await planOrderCredits(full)).credits
      } else {
        const r = await runPartnerSaleEffects(full, {
          saleKey: partnerSaleKey(full),
          meta: { ...(full.metadata || {}) },
          notifyPartner: false,
        })
        entry.credited = (r.credit?.credits || []).map((c) => ({
          tenantId: c.tenantId,
          amount: c.amount,
          needsReview: c.needsReview,
          inserted: c.inserted,
          reasons: c.reasons,
        }))
        const fallidos = (r.credit?.credits || []).filter((c) => c.error)
        // Sin créditos = creditOrderMargin atrapó una excepción (una orden con
        // tenant_id siempre produce al menos una entry, aunque sea en revisión).
        if (!r.credit?.credits.length || fallidos.length) {
          entry.error = fallidos.map((c) => c.error).join('; ') || 'no se pudo acreditar (ver logs [ledger])'
        }
      }
    } catch (e: any) {
      entry.error = e?.message || String(e)
    }
    entries.push(entry)
  }
  return { dryRun: opts.dryRun, scanned, missing: entries }
}
