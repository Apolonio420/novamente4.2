import { NextRequest, NextResponse } from 'next/server'
import { requireTenantPermission } from '@/lib/partners/permissions'
import { getOrdersByTenant, createOrder, countOrdersByTenant } from '@/lib/partners/orders'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireTenantPermission(request, 'orders:read')
    if (!auth.ok) return auth.response

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || undefined
    const limit = Number(searchParams.get('limit')) || 50
    const offset = Number(searchParams.get('offset')) || 0

    const [orders, total] = await Promise.all([
      getOrdersByTenant(auth.tenant.id, { status, limit, offset }),
      countOrdersByTenant(auth.tenant.id),
    ])

    return NextResponse.json({ orders, total })
  } catch (error) {
    console.error('GET /api/partners/orders error:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireTenantPermission(request, 'orders:write')
    if (!auth.ok) return auth.response

    const body = await request.json()
    if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json({ error: 'Se requiere al menos un item' }, { status: 400 })
    }

    const order = await createOrder(auth.tenant.id, {
      customer_name: body.customer_name,
      customer_email: body.customer_email,
      customer_phone: body.customer_phone,
      items: body.items,
      total: body.total,
      currency: body.currency,
      payment_id: body.payment_id,
      notes: body.notes,
    })

    if (!order) {
      return NextResponse.json({ error: 'Error al crear el pedido' }, { status: 500 })
    }

    return NextResponse.json({ order }, { status: 201 })
  } catch (error) {
    console.error('POST /api/partners/orders error:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
