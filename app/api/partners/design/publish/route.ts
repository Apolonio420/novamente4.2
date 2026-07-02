import { NextRequest, NextResponse } from 'next/server'
import { requireTenantPermission } from '@/lib/partners/permissions'
import { supabaseAdmin } from '@/lib/supabase-admin'

const db = () => supabaseAdmin as any

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
      const { error } = await db()
        .from('tenants')
        .update({ hero_url: assetUrl, updated_at: new Date().toISOString() })
        .eq('id', tenant.id)

      if (error) {
        return NextResponse.json({ error: 'Error actualizando hero' }, { status: 500 })
      }
    } else if (slot === 'banner') {
      const { error } = await db()
        .from('tenants')
        .update({ banner_url: assetUrl, updated_at: new Date().toISOString() })
        .eq('id', tenant.id)

      if (error) {
        return NextResponse.json({ error: 'Error actualizando banner' }, { status: 500 })
      }
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
