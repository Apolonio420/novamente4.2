/**
 * scripts/restyle-kari-market.ts
 *
 * Re-estiliza el partner "Kari Market" con la nueva estetica (rose/cream,
 * mates personalizados, hand-drawn floral) y genera 5 productos nuevos.
 *
 * Lo que hace (en orden):
 *   1. Busca el tenant por slug (intenta variantes: karimarket, kari-market, etc.)
 *   2. Sube el logo nuevo a Supabase Storage
 *   3. Update tenant: logo_url, primary_color, secondary_color, tagline,
 *      description, banner_url (genera banner via Gemini con la estetica nueva)
 *   4. Borra TODOS los partner_products existentes del tenant
 *   5. Genera 5 productos nuevos con mockups (Gemini Image) en la nueva estetica
 *   6. Inserta partner_products con name, description, price, images, slug
 *
 * Uso:
 *   npx tsx scripts/restyle-kari-market.ts                  # dry run
 *   npx tsx scripts/restyle-kari-market.ts --execute        # ejecuta
 *   npx tsx scripts/restyle-kari-market.ts --execute --slug=otro-slug
 *
 * Env requerido:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *   GEMINI_API_KEY
 *   GEMINI_IMAGE_MODEL (opcional, default: gemini-3-pro-image-preview)
 */

import { readFileSync, existsSync } from "fs"
import { resolve } from "path"
import { createClient } from "@supabase/supabase-js"

// ─── env loader (mismo patron que create-partner.ts) ──────────────────────────
const envPath = resolve(__dirname, "../.env.local")
if (existsSync(envPath)) {
  const envContent = readFileSync(envPath, "utf-8")
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith("#")) continue
    const eqIdx = trimmed.indexOf("=")
    if (eqIdx === -1) continue
    const key = trimmed.slice(0, eqIdx).trim()
    let val = trimmed.slice(eqIdx + 1).trim()
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1)
    }
    if (!process.env[key]) process.env[key] = val
  }
}

// ─── args ─────────────────────────────────────────────────────────────────────
const args = process.argv.slice(2)
const EXECUTE = args.includes("--execute")
const SKIP_GEN = args.includes("--skip-gen") // reusa imagenes ya subidas, no llama a Gemini
const SLUG_OVERRIDE = args.find(a => a.startsWith("--slug="))?.split("=")[1]
const SLUG_CANDIDATES = SLUG_OVERRIDE
  ? [SLUG_OVERRIDE]
  : ["karimarket", "kari-market", "kari", "karri-market", "kari market"]

