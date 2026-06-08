/**
 * QA SETUP — cuenta de prueba reutilizable para QA visual / E2E del workspace.
 *
 * Crea (idempotente) un tenant QA + auth user + link tenant_users(owner) para
 * poder loguear en /workspace y sacar screenshots / correr tests sin tocar un
 * partner real.
 *
 * Credenciales desde env (definir en .env.local, NO hardcodear en el repo):
 *   QA_EMAIL, QA_PASSWORD   (opcional: QA_SLUG, default "qa-screenshots")
 *
 * Uso:
 *   node scripts/qa-setup.mjs            (crea/asegura la cuenta, imprime creds)
 *   node scripts/qa-setup.mjs --reset    (además resetea el password)
 */
import { createClient } from "@supabase/supabase-js"
import { readFileSync, existsSync } from "fs"
import { join } from "path"

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

const RESET = process.argv.includes("--reset")

const QA = {
  slug: process.env.QA_SLUG || "qa-screenshots",
  name: "QA Screenshots",
  email: process.env.QA_EMAIL,
  password: process.env.QA_PASSWORD,
}
if (!QA.email || !QA.password) {
  console.error("Falta QA_EMAIL / QA_PASSWORD en el entorno (definilas en .env.local).")
  process.exit(1)
}

async function findUserByEmail(email) {
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
  // 1. Tenant
  let { data: tenant } = await sb.from("tenants").select("id, slug").eq("slug", QA.slug).maybeSingle()
  if (!tenant) {
    const { data: created, error } = await sb
      .from("tenants")
      .insert({
        slug: QA.slug,
        name: QA.name,
        email: QA.email,
        plan: "pro",
        status: "active",
        design_engine_mode: "full_brand_fit",
        max_products: 50,
        storefront_published: false,
        seo_indexable: false,
      })
      .select("id, slug")
      .single()
    if (error) { console.error("tenant insert falló:", error.message); process.exit(1) }
    tenant = created
    console.log(`✓ tenant creado: ${tenant.slug} (${tenant.id})`)
  } else {
    console.log(`✓ tenant ya existía: ${tenant.slug} (${tenant.id})`)
  }

  // 2. Auth user
  let user = await findUserByEmail(QA.email)
  if (!user) {
    const { data: created, error } = await sb.auth.admin.createUser({
      email: QA.email,
      password: QA.password,
      email_confirm: true,
    })
    if (error || !created?.user) { console.error("createUser falló:", error?.message); process.exit(1) }
    user = created.user
    console.log(`✓ auth user creado: ${user.id}`)
  } else {
    console.log(`✓ auth user ya existía: ${user.id}`)
    if (RESET) {
      const { error } = await sb.auth.admin.updateUserById(user.id, { password: QA.password })
      console.log(error ? `  ⚠️ reset password falló: ${error.message}` : `  🔑 password reseteado`)
    }
  }

  // 3. Link tenant_users (owner, accepted)
  const { data: link } = await sb
    .from("tenant_users")
    .select("id, accepted_at")
    .eq("tenant_id", tenant.id)
    .eq("user_id", user.id)
    .maybeSingle()
  if (!link) {
    const { error } = await sb.from("tenant_users").insert({
      tenant_id: tenant.id,
      user_id: user.id,
      role: "owner",
      accepted_at: new Date().toISOString(),
    })
    if (error) { console.error("link falló:", error.message); process.exit(1) }
    console.log(`✓ link owner creado (accepted_at=now)`)
  } else {
    if (!link.accepted_at) {
      await sb.from("tenant_users").update({ accepted_at: new Date().toISOString() }).eq("id", link.id)
    }
    console.log(`✓ link ya existía y activo`)
  }

  console.log("\n" + "═".repeat(50))
  console.log("CUENTA QA LISTA — login: /partners/login")
  console.log("═".repeat(50))
  console.log(`  email: ${QA.email}`)
  console.log(`  pass:  ${QA.password}`)
  console.log("")
}

main().catch((e) => { console.error(e); process.exit(1) })
