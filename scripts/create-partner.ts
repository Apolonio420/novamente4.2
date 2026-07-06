/**
 * CREATE PARTNER SCRIPT
 *
 * Creates a complete partner with:
 * 1. Supabase Auth user (email/password)
 * 2. Tenant record (branding, colors, plan, status=active)
 * 3. tenant_users link (owner role)
 * 4. AI-generated banner (cinematic, brand-essence)
 * 5. 3 AI-generated products with front/back mockups + AI texts
 * 6. Published storefront ready to view at /merch/{slug}
 *
 * Usage:
 *   npx tsx scripts/create-partner.ts
 *
 * Then fill in the prompts, or pass JSON via stdin for automation.
 *
 * Environment: reads from .env.local (same as Next.js app)
 */

import { readFileSync, existsSync } from 'fs'
import { resolve, join } from 'path'
import { createClient } from '@supabase/supabase-js'
import { PLAN_FEATURES } from '../lib/partners/plans'

// Load .env.local manually (no dotenv dependency)
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

// ─── Config ─────────────────────────────────────────────
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!
const GEMINI_API_KEY = process.env.GEMINI_API_KEY!
const GEMINI_IMAGE_MODEL = process.env.GEMINI_IMAGE_MODEL || 'gemini-3-pro-image'
const GEMINI_TEXT_MODEL = process.env.GEMINI_TEXT_MODEL || 'gemini-2.0-flash'
const BUCKET = 'partner-assets'

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

// ─── Types ──────────────────────────────────────────────
interface PartnerInput {
  // Required
  name: string
  slug: string
  email: string
  password: string
  plan: 'starter' | 'growth' | 'pro'

  // Recommended (AI fills defaults if missing)
  industry?: string
  tagline?: string
  description?: string
  phone?: string
  website?: string
  instagram?: string

  // Branding (AI picks defaults if missing)
  primaryColor?: string
  secondaryColor?: string
  accentColor?: string
  logoUrl?: string        // URL to existing logo, or skip
  fontPreference?: string

  // Commerce
  commerceMode?: string
  ctaText?: string
  ctaUrl?: string

  // Optional overrides
  visualStyle?: string
  designEngineMode?: string
}

// ─── Gemini Helpers ─────────────────────────────────────

async function geminiGenerateImage(prompt: string): Promise<{ base64: string; mimeType: string } | null> {
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_IMAGE_MODEL}:generateContent?key=${GEMINI_API_KEY}`
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseModalities: ['IMAGE', 'TEXT'] },
      }),
    })
    const data = await res.json()
    for (const cand of data.candidates ?? []) {
      for (const part of cand.content?.parts ?? []) {
        if (part.inlineData?.mimeType?.startsWith('image/') && part.inlineData?.data) {
          return { base64: part.inlineData.data, mimeType: part.inlineData.mimeType }
        }
      }
    }
  } catch (err) {
    console.error('  ✗ Image generation failed:', (err as Error).message)
  }
  return null
}

async function geminiGenerateText(prompt: string): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_TEXT_MODEL}:generateContent?key=${GEMINI_API_KEY}`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
  })
  const data = await res.json()
  return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || ''
}

async function uploadImage(base64: string, mimeType: string, tenantId: string, filename: string): Promise<string | null> {
  const ext = mimeType.includes('png') ? 'png' : 'jpg'
  const path = `products/${tenantId}/${filename}.${ext}`
  const buffer = Buffer.from(base64, 'base64')

  const { error } = await supabase.storage.from(BUCKET).upload(path, buffer, {
    contentType: mimeType,
    upsert: true,
  })
  if (error) {
    console.error('  ✗ Upload failed:', error.message)
    return null
  }
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
  return data.publicUrl
}

// ─── Banner Generation ──────────────────────────────────

