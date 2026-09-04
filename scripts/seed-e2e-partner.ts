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

// Branding minimo para que computeAutoPublishUpdates (lib/partners/auto-publish.ts)
// prenda storefront_published solo: la regla es logo_url + (banner_url O
// tagline O about_text). Ponemos logo + tagline + about_text + banner para que
// la tienda se vea completa en el video, no al ras del minimo. El logo es un
// asset REAL servido desde /public (mismo mecanismo que los ImageUpload reales
// guardan: una URL que next/image `unoptimized` puede resolver) — no una URL
// externa inventada ni un placeholder gris. Colores/tagline/about siguen la
// persona "Aurora Estudio" (marca de streetwear/estampado), nunca texto que
// delate que esto es un fixture de test.
const E2E_BRANDING = {
  logo_url: "/branding/aurora-estudio-logo.png",
  banner_url: "/garments/tshirt-black-oversize-front.jpeg",
  primary_color: "#1e1b4b",
  secondary_color: "#f5f5ff",
  accent_color: "#818cf8",
  font_preference: "playfair",
  visual_style: "editorial",
  tagline: "Diseños propios, estampados a pedido",
  description: "Ropa y accesorios con estampas originales, hechos bajo pedido.",
  about_text:
    "Somos un estudio de diseño que estampa remeras, buzos y accesorios con arte propio. Cada pieza se produce a pedido, sin stock de sobra y con foco en la calidad de la impresión.",
  cta_text: "Escribinos por WhatsApp",
  cta_url: "https://wa.me/5491100000000",
}

// Inverso de E2E_BRANDING — deja el tenant en el estado "antes" (sin logo,
// sin publicar) que necesita e2e/record-branding-video.spec.ts para mostrar
// el banner/preview vacío y el toast de auto-publish real al guardar. Ver
// marketing_assets/faq-videos/STORYBOARDS.md sección 2. Uso:
//   npx tsx scripts/seed-e2e-partner.ts --reset-branding
// y despues de grabar, restaurar para los otros 4 videos con:
//   npx tsx scripts/seed-e2e-partner.ts --with-branding
async function ensureBrandingReset(tenantId: string): Promise<void> {
  const { error } = await admin
    .from("tenants")
    .update({
      logo_url: null,
      banner_url: null,
      hero_url: null,
      primary_color: "#000000",
      secondary_color: "#ffffff",
      accent_color: "#3b82f6",
      font_preference: "inter",
      visual_style: "minimal",
      tagline: null,
      description: null,
      about_text: null,
      cta_text: null,
      cta_url: null,
      storefront_published: false,
    })
    .eq("id", tenantId)
  if (error) throw error
  console.log("✓ Branding reseteado al estado 'antes' (sin logo, storefront_published=false)")
}

async function ensureBranding(tenantId: string): Promise<void> {
  const { error } = await admin
    .from("tenants")
    .update(E2E_BRANDING)
    .eq("id", tenantId)
  if (error) throw error

  // Como pisamos la tabla `tenants` directo (sin pasar por el endpoint
  // PUT /api/partners/branding), nadie corrio computeAutoPublishUpdates
  // (lib/partners/auto-publish.ts) para este update — esa funcion solo vive
  // en el codepath del endpoint. E2E_BRANDING de arriba ya cumple su condicion
  // (logo + tagline/banner/about), asi que replicamos su efecto a mano:
  // confirmamos storefront_published=true y lo forzamos si todavia no lo esta
  // (primera corrida del script, o el tenant quedo en otro estado por algo
  // externo). Asi el video de branding nunca muestra la tienda como no
  // publicada.
  const { data: tenant, error: readErr } = await admin
    .from("tenants")
    .select("storefront_published, status")
    .eq("id", tenantId)
    .single()
  if (readErr) throw readErr

  if (!tenant?.storefront_published) {
    const { error: publishErr } = await admin
      .from("tenants")
      .update({ storefront_published: true, status: "active" })
      .eq("id", tenantId)
    if (publishErr) throw publishErr
    console.log("✓ Branding actualizado — storefront_published forzado a true")
  } else {
    console.log("✓ Branding actualizado — storefront_published ya era true")
  }
}

