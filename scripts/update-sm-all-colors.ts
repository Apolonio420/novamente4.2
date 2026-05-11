/**
 * Add all color variants to SM partner products.
 */
import { readFileSync, existsSync } from 'fs'
import { resolve, join } from 'path'
import { createClient } from '@supabase/supabase-js'

const envPath = resolve(__dirname, '../.env.local')
const envContent = readFileSync(envPath, 'utf-8')
for (const line of envContent.split('\n')) {
  const t = line.trim()
  if (!t || t.startsWith('#')) continue
  const i = t.indexOf('=')
  if (i === -1) continue
  let v = t.slice(i + 1).trim()
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1)
  const k = t.slice(0, i).trim()
  if (!process.env[k]) process.env[k] = v
}

const TENANT_ID = '5adb9655-9823-47a4-a7b6-2c145aa8f7f8'
const BUCKET = 'partner-assets'
const COLORS_DIR = resolve(__dirname, '../../novamente-platform/scripts/out/maxy/partner/colors')

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { autoRefreshToken: false, persistSession: false },
})

interface ColorVariant {
  name: string
  value: string
  hex: string
  images: { front: string; back: string }
}

// Per product: existing color (negro) + new color variants
const PRODUCT_VARIANTS: Record<string, { slug: string; existingColor: ColorVariant | null; newColors: { color: string; name: string; hex: string; hasBack: boolean; }[] }> = {
  aura: {
    slug: 'camiseta-sm-training-aura-oversize-negra',
    existingColor: null, // se completa al leer el product
    newColors: [
      { color: 'blanco', name: 'Blanca', hex: '#F5F5F0', hasBack: true },
      { color: 'caramel', name: 'Caramel', hex: '#A87858', hasBack: true },
    ],
  },
  boston: {
    slug: 'buzo-hoodie-sm-boston-negro',
    existingColor: null,
    newColors: [
      { color: 'blanco', name: 'Blanco', hex: '#F5F5F0', hasBack: false },
      { color: 'crema', name: 'Crema', hex: '#EDE3CB', hasBack: true },
      { color: 'marron', name: 'Marrón', hex: '#6B4423', hasBack: true },
      { color: 'gris', name: 'Gris Melange', hex: '#9B9B9B', hasBack: true },
      { color: 'stone-wash', name: 'Stone Wash', hex: '#3D3D3D', hasBack: true },
    ],
  },
  berlin: {
    slug: 'buzo-crewneck-sm-berlin-negro',
    existingColor: null,
    newColors: [
      { color: 'blanco', name: 'Blanco', hex: '#F5F5F0', hasBack: false },
      { color: 'stone-wash', name: 'Stone Wash', hex: '#3D3D3D', hasBack: false },
    ],
  },
  aldea: {
    slug: 'remera-sm-aldea-classic-negra',
    existingColor: null,
    newColors: [
      { color: 'blanco', name: 'Blanco', hex: '#F5F5F0', hasBack: false },
    ],
  },
  bali: {
    slug: 'musculosa-sm-training-bali-negra-mujer',
    existingColor: null,
    newColors: [
      { color: 'blanco', name: 'Blanca', hex: '#F5F5F0', hasBack: false },
      { color: 'gris', name: 'Gris', hex: '#9B9B9B', hasBack: false },
    ],
  },
}

async function uploadFile(localPath: string, key: string): Promise<string> {
  const buf = readFileSync(localPath)
  const path = `${TENANT_ID}/${key}.png`
  const { error } = await (sb.storage as any).from(BUCKET).upload(path, buf, { contentType: 'image/png', upsert: true })
  if (error) throw error
  const { data } = sb.storage.from(BUCKET).getPublicUrl(path)
  return data.publicUrl
}

async function main() {
  for (const [productKey, def] of Object.entries(PRODUCT_VARIANTS)) {
    console.log(`\n═══ ${productKey.toUpperCase()} ═══`)
    const { data: prod } = await (sb as any).from('partner_products')
      .select('id, metadata, images')
      .eq('tenant_id', TENANT_ID)
      .eq('slug', def.slug)
      .maybeSingle()
    if (!prod) { console.log('  ⚠ no product'); continue }

    const existingColors: ColorVariant[] = prod.metadata?.colors || []
    console.log(`  existing colors: ${existingColors.map(c => c.name).join(', ')}`)

    // Upload + build new color variants
    const newVariants: ColorVariant[] = []
    for (const nc of def.newColors) {
      const frontFile = join(COLORS_DIR, `${productKey}-${nc.color}-front.png`)
      const backFile = join(COLORS_DIR, `${productKey}-${nc.color}-back.png`)
      if (!existsSync(frontFile)) { console.log(`  ⚠ ${nc.name} front file not found, skip`); continue }

      const frontKey = `${def.slug.replace(/-negr[oa]?$/, '')}-${nc.color}-front`
      const backKey = `${def.slug.replace(/-negr[oa]?$/, '')}-${nc.color}-back`
      const frontUrl = await uploadFile(frontFile, frontKey)
      const backUrl = nc.hasBack && existsSync(backFile) ? await uploadFile(backFile, backKey) : frontUrl

      newVariants.push({
        name: nc.name,
        value: nc.color,
        hex: nc.hex,
        images: { front: frontUrl, back: backUrl },
      })
      console.log(`  ✅ ${nc.name}`)
    }

    // Merge — existing first, new appended (avoid duplicates)
    const allColors = [...existingColors]
    for (const nv of newVariants) {
      if (!allColors.find(c => c.value === nv.value)) allColors.push(nv)
    }

    const newMetadata = { ...prod.metadata, colors: allColors }
    const { error } = await (sb as any).from('partner_products').update({ metadata: newMetadata }).eq('id', prod.id)
    if (error) throw error
    console.log(`  ✅ ${productKey} updated · ${allColors.length} colors total`)
  }

  console.log('\n═══ FINAL ═══')
  const { data: final } = await (sb as any).from('partner_products')
    .select('name, metadata')
    .eq('tenant_id', TENANT_ID)
  final?.forEach((p: any) => {
    const colors = p.metadata?.colors?.map((c: any) => c.name).join(', ') || '—'
    console.log(`· ${p.name}\n    ${colors}`)
  })
}

main().catch(e => { console.error('❌', e.message); process.exit(1) })
