/**
 * Remove Marrón, Gris Melange, Crema from Boston (hoodie oversize).
 * Keep: Negro, Blanco, Stone Wash.
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

const REMOVE = ['marron', 'gris', 'crema']

async function main() {
  const { data: prod } = await (sb as any).from('partner_products')
    .select('id, metadata')
    .eq('tenant_id', '5adb9655-9823-47a4-a7b6-2c145aa8f7f8')
    .eq('slug', 'buzo-hoodie-sm-boston-negro')
    .single()
  if (!prod) throw new Error('not found')

  const before = (prod.metadata?.colors || []).map((c: any) => c.name)
  const cleaned = (prod.metadata?.colors || []).filter((c: any) => !REMOVE.includes((c.value || '').toLowerCase()))
  const after = cleaned.map((c: any) => c.name)

  console.log('before:', before)
  console.log('after:', after)
  await (sb as any).from('partner_products').update({
    metadata: { ...prod.metadata, colors: cleaned },
  }).eq('id', prod.id)
  console.log('✓ Boston cleaned')
}
main().catch(e => { console.error('❌', e.message); process.exit(1) })
