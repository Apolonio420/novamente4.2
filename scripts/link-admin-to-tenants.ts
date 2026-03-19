/**
 * LINK ADMIN TO ALL TENANTS
 *
 * Links a Supabase Auth user (by email) to all tenants except excluded ones.
 * This allows the admin to switch between tenants in the workspace.
 *
 * Usage:
 *   npx tsx scripts/link-admin-to-tenants.ts
 */

import { readFileSync } from 'fs'
import { resolve } from 'path'
import { createClient } from '@supabase/supabase-js'

// Load .env.local
const envPath = resolve(__dirname, '../.env.local')
const envContent = readFileSync(envPath, 'utf-8')
for (const line of envContent.split('\n')) {
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

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

// ─── Config ─────────────────────────────────────────────
const ADMIN_EMAIL = 'apolonio@novamente.ar'
const EXCLUDED_SLUGS = ['hard-demonio', 'ventolito', 'ventolito-wind-surf']

async function main() {
  console.log(`\nLinking ${ADMIN_EMAIL} to all tenants (except: ${EXCLUDED_SLUGS.join(', ')})...\n`)

  // 1. Find the user
  const { data: listData } = await supabase.auth.admin.listUsers()
  const user = listData?.users?.find((u: any) => u.email === ADMIN_EMAIL)
  if (!user) {
    console.error(`User ${ADMIN_EMAIL} not found in Supabase Auth`)
    process.exit(1)
  }
  console.log(`Found user: ${user.email} (${user.id})`)

  // 2. Get all tenants
  const { data: tenants, error: tenantError } = await supabase
    .from('tenants')
    .select('id, slug, name, status')
    .order('name')

  if (tenantError || !tenants) {
    console.error('Failed to fetch tenants:', tenantError?.message)
    process.exit(1)
  }

  console.log(`Found ${tenants.length} tenants total\n`)

  // 3. Get existing links for this user
  const { data: existingLinks } = await supabase
    .from('tenant_users')
    .select('tenant_id')
    .eq('user_id', user.id)

  const linkedTenantIds = new Set((existingLinks || []).map((l: any) => l.tenant_id))

  // 4. Link to each non-excluded tenant
  let linked = 0
  let skipped = 0
  for (const tenant of tenants) {
    if (EXCLUDED_SLUGS.includes(tenant.slug)) {
      console.log(`  SKIP  ${tenant.name} (${tenant.slug}) — excluded`)
      skipped++
      continue
    }

    if (linkedTenantIds.has(tenant.id)) {
      console.log(`  OK    ${tenant.name} (${tenant.slug}) — already linked`)
      continue
    }

    const { error: linkError } = await supabase
      .from('tenant_users')
      .insert({
        tenant_id: tenant.id,
        user_id: user.id,
        role: 'owner',
      })

    if (linkError) {
      console.log(`  ERR   ${tenant.name} (${tenant.slug}) — ${linkError.message}`)
    } else {
      console.log(`  NEW   ${tenant.name} (${tenant.slug}) — linked as owner`)
      linked++
    }
  }

  console.log(`\nDone: ${linked} new links, ${skipped} excluded`)
}

main().catch(console.error)
