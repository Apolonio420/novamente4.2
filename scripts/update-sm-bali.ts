/**
 * Update SM Bali product: replace lifestyle image with female model + update description.
 */
import { readFileSync } from 'fs'
import { resolve } from 'path'
import { createClient } from '@supabase/supabase-js'

const envPath = resolve(__dirname, '../.env.local')
const envContent = readFileSync(envPath, 'utf-8')
for (const line of envContent.split('\n')) {
  const trimmed = line.trim()
  if (!trimmed || trimmed.startsWith('#')) continue
  const eqIdx = trimmed.indexOf('=')
  if (eqIdx === -1) continue
  const key = trimmed.slice(0, eqIdx).trim()
  let val = trimmed.slice(eqIdx + 1).trim()
  if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) val = val.slice(1, -1)
  if (!process.env[key]) process.env[key] = val
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!
const BUCKET = 'partner-assets'
const TENANT_ID = '5adb9655-9823-47a4-a7b6-2c145aa8f7f8'

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

async function main() {
  // 1. Upload new lifestyle
  const buf = readFileSync(resolve(__dirname, '../../novamente-platform/scripts/out/maxy/partner/lifestyle-bali.png'))
  const path = `${TENANT_ID}/musculosa-sm-training-bali-negra-lifestyle.png`
  const { error: upErr } = await (supabase.storage as any).from(BUCKET).upload(path, buf, { contentType: 'image/png', upsert: true })
  if (upErr) throw upErr
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
  const newUrl = data.publicUrl + '?v=' + Date.now()
  console.log('✓ uploaded:', newUrl)

  // 2. Get current product
  const { data: prod, error: prodErr } = await (supabase as any).from('partner_products')
    .select('id, metadata, name, description')
    .eq('tenant_id', TENANT_ID)
    .eq('slug', 'musculosa-sm-training-bali-negra')
    .maybeSingle()
  if (prodErr) throw prodErr
  if (!prod) throw new Error('Product not found · slug=musculosa-sm-training-bali-negra')

  // 3. Update metadata + descriptions
  const newMetadata = { ...prod.metadata, lifestyleImages: [newUrl] }
  const { error: upError } = await (supabase as any).from('partner_products')
    .update({
      name: 'Musculosa SM Training · Bali Negra (Mujer)',
      description: 'Musculosa de mujer de morley premium con SM al pecho. Calce entallado · ideal para gym, training y verano.',
      metadata: {
        ...newMetadata,
        detailedDescription: 'Musculosa de mujer de morley premium con caída suave, color negro, calce entallado al cuerpo, con SM monogram al pecho izquierdo en estampa DTG. Talles femeninos S al 2XL.',
        cardDescription: 'Bali Musculosa Mujer · SM al pecho',
      },
    })
    .eq('id', prod.id)
  if (upError) throw upError
  console.log('✓ Bali updated to MUJER')

  // 4. List all products to verify
  const { data: all } = await (supabase as any).from('partner_products')
    .select('name, category, metadata')
    .eq('tenant_id', TENANT_ID)
  console.log('\n=== Productos finales ===')
  all?.forEach((p: any) => {
    const ls = p.metadata?.lifestyleImages?.[0]?.slice(-50) || '—'
    console.log(`· ${p.name}  [${p.category}]`)
    console.log(`    lifestyle: ...${ls}`)
  })
}

main().catch(e => { console.error('❌', e.message); process.exit(1) })
