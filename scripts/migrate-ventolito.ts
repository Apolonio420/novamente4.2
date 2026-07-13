/**
 * MIGRATE VENTOLITO — Static → DB Partner
 *
 * Uploads all existing images from /public/partners/ventolito-wind-surf/
 * to Supabase Storage and creates the tenant + products with exact same data.
 *
 * Usage: npx tsx scripts/migrate-ventolito.ts
 */

import { readFileSync, readdirSync } from 'fs'
import { resolve, extname } from 'path'
import { createClient } from '@supabase/supabase-js'

// Load .env.local
const envPath = resolve(__dirname, '../.env.local')
const envContent = readFileSync(envPath, 'utf-8')
for (const line of envContent.split('\n')) {
  const trimmed = line.trim()
  if (!trimmed || trimmed.startsWith('#')) continue
  const eqIdx = trimmed.indexOf('=')
  if (eqIdx === -1) continue
  const key = trimmed.slice(0, eqIdx).trim()
  let val = trimmed.slice(eqIdx + 1).trim()
  if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) val = val.slice(1, -1)
  if (!process.env[key]) process.env[key] = val
}

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const BUCKET = 'partner-assets'
const ASSETS_DIR = resolve(__dirname, '../public/partners/ventolito-wind-surf')

async function uploadFile(localPath: string, storagePath: string): Promise<string | null> {
  const buffer = readFileSync(localPath)
  const ext = extname(localPath).toLowerCase()
  const mime = ext === '.png' ? 'image/png' : ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' : 'image/webp'

  const { error } = await supabase.storage.from(BUCKET).upload(storagePath, buffer, {
    contentType: mime,
    upsert: true,
  })
  if (error) {
    console.error(`  ✗ Upload failed for ${storagePath}:`, error.message)
    return null
  }
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(storagePath)
  return data.publicUrl
}

