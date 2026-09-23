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
 * Además expone la URL ESTÁTICA de la base estándar (public/garments/std/…)
 * cuando existe, para que el panel muestre la prenda lisa de entrada sin
 * pegarle a `mockup-preview` (sin diseño no hay nada que componer — pedirlo
 * igual solo suma una vuelta de red y, si algo se cuelga, un spinner eterno).
 * `thumbnail` es la imagen de portada de la tarjeta de la prenda (frente del
 * primer color con base estándar).
 *
 * Response:
 * {
 *   garments: [{
 *     key, name, category, thumbnail: string | null,
 *     colors: [{ key, name, hex, front, back, frontStaticUrl, backStaticUrl }]
 *   }]
 * }
 */
import { NextRequest, NextResponse } from 'next/server'
import { requireTenantPermission } from '@/lib/partners/permissions'
import { CATALOG_PRODUCTS } from '@/lib/catalog/products'
import { hasMockupBase } from '@/lib/mockup/compose'
import stdBasesData from '@/lib/garments/std-bases.json'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface StdBaseEntry {
  garmentKey: string
  color: string
  side: 'front' | 'back'
  file: string
}

const STD_BASES = stdBasesData as StdBaseEntry[]

function findStaticUrl(garmentKey: string, color: string, side: 'front' | 'back'): string | null {
  const entry = STD_BASES.find((b) => b.garmentKey === garmentKey && b.color === color && b.side === side)
  return entry ? entry.file : null
}

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
            return {
              key: color.key,
              name: color.name,
              hex: color.hex,
              front,
              back,
              frontStaticUrl: findStaticUrl(garment.key, color.key, 'front'),
              backStaticUrl: findStaticUrl(garment.key, color.key, 'back'),
            }
          }),
        )
        const thumbnail = colors.find((c) => c.frontStaticUrl)?.frontStaticUrl || null
        return {
          key: garment.key,
          name: garment.name,
          category: garment.category,
          thumbnail,
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
