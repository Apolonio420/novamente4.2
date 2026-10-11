import { NextRequest, NextResponse } from 'next/server'
import { requireTenantPermission } from '@/lib/partners/permissions'
import { getAllProducts, createProduct, countProducts } from '@/lib/partners/catalog'
import { canAddProduct } from '@/lib/partners/plans'
import { validatePartnerProductForCreation, validatePartnerProductPrice } from '@/lib/partners/product-policy'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getAllPublicGarmentPricing } from '@/lib/partners/garment-pricing.server'
import {
  findFirstDisallowedProductImage,
  findFirstDisallowedColorImage,
  PRODUCT_IMAGE_ORIGIN_ERROR,
  MAX_PRODUCT_IMAGES,
} from '@/lib/partners/product-image-origin'
import { garmentRequiresColorChoice, productHasColorInfo } from '@/lib/partners/product-colors'
import { resolveProductCost, validateProductForPublish } from '@/lib/partners/variants'
import { validateFrontAndBackForPublish } from '@/lib/partners/product-sides'
import { onProductPublished } from '@/lib/partners/auto-publish'

function normalizePricingPlan(plan: string | null | undefined): 'starter' | 'growth' | 'pro' {
  const p = (plan || '').toLowerCase()
  if (p === 'pro') return 'pro'
  if (p === 'growth') return 'growth'
  return 'starter'
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireTenantPermission(request, 'catalog:read')
    if (!auth.ok) return auth.response

    const products = await getAllProducts(auth.tenant.id)
    const count = products.length

    // Precios ya derivados por plan (sin `cost` crudo) — usados por la grilla
    // "Costo base de prendas" y por MarginBreakdown en el form de producto.
    const garmentPricing = getAllPublicGarmentPricing(normalizePricingPlan(auth.tenant.plan))

    return NextResponse.json({
      products,
      count,
      plan: auth.tenant.plan,
      maxProducts: auth.tenant.max_products,
      garmentPricing,
    })
  } catch (error) {
    console.error('GET /api/partners/catalog error:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireTenantPermission(request, 'catalog:write')
    if (!auth.ok) return auth.response

    const tenant = auth.tenant
    const currentCount = await countProducts(tenant.id)

    if (!canAddProduct(tenant.plan, currentCount)) {
      return NextResponse.json(
        {
          error: `Limite de productos alcanzado para el plan ${tenant.plan}. Actualiza tu plan para agregar mas.`,
        },
        { status: 403 },
      )
    }

    const body = await request.json()

    if (!body.name || typeof body.name !== 'string' || body.name.trim().length === 0) {
      return NextResponse.json({ error: 'El nombre es obligatorio' }, { status: 400 })
    }

    // Policy: solo prendas del catalogo Novamente — bloquea toallones, ropa de cama,
    // accesorios no textiles y cualquier producto que el partner haya producido aparte.
    const policy = validatePartnerProductForCreation({
      name: body.name,
      description: body.description,
      category: body.category,
    })
    if (!policy.ok) {
      return NextResponse.json({ error: policy.reason }, { status: 422 })
    }

    // Piso "no cargues 40 pensando en miles" (auditoría 22/09) — se aplica
    // ACÁ, al cargar, además del piso de costo real que corre en el checkout
    // (lib/checkout/precio-real.ts).
    const priceCheck = validatePartnerProductPrice(body.price)
    if (!priceCheck.ok) {
      return NextResponse.json({ error: priceCheck.reason }, { status: 400 })
    }

    if (Array.isArray(body.images) && body.images.length > MAX_PRODUCT_IMAGES) {
      return NextResponse.json(
        { error: `Máximo ${MAX_PRODUCT_IMAGES} fotos por producto` },
        { status: 400 },
      )
    }

    // Gate "solo nuestros mockups": todas las imágenes son NUEVAS en un
    // producto recién creado, así que se validan todas (frente/dorso —
    // las extras, índice 2+, no pasan por este gate: ver
    // MOCKUP_REQUIRED_SLOTS en lib/partners/product-image-origin.ts).
    if (Array.isArray(body.images) && body.images.length > 0) {
      const badImage = await findFirstDisallowedProductImage(tenant.id, tenant.slug, body.images)
      if (badImage) {
        return NextResponse.json({ error: PRODUCT_IMAGE_ORIGIN_ERROR }, { status: 400 })
      }
    }

    // Mismo gate para las imágenes por color (metadata.colors[].images.front/back
    // — la tienda pública también las muestra, ver app/p/[slug]/[product]/page.tsx).
    const colorsInput = (body.metadata as Record<string, unknown> | null)?.colors
    if (colorsInput) {
      const badColorImage = await findFirstDisallowedColorImage(tenant.id, tenant.slug, colorsInput)
      if (badColorImage) {
        return NextResponse.json({ error: PRODUCT_IMAGE_ORIGIN_ERROR }, { status: 400 })
      }
    }

    // El panel manda status ('draft' | 'published') — antes este endpoint lo
    // ignoraba por completo y createProduct() siempre caía al default
    // ('draft'), así que crear un producto como "Publicado" quedaba guardado
    // como borrador en silencio (la UI mostraba "Producto creado" igual,
    // sin avisar nada). Un producto puede nacer publicado directo (igual que
    // products/from-design), así que acá hace falta pasar por EL MISMO gate
    // "EN REGLA" que exige el PUT (catalog/[id]/route.ts) antes de publicar:
    // precio > 0 con margen sobre el costo, y frente+dorso (E3). El guard de
    // color de arriba ya corre con la misma condición.
    const status: 'draft' | 'published' = body.status === 'published' ? 'published' : 'draft'

    // Guard espejo del front (app/workspace/catalog/page.tsx handleSave): si la
    // prenda del catálogo tiene colores definidos, no se puede publicar sin
    // elegir ninguno. Prendas sin colores en el catálogo (láminas, lienzos,
    // accesorios) no lo exigen. Cuenta como "tiene color" cualquiera de los 3
    // formatos vigentes (colors[], available_colors legacy, color singular) —
    // ver lib/partners/product-colors.ts.
    if (status === 'published') {
      const garmentKey = typeof (body.metadata as Record<string, unknown> | null)?.garmentKey === 'string'
        ? ((body.metadata as Record<string, unknown>).garmentKey as string)
        : undefined
      if (garmentRequiresColorChoice(garmentKey) && !productHasColorInfo(body.metadata as Record<string, unknown> | null)) {
        return NextResponse.json({ error: 'Elegí al menos un color antes de publicar' }, { status: 422 })
      }

      // Mismo piso que validateProductForPublish en el PUT: precio > 0 y con
      // margen sobre el costo real del plan (lib/partners/variants.ts). Un
      // producto recién creado no tiene variantes todavía, así que no se
      // pasan (el publish gate de variantes se revalida más adelante si el
      // partner las agrega vía PUT).
      const numericPrice = body.price != null ? Number(body.price) : null
      const cost = resolveProductCost(body.metadata as Record<string, unknown> | null, tenant.plan)
      const publishCheck = validateProductForPublish({ price: numericPrice, cost })
      if (!publishCheck.ok) {
        return NextResponse.json({ error: publishCheck.reason }, { status: 422 })
      }

      // E3 — frente y dorso siempre: mismo gate que el PUT y from-design.
      const sidesCheck = validateFrontAndBackForPublish(
        Array.isArray(body.images) ? body.images : [],
        (body.metadata as Record<string, unknown> | null)?.colors,
      )
      if (!sidesCheck.ok) {
        return NextResponse.json({ error: sidesCheck.reason }, { status: 422 })
      }
    }

    const product = await createProduct(tenant.id, {
      name: body.name.trim(),
      description: body.description || undefined,
      category: body.category || undefined,
      price: body.price != null ? Number(body.price) : undefined,
      stock: body.stock === undefined ? undefined : body.stock,
      images: Array.isArray(body.images) ? body.images : undefined,
      tags: Array.isArray(body.tags) ? body.tags : undefined,
      collection: body.collection || undefined,
      metadata: body.metadata || undefined,
      status,
    })

    if (!product) {
      return NextResponse.json({ error: 'No se pudo crear el producto' }, { status: 500 })
    }

    // Igual que products/from-design/route.ts: un producto puede nacer
    // 'published' directo (sin transición draft->published), así que no hay
    // PUT que dispare el auto-publish del storefront (onProductPublished,
    // lib/partners/auto-publish.ts) — lo corremos nosotros mismos. Si nace
    // draft, se mantiene el fire-and-forget de first_product_draft_at de
    // siempre.
    let autoPublished = false
    if (status === 'published') {
      autoPublished = await onProductPublished(tenant)
    } else {
      // Fire-and-forget: set first_product_draft_at once
      ;(supabaseAdmin as any)
        .from('tenants')
        .update({ first_product_draft_at: new Date().toISOString() })
        .eq('id', tenant.id)
        .is('first_product_draft_at', null)
    }

    return NextResponse.json({ product, auto_published: autoPublished }, { status: 201 })
  } catch (error) {
    console.error('POST /api/partners/catalog error:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
