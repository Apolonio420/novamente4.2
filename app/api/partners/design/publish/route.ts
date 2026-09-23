import { NextRequest, NextResponse } from 'next/server'
import { requireTenantPermission } from '@/lib/partners/permissions'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { uploadFile } from '@/lib/cloudflare-r2'
import { toBanner16x9 } from '@/lib/partners/banner-image'

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
    const { assetUrl, slot, productId } = body

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

      const currentImages = (product.images as string[]) || []
      const updatedImages = [...currentImages, assetUrl]

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
