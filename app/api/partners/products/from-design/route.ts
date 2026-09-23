/**
 * POST /api/partners/products/from-design
 *
 * Crea un producto de catálogo a partir de un diseño, con el compositor
 * único (Fase 3 pieza B/E2): SIEMPRE renderiza frente Y dorso por cada
 * color — el lado sin diseño propio se renderiza con la prenda lisa (nunca
 * queda un lado sin foto).
 *
 * Body: {
 *   name, price, garmentKey, colors: string[],
 *   front: { designUrl, size?, placement? } | null,
 *   back:  { designUrl, size?, placement? } | null,
 *   status: 'draft' | 'published',
 *   description?, category?,
 * }
 *
 * Pasa por las mismas validaciones que POST /api/partners/catalog: policy de
 * categoría, piso de precio, gate de origen ("solo nuestros mockups" — las
 * imágenes que sube este endpoint ya matchean el patrón que el gate acepta)
 * y límite de productos del plan. Además, si `status: 'published'`, exige
 * frente + dorso por color (E3).
 */
import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { v4 as uuidv4 } from 'uuid'
import { requireTenantPermission } from '@/lib/partners/permissions'
import { createProduct, countProducts } from '@/lib/partners/catalog'
import { canAddProduct } from '@/lib/partners/plans'
import { validatePartnerProductForCreation, validatePartnerProductPrice } from '@/lib/partners/product-policy'
import { resolveProductCost } from '@/lib/partners/variants'
import { validateFrontAndBackForPublish } from '@/lib/partners/product-sides'
import {
  findFirstDisallowedProductImage,
  findFirstDisallowedColorImage,
  PRODUCT_IMAGE_ORIGIN_ERROR,
} from '@/lib/partners/product-image-origin'
import { getCatalogProduct } from '@/lib/catalog/products'
import { renderProductMockup, type MockupPlacement, type MockupSize } from '@/lib/mockup/compose'
import { uploadFile } from '@/lib/cloudflare-r2'
import { saveDesignAsset } from '@/lib/partners/design-engine'
import { fetchDesignBuffer, resolveRequestOrigin } from '@/lib/partners/design-fetch'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const VALID_SIZES: MockupSize[] = ['chico', 'mediano', 'grande']
const VALID_PLACEMENTS: MockupPlacement[] = ['pecho-izq', 'centro', 'nuca']

interface SideInput {
  designUrl?: string | null
  size?: MockupSize
  placement?: MockupPlacement
}

