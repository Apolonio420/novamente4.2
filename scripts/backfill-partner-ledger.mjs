/**
 * Backfill del ledger: acredita el margen de ventas web confirmadas históricas
 * de tiendas partner (orders con tenant_id + status confirmed).
 * Idempotente: el unique index uq_ledger_order_credit evita duplicados.
 *
 * Uso: node scripts/backfill-partner-ledger.mjs [--dry]
 */
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const env = readFileSync(join(__dirname, '..', '.env.local'), 'utf8')
const get = (k) => (env.match(new RegExp(`^${k}="?([^"\\n]+)"?`, 'm')) || [])[1]
const sb = createClient(get('NEXT_PUBLIC_SUPABASE_URL'), get('SUPABASE_SERVICE_ROLE_KEY'))
const DRY = process.argv.includes('--dry')

// ── pricing mínimo (espejo de lib/partners/garment-pricing.ts) ──
const PRICING = {
  'aldea-classic-tshirt': { on_demand: 25800, growth_delta: 1000, cost: 22670 },
  'aura-oversize-tshirt': { on_demand: 26600, growth_delta: 1000, cost: 23470 },
  'remera-clasica-mujer': { on_demand: 25800, growth_delta: 1000, cost: 22670 },
  'remera-crop-mujer': { on_demand: 20800, growth_delta: 1000, cost: 18100 },
  'buzo-cuello-redondo': { on_demand: 32200, growth_delta: 1000, cost: 28170 },
  'buzo-hoodie-unisex': { on_demand: 38700, growth_delta: 1000, cost: 30170 },
  'musculosa-bali': { on_demand: 20800, growth_delta: 1000, cost: 18100 },
}
function planPrice(key, plan) {
  const p = PRICING[key]
  if (!p) return null
  return plan === 'starter' ? p.on_demand : p.cost + p.growth_delta
}
function guessKey(raw) {
  const s = (raw || '').toLowerCase()
  if (/aura|oversize/.test(s) && /remera|tshirt|t-shirt|shirt/.test(s)) return 'aura-oversize-tshirt'
  if (/aldea|classic/.test(s) && /remera|tshirt|t-shirt|shirt/.test(s)) return 'aldea-classic-tshirt'
  if (/hoodie|boston|capucha/.test(s)) return 'buzo-hoodie-unisex'
  if (/crewneck|berlin|cuello redondo/.test(s)) return 'buzo-cuello-redondo'
  if (/crop|bahamas/.test(s)) return 'remera-crop-mujer'
  if (/musculosa|bali/.test(s)) return 'musculosa-bali'
  if (/remera|tshirt|t-shirt/.test(s)) return 'aura-oversize-tshirt'
  if (/buzo/.test(s)) return 'buzo-hoodie-unisex'
  return null
}

// ── órdenes web confirmadas con tenant ──
const { data: orders, error } = await sb
  .from('orders')
  .select('id, order_number, tenant_id, status, total')
  .not('tenant_id', 'is', null)
  .eq('status', 'confirmed')
if (error) { console.error('❌', error.message); process.exit(1) }
console.log(`${orders.length} órdenes web confirmadas con tenant`)

let credited = 0, skipped = 0, review = 0
for (const o of orders) {
  const [{ data: items }, { data: tenant }, { data: products }] = await Promise.all([
    sb.from('order_items').select('item_name, product_type, quantity, unit_price, total_price').eq('order_id', o.id),
    sb.from('tenants').select('plan, name').eq('id', o.tenant_id).maybeSingle(),
    sb.from('partner_products').select('name, category, metadata').eq('tenant_id', o.tenant_id),
  ])
  const plan = tenant?.plan || 'starter'
  let margin = 0, needsReview = false
  const breakdown = []
  for (const it of items || []) {
    const qty = Number(it.quantity) || 1
    const unit = Number(it.unit_price) || (Number(it.total_price) || 0) / qty
    const prod = (products || []).find((p) => p.name && (it.item_name || '').toLowerCase().startsWith(p.name.toLowerCase()))
    const meta = prod?.metadata || {}
    let cost = Number(meta.cost_partner ?? meta.cost_ars)
    let via = 'metadata.cost'
    if (!Number.isFinite(cost) || cost <= 0) {
      const key = (typeof meta.garmentKey === 'string' && PRICING[meta.garmentKey]) ? meta.garmentKey
        : guessKey(meta.model || prod?.category || it.product_type || it.item_name)
      cost = key ? planPrice(key, plan) : null
      via = key ? `key:${key}` : 'unresolved'
    }
    if (cost == null) { needsReview = true } else { margin += Math.max(0, unit - cost) * qty }
    breakdown.push({ item: it.item_name, qty, unit, cost, via })
  }
  margin = Math.round(margin)
  if (margin <= 0 && !needsReview) { skipped++; continue }
  console.log(`  ${o.order_number} · ${tenant?.name} · margen $${margin}${needsReview ? ' [REVIEW]' : ''}`)
  if (DRY) { credited++; continue }
  const { error: insErr } = await sb.from('partner_ledger_entries').insert({
    tenant_id: o.tenant_id,
    order_id: o.id,
    source: 'web_order',
    type: 'credit',
    amount: margin,
    concept: `Margen venta ${o.order_number} (backfill)`,
    status: needsReview ? 'needs_review' : 'confirmed',
    metadata: { breakdown, plan, backfill: true },
  })
  if (insErr) {
    if (insErr.code === '23505') skipped++
    else console.error('  ❌', insErr.message)
  } else { credited++; if (needsReview) review++ }
}
console.log(`\n✅ Backfill${DRY ? ' (DRY RUN)' : ''}: ${credited} acreditadas · ${skipped} salteadas · ${review} en revisión`)
process.exit(0)
