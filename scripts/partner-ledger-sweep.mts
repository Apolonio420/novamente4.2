/**
 * Barrido manual de ventas web de partners SIN crédito en el ledger.
 *
 * Reemplaza a scripts/backfill-partner-ledger.mjs, que tenía su propia copia de
 * precios (desincronizada del CATALOG) y la prioridad invertida (usaba
 * metadata.cost_partner antes que el precio del plan). Este usa EXACTAMENTE el
 * mismo código que el cron /api/cron/partners/ledger-sweep
 * (lib/partners/ledger-sweep.ts → creditOrderMargin).
 *
 *   node --conditions=react-server --import tsx scripts/partner-ledger-sweep.mts
 *       dry-run: muestra qué se acreditaría. NO escribe nada.
 *   node --conditions=react-server --import tsx scripts/partner-ledger-sweep.mts --execute
 *       acredita (ledger + partner_orders + Telegram "💸 Deuda partner"). NO le manda mail al partner.
 *   ... --order <uuid>   solo esa orden.
 *
 * `--conditions=react-server` hace que `import 'server-only'` resuelva al módulo vacío fuera de Next.
 */
import { config as loadEnv } from 'dotenv'

loadEnv({ path: '.env.local' })

const args = process.argv.slice(2)
const execute = args.includes('--execute')
const orderIdx = args.indexOf('--order')
const onlyOrderIds = orderIdx >= 0 && args[orderIdx + 1] ? [args[orderIdx + 1]] : undefined

const { sweepPartnerCredits } = await import('../lib/partners/ledger-sweep')
const { supabaseAdmin } = await import('../lib/supabase-admin')

const ars = (n: number | null | undefined) => (n == null ? '—' : `$${Math.round(n).toLocaleString('es-AR')}`)

const result = await sweepPartnerCredits({ dryRun: !execute, onlyOrderIds })
const tenantIds = [
  ...new Set(result.missing.flatMap((e) => [...(e.planned || []), ...(e.credited || [])].map((c) => c.tenantId))),
]
const { data: tenants } = tenantIds.length
  ? await (supabaseAdmin as any).from('tenants').select('id, slug').in('id', tenantIds)
  : { data: [] }
const slug = (id: string) => (tenants || []).find((t: any) => t.id === id)?.slug || id.slice(0, 8)

console.log(`\n${execute ? '⚠️  EJECUCIÓN' : '🔎 DRY-RUN (no escribe nada)'} — órdenes partner aprobadas revisadas: ${result.scanned}, sin crédito: ${result.missing.length}\n`)
let total = 0
for (const e of result.missing) {
  const o = e.order
  console.log(`■ ${o.order_number || o.id} · ${o.created_at.slice(0, 10)} · ${o.payment_method} · total ${ars(o.total)}`)
  if (e.error) console.log(`   ❌ ${e.error}`)
  for (const c of e.planned || []) {
    total += c.amount
    console.log(`   → ${slug(c.tenantId)} (plan ${c.plan}): ${ars(c.amount)}${c.needsReview ? `  [EN REVISIÓN: ${c.reasons.join(', ')}]` : ''}${c.descuento ? ` · descuento a su cargo ${ars(c.descuento)}` : ''}`)
    for (const l of c.breakdown) {
      console.log(
        `      ${l.qty}x ${l.item} [${l.color || '?'} ${l.talle || '?'}] PVP ${ars(l.unit)} − costo ${ars(l.costo_base)}${l.recargo_doble ? ` + ${ars(l.recargo_doble)} doble` : ''} = ${ars(l.cost)}${l.descuento ? ` − desc ${ars(l.descuento)}` : ''} → ganancia ${ars(l.ganancia)}  (${l.via}${l.doble_estampa ? `, doble/${l.clase_estampa}` : ''})`,
      )
    }
  }
  for (const c of e.credited || []) {
    total += c.amount
    console.log(`   ✅ ${slug(c.tenantId)}: ${ars(c.amount)} ${c.inserted ? 'acreditado' : 'ya existía'}${c.needsReview ? ` [EN REVISIÓN: ${c.reasons.join(', ')}]` : ''}`)
  }
}
console.log(`\nTotal ${execute ? 'acreditado' : 'a acreditar'}: ${ars(total)}${execute ? '' : '\nPara ejecutar: agregá --execute'}\n`)
