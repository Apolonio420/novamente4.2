/**
 * Fix product images in Supabase to use correct paths from static files.
 * Maps product slugs → real image paths from the public/ directory.
 */
const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

const sb = createClient(
  'https://fvsjvvyohaarivametxq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ2c2p2dnlvaGFhcml2YW1ldHhxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NjAzNzYxMywiZXhwIjoyMDYxNjEzNjEzfQ.22mLhlQhGruvbhA1qvhte-WGWuyuDqu7WO1k9-_PSfs'
)

const PUBLIC = path.join(__dirname, '..', 'public')

// Map: product slug → { images, colors with images, lifestyle }
const productFixes = {
  // === FALCO ===
  'hoodie-tres-anclas': {
    images: ['/falco/products/hoodie-tres-anclas-negro-front.png', '/falco/products/hoodie-tres-anclas-negro-back.png'],
    colors: [
      { name: 'Negro', hex: '#000000', images: { front: '/falco/products/hoodie-tres-anclas-negro-front.png', back: '/falco/products/hoodie-tres-anclas-negro-back.png' } },
      { name: 'Crema', hex: '#F5F0E8', images: { front: '/falco/products/hoodie-tres-anclas-crema-front.png', back: '/falco/products/hoodie-tres-anclas-crema-back.png' } },
      { name: 'Caramel', hex: '#8B6914', images: { front: '/falco/products/hoodie-tres-anclas-caramel-front.png', back: '/falco/products/hoodie-tres-anclas-caramel-back.png' } },
      { name: 'Gris Melange', hex: '#9CA3AF', images: { front: '/falco/products/hoodie-tres-anclas-gris-front.png', back: '/falco/products/hoodie-tres-anclas-gris-back.png' } },
    ],
    lifestyle: ['/falco/products/hoodie-tres-anclas-lifestyle-milei.jpeg', '/falco/products/hoodie-tres-anclas-medidas.png'],
  },
  'remera-oversize-tres-anclas': {
    images: ['/falco/products/remera-tres-anclas-caramel-front.png', '/falco/products/remera-tres-anclas-caramel-back.png'],
    colors: [
      { name: 'Caramel', hex: '#8B6914', images: { front: '/falco/products/remera-tres-anclas-caramel-front.png', back: '/falco/products/remera-tres-anclas-caramel-back.png' } },
      { name: 'Negro', hex: '#000000', images: { front: '/falco/products/remera-tres-anclas-negro-front.png', back: '/falco/products/remera-tres-anclas-negro-back.png' } },
      { name: 'Blanco', hex: '#FFFFFF', images: { front: '/falco/products/remera-tres-anclas-blanco-front.png', back: '/falco/products/remera-tres-anclas-blanco-back.png' } },
    ],
    lifestyle: ['/falco/products/remera-tres-anclas-medidas.png'],
  },
  'remera-classic-tres-anclas': {
    images: ['/falco/products/remera-classic-tres-anclas-negro-front.png', '/falco/products/remera-classic-tres-anclas-negro-back.png'],
    colors: [
      { name: 'Negro', hex: '#000000', images: { front: '/falco/products/remera-classic-tres-anclas-negro-front.png', back: '/falco/products/remera-classic-tres-anclas-negro-back.png' } },
      { name: 'Blanco', hex: '#FFFFFF', images: { front: '/falco/products/remera-classic-tres-anclas-blanco-front.png', back: '/falco/products/remera-classic-tres-anclas-blanco-back.png' } },
    ],
    lifestyle: ['/falco/products/remera-classic-tres-anclas-medidas.png'],
  },
  'remera-emision-falco': {
    images: ['/falco/products/remera-emision-blanco-front.png', '/falco/products/remera-emision-negro-front.png'],
    colors: [
      { name: 'Blanco', hex: '#FFFFFF', images: { front: '/falco/products/remera-emision-blanco-front.png', back: '/falco/products/remera-emision-blanco-front.png' } },
      { name: 'Negro', hex: '#000000', images: { front: '/falco/products/remera-emision-negro-front.png', back: '/falco/products/remera-emision-negro-front.png' } },
    ],
    lifestyle: ['/falco/products/remera-emision-falco-lifestyle.png'],
  },
  'remera-classic-falco': {
    images: ['/falco/products/remera-falco-blanco-front.png', '/falco/products/remera-falco-negro-front.png'],
    colors: [
      { name: 'Blanco', hex: '#FFFFFF', images: { front: '/falco/products/remera-falco-blanco-front.png', back: '/falco/products/remera-falco-blanco-front.png' } },
      { name: 'Negro', hex: '#000000', images: { front: '/falco/products/remera-falco-negro-front.png', back: '/falco/products/remera-falco-negro-front.png' } },
    ],
    lifestyle: ['/falco/products/remera-falco-lifestyle-blanco-1.png', '/falco/products/remera-falco-lifestyle-negro.png'],
  },
  'gorra-falco': {
    images: ['/falco/products/gorra-falco-frontal.png', '/falco/products/gorra-falco-lateral.png'],
    colors: [
      { name: 'Negro', hex: '#000000', images: { front: '/falco/products/gorra-falco-frontal.png', back: '/falco/products/gorra-falco-lateral.png' } },
    ],
  },

  // === NOVAMENTE MUNDIAL ===
  'buzo-copa-novamente-mundial1': {
    images: ['/partners/novamente-mundial/products/buzo-copa-novamente-mundial1-negro-front.png', '/partners/novamente-mundial/products/buzo-copa-novamente-mundial1-negro-back.png'],
    colors: [
      { name: 'Negro', hex: '#000000', images: { front: '/partners/novamente-mundial/products/buzo-copa-novamente-mundial1-negro-front.png', back: '/partners/novamente-mundial/products/buzo-copa-novamente-mundial1-negro-back.png' } },
      { name: 'Gris', hex: '#9CA3AF', images: { front: '/partners/novamente-mundial/products/buzo-copa-novamente-mundial1-gris-front.png', back: '/partners/novamente-mundial/products/buzo-copa-novamente-mundial1-gris-back.png' } },
    ],
    lifestyle: ['/partners/novamente-mundial/products/buzo-copa-novamente-mundial1-lifestyle.png', '/partners/novamente-mundial/products/buzo-copa-novamente-mundial1-talles.png'],
  },
  'remera-copa-novamente-mundial1': {
    images: ['/partners/novamente-mundial/products/remera-copa-novamente-mundial1-negro-front.png', '/partners/novamente-mundial/products/remera-copa-novamente-mundial1-negro-back.png'],
    colors: [
      { name: 'Negro', hex: '#000000', images: { front: '/partners/novamente-mundial/products/remera-copa-novamente-mundial1-negro-front.png', back: '/partners/novamente-mundial/products/remera-copa-novamente-mundial1-negro-back.png' } },
      { name: 'Blanco', hex: '#FFFFFF', images: { front: '/partners/novamente-mundial/products/remera-copa-novamente-mundial1-blanco-front.png', back: '/partners/novamente-mundial/products/remera-copa-novamente-mundial1-blanco-back.png' } },
    ],
    lifestyle: ['/partners/novamente-mundial/products/remera-copa-novamente-mundial1-lifestyle.png', '/partners/novamente-mundial/products/remera-copa-novamente-mundial1-talles.png'],
  },
  'remera-sticker-novamente-mundial3': {
    images: ['/partners/novamente-mundial/products/remera-sticker-novamente-mundial3-negro-front.png', '/partners/novamente-mundial/products/remera-sticker-novamente-mundial3-negro-back.png'],
    colors: [
      { name: 'Negro', hex: '#000000', images: { front: '/partners/novamente-mundial/products/remera-sticker-novamente-mundial3-negro-front.png', back: '/partners/novamente-mundial/products/remera-sticker-novamente-mundial3-negro-back.png' } },
      { name: 'Blanco', hex: '#FFFFFF', images: { front: '/partners/novamente-mundial/products/remera-sticker-novamente-mundial3-blanco-front.png', back: '/partners/novamente-mundial/products/remera-sticker-novamente-mundial3-blanco-back.png' } },
    ],
    lifestyle: ['/partners/novamente-mundial/products/remera-sticker-novamente-mundial3-lifestyle.png', '/partners/novamente-mundial/products/remera-sticker-novamente-mundial3-talles.png'],
  },

  // === NOVAMENTE ORIGINALS ===
  'remera-novamente-originals': {
    images: ['/partners/novamente-originals/products/remera-novamente-originals-negro-front.png', '/partners/novamente-originals/products/remera-novamente-originals-negro-back.png'],
    colors: [
      { name: 'Negro', hex: '#000000', images: { front: '/partners/novamente-originals/products/remera-novamente-originals-negro-front.png', back: '/partners/novamente-originals/products/remera-novamente-originals-negro-back.png' } },
      { name: 'Blanco', hex: '#FFFFFF', images: { front: '/partners/novamente-originals/products/remera-novamente-originals-blanco-front.png', back: '/partners/novamente-originals/products/remera-novamente-originals-blanco-back.png' } },
    ],
    lifestyle: ['/partners/novamente-originals/products/remera-novamente-originals-talles.png', '/partners/novamente-originals/products/remera-novamente-originals-lifestyle-flor.jpg'],
  },
  'buzo-novamente-originals': {
    images: ['/partners/novamente-originals/products/buzo-novamente-originals-negro-front.png', '/partners/novamente-originals/products/buzo-novamente-originals-negro-back.png'],
    colors: [
      { name: 'Negro', hex: '#000000', images: { front: '/partners/novamente-originals/products/buzo-novamente-originals-negro-front.png', back: '/partners/novamente-originals/products/buzo-novamente-originals-negro-back.png' } },
      { name: 'Gris', hex: '#9CA3AF', images: { front: '/partners/novamente-originals/products/buzo-novamente-originals-gris-front.png', back: '/partners/novamente-originals/products/buzo-novamente-originals-gris-back.png' } },
    ],
    lifestyle: ['/partners/novamente-originals/products/buzo-novamente-originals-talles.png', '/partners/novamente-originals/products/buzo-novamente-originals-lifestyle-1.png'],
  },

  // === MINDSET ===
  'remera-oversize-mindset': {
    images: ['/partners/mindset/products/remera-oversize-fe-mindset-front-black.png', '/partners/mindset/products/remera-oversize-fe-mindset-back-black.png'],
    colors: [
      { name: 'Negro', hex: '#000000', images: { front: '/partners/mindset/products/remera-oversize-fe-mindset-front-black.png', back: '/partners/mindset/products/remera-oversize-fe-mindset-back-black.png' } },
      { name: 'Blanco', hex: '#FFFFFF', images: { front: '/partners/mindset/products/remera-oversize-fe-mindset-front-white.png', back: '/partners/mindset/products/remera-oversize-fe-mindset-back-white.png' } },
    ],
    lifestyle: ['/partners/mindset/products/remera-oversize-fe-mindset-lifestyle.png', '/partners/mindset/products/remera-oversize-fe-mindset-talles.png'],
  },
  'buzo-oversize-mindset': {
    images: ['/partners/mindset/products/buzo-pan-front-crema.png', '/partners/mindset/products/buzo-pan-back-crema.png'],
    colors: [
      { name: 'Crema', hex: '#F5F0E8', images: { front: '/partners/mindset/products/buzo-pan-front-crema.png', back: '/partners/mindset/products/buzo-pan-back-crema.png' } },
    ],
    lifestyle: ['/partners/mindset/products/buzo-pan-lifestyle.png', '/partners/mindset/products/buzo-pan-talles.png'],
  },
}

async function run() {
  let fixed = 0, errors = 0

  for (const [slug, fix] of Object.entries(productFixes)) {
    // Verify files exist locally
    for (const img of fix.images) {
      const fullPath = path.join(PUBLIC, img)
      if (!fs.existsSync(fullPath)) {
        console.error('MISSING FILE: ' + img)
        errors++
      }
    }

    const { data: prod, error: findErr } = await sb.from('partner_products').select('id, metadata').eq('slug', slug).single()
    if (findErr || !prod) { console.error('Product not found: ' + slug); errors++; continue }

    const metadata = prod.metadata || {}
    metadata.colors = fix.colors
    if (fix.lifestyle) metadata.lifestyleImages = fix.lifestyle

    const { error: updateErr } = await sb.from('partner_products')
      .update({ images: fix.images, metadata })
      .eq('id', prod.id)

    if (updateErr) { console.error('Update error for ' + slug + ':', updateErr.message); errors++; continue }
    console.log('OK: ' + slug + ' (' + fix.images.length + ' imgs, ' + fix.colors.length + ' colors)')
    fixed++
  }

  console.log('\nDone: ' + fixed + ' fixed, ' + errors + ' errors')
}

run().catch(console.error)
