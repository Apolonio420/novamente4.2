/**
 * Create SM · Superación en Movimiento Partner
 * Custom script: usa los assets pre-generados en novamente-platform en lugar de auto-generar.
 */
import { readFileSync } from 'fs'
import { resolve, join } from 'path'
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

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!
const BUCKET = 'partner-assets'
const ASSETS = resolve(__dirname, '../../novamente-platform/scripts/out/maxy/partner')
const LOGO_PATH = resolve(__dirname, '../../novamente-platform/scripts/out/maxy/logo.png')

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

// ─── Input ───────────────────────────────────────────
const INPUT = {
  name: 'SM · Superación en Movimiento',
  slug: 'superacion',
  email: 'Max_jonathanflores@hotmail.com',
  password: 'h5q2DWgUDoSM26!',
  phone: '+5493454109008',
  industry: 'deporte',
  tagline: 'Superación en movimiento.',
  description: 'Indumentaria deportiva para entrenamiento y club de fútbol. Cero stock, cero inversión inicial.',
  primaryColor: '#0d0d0d',
  secondaryColor: '#bb8a3a',
  accentColor: '#ffffff',
  fontPreference: 'IBM Plex Sans',
}

const PRODUCTS = [
  {
    name: 'Camiseta SM Training · Aura Oversize Negra',
    slug: 'camiseta-sm-training-aura-oversize-negra',
    description: 'Remera oversize negra con SM al pecho y SUPERACIÓN EN MOVIMIENTO en la espalda. Algodón heavyweight, ideal para entrenamiento y uso diario.',
    detailedDescription: 'Remera oversize de algodón heavyweight 240gsm, color negro, con estampa DTG full color. SM monogram al pecho izquierdo y wordmark SUPERACIÓN EN MOVIMIENTO en la espalda. Producida on-demand desde Buenos Aires.',
    category: 'remera',
    price: 25400,
    front: 'mock-aura-front.png',
    back: 'mock-aura-back.png',
    lifestyle: 'lifestyle-aura.png',
    color: { name: 'Negra', value: 'negro', hex: '#1A1A1A' },
    sizes: ['2XS', 'XS', 'S', 'M', 'L', 'XL', '2XL'],
    cardDescription: 'Aura oversize · SM al pecho + SUPERACIÓN espalda',
    features: ['Algodón heavyweight 240gsm', 'Calce oversize unisex', 'Estampa DTG full color', 'Producción on-demand desde Buenos Aires'],
  },
  {
    name: 'Buzo Hoodie SM · Boston Negro',
    slug: 'buzo-hoodie-sm-boston-negro',
    description: 'Hoodie oversize negro con SM al pecho y SUPERACIÓN EN MOVIMIENTO en la espalda. Algodón frizado premium para invierno y entrenamientos al aire libre.',
    detailedDescription: 'Buzo hoodie oversize de algodón frizado premium 380gsm, color negro, con estampa DTG. SM monogram al pecho izquierdo y wordmark SUPERACIÓN EN MOVIMIENTO en la espalda. Capucha con cordones planos, costuras reforzadas.',
    category: 'hoodie',
    price: 38700,
    front: 'mock-boston-front.png',
    back: 'mock-boston-back.png',
    lifestyle: 'lifestyle-boston.png',
    color: { name: 'Negro', value: 'negro', hex: '#1A1A1A' },
    sizes: ['XS', 'S', 'M', 'L', 'XL', '2XL'],
    cardDescription: 'Boston hoodie · SM al pecho + SUPERACIÓN espalda',
    features: ['Algodón frizado premium 380gsm', 'Calce oversize unisex', 'Capucha con cordones planos', 'Estampa DTG full color', 'Producción on-demand desde Buenos Aires'],
  },
  {
    name: 'Buzo Crewneck SM · Berlin Negro',
    slug: 'buzo-crewneck-sm-berlin-negro',
    description: 'Buzo cuello redondo negro con SM al pecho. Algodón frizado premium, calce oversize, ideal para training.',
    detailedDescription: 'Buzo cuello redondo (crewneck) de algodón frizado premium 380gsm, color negro, con SM monogram al pecho izquierdo en estampa DTG. Calce oversize unisex.',
    category: 'crewneck',
    price: 32200,
    front: 'mock-berlin-front.png',
    back: null,
    lifestyle: 'lifestyle-berlin.png',
    color: { name: 'Negro', value: 'negro', hex: '#1A1A1A' },
    sizes: ['XS', 'S', 'M', 'L', 'XL', '2XL'],
    cardDescription: 'Berlin crewneck · SM al pecho',
    features: ['Algodón frizado premium 380gsm', 'Cuello redondo · calce oversize unisex', 'Estampa DTG full color', 'Producción on-demand desde Buenos Aires'],
  },
  {
    name: 'Remera SM · Aldea Classic Negra',
    slug: 'remera-sm-aldea-classic-negra',
    description: 'Remera clásica negra con SM al pecho. Algodón premium, calce regular, base perfecta para uso diario y entrenamiento.',
    detailedDescription: 'Remera clásica de algodón 100% premium 180-200gsm, color negro, con SM monogram al pecho izquierdo en DTG. Corte regular unisex.',
    category: 'remera',
    price: 25700,
    front: 'mock-aldea-front.png',
    back: null,
    lifestyle: 'lifestyle-aldea.png',
    color: { name: 'Negra', value: 'negro', hex: '#1A1A1A' },
    sizes: ['S', 'M', 'L', 'XL', '2XL'],
    cardDescription: 'Aldea Classic · SM al pecho',
    features: ['Algodón premium 100% 180-200gsm', 'Calce regular unisex', 'Estampa DTG full color', 'Producción on-demand desde Buenos Aires'],
  },
  {
    name: 'Musculosa SM Training · Bali Negra',
    slug: 'musculosa-sm-training-bali-negra',
    description: 'Musculosa de morley premium con SM al pecho. Ideal para gym, training y verano.',
    detailedDescription: 'Musculosa de morley premium con caída suave, color negro, con SM monogram al pecho izquierdo en DTG. Calce regular unisex.',
    category: 'musculosa',
    price: 17400,
    front: 'mock-bali-front.png',
    back: null,
    lifestyle: 'lifestyle-bali.png',
    color: { name: 'Negra', value: 'negro', hex: '#1A1A1A' },
    sizes: ['S', 'M', 'L', 'XL', '2XL'],
    cardDescription: 'Bali Musculosa · SM al pecho',
    features: ['Morley premium', 'Calce regular unisex', 'Estampa DTG full color', 'Producción on-demand desde Buenos Aires'],
  },
]