async function main() {
  console.log('\n🏄 Migrando Ventolito Wind & Surf → DB Partner\n')

  // 1. Create auth user
  console.log('1/5 Creando usuario auth...')
  let userId: string
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: 'ventolito@novamente.ar',
    password: 'Ventolito2026!',
    email_confirm: true,
    user_metadata: { role: 'partner', partner_name: 'Ventolito' },
  })
  if (authError) {
    if (authError.message.includes('already been registered')) {
      const { data: users } = await supabase.auth.admin.listUsers()
      const existing = users?.users?.find(u => u.email === 'ventolito@novamente.ar')
      if (!existing) throw new Error('User exists but not found')
      userId = existing.id
      console.log(`  → Ya existe: ${userId}`)
    } else throw new Error(authError.message)
  } else {
    userId = authData.user.id
    console.log(`  ✓ Creado: ${userId}`)
  }

  // 2. Create tenant
  console.log('2/5 Creando tenant...')
  const { data: tenant, error: tenantError } = await (supabase as any)
    .from('tenants')
    .insert({
      slug: 'ventolito-wind-surf',
      name: 'Ventolito',
      email: 'ventolito@novamente.ar',
      industry: 'windsurf y deportes acuáticos',
      tagline: 'El mar no calma, forma carácter.',
      description: 'Ventolito Wind & Surf nace de la conexión real entre el mar, el viento y quienes encuentran en el agua una forma de libertad. Inspirada en la intensidad del windsurf y en la mística de los días bravos, la marca transforma esa energía en diseños con carácter, movimiento y profundidad visual.',
      about_text: 'Ventolito representa coraje, identidad, aventura y respeto por la naturaleza. Su universo mezcla fuerza, sensibilidad y resistencia, con una estética monocromática, dramática y auténtica que habla de quienes no buscan comodidad, sino verdad en el recorrido.',
      primary_color: '#1a1a1a',
      secondary_color: '#333333',
      accent_color: '#707070',
      font_preference: 'inter',
      plan: 'pro',
      status: 'active',
      storefront_published: true,
      onboarding_completed: true,
      onboarding_step: 8,
      completeness_score: 95,
      commerce_mode: 'whatsapp',
      visual_style: 'editorial',
      design_engine_mode: 'full_brand_fit',
      cta_text: 'Contactar',
      seo_title: 'Ventolito Wind & Surf — Merch Oficial en Novamente',
      seo_description: 'Descubrí el merch de Ventolito. Remeras oversize con diseños épicos inspirados en windsurf, mar y carácter. Calidad premium, estampa DTG.',
      seo_indexable: true,
      max_products: 999999,
      max_leads_per_month: 999999,
    })
    .select()
    .single()

  if (tenantError) throw new Error(`Tenant: ${tenantError.message}`)
  console.log(`  ✓ Tenant: ${tenant.id}`)

  // Link user
  await (supabase as any).from('tenant_users').insert({
    tenant_id: tenant.id, user_id: userId, role: 'owner', accepted_at: new Date().toISOString(),
  })
  console.log('  ✓ Usuario vinculado')

  // 3. Upload branding images
  console.log('3/5 Subiendo imágenes de branding...')
  const logoUrl = await uploadFile(resolve(ASSETS_DIR, 'logo.png'), `products/${tenant.id}/logo.png`)
  const bannerUrl = await uploadFile(resolve(ASSETS_DIR, 'banner.png'), `products/${tenant.id}/banner.png`)
  const cardUrl = await uploadFile(resolve(ASSETS_DIR, 'card.png'), `products/${tenant.id}/card.png`)

  console.log(`  Logo: ${logoUrl ? '✓' : '✗'}`)
  console.log(`  Banner: ${bannerUrl ? '✓' : '✗'}`)
  console.log(`  Card: ${cardUrl ? '✓' : '✗'}`)

  // Update tenant with URLs
  await (supabase as any).from('tenants').update({
    logo_url: logoUrl,
    banner_url: bannerUrl,
    hero_url: cardUrl,
  }).eq('id', tenant.id)

  // 4. Upload product images and create products
  console.log('4/5 Creando productos con imágenes reales...')

  const products = [
    {
      id: 'larespuestaestenelviento',
      name: "Remera Oversize 'La respuesta está en el viento'",
      price: 40000,
      colorHex: '#707070',
      description: 'Diseño inspirado en la conexión entre el mar, el viento y la búsqueda personal. "La respuesta está en el viento" combina una estética oscura, intensa y épica con el universo auténtico del windsurf.',
      detailedDescription: 'Esta prenda representa el espíritu de quienes no buscan caminos fáciles, sino experiencias reales. La composición visual transmite fuerza, movimiento y libertad, con una gráfica de alto impacto en blanco y negro que remite al océano bravo, al carácter y a la conexión con la naturaleza. Ideal para quienes viven el mar como una forma de identidad y no solo como un paisaje.',
      features: ['Estampa frontal de alto impacto', 'Arte monocromático inspirado en mar y viento', 'Base negra lavada con estética vintage', 'Calce relajado / look streetwear', 'Identidad visual surf, windsurf y outdoor', 'Diseño exclusivo de Ventolito Wind & Surf'],
      brandValues: 'Mar, viento y carácter.',
      cardDescription: 'Una remera para quienes encuentran libertad, dirección y verdad en el viento.',
      images: {
        front: 'larespuestaestenelviento-stone-wash-front.png',
        back: 'larespuestaestenelviento-stone-wash-back.png',
      },
      lifestyle: ['larespuestaestenelviento-lifestyle-1.png', 'larespuestaestenelviento-medidas.png'],
    },
    {
      id: 'dejgironesdemivida',
      name: "Remera Oversize 'Dejé girones de mi vida aquí'",
      price: 40000,
      colorHex: '#737373',
      description: '"Yo sé, dejé girones de mi vida aquí" es una pieza cargada de emoción, memoria y entrega. Su diseño mezcla simbología marina, dramatismo visual y una frase con mucho peso emocional.',
      detailedDescription: 'Esta prenda habla de vínculo, experiencia y pertenencia. No se trata solo de surf o viento, sino de todo lo que uno deja en el proceso: tiempo, energía, aprendizaje y momentos inolvidables. La gráfica transmite esa sensación de lucha, profundidad y amor por el mar, con una composición visual potente, oscura y cargada de identidad. Es una remera para quienes sienten que el agua también guarda parte de su historia.',
      features: ['Estampa frontal con frase protagonista', 'Composición artística inspirada en mar, viento y travesía', 'Gráfica en blanco y negro de alto contraste', 'Base negra lavada con look desgastado', 'Estilo visual poético, intenso y auténtico', 'Diseño exclusivo de Ventolito Wind & Surf'],
      brandValues: 'Estampa intensa y poética que habla de entrega, identidad y conexión con el agua.',
      cardDescription: 'Una remera intensa y poética para quienes dejaron parte de su historia en el mar.',
      images: {
        front: 'dejgironesdemivida-stone-wash-front.png',
        back: 'dejgironesdemivida-stone-wash-back.png',
      },
      lifestyle: ['dejgironesdemivida-lifestyle-1.png', 'medidas.png'],
    },
    {
      id: 'ningnmarencalma',
      name: "Remera Oversize 'Ningún mar en calma'",
      price: 40000,
      colorHex: '#666666',
      description: 'Inspirada en una de las frases más representativas del espíritu aventurero, esta prenda une fuerza visual y mensaje en una pieza que habla de experiencia, resistencia y evolución.',
      detailedDescription: '"Ningún mar en calma hizo experto a un marinero" resume la esencia de Ventolito: crecer en el movimiento, aprender en la dificultad y construir identidad en medio del viento. La estampa combina una escena marina cargada de energía con lettering protagónico, logrando una pieza visualmente poderosa y con mucho mensaje. Es ideal para quienes entienden que el carácter no se forma en la comodidad, sino en el recorrido.',
      features: ['Estampa frontal con lettering central', 'Diseño inspirado en resiliencia, mar y aventura', 'Arte monocromático de estética épica', 'Base negra lavada con identidad vintage', 'Calce relajado / look urbano outdoor', 'Diseño exclusivo de Ventolito Wind & Surf'],
      brandValues: 'Gráfica poderosa sobre resiliencia y formación del carácter.',
      cardDescription: 'Una remera sobre resiliencia, carácter y aprendizaje en medio de la tormenta.',
      images: {
        front: 'ningnmarencalma-stone-wash-front.png',
        back: 'ningnmarencalma-stone-wash-back.png',
      },
      lifestyle: ['ningnmarencalma-lifestyle-1.png', 'ningnmarencalma-lifestyle-2.png', 'ningnmarencalma-medidas.png'],
    },
  ]

  const sizes = ['2XS', 'XS', 'S', 'M', 'L', 'XL', '2XL']

  for (const prod of products) {
    process.stdout.write(`  → ${prod.name}...`)

    // Upload front/back
    const frontUrl = await uploadFile(
      resolve(ASSETS_DIR, 'products', prod.images.front),
      `products/${tenant.id}/${prod.id}-front.png`,
    )
    const backUrl = await uploadFile(
      resolve(ASSETS_DIR, 'products', prod.images.back),
      `products/${tenant.id}/${prod.id}-back.png`,
    )

    // Upload lifestyle images
    const lifestyleUrls: string[] = []
    for (const lf of prod.lifestyle) {
      const url = await uploadFile(
        resolve(ASSETS_DIR, 'products', lf),
        `products/${tenant.id}/${prod.id}-${lf}`,
      )
      if (url) lifestyleUrls.push(url)
    }

    if (!frontUrl) {
      console.log(' ✗ (no front image)')
      continue
    }

    const metadata = {
      colors: [{
        name: '',
        value: 'stone-wash',
        hex: prod.colorHex,
        images: { front: frontUrl, back: backUrl || frontUrl },
      }],
      sizes,
      lifestyleImages: lifestyleUrls,
      detailedDescription: prod.detailedDescription,
      features: prod.features,
      sizing: {},
      brandValues: prod.brandValues,
      cardDescription: prod.cardDescription,
    }

    const { error } = await (supabase as any)
      .from('partner_products')
      .insert({
        tenant_id: tenant.id,
        name: prod.name,
        slug: prod.id,
        description: prod.description,
        category: 'Remera Oversize',
        price: prod.price,
        images: [frontUrl, backUrl].filter(Boolean),
        tags: ['Remera Oversize', 'Ventolito', 'windsurf'],
        metadata,
        status: 'published',
      })

    if (error) console.log(` ✗ (${error.message})`)
    else console.log(' ✓')
  }

  // 5. Summary
  console.log('\n5/5 Finalizando...\n')
  console.log('═'.repeat(60))
  console.log('✅ VENTOLITO MIGRADO A DB')
  console.log('═'.repeat(60))
  console.log(`  Tenant ID:   ${tenant.id}`)
  console.log(`  User ID:     ${userId}`)
  console.log(`  Email:       ventolito@novamente.ar`)
  console.log(`  Password:    Ventolito2026!`)
  console.log(`  Plan:        pro`)
  console.log(`  Storefront:  /p/ventolito-wind-surf`)
  console.log(`  Workspace:   /workspace (login con ventolito@novamente.ar)`)
  console.log('═'.repeat(60))
  console.log('\n⚠️  IMPORTANTE: El storefront ahora resuelve DB primero.')
  console.log('   Si querés mantener el estático también, renombrá el slug.\n')
}

main().catch(err => {
  console.error('\n❌ Error:', err.message)
  process.exit(1)
})
