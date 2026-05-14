/**
 * POST /api/discounts/validate (PUBLICO)
 *
 * Valida un codigo de descuento del partner contra un subtotal y devuelve
 * el descuento aplicable + total final. Lo usa el /checkout para mostrar
 * el descuento antes de redirigir a MercadoPago.
 *
 * Body: { code: string, subtotal: number }
 * Response: { valid, discountARS, finalARS, reason?, codeId? }
 *
 * Nota: este endpoint busca el codigo EN TODOS los tenants (es publico). En
 * un escenario multi-tenant ideal el cart sabria a que partner pertenece cada
 * item y solo se aceptarian codigos del mismo partner. Por ahora — pragmatico.
 */
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { applyDiscount, type PartnerDiscountCode } from '@/lib/partners/discounts'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null)
    if (!body || typeof body.code !== 'string') {
      return NextResponse.json({ valid: false, reason: 'Codigo invalido' }, { status: 400 })
    }
    const subtotal = Number(body.subtotal)
    if (!Number.isFinite(subtotal) || subtotal <= 0) {
      return NextResponse.json({ valid: false, reason: 'Subtotal invalido' }, { status: 400 })
    }
    const code = body.code.toUpperCase().trim()

    const { data, error } = await (supabaseAdmin as any)
      .from('partner_discount_codes')
      .select('*')
      .eq('code', code)
      .eq('active', true)
      .limit(1)

    if (error) {
      return NextResponse.json({ valid: false, reason: 'Error de servidor' }, { status: 500 })
    }
    const found = (data?.[0] as PartnerDiscountCode | undefined) ?? null
    const result = applyDiscount(found, subtotal)

    return NextResponse.json({
      valid: result.valid,
      discountARS: result.discountARS,
      finalARS: result.finalARS,
      reason: result.reason,
      codeId: result.valid ? found?.id : undefined,
      codeLabel: result.valid && found
        ? found.discount_type === 'percentage'
          ? `${found.discount_value}% OFF`
          : `−$${found.discount_value.toLocaleString('es-AR')}`
        : undefined,
    })
  } catch (err: any) {
    console.error('POST /api/discounts/validate error:', err)
    return NextResponse.json({ valid: false, reason: 'Error de servidor' }, { status: 500 })
  }
}
