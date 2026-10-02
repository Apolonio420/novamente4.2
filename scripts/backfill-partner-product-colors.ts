/**
 * Backfill de color en partner_products.metadata (caso la-blancq, 01/10).
 *
 * Dos problemas distintos, el mismo síntoma (cart/checkout con color vacío o
 * "unknown"):
 *
 *  A) `metadata.colors[]` con entradas SOLO `{ key, images }`, sin `name`/`hex`
 *     — bug de app/api/partners/products/from-design/route.ts (ya arreglado
 *     en código: ahora escribe { key, name, hex, images } resueltos contra el
 *     catálogo). Esto backfillea los productos que YA se crearon con el bug.
 *
 *  B) Productos sin NINGÚN dato de color (`metadata.colors` vacío/ausente, sin
 *     `available_colors` legacy, sin `metadata.color` singular), cargados a
 *     mano en el panel sin elegir color. Acá NO hay forma honesta de
 *     "inventar" un color si la prenda tiene varios en el catálogo — solo se
 *     puede autocompletar cuando la prenda tiene EXACTAMENTE 1 color posible.
 *     El resto se lista para preguntarle al partner.
 *
 * Uso:
 *   npx tsx scripts/backfill-partner-product-colors.ts            # dry-run (default, no escribe nada)
 *   npx tsx scripts/backfill-partner-product-colors.ts --apply    # aplica SOLO los casos A y B-auto-fixable
 *
 * --apply NUNCA toca los productos "needs-partner" (ambiguos, 2+ colores
 * posibles) ni los "no-colors-needed" (prenda sin colores en el catálogo,
 * ej. láminas/lienzos/accesorios) — esos se listan para decisión humana.
 */
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'
import { createClient } from '@supabase/supabase-js'
import { getCatalogProduct } from '../lib/catalog/products'
import { buildPartnerColorEntry, productHasColorInfo, garmentRequiresColorChoice } from '../lib/partners/product-colors'

// --- env ---------------------------------------------------------------
for (const f of ['.env.local', '.env']) {
  const p = join(process.cwd(), f)
  if (existsSync(p)) {
    for (const line of readFileSync(p, 'utf8').split('\n')) {
      const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/)
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
    }
  }
}

const APPLY = process.argv.includes('--apply')

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string,
  { auth: { autoRefreshToken: false, persistSession: false } },
)

async function fetchAll<T>(table: string, select: string): Promise<T[]> {
  let all: T[] = []
  let from = 0
  const pageSize = 1000
  while (true) {
    const { data, error } = await sb.from(table).select(select).range(from, from + pageSize - 1)
    if (error) throw error
    all = all.concat((data || []) as T[])
    if (!data || data.length < pageSize) break
    from += pageSize
  }
  return all
}

interface PartnerProductRow {
  id: string
  tenant_id: string
  name: string
  status: string
  metadata: Record<string, unknown> | null
}

interface TenantRow {
  id: string
  slug: string
}

