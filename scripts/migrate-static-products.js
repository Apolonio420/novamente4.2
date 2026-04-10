/**
 * Insert products for already-created static partner tenants.
 * Uses only columns that exist in partner_products table.
 * Extra data (features, sizes, colors, detailed_description) goes into metadata.
 */
const { createClient } = require('@supabase/supabase-js')

const sb = createClient(
  'https://fvsjvvyohaarivametxq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ2c2p2dnlvaGFhcml2YW1ldHhxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NjAzNzYxMywiZXhwIjoyMDYxNjEzNjEzfQ.22mLhlQhGruvbhA1qvhte-WGWuyuDqu7WO1k9-_PSfs'
)

const BASE = 'https://novamente.ar'

const partnerProducts = {
  'novamente-mundial': [
    { name: 'Buzo Copa — Novamente Mundial', slug: 'buzo-copa-novamente-mundial1', price: 65000, category: 'Hoodies', description: 'Buzo oversize premium inspirado en la Copa y la previa mundialista. Calce relajado, tela premium y estampa de alta definición.', images: [BASE+'/partners/novamente-mundial/products/buzo-copa-novamente-mundial1-negro-front.png', BASE+'/partners/novamente-mundial/products/buzo-copa-novamente-mundial1-negro-back.png'], metadata: { sizes: ['S','M','L','XL'], colors: [{name:'Negro',hex:'#000000'},{name:'Gris',hex:'#9CA3AF'}], features: ['Calce oversize','Algodón premium','Estampa durable','Producción local'], card_description: 'Buzo Copa — oversize, algodón premium, estampa durable.' } },
    { name: 'Remera Copa — Novamente Mundial', slug: 'remera-copa-novamente-mundial1', price: 40000, category: 'Remeras', description: 'Remera Copa de la colección Mundial 2026. Algodón 100% con estampado inspirado en la Copa. Calce regular.', images: [BASE+'/partners/novamente-mundial/products/remera-copa-novamente-mundial1-negro-front.png', BASE+'/partners/novamente-mundial/products/remera-copa-novamente-mundial1-negro-back.png'], metadata: { sizes: ['S','M','L','XL'], colors: [{name:'Negro',hex:'#000000'},{name:'Blanco',hex:'#FFFFFF'}], features: ['Algodón premium 100%','Estampa durable','Calce regular cómodo','Producción local'], card_description: 'Remera Copa — algodón premium, colección Mundial.' } },
    { name: 'Remera Sticker — Novamente Mundial', slug: 'remera-sticker-novamente-mundial3', price: 38000, category: 'Remeras', description: 'Remera Sticker de la colección Mundial 2026. Diseño gráfico sticker pack. Algodón 100%, estampado de alta definición.', images: [BASE+'/partners/novamente-mundial/products/remera-sticker-novamente-mundial3-negro-front.png', BASE+'/partners/novamente-mundial/products/remera-sticker-novamente-mundial3-negro-back.png'], metadata: { sizes: ['S','M','L','XL'], colors: [{name:'Negro',hex:'#000000'},{name:'Blanco',hex:'#FFFFFF'}], features: ['Algodón premium 100%','Diseño gráfico sticker pack','Estampa durable','Producción local'], card_description: 'Remera Sticker — gráfica de impacto, colección Mundial.' } },
  ],
  'falco': [
    { name: 'Hoodie "Tres Anclas" Oversized', slug: 'hoodie-tres-anclas', price: 58000, category: 'Hoodies', description: 'Hoodie oversize con el icónico diseño Tres Anclas. Tela pesada, capucha doble y estampa HD.', images: [BASE+'/falco/tres-anclas-negro-front.png', BASE+'/falco/tres-anclas-negro-back.png'], metadata: { sizes: ['S','M','L','XL'], colors: [{name:'Negro',hex:'#000000'},{name:'Crema',hex:'#F5F0E8'},{name:'Caramel',hex:'#8B6914'},{name:'Gris Melange',hex:'#9CA3AF'}], features: ['Calce oversize','Tela pesada premium','Capucha doble','Estampa HD'] } },
    { name: 'Remera "Tres Anclas" Oversized', slug: 'remera-oversize-tres-anclas', price: 35000, category: 'Remeras', description: 'Remera oversize Tres Anclas. Algodón premium con estampa HD.', images: [BASE+'/falco/remera-oversize-tres-anclas-caramel-front.png', BASE+'/falco/remera-oversize-tres-anclas-caramel-back.png'], metadata: { sizes: ['S','M','L','XL'], colors: [{name:'Caramel',hex:'#8B6914'},{name:'Negro',hex:'#000000'},{name:'Blanco',hex:'#FFFFFF'}], features: ['Calce oversize','Algodón premium','Estampa HD'] } },
    { name: 'Remera "Tres Anclas" Corte Clásico', slug: 'remera-classic-tres-anclas', price: 30000, category: 'Remeras', description: 'Remera corte clásico con diseño Tres Anclas. Algodón premium, calce regular.', images: [BASE+'/falco/remera-classic-tres-anclas-negro-front.png', BASE+'/falco/remera-classic-tres-anclas-negro-back.png'], metadata: { sizes: ['S','M','L','XL'], colors: [{name:'Negro',hex:'#000000'},{name:'Blanco',hex:'#FFFFFF'}], features: ['Calce regular','Algodón premium','Estampa HD'] } },
    { name: 'Remera "Emisión" FALCO', slug: 'remera-emision-falco', price: 33000, category: 'Remeras', description: 'Remera Emisión de FALCO. Diseño tipográfico minimalista.', images: [BASE+'/falco/remera-emision-falco-blanco-front.png', BASE+'/falco/remera-emision-falco-blanco-back.png'], metadata: { sizes: ['S','M','L','XL'], colors: [{name:'Blanco',hex:'#FFFFFF'},{name:'Negro',hex:'#000000'}], features: ['Algodón premium','Diseño tipográfico','Estampa HD'] } },
    { name: 'Remera Classic "FALCO"', slug: 'remera-classic-falco', price: 30000, category: 'Remeras', description: 'Remera clásica con logo FALCO centrado. Algodón premium, calce regular.', images: [BASE+'/falco/remera-classic-falco-blanco-front.png', BASE+'/falco/remera-classic-falco-blanco-back.png'], metadata: { sizes: ['S','M','L','XL'], colors: [{name:'Blanco',hex:'#FFFFFF'},{name:'Negro',hex:'#000000'}], features: ['Calce regular','Algodón premium','Logo frontal'] } },
    { name: 'Gorra FALCO', slug: 'gorra-falco', price: 22000, category: 'Accesorios', description: 'Gorra dad cap con logo FALCO bordado. Ajuste regulable.', images: [BASE+'/falco/gorra-falco-negro-front.png', BASE+'/falco/gorra-falco-negro-back.png'], metadata: { sizes: ['Unico'], colors: [{name:'Negro',hex:'#000000'}], features: ['Logo bordado','Ajuste regulable','Algodón'] } },
  ],
  'novamente-originals': [
    { name: 'Remera Oversize Novamente Originals', slug: 'remera-novamente-originals', price: 35000, category: 'Remeras', description: 'Remera oversize con logo Novamente Originals. Algodón premium, logo bordado.', images: [BASE+'/partners/novamente-originals/products/remera-novamente-originals-negro-front.png', BASE+'/partners/novamente-originals/products/remera-novamente-originals-negro-back.png'], metadata: { sizes: ['S','M','L','XL'], colors: [{name:'Negro',hex:'#000000'},{name:'Blanco',hex:'#FFFFFF'}], features: ['Calce oversize','Algodón premium','Logo bordado'] } },
    { name: 'Buzo Oversize Novamente Originals', slug: 'buzo-novamente-originals', price: 58000, category: 'Hoodies', description: 'Buzo oversize con logo Novamente Originals. Tela pesada, logo bordado.', images: [BASE+'/partners/novamente-originals/products/buzo-novamente-originals-negro-front.png', BASE+'/partners/novamente-originals/products/buzo-novamente-originals-negro-back.png'], metadata: { sizes: ['S','M','L','XL'], colors: [{name:'Negro',hex:'#000000'},{name:'Blanco',hex:'#FFFFFF'}], features: ['Calce oversize','Tela pesada','Logo bordado'] } },
  ],
  'mindset': [
    { name: 'Remera Oversize Mindset', slug: 'remera-oversize-mindset', price: 35000, category: 'Remeras', description: 'Remera oversize con diseño Mindset. Algodón premium con estampa HD.', images: [BASE+'/partners/mindset/products/remera-oversize-mindset-negro-front.png', BASE+'/partners/mindset/products/remera-oversize-mindset-negro-back.png'], metadata: { sizes: ['S','M','L','XL'], colors: [{name:'Negro',hex:'#000000'},{name:'Blanco',hex:'#FFFFFF'}], features: ['Calce oversize','Algodón premium','Estampa HD'] } },
    { name: 'Buzo Oversize Mindset', slug: 'buzo-oversize-mindset', price: 60000, category: 'Hoodies', description: 'Buzo oversize con diseño Mindset. Tela pesada con estampa HD.', images: [BASE+'/partners/mindset/products/buzo-oversize-mindset-negro-front.png', BASE+'/partners/mindset/products/buzo-oversize-mindset-negro-back.png'], metadata: { sizes: ['S','M','L','XL'], colors: [{name:'Negro',hex:'#000000'},{name:'Blanco',hex:'#FFFFFF'}], features: ['Calce oversize','Tela pesada','Estampa HD'] } },
  ],
}

