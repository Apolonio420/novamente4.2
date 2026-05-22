/**
 * Aplica (o revierte) precios Hot Sale a los productos del tenant
 * novamente-mundial.
 *
 * Lee HOT_SALE_OFFERS desde lib/offers.ts (source of truth), encuentra los
 * productos en partner_products por slug, y setea:
 *
 *   APPLY  (default):
 *     price            = priceCurrent  (precio Hot Sale)
 *     compare_at_price = priceOriginal (precio tachado)
 *
 *   REVERT (--revert):
 *     price            = priceOriginal (precio normal restaurado)
 *     compare_at_price = null          (sin tachado)
 *
 * Idempotente en ambos modos.
 *
 * Uso:
 *   npx tsx scripts/apply-hot-sale-prices.ts                    # dry-run apply
 *   npx tsx scripts/apply-hot-sale-prices.ts --apply            # aplica Hot Sale
 *   npx tsx scripts/apply-hot-sale-prices.ts --revert           # dry-run revert
 *   npx tsx scripts/apply-hot-sale-prices.ts --revert --apply   # restaura precios
 */
import { createClient } from "@supabase/supabase-js"
import { config as loadEnv } from "dotenv"
import { HOT_SALE_OFFERS } from "../lib/offers"

loadEnv({ path: ".env.local" })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const TENANT_SLUG = "novamente-mundial"
const APPLY = process.argv.includes("--apply")
const REVERT = process.argv.includes("--revert")

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local")
  process.exit(1)
}

const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

// Extrae el slug del producto desde la URL (ultimo segmento del path).
function extractProductSlug(url: string): string {
  const u = new URL(url)
  const parts = u.pathname.split("/").filter(Boolean)
  return parts[parts.length - 1]
}

async function main() {
  const action = REVERT ? "REVERT" : "APPLY"
  console.log(`Action: ${action} · Mode: ${APPLY ? "APPLY" : "DRY-RUN"}`)

  const { data: tenant, error: tenantErr } = await admin
    .from("tenants")
    .select("id, slug, name")
    .eq("slug", TENANT_SLUG)
    .single()

  if (tenantErr || !tenant) {
    console.error(`Tenant ${TENANT_SLUG} no encontrado`, tenantErr)
    process.exit(1)
  }
  console.log(`Tenant: ${tenant.name} (${tenant.id})\n`)

  let updates = 0
  let skipped = 0
  let missing = 0

  for (const offer of HOT_SALE_OFFERS) {
    const productSlug = extractProductSlug(offer.url)

    const { data: product, error: prodErr } = await admin
      .from("partner_products")
      .select("id, name, price, compare_at_price")
      .eq("tenant_id", tenant.id)
      .eq("slug", productSlug)
      .maybeSingle()

    if (prodErr) {
      console.error(`  ✗ Error consultando ${productSlug}:`, prodErr.message)
      continue
    }
    if (!product) {
      console.warn(`  ⚠ ${offer.name} — slug "${productSlug}" no encontrado en partner_products`)
      missing++
      continue
    }

    const targetPrice = REVERT ? offer.priceOriginal : offer.priceCurrent
    const targetCompare = REVERT ? null : offer.priceOriginal

    const samePrice = Number(product.price) === targetPrice
    const sameCompare = REVERT
      ? product.compare_at_price == null
      : Number(product.compare_at_price ?? 0) === targetCompare

    if (samePrice && sameCompare) {
      console.log(`  = ${offer.name}: ya alineado ($${product.price} / tachado ${product.compare_at_price ?? "null"})`)
      skipped++
      continue
    }

    console.log(`  → ${offer.name}`)
    console.log(`     price:            ${product.price} → ${targetPrice}`)
    console.log(`     compare_at_price: ${product.compare_at_price ?? "null"} → ${targetCompare ?? "null"}`)

    if (APPLY) {
      const { error: updErr } = await admin
        .from("partner_products")
        .update({
          price: targetPrice,
          compare_at_price: targetCompare,
        })
        .eq("id", product.id)
      if (updErr) {
        console.error(`     ✗ update fallo:`, updErr.message)
        continue
      }
      console.log(`     ✓ updateado`)
    }
    updates++
  }

  console.log(
    `\nResumen: ${updates} ${APPLY ? "updateados" : "a updatear"}, ${skipped} ya alineados, ${missing} no encontrados`,
  )
  if (!APPLY && updates > 0) {
    console.log(`\nCorre con --apply para ejecutar.`)
  }
}

main().catch(err => {
  console.error("Error:", err)
  process.exit(1)
})
