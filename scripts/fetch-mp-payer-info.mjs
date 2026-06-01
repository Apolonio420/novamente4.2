/**
 * Consulta la API de MercadoPago para obtener los datos del pagador
 * (incluido el DNI) a partir de uno o más payment_ids.
 *
 * Uso:
 *   node scripts/fetch-mp-payer-info.mjs 160801126643 160797408645
 */
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

const token = process.env.MP_ACCESS_TOKEN || process.env.MERCADOPAGO_ACCESS_TOKEN
if (!token) {
  console.error("Falta MP_ACCESS_TOKEN / MERCADOPAGO_ACCESS_TOKEN en env")
  process.exit(1)
}

const ids = process.argv.slice(2)
if (ids.length === 0) {
  console.error("Uso: node scripts/fetch-mp-payer-info.mjs <payment_id> [<payment_id> ...]")
  process.exit(1)
}

for (const id of ids) {
  console.log("\n" + "═".repeat(70))
  console.log(`  PAYMENT ID: ${id}`)
  console.log("═".repeat(70))

  const r = await fetch(`https://api.mercadopago.com/v1/payments/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!r.ok) {
    console.error(`  ❌ HTTP ${r.status} — ${await r.text().catch(() => "")}`)
    continue
  }
  const p = await r.json()

  console.log(`Status:           ${p.status} (${p.status_detail})`)
  console.log(`Fecha aprob:      ${p.date_approved ?? "—"}`)
  console.log(`Monto:            ${p.transaction_amount} ${p.currency_id}`)
  console.log(`Metodo:           ${p.payment_method_id} (${p.payment_type_id})`)
  console.log(`Cuotas:           ${p.installments}`)
  console.log()
  console.log(`══ PAGADOR ══`)
  const payer = p.payer ?? {}
  console.log(`Nombre:           ${payer.first_name ?? "—"} ${payer.last_name ?? ""}`)
  console.log(`Email:            ${payer.email ?? "—"}`)
  const ident = payer.identification ?? {}
  console.log(`Identificacion:   ${ident.type ?? "—"} ${ident.number ?? "—"}`)
  if (payer.phone) console.log(`Telefono pagador: ${payer.phone.area_code ?? ""} ${payer.phone.number ?? ""}`)
  console.log(`Payer ID MP:      ${payer.id ?? "—"}`)

  console.log()
  console.log(`══ DATOS DE TARJETA ══`)
  const card = p.card ?? {}
  console.log(`Titular:          ${card.cardholder?.name ?? "—"}`)
  console.log(`Doc titular:      ${card.cardholder?.identification?.type ?? "—"} ${card.cardholder?.identification?.number ?? "—"}`)
  console.log(`Tarjeta:          ${card.first_six_digits ?? "—"}******${card.last_four_digits ?? "—"}`)
  console.log(`Bin:              ${card.bin ?? "—"}`)

  if (p.additional_info?.payer) {
    console.log()
    console.log(`══ ADDITIONAL INFO ══`)
    console.log(JSON.stringify(p.additional_info.payer, null, 2))
  }
}

console.log()