// ─── config ───────────────────────────────────────────────────────────────────
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!
const GEMINI_API_KEY = process.env.GEMINI_API_KEY!
const GEMINI_IMAGE_MODEL = process.env.GEMINI_IMAGE_MODEL || "gemini-3-pro-image-preview"
const BUCKET = "partner-assets"
const LOGO_LOCAL_PATH = resolve(__dirname, "../public/marketing/partners/kari-market/logo.jpeg")

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("Faltan NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY en .env.local")
  process.exit(1)
}
if (!GEMINI_API_KEY) {
  console.error("Falta GEMINI_API_KEY en .env.local")
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

// ─── estetica Kari Market ─────────────────────────────────────────────────────
const KARI_BRANDING = {
  primary_color: "#D9A6A6", // rose blush
  secondary_color: "#F5E6E0", // cream / dusty pink
  accent_color: "#7A4B4B", // deep wine (para texto sobre fondos claros)
  tagline: "Mates personalizados & emprendimientos",
  description:
    "Kari Market es un emprendimiento argentino que combina la cultura del mate con productos personalizados de estetica suave, romantica y floral. Indumentaria y accesorios con disenos hand-drawn, paleta rose blush y cream, ideales para regalar o regalarse.",
  industry: "Emprendimientos · Lifestyle",
  visual_style: "creativo" as const,
  cta_text: "Pedir por WhatsApp",
}

const KARI_AESTHETIC_BASE = [
  "soft rose blush and cream color palette (#D9A6A6, #F5E6E0)",
  "hand-drawn cursive script lettering, romantic feminine vibe",
  "delicate botanical line art (leaves, small florals, hearts)",
  "mate gourd motif with subtle steam, drawn in minimalist line style",
  "watercolor wash backgrounds, pastel tones",
  "feminine artisan emprendedora aesthetic",
  "NO photographs of people, NO heavy text overlays beyond the design itself",
].join(", ")

// ─── productos a generar ──────────────────────────────────────────────────────
interface ProductSpec {
  name: string
  slug: string
  category: string
  garment_color: "white" | "cream" | "pink"
  garmentDescription: string
  price: number
  designConcept: string
  description: string
}

const PRODUCTS: ProductSpec[] = [
  {
    name: "Remera Oversize 'Todo Pasa'",
    slug: "remera-oversize-todo-pasa",
    category: "Remera Oversize",
    garment_color: "cream",
    garmentDescription: "cream/off-white oversize t-shirt",
    price: 32000,
    designConcept:
      "Hand-drawn cursive lettering 'Todo Pasa' on chest, with a small heart and a stylized mate gourd line drawing underneath. Rose blush ink on cream fabric.",
    description:
      "Remera oversize en tono crema con la frase 'Todo Pasa' en lettering cursivo hecho a mano. Diseno minimalista con corazon y mate ilustrado. Estampado DTG premium sobre algodon 100%.",
  },
  {
    name: "Remera Classic 'Mate de la Manana'",
    slug: "remera-classic-mate-de-la-manana",
    category: "Remera Classic",
    garment_color: "white",
    garmentDescription: "white classic fit t-shirt",
    price: 28600,
    designConcept:
      "Centered illustration of a mate gourd with bombilla and curling steam, drawn in delicate line art with rose blush accents. Small hand-written script 'Buen dia' below. Watercolor wash effect.",
    description:
      "Remera classic blanca con ilustracion central de mate con bombilla y vapor. Estilo line art delicado en rose blush. Para empezar la manana con onda. Algodon 100% peinado, estampado DTG.",
  },
  {
    name: "Buzo Hoodie 'Emprende Bonito'",
    slug: "buzo-hoodie-emprende-bonito",
    category: "Hoodie",
    garment_color: "cream",
    garmentDescription: "cream/dusty pink oversize hoodie",
    price: 55000,
    designConcept:
      "Cursive script lettering 'Emprende Bonito' in deep wine color, framed by a delicate botanical wreath (leaves, small florals, hearts). Centered on chest. Romantic artisan feel.",
    description:
      "Hoodie oversize en tono crema con la frase 'Emprende Bonito' rodeada de una guirnalda botanica delicada. Para emprendedoras que aman lo lindo. Algodon frizado premium, estampado DTG de alta calidad.",
  },
  {
    name: "Musculosa 'Corazon Mate'",
    slug: "musculosa-corazon-mate",
    category: "Musculosa",
    garment_color: "white",
    garmentDescription: "white tank top / musculosa",
    price: 23500,
    designConcept:
      "Minimalist mate gourd inside a hand-drawn heart outline, rose blush color, centered small print on chest. Single-line continuous drawing style. Romantic and tiny.",
    description:
      "Musculosa morley blanca con diseno minimalista: un mate dibujado dentro de un corazon en lettering hand-drawn. Pequeno, delicado y femenino. Algodon 100%, perfecta para el verano emprendedor.",
  },
  {
    name: "Remera Oversize 'Kari Market Floral'",
    slug: "remera-oversize-kari-floral",
    category: "Remera Oversize",
    garment_color: "white",
    garmentDescription: "white oversize t-shirt",
    price: 32000,
    designConcept:
      "Botanical floral pattern in rose blush and dusty pink — small repeated motifs of leaves, tiny hearts, mate gourds and shopping bags (matching the Kari Market logo style). Distributed across the front of the chest. Cohesive with the brand logo aesthetic.",
    description:
      "Remera oversize blanca con patron floral botanico en rose blush. Motivos repetidos de hojas, corazones, mates y bolsas — la firma visual de Kari Market. Algodon 100%, estampado DTG premium.",
  },
]

// ─── helpers Gemini + upload ──────────────────────────────────────────────────
async function geminiGenerateImage(prompt: string): Promise<{ base64: string; mimeType: string } | null> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_IMAGE_MODEL}:generateContent?key=${GEMINI_API_KEY}`
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseModalities: ["IMAGE", "TEXT"] },
      }),
    })
    const data = await res.json()
    for (const cand of data.candidates ?? []) {
      for (const part of cand.content?.parts ?? []) {
        if (part.inlineData?.mimeType?.startsWith("image/") && part.inlineData?.data) {
          return { base64: part.inlineData.data, mimeType: part.inlineData.mimeType }
        }
      }
    }
  } catch (err) {
    console.error("    ✗ Gemini image generation failed:", (err as Error).message)
  }
  return null
}

async function uploadImage(
  base64OrBuffer: string | Buffer,
  mimeType: string,
  tenantId: string,
  filename: string,
): Promise<string | null> {
  const ext = mimeType.includes("png") ? "png" : "jpg"
  const path = `products/${tenantId}/${filename}.${ext}`
  const buffer = typeof base64OrBuffer === "string" ? Buffer.from(base64OrBuffer, "base64") : base64OrBuffer

  const { error } = await supabase.storage.from(BUCKET).upload(path, buffer, {
    contentType: mimeType,
    upsert: true,
  })
  if (error) {
    console.error("    ✗ Upload failed:", error.message)
    return null
  }
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
  return data.publicUrl
}

// ─── prompts ──────────────────────────────────────────────────────────────────
function buildBannerPrompt(): string {
  return [
    'Create a cinematic wide banner image (1200x400 landscape) for "Kari Market", an Argentine artisan emprendimiento.',
    "Style: soft watercolor wash background in rose blush and cream tones.",
    KARI_AESTHETIC_BASE,
    "Composition: scattered botanical elements (leaves, small florals, tiny hearts), a stylized mate gourd in the corner, a shopping bag silhouette with a heart on it.",
    "Mood: feminine, romantic, artisan, dreamy — like the inside of a stationery boutique.",
    "DO NOT include text or logos.",
    "DO NOT include human faces or models.",
  ].join(" ")
}

function buildProductPrompt(p: ProductSpec): string {
  return [
    `Professional product photography of a ${p.garmentDescription} with a custom screen-printed graphic design on the chest area, front view.`,
    `The design: ${p.designConcept}`,
    `Brand: "Kari Market" — ${KARI_BRANDING.tagline}.`,
    `Aesthetic: ${KARI_AESTHETIC_BASE}.`,
    "Style: high-end artisan brand lookbook photo, soft natural lighting, clean cream/off-white gradient background.",
    "Flat-lay or invisible mannequin, centered, full garment visible, ample empty space around.",
    "DO NOT include human models or faces. DO NOT add watermarks or text overlays beyond the printed design itself.",
    "The printed design should be delicate, feminine, and clearly visible.",
  ].join(" ")
}

// ─── main ─────────────────────────────────────────────────────────────────────
async function findTenant() {
  for (const slug of SLUG_CANDIDATES) {
    const { data } = await supabase.from("tenants").select("*").eq("slug", slug).maybeSingle()
    if (data) return data
  }
  // Fallback: por nombre conteniendo "kari"
  const { data } = await supabase.from("tenants").select("*").ilike("name", "%kari%")
  if (data && data.length > 0) {
    console.log(`  → Encontrados por nombre: ${data.map((t: any) => `${t.name} (${t.slug})`).join(", ")}`)
    return data[0]
  }
  return null
}

async function main() {
  console.log(`\n=== Restyle Kari Market ${EXECUTE ? "(EXECUTE)" : "(DRY RUN)"} ===\n`)

  // 1) Find tenant
  console.log("→ Buscando tenant...")
  const tenant = await findTenant()
  if (!tenant) {
    console.error("✗ No se encontro ningun tenant con slug kari* o nombre conteniendo 'kari'.")
    console.error("  Probar: npx tsx scripts/restyle-kari-market.ts --slug=<slug-exacto>")
    process.exit(1)
  }
  console.log(`✓ Tenant: ${tenant.name} (slug=${tenant.slug}, id=${tenant.id})\n`)

  // 2) List productos existentes
  const { data: existingProducts } = await supabase
    .from("partner_products")
    .select("id, name")
    .eq("tenant_id", tenant.id)
  const existingCount = existingProducts?.length ?? 0
  console.log(`→ Productos existentes: ${existingCount}`)
  existingProducts?.forEach((p: any) => console.log(`   - ${p.name} (${p.id})`))

  if (!EXECUTE) {
    console.log("\n[DRY RUN] Acciones que se ejecutarian:")
    console.log("  1. Subir logo desde", LOGO_LOCAL_PATH)
    console.log("  2. Update tenant:", KARI_BRANDING)
    console.log("  3. Generar banner via Gemini + subir")
    console.log(`  4. Borrar ${existingCount} productos existentes`)
    console.log(`  5. Crear ${PRODUCTS.length} productos nuevos:`)
    PRODUCTS.forEach(p => console.log(`     - ${p.name} ($${p.price})`))
    console.log("\nAgregar --execute para ejecutar.\n")
    return
  }

  // 3) Subir logo
  console.log("\n→ Subiendo logo nuevo...")
  if (!existsSync(LOGO_LOCAL_PATH)) {
    console.error("✗ Logo no encontrado en", LOGO_LOCAL_PATH)
    process.exit(1)
  }
  const logoBuffer = readFileSync(LOGO_LOCAL_PATH)
  const logoUrl = await uploadImage(logoBuffer, "image/jpeg", tenant.id, "logo")
  if (!logoUrl) {
    console.error("✗ Fallo subir logo")
    process.exit(1)
  }
  console.log("✓ Logo subido:", logoUrl)

  // 4) Banner = logo (la imagen subida por el usuario es la foto de portada)
  const bannerUrl = logoUrl
  console.log("\n→ Usando el logo como foto de portada (banner + hero):", bannerUrl)

  // 5) Update tenant branding
  console.log("\n→ Actualizando branding del tenant...")
  const tenantUpdate: Record<string, any> = {
    logo_url: logoUrl,
    primary_color: KARI_BRANDING.primary_color,
    secondary_color: KARI_BRANDING.secondary_color,
    accent_color: KARI_BRANDING.accent_color,
    tagline: KARI_BRANDING.tagline,
    description: KARI_BRANDING.description,
    industry: KARI_BRANDING.industry,
    visual_style: KARI_BRANDING.visual_style,
    cta_text: KARI_BRANDING.cta_text,
  }
  tenantUpdate.banner_url = bannerUrl
  tenantUpdate.hero_url = bannerUrl
  const { error: updateErr } = await supabase.from("tenants").update(tenantUpdate).eq("id", tenant.id)
  if (updateErr) {
    console.error("✗ Update tenant fallo:", updateErr.message)
    process.exit(1)
  }
  console.log("✓ Tenant actualizado")

  // 6) Borrar productos existentes
  if (existingCount > 0) {
    console.log(`\n→ Borrando ${existingCount} productos existentes...`)
    const { error: delErr } = await supabase.from("partner_products").delete().eq("tenant_id", tenant.id)
    if (delErr) {
      console.error("✗ Delete productos fallo:", delErr.message)
      process.exit(1)
    }
    console.log("✓ Productos viejos borrados")
  }

  // 7) Crear productos nuevos
  console.log(`\n→ Creando ${PRODUCTS.length} productos nuevos...`)
  let created = 0
  for (let i = 0; i < PRODUCTS.length; i++) {
    const p = PRODUCTS[i]
    console.log(`\n  [${i + 1}/${PRODUCTS.length}] ${p.name}`)

    let imgUrl: string | null = null
    if (SKIP_GEN) {
      // Reusar imagen ya subida en run anterior
      const path = `products/${tenant.id}/kari-${p.slug}.jpg`
      const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
      imgUrl = data.publicUrl
      console.log(`    → Reusando imagen ya subida: ${imgUrl}`)
    } else {
      console.log(`    → Generando mockup via Gemini (${GEMINI_IMAGE_MODEL})...`)
      const img = await geminiGenerateImage(buildProductPrompt(p))
      if (!img) {
        console.warn(`    ⚠ Mockup no generado, skip producto`)
        continue
      }
      imgUrl = await uploadImage(img.base64, img.mimeType, tenant.id, `kari-${p.slug}`)
      if (!imgUrl) {
        console.warn(`    ⚠ Upload mockup fallo, skip`)
        continue
      }
      console.log(`    ✓ Mockup subido: ${imgUrl}`)
    }

    const { error: insErr } = await supabase.from("partner_products").insert({
      tenant_id: tenant.id,
      slug: p.slug,
      name: p.name,
      description: p.description,
      category: p.category,
      price: p.price,
      images: [imgUrl],
      tags: ["kari market", "rose", "emprendimientos", "personalizado"],
      status: "published",
      availability: "available",
      sort_order: i,
    })
    if (insErr) {
      console.warn(`    ⚠ Insert fallo: ${insErr.message}`)
      continue
    }
    created++
    console.log(`    ✓ Producto creado`)
  }

  console.log(`\n=== Resumen ===`)
  console.log(`  Tenant: ${tenant.name} (${tenant.slug})`)
  console.log(`  Productos viejos borrados: ${existingCount}`)
  console.log(`  Productos nuevos creados: ${created}/${PRODUCTS.length}`)
  console.log(`  Storefront: https://www.novamente.ar/p/${tenant.slug}`)
  console.log(`\n✓ Listo`)
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
