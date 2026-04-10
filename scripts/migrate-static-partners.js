/**
 * Migrate static partners from src/data/partners.ts → Supabase dynamic tenants
 * Run: node scripts/migrate-static-partners.js
 */
const { createClient } = require('@supabase/supabase-js')

const sb = createClient(
  'https://fvsjvvyohaarivametxq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ2c2p2dnlvaGFhcml2YW1ldHhxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NjAzNzYxMywiZXhwIjoyMDYxNjEzNjEzfQ.22mLhlQhGruvbhA1qvhte-WGWuyuDqu7WO1k9-_PSfs'
)

const BASE = 'https://novamente.ar'

const partners = [
  {
    slug: 'novamente-mundial',
    name: 'Novamente Mundial',
    email: 'mundial@novamente.ar',
    tagline: 'Colección Mundial 2026.',
    description: 'Una cápsula inspirada en la previa del Mundial 2026: diseño urbano, identidad argentina y energía de torneo.',
    industry: 'Merch / Indumentaria',
    logo_url: BASE + '/partners/novamente-mundial/logo.png',
    banner_url: BASE + '/partners/novamente-mundial/banner.png',
    visual_style: 'urbano',
    primary_color: '#000000',
    secondary_color: '#1e1e2e',
    accent_color: '#f59e0b',
    products: [
      { name: 'Buzo Copa — Novamente Mundial', slug: 'buzo-copa-novamente-mundial1', price: 65000, category: 'Hoodies', description: 'Buzo oversize premium inspirado en la Copa y la previa mundialista.', card_description: 'Buzo Copa — oversize, algodón premium, estampa durable.', detailed_description: 'Calce relajado, tela premium y estampa de alta definición.', features: ['Calce oversize (relajado)', 'Algodón premium', 'Estampa durable', 'Producción local'], sizes: ['S','M','L','XL'], colors: [{name:'Negro',hex:'#000000'},{name:'Gris',hex:'#9CA3AF'}], images: [BASE+'/partners/novamente-mundial/products/buzo-copa-novamente-mundial1-negro-front.png', BASE+'/partners/novamente-mundial/products/buzo-copa-novamente-mundial1-negro-back.png'] },
      { name: 'Remera Copa — Novamente Mundial', slug: 'remera-copa-novamente-mundial1', price: 40000, category: 'Remeras', description: 'Remera Copa de la colección Mundial 2026.', card_description: 'Remera Copa — algodón premium, colección Mundial.', detailed_description: 'Remera de algodón 100% con estampado inspirado en la Copa.', features: ['Algodón premium 100%', 'Estampa durable', 'Calce regular cómodo', 'Producción local'], sizes: ['S','M','L','XL'], colors: [{name:'Negro',hex:'#000000'},{name:'Blanco',hex:'#FFFFFF'}], images: [BASE+'/partners/novamente-mundial/products/remera-copa-novamente-mundial1-negro-front.png', BASE+'/partners/novamente-mundial/products/remera-copa-novamente-mundial1-negro-back.png'] },
      { name: 'Remera Sticker — Novamente Mundial', slug: 'remera-sticker-novamente-mundial3', price: 38000, category: 'Remeras', description: 'Remera Sticker de la colección Mundial 2026.', card_description: 'Remera Sticker — gráfica de impacto, colección Mundial.', detailed_description: 'Remera con diseño gráfico sticker pack. Algodón 100%.', features: ['Algodón premium 100%', 'Diseño gráfico sticker pack', 'Estampa durable', 'Producción local'], sizes: ['S','M','L','XL'], colors: [{name:'Negro',hex:'#000000'},{name:'Blanco',hex:'#FFFFFF'}], images: [BASE+'/partners/novamente-mundial/products/remera-sticker-novamente-mundial3-negro-front.png', BASE+'/partners/novamente-mundial/products/remera-sticker-novamente-mundial3-negro-back.png'] },
    ]
  },
  {
    slug: 'falco',
    name: 'Falco',
    email: 'falco@novamente.ar',
    tagline: 'Estilo propio. Sin filtro.',
    description: 'FALCO mezcla streetwear con actitud — minimalismo con carácter. Diseñada en Buenos Aires con foco en calidad, identidad y piezas que se defienden solas.',
    industry: 'Streetwear',
    logo_url: BASE + '/falco/halcon-negro.png',
    banner_url: BASE + '/falco/falco-oversize.png',
    visual_style: 'urbano',
    primary_color: '#000000',
    secondary_color: '#1a1a1a',
    accent_color: '#d4a017',
    products: [
      { name: 'Hoodie "Tres Anclas" Oversized', slug: 'hoodie-tres-anclas', price: 58000, category: 'Hoodies', description: 'Hoodie oversize con el icónico diseño Tres Anclas.', card_description: 'Hoodie oversize premium con diseño Tres Anclas.', detailed_description: 'Tela pesada, capucha doble y estampa HD.', features: ['Calce oversize','Tela pesada premium','Capucha doble','Estampa HD'], sizes: ['S','M','L','XL'], colors: [{name:'Negro',hex:'#000000'},{name:'Crema',hex:'#F5F0E8'},{name:'Caramel',hex:'#8B6914'},{name:'Gris Melange',hex:'#9CA3AF'}], images: [BASE+'/falco/tres-anclas-negro-front.png', BASE+'/falco/tres-anclas-negro-back.png'] },
      { name: 'Remera "Tres Anclas" Oversized', slug: 'remera-oversize-tres-anclas', price: 35000, category: 'Remeras', description: 'Remera oversize Tres Anclas.', card_description: 'Remera oversize Tres Anclas — algodón premium.', detailed_description: 'Algodón premium con estampa Tres Anclas.', features: ['Calce oversize','Algodón premium','Estampa HD'], sizes: ['S','M','L','XL'], colors: [{name:'Caramel',hex:'#8B6914'},{name:'Negro',hex:'#000000'},{name:'Blanco',hex:'#FFFFFF'}], images: [BASE+'/falco/remera-oversize-tres-anclas-caramel-front.png', BASE+'/falco/remera-oversize-tres-anclas-caramel-back.png'] },
      { name: 'Remera "Tres Anclas" Corte Clásico', slug: 'remera-classic-tres-anclas', price: 30000, category: 'Remeras', description: 'Remera clásica con diseño Tres Anclas.', card_description: 'Remera clásica Tres Anclas — calce regular.', detailed_description: 'Algodón corte regular con estampa Tres Anclas.', features: ['Calce regular','Algodón premium','Estampa HD'], sizes: ['S','M','L','XL'], colors: [{name:'Negro',hex:'#000000'},{name:'Blanco',hex:'#FFFFFF'}], images: [BASE+'/falco/remera-classic-tres-anclas-negro-front.png', BASE+'/falco/remera-classic-tres-anclas-negro-back.png'] },
      { name: 'Remera "Emisión" FALCO', slug: 'remera-emision-falco', price: 33000, category: 'Remeras', description: 'Remera Emisión — diseño tipográfico minimalista.', card_description: 'Remera Emisión — diseño tipográfico FALCO.', detailed_description: 'Gráfica tipográfica Emisión.', features: ['Algodón premium','Diseño tipográfico','Estampa HD'], sizes: ['S','M','L','XL'], colors: [{name:'Blanco',hex:'#FFFFFF'},{name:'Negro',hex:'#000000'}], images: [BASE+'/falco/remera-emision-falco-blanco-front.png', BASE+'/falco/remera-emision-falco-blanco-back.png'] },
      { name: 'Remera Classic "FALCO"', slug: 'remera-classic-falco', price: 30000, category: 'Remeras', description: 'Remera clásica con logo FALCO.', card_description: 'Remera Classic FALCO — logo frontal.', detailed_description: 'Corte clásico con logo centrado.', features: ['Calce regular','Algodón premium','Logo frontal'], sizes: ['S','M','L','XL'], colors: [{name:'Blanco',hex:'#FFFFFF'},{name:'Negro',hex:'#000000'}], images: [BASE+'/falco/remera-classic-falco-blanco-front.png', BASE+'/falco/remera-classic-falco-blanco-back.png'] },
      { name: 'Gorra FALCO', slug: 'gorra-falco', price: 22000, category: 'Accesorios', description: 'Gorra con logo FALCO bordado.', card_description: 'Gorra FALCO — logo bordado.', detailed_description: 'Dad cap con logo bordado.', features: ['Logo bordado','Ajuste regulable','Algodón'], sizes: ['Unico'], colors: [{name:'Negro',hex:'#000000'}], images: [BASE+'/falco/gorra-falco-negro-front.png', BASE+'/falco/gorra-falco-negro-back.png'] },
    ]
  },
  {
    slug: 'novamente-originals',
    name: 'Novamente Originals',
    email: 'originals@novamente.ar',
    tagline: 'Lo esencial, elevado.',
    description: 'NOVAMENTE ORIGINALS es la línea esencial de Novamente: piezas clásicas con identidad propia, pensadas para el día a día con un toque de diseño.',
    industry: 'Merch / Indumentaria',
    logo_url: BASE + '/partners/novamente-originals/logo.png',
    banner_url: BASE + '/partners/novamente-originals/banner.png',
    visual_style: 'minimal',
    primary_color: '#000000',
    secondary_color: '#1e1e2e',
    accent_color: '#8b5cf6',
    products: [
      { name: 'Remera Oversize Novamente Originals', slug: 'remera-novamente-originals', price: 35000, category: 'Remeras', description: 'Remera oversize con logo Novamente Originals.', card_description: 'Remera oversize — logo Novamente Originals.', detailed_description: 'Algodón premium, calce oversize, logo bordado.', features: ['Calce oversize','Algodón premium','Logo bordado'], sizes: ['S','M','L','XL'], colors: [{name:'Negro',hex:'#000000'},{name:'Blanco',hex:'#FFFFFF'}], images: [BASE+'/partners/novamente-originals/products/remera-novamente-originals-negro-front.png', BASE+'/partners/novamente-originals/products/remera-novamente-originals-negro-back.png'] },
      { name: 'Buzo Oversize Novamente Originals', slug: 'buzo-novamente-originals', price: 58000, category: 'Hoodies', description: 'Buzo oversize con logo Novamente Originals.', card_description: 'Buzo oversize — logo Novamente Originals.', detailed_description: 'Tela pesada, calce oversize, logo bordado.', features: ['Calce oversize','Tela pesada','Logo bordado'], sizes: ['S','M','L','XL'], colors: [{name:'Negro',hex:'#000000'},{name:'Blanco',hex:'#FFFFFF'}], images: [BASE+'/partners/novamente-originals/products/buzo-novamente-originals-negro-front.png', BASE+'/partners/novamente-originals/products/buzo-novamente-originals-negro-back.png'] },
    ]
  },
  {
    slug: 'mindset',
    name: 'Mindset',
    email: 'mindset@novamente.ar',
    tagline: 'Fe. Mentalidad. Disciplina.',
    description: 'MINDSET es una marca de lifestyle que combina fe, mentalidad y disciplina en cada prenda. Diseños con mensaje, calidad premium y estética urbana con propósito.',
    industry: 'Lifestyle',
    logo_url: BASE + '/partners/mindset/logo.png',
    banner_url: BASE + '/partners/mindset/banner.png',
    visual_style: 'bold',
    primary_color: '#000000',
    secondary_color: '#1a1a2e',
    accent_color: '#e11d48',
    products: [
      { name: 'Remera Oversize Mindset', slug: 'remera-oversize-mindset', price: 35000, category: 'Remeras', description: 'Remera oversize con diseño Mindset.', card_description: 'Remera oversize — diseño Mindset.', detailed_description: 'Algodón premium con estampa Mindset.', features: ['Calce oversize','Algodón premium','Estampa HD'], sizes: ['S','M','L','XL'], colors: [{name:'Negro',hex:'#000000'},{name:'Blanco',hex:'#FFFFFF'}], images: [BASE+'/partners/mindset/products/remera-oversize-mindset-negro-front.png', BASE+'/partners/mindset/products/remera-oversize-mindset-negro-back.png'] },
      { name: 'Buzo Oversize Mindset', slug: 'buzo-oversize-mindset', price: 60000, category: 'Hoodies', description: 'Buzo oversize con diseño Mindset.', card_description: 'Buzo oversize — diseño Mindset.', detailed_description: 'Tela pesada con estampa Mindset.', features: ['Calce oversize','Tela pesada','Estampa HD'], sizes: ['S','M','L','XL'], colors: [{name:'Negro',hex:'#000000'},{name:'Blanco',hex:'#FFFFFF'}], images: [BASE+'/partners/mindset/products/buzo-oversize-mindset-negro-front.png', BASE+'/partners/mindset/products/buzo-oversize-mindset-negro-back.png'] },
    ]
  },
]

