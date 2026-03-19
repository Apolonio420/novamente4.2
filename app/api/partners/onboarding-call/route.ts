import { NextRequest, NextResponse } from 'next/server'
import { getRequestTenant } from '@/lib/partners/auth'
import { getPlanFeatures } from '@/lib/partners/plans'
import { createBooking, getBooking, cancelBooking } from '@/lib/partners/onboarding-call'

/**
 * GET — Return the latest active booking for the authenticated tenant.
 */
export async function GET(request: NextRequest) {
  try {
    const result = await getRequestTenant(request)
    if (!result) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const features = getPlanFeatures(result.tenant.plan)
    if (!features.onboardingCall) {
      return NextResponse.json(
        { error: 'Disponible solo en plan Pro', locked: true },
        { status: 403 },
      )
    }

    const booking = await getBooking(result.tenant.id)
    return NextResponse.json({ booking })
  } catch (error) {
    console.error('GET /api/partners/onboarding-call error:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

/**
 * POST — Create a new onboarding call booking.
 */
export async function POST(request: NextRequest) {
  try {
    const result = await getRequestTenant(request)
    if (!result) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const features = getPlanFeatures(result.tenant.plan)
    if (!features.onboardingCall) {
      return NextResponse.json(
        { error: 'Disponible solo en plan Pro', locked: true },
        { status: 403 },
      )
    }

    const body = await request.json()
    const { preferredDate, preferredTime, topic, phone } = body

    if (!preferredDate || !preferredTime) {
      return NextResponse.json(
        { error: 'Fecha y hora son requeridas' },
        { status: 400 },
      )
    }

    // Validate date is in the future
    const bookingDate = new Date(preferredDate)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    if (bookingDate <= today) {
      return NextResponse.json(
        { error: 'La fecha debe ser posterior a hoy' },
        { status: 400 },
      )
    }

    // Validate date is within 30 days
    const maxDate = new Date(today)
    maxDate.setDate(maxDate.getDate() + 30)
    if (bookingDate > maxDate) {
      return NextResponse.json(
        { error: 'La fecha debe ser dentro de los proximos 30 dias' },
        { status: 400 },
      )
    }

    // Validate weekday (Mon-Fri)
    const dayOfWeek = bookingDate.getDay()
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return NextResponse.json(
        { error: 'Solo se puede agendar de lunes a viernes' },
        { status: 400 },
      )
    }

    const booking = await createBooking(result.tenant.id, {
      preferredDate,
      preferredTime,
      topic,
      phone,
    })

    return NextResponse.json({ booking }, { status: 201 })
  } catch (error) {
    console.error('POST /api/partners/onboarding-call error:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

/**
 * DELETE — Cancel an existing booking.
 */
export async function DELETE(request: NextRequest) {
  try {
    const result = await getRequestTenant(request)
    if (!result) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const bookingId = searchParams.get('id')

    if (!bookingId) {
      // If no ID provided, cancel the latest active booking
      const existing = await getBooking(result.tenant.id)
      if (!existing) {
        return NextResponse.json({ error: 'No hay reserva activa' }, { status: 404 })
      }
      await cancelBooking(existing.id)
      return NextResponse.json({ success: true })
    }

    await cancelBooking(bookingId)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/partners/onboarding-call error:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