async function main() {
  const [products, tenants] = await Promise.all([
    fetchAll<PartnerProductRow>('partner_products', 'id, tenant_id, name, status, metadata'),
    fetchAll<TenantRow>('tenants', 'id, slug'),
  ])
  const tenantSlug = new Map(tenants.map((t) => [t.id, t.slug]))

  // --- Caso A: colors[] solo con key (sin name) ------------------------
  type FixA = { id: string; tenantSlug: string; name: string; before: unknown; after: Array<{ key: string; name: string; hex: string; images: unknown }> }
  const fixesA: FixA[] = []

  // --- Caso B: sin ningún dato de color ---------------------------------
  type FixB = { id: string; tenantSlug: string; name: string; garmentKey?: string; proposedColor: string }
  type NeedsPartner = { id: string; tenantSlug: string; name: string; garmentKey: string; options: string[] }
  type NoColorsNeeded = { id: string; tenantSlug: string; name: string; garmentKey?: string }
  const fixesB: FixB[] = []
  const needsPartner: NeedsPartner[] = []
  const noColorsNeeded: NoColorsNeeded[] = []

  for (const p of products) {
    const meta = p.metadata || {}
    const slug = tenantSlug.get(p.tenant_id) || p.tenant_id
    const garmentKey = typeof meta.garmentKey === 'string' ? meta.garmentKey : undefined
    const rawColors = meta.colors

    // Caso A — solo si hay colors[] con AL MENOS una entrada "key sin name".
    if (Array.isArray(rawColors) && rawColors.length > 0) {
      const tieneKeySinName = rawColors.some(
        (c) => c && typeof c === 'object' && typeof (c as any).key === 'string' && !(typeof (c as any).name === 'string' && (c as any).name.trim()),
      )
      if (tieneKeySinName) {
        const after = rawColors.map((c: any) => {
          if (c && typeof c === 'object' && typeof c.name === 'string' && c.name.trim()) {
            // ya tiene name — se deja igual.
            return c
          }
          const key = typeof c?.key === 'string' ? c.key : 'default'
          return buildPartnerColorEntry(garmentKey || '', key, c?.images || {})
        })
        fixesA.push({ id: p.id, tenantSlug: slug, name: p.name, before: rawColors, after })
        continue // no evaluar también como "sin color" — ya tiene colors[]
      }
    }

    // Caso B — sin NINGÚN dato de color.
    if (!productHasColorInfo(meta)) {
      if (!garmentRequiresColorChoice(garmentKey)) {
        noColorsNeeded.push({ id: p.id, tenantSlug: slug, name: p.name, garmentKey })
        continue
      }
      const catalogProduct = getCatalogProduct(garmentKey as string)
      const colors = catalogProduct?.colors || []
      if (colors.length === 1) {
        fixesB.push({ id: p.id, tenantSlug: slug, name: p.name, garmentKey, proposedColor: colors[0].name })
      } else {
        needsPartner.push({ id: p.id, tenantSlug: slug, name: p.name, garmentKey: garmentKey as string, options: colors.map((c) => c.name) })
      }
    }
  }

  // --- Reporte -----------------------------------------------------------
  console.log(`Modo: ${APPLY ? 'APPLY (escribe en Supabase)' : 'DRY-RUN (no escribe nada)'}`)
  console.log(`Total partner_products analizados: ${products.length}\n`)

  console.log(`=== Caso A: colors[] con entradas "solo key" (sin name/hex) — ${fixesA.length} producto(s) ===`)
  for (const f of fixesA) {
    console.log(`  [${f.tenantSlug}] ${f.name} (${f.id})`)
    console.log(`    antes: ${JSON.stringify(f.before)}`)
    console.log(`    después: ${JSON.stringify(f.after.map((c) => ({ key: c.key, name: c.name, hex: c.hex })))}`)
  }

  console.log(`\n=== Caso B: sin ningún dato de color — auto-fijable (1 solo color en el catálogo) — ${fixesB.length} producto(s) ===`)
  const porTenantB = new Map<string, number>()
  for (const f of fixesB) porTenantB.set(f.tenantSlug, (porTenantB.get(f.tenantSlug) || 0) + 1)
  for (const [slug, n] of [...porTenantB.entries()].sort((a, b) => b[1] - a[1])) console.log(`  ${slug}: ${n}`)
  for (const f of fixesB) console.log(`    [${f.tenantSlug}] ${f.name} (${f.id}) garmentKey=${f.garmentKey} → metadata.color="${f.proposedColor}"`)

  console.log(`\n=== Caso B: sin color — AMBIGUO, requiere que el partner elija (2+ colores posibles) — ${needsPartner.length} producto(s) ===`)
  const porTenantNP = new Map<string, number>()
  for (const f of needsPartner) porTenantNP.set(f.tenantSlug, (porTenantNP.get(f.tenantSlug) || 0) + 1)
  for (const [slug, n] of [...porTenantNP.entries()].sort((a, b) => b[1] - a[1])) console.log(`  ${slug}: ${n}`)
  for (const f of needsPartner) console.log(`    [${f.tenantSlug}] ${f.name} (${f.id}) garmentKey=${f.garmentKey} opciones=[${f.options.join(', ')}]`)

  console.log(`\n=== Caso B: sin color — NO HACE FALTA (prenda sin colores en el catálogo: láminas/lienzos/accesorios/garmentKey no reconocido) — ${noColorsNeeded.length} producto(s) ===`)
  const porTenantNN = new Map<string, number>()
  for (const f of noColorsNeeded) porTenantNN.set(f.tenantSlug, (porTenantNN.get(f.tenantSlug) || 0) + 1)
  for (const [slug, n] of [...porTenantNN.entries()].sort((a, b) => b[1] - a[1])) console.log(`  ${slug}: ${n}`)

  console.log(`\nResumen: A=${fixesA.length} (auto-fijable) · B-auto=${fixesB.length} (auto-fijable) · B-ambiguo=${needsPartner.length} (preguntar al partner) · B-no-aplica=${noColorsNeeded.length}`)

  if (!APPLY) {
    console.log('\nDry-run: no se escribió nada. Correr con --apply para aplicar SOLO los casos A y B-auto-fijable.')
    return
  }

  console.log('\nAplicando fixes...')
  let applied = 0
  for (const f of fixesA) {
    const p = products.find((pp) => pp.id === f.id)!
    const metadata = { ...(p.metadata || {}), colors: f.after }
    const { error } = await sb.from('partner_products').update({ metadata }).eq('id', f.id)
    if (error) console.error(`  ERROR actualizando ${f.id}:`, error.message)
    else applied++
  }
  for (const f of fixesB) {
    const p = products.find((pp) => pp.id === f.id)!
    const metadata = { ...(p.metadata || {}), color: f.proposedColor }
    const { error } = await sb.from('partner_products').update({ metadata }).eq('id', f.id)
    if (error) console.error(`  ERROR actualizando ${f.id}:`, error.message)
    else applied++
  }
  console.log(`Listo: ${applied}/${fixesA.length + fixesB.length} productos actualizados.`)
}

main().catch((e) => {
  console.error('ERROR', e)
  process.exit(1)
})
