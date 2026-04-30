import { readFileSync } from 'fs'
import { resolve } from 'path'
import { createClient } from '@supabase/supabase-js'
const env = readFileSync(resolve(__dirname, '../.env.local'), 'utf-8')
for (const l of env.split('\n')) {
  const t = l.trim()
  if (!t || t.startsWith('#')) continue
  const i = t.indexOf('=')
  if (i === -1) continue
  const k = t.slice(0, i).trim()
  const v = t.slice(i + 1).trim().replace(/^["']|["']$/g, '')
  if (!process.env[k]) process.env[k] = v
}
const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } },
)
async function main() {
  const { data, error } = await sb.from('tenants').select('id, name, slug, email, metadata').limit(200)
  if (error) {
    console.error(error)
    return
  }
  const withTikTok = (data ?? []).filter((t: any) => t.metadata?.tiktok_integration)
  console.log('Tenants with tiktok_integration:', withTikTok.length)
  for (const t of withTikTok) {
    const ti: any = (t as any).metadata.tiktok_integration
    console.log(`  ${(t as any).slug} (${(t as any).id})  email=${(t as any).email}`)
    console.log(
      `    open_id=${ti.open_id ?? '(missing)'} scope=${ti.scope ?? '(missing)'} connected_at=${ti.connected_at ?? '(missing)'}`,
    )
  }
}
main()
