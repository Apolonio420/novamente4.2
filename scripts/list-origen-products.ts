import { readFileSync } from 'fs'
import { resolve } from 'path'
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

async function main() {
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  const { data: t } = await (sb as any).from('tenants').select('id, name, slug, status').eq('slug', 'origen').single()
  console.log('TENANT:', JSON.stringify(t))
  const { data, error } = await (sb as any)
    .from('partner_products')
    .select('id, slug, name, category, price, status, images, metadata')
    .eq('tenant_id', t.id)
    .order('sort_order')
  console.log('error:', error?.message || 'none')
  console.log('count:', data?.length || 0)
  data?.forEach((p: any) => {
    console.log('\n=== ' + p.name + ' (' + p.status + ') $' + p.price + ' ===')
    console.log('slug:', p.slug)
    console.log('colors_meta:', JSON.stringify((p.metadata?.colors) || null))
    console.log('images:')
    ;(p.images || []).forEach((u: string, idx: number) => console.log('  [' + idx + '] ' + u))
  })
}
main()