const SIZING: Record<string, string> = {
  '2XS': 'Largo 67cm · ancho 53cm',
  'XS': 'Largo 69cm · ancho 55cm',
  'S': 'Largo 71cm · ancho 57cm',
  'M': 'Largo 73cm · ancho 59cm',
  'L': 'Largo 75cm · ancho 61cm',
  'XL': 'Largo 77cm · ancho 63cm',
  '2XL': 'Largo 79cm · ancho 65cm',
}

async function uploadFile(localPath: string, tenantId: string, filename: string): Promise<string | null> {
  const buf = readFileSync(localPath)
  const ext = localPath.split('.').pop()?.toLowerCase() || 'png'
  const mime = ext === 'png' ? 'image/png' : ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : 'application/octet-stream'
  const path = `${tenantId}/${filename}.${ext}`
  const { error } = await (supabase.storage as any).from(BUCKET).upload(path, buf, { contentType: mime, upsert: true })
  if (error) {
    console.error('  ✗ upload', filename, error.message)
    return null
  }
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
  return data.publicUrl
}

async function main() {
  console.log('═══ SM Partner Creation ═══\n')

  // 1. Auth user
  console.log('1/5 Auth user...')
  const { data: existingUser } = await supabase.auth.admin.listUsers()
  let userId: string | undefined = existingUser?.users?.find(u => u.email?.toLowerCase() === INPUT.email.toLowerCase())?.id
  if (userId) {
    console.log('  ⚠ user already exists, updating password')
    await supabase.auth.admin.updateUserById(userId, { password: INPUT.password })
  } else {
    const { data: newUser, error } = await supabase.auth.admin.createUser({
      email: INPUT.email, password: INPUT.password, email_confirm: true,
    })
    if (error || !newUser.user) throw new Error('Auth: ' + (error?.message || 'no user'))
    userId = newUser.user.id
    console.log(`  ✓ user: ${userId.slice(0, 8)}...`)
  }

  // 2. Tenant
  console.log('2/5 Tenant...')
  const { data: existingT } = await (supabase as any).from('tenants').select('id').eq('slug', INPUT.slug).maybeSingle()
  let tenantId: string
  if (existingT) {
    console.log('  ⚠ tenant exists, reusing:', existingT.id.slice(0, 8))
    tenantId = existingT.id
  } else {
    const { data: t, error } = await (supabase as any).from('tenants').insert({
      slug: INPUT.slug,
      name: INPUT.name,
      email: INPUT.email,
      phone: INPUT.phone,
      country: 'AR',
      currency: 'ARS',
      industry: INPUT.industry,
      description: INPUT.description,
      tagline: INPUT.tagline,
      primary_color: INPUT.primaryColor,
      secondary_color: INPUT.secondaryColor,
      accent_color: INPUT.accentColor,
      font_preference: INPUT.fontPreference,
      cta_text: 'Comprar',
      plan: 'starter',
      status: 'active',
      storefront_published: true,
      design_engine_mode: 'mockups_only',
      commerce_mode: 'checkout',
      visual_style: 'sport',
      max_products: 50,
      max_leads_per_month: 200,
      seo_indexable: true,
      seo_title: `${INPUT.name} · Indumentaria deportiva`,
      seo_description: INPUT.description,
    }).select().single()
    if (error) throw new Error('Tenant: ' + error.message)
    tenantId = t.id
    console.log(`  ✓ tenant: ${tenantId.slice(0, 8)}...`)
  }

  // 3. Tenant user link
  console.log('3/5 Link user→tenant...')
  const { data: existingLink } = await (supabase as any).from('tenant_users').select('id').eq('tenant_id', tenantId).eq('user_id', userId).maybeSingle()
  if (existingLink) {
    console.log('  ⚠ link exists')
  } else {
    const { error } = await (supabase as any).from('tenant_users').insert({
      tenant_id: tenantId, user_id: userId, role: 'owner', accepted_at: new Date().toISOString(),
    })
    if (error) console.error('  ⚠ link error:', error.message)
    else console.log('  ✓ linked')
  }

  // 4. Upload assets + update tenant
  console.log('4/5 Upload assets...')
  const logoUrl = await uploadFile(LOGO_PATH, tenantId, 'logo')
  const bannerUrl = await uploadFile(join(ASSETS, 'banner.png'), tenantId, 'banner')
  const heroUrl = await uploadFile(join(ASSETS, 'hero-lifestyle.png'), tenantId, 'hero')
  await (supabase as any).from('tenants').update({
    logo_url: logoUrl,
    banner_url: bannerUrl,
    hero_url: heroUrl,
  }).eq('id', tenantId)
  console.log(`  ✓ logo · banner · hero subidos`)

  // 5. Products
  console.log('5/5 Products...')
  for (const p of PRODUCTS) {
    process.stdout.write(`  → ${p.name}...`)
    try {
      const frontUrl = await uploadFile(join(ASSETS, p.front), tenantId, `${p.slug}-front`)
      const backUrl = p.back ? await uploadFile(join(ASSETS, p.back), tenantId, `${p.slug}-back`) : null
      const lifeUrl = (p as any).lifestyle ? await uploadFile(join(ASSETS, (p as any).lifestyle), tenantId, `${p.slug}-lifestyle`) : null
      if (!frontUrl) { console.log(' ✗ no front'); continue }

      const metadata = {
        colors: [{
          name: p.color.name, value: p.color.value, hex: p.color.hex,
          images: { front: frontUrl, back: backUrl || frontUrl },
        }],
        sizes: p.sizes,
        lifestyleImages: lifeUrl ? [lifeUrl] : (heroUrl ? [heroUrl] : []),
        detailedDescription: p.detailedDescription,
        features: p.features,
        sizing: Object.fromEntries(p.sizes.map(s => [s, SIZING[s] || ''])),
        brandValues: INPUT.tagline,
        cardDescription: p.cardDescription,
      }

      const images = [frontUrl, backUrl].filter(Boolean) as string[]

      // Check if exists
      const { data: ex } = await (supabase as any).from('partner_products').select('id').eq('tenant_id', tenantId).eq('slug', p.slug).maybeSingle()
      if (ex) {
        const { error } = await (supabase as any).from('partner_products').update({
          name: p.name, description: p.description, category: p.category, price: p.price,
          images, tags: [p.category, INPUT.name], metadata, status: 'published',
        }).eq('id', ex.id)
        console.log(error ? ` ✗ ${error.message}` : ' ✓ updated')
      } else {
        const { error } = await (supabase as any).from('partner_products').insert({
          tenant_id: tenantId, name: p.name, slug: p.slug, description: p.description,
          category: p.category, price: p.price, images, tags: [p.category, INPUT.name],
          metadata, status: 'published',
        })
        console.log(error ? ` ✗ ${error.message}` : ' ✓ created')
      }
    } catch (e) {
      console.log(` ✗ ${(e as Error).message}`)
    }
  }

  console.log('\n' + '═'.repeat(60))
  console.log('✅ PARTNER CREADO')
  console.log(`Tenant ID: ${tenantId}`)
  console.log(`Slug: ${INPUT.slug}`)
  console.log(`URL: https://novamente.ar/merch/${INPUT.slug}`)
  console.log(`Login: https://novamente.ar/partners/login`)
  console.log(`Email: ${INPUT.email}`)
  console.log(`Password: ${INPUT.password}`)
  console.log('═'.repeat(60))
}

main().catch(e => { console.error('❌', e.message); process.exit(1) })
