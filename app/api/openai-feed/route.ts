import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'
export const revalidate = 3600

/**
 * OpenAI Product Feed — JSONL format
 * Used by OAI-SearchBot / ChatGPT-User to discover and recommend products.
 * Spec: https://platform.openai.com/docs/guides/product-feeds
 */
export async function GET() {
  const baseUrl = 'https://www.novamente.ar'

  // Novamente's own products (always included)
  const coreProducts = [
    {
      title: 'Remera Aldea Classic Fit — Personalizada con IA',
      description:
        'Remera classic fit de algodón 24/1 jersey 190g con estampado DTG premium. Diseñá tu estampa con inteligencia artificial eligiendo entre 37 estilos artísticos. Envíos a todo Argentina.',
      url: `${baseUrl}/products`,
      image_url: `${baseUrl}/products/aldea-frente.png`,
      price: '28600',
      currency: 'ARS',
      brand: 'Novamente',
      category: 'Ropa > Remeras > Remeras Personalizadas',
      availability: 'in_stock',
      condition: 'new',
      country: 'AR',
      language: 'es',
    },
    {
      title: 'Remera Aura Oversize — Personalizada con IA',
      description:
        'Remera oversize de algodón 30/1 jersey 210g con estampado DTG premium. Diseño generado con inteligencia artificial, 37 estilos artísticos disponibles. Envíos a todo Argentina.',
      url: `${baseUrl}/products`,
      image_url: `${baseUrl}/products/aura-frente.png`,
      price: '29900',
      currency: 'ARS',
      brand: 'Novamente',
      category: 'Ropa > Remeras > Remeras Oversize Personalizadas',
      availability: 'in_stock',
      condition: 'new',
      country: 'AR',
      language: 'es',
    },
    {
      title: 'Buzo Hoodie Oversize — Personalizado con IA',
      description:
        'Hoodie de frisa algodón 350g con capucha y bolsillo canguro. Estampado DTG premium con diseño generado por inteligencia artificial. 37 estilos artísticos. Envíos a todo Argentina.',
      url: `${baseUrl}/products`,
      image_url: `${baseUrl}/products/buzo-hoddie-unisex-negro/mockups nuevos productos-12.png`,
      price: '55000',
      currency: 'ARS',
      brand: 'Novamente',
      category: 'Ropa > Buzos y Hoodies > Hoodies Personalizados',
      availability: 'in_stock',
      condition: 'new',
      country: 'AR',
      language: 'es',
    },
    {
      title: 'Tote Bag Nova — Personalizada con IA',
      description:
        'Tote bag de lona 100% algodón 280g con estampado DTG. Diseñá tu bolsa con inteligencia artificial eligiendo entre 37 estilos artísticos. Envíos a todo Argentina.',
      url: `${baseUrl}/products`,
      image_url: `${baseUrl}/products/tote-bag-frente.png`,
      price: '18600',
      currency: 'ARS',
      brand: 'Novamente',
      category: 'Accesorios > Bolsos > Tote Bags Personalizadas',
      availability: 'in_stock',
      condition: 'new',
      country: 'AR',
      language: 'es',
    },
  ]

  // Partner products from DB
  const partnerProducts: typeof coreProducts = []
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: tenants } = await supabase
      .from('tenants')
      .select('id, slug, name, seo_indexable, storefront_published')
      .eq('storefront_published', true)
      .eq('seo_indexable', true)

    if (tenants && tenants.length > 0) {
      for (const tenant of tenants) {
        const { data: products } = await supabase
          .from('tenant_products')
          .select('slug, name, description, price, images, sku')
          .eq('tenant_id', tenant.id)
          .eq('published', true)
          .gt('price', 0)
          .limit(50)

        if (products) {
          for (const p of products) {
            const images = p.images as string[] | null
            const imageUrl = images?.[0] || `${baseUrl}/novamente-logo.png`
            partnerProducts.push({
              title: `${p.name} · ${tenant.name}`,
              description: (p.description || `${p.name} de ${tenant.name}. Disponible en novamente.ar`).slice(0, 500),
              url: `${baseUrl}/p/${tenant.slug}/${p.slug}`,
              image_url: imageUrl,
              price: String(Math.round(p.price)),
              currency: 'ARS',
              brand: tenant.name,
              category: 'Ropa > Merchandising Personalizado',
              availability: 'in_stock',
              condition: 'new',
              country: 'AR',
              language: 'es',
            })
          }
        }
      }
    }
  } catch {
    // Continue with core products only
  }

  const allProducts = [...coreProducts, ...partnerProducts]
  const jsonl = allProducts.map((p) => JSON.stringify(p)).join('\n')

  return new NextResponse(jsonl, {
    headers: {
      'Content-Type': 'application/jsonl',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  })
}
