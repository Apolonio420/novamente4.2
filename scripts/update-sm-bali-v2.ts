/**
 * Replace Bali front mockup + lifestyle (proper musculosa now).
 */
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

const TENANT_ID = '5adb9655-9823-47a4-a7b6-2c145aa8f7f8'
const BUCKET = 'partner-assets'
const ASSETS_DIR = resolve(__dirname, '../../novamente-platform/scripts/out/maxy/partner')

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { autoRefreshToken: false, persistSession: false },
})

async function upload(localFile: string, key: string): Promise<string> {
  const buf = readFileSync(resolve(ASSETS_DIR, localFile))
  const path = `${TENANT_ID}/${key}.png`
  const { error } = await (sb.storage as any).from(BUCKET).upload(path, buf, { contentType: 'image/png', upsert: true })
  if (error) throw error
  const { data } = sb.storage.from(BUCKET).getPublicUrl(path)
  return data.publicUrl + '?v=' + Date.now()
}

async function main() {
  const frontUrl = await upload('mock-bali-front.png', 'musculosa-sm-training-bali-negra-front')
  const lifeUrl = await upload('lifestyle-bali.png', 'musculosa-sm-training-bali-negra-lifestyle')
  console.log('✓ uploaded mockup + lifestyle')

  const { data: prod } = await (sb as any).from('partner_products')
    .select('id, metadata, images')
    .eq('tenant_id', TENANT_ID)
    .eq('slug', 'musculosa-sm-training-bali-negra')
    .single()

  const newImages = [frontUrl, ...(prod.images || []).filter((u: string) => !u.includes('-front.'))]
  const newMetadata = {
    ...prod.metadata,
    lifestyleImages: [lifeUrl],
    colors: prod.metadata?.colors?.map((c: any) => ({
      ...c,
      images: { front: frontUrl, back: c.images?.back || frontUrl },
    })) || [],
  }
  const { error } = await (sb as any).from('partner_products').update({
    images: newImages,
    metadata: newMetadata,
  }).eq('id', prod.id)
  if (error) throw error
  console.log('✓ Bali product updated · musculosa real con SM')
}

main().catch(e => { console.error('❌', e.message); process.exit(1) })
