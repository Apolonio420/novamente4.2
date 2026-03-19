/**
 * FIX TENANT DESIGN ENGINE MODE
 *
 * Updates all tenants with design_engine_mode='disabled' (or NULL) to 'presets'
 * so that the plan floor is respected correctly after the Math.max fix.
 *
 * Usage:
 *   npx tsx scripts/fix-tenant-design-mode.ts
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

async function main() {
  console.log('\nFixing tenant design_engine_mode...\n')

  // Find all tenants with disabled or null design_engine_mode
  const { data: tenants, error } = await supabase
    .from('tenants')
    .select('id, slug, name, design_engine_mode')
    .order('name')

  if (error || !tenants) {
    console.error('Failed to fetch tenants:', error?.message)
    process.exit(1)
  }

  console.log(`Found ${tenants.length} tenants total\n`)

  let fixed = 0
  for (const tenant of tenants) {
    const mode = tenant.design_engine_mode
    if (!mode || mode === 'disabled') {
      const { error: updateError } = await supabase
        .from('tenants')
        .update({ design_engine_mode: 'presets' })
        .eq('id', tenant.id)

      if (updateError) {
        console.log(`  ERR   ${tenant.name} (${tenant.slug}) — ${updateError.message}`)
      } else {
        console.log(`  FIXED ${tenant.name} (${tenant.slug}) — ${mode || 'null'} → presets`)
        fixed++
      }
    } else {
      console.log(`  OK    ${tenant.name} (${tenant.slug}) — already ${mode}`)
    }
  }

  console.log(`\nDone: ${fixed} tenants updated to 'presets'`)
}

main().catch(console.error)
