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
 *   npx tsx scripts/review-link.ts <tenant-slug>                → todos los productos
 *   npx tsx scripts/review-link.ts <tenant-slug> <product-slug> → uno solo
 *   npx tsx scripts/review-link.ts <tenant-slug> --qr           → + PNGs de QR en playground/review-qr/
 *
 * Environment: lee .env.local (igual que la app)
 */

import { readFileSync, existsSync, mkdirSync, writeFileSync } from 'fs'
import { resolve, join } from 'path'
import { createClient } from '@supabase/supabase-js'
import { createReviewToken, DEFAULT_TTL_DAYS } from '../lib/partners/review-token'

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

async function main() {
  const args = process.argv.slice(2)
  const withQr = args.includes('--qr')
  const [tenantSlug, productSlug] = args.filter((a) => !a.startsWith('--'))

  if (!tenantSlug) {
    console.error('Uso: npx tsx scripts/review-link.ts <tenant-slug> [product-slug] [--qr]')
    process.exit(1)
  }
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('Faltan NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY en .env.local')
    process.exit(1)
  }
  if (!process.env.REVIEW_TOKEN_SECRET && !process.env.SUPABASE_JWT_SECRET) {
    console.error('Falta REVIEW_TOKEN_SECRET (o SUPABASE_JWT_SECRET) — sin secreto no se puede firmar')
    process.exit(1)
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const { data: tenant, error: tErr } = await supabase
    .from('tenants')
    .select('id, name, slug, status, storefront_published')
    .eq('slug', tenantSlug)
    .maybeSingle()

  if (tErr || !tenant) {
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

  const { data: products, error: pErr } = await query
  if (pErr || !products || products.length === 0) {
    console.error(`Sin productos publicados${productSlug ? ` con slug "${productSlug}"` : ''} en "${tenantSlug}"`)
    process.exit(1)
  }

  console.log(`\n🏷  ${(tenant as any).name} — ${products.length} producto(s)`)
  console.log(`   Los links caducan en ${DEFAULT_TTL_DAYS} días.\n`)

  const rows: { name: string; url: string; slug: string }[] = []

  for (const p of products as any[]) {
    const token = createReviewToken(tenantSlug, p.id)
    const url = `${BASE_URL}/p/${tenantSlug}/${p.slug}?review=1&t=${token}`
    rows.push({ name: p.name, url, slug: p.slug })

    console.log(`── ${p.name}`)
    console.log(`   ${url}`)
    console.log(
      `   WhatsApp: ¡Hola! ¿Cómo te quedó ${p.name}? Si te gustó, nos ayuda muchísimo que dejes tu opinión acá 👉 ${url} (son 20 segundos)\n`,
    )
  }

  if (withQr) {
    let QRCode: any
    try {
      QRCode = (await import('qrcode')).default
    } catch {
      console.error('Para --qr hace falta el paquete "qrcode": npm i -D qrcode')
      process.exit(1)
    }
    const outDir = resolve(__dirname, '../playground/review-qr', tenantSlug)
    mkdirSync(outDir, { recursive: true })
    for (const r of rows) {
      const file = join(outDir, `${r.slug}.png`)
      await QRCode.toFile(file, r.url, { width: 900, margin: 2 })
      console.log(`   QR → ${file}`)
    }
  }

  // CSV para pegar en la planilla de pedidos
  const csvDir = resolve(__dirname, '../playground/review-qr')
  mkdirSync(csvDir, { recursive: true })
  const csvPath = join(csvDir, `${tenantSlug}-review-links.csv`)
  writeFileSync(
    csvPath,
    'producto,slug,link\n' + rows.map((r) => `"${r.name.replace(/"/g, '""')}",${r.slug},${r.url}`).join('\n') + '\n',
    'utf-8',
  )
  console.log(`📄 CSV → ${csvPath}\n`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
