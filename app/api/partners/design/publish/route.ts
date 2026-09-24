import { NextRequest, NextResponse } from 'next/server'
import { requireTenantPermission } from '@/lib/partners/permissions'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { uploadFile } from '@/lib/cloudflare-r2'
import { toBanner16x9 } from '@/lib/partners/banner-image'
import { isOwnMockupUrl, PRODUCT_IMAGE_ORIGIN_ERROR, MAX_PRODUCT_IMAGES } from '@/lib/partners/product-image-origin'

const db = () => supabaseAdmin as any

// Studio publica imágenes 1024×1024 (cuadradas) al slot hero/banner, pero el
// hero de /p/[slug] es 16:9 con object-cover — sin esto, una imagen cuadrada
// se recorta a los costados sin control (Fase 2 tiendas partner). Best-effort:
// si el fetch/proceso falla, se publica la imagen original tal cual (nunca
// rompe la publicación por esto).
async function normalizeBannerAsset(assetUrl: string, tenantId: string): Promise<string> {
  try {
    const res = await fetch(assetUrl)
    if (!res.ok) return assetUrl
    const buffer = Buffer.from(await res.arrayBuffer())
    const processed = await toBanner16x9(buffer)
    const key = `partners/${tenantId}/banner-16x9-${Date.now()}.png`
    const { url } = await uploadFile(processed, key, 'image/png')
    return url
  } catch (err) {
    console.error('[studio publish] error normalizando banner a 16:9:', err)
    return assetUrl
  }
}

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const auth = await requireTenantPermission(request, 'designs:write')
    if (!auth.ok) return auth.response
    const tenant = auth.tenant
    const body = await request.json()
    const { assetUrl, slot, productId, side } = body as {
      assetUrl?: string
      slot?: string
      productId?: string
      /**
       * Cara del producto que este mockup representa (galería, regla
       * frente=[0]/dorso=[1]/extras=[2+] — ver
       * lib/partners/product-image-origin.ts). Opcional: sin `side` se
       * mantiene el comportamiento legacy de agregar al final.
       */
      side?: 'front' | 'back'
    }

    if (!assetUrl || !slot) {
      return NextResponse.json({ error: 'assetUrl y slot son obligatorios' }, { status: 400 })
    }

    if (slot === 'hero') {
      const finalUrl = await normalizeBannerAsset(assetUrl, tenant.id)
      const { error } = await db()
        .from('tenants')
        .update({ hero_url: finalUrl, updated_at: new Date().toISOString() })
        .eq('id', tenant.id)

      if (error) {
        return NextResponse.json({ error: 'Error actualizando hero' }, { status: 500 })
      }
      return NextResponse.json({ ok: true, slot, assetUrl: finalUrl })
    } else if (slot === 'banner') {
      const finalUrl = await normalizeBannerAsset(assetUrl, tenant.id)
      const { error } = await db()
        .from('tenants')
        .update({ banner_url: finalUrl, updated_at: new Date().toISOString() })
        .eq('id', tenant.id)

      if (error) {
        return NextResponse.json({ error: 'Error actualizando banner' }, { status: 500 })
      }
      return NextResponse.json({ ok: true, slot, assetUrl: finalUrl })
    } else if (slot === 'product_image' && productId) {
      // Get current product images
      const { data: product } = await db()
        .from('partner_products')
        .select('images')
        .eq('id', productId)
        .eq('tenant_id', tenant.id)
        .single()

      if (!product) {
        return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 })
      }

      // Gate "solo nuestros mockups" — mismo criterio que POST/PUT de
      // catálogo (lib/partners/product-image-origin.ts). En la práctica
      // assetUrl siempre viene del propio compositor Studio, pero se valida
      // igual por defensa en profundidad (este endpoint acepta cualquier
      // assetUrl en el body, no solo el que el Studio acaba de generar).
      const originCheck = await isOwnMockupUrl(tenant.id, tenant.slug, assetUrl)
      if (!originCheck.ok) {
        return NextResponse.json({ error: PRODUCT_IMAGE_ORIGIN_ERROR }, { status: 400 })
      }

      const currentImages = ((product.images as string[]) || []).filter(
        (u) => typeof u === 'string' && u,
      )

      // Regla frente/dorso/extras (lib/partners/product-image-origin.ts):
      //   - side='front' → REEMPLAZA images[0]. No se hace shift: el dorso
      //     que ya estaba en images[1] sigue siendo el dorso de este
      //     producto (regenerar el frente no debe desemparejarlo del dorso
      //     vigente), y las extras (índice 2+) quedan intactas.
      //   - side='back' → REEMPLAZA (o completa) images[1]. Requiere que ya
      //     haya un frente (images[0]) — el dorso siempre empareja con un
      //     frente existente, nunca lo crea.
      //   - sin side → comportamiento legacy: agregar al final (nunca
      //     "adelanta" nada a los índices 0/1 salvo que el producto todavía
      //     no los tuviera, igual que antes de este cambio).
      let updatedImages: string[]
      if (side === 'front') {
        updatedImages = [...currentImages]
        updatedImages[0] = assetUrl
      } else if (side === 'back') {
        if (currentImages.length < 1) {
          return NextResponse.json(
            { error: 'Publicá primero el frente — el dorso necesita un frente para emparejar.' },
            { status: 400 },
          )
        }
        updatedImages = [...currentImages]
        updatedImages[1] = assetUrl
      } else {
        updatedImages = [...currentImages, assetUrl]
      }

      if (updatedImages.length > MAX_PRODUCT_IMAGES) {
        return NextResponse.json(
          { error: `Máximo ${MAX_PRODUCT_IMAGES} fotos por producto` },
          { status: 400 },
        )
      }

      const { error } = await db()
        .from('partner_products')
        .update({ images: updatedImages, updated_at: new Date().toISOString() })
        .eq('id', productId)
        .eq('tenant_id', tenant.id)

      if (error) {
        return NextResponse.json({ error: 'Error actualizando producto' }, { status: 500 })
      }
    } else {
      return NextResponse.json({ error: 'Slot invalido' }, { status: 400 })
    }

    return NextResponse.json({ ok: true, slot, assetUrl })
  } catch (err: any) {
    console.error('[studio publish] error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
