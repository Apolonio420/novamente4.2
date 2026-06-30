/** Carga medidas reales (cm) en metadata.sizing de los productos de Ñancupil.
 * Fuente: scripts/generate-size-guide-pdf.ts (SIZE_CHARTS). Ancho=axila-a-axila, Largo=hombro-a-ruedo. */
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { resolve } from 'path'

for (const line of readFileSync(resolve(process.cwd(), '.env.local'), 'utf-8').split('\n')) {
  const t = line.trim(); if (!t || t.startsWith('#')) continue
  const i = t.indexOf('='); if (i === -1) continue
  const k = t.slice(0, i).trim(); let v = t.slice(i + 1).trim()
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1)
  if (!process.env[k]) process.env[k] = v
}
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })
const TID = '9e179304-42ca-48ac-996b-5a67a204e8fc'

const SIZING = {
  boston: { S: 'Ancho 66 cm · Largo 69 cm', M: 'Ancho 68 cm · Largo 71 cm', L: 'Ancho 70 cm · Largo 73 cm', XL: 'Ancho 72 cm · Largo 75 cm', XXL: 'Ancho 74 cm · Largo 77 cm' },
  aldea: { S: 'Ancho 48 cm · Largo 63 cm', M: 'Ancho 52 cm · Largo 68 cm', L: 'Ancho 56 cm · Largo 72 cm', XL: 'Ancho 58 cm · Largo 75 cm', XXL: 'Ancho 60 cm · Largo 77 cm' },
  'buenos-aires': { S: 'Ancho 47 cm · Largo 61 cm', M: 'Ancho 49 cm · Largo 63 cm', L: 'Ancho 51 cm · Largo 65 cm', XL: 'Ancho 53 cm · Largo 67 cm' },
}

for (const [slug, sizing] of Object.entries(SIZING)) {
  const { data: prod, error } = await sb.from('partner_products').select('id,metadata').eq('tenant_id', TID).eq('slug', slug).single()
  if (error) { console.log(`✗ ${slug}: ${error.message}`); continue }
  const metadata = { ...(prod.metadata || {}), sizing }
  const { error: ue } = await sb.from('partner_products').update({ metadata }).eq('id', prod.id)
  console.log(ue ? `✗ ${slug}: ${ue.message}` : `✓ ${slug}: medidas cargadas (${Object.keys(sizing).length} talles)`)
}
console.log('OK')