function buildBannerPrompt(name: string, industry?: string, tagline?: string, colors?: string[]): string {
  const colorDesc = (colors || []).filter(Boolean).slice(0, 3).join(', ')
  const industryHint = industry
    ? `The brand is in the "${industry}" industry. The image should evoke the spirit, energy, and culture of ${industry}.`
    : 'The brand is a streetwear/merch brand. The image should evoke urban energy and creative culture.'

  return [
    `Create a stunning, cinematic wide banner image (landscape, roughly 1200x400) for "${name}".`,
    industryHint,
    tagline ? `Brand tagline: "${tagline}". Capture this feeling.` : '',
    'Style: dramatic, high-contrast, black and white or desaturated tones, editorial quality.',
    'Think hero banner for a premium merch storefront — atmospheric, evocative, aspirational.',
    colorDesc ? `Brand colors for subtle accent hints: ${colorDesc}.` : '',
    'Abstract or scene-based (landscapes, textures, action shots, atmospheric scenes).',
    'DO NOT include text, logos, watermarks, or human faces.',
    'DO NOT include clothing items or products.',
    'Mood: powerful, cinematic, aligned with brand identity.',
  ].filter(Boolean).join(' ')
}

// ─── Product Generation ─────────────────────────────────

const GARMENTS = [
  { name: 'Remera Oversize', category: 'Remeras', garment: 'black oversize t-shirt', garmentKey: 'tshirt', color: 'black', colorName: 'Negro', colorHex: '#000000', price: 28000, sizes: ['S', 'M', 'L', 'XL', 'XXL'] },
  { name: 'Hoodie Premium', category: 'Buzos', garment: 'caramel/tan oversize hoodie', garmentKey: 'hoodie', color: 'caramel', colorName: 'Caramel', colorHex: '#C19A6B', price: 45000, sizes: ['S', 'M', 'L', 'XL', 'XXL'] },
  { name: 'Remera Classic', category: 'Remeras', garment: 'white classic fit t-shirt', garmentKey: 'tshirt', color: 'white', colorName: 'Blanco', colorHex: '#FFFFFF', price: 22000, sizes: ['S', 'M', 'L', 'XL'] },
] as const

const SIZING: Record<string, string> = {
  S: 'Largo: 70cm | Ancho: 52cm | Manga: 22cm',
  M: 'Largo: 72cm | Ancho: 54cm | Manga: 23cm',
  L: 'Largo: 74cm | Ancho: 56cm | Manga: 24cm',
  XL: 'Largo: 76cm | Ancho: 58cm | Manga: 25cm',
  XXL: 'Largo: 78cm | Ancho: 60cm | Manga: 26cm',
}

function buildProductPrompt(garment: typeof GARMENTS[number], side: 'front' | 'back', brandName: string, industry?: string, tagline?: string, colors?: string[]): string {
  const contrast = garment.color === 'black' || garment.color === 'caramel' ? 'light/white tones' : 'dark/bold tones'
  const colorDesc = (colors || []).filter(Boolean).slice(0, 3).join(', ')
  const sideDesc = side === 'front' ? 'on the chest area, front view' : 'on the back, large back print design, rear view'

  return [
    `Professional product photography of a ${garment.garment} with a custom screen-printed graphic design ${sideDesc}.`,
    `The design is for "${brandName}"${industry ? `, a ${industry} brand` : ''}.`,
    tagline ? `Brand tagline: "${tagline}".` : '',
    colorDesc ? `Design colors: ${colorDesc} with ${contrast} for contrast on ${garment.color} fabric.` : `Design uses ${contrast} for contrast on ${garment.color} fabric.`,
    'Bold, modern streetwear-style illustration or typography.',
    'Style: high-end merch brand lookbook photo, studio lighting, clean dark gradient background.',
    'Flat-lay or invisible mannequin, centered, full garment visible.',
    'DO NOT include human models or faces. DO NOT add watermarks or text overlays.',
    'The printed design should be creative, artistic, and clearly visible.',
  ].filter(Boolean).join(' ')
}

