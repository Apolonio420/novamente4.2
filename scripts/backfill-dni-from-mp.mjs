/**
 * Backfill: para cada orden con payment_id pero sin customer_dni, consulta
 * la API de MercadoPago y completa el DNI/CUIT del pagador.
 *
 * Uso:
 *   node scripts/backfill-dni-from-mp.mjs          # todas las que faltan
 *   node scripts/backfill-dni-from-mp.mjs 160801126643  # solo un payment_id
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
const token = process.env.MP_ACCESS_TOKEN || process.env.MERCADOPAGO_ACCESS_TOKEN
if (!token) { console.error("Falta MP_ACCESS_TOKEN"); process.exit(1) }

const onlyOne = process.argv[2]

let query = sb
  .from("orders")
  .select("id, order_number, payment_id, customer_first_name, customer_last_name, customer_dni")
  .not("payment_id", "is", null)
  .is("customer_dni", null)
  .eq("payment_status", "approved")

if (onlyOne) query = query.eq("payment_id", onlyOne)

const { data: orders, error } = await query
if (error) { console.error("Error:", error.message); process.exit(1) }

console.log(`\nPedidos a procesar: ${orders?.length ?? 0}\n`)

let ok = 0, fail = 0, skipped = 0
for (const o of orders ?? []) {
  process.stdout.write(`  ${o.order_number} (${o.payment_id}) … `)
  try {
    const r = await fetch(`https://api.mercadopago.com/v1/payments/${o.payment_id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!r.ok) {
      console.log(`HTTP ${r.status}`)
      fail++
      continue
    }
    const p = await r.json()
    const card = p?.card?.cardholder?.identification
    const payer = p?.payer?.identification
    const chosen = card?.number ? card : (payer?.number ? payer : null)
    if (!chosen) {
      console.log("MP sin DNI")
      skipped++
      continue
    }
    const dni = String(chosen.number).trim()
    const type = String(chosen.type || "DNI").trim().toUpperCase()
    const holder = p?.card?.cardholder?.name

    const { error: updErr } = await sb
      .from("orders")
      .update({ customer_dni: dni, customer_dni_type: type })
      .eq("id", o.id)
    if (updErr) {
      console.log("DB:", updErr.message)
      fail++
      continue
    }
    console.log(`✓ ${type} ${dni}${holder ? ` (titular: ${holder})` : ""}`)
    ok++
  } catch (e) {
    console.log("err:", e.message)
    fail++
  }
}

console.log(`\n✅ OK: ${ok}  ❌ Fail: ${fail}  ⊘ Skipped (sin DNI en MP): ${skipped}`)
