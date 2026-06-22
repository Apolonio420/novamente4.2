import { NextRequest, NextResponse } from 'next/server'
import { requireTenantPermission } from '@/lib/partners/permissions'
import { createOrderEvent, getOrderById, getOrderEvents, updateOrder, type FulfillmentStatus } from '@/lib/partners/orders'

const FULFILLMENT_STATUSES: FulfillmentStatus[] = [
  'awaiting_art_approval', 'queued_for_production', 'in_production',
  'quality_check', 'ready_to_ship', 'shipped', 'delivered', 'exception', 'cancelled',
]

const LEGACY_STATUS_BY_FULFILLMENT: Partial<Record<FulfillmentStatus, string>> = {
  awaiting_art_approval: 'pending',
  queued_for_production: 'confirmed',
  in_production: 'producing',
  quality_check: 'producing',
  ready_to_ship: 'producing',
  shipped: 'shipped',
  delivered: 'delivered',
  cancelled: 'cancelled',
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireTenantPermission(request, 'orders:read')
    if (!auth.ok) return auth.response

    const { id } = await params
    const order = await getOrderById(id)
    if (!order || order.tenant_id !== auth.tenant.id) {
      return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 })
    }

    const events = await getOrderEvents(auth.tenant.id, id)
    return NextResponse.json({ order, events })
  } catch (error) {
    console.error('GET /api/partners/orders/[id] error:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireTenantPermission(request, 'orders:write')
    if (!auth.ok) return auth.response

    const { id } = await params
    const existing = await getOrderById(id)
    if (!existing || existing.tenant_id !== auth.tenant.id) {
      return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 })
    }

    const body = await request.json().catch(() => ({}))
    const allowedFields = [
      'status', 'payment_status', 'notes', 'shipping_info', 'fulfillment_status',
      'estimated_delivery_at', 'carrier', 'tracking_number', 'tracking_url', 'exception_reason',
    ] as const
    const updates: Record<string, unknown> = {}
    for (const field of allowedFields) {
      if (body[field] !== undefined) updates[field] = body[field]
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No hay campos para actualizar' }, { status: 400 })
    }
    if (updates.fulfillment_status && !FULFILLMENT_STATUSES.includes(updates.fulfillment_status as FulfillmentStatus)) {
      return NextResponse.json({ error: 'Estado de fulfillment invalido' }, { status: 400 })
    }
    if (updates.tracking_url && (typeof updates.tracking_url !== 'string' || !/^https?:\/\//.test(updates.tracking_url))) {
      return NextResponse.json({ error: 'El link de seguimiento debe ser una URL http(s)' }, { status: 400 })
    }
    if (updates.estimated_delivery_at && Number.isNaN(Date.parse(String(updates.estimated_delivery_at)))) {
      return NextResponse.json({ error: 'Fecha estimada invalida' }, { status: 400 })
    }

    const nextFulfillment = updates.fulfillment_status as FulfillmentStatus | undefined
    if (nextFulfillment) {
      updates.fulfillment_updated_at = new Date().toISOString()
      const legacyStatus = LEGACY_STATUS_BY_FULFILLMENT[nextFulfillment]
      if (legacyStatus) updates.status = legacyStatus
    }

    const order = await updateOrder(auth.tenant.id, id, updates as any)
    if (!order) return NextResponse.json({ error: 'Error al actualizar el pedido' }, { status: 500 })

    if (nextFulfillment && nextFulfillment !== existing.fulfillment_status) {
      await createOrderEvent(auth.tenant.id, id, auth.userId, 'fulfillment_changed', {
        fromStatus: existing.fulfillment_status,
        toStatus: nextFulfillment,
      })
    }
    if (updates.status && updates.status !== existing.status && !nextFulfillment) {
      await createOrderEvent(auth.tenant.id, id, auth.userId, 'status_changed', {
        fromStatus: existing.status,
        toStatus: String(updates.status),
      })
    }
    if (updates.tracking_number || updates.tracking_url || updates.carrier) {
      await createOrderEvent(auth.tenant.id, id, auth.userId, 'tracking_updated', {
        metadata: {
          carrier: updates.carrier ?? existing.carrier,
          tracking_number: updates.tracking_number ?? existing.tracking_number,
          tracking_url: updates.tracking_url ?? existing.tracking_url,
        },
      })
    }
    if (updates.exception_reason) {
      await createOrderEvent(auth.tenant.id, id, auth.userId, 'exception', { body: String(updates.exception_reason) })
    }
    if (updates.notes && updates.notes !== existing.notes) {
      await createOrderEvent(auth.tenant.id, id, auth.userId, 'note', { body: String(updates.notes) })
    }

    return NextResponse.json({ order })
  } catch (error) {
    console.error('PUT /api/partners/orders/[id] error:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
