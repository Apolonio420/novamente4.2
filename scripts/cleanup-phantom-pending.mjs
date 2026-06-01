/**
 * Limpia pedidos "fantasma" — pendientes sin ningun rastro real de pago,
 * que ensucian el dashboard sin aportar valor.
 *
 * Reglas:
 *   1. orders:           payment_status='pending' AND payment_id IS NULL
 *      → checkouts iniciados que nunca pasaron por MercadoPago.
 *      También borramos sus order_items.
 *
 *   2. whatsapp_orders:  status='pending' AND mp_payment_id IS NULL
 *                        AND mp_preference_id IS NULL AND payment_link IS NULL
 *      → no hay link de pago ni preferencia → no es venta digital real.
 *
 * Uso:
 *   node scripts/cleanup-phantom-pending.mjs --dry-run   (default — solo mostrar)
 *   node scripts/cleanup-phantom-pending.mjs --execute   (borra de verdad)
 */
import { createClient } from "@supabase/supabase-js"
import { readFileSync, existsSync } from "fs"
import { join } from "path"

for (const f of [".env.local", ".env"]) {
  const p = join(process.cwd(), f)
  if (existsSync(p)) {
    for (const line of readFileSync(p, "utf8").split("\n")) {
      const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/)
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "")
    }
  }
}

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
)

const EXECUTE = process.argv.includes("--execute")
console.log(EXECUTE ? "🔥 EXECUTE mode — los registros se BORRAN" : "👀 DRY-RUN mode — pasale --execute para borrar de verdad")
console.log("")

// ─── 1. orders: pending sin payment_id ──────────────────────────────────────
const { data: phantomOrders, error: e1 } = await sb
  .from("orders")
  .select("id, order_number, customer_first_name, customer_last_name, customer_email, total, payment_status, payment_id, created_at")
  .eq("payment_status", "pending")
  .is("payment_id", null)

if (e1) { console.error("Error 1:", e1.message); process.exit(1) }

console.log(`📦 orders pendientes sin payment_id: ${phantomOrders?.length ?? 0}`)
for (const o of phantomOrders ?? []) {
  const date = new Date(o.created_at).toLocaleDateString("es-AR")
  console.log(`   ${o.order_number}  ${o.customer_first_name} ${o.customer_last_name}  $${(o.total||0).toLocaleString("es-AR")}  ${date}`)
}

// ─── 2. whatsapp_orders: pending sin ningun MP/link ─────────────────────────
const { data: phantomWa, error: e2 } = await sb
  .from("whatsapp_orders")
  .select("id, customer_name, total_amount, status, payment_status, mp_payment_id, mp_preference_id, payment_link, created_at")
  .eq("status", "pending")
  .is("mp_payment_id", null)
  .is("mp_preference_id", null)
  .is("payment_link", null)

if (e2) { console.error("Error 2:", e2.message); process.exit(1) }

console.log(`\n📨 whatsapp_orders pending sin link/MP: ${phantomWa?.length ?? 0}`)
// Mostrar primeros 10 para no spamear
for (const o of (phantomWa ?? []).slice(0, 10)) {
  const date = new Date(o.created_at).toLocaleDateString("es-AR")
  console.log(`   ${o.id.slice(0,8)}  ${(o.customer_name||"?").slice(0,30).padEnd(30)}  $${(o.total_amount||0).toLocaleString("es-AR")}  ${date}`)
}
if ((phantomWa?.length ?? 0) > 10) console.log(`   ... (+${phantomWa.length - 10} mas)`)

console.log(`\n📊 TOTAL a borrar: ${(phantomOrders?.length ?? 0) + (phantomWa?.length ?? 0)} registros`)

if (!EXECUTE) {
  console.log("\n👀 DRY-RUN — no se borra nada. Para ejecutar: node scripts/cleanup-phantom-pending.mjs --execute")
  process.exit(0)
}

console.log("\n🔥 BORRANDO...")

// Borrar order_items de las ordenes fantasma primero (FK constraint)
if (phantomOrders && phantomOrders.length > 0) {
  const ids = phantomOrders.map(o => o.id)
  const { error: ei } = await sb.from("order_items").delete().in("order_id", ids)
  if (ei) console.warn("⚠️ Error borrando order_items:", ei.message)
  else console.log(`✓ order_items asociados borrados`)

  const { error: eo } = await sb.from("orders").delete().in("id", ids)
  if (eo) { console.error("❌ Error borrando orders:", eo.message); process.exit(1) }
  console.log(`✓ ${phantomOrders.length} orders borradas`)
}

if (phantomWa && phantomWa.length > 0) {
  const ids = phantomWa.map(o => o.id)
  // En lotes de 100 para no sobrecargar
  let deleted = 0
  for (let i = 0; i < ids.length; i += 100) {
    const batch = ids.slice(i, i + 100)
    const { error } = await sb.from("whatsapp_orders").delete().in("id", batch)
    if (error) { console.error("❌ Error en batch:", error.message); break }
    deleted += batch.length
  }
  console.log(`✓ ${deleted} whatsapp_orders borradas`)
}

console.log("\n🎉 Listo — dashboard arranca limpio")
