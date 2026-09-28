/**
 * Ajuste MANUAL al saldo de un partner (bonificación o corrección), auditado.
 * Lógica y guardas en lib/partners/ledger-adjust.ts.
 *
 *   node --conditions=react-server --import tsx scripts/partner-ledger-adjust.mts \
 *     --partner <slug|uuid> --monto <+N|-N> --motivo "<texto>" --autoriza "<quién>" \
 *     [--pedido <NOV-...|uuid>] [--execute]
 *
 * Sin --execute es dry-run: muestra el asiento y el saldo antes/después, no escribe.
 * Monto positivo = a favor del partner; negativo = en contra. Tope: MAX_AJUSTE_ARS.
 * Correrlo dos veces con los mismos datos no duplica (clave de idempotencia).
 */
import { config as loadEnv } from 'dotenv'

loadEnv({ path: '.env.local' })

const args = process.argv.slice(2)
const arg = (name: string) => {
  const i = args.indexOf(name)
  return i >= 0 ? args[i + 1] : undefined
}
const execute = args.includes('--execute')
const partner = arg('--partner')
const monto = Number(arg('--monto'))
const motivo = arg('--motivo') || ''
const autoriza = arg('--autoriza') || ''
const pedido = arg('--pedido')

if (!partner || !arg('--monto')) {
  console.error('Uso: --partner <slug|uuid> --monto <+N|-N> --motivo "<texto>" --autoriza "<quién>" [--pedido <NOV-...|uuid>] [--execute]')
  process.exit(1)
}

const { supabaseAdmin } = await import('../lib/supabase-admin')
const { aplicarAjuste } = await import('../lib/partners/ledger-adjust')
const sb = supabaseAdmin as any
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const { data: tenant } = await sb
  .from('tenants')
  .select('id, slug, name')
  .eq(UUID.test(partner) ? 'id' : 'slug', partner)
  .maybeSingle()
if (!tenant) {
  console.error(`No existe el partner "${partner}"`)
  process.exit(1)
}

let orderId: string | null = null
let orderNumber: string | null = null
if (pedido) {
  const { data: order } = await sb
    .from('orders')
    .select('id, order_number, tenant_id')
    .eq(UUID.test(pedido) ? 'id' : 'order_number', pedido)
    .maybeSingle()
  if (!order) {
    console.error(`No existe el pedido "${pedido}"`)
    process.exit(1)
  }
  if (order.tenant_id !== tenant.id) {
    const { data: credito } = await sb
      .from('partner_ledger_entries')
      .select('id')
      .eq('tenant_id', tenant.id)
      .eq('order_id', order.id)
      .limit(1)
    if (!credito?.length) {
      console.error(`El pedido ${order.order_number} no es de ${tenant.slug} (ni tiene un crédito suyo).`)
      process.exit(1)
    }
  }
  orderId = order.id
  orderNumber = order.order_number
}

const ars = (n: number | undefined) => (n == null ? '—' : `$${Math.round(n).toLocaleString('es-AR')}`)
const r = await aplicarAjuste(
  { tenantId: tenant.id, amount: monto, motivo, autorizadoPor: autoriza, orderId, orderNumber },
  { execute },
)

console.log(`\n${execute ? '⚠️  EJECUCIÓN' : '🔎 DRY-RUN (no escribe nada)'} — ajuste a ${tenant.slug} (${tenant.name})`)
if (!r.ok) {
  console.error(`❌ ${r.error}`)
  process.exit(1)
}
if (r.asiento) console.log(`   ${r.asiento.type} ${ars(r.asiento.amount)} · "${r.asiento.concept}" · autoriza: ${r.asiento.metadata.autorizado_por}`)
if (r.yaExistia) console.log(`   ℹ️  Ya existía este mismo ajuste (entry ${r.entryId}); no se duplica.`)
else if (!r.dryRun) console.log(`   ✅ Insertado (entry ${r.entryId}).`)
console.log(`   Saldo del partner: ${ars(r.saldoAntes)} → ${ars(r.saldoDespues)}`)
if (r.dryRun && !r.yaExistia) console.log('\nPara ejecutar: agregá --execute\n')
