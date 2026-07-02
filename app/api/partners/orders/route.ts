import { NextRequest, NextResponse, after } from 'next/server'
import { z } from 'zod'
import { requireTenantPermission } from '@/lib/partners/permissions'
import { getOrdersByTenant, createOrder, countOrdersByTenant } from '@/lib/partners/orders'
import { sendToProduction } from '@/lib/partners/production'
import { notifyPartnerOrder, notifyTeamManualSale, type ManualOrderItemNotice } from '@/lib/notifications'

export const maxDuration = 30

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

// Carga manual de pedidos por el partner (incluye ventas externas).
// El partner solo manda/ve PVP + su precio Partner. El costo del proveedor y el
// margen los calcula platform-master (cuando produce=true). Nunca acá.
const itemSchema = z.object({
  product_id: z.string().max(100).optional(),
  name: z.string().min(1).max(200),
  producto_canonical: z.string().max(200).optional(), // nombre canónico para producción/costo
  color: z.string().max(60).optional().default(''),
  talle: z.string().max(20).optional().default(''),
  quantity: z.number().int().min(1).max(9999),
  doble_estampa: z.enum(['Si', 'No', 'Chica']).optional().default('No'),
  unit_price: z.number().min(0).optional().default(0), // PVP unitario (lo que cobra el partner)
  partner_price: z.number().min(0).optional().default(0), // precio partner unitario (nos transfiere)
  mockup_url: z.string().url().max(1000).optional(),
  print_url: z.string().url().max(1000).optional(),
  comments: z.string().max(500).optional(),
})

const createSchema = z.object({
  customer_name: z.string().max(200).optional(),
  customer_email: z.string().max(200).optional(),
  customer_phone: z.string().max(40).optional(),
  notes: z.string().max(2000).optional(),
  produce: z.boolean().optional().default(false),
  shipping_address: z.string().max(500).optional(),
  items: z.array(itemSchema).min(1).max(100),
})

function variantLabel(color?: string, talle?: string, doble?: 'Si' | 'No' | 'Chica'): string | undefined {
  const estampa = doble === 'Si' ? 'doble estampa' : doble === 'Chica' ? 'estampa chica' : ''
  const parts = [color, talle ? `Talle ${talle}` : '', estampa].filter(Boolean)
  return parts.length ? parts.join(' · ') : undefined
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireTenantPermission(request, 'orders:write')
    if (!auth.ok) return auth.response
    const tenant = auth.tenant

    let raw: unknown
    try {
      raw = await request.json()
    } catch {
      return NextResponse.json({ error: 'Payload JSON inválido' }, { status: 400 })
    }

    const parsed = createSchema.safeParse(raw)
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'Se requiere al menos un item' },
        { status: 400 },
      )
    }
    const body = parsed.data

    // Totales server-side (no confiar en el cliente)
    const pvpTotal = body.items.reduce((s, it) => s + (it.unit_price || 0) * it.quantity, 0)
    const partnerTotal = body.items.reduce((s, it) => s + (it.partner_price || 0) * it.quantity, 0)

    // partner_orders.items — SOLO campos partner-safe (jamás costo/margen)
    const orderItems = body.items.map((it) => ({
      product_id: it.product_id,
      name: it.name,
      variant: variantLabel(it.color, it.talle, it.doble_estampa),
      quantity: it.quantity,
      unit_price: it.unit_price || 0,
      partner_price: it.partner_price || 0,
      color: it.color || undefined,
      talle: it.talle || undefined,
      doble_estampa: it.doble_estampa,
      mockup_url: it.mockup_url,
    }))

    const order = await createOrder(tenant.id, {
      customer_name: body.customer_name,
      customer_email: body.customer_email,
      customer_phone: body.customer_phone,
      items: orderItems,
      total: pvpTotal,
      currency: tenant.currency || 'ARS',
      notes: body.notes,
      shipping_info: {
        source: 'manual',
        produce: body.produce,
        shipping_address: body.shipping_address || null,
      },
    })

    if (!order) {
      return NextResponse.json({ error: 'Error al crear el pedido' }, { status: 500 })
    }

    const noticeItems: ManualOrderItemNotice[] = body.items.map((it) => ({
      name: it.name,
      quantity: it.quantity,
      color: it.color || undefined,
      talle: it.talle || undefined,
      unit_price: it.unit_price || 0,
      partner_price: it.partner_price || 0,
    }))

    // Notificaciones + producción después de responder (no bloquear al partner).
    after(async () => {
      let pedidoNumero: string | undefined

      if (body.produce) {
        const prod = await sendToProduction({
          tenant: { id: tenant.id, name: tenant.name, slug: tenant.slug },
          cliente: body.customer_name,
          telefono: body.customer_phone,
          direccion: body.shipping_address,
          notas: body.notes,
          items: body.items.map((it) => ({
            producto: it.producto_canonical || it.name,
            color: it.color || '',
            talle: it.talle || '',
            cantidad: it.quantity,
            doble_estampa: it.doble_estampa,
            comments: it.comments,
            mockup_url: it.mockup_url,
            print_url: it.print_url,
            pvp: it.unit_price || 0,
            precio_partner: it.partner_price || 0,
          })),
        })
        pedidoNumero = prod.pedido_numero
        if (!prod.ok) {
          console.error('[POST /api/partners/orders] producción falló:', prod.error)
        }
        // El aviso al equipo con economía completa lo manda platform-master.
      } else {
        // Solo registro → avisar al equipo desde acá (sin costo del proveedor).
        await notifyTeamManualSale(tenant.name, {
          customerName: body.customer_name,
          items: noticeItems,
          pvpTotal,
          partnerTotal,
          produce: false,
        }).catch(() => null)
      }

      // Siempre avisar al partner (partner-safe).
      await notifyPartnerOrder(tenant, {
        customerName: body.customer_name,
        items: noticeItems,
        pvpTotal,
        partnerTotal,
        produce: body.produce,
        pedidoNumero,
      }).catch(() => null)
    })

    return NextResponse.json({ order }, { status: 201 })
  } catch (error) {
    console.error('POST /api/partners/orders error:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