function normalizeSideInput(raw: unknown): SideInput | null {
  if (!raw || typeof raw !== 'object') return null
  const r = raw as Record<string, unknown>
  return {
    designUrl: typeof r.designUrl === 'string' && r.designUrl ? r.designUrl : null,
    size: VALID_SIZES.includes(r.size as MockupSize) ? (r.size as MockupSize) : 'mediano',
    placement: VALID_PLACEMENTS.includes(r.placement as MockupPlacement) ? (r.placement as MockupPlacement) : undefined,
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
        { error: `Límite de productos alcanzado para el plan ${tenant.plan}. Actualizá tu plan para agregar más.` },
        { status: 403 },
      )
    }

    const body = await request.json().catch(() => null)
    if (!body) return NextResponse.json({ error: 'Body inválido' }, { status: 400 })

    const { name, price, garmentKey, description, category } = body
    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ error: 'El nombre es obligatorio' }, { status: 400 })
    }
    if (!garmentKey || typeof garmentKey !== 'string') {
      return NextResponse.json({ error: 'Se requiere garmentKey' }, { status: 400 })
    }
    const catalogProduct = getCatalogProduct(garmentKey)
    if (!catalogProduct) {
      return NextResponse.json({ error: `Prenda '${garmentKey}' no existe en el catálogo` }, { status: 422 })
    }
    const colors: string[] = Array.isArray(body.colors) ? body.colors.filter((c: unknown) => typeof c === 'string') : []
    if (colors.length === 0) {
      return NextResponse.json({ error: 'Se requiere al menos un color' }, { status: 400 })
    }
    const validColorKeys = new Set(catalogProduct.colors.map((c) => c.key))
    const badColor = colors.find((c) => !validColorKeys.has(c))
    if (badColor) {
      return NextResponse.json({ error: `Color '${badColor}' no disponible para ${garmentKey}` }, { status: 422 })
    }

    const status: 'draft' | 'published' = body.status === 'published' ? 'published' : 'draft'

    const front = normalizeSideInput(body.front)
    const back = normalizeSideInput(body.back)

    // Policy: misma validación que POST /api/partners/catalog.
    const policy = validatePartnerProductForCreation({
      name,
      description: description || '',
      category: category || catalogProduct.category,
    })
    if (!policy.ok) {
      return NextResponse.json({ error: policy.reason }, { status: 422 })
    }

    const priceCheck = validatePartnerProductPrice(price)
    if (!priceCheck.ok) {
      return NextResponse.json({ error: priceCheck.reason }, { status: 400 })
    }
    const numericPrice = Number(price)
    if (!Number.isFinite(numericPrice) || numericPrice <= 0) {
      return NextResponse.json({ error: 'El precio es obligatorio' }, { status: 400 })
    }

    // Costo real del plan para este garmentKey — mismo piso que el resto del
    // catálogo (precio ≥ costo).
    const cost = resolveProductCost({ garmentKey }, tenant.plan)
    if (cost != null && numericPrice <= cost) {
      return NextResponse.json(
        { error: `El precio ($${numericPrice.toLocaleString('es-AR')}) no cubre el costo de producción ($${cost.toLocaleString('es-AR')}). Subí el precio para tener margen.` },
        { status: 400 },
      )
    }

    const origin = resolveRequestOrigin(await headers())
    let frontDesignBuffer: Buffer | null = null
    let backDesignBuffer: Buffer | null = null
    try {
      if (front?.designUrl) frontDesignBuffer = await fetchDesignBuffer(front.designUrl, origin)
      if (back?.designUrl) backDesignBuffer = await fetchDesignBuffer(back.designUrl, origin)
    } catch (e: any) {
      return NextResponse.json({ error: e.message || 'No se pudo leer el diseño' }, { status: 400 })
    }

    // Renderizar y subir frente + dorso por cada color (E2: SIEMPRE los dos
    // lados; el lado sin diseño propio sale con la prenda lisa).
    const colorImages: Record<string, { front: string; back: string }> = {}
    for (const color of colors) {
      let frontBuffer: Buffer
      let backBuffer: Buffer
      try {
        frontBuffer = await renderProductMockup({
          garmentKey, color, side: 'front', designBuffer: frontDesignBuffer,
          size: front?.size ?? 'mediano', placement: front?.placement,
        })
        backBuffer = await renderProductMockup({
          garmentKey, color, side: 'back', designBuffer: backDesignBuffer,
          size: back?.size ?? 'mediano', placement: back?.placement,
        })
      } catch (e: any) {
        return NextResponse.json({ error: e.message || `No se pudo generar el mockup de ${color}` }, { status: 422 })
      }

      const frontKey = `partners/${tenant.slug}/mockups/${uuidv4()}-${color}-front.jpg`
      const backKey = `partners/${tenant.slug}/mockups/${uuidv4()}-${color}-back.jpg`
      const [frontUpload, backUpload] = await Promise.all([
        uploadFile(frontBuffer, frontKey, 'image/jpeg'),
        uploadFile(backBuffer, backKey, 'image/jpeg'),
      ])
      // Registrar cada mockup en partner_assets (type 'mockup', source 'compose'):
      // el gate de origen exige la fila desde el fix de partner_assets (45aec5b),
      // y así el partner también los ve en su selector de mockups.
      await Promise.all([
        saveDesignAsset(tenant.id, frontUpload.url, frontKey, 'mockup', { source: 'compose', garmentKey, color, side: 'front' }),
        saveDesignAsset(tenant.id, backUpload.url, backKey, 'mockup', { source: 'compose', garmentKey, color, side: 'back' }),
      ])
      colorImages[color] = { front: frontUpload.url, back: backUpload.url }
    }

    const firstColor = colors[0]
    const images = [colorImages[firstColor].front, colorImages[firstColor].back]

    // Gate de origen — defensivo: nuestras propias subidas quedaron registradas
    // arriba en partner_assets, así que esto no debería rechazar nada.
    const badImage = await findFirstDisallowedProductImage(tenant.id, tenant.slug, images)
    if (badImage) {
      return NextResponse.json({ error: PRODUCT_IMAGE_ORIGIN_ERROR }, { status: 400 })
    }
    const metadataColors = colors.map((color) => ({ key: color, images: colorImages[color] }))
    const badColorImage = await findFirstDisallowedColorImage(tenant.id, tenant.slug, metadataColors)
    if (badColorImage) {
      return NextResponse.json({ error: PRODUCT_IMAGE_ORIGIN_ERROR }, { status: 400 })
    }

    const metadata: Record<string, unknown> = {
      garmentKey,
      colors: metadataColors,
      // Lo que lee producción para armar la ficha del pedido.
      print: {
        garmentKey,
        front: front?.designUrl ? { designUrl: front.designUrl, size: front.size, placement: front.placement ?? null } : null,
        back: back?.designUrl ? { designUrl: back.designUrl, size: back.size, placement: back.placement ?? null } : null,
      },
      // Versionado para poder re-renderizar (Fase 3 pieza D).
      render: {
        version: 1,
        garmentKey,
        colors,
        front: front?.designUrl ? { designUrl: front.designUrl, size: front.size, placement: front.placement ?? null } : null,
        back: back?.designUrl ? { designUrl: back.designUrl, size: back.size, placement: back.placement ?? null } : null,
      },
    }

    if (status === 'published') {
      const sidesCheck = validateFrontAndBackForPublish(images, metadataColors)
      if (!sidesCheck.ok) {
        return NextResponse.json({ error: sidesCheck.reason }, { status: 400 })
      }
    }

    const product = await createProduct(tenant.id, {
      name: name.trim(),
      description: description || undefined,
      category: category || catalogProduct.category,
      price: numericPrice,
      images,
      metadata,
      status,
    })

    if (!product) {
      return NextResponse.json({ error: 'No se pudo crear el producto' }, { status: 500 })
    }

    ;(supabaseAdmin as any)
      .from('tenants')
      .update({ first_product_draft_at: new Date().toISOString() })
      .eq('id', tenant.id)
      .is('first_product_draft_at', null)

    return NextResponse.json({ product }, { status: 201 })
  } catch (error: any) {
    console.error('POST /api/partners/products/from-design error:', error)
    return NextResponse.json({ error: error.message || 'Error interno' }, { status: 500 })
  }
}