async function run() {
  for (const [slug, products] of Object.entries(partnerProducts)) {
    const { data: tenant } = await sb.from('tenants').select('id').eq('slug', slug).single()
    if (!tenant) { console.error('Tenant not found: ' + slug); continue }

    // Check if products already exist
    const { count } = await sb.from('partner_products').select('*', { count: 'exact', head: true }).eq('tenant_id', tenant.id)
    if (count > 0) { console.log('SKIP: ' + slug + ' already has ' + count + ' products'); continue }

    console.log('\nInserting products for: ' + slug + ' (' + tenant.id + ')')
    for (const prod of products) {
      const { error } = await sb.from('partner_products').insert({
        tenant_id: tenant.id,
        name: prod.name,
        slug: prod.slug,
        price: prod.price,
        category: prod.category,
        description: prod.description,
        images: prod.images,
        metadata: prod.metadata,
        status: 'published',
        sort_order: 0,
        tags: [],
      })
      if (error) console.error('  ERROR: ' + prod.name + ' - ' + error.message)
      else console.log('  + ' + prod.name + ' ($' + prod.price + ')')
    }
  }

  // Final summary
  console.log('\n=== FINAL SUMMARY ===')
  const { data: tenants } = await sb.from('tenants').select('id, name, slug, logo_url, status').order('name')
  for (const t of tenants) {
    const { count } = await sb.from('partner_products').select('*', { count: 'exact', head: true }).eq('tenant_id', t.id).eq('status', 'published')
    console.log((t.logo_url ? '✓' : '✗') + ' ' + t.name.padEnd(25) + ' ' + String(count || 0).padStart(2) + ' products  ' + t.status)
  }
}

run().catch(console.error)
