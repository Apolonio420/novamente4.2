import { NextRequest, NextResponse } from 'next/server'
import { getRequestTenant } from '@/lib/partners/auth'
import { getOrderById, updateOrder } from '@/lib/partners/orders'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const result = await getRequestTenant(request)
    if (!result) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { id } = await params
    const order = await getOrderById(id)
    if (!order || order.tenant_id !== result.tenant.id) {
      return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 })
    }

    return NextResponse.json({ order })
  } catch (error) {
    console.error('GET /api/partners/orders/[id] error:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const result = await getRequestTenant(request)
    if (!result) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { id } = await params
    const existing = await getOrderById(id)
    if (!existing || existing.tenant_id !== result.tenant.id) {
      return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 })
    }

    const body = await request.json()
    const allowedFields = ['status', 'payment_status', 'notes', 'shipping_info'] as const
    const updates: Record<string, unknown> = {}
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updates[field] = body[field]
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No hay campos para actualizar' }, { status: 400 })
    }

    const order = await updateOrder(id, updates as any)
    if (!order) {
      return NextResponse.json({ error: 'Error al actualizar el pedido' }, { status: 500 })
    }

    return NextResponse.json({ order })
  } catch (error) {
    console.error('PUT /api/partners/orders/[id] error:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
