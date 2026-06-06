/**
 * BACKFILL PARTNER AUTH
 *
 * Para tenants creados por INSERT directo en `tenants` (sin pasar por el wizard
 * /partners/join), este script crea el eslabón que falta para que el dueño
 * pueda LOGUEAR en /workspace:
 *
 *   1. auth.users        → crea el usuario Supabase (email + password temporal)
 *   2. tenant_users      → linkea user_id ↔ tenant_id con role='owner'
 *                          y accepted_at = now()  ← OBLIGATORIO o getTenantByUserId
 *                          no lo ve y el workspace queda vacío.
 *
 * Es idempotente:
 *   - Si el usuario ya existe (email duplicado) → lo reutiliza, NO toca su
 *     password (salvo que pases --reset-password) y solo garantiza el link.
 *   - Si el link ya existe → lo deja como está (y le pone accepted_at si faltaba).
 *
 * Uso:
 *   node scripts/backfill-partner-auth.mjs                 (dry-run, default)
 *   node scripts/backfill-partner-auth.mjs --execute       (aplica de verdad)
 *   node scripts/backfill-partner-auth.mjs --execute --reset-password
 *        (además resetea el password de los usuarios que YA existían, para
 *         poder mandarles una credencial conocida por WhatsApp)
 *
 * Al final imprime una tabla email + password temporal lista para copiar.
 */
import { createClient } from "@supabase/supabase-js"
import { randomBytes } from "crypto"
import { readFileSync, existsSync } from "fs"
import { join } from "path"

// ─── Cargar .env.local / .env ──────────────────────────────
for (const f of [".env.local", ".env"]) {
  const p = join(process.cwd(), f)
  if (existsSync(p)) {
    for (const line of readFileSync(p, "utf8").split("\n")) {
      const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/)
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "")
    }
  }
}

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } },
)

const EXECUTE = process.argv.includes("--execute")
const RESET_PASSWORD = process.argv.includes("--reset-password")

// ─── Partners a backfillear ────────────────────────────────
// email: null → "pending", todavía sin email real → se SALTEA (no se puede
// crear el auth user sin email). Cuando lo consigas, agregalo acá y re-corré.
const PARTNERS = [
  { slug: "tu-opcion",            tenant_id: "d40c043f-af55-49f1-a11b-782d40cdb3a9", email: "Multiservicios.TUOPCION.46@gmail.com" },
  { slug: "betania-movement",     tenant_id: "c879b633-6526-4129-ba87-63401ae54fb5", email: "betanialorca81@gmail.com" },
  { slug: "vexo",                 tenant_id: "748084d8-1476-4e56-8a51-7f8ff8639c7b", email: null }, // pending · falta email Gustavo
  { slug: "soloneski-originals",  tenant_id: "f74f5886-eb4f-4c7c-83a1-31121ba73e45", email: null }, // pending · falta email Aquiles
  { slug: "yvsy",                 tenant_id: "f60c0dbd-613a-4758-960c-11870124e78d", email: "mattferrario.ok@gmail.com" },
  { slug: "sur98",                tenant_id: "3ce549fc-576c-446c-874e-bb86e5a06f08", email: "creacionesprismatica@gmail.com" },
  { slug: "wod-armor",            tenant_id: "127a104b-0cd1-4540-9c04-3876884e2eb6", email: null }, // pending · falta email Natalia
  { slug: "origen",               tenant_id: "e2c190d5-3911-453e-8b78-802d6c2da3df", email: "zurdo_cero@hotmail.com" },
  { slug: "cabalaurbana",         tenant_id: "1f9fd3f0-b0db-4db5-afd7-fd9becc57066", email: "lidiarosanag@gmail.com" },
]

// ─── Password temporal legible (sin caracteres ambiguos) ───
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789"
function tempPassword() {
  const pick = (n) => {
    const bytes = randomBytes(n)
    let out = ""
    for (let i = 0; i < n; i++) out += ALPHABET[bytes[i] % ALPHABET.length]
    return out
  }
  // formato: Nova-XXXX-XXXX → fácil de dictar/copiar por WhatsApp
  return `Nova-${pick(4)}-${pick(4)}`
}

async function findUserByEmail(email) {
  // listUsers pagina de a 50 por default; recorremos hasta encontrarlo.
  const target = email.toLowerCase()
  let page = 1
  for (;;) {
    const { data, error } = await sb.auth.admin.listUsers({ page, perPage: 200 })
    if (error) throw error
    const found = data.users.find((u) => (u.email || "").toLowerCase() === target)
    if (found) return found
    if (data.users.length < 200) return null
    page++
  }
}