async function generateProductTexts(brandName: string, industry: string | undefined, tagline: string | undefined, garmentName: string, garmentCategory: string) {
  const prompt = `Generá contenido de producto para una marca de merchandising.

Marca: "${brandName}"
Industria: ${industry || 'merch/streetwear'}
Tagline: ${tagline || 'Diseño con identidad'}
Producto: ${garmentName} (${garmentCategory})

Respondé SOLO con JSON válido (sin backticks ni markdown):
{
  "description": "descripción corta del producto, 1-2 oraciones, max 200 chars, en español",
  "detailedDescription": "descripción detallada del producto y la marca, 2-3 oraciones, max 400 chars, en español",
  "features": ["feature 1", "feature 2", "feature 3", "feature 4"],
  "cardDescription": "descripción ultra corta para la card, max 80 chars, en español",
  "brandValues": "slogan corto de la marca para este producto, max 60 chars"
}`

  try {
    const text = await geminiGenerateText(prompt)
    const clean = text.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '')
    return JSON.parse(clean)
  } catch {
    return {
      description: `${garmentName} con diseño exclusivo de ${brandName}. Calidad premium, hecho en Argentina.`,
      detailedDescription: `Producto oficial de ${brandName}. Confeccionado con materiales de primera calidad.`,
      features: [`Diseño exclusivo de ${brandName}`, 'Confección premium argentina', 'Estampa DTG de alta definición', 'Calce moderno y cómodo'],
      cardDescription: `${garmentName} oficial de ${brandName}. Diseño exclusivo.`,
      brandValues: tagline || `${brandName} — Diseño con identidad`,
    }
  }
}

// ─── Lifestyle Mockup Generation ─────────────────────────

const PUBLIC_DIR = resolve(__dirname, '../public')

const LIFESTYLE_BASES: Record<string, string> = {
  'tshirt-black': '/products/tshirt-negra-lifestyle-2.jpeg',
  'tshirt-negro': '/products/tshirt-negra-lifestyle-2.jpeg',
  'tshirt-white': '/products/tshirt-blanca-lifestyle-1.jpeg',
  'tshirt-blanco': '/products/tshirt-blanca-lifestyle-1.jpeg',
  'tshirt-caramel': '/products/tshirt-caramel-lifestyle-1.jpeg',
  'hoodie-black': '/products/hoodie-negro-lifestyle-1.jpeg',
  'hoodie-negro': '/products/hoodie-negro-lifestyle-1.jpeg',
  'hoodie-caramel': '/products/hoodie-caramel-lifestyle-1.jpeg',
  'hoodie-white': '/products/hoodie-crema-lifestyle.png',
  'hoodie-blanco': '/products/hoodie-crema-lifestyle.png',
  'hoodie-crema': '/products/hoodie-crema-lifestyle.png',
}

function getLifestyleBasePath(garmentKey: string, color: string): string {
  const key = `${garmentKey}-${color}`
  return LIFESTYLE_BASES[key] || LIFESTYLE_BASES[`${garmentKey}-black`] || '/products/tshirt-negra-lifestyle-2.jpeg'
}

