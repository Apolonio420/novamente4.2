/**
 * Crea (idempotente) un usuario partner de prueba para los E2E de Playwright.
 *
 * - Crea (o reutiliza) el user en Supabase Auth con email/password fijos.
 * - Crea (o reutiliza) un tenant asociado y lo linkea via tenant_users.
 * - Imprime las vars que hay que pegar en .env.local para correr los specs.
 *
 * Uso:
 *   npx tsx scripts/seed-e2e-partner.ts
 *
 * Requiere en .env.local:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */
import { createClient } from "@supabase/supabase-js"
import { config as loadEnv } from "dotenv"

loadEnv({ path: ".env.local" })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local")
  process.exit(1)
}

const E2E_EMAIL = process.env.E2E_PARTNER_EMAIL || "e2e-partner@novamente.test"
const E2E_PASSWORD = process.env.E2E_PARTNER_PASSWORD || "E2eTestPartner!2026"
const E2E_TENANT_SLUG = "e2e-partner-test"
// Nombre de marca plausible — NUNCA "E2E Partner Test"/"E2E" en pantalla: este
// tenant se usa para grabar videos tutoriales PUBLICOS (/ayuda), y cualquier
// texto que grite "esto es un test" es un leak de credibilidad tanto como un
// precio retail. Ningun spec de e2e/ assertea sobre el nombre literal viejo
// (grepeado antes de este cambio) — si agregas un spec nuevo que lo necesite,
// usa el slug (E2E_TENANT_SLUG), no el nombre.
const E2E_TENANT_NAME = "Aurora Estudio"

const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

async function findUserByEmail(email: string): Promise<{ id: string } | null> {
  // listUsers no permite filtrar por email server-side; paginamos.
  let page = 1
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 })
    if (error) throw error
    const match = data.users.find(u => u.email?.toLowerCase() === email.toLowerCase())
    if (match) return { id: match.id }
    if (data.users.length < 1000) return null
    page += 1
  }
}

async function ensureUser(): Promise<string> {
  const existing = await findUserByEmail(E2E_EMAIL)
  if (existing) {
    console.log(`✓ User ya existe: ${E2E_EMAIL} (${existing.id})`)
    // Resetear el password por las dudas (idempotente)
    const { error } = await admin.auth.admin.updateUserById(existing.id, {
      password: E2E_PASSWORD,
      email_confirm: true,
    })
    if (error) throw error
    return existing.id
  }
  const { data, error } = await admin.auth.admin.createUser({
    email: E2E_EMAIL,
    password: E2E_PASSWORD,
    email_confirm: true,
  })
  if (error || !data.user) throw error ?? new Error("createUser returned no user")
  console.log(`✓ User creado: ${E2E_EMAIL} (${data.user.id})`)
  return data.user.id
}

async function ensureTenant(): Promise<string> {
  const { data: existing } = await admin
    .from("tenants")
    .select("id")
    .eq("slug", E2E_TENANT_SLUG)
    .maybeSingle()

  if (existing?.id) {
    // Update idempotente: si el tenant se creo con el nombre viejo ("E2E
    // Partner Test"), lo corregimos sin tocar el slug ni nada mas.
    const { error: updErr } = await admin
      .from("tenants")
      .update({ name: E2E_TENANT_NAME })
      .eq("id", existing.id)
    if (updErr) throw updErr
    console.log(`✓ Tenant ya existe: ${E2E_TENANT_SLUG} (${existing.id}) — nombre asegurado: "${E2E_TENANT_NAME}"`)
    return existing.id as string
  }

  const { data, error } = await admin
    .from("tenants")
    .insert({
      slug: E2E_TENANT_SLUG,
      name: E2E_TENANT_NAME,
      email: E2E_EMAIL,
      plan: "starter",
      status: "active",
      onboarding_step: 4,
      storefront_published: false,
      description: "Tenant fixture para tests E2E. No tocar manualmente.",
    })
    .select("id")
    .single()
  if (error || !data) throw error ?? new Error("tenant insert returned null")
  console.log(`✓ Tenant creado: ${E2E_TENANT_SLUG} (${data.id})`)
  return data.id as string
}