async function main() {
  console.log(EXECUTE ? "🔥 EXECUTE — se crean usuarios y links de verdad" : "👀 DRY-RUN — pasale --execute para aplicar")
  if (RESET_PASSWORD) console.log("🔑 RESET-PASSWORD activo — usuarios existentes reciben password nuevo")
  console.log("")

  const credentials = []
  const skipped = []

  for (const p of PARTNERS) {
    if (!p.email) {
      console.log(`  PENDING  ${p.slug} — sin email, se saltea`)
      skipped.push(p)
      continue
    }

    // 1. Validar que el tenant exista
    const { data: tenant, error: tErr } = await sb
      .from("tenants")
      .select("id, slug, name, status")
      .eq("id", p.tenant_id)
      .single()

    if (tErr || !tenant) {
      console.log(`  ERR      ${p.slug} — tenant ${p.tenant_id} no existe (${tErr?.message || "not found"})`)
      continue
    }

    // 2. ¿Ya existe el auth user?
    let user = await findUserByEmail(p.email)
    let passwordToReport = null

    if (!user) {
      const password = tempPassword()
      if (EXECUTE) {
        const { data: created, error: cErr } = await sb.auth.admin.createUser({
          email: p.email,
          password,
          email_confirm: true,
        })
        if (cErr || !created?.user) {
          console.log(`  ERR      ${p.slug} — createUser falló: ${cErr?.message}`)
          continue
        }
        user = created.user
      } else {
        user = { id: "(dry-run)", email: p.email }
      }
      passwordToReport = password
      console.log(`  NEW USER ${p.slug.padEnd(20)} ${p.email} → ${password}`)
    } else {
      console.log(`  EXISTS   ${p.slug.padEnd(20)} ${p.email} (user ${user.id})`)
      if (RESET_PASSWORD) {
        const password = tempPassword()
        if (EXECUTE) {
          const { error: uErr } = await sb.auth.admin.updateUserById(user.id, { password })
          if (uErr) {
            console.log(`           ⚠️  no se pudo resetear password: ${uErr.message}`)
          } else {
            passwordToReport = password
            console.log(`           🔑 password reseteado → ${password}`)
          }
        } else {
          passwordToReport = password
          console.log(`           🔑 (dry-run) password nuevo → ${password}`)
        }
      }
    }

    // 3. Garantizar link tenant_users con accepted_at
    const { data: existingLink } = await sb
      .from("tenant_users")
      .select("id, accepted_at")
      .eq("tenant_id", tenant.id)
      .eq("user_id", user.id)
      .maybeSingle()

    if (!existingLink) {
      if (EXECUTE) {
        const { error: lErr } = await sb.from("tenant_users").insert({
          tenant_id: tenant.id,
          user_id: user.id,
          role: "owner",
          accepted_at: new Date().toISOString(),
        })
        if (lErr) {
          console.log(`           ⚠️  link falló: ${lErr.message}`)
          continue
        }
      }
      console.log(`           → linked owner (accepted_at=now)`)
    } else if (!existingLink.accepted_at) {
      // link existe pero quedó "pendiente" → activarlo
      if (EXECUTE) {
        await sb.from("tenant_users")
          .update({ accepted_at: new Date().toISOString() })
          .eq("id", existingLink.id)
      }
      console.log(`           → link existía sin accepted_at, activado`)
    } else {
      console.log(`           → ya linkeado y activo`)
    }

    credentials.push({ slug: p.slug, email: p.email, password: passwordToReport })
  }

  // ─── Resumen de credenciales para WhatsApp ───────────────
  console.log("\n" + "═".repeat(60))
  console.log("CREDENCIALES (mandar por WhatsApp · login: novamente.ar/partners/login)")
  console.log("═".repeat(60))
  for (const c of credentials) {
    const pass = c.password
      ? c.password
      : "(usuario ya existía — mandá 'Olvidé mi contraseña' o re-corré con --reset-password)"
    console.log(`\n  ${c.slug}\n    email: ${c.email}\n    pass:  ${pass}`)
  }
  if (skipped.length) {
    console.log("\n  PENDIENTES (sin email — completar en el script y re-correr):")
    for (const s of skipped) console.log(`    - ${s.slug} (${s.tenant_id})`)
  }
  console.log("")
  if (!EXECUTE) console.log("👀 Era DRY-RUN. Nada se escribió. Pasá --execute para aplicar.\n")
}

main().catch((e) => { console.error(e); process.exit(1) })
