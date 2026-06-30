/**
 * Alta partner Ñancupil Confecciones — tienda con NUESTROS productos/mockups.
 * Crea: auth user (SIN user_metadata → evita trigger bug), tenant, tenant_users,
 * sube logo + 6 mockups, carga 3 partner_products publicados. Pre-flight anti-dup.
 */
import { createClient } from '@supabase/supabase-js'
import sharp from 'sharp'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import crypto from 'crypto'

// ── env (.env.local del 4.2) ──
const envPath = resolve(process.cwd(), '.env.local')
for (const line of readFileSync(envPath, 'utf-8').split('\n')) {
  const t = line.trim(); if (!t || t.startsWith('#')) continue
  const i = t.indexOf('='); if (i === -1) continue
  const k = t.slice(0, i).trim(); let v = t.slice(i + 1).trim()
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1)
  if (!process.env[k]) process.env[k] = v
}
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})
const BUCKET = 'partner-assets'
const CB = '/Users/sambujuan/novamente/dev/chatbot/chatbot-whastapp/playground/2462'

// ── datos del partner ──
const NAME = 'Ñancupil Confecciones'
const SLUG = 'nancupil'
const EMAIL = 'diazmarcelapatricia@yahoo.com.ar'
const CONTACT = 'Marcela Patricia Díaz'
const PHONE = '+5491158252462'
const charset = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789'
const rand = (n) => Array.from(crypto.randomBytes(n)).map(b => charset[b % charset.length]).join('')
const PASSWORD = `Nova-${rand(4)}-${rand(4)}`

// ── productos (NUESTROS mockups) ──
const PRODUCTS = [
  {
    name: 'Boston', slug: 'boston', category: 'Buzos', price: 62000,
    sizes: ['S', 'M', 'L', 'XL', 'XXL'], front: 'out/wa_v3_front.jpg', back: 'out/wa_v2_back.jpg',
    description: 'Buzo hoodie premium negro con el logo de Ñancupil al pecho y "La Danza es el lenguaje oculto del Alma" al dorso.',
    detailed: 'Hoodie unisex de algodón premium 300 g/m². Estampa DTG de alta definición: logo bordado-look al pecho izquierdo y frase de danza al dorso. Confección propia argentina.',
  },
  {
    name: 'Aldea', slug: 'aldea', category: 'Remeras', price: 39000,
    sizes: ['S', 'M', 'L', 'XL', 'XXL'], front: 'out/wa_aldea_front.jpg', back: 'out/wa_aldea_back.jpg',
    description: 'Remera classic fit unisex negra con el logo de Ñancupil al pecho y la frase de danza al dorso.',
    detailed: 'Remera unisex de algodón peinado premium 250 g/m². Logo al pecho izquierdo + "La Danza es el lenguaje oculto del Alma" al dorso. Calce clásico, cómodo.',
  },
  {
    name: 'Buenos Aires', slug: 'buenos-aires', category: 'Remeras', price: 38000,
    sizes: ['S', 'M', 'L', 'XL'], front: 'out/wa_ba_front.jpg', back: 'out/wa_ba_back.jpg',
    description: 'Remera de mujer negra con el logo de Ñancupil al pecho y la frase de danza al dorso.',
    detailed: 'Remera clásica de mujer, algodón peinado 250 g/m². Logo al pecho izquierdo + frase de danza al dorso. Calce femenino.',
  },
]

async function uploadFile(buf, mime, tenantId, filename) {
  const ext = mime.includes('png') ? 'png' : 'jpg'
  const path = `products/${tenantId}/${filename}.${ext}`
  const { error } = await sb.storage.from(BUCKET).upload(path, buf, { contentType: mime, upsert: true })
  if (error) throw new Error(`upload ${filename}: ${error.message}`)
  return sb.storage.from(BUCKET).getPublicUrl(path).data.publicUrl
}

// logo bordó sobre transparente (saca blanco + limpia marca de lápiz tenue)
async function makeStorefrontLogo() {
  const src = `${CB}/WhatsApp Image 2026-06-23 at 12.04.36.jpeg`
  const { data, info } = await sharp(src).removeAlpha().raw().toBuffer({ resolveWithObject: true })
  const px = info.width * info.height
  const out = Buffer.alloc(px * 4)
  for (let i = 0; i < px; i++) {
    const r = data[i * 3], g = data[i * 3 + 1], b = data[i * 3 + 2]
    const mn = Math.min(r, g, b)
    let a
    if (mn >= 150) a = 0
    else if (mn <= 70) a = 255
    else a = Math.round(((150 - mn) / 80) * 255)
    out[i * 4] = r; out[i * 4 + 1] = g; out[i * 4 + 2] = b; out[i * 4 + 3] = a
  }
  return sharp(out, { raw: { width: info.width, height: info.height, channels: 4 } }).trim({ threshold: 8 }).png().toBuffer()
}

