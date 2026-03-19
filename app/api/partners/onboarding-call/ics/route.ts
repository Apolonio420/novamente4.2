import { NextRequest, NextResponse } from 'next/server'
import { generateICS } from '@/lib/partners/calendar-invite'

/**
 * GET /api/partners/onboarding-call/ics?date=YYYY-MM-DD&time=HH:mm&name=PartnerName
 * Returns a downloadable .ics calendar invite file.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')
    const time = searchParams.get('time')
    const name = searchParams.get('name')

    if (!date || !time || !name) {
      return NextResponse.json(
        { error: 'Parametros requeridos: date, time, name' },
        { status: 400 },
      )
    }

    const icsContent = generateICS({
      date,
      time,
      partnerName: name,
    })

    return new NextResponse(icsContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': `attachment; filename="onboarding-call-${date}.ics"`,
      },
    })
  } catch (error) {
    console.error('GET /api/partners/onboarding-call/ics error:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