async function run() {
  for (const p of partners) {
    // Check if already exists
    const { data: existing } = await sb.from('tenants').select('id').eq('slug', p.slug).single()
    if (existing) {
      console.log('SKIP: ' + p.name + ' already exists (' + existing.id + ')')
      continue
    }

    console.log('\nCreating: ' + p.name + '...')
    const { data: tenant, error: tErr } = await sb.from('tenants').insert({
      name: p.name, slug: p.slug, email: p.email,
      status: 'active', plan: 'starter',
      storefront_published: true, onboarding_completed: true, onboarding_step: 8,
      seo_indexable: true,
      logo_url: p.logo_url, banner_url: p.banner_url,
      tagline: p.tagline, description: p.description,
      industry: p.industry, visual_style: p.visual_style,
      primary_color: p.primary_color, secondary_color: p.secondary_color,
      accent_color: p.accent_color,
    }).select('id').single()

    if (tErr) { console.error('  ERROR:', tErr.message); continue }
    console.log('  Tenant ID: ' + tenant.id)

    for (const prod of p.products) {
      const { error: pErr } = await sb.from('partner_products').insert({
        tenant_id: tenant.id,
        name: prod.name, slug: prod.slug, price: prod.price,
        category: prod.category, description: prod.description,

        detailed_description: prod.detailed_description,
        features: prod.features, sizes: prod.sizes,
        colors: prod.colors, images: prod.images,
        status: 'published', sort_order: 0,
      })
      if (pErr) console.error('  PRODUCT ERROR: ' + prod.name + ' - ' + pErr.message)
      else console.log('  + ' + prod.name)
    }
  }

  // Final summary
  console.log('\n=== Final state ===')
  const { data: all } = await sb.from('tenants').select('name, slug, status, logo_url').order('created_at')
  for (const t of all) {
    const { count } = await sb.from('partner_products').select('*', { count: 'exact', head: true }).eq('tenant_id', t.slug)
    console.log((t.logo_url ? '✓' : '✗') + ' ' + t.name.padEnd(25) + ' ' + t.status.padEnd(12) + (t.logo_url ? 'has logo' : 'NO LOGO'))
  }
}

run().catch(console.error)