async function generateLifestyleMockup(
  designImageUrl: string,
  garmentKey: string,
  color: string,
  tenantId: string,
  productSlug: string,
): Promise<string | null> {
  try {
    // 1. Read lifestyle base photo from public/
    const basePath = getLifestyleBasePath(garmentKey, color)
    const fullPath = join(PUBLIC_DIR, basePath)
    if (!existsSync(fullPath)) {
      console.log(`    ⚠ Lifestyle base not found: ${fullPath}`)
      return null
    }
    const lifestyleBuf = readFileSync(fullPath)
    const lifestyleMime = basePath.endsWith('.png') ? 'image/png' : 'image/jpeg'

    // 2. Fetch design image from URL
    const designRes = await fetch(designImageUrl)
    const designBuf = Buffer.from(await designRes.arrayBuffer())
    const designMime = designRes.headers.get('content-type') || 'image/png'

    // 3. Call Gemini with both images to composite
    const garmentName = garmentKey.includes('hoodie') ? 'hoodie' : 't-shirt'
    const prompt = `Take this ${garmentName} design/print (first image) and realistically composite it onto the chest area of the ${garmentName} the person is wearing in the second photo. The design should follow the natural folds and contours of the fabric, with proper perspective, lighting and shadow matching. The result should look like a real photo of someone wearing this printed ${garmentName}. Keep the exact same photo composition, background, and model pose. Only add the print to the ${garmentName}.`

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_IMAGE_MODEL}:generateContent?key=${GEMINI_API_KEY}`
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { inlineData: { mimeType: designMime, data: designBuf.toString('base64') } },
            { inlineData: { mimeType: lifestyleMime, data: lifestyleBuf.toString('base64') } },
            { text: prompt },
          ],
        }],
        generationConfig: { responseModalities: ['IMAGE', 'TEXT'] },
      }),
    })

    const data = await res.json()
    for (const cand of data.candidates ?? []) {
      for (const part of cand.content?.parts ?? []) {
        if (part.inlineData?.mimeType?.startsWith('image/') && part.inlineData?.data) {
          // 4. Upload to Supabase Storage
          const mockupUrl = await uploadImage(
            part.inlineData.data,
            part.inlineData.mimeType,
            tenantId,
            `lifestyle-mockup-${productSlug}`,
          )
          return mockupUrl
        }
      }
    }

    console.log('    ⚠ No image in Gemini lifestyle response')
    return null
  } catch (err) {
    console.error('    ⚠ Lifestyle mockup error:', (err as Error).message)
    return null
  }
}

// ─── Main ───────────────────────────────────────────────

async function createPartner(input: PartnerInput) {
  console.log(`\n🚀 Creando partner: ${input.name} (${input.slug})\n`)

  // 1. Create auth user
  console.log('1/6 Creando usuario auth...')
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: input.email,
    password: input.password,
    email_confirm: true,
    user_metadata: { role: 'partner', partner_name: input.name },
  })
  if (authError) {
    // If user already exists, try to get them
    if (authError.message.includes('already been registered')) {
      console.log('  → Usuario ya existe, buscando...')
      const { data: users } = await supabase.auth.admin.listUsers()
      const existing = users?.users?.find(u => u.email === input.email)
      if (!existing) throw new Error(`User ${input.email} exists but can't find it`)
      console.log(`  ✓ Usuario encontrado: ${existing.id}`)
      var userId = existing.id
    } else {
      throw new Error(`Auth error: ${authError.message}`)
    }
  } else {
    var userId = authData.user.id
    console.log(`  ✓ Usuario creado: ${userId}`)
  }

  // 2. Create tenant
  console.log('2/6 Creando tenant...')
  const slug = input.slug.toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-|-$/g, '')

  const { data: tenant, error: tenantError } = await (supabase as any)
    .from('tenants')
    .insert({
      slug,
      name: input.name,
      email: input.email,
      phone: input.phone || null,
      industry: input.industry || null,
      website: input.website || null,
      instagram: input.instagram || null,
      description: input.description || null,
      tagline: input.tagline || null,
      primary_color: input.primaryColor || '#000000',
      secondary_color: input.secondaryColor || '#1a1a1a',
      accent_color: input.accentColor || '#ffffff',
      font_preference: input.fontPreference || 'inter',
      logo_url: input.logoUrl || null,
      plan: input.plan,
      status: 'active',
      storefront_published: true,
      onboarding_completed: true,
      onboarding_step: 8,
      completeness_score: 80,
      commerce_mode: input.commerceMode || 'whatsapp',
      visual_style: input.visualStyle || 'bold',
      // Piso = modo del plan (nunca 'disabled' de entrada — decision 06/07).
      design_engine_mode: input.designEngineMode || PLAN_FEATURES[input.plan].designEngine,
      cta_text: input.ctaText || 'Contactar',
      cta_url: input.ctaUrl || (input.instagram ? `https://instagram.com/${input.instagram.replace('@', '')}` : null),
      seo_title: `${input.name} — Merch Oficial en Novamente`,
      seo_description: input.description || `Descubrí el merchandising oficial de ${input.name}. Productos exclusivos con diseño premium.`,
      seo_indexable: input.plan !== 'starter',
      max_products: input.plan === 'starter' ? 10 : 999999,
      max_leads_per_month: input.plan === 'starter' ? 20 : 999999,
    })
    .select()
    .single()

  if (tenantError) throw new Error(`Tenant error: ${tenantError.message}`)
  console.log(`  ✓ Tenant creado: ${tenant.id}`)

  // 3. Link user to tenant
  console.log('3/6 Vinculando usuario al tenant...')
  const { error: linkError } = await (supabase as any)
    .from('tenant_users')
    .insert({
      tenant_id: tenant.id,
      user_id: userId,
      role: 'owner',
      accepted_at: new Date().toISOString(),
    })
  if (linkError) console.error('  ⚠ Link error (non-fatal):', linkError.message)
  else console.log('  ✓ Usuario vinculado como owner')

  // 4. Generate banner
  console.log('4/6 Generando banner con IA...')
  const brandColors = [input.primaryColor, input.accentColor, input.secondaryColor].filter(Boolean) as string[]
  const bannerPrompt = buildBannerPrompt(input.name, input.industry, input.tagline, brandColors)
  const bannerResult = await geminiGenerateImage(bannerPrompt)
  let bannerUrl: string | null = null
  if (bannerResult) {
    bannerUrl = await uploadImage(bannerResult.base64, bannerResult.mimeType, tenant.id, 'brand-banner')
    if (bannerUrl) {
      await (supabase as any).from('tenants').update({ banner_url: bannerUrl }).eq('id', tenant.id)
      console.log(`  ✓ Banner generado y subido`)
    }
  } else {
    console.log('  ⚠ Banner no se pudo generar (no bloquea)')
  }

  // 5. Generate 3 products
  console.log('5/6 Generando 3 productos con mockups IA...')
  let productCount = 0
  for (const garment of GARMENTS) {
    const productName = `${garment.name} ${input.name}`
    const productSlug = productName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    process.stdout.write(`  → ${productName}...`)

    try {
      // Generate images + texts in parallel
      const [frontResult, backResult, texts] = await Promise.all([
        geminiGenerateImage(buildProductPrompt(garment, 'front', input.name, input.industry, input.tagline, brandColors)),
        geminiGenerateImage(buildProductPrompt(garment, 'back', input.name, input.industry, input.tagline, brandColors)),
        generateProductTexts(input.name, input.industry, input.tagline, garment.name, garment.category),
      ])

      const frontUrl = frontResult ? await uploadImage(frontResult.base64, frontResult.mimeType, tenant.id, `${productSlug}-${garment.color}-front`) : null
      const backUrl = backResult ? await uploadImage(backResult.base64, backResult.mimeType, tenant.id, `${productSlug}-${garment.color}-back`) : null

      if (!frontUrl) {
        console.log(' ✗ (sin imagen front)')
        continue
      }

      console.log(' ✓ imgs')

      // Generate lifestyle mockup (composite design onto real garment photo)
      process.stdout.write(`    → Lifestyle mockup...`)
      let lifestyleMockupUrl: string | null = null
      try {
        lifestyleMockupUrl = await generateLifestyleMockup(
          frontUrl,
          garment.garmentKey,
          garment.color,
          tenant.id,
          productSlug,
        )
        if (lifestyleMockupUrl) {
          console.log(' ✓')
        } else {
          console.log(' ⚠ (no image)')
        }
      } catch (err) {
        console.log(` ⚠ (${(err as Error).message})`)
      }

      const metadata = {
        colors: [{
          name: garment.colorName,
          value: garment.color,
          hex: garment.colorHex,
          images: { front: frontUrl, back: backUrl || frontUrl },
        }],
        sizes: [...garment.sizes],
        lifestyleImages: lifestyleMockupUrl ? [lifestyleMockupUrl] : [],
        detailedDescription: texts.detailedDescription,
        features: texts.features,
        sizing: Object.fromEntries(garment.sizes.map(s => [s, SIZING[s] || ''])),
        brandValues: texts.brandValues,
        cardDescription: texts.cardDescription,
      }

      const { error: prodError } = await (supabase as any)
        .from('partner_products')
        .insert({
          tenant_id: tenant.id,
          name: productName,
          slug: productSlug,
          description: texts.description,
          category: garment.category,
          price: garment.price,
          images: [frontUrl, backUrl].filter(Boolean),
          tags: [garment.category, input.name],
          metadata,
          status: 'published',
        })

      if (prodError) {
        console.log(` ✗ (${prodError.message})`)
      } else {
        productCount++
        console.log(' ✓')
      }
    } catch (err) {
      console.log(` ✗ (${(err as Error).message})`)
    }
  }

  // 6. Update completeness score
  console.log('6/6 Finalizando...')
  let score = 80
  if (bannerUrl) score += 5
  if (input.logoUrl) score += 10
  if (input.instagram) score += 5
  await (supabase as any).from('tenants').update({ completeness_score: Math.min(score, 100) }).eq('id', tenant.id)

  // ─── Summary ────────────────────────────────────────
  console.log('\n' + '═'.repeat(60))
  console.log(`✅ PARTNER CREADO EXITOSAMENTE`)
  console.log('═'.repeat(60))
  console.log(`  Nombre:      ${input.name}`)
  console.log(`  Slug:        ${slug}`)
  console.log(`  Plan:        ${input.plan}`)
  console.log(`  Email:       ${input.email}`)
  console.log(`  Password:    ${input.password}`)
  console.log(`  Tenant ID:   ${tenant.id}`)
  console.log(`  User ID:     ${userId}`)
  console.log(`  Productos:   ${productCount}/3 generados (con lifestyle mockups)`)
  console.log(`  Banner:      ${bannerUrl ? '✓' : '✗'}`)
  console.log(`  Storefront:  /merch/${slug}`)
  console.log(`  Partner Dir: /p/${slug}`)
  console.log(`  Workspace:   /workspace (login con ${input.email})`)
  console.log('═'.repeat(60) + '\n')

  return { tenantId: tenant.id, userId, slug, bannerUrl, productCount }
}

