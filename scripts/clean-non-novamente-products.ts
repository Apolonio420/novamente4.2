/**
 * scripts/clean-non-novamente-products.ts
 *
 * Lista (y opcionalmente borra) productos del partner que NO pasen la politica
 * de productos Novamente (toallones, accesorios, ropa de cama, etc.).
 *
 * Uso:
 *   npx tsx scripts/clean-non-novamente-products.ts --tenant=oktubre-eterno
 *   npx tsx scripts/clean-non-novamente-products.ts --tenant=oktubre-eterno --execute
 *
 * Sin --execute solo lista (dry run). Con --execute borra de verdad.
 */

import { createClient } from "@supabase/supabase-js"
import { validatePartnerProductForCreation } from "../lib/partners/product-policy"

const args = process.argv.slice(2)
const tenantArg = args.find(a => a.startsWith("--tenant="))?.split("=")[1]
const execute = args.includes("--execute")
const allTenants = args.includes("--all")

if (!tenantArg && !allTenants) {
  console.error("Usage: npx tsx scripts/clean-non-novamente-products.ts --tenant=<slug> [--execute]")
  console.error("   or: npx tsx scripts/clean-non-novamente-products.ts --all [--execute]")
  process.exit(1)
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("Faltan NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en env.")
  process.exit(1)
}

const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

async function main() {
  // Resolve tenant ids
  let tenants: { id: string; slug: string; name: string }[] = []
  if (allTenants) {
    const { data, error } = await db.from("tenants").select("id, slug, name")
    if (error) throw error
    tenants = data || []
  } else {
    const { data, error } = await db
      .from("tenants")
      .select("id, slug, name")
      .eq("slug", tenantArg!)
      .single()
    if (error || !data) {
      console.error(`Tenant "${tenantArg}" no encontrado.`)
      process.exit(1)
    }
    tenants = [data]
  }

  let totalChecked = 0
  let totalInvalid = 0
  let totalDeleted = 0

  for (const tenant of tenants) {
    const { data: products, error } = await db
      .from("partner_products")
      .select("id, name, description, category")
      .eq("tenant_id", tenant.id)

    if (error) {
      console.error(`Error leyendo productos de ${tenant.slug}:`, error.message)
      continue
    }

    const invalid: typeof products = []
    for (const p of products || []) {
      totalChecked++
      const policy = validatePartnerProductForCreation({
        name: p.name,
        description: p.description ?? undefined,
        category: p.category ?? undefined,
      })
      if (!policy.ok) {
        invalid.push(p)
        totalInvalid++
        console.log(
          `[${tenant.slug}] PROHIBIDO  id=${p.id}  cat="${p.category ?? "-"}"  name="${p.name}"  -> ${policy.reason}`,
        )
      }
    }

    if (execute && invalid.length > 0) {
      const ids = invalid.map(p => p.id)
      const { error: delErr } = await db.from("partner_products").delete().in("id", ids)
      if (delErr) {
        console.error(`Error borrando productos de ${tenant.slug}:`, delErr.message)
      } else {
        totalDeleted += ids.length
        console.log(`[${tenant.slug}] BORRADOS ${ids.length} productos`)
      }
    }
  }

  console.log(`\nResumen:`)
  console.log(`  Tenants procesados: ${tenants.length}`)
  console.log(`  Productos revisados: ${totalChecked}`)
  console.log(`  Productos prohibidos: ${totalInvalid}`)
  console.log(`  Productos borrados: ${execute ? totalDeleted : 0}`)
  if (!execute && totalInvalid > 0) {
    console.log(`\nDry run — agrega --execute para borrarlos.`)
  }
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
