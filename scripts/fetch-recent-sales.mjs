/**
 * Lee las ventas mas recientes de Supabase y las imprime con todos los datos
 * que el user necesita: cliente, items, montos, fechas, URLs de mockup.
 *
 * Uso:
 *   node scripts/fetch-recent-sales.mjs [N]   (default N=5)
 */
import { createClient } from "@supabase/supabase-js"
import { readFileSync, existsSync } from "fs"
import { join } from "path"

// Cargar .env.local manualmente (sin dotenv)
for (const f of [".env.local", ".env"]) {
  const p = join(process.cwd(), f)
  if (existsSync(p)) {
    for (const line of readFileSync(p, "utf8").split("\n")) {
      const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/)
      if (m && !process.env[m[1]]) {
        process.env[m[1]] = m[2].replace(/^["']|["']$/g, "")
      }
    }
  }
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) {
  console.error("FALTA NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en env")
  process.exit(1)
}

const N = parseInt(process.argv[2] ?? "5", 10)
const supabase = createClient(url, key, { auth: { persistSession: false } })

const { data: orders, error } = await supabase
  .from("orders")
  .select("*")
  .order("created_at", { ascending: false })
  .limit(N)

if (error) {
  console.error("Error:", error.message)
  process.exit(1)
}

if (!orders || orders.length === 0) {
  console.log("No hay pedidos en la DB")
  process.exit(0)
}

const fmt = (n) => new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", minimumFractionDigits: 0 }).format(n ?? 0)
const fmtDate = (d) => new Date(d).toLocaleString("es-AR", { dateStyle: "short", timeStyle: "short" })

for (const order of orders) {
  console.log("\n" + "═".repeat(70))
  console.log(`  PEDIDO #${order.order_number ?? order.id?.slice(0, 8)}`)
  console.log("═".repeat(70))
  console.log(`Fecha:           ${fmtDate(order.created_at)}`)
  console.log(`Estado:          ${order.status} · Pago: ${order.payment_status}`)
  console.log(`Cliente:         ${order.customer_first_name} ${order.customer_last_name}`)
  console.log(`Email:           ${order.customer_email}`)
  console.log(`Telefono:        ${order.customer_phone ?? "—"}`)
  console.log(`Direccion:       ${order.shipping_address ?? "—"}, ${order.shipping_city ?? "—"} (${order.shipping_postal_code ?? "—"})`)
  console.log(`Subtotal:        ${fmt(order.subtotal)}`)
  console.log(`Envio:           ${fmt(order.shipping_cost)}`)
  console.log(`Total:           ${fmt(order.total)}`)
  console.log(`Metodo pago:     ${order.payment_method}`)
  console.log(`MP payment_id:   ${order.payment_id ?? "—"}`)
  console.log(`Tenant:          ${order.tenant_id ?? "Novamente directo"}`)

  // Items del pedido
  const { data: items } = await supabase
    .from("order_items")
    .select("*")
    .eq("order_id", order.id)

  if (items && items.length > 0) {
    console.log(`\nItems (${items.length}):`)
    for (const it of items) {
      console.log(`  • ${it.item_name ?? it.name} · ${it.product_color ?? it.color} · Talle ${it.product_size ?? it.size} · x${it.quantity} = ${fmt(it.total_price)}`)
      if (it.mockup_url) console.log(`    Mockup:      ${it.mockup_url}`)
      if (it.front_design_url) console.log(`    Front design: ${it.front_design_url}`)
      if (it.back_design_url) console.log(`    Back design:  ${it.back_design_url}`)
    }
  }
}

console.log("\n" + "═".repeat(70))
console.log(`Total pedidos mostrados: ${orders.length}`)
console.log("═".repeat(70))
