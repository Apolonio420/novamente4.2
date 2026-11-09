/**
 * Backfill: ventas web confirmadas sin fila en sale_attributions (09/11/2026).
 *
 * Por defecto corre EN SECO: lista las filas que insertaría y no escribe nada.
 * Con --apply inserta usando la misma función que el webhook
 * (recordWebSaleAttribution), así que es idempotente: volver a correrlo da 0.
 *
 * Requisitos para --apply: la migración
 * migrations/20261109_sale_attributions_source_web.sql aplicada (si no, el
 * CHECK de `source` rechaza 'web') y el OK de Juan.
 *
 * Uso:
 *   npx tsx scripts/backfill-web-sale-attributions-2026-11.ts               # en seco, desde el 01/11 ART
 *   npx tsx scripts/backfill-web-sale-attributions-2026-11.ts --since=2026-10-01
 *   npx tsx scripts/backfill-web-sale-attributions-2026-11.ts --apply
 *
 * Venta = orden `confirmed` con `payment_status = approved` (cobrada). Fecha =
 * paid_at (fecha de cobro) o created_at si falta. Monto confirmado: MP =
 * metadata.payment_details.transaction_amount; transferencia = total.
 */
import { readFileSync, existsSync } from "fs"
import { resolve } from "path"
import { createClient } from "@supabase/supabase-js"

function loadEnv() {
  const p = resolve(process.cwd(), ".env.local")
  if (!existsSync(p)) return
  for (const line of readFileSync(p, "utf8").split("\n")) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "")
  }
}

async function main() {
  loadEnv()
  const apply = process.argv.includes("--apply")
  const sinceArg = process.argv.find((a) => a.startsWith("--since="))?.slice(8) || "2026-11-01"
  const sinceIso = new Date(`${sinceArg}T00:00:00-03:00`).toISOString()

  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error("Faltan SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY (.env.local)")
  const client = createClient(url, key, { auth: { persistSession: false } })

  const { buildWebSaleAttributionRow, recordWebSaleAttribution } = await import("../lib/payments/web-sale-attribution")

  const cols =
    "id,order_number,status,payment_status,payment_method,total,tenant_id,customer_phone,created_at,paid_at,metadata," +
    "utm_source,utm_medium,utm_campaign,utm_content,utm_term,fbclid,gclid,landing_page,referrer"
  const { data: orders, error } = await client
    .from("orders")
    .select(cols)
    .eq("status", "confirmed")
    .eq("payment_status", "approved")
    .or(`paid_at.gte.${sinceIso},and(paid_at.is.null,created_at.gte.${sinceIso})`)
    .order("created_at", { ascending: true })
  if (error) throw new Error(`orders: ${error.message}`)

  const refs = (orders || []).map((o: any) => o.order_number).filter(Boolean)
  const { data: existing, error: exErr } = refs.length
    ? await client.from("sale_attributions").select("order_ref,source").in("order_ref", refs)
    : { data: [], error: null }
  if (exErr) throw new Error(`sale_attributions: ${exErr.message}`)
  const done = new Set((existing || []).map((r: any) => r.order_ref))

  console.log(`Modo: ${apply ? "APPLY (escribe)" : "EN SECO (no escribe)"} · ventas web cobradas desde ${sinceArg} (ART): ${orders?.length ?? 0}`)
  let pending = 0
  let written = 0
  for (const o of (orders || []) as any[]) {
    if (done.has(o.order_number)) {
      console.log(`  = ${o.order_number} ya tiene fila en sale_attributions — se saltea`)
      continue
    }
    const isTransfer = /transfer/i.test(String(o.payment_method || ""))
    const confirmedTotalArs = isTransfer ? Number(o.total) : Number(o.metadata?.payment_details?.transaction_amount) || Number(o.total)
    const conf = { confirmedTotalArs, paymentMethod: isTransfer ? "transfer" : "mercadopago" }

    let tenantSlug: string | null = null
    if (o.tenant_id) {
      const { data: t } = await client.from("tenants").select("slug").eq("id", o.tenant_id).maybeSingle()
      tenantSlug = (t as any)?.slug ?? null
    }
    const row = buildWebSaleAttributionRow(o, conf, { tenantSlug })
    if (!row) {
      console.log(`  ! ${o.order_number} sin monto o sin número — no se puede atribuir`)
      continue
    }
    pending++
    const masked = String(row.phone).replace(/\d(?=\d{4})/g, "•")
    console.log(
      `  + ${row.order_ref} · cobrado ${String(o.paid_at || o.created_at).slice(0, 16)}Z · source=${row.source} · origin=${row.origin}` +
        ` · cotizado=$${row.quoted_total_ars} · confirmado=$${row.confirmed_total_ars} · pago=${row.payment_method}` +
        ` · campaña=${row.ad_campaign ?? "-"} · creativo=${row.ad_creative ?? "-"} · tenant=${row.tenant_slug ?? "-"} · tel=${masked}`,
    )
    console.log(
      `      evidencia: utm_source=${o.utm_source ?? "-"} utm_medium=${o.utm_medium ?? "-"} utm_campaign=${o.utm_campaign ?? "-"}` +
        ` fbclid=${o.fbclid ? "sí" : "no"} gclid=${o.gclid ? "sí" : "no"} landing=${o.landing_page ?? "-"} referrer=${o.referrer ?? "-"}`,
    )
    if (apply) {
      const r = await recordWebSaleAttribution(o, conf, client)
      console.log(`      → ${r}`)
      if (r === "inserted") {
        written++
        await client
          .from("orders")
          .update({ metadata: { ...(o.metadata || {}), sale_attribution_recorded_at: new Date().toISOString() } })
          .eq("id", o.id)
      }
    }
  }
  console.log(apply ? `Escritas: ${written} de ${pending}.` : `Filas a insertar: ${pending}. No se escribió nada (usar --apply con OK de Juan).`)
}

main().catch((e) => {
  console.error("❌", e?.message || e)
  process.exit(1)
})
