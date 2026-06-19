/**
 * Durable fix for the "Error al guardar configuracion" (CBU) bug.
 * Idempotently ensures tenants.bank_cbu / bank_alias exist, reporting the
 * column state BEFORE and AFTER so we know if the missing column was the cause.
 *
 *   node scripts/ensure-bank-columns.mjs
 */
import pg from "pg"
import fs from "fs"

const env = Object.fromEntries(
    fs.readFileSync(new URL("../.env.local", import.meta.url), "utf8")
        .split("\n").filter(l => l.includes("=") && !l.trim().startsWith("#"))
        .map(l => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, "")] })
)
const rawConn = env.POSTGRES_URL_NON_POOLING || env.POSTGRES_URL
if (!rawConn) { console.error("❌ No POSTGRES_URL_NON_POOLING / POSTGRES_URL in .env.local"); process.exit(1) }
// Strip sslmode so it doesn't force verify-full over our rejectUnauthorized:false
// (Supabase's direct connection uses a self-signed cert chain).
const u = new URL(rawConn)
u.searchParams.delete("sslmode")
const conn = u.toString()

const client = new pg.Client({ connectionString: conn, ssl: { rejectUnauthorized: false } })
const cols = async () => (await client.query(
    `SELECT column_name FROM information_schema.columns
     WHERE table_name='tenants' AND column_name IN ('bank_cbu','bank_alias') ORDER BY column_name`
)).rows.map(r => r.column_name)

await client.connect()
const before = await cols()
console.log("BEFORE:", before.length ? before.join(", ") : "(none — this WAS the cause of the save error)")

await client.query(`ALTER TABLE tenants
  ADD COLUMN IF NOT EXISTS bank_cbu TEXT,
  ADD COLUMN IF NOT EXISTS bank_alias TEXT;`)

const after = await cols()
console.log("AFTER: ", after.join(", "))
console.log(after.length === 2 ? "✅ bank_cbu + bank_alias present. CBU save fixed." : "⚠️ unexpected state")
await client.end()