async function ensureMembership(tenantId: string, userId: string): Promise<void> {
  const { data: existing } = await admin
    .from("tenant_users")
    .select("user_id")
    .eq("tenant_id", tenantId)
    .eq("user_id", userId)
    .maybeSingle()
  if (existing) {
    console.log("✓ tenant_users link ya existe")
    return
  }
  const { error } = await admin.from("tenant_users").insert({
    tenant_id: tenantId,
    user_id: userId,
    role: "owner",
    accepted_at: new Date().toISOString(),
  })
  if (error) throw error
  console.log("✓ tenant_users link creado")
}

// Productos de fixture para grabar el tutorial de Catálogo (marketing_assets /
// e2e/record-catalog-video.spec.ts). Slugs estables => upsert idempotente.
// Imagenes: assets estaticos reales ya servidos desde /public (mismos que usa
// el catalogo real), asi el video no muestra skeletons ni imagenes rotas.
const E2E_CATALOG_PRODUCTS = [
  {
    slug: "e2e-remera-dragon-neon",
    name: "Remera Dragon Neon",
    description: "Remera oversize con estampa custom Novamente.",
    category: "Remera Oversize",
    price: 31000,
    images: ["/garments/tshirt-black-oversize-front.jpeg"],
    tags: ["novamente", "estampado-dtg", "oversize"],
  },
  {
    slug: "e2e-buzo-aurora",
    name: "Buzo Aurora",
    description: "Buzo hoodie oversize con estampa custom Novamente.",
    category: "Buzo Hoodie Oversize",
    price: 55000,
    images: ["/garments/buzo-hoodie-unisex-black-front.png"],
    tags: ["novamente", "estampado-dtg", "hoodie"],
  },
  {
    slug: "e2e-tote-botanica",
    name: "Tote Botánica",
    description: "Totebag de algodón crudo con estampa custom Novamente.",
    category: "Accesorio",
    price: 20900,
    images: ["/products/totebag-crudo/front.jpg"],
    tags: ["novamente", "estampado-dtg", "totebag"],
  },
]

async function ensureCatalogProducts(tenantId: string): Promise<void> {
  for (const p of E2E_CATALOG_PRODUCTS) {
    const { data: existing } = await admin
      .from("partner_products")
      .select("id")
      .eq("tenant_id", tenantId)
      .eq("slug", p.slug)
      .maybeSingle()

    const row = {
      tenant_id: tenantId,
      name: p.name,
      description: p.description,
      category: p.category,
      slug: p.slug,
      price: p.price,
      stock: 25,
      images: p.images,
      tags: p.tags,
      status: "published",
      metadata: { source: "seed-e2e-partner", fixture: true },
    }

    if (existing?.id) {
      const { error } = await admin.from("partner_products").update(row).eq("id", existing.id)
      if (error) throw error
      console.log(`✓ Producto fixture actualizado: ${p.name} (${p.slug})`)
    } else {
      const { error } = await admin.from("partner_products").insert(row)
      if (error) throw error
      console.log(`✓ Producto fixture creado: ${p.name} (${p.slug})`)
    }
  }
}

async function main() {
  const withProducts = process.argv.includes("--with-products")

  console.log("Seeding E2E partner fixture...")
  const userId = await ensureUser()
  const tenantId = await ensureTenant()
  await ensureMembership(tenantId, userId)

  if (withProducts) {
    await ensureCatalogProducts(tenantId)
  }

  console.log("\nListo. Agrega esto a tu .env.local (si no esta):")
  console.log(`E2E_PARTNER_EMAIL=${E2E_EMAIL}`)
  console.log(`E2E_PARTNER_PASSWORD=${E2E_PASSWORD}`)
  console.log("\nLuego corre: npx playwright test e2e/partners-catalog-policy.spec.ts")
}

main().catch(err => {
  console.error("Seed fallo:", err)
  process.exit(1)
})