async function main() {
  console.log(`\n🚀 Alta partner: ${NAME} (${SLUG})\n`)

  // ── PRE-FLIGHT anti-dup ──
  const { data: dupTenant } = await sb.from('tenants').select('id,slug').eq('slug', SLUG).maybeSingle()
  if (dupTenant) throw new Error(`Ya existe tenant slug '${SLUG}' (id ${dupTenant.id}). Abortado para no duplicar.`)
  const { data: usersList } = await sb.auth.admin.listUsers({ perPage: 1000 })
  const existingUser = usersList?.users?.find(u => u.email?.toLowerCase() === EMAIL.toLowerCase())
  console.log(`Pre-flight: tenant '${SLUG}' libre ✓ | email ${existingUser ? 'YA EXISTE (se reusa)' : 'libre ✓'}`)

  // ── 1. auth user (SIN user_metadata) ──
  let userId
  if (existingUser) {
    userId = existingUser.id
  } else {
    const { data: au, error: ae } = await sb.auth.admin.createUser({ email: EMAIL, password: PASSWORD, email_confirm: true })
    if (ae) throw new Error(`createUser: ${ae.message}`)
    userId = au.user.id
  }
  console.log(`1/5 user ✓ ${userId}`)

  // ── 2. tenant ──
  const logoBuf = await makeStorefrontLogo()
  const { data: tenant, error: te } = await sb.from('tenants').insert({
    slug: SLUG, name: NAME, email: EMAIL, phone: PHONE,
    industry: 'Danzas / Indumentaria', tagline: 'La Danza es el lenguaje oculto del Alma',
    description: 'Indumentaria de danzas con identidad propia. Diseños para Tango, Folklore, Salsa y todos los estilos.',
    primary_color: '#8a1f1f', secondary_color: '#2a0d0d', accent_color: '#f4f0e8', font_preference: 'inter',
    plan: 'starter', status: 'active', storefront_published: true, onboarding_completed: true,
    onboarding_step: 8, completeness_score: 85, commerce_mode: 'whatsapp', visual_style: 'bold',
    design_engine_mode: 'disabled', cta_text: 'Contactar', cta_url: null,
    seo_title: `${NAME} — Merch Oficial en Novamente`,
    seo_description: 'Indumentaria de danzas con identidad propia. Buzos y remeras premium.',
    seo_indexable: false, max_products: 10, max_leads_per_month: 20,
  }).select().single()
  if (te) throw new Error(`tenant: ${te.message}`)
  const tid = tenant.id
  console.log(`2/5 tenant ✓ ${tid}`)

  // logo upload + set
  const logoUrl = await uploadFile(logoBuf, 'image/png', tid, 'brand-logo')
  await sb.from('tenants').update({ logo_url: logoUrl }).eq('id', tid)

  // ── 3. link owner ──
  const { error: le } = await sb.from('tenant_users').insert({
    tenant_id: tid, user_id: userId, role: 'owner', accepted_at: new Date().toISOString(),
  })
  if (le) console.log(`  ⚠ link: ${le.message}`)
  // set metadata DESPUÉS (seguro)
  await sb.auth.admin.updateUserById(userId, { user_metadata: { role: 'partner', partner_name: NAME } })
  console.log('3/5 owner link + metadata ✓')

  // ── 4. productos ──
  console.log('4/5 productos...')
  let n = 0
  for (const p of PRODUCTS) {
    const frontBuf = readFileSync(`${CB}/${p.front}`)
    const backBuf = readFileSync(`${CB}/${p.back}`)
    const frontUrl = await uploadFile(frontBuf, 'image/jpeg', tid, `${p.slug}-negro-front`)
    const backUrl = await uploadFile(backBuf, 'image/jpeg', tid, `${p.slug}-negro-back`)
    const metadata = {
      colors: [{ name: 'Negro', value: 'black', hex: '#000000', images: { front: frontUrl, back: backUrl } }],
      sizes: p.sizes,
      lifestyleImages: [],
      detailedDescription: p.detailed,
      features: ['Logo de Ñancupil al pecho', 'Frase "La Danza es el lenguaje oculto del Alma" al dorso', 'Estampa DTG alta definición', 'Confección premium argentina'],
      sizing: {},
      brandValues: 'La Danza es el lenguaje oculto del Alma',
      cardDescription: `${p.name} de Ñancupil — diseño de danzas.`,
    }
    const { error: pe } = await sb.from('partner_products').insert({
      tenant_id: tid, name: p.name, slug: p.slug, description: p.description,
      category: p.category, price: p.price, images: [frontUrl, backUrl],
      tags: [p.category, NAME], metadata, status: 'published',
    })
    if (pe) { console.log(`  ✗ ${p.name}: ${pe.message}`); continue }
    n++; console.log(`  ✓ ${p.name} ($${p.price})`)
  }

  // ── 5. verificación ──
  const { data: vt } = await sb.from('tenants').select('slug,status,storefront_published,plan,logo_url').eq('id', tid).single()
  const { data: vp } = await sb.from('partner_products').select('name,price,status').eq('tenant_id', tid)
  const { data: vu } = await sb.from('tenant_users').select('role,accepted_at').eq('tenant_id', tid).eq('user_id', userId).single()

  console.log('\n' + '═'.repeat(56))
  console.log('✅ TIENDA CREADA')
  console.log('═'.repeat(56))
  console.log(`  Nombre:     ${NAME}`)
  console.log(`  Slug:       ${SLUG}  →  www.novamente.ar/p/${SLUG}`)
  console.log(`  Contacto:   ${CONTACT}`)
  console.log(`  EMAIL:      ${EMAIL}`)
  console.log(`  PASSWORD:   ${PASSWORD}`)
  console.log(`  Login:      www.novamente.ar/partners/login`)
  console.log(`  Tenant ID:  ${tid}`)
  console.log(`  User ID:    ${userId}`)
  console.log(`  Verif tenant: published=${vt?.storefront_published} status=${vt?.status} plan=${vt?.plan} logo=${vt?.logo_url ? '✓' : '✗'}`)
  console.log(`  Verif owner:  role=${vu?.role} accepted=${vu?.accepted_at ? '✓' : '✗'}`)
  console.log(`  Productos (${n}/3 publicados):`)
  for (const x of (vp || [])) console.log(`     - ${x.name} $${x.price} [${x.status}]`)
  console.log('═'.repeat(56) + '\n')
}
main().catch(e => { console.error('\n❌', e.message); process.exit(1) })