// Pedidos de fixture para el tutorial de Pedidos (/workspace/orders). IDs fijos
// (formato UUID valido, no aleatorios) para que el upsert sea idempotente por
// `id` sin necesitar una columna "slug" como partner_products.
//
// SEGURIDAD — por que insertar filas directo en `partner_orders` acá es
// side-effect-free (investigado antes de escribir esto, ver reporte de la
// tarea): las unicas funciones que notifican por estos pedidos
// (notifyPartnerOrder, notifyTeamManualSale en lib/notifications.ts,
// notifyOrderShipped) se llaman DESDE el codigo de las rutas
// (POST /api/partners/orders, PUT /api/partners/orders/[id],
// runConfirmedOrderEffects en lib/payments/process-payment.ts) — nunca desde
// un trigger de base — asi que un INSERT directo con el service-role client
// no las dispara. No hay cron que recorra partner_orders (grep en
// app/api/cron/**: el unico cron que toca "orders" es abandoned-checkout, y
// usa la tabla `orders` del checkout propio, no `partner_orders`). No hay
// suscripcion realtime (.channel/postgres_changes) en todo el repo sobre esta
// tabla. lib/partners/daily-attention.ts y dashboard-kpis.ts SI leen
// partner_orders, pero solo para computar el dashboard del propio partner al
// pedirlo (GET on-demand) — no empujan nada a Telegram/Sheets/admin. Los
// payouts (lib/partners/daily-attention.ts sección finance) leen de
// `partner_payouts`, una tabla separada que no tocamos. No hay export a
// Google Sheets de partner_orders en el repo.
const E2E_ORDER_IDS = {
  nuevo: "a1a1a1a1-e2e0-4000-a000-000000000001",
  produccion: "a1a1a1a1-e2e0-4000-a000-000000000002",
  entregado: "a1a1a1a1-e2e0-4000-a000-000000000003",
} as const

function daysAgoIso(days: number): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
}

// Marca doble: legible para humanos (nombre/email de cliente obviamente
// ficticios pero NO alarmantes en pantalla — nunca "TEST ORDER") y legible
// para maquina (metadata.source/fixture, mismo patron exacto que
// metadata.source/fixture en partner_products). payment_id se deja null
// a proposito: la tabla tiene un onConflict('payment_id') usado por el bridge
// de pagos reales (process-payment.ts) — no queremos que un pago real algun
// dia choque contra un valor inventado.
//
// NOTA schema drift: el codigo (lib/partners/orders.ts, la UI de
// /workspace/orders) referencia una columna `payment_status`, y la migracion
// create_partner_orders_table.sql la declara — pero la tabla EN VIVO (
// confirmado corriendo un select real durante esta tarea, error PGRST204 al
// intentar escribirla) no la tiene. Es drift preexistente, no introducido por
// este seed — no la mandamos en el insert porque rompe. Efecto visible: el
// badge de "Pago" en la UI va a mostrar siempre "Pendiente" para estos 3
// pedidos (falla igual para pedidos reales, no es un problema nuevo de este
// fixture).
function buildDemoOrder(
  tenantId: string,
  id: string,
  input: {
    status: "pending" | "confirmed" | "producing" | "shipped" | "delivered" | "exception" | "cancelled"
    fulfillment_status: string
    itemName: string
    quantity: number
    unitPrice: number
    daysAgo: number
  },
) {
  return {
    id,
    tenant_id: tenantId,
    customer_name: "Cliente de Prueba",
    customer_email: "cliente@novamente.test",
    customer_phone: "+5491100000000",
    items: [
      {
        name: input.itemName,
        quantity: input.quantity,
        unit_price: input.unitPrice,
      },
    ],
    total: input.quantity * input.unitPrice,
    currency: "ARS",
    status: input.status,
    payment_id: null,
    shipping_info: {},
    notes: null,
    fulfillment_status: input.fulfillment_status,
    metadata: { source: "seed-e2e-partner", fixture: true },
    created_at: daysAgoIso(input.daysAgo),
    updated_at: daysAgoIso(Math.max(input.daysAgo - 1, 0)),
  }
}

async function ensureDemoOrders(tenantId: string): Promise<void> {
  const rows = [
    buildDemoOrder(tenantId, E2E_ORDER_IDS.nuevo, {
      status: "pending",
      fulfillment_status: "awaiting_art_approval",
      itemName: "Remera Dragon Neon",
      quantity: 1,
      unitPrice: 31000,
      daysAgo: 0,
    }),
    buildDemoOrder(tenantId, E2E_ORDER_IDS.produccion, {
      status: "producing",
      fulfillment_status: "in_production",
      itemName: "Buzo Aurora",
      quantity: 2,
      unitPrice: 55000,
      daysAgo: 3,
    }),
    buildDemoOrder(tenantId, E2E_ORDER_IDS.entregado, {
      status: "delivered",
      fulfillment_status: "delivered",
      itemName: "Tote Botánica",
      quantity: 3,
      unitPrice: 20900,
      daysAgo: 15,
    }),
  ]

  for (const row of rows) {
    const { error } = await admin.from("partner_orders").upsert(row, { onConflict: "id" })
    if (error) throw error
    console.log(`✓ Pedido fixture asegurado: ${row.status} (${row.id})`)
  }
}

async function main() {
  const withProducts = process.argv.includes("--with-products")
  const withBranding = process.argv.includes("--with-branding")
  const withOrders = process.argv.includes("--with-orders")
  const resetBranding = process.argv.includes("--reset-branding")

  console.log("Seeding E2E partner fixture...")
  const userId = await ensureUser()
  const tenantId = await ensureTenant()
  await ensureMembership(tenantId, userId)

  if (withProducts) {
    await ensureCatalogProducts(tenantId)
  }

  if (resetBranding) {
    await ensureBrandingReset(tenantId)
  } else if (withBranding) {
    await ensureBranding(tenantId)
  }

  if (withOrders) {
    await ensureDemoOrders(tenantId)
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
