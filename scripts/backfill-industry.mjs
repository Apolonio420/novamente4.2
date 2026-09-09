/**
 * Backfill de tenants.industry a categorías canónicas
 * (lib/partners/industry.ts) + tenants.metadata.industry_raw con el texto
 * original del partner.
 *
 * Idempotente: en --apply solo toca metadata.industry_raw donde todavía es
 * null (no pisa un industry_raw ya seteado por los escritores en vivo —
 * onboarding/settings routes) y solo procesa filas con industry no-null.
 *
 * Uso:
 *   node scripts/backfill-industry.mjs             # --dry-run (default)
 *   node scripts/backfill-industry.mjs --dry-run
 *   node scripts/backfill-industry.mjs --apply
 */
import { createClient } from '@supabase/supabase-js'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

for (const f of ['.env.local', '.env']) {
  const p = join(process.cwd(), f)
  if (existsSync(p)) {
    for (const line of readFileSync(p, 'utf8').split('\n')) {
      const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/)
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
    }
  }
}

const sb = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
)

const APPLY = process.argv.includes('--apply')

// ── espejo de normalizeIndustry (lib/partners/industry.ts) ──
// Este script es .mjs plano (sin build step), así que no puede importar el
// .ts directamente. Si tocás las reglas de categorización, actualizá ACÁ
// TAMBIÉN — lib/partners/industry.test.ts es la fuente de verdad de los
// casos esperados.
function fold(s) {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
}

const RULES = [
  { slug: 'deportes', keywords: ['gym', 'fitness', 'running', 'ciclismo', 'surf', 'futbol', 'deportiv', 'deporte'] },
  { slug: 'streetwear', keywords: ['streetwear', 'urbano', 'urbana', 'alternativ'] },
  { slug: 'coleccionismo_web3', keywords: ['coleccionismo', 'coleccion', 'web3', 'blockchain'] },
  { slug: 'musica_arte', keywords: ['banda', 'musica', 'arte', 'diseno', 'estudio creativo', 'entretenimiento', 'imagen', 'danza'] },
  { slug: 'comunidad_causa', keywords: ['comunidad', 'social', 'religios', 'cristian', 'politic', 'peronis', 'identidad', 'nacional', 'educacion', 'academia', 'conferencia'] },
  { slug: 'merch_empresa', keywords: ['gastronom', 'cerveza', 'cervecer', 'beer', 'inmobiliari', 'estancia', 'bellez', 'salud', 'natural', 'comercio', 'bares', 'regaleria', 'regalos', 'merch'] },
  { slug: 'indumentaria', keywords: ['indumentaria', 'indmentaria', 'ropa', 'remera', 'textil', 'tienda', 'moda'] },
]

function normalizeIndustry(raw) {
  if (!raw) return null
  const trimmed = raw.trim()
  if (!trimmed || trimmed === '-') return null
  const folded = fold(trimmed)
  for (const rule of RULES) {
    if (rule.keywords.some((k) => folded.includes(k))) return rule.slug
  }
  return 'otro'
}

// ── leer todos los tenants, paginado ──
async function fetchAllTenants() {
  const pageSize = 500
  const rows = []
  let from = 0
  for (;;) {
    const { data, error } = await sb
      .from('tenants')
      .select('id, slug, industry, metadata')
      .range(from, from + pageSize - 1)
      .order('id', { ascending: true })
    if (error) { console.error('❌', error.message); process.exit(1) }
    rows.push(...(data ?? []))
    if (!data || data.length < pageSize) break
    from += pageSize
  }
  return rows
}

const tenants = await fetchAllTenants()
console.log(`${tenants.length} tenants totales\n`)

const withIndustry = tenants.filter((t) => t.industry != null && String(t.industry).trim() !== '')
console.log(`${withIndustry.length} con industry no-null (${tenants.length - withIndustry.length} sin industry, se saltean)\n`)

// ── agrupar raw → slug ──
const groups = new Map() // slug -> Map(raw -> count)
const otroValues = new Map() // raw -> count

for (const t of withIndustry) {
  const raw = String(t.industry)
  const slug = normalizeIndustry(raw)
  if (!groups.has(slug)) groups.set(slug, new Map())
  const m = groups.get(slug)
  m.set(raw, (m.get(raw) ?? 0) + 1)
  if (slug === 'otro') otroValues.set(raw, (otroValues.get(raw) ?? 0) + 1)
}

console.log(`=== raw → slug (agrupado) ===\n`)
for (const [slug, rawCounts] of [...groups.entries()].sort((a, b) => b[1].size - a[1].size)) {
  const total = [...rawCounts.values()].reduce((a, b) => a + b, 0)
  console.log(`--- ${slug} (${total} tenants, ${rawCounts.size} valores distintos) ---`)
  for (const [raw, count] of [...rawCounts.entries()].sort((a, b) => b[1] - a[1])) {
    console.log(`  "${raw}" → ${slug}  (${count})`)
  }
  console.log('')
}

console.log(`=== valores que cayeron en 'otro' (${otroValues.size} distintos) ===`)
if (otroValues.size === 0) {
  console.log('  (ninguno)')
} else {
  for (const [raw, count] of [...otroValues.entries()].sort((a, b) => b[1] - a[1])) {
    console.log(`  "${raw}" (${count})`)
  }
}
console.log('')

if (!APPLY) {
  console.log('--dry-run (default): no se escribió nada. Corré con --apply para aplicar.')
  process.exit(0)
}

// ── --apply: actualiza industry siempre; metadata.industry_raw SOLO si es null ──
console.log('=== --apply: escribiendo ===\n')
let updated = 0, skippedRawSet = 0, failed = 0

for (const t of withIndustry) {
  const raw = String(t.industry)
  const slug = normalizeIndustry(raw)
  const currentMetadata = t.metadata ?? {}
  const hasRaw = typeof currentMetadata.industry_raw === 'string' && currentMetadata.industry_raw.trim() !== ''

  const updates = { industry: slug }
  if (!hasRaw) {
    updates.metadata = { ...currentMetadata, industry_raw: raw.trim() }
  } else {
    skippedRawSet++
  }

  const { error } = await sb.from('tenants').update(updates).eq('id', t.id)
  if (error) {
    console.error(`❌ ${t.slug} (${t.id}): ${error.message}`)
    failed++
  } else {
    updated++
  }
}

console.log(`\nListo: ${updated} tenants actualizados, ${skippedRawSet} ya tenían metadata.industry_raw (no se tocó), ${failed} fallidos.`)
if (failed > 0) process.exit(1)