// ─── CLI Interface ──────────────────────────────────────

async function main() {
  const args = process.argv.slice(2)
  if (args.length > 0) {
    let jsonStr = args.join(' ')

    // If arg is a file path, read the file
    if (jsonStr.endsWith('.json')) {
      try {
        jsonStr = readFileSync(resolve(jsonStr), 'utf-8')
      } catch {
        jsonStr = readFileSync(resolve(__dirname, jsonStr), 'utf-8')
      }
    }

    try {
      const input = JSON.parse(jsonStr) as PartnerInput
      await createPartner(input)
      return
    } catch (e) {
      console.error('Error parsing JSON:', (e as Error).message)
      console.error('Input received:', jsonStr.slice(0, 200))
    }
  }

  // Interactive: read from env or show usage
  console.log(`
╔══════════════════════════════════════════════════════════╗
║           NOVAMENTE — Crear Partner Completo            ║
╠══════════════════════════════════════════════════════════╣
║  Uso: npx tsx scripts/create-partner.ts '<JSON>'        ║
║                                                         ║
║  Ejemplo:                                               ║
║  npx tsx scripts/create-partner.ts '{                    ║
║    "name": "Mi Marca",                                  ║
║    "slug": "mi-marca",                                  ║
║    "email": "marca@email.com",                          ║
║    "password": "Pass1234!",                             ║
║    "plan": "growth",                                    ║
║    "industry": "fitness",                               ║
║    "tagline": "Entrená con estilo",                     ║
║    "description": "Ropa deportiva premium",             ║
║    "instagram": "@mimarca",                             ║
║    "primaryColor": "#FF5500"                            ║
║  }'                                                     ║
║                                                         ║
║  Campos requeridos: name, slug, email, password, plan   ║
║  Todo lo demás es opcional (AI genera defaults)         ║
╚══════════════════════════════════════════════════════════╝
`)
}

main().catch((err) => {
  console.error('\n❌ Error fatal:', err.message)
  process.exit(1)
})
