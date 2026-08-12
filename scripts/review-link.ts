/**
 * REVIEW LINK GENERATOR
 *
 * Genera los links de reseña que se le mandan al cliente después de entregarle
 * el pedido (WhatsApp) o que se imprimen como QR en la tarjeta del paquete.
 *
 * El link lleva ?review=1 (abre el formulario directo) y ?t=<token> (la reseña
 * queda marcada como compra verificada).
 *
 * Uso:
 *   # Catálogo propio de Novamente (/products/...)
 *   npx tsx scripts/review-link.ts --catalogo
 *   npx tsx scripts/review-link.ts --catalogo aura-tshirt-blanco
 *
 *   # Tienda partner (/p/<tienda>/...)
 *   npx tsx scripts/review-link.ts <tenant-slug>
 *   npx tsx scripts/review-link.ts <tenant-slug> <product-slug>
 *
 *   # En cualquiera de los dos, --qr agrega los PNG en playground/review-qr/
 *
 * Environment: lee .env.local (igual que la app)
 */

import { readFileSync, existsSync, mkdirSync, writeFileSync } from 'fs'
import { resolve, join } from 'path'
import { createClient } from '@supabase/supabase-js'
import { createReviewToken, DEFAULT_TTL_DAYS } from '../lib/partners/review-token'
import { OWN_CATALOG_TENANT_SLUG, staticProductUuid } from '../lib/partners/catalog-reviews'
import { PRODUCTS } from '../lib/products'

// Load .env.local manually (no dotenv dependency)
const envPath = resolve(__dirname, '../.env.local')
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, 'utf-8').split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eqIdx = trimmed.indexOf('=')
    if (eqIdx === -1) continue
    const key = trimmed.slice(0, eqIdx).trim()
    let val = trimmed.slice(eqIdx + 1).trim()
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1)
    }
    if (!process.env[key]) process.env[key] = val
  }
}

const BASE_URL = 'https://www.novamente.ar'
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

type Row = { name: string; slug: string; url: string }

function emit(title: string, rows: Row[], outName: string, withQr: boolean) {
  console.log(`\n🏷  ${title} — ${rows.length} producto(s)`)
  console.log(`   Los links caducan en ${DEFAULT_TTL_DAYS} días.\n`)
  for (const r of rows) {
    console.log(`── ${r.name}`)
    console.log(`   ${r.url}`)
    console.log(
      `   WhatsApp: ¡Hola! ¿Cómo te quedó ${r.name}? Si te gustó, nos ayuda muchísimo que dejes tu opinión acá 👉 ${r.url} (son 20 segundos)\n`,
    )
  }
  return writeArtifacts(rows, outName, withQr)
}

async function writeArtifacts(rows: Row[], outName: string, withQr: boolean) {
  const baseDir = resolve(__dirname, '../playground/review-qr')
  mkdirSync(baseDir, { recursive: true })

  if (withQr) {
    let QRCode: any
    try {
      QRCode = (await import('qrcode')).default
    } catch {
      console.error('Para --qr hace falta el paquete "qrcode": npm i -D qrcode')
      process.exit(1)
    }
    const outDir = join(baseDir, outName)
    mkdirSync(outDir, { recursive: true })
    for (const r of rows) {
      const file = join(outDir, `${r.slug}.png`)
      await QRCode.toFile(file, r.url, { width: 900, margin: 2 })
      console.log(`   QR → ${file}`)
    }
  }

  const csvPath = join(baseDir, `${outName}-review-links.csv`)
  writeFileSync(
    csvPath,
    'producto,slug,link\n' + rows.map((r) => `"${r.name.replace(/"/g, '""')}",${r.slug},${r.url}`).join('\n') + '\n',
    'utf-8',
  )
  console.log(`📄 CSV → ${csvPath}\n`)
}

/** Catálogo propio: /products/<id>, reseñas bajo el tenant novamente-internal. */
async function ownCatalog(productId: string | undefined, withQr: boolean) {
  const products = PRODUCTS.filter((p) => p.available && (!productId || p.id === productId))
  if (products.length === 0) {
    console.error(`Sin productos disponibles${productId ? ` con id "${productId}"` : ''} en el catálogo propio`)
    process.exit(1)
  }
  const rows: Row[] = products.map((p) => ({
    name: p.name,
    slug: p.id,
    url: `${BASE_URL}/products/${p.id}?review=1&t=${createReviewToken(OWN_CATALOG_TENANT_SLUG, staticProductUuid(p.id))}`,
  }))
  await emit('Novamente (catálogo propio)', rows, 'novamente-catalogo', withQr)
}

/** Tienda partner: /p/<slug>/<producto>. */
async function partnerStore(tenantSlug: string, productSlug: string | undefined, withQr: boolean) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('Faltan NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY en .env.local')
    process.exit(1)
  }
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const { data: tenant } = await supabase
    .from('tenants')
    .select('id, name, slug, status, storefront_published')
    .eq('slug', tenantSlug)
    .maybeSingle()

  if (!tenant) {
    console.error(`No encontré la tienda "${tenantSlug}"`)
    process.exit(1)
  }
  if ((tenant as any).status !== 'active' || !(tenant as any).storefront_published) {
    console.warn(`⚠️  "${tenantSlug}" no está activa/publicada — los links van a dar 404 hasta que lo esté.\n`)
  }

  let query = supabase
    .from('partner_products')
    .select('id, name, slug')
    .eq('tenant_id', (tenant as any).id)
    .eq('status', 'published')
    .order('sort_order')
  if (productSlug) query = query.eq('slug', productSlug)

  const { data: products } = await query
  if (!products || products.length === 0) {
    console.error(`Sin productos publicados${productSlug ? ` con slug "${productSlug}"` : ''} en "${tenantSlug}"`)
    process.exit(1)
  }

  const rows: Row[] = (products as any[]).map((p) => ({
    name: p.name,
    slug: p.slug,
    url: `${BASE_URL}/p/${tenantSlug}/${p.slug}?review=1&t=${createReviewToken(tenantSlug, p.id)}`,
  }))
  await emit((tenant as any).name, rows, tenantSlug, withQr)
}

async function main() {
  const argv = process.argv.slice(2)
  const withQr = argv.includes('--qr')
  const isOwn = argv.includes('--catalogo') || argv.includes('--catalog')
  const positional = argv.filter((a) => !a.startsWith('--'))

  if (!process.env.REVIEW_TOKEN_SECRET && !process.env.SUPABASE_JWT_SECRET) {
    console.error('Falta REVIEW_TOKEN_SECRET (o SUPABASE_JWT_SECRET) — sin secreto no se puede firmar')
    process.exit(1)
  }

  if (isOwn) return ownCatalog(positional[0], withQr)

  if (!positional[0]) {
    console.error(
      'Uso:\n' +
        '  npx tsx scripts/review-link.ts --catalogo [product-id] [--qr]   (catálogo propio)\n' +
        '  npx tsx scripts/review-link.ts <tenant-slug> [product-slug] [--qr]   (tienda partner)',
    )
    process.exit(1)
  }
  return partnerStore(positional[0], positional[1], withQr)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
