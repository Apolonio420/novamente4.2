/**
 * Recordatorio SEMANAL de pagos a partners (decisión Juan 27/09/2026: Novamente
 * les paga de oficio una vez por semana, sin mínimo).
 *
 * Un solo Telegram (los lunes, desde el cron diario de ledger-sweep) con lo que
 * hay que transferirle a cada partner, a qué alias/CBU y desde cuándo se le
 * debe. Si no hay nada que pagar, no manda nada (alertas pocas y accionables).
 * El pago se registra en el admin (platform /dashboard/partners/ventas →
 * "Marcar pagado"), que descuenta el saldo con el RPC partner_admin_record_payout.
 */
import { supabaseAdmin } from '@/lib/supabase-admin'
import { computeFinancials } from './payouts'

export interface PartnerBalance {
  tenantId: string
  slug: string | null
  name: string | null
  bankAlias: string | null
  bankCbu: string | null
  available: number
  pendingReview: number
  paid: number
  /** Fecha del crédito confirmado más viejo que todavía no se pagó (FIFO). */
  oldestUnpaidAt: string | null
}

interface EntryRow {
  tenant_id: string
  type: 'credit' | 'debit'
  amount: number | string
  status: string | null
  created_at: string
}

const PAGE = 1000

async function allRows<T>(table: string, cols: string, orderBy: string): Promise<T[]> {
  const sb = supabaseAdmin as any
  const out: T[] = []
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await sb.from(table).select(cols).order(orderBy, { ascending: true }).range(from, from + PAGE - 1)
    if (error) throw new Error(`${table}: ${error.message}`)
    out.push(...(data || []))
    if (!data || data.length < PAGE) break
  }
  return out
}

/** FIFO: el crédito confirmado más viejo que los débitos todavía no cubren. */
export function oldestUnpaidCredit(entries: EntryRow[]): string | null {
  let debits = entries.filter((e) => e.type === 'debit').reduce((s, e) => s + (Number(e.amount) || 0), 0)
  const credits = entries
    .filter((e) => e.type === 'credit' && e.status !== 'needs_review')
    .sort((a, b) => a.created_at.localeCompare(b.created_at))
  for (const c of credits) {
    const amt = Number(c.amount) || 0
    if (amt <= 0) continue
    if (debits >= amt) {
      debits -= amt
      continue
    }
    return c.created_at
  }
  return null
}

export async function getPartnerBalances(): Promise<PartnerBalance[]> {
  const sb = supabaseAdmin as any
  const [entries, payouts] = await Promise.all([
    allRows<EntryRow>('partner_ledger_entries', 'tenant_id, type, amount, status, created_at', 'created_at'),
    // partner_payouts no tiene created_at (tiene requested_at/resolved_at).
    allRows<{ tenant_id: string; amount: number; status: string }>('partner_payouts', 'tenant_id, amount, status, requested_at', 'requested_at'),
  ])
  const tenantIds = [...new Set(entries.map((e) => e.tenant_id))]
  if (!tenantIds.length) return []
  const { data: tenants } = await sb
    .from('tenants')
    .select('id, slug, name, bank_alias, bank_cbu')
    .in('id', tenantIds)
  const tById = new Map<string, any>((tenants || []).map((t: any) => [t.id, t]))

  return tenantIds.map((tenantId) => {
    const es = entries.filter((e) => e.tenant_id === tenantId)
    const f = computeFinancials(es as any, payouts.filter((p) => p.tenant_id === tenantId))
    const t = tById.get(tenantId)
    return {
      tenantId,
      slug: t?.slug ?? null,
      name: t?.name ?? null,
      bankAlias: t?.bank_alias || null,
      bankCbu: t?.bank_cbu || null,
      available: f.available,
      pendingReview: f.pending,
      paid: f.paid,
      oldestUnpaidAt: f.available > 0 ? oldestUnpaidCredit(es) : null,
    }
  })
}

const ars = (n: number) => `$${Math.round(n || 0).toLocaleString('es-AR')}`
const escTg = (s: unknown) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

/** Arma el mensaje semanal. null = no hay nada para pagar ni revisar. */
export function buildWeeklyPayoutMessage(balances: PartnerBalance[], now = new Date()): string | null {
  const aPagar = balances.filter((b) => b.available > 0).sort((a, b) => b.available - a.available)
  const enRevision = balances.filter((b) => b.pendingReview > 0)
  const negativos = balances.filter((b) => b.available < 0)
  if (!aPagar.length && !enRevision.length) return null

  const total = aPagar.reduce((s, b) => s + b.available, 0)
  const lines: string[] = [`💸 <b>Pagos a partners de esta semana</b> — total ${ars(total)}`]
  for (const b of aPagar) {
    const dias = b.oldestUnpaidAt ? Math.floor((now.getTime() - new Date(b.oldestUnpaidAt).getTime()) / 86_400_000) : 0
    const banco = b.bankAlias ? `alias <code>${escTg(b.bankAlias)}</code>` : b.bankCbu ? `CBU <code>${escTg(b.bankCbu)}</code>` : '⚠️ SIN alias/CBU (pedíselo)'
    lines.push(`• <b>${escTg(b.slug || b.name || b.tenantId.slice(0, 8))}</b> ${ars(b.available)} → ${banco}${dias > 7 ? ` · ⚠️ impago hace ${dias} días` : ''}`)
  }
  if (enRevision.length) {
    lines.push('', `🔎 En revisión (no se pagan hasta aprobarlas): ${enRevision.map((b) => `${escTg(b.slug || b.tenantId.slice(0, 8))} ${ars(b.pendingReview)}`).join(', ')}`)
  }
  if (negativos.length) {
    lines.push(`↩️ Saldo negativo por reembolsos (se compensa con próximas ventas): ${negativos.map((b) => `${escTg(b.slug || b.tenantId.slice(0, 8))} ${ars(b.available)}`).join(', ')}`)
  }
  lines.push('', 'Transferí y registrá cada pago con el nro. de operación en <a href="https://admin.novamente.ar/dashboard/partners/ventas">admin → ventas partners</a>.')
  return lines.join('\n')
}

/** Lunes en hora argentina (UTC−3, sin horario de verano). */
export function esLunesArgentina(now = new Date()): boolean {
  return new Date(now.getTime() - 3 * 3_600_000).getUTCDay() === 1
}

export async function sendWeeklyPayoutReminder(now = new Date()): Promise<{ sent: boolean; message: string | null }> {
  const message = buildWeeklyPayoutMessage(await getPartnerBalances(), now)
  if (!message) return { sent: false, message: null }
  const { sendSalesTelegram } = await import('@/lib/notifications')
  const res = await sendSalesTelegram(message)
  return { sent: !!res, message }
}
