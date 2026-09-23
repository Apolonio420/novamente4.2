/**
 * GET /api/partners/products/garment-options
 *
 * Fase 3 pieza C — el panel "Nuevo producto" necesita saber, ANTES de dejar
 * elegir una combinación prenda×color, si el compositor único (pieza B)
 * tiene base para cada lado — si no, `mockup-preview`/`from-design` tiran
 * 422 ("No hay base disponible para ..."). En vez de duplicar la lógica de
 * fallback de `resolveBase` (std-bases.json → garment-mappings.json) en el
 * cliente, este endpoint corre `hasMockupBase` (la misma función que usa el
 * compositor) server-side y devuelve el mapa de disponibilidad real.
 *
 * Response:
 * {
 *   garments: [{
 *     key, name, category,
 *     colors: [{ key, name, hex, front: boolean, back: boolean }]
 *   }]
 * }
 */
import { NextRequest, NextResponse } from 'next/server'
import { requireTenantPermission } from '@/lib/partners/permissions'
import { CATALOG_PRODUCTS } from '@/lib/catalog/products'
import { hasMockupBase } from '@/lib/mockup/compose'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireTenantPermission(request, 'designs:write')
    if (!auth.ok) return auth.response

    const garments = await Promise.all(
      CATALOG_PRODUCTS.map(async (garment) => {
        const colors = await Promise.all(
          garment.colors.map(async (color) => {
            const [front, back] = await Promise.all([
              hasMockupBase(garment.key, color.key, 'front'),
              hasMockupBase(garment.key, color.key, 'back'),
            ])
            return { key: color.key, name: color.name, hex: color.hex, front, back }
          }),
        )
        return {
          key: garment.key,
          name: garment.name,
          category: garment.category,
          colors,
        }
      }),
    )

    return NextResponse.json({ garments })
  } catch (error: any) {
    console.error('GET /api/partners/products/garment-options error:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
