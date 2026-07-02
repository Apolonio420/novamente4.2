import { NextRequest, NextResponse } from 'next/server'
import { requireTenantPermission } from '@/lib/partners/permissions'
import { createOrderEvent, getOrderById, getOrderEvents, updateOrder, type FulfillmentStatus, type PartnerOrder } from '@/lib/partners/orders'
import { isPartnersFulfillmentEnabled } from '@/lib/partners/feature-flags'

type LegacyOrderStatus = PartnerOrder['status']

const FULFILLMENT_STATUSES: FulfillmentStatus[] = [
  'awaiting_art_approval', 'queued_for_production', 'in_production',
  'quality_check', 'ready_to_ship', 'shipped', 'delivered', 'exception', 'cancelled',
]

const LEGACY_ORDER_STATUSES: LegacyOrderStatus[] = [
  'pending', 'confirmed', 'producing', 'shipped', 'delivered', 'exception', 'cancelled',
]

const LEGACY_STATUS_BY_FULFILLMENT: Record<FulfillmentStatus, LegacyOrderStatus> = {
  awaiting_art_approval: 'pending',
  queued_for_production: 'confirmed',
  in_production: 'producing',
  quality_check: 'producing',
  ready_to_ship: 'producing',
  shipped: 'shipped',
  delivered: 'delivered',
  exception: 'exception',
  cancelled: 'cancelled',
}

// Direct legacy status changes have to follow the same DAG shown in the
// workspace. Fulfillment updates can skip intermediate legacy milestones (for
// example, a bulk update to `shipped`), but can never move a milestone back.
const LEGACY_STATUS_TRANSITIONS: Record<LegacyOrderStatus, LegacyOrderStatus[]> = {
  pending: ['confirmed', 'cancelled', 'exception'],
  confirmed: ['producing', 'cancelled', 'exception'],
  producing: ['shipped', 'cancelled', 'exception'],
  shipped: ['delivered', 'exception'],
  delivered: [],
  exception: [],
  cancelled: [],
}

const LEGACY_STATUS_RANK: Partial<Record<LegacyOrderStatus, number>> = {
  pending: 0,
  confirmed: 1,
  producing: 2,
  shipped: 3,
  delivered: 4,
}

function isDirectLegacyTransitionAllowed(from: LegacyOrderStatus, to: LegacyOrderStatus) {
  return from === to || LEGACY_STATUS_TRANSITIONS[from].includes(to)
}

function canAdvanceLegacyStatus(from: LegacyOrderStatus, to: LegacyOrderStatus) {
  if (from === to) return true
  if (to === 'exception') return from !== 'delivered' && from !== 'exception' && from !== 'cancelled'
  if (to === 'cancelled') return from !== 'delivered' && from !== 'exception' && from !== 'cancelled'
  if (from === 'exception' || from === 'cancelled') return false

  const fromRank = LEGACY_STATUS_RANK[from]
  const toRank = LEGACY_STATUS_RANK[to]
  return fromRank !== undefined && toRank !== undefined && toRank >= fromRank
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireTenantPermission(request, 'orders:read')
    if (!auth.ok) return auth.response
    if (!isPartnersFulfillmentEnabled()) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })

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
    const isFulfillmentMutation = [
      'fulfillment_status', 'estimated_delivery_at', 'carrier',
      'tracking_number', 'tracking_url', 'exception_reason',
    ].some((field) => body[field] !== undefined)
    if (isFulfillmentMutation && !isPartnersFulfillmentEnabled()) {
      return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
    }

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
    if (updates.fulfillment_status !== undefined && (
      typeof updates.fulfillment_status !== 'string'
      || !FULFILLMENT_STATUSES.includes(updates.fulfillment_status as FulfillmentStatus)
    )) {
      return NextResponse.json({ error: 'Estado de fulfillment invalido' }, { status: 400 })
    }
    if (updates.status !== undefined && (
      typeof updates.status !== 'string'
      || !LEGACY_ORDER_STATUSES.includes(updates.status as LegacyOrderStatus)
    )) {
      return NextResponse.json({ error: 'Estado del pedido invalido' }, { status: 400 })
    }
    if (updates.tracking_url && (typeof updates.tracking_url !== 'string' || !/^https?:\/\//.test(updates.tracking_url))) {
      return NextResponse.json({ error: 'El link de seguimiento debe ser una URL http(s)' }, { status: 400 })
    }
    if (updates.estimated_delivery_at && Number.isNaN(Date.parse(String(updates.estimated_delivery_at)))) {
      return NextResponse.json({ error: 'Fecha estimada invalida' }, { status: 400 })
    }

    const requestedLegacyStatus = updates.status as LegacyOrderStatus | undefined
    const nextFulfillment = updates.fulfillment_status as FulfillmentStatus | undefined
    if (nextFulfillment) {
      const legacyStatus = LEGACY_STATUS_BY_FULFILLMENT[nextFulfillment]
      if (requestedLegacyStatus && requestedLegacyStatus !== legacyStatus) {
        return NextResponse.json({ error: 'El estado y el fulfillment no son consistentes' }, { status: 400 })
      }
      if (!canAdvanceLegacyStatus(existing.status, legacyStatus)) {
        return NextResponse.json({ error: 'No se puede retroceder el estado operativo del pedido' }, { status: 409 })
      }
      updates.fulfillment_updated_at = new Date().toISOString()
      updates.status = legacyStatus
    } else if (requestedLegacyStatus && !isDirectLegacyTransitionAllowed(existing.status, requestedLegacyStatus)) {
      return NextResponse.json({ error: 'Transicion de estado no permitida' }, { status: 409 })
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
