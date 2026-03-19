import { NextRequest, NextResponse } from 'next/server'
import { getRequestTenant } from '@/lib/partners/auth'
import { createTicket, getTickets } from '@/lib/partners/support'
import { getPlanFeatures } from '@/lib/partners/plans'
import type { Plan } from '@/lib/partners/types'

export async function GET(request: NextRequest) {
  try {
    const result = await getRequestTenant(request)
    if (!result) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const url = new URL(request.url)
    const status = url.searchParams.get('status') as any

    const tickets = await getTickets(result.tenant.id, status || undefined)
    return NextResponse.json({ tickets })
  } catch (error) {
    console.error('GET /api/partners/support error:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const result = await getRequestTenant(request)
    if (!result) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    // Validate plan allows support
    const features = getPlanFeatures(result.tenant.plan as Plan)
    if (features.supportLevel === 'none') {
      return NextResponse.json(
        { error: 'Tu plan no incluye soporte. Actualiza a Growth para acceder.' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { subject, description, category } = body

    if (!subject || !description) {
      return NextResponse.json(
        { error: 'Asunto y descripcion son requeridos' },
        { status: 400 }
      )
    }

    const validCategories = ['general', 'billing', 'technical', 'feature_request']
    const ticketCategory = validCategories.includes(category) ? category : 'general'

    const ticket = await createTicket(
      result.tenant.id,
      subject,
      description,
      ticketCategory,
      result.tenant.plan
    )

    if (!ticket) {
      return NextResponse.json(
        { error: 'Error al crear el ticket' },
        { status: 500 }
      )
    }

    return NextResponse.json({ ticket }, { status: 201 })
  } catch (error) {
    console.error('POST /api/partners/support error:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
