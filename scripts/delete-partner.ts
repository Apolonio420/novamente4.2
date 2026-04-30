/**
 * DELETE PARTNER SCRIPT
 *
 * Deletes a partner completely (tenant + linked tables + auth user) by email.
 *
 * Usage:
 *   npx tsx scripts/delete-partner.ts <email>
 *   npx tsx scripts/delete-partner.ts <email> --keep-auth   (only delete tenant rows, keep auth user)
 *
 * Env: reads .env.local (NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY).
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
  const k = trimmed.slice(0, eqIdx).trim()
  const v = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '')
  if (!process.env[k]) process.env[k] = v
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const email = process.argv[2]
const keepAuth = process.argv.includes('--keep-auth')

if (!email) {
  console.error('Usage: npx tsx scripts/delete-partner.ts <email> [--keep-auth]')
  process.exit(1)
}

const sb = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
})

async function main() {
  const target = email.toLowerCase().trim()
  console.log(`\n[delete-partner] target: ${target}`)

  // 1. Find auth user
  const { data: list } = await sb.auth.admin.listUsers({ page: 1, perPage: 1000 })
  const user = list?.users?.find((u) => u.email?.toLowerCase() === target)
  if (!user) {
    console.log('  · No auth user found with that email.')
  } else {
    console.log(`  · auth user: ${user.id}`)
  }

  // 2. Find tenants by email column AND via tenant_users link
  const { data: tenantsByEmail } = await sb
    .from('tenants')
    .select('id, name, slug, email')
    .eq('email', target)

  let tenantsByLink: { id: string; name: string; slug: string }[] = []
  if (user) {
    const { data: links } = await sb
      .from('tenant_users')
      .select('tenant_id')
      .eq('user_id', user.id)
    const ids = (links ?? []).map((l: any) => l.tenant_id)
    if (ids.length > 0) {
      const { data } = await sb.from('tenants').select('id, name, slug').in('id', ids)
      tenantsByLink = (data ?? []) as any
    }
  }

  const allTenantsMap = new Map<string, any>()
  ;[...(tenantsByEmail ?? []), ...tenantsByLink].forEach((t: any) =>
    allTenantsMap.set(t.id, t),
  )
  const tenants = [...allTenantsMap.values()]

  if (tenants.length === 0) {
    console.log('  · No tenants found for this user.')
  } else {
    console.log(`  · tenants found: ${tenants.length}`)
    for (const t of tenants) console.log(`     - ${t.id}  ${t.slug}  ${t.name}`)
  }

  // 3. Delete each tenant: cascade child rows in known tables, then the tenant row.
  const childTables = [
    'tenant_users',
    'partner_products',
    'partner_orders',
    'partner_leads',
    'agent_sessions',
    'agent_messages',
    'designer_sessions',
    'designer_messages',
    'leads',
    'lead_campaigns',
    'lead_interactions',
    'lead_scrape_jobs',
  ]

  for (const t of tenants) {
    console.log(`\n  → Deleting tenant ${t.slug} (${t.id})`)
    for (const table of childTables) {
      const { error, count } = await sb
        .from(table)
        .delete({ count: 'exact' })
        .eq('tenant_id', t.id)
      if (error && !/relation .* does not exist|column .* does not exist/i.test(error.message)) {
        console.log(`     · ${table}: ERROR ${error.message}`)
      } else if ((count ?? 0) > 0) {
        console.log(`     · ${table}: ${count} rows`)
      }
    }
    const { error: tenantErr } = await sb.from('tenants').delete().eq('id', t.id)
    if (tenantErr) {
      console.log(`     · tenants: ERROR ${tenantErr.message}`)
    } else {
      console.log(`     · tenants: 1 row`)
    }
  }

  // 4. Delete auth user (unless --keep-auth)
  if (user && !keepAuth) {
    const { error } = await sb.auth.admin.deleteUser(user.id)
    if (error) {
      console.log(`\n  · auth.admin.deleteUser ERROR: ${error.message}`)
    } else {
      console.log(`\n  · auth user deleted: ${user.id}`)
    }
  } else if (user && keepAuth) {
    console.log(`\n  · auth user kept (flag --keep-auth).`)
  }

  console.log('\n[delete-partner] done.\n')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
