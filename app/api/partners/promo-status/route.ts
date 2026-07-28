// Disponibilidad REAL de la promo de lanzamiento (50% OFF primer año, Growth).
// Público y sin auth (se consulta desde el wizard /partners/join antes de que
// exista un tenant), por eso responde SOLO un boolean — nunca la cantidad de
// partners pagos ni el cupo consumido (dato sensible de negocio).
import { NextResponse } from 'next/server'
import { isGrowthPromoEligible } from '@/lib/partners/subscription'

export const runtime = 'nodejs'

const CACHE_HEADERS = {
  'Cache-Control': 's-maxage=300, stale-while-revalidate=600',
}

export async function GET() {
  try {
    const promoAvailable = await isGrowthPromoEligible('growth')
    return NextResponse.json({ promoAvailable }, { headers: CACHE_HEADERS })
  } catch (e) {
    console.error('[promo-status] failed:', (e as Error).message)
    // fail-safe: si no podemos chequear, no prometemos nada que no podamos cumplir
    return NextResponse.json({ promoAvailable: false }, { headers: CACHE_HEADERS })
  }
}
