/**
 * Set suggested PVPs on SM partner products.
 * Partner cost stays in metadata.partnerCost; price column = PVP shown to public.
 */
import { readFileSync } from 'fs'
import { resolve } from 'path'
import { createClient } from '@supabase/supabase-js'

const envPath = resolve(__dirname, '../.env.local')
for (const line of readFileSync(envPath, 'utf-8').split('\n')) {
  const t = line.trim()
  if (!t || t.startsWith('#')) continue
  const i = t.indexOf('=')
  if (i === -1) continue
  let v = t.slice(i + 1).trim()
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1)
  const k = t.slice(0, i).trim()
  if (!process.env[k]) process.env[k] = v
}

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const PVP_BY_SLUG: Record<string, { pvp: number; partnerCost: number }> = {
  'musculosa-sm-training-bali-negra-mujer': { pvp: 29900, partnerCost: 17400 },
  'remera-sm-aldea-classic-negra': { pvp: 42900, partnerCost: 25700 },
  'camiseta-sm-training-aura-oversize-negra': { pvp: 44900, partnerCost: 25400 },
  'buzo-crewneck-sm-berlin-negro': { pvp: 49900, partnerCost: 32200 },
  'buzo-hoodie-sm-boston-negro': { pvp: 59900, partnerCost: 38700 },
}

async function main() {
  const { data: products } = await (sb as any).from('partner_products')
    .select('id, slug, name, metadata, price')
    .eq('tenant_id', '5adb9655-9823-47a4-a7b6-2c145aa8f7f8')
  if (!products) throw new Error('no products')

  for (const p of products) {
    const def = PVP_BY_SLUG[p.slug]
    if (!def) { console.log(`⚠ no def for ${p.slug}`); continue }
    const newMetadata = {
      ...p.metadata,
      partnerCost: def.partnerCost,
      suggestedPVP: def.pvp,
    }
    await (sb as any).from('partner_products').update({
      price: def.pvp,
      metadata: newMetadata,
    }).eq('id', p.id)
    console.log(`✓ ${p.name}: PVP $${def.pvp.toLocaleString('es-AR')} (cost $${def.partnerCost.toLocaleString('es-AR')})`)
  }
}
main().catch(e => { console.error('❌', e.message); process.exit(1) })
