/**
 * scripts/apply-migration.ts
 *
 * Aplica un archivo .sql de migrations/ directo contra Postgres via POSTGRES_URL.
 *
 * Uso:
 *   npx tsx scripts/apply-migration.ts migrations/create_partner_discount_codes.sql
 *
 * Si no se pasa archivo, aplica la migracion de discount codes por default.
 */

import { readFileSync, existsSync } from 'fs'
import { resolve } from 'path'
import { Client } from 'pg'

// Cargar .env.local manualmente (mismo patron que otros scripts)
const envPath = resolve(__dirname, '../.env.local')
if (existsSync(envPath)) {
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
}

const POSTGRES_URL = process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL
if (!POSTGRES_URL) {
  console.error('Falta POSTGRES_URL o POSTGRES_URL_NON_POOLING en .env.local')
  process.exit(1)
}

const fileArg = process.argv[2] || 'migrations/create_partner_discount_codes.sql'
const sqlPath = resolve(__dirname, '..', fileArg)
if (!existsSync(sqlPath)) {
  console.error(`Archivo no encontrado: ${sqlPath}`)
  process.exit(1)
}

const sql = readFileSync(sqlPath, 'utf-8')

async function main() {
  // Supabase usa certificados self-signed en su pooler — desactivamos verificacion
  // para conexion directa (scripts admin). En produccion Vercel se usa el adapter
  // del SDK que maneja esto automaticamente.
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
  const client = new Client({
    connectionString: POSTGRES_URL,
    ssl: { require: true, rejectUnauthorized: false } as any,
  })
  console.log(`\n→ Conectando a Postgres...`)
  await client.connect()
  console.log(`✓ Conectado`)

  console.log(`→ Aplicando ${fileArg} (${sql.length} bytes)...`)
  try {
    await client.query(sql)
    console.log(`✓ Migracion aplicada con exito`)

    // Verificacion opcional: si la migracion crea una tabla, listarla
    const tableMatch = sql.match(/CREATE TABLE IF NOT EXISTS\s+(\w+)/i) || sql.match(/CREATE TABLE\s+(\w+)/i)
    if (tableMatch) {
      const tableName = tableMatch[1]
      const result = await client.query(
        `SELECT column_name, data_type FROM information_schema.columns WHERE table_name = $1 ORDER BY ordinal_position`,
        [tableName]
      )
      console.log(`\n→ Verificacion: tabla "${tableName}" tiene ${result.rows.length} columnas:`)
      result.rows.forEach((r: any) => console.log(`   ${r.column_name.padEnd(28)} ${r.data_type}`))
    }
  } catch (err: any) {
    console.error(`\n✗ Error aplicando migracion:`, err.message)
    if (err.detail) console.error(`  detail: ${err.detail}`)
    if (err.hint) console.error(`  hint: ${err.hint}`)
    process.exit(1)
  } finally {
    await client.end()
  }
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
