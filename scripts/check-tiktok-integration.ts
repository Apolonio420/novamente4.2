import { readFileSync } from 'fs'
import { resolve } from 'path'
import { createClient } from '@supabase/supabase-js'

const envPath = resolve(__dirname, '../.env.local')
for (const line of readFileSync(envPath, 'utf-8').split('\n')) {
  const t = line.trim()
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

const email = (process.argv[2] || '').toLowerCase().trim()
if (!email) {
  console.error('Usage: npx tsx scripts/check-tiktok-integration.ts <email>')
  process.exit(1)
}

async function main() {
  const { data: list } = await sb.auth.admin.listUsers({ page: 1, perPage: 1000 })
  const user = list?.users?.find((u) => u.email?.toLowerCase() === email)
  if (!user) {
    console.log('No auth user for', email)
    return
  }
  console.log('user:', user.id)

  const { data: links } = await sb.from('tenant_users').select('tenant_id, role').eq('user_id', user.id)
  console.log('tenant_users links:', links)

  const ids = (links ?? []).map((l: any) => l.tenant_id)
  for (const id of ids) {
    const { data: tenant } = await sb.from('tenants').select('id, name, slug, metadata').eq('id', id).single()
    const meta: any = (tenant as any)?.metadata ?? {}
    console.log('\ntenant:', id, (tenant as any)?.slug)
    console.log('metadata keys:', Object.keys(meta))
    if (meta.tiktok_integration) {
      const ti = meta.tiktok_integration
      console.log('tiktok_integration:')
      console.log('  open_id:', ti.open_id ?? '(missing)')
      console.log('  scope:', ti.scope ?? '(missing)')
      console.log('  has access_token:', Boolean(ti.access_token))
      console.log('  has refresh_token:', Boolean(ti.refresh_token))
      console.log('  expires_at:', ti.expires_at ?? '(missing)')
      console.log('  connected_at:', ti.connected_at ?? '(missing)')
    } else {
      console.log('  NO tiktok_integration in metadata')
    }
  }
}
main()
