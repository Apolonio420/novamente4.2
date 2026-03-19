import { NextRequest, NextResponse } from 'next/server'
import { getRequestTenant } from '@/lib/partners/auth'
import { getPlanFeatures } from '@/lib/partners/plans'
import { getVisitStats, getLeadConversionRate, getTopProducts, getTrafficSources } from '@/lib/partners/analytics-queries'

export async function GET(request: NextRequest) {
  try {
    const result = await getRequestTenant(request)
    if (!result) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { tenant } = result
    const features = getPlanFeatures(tenant.plan)

    if (features.analytics !== 'advanced') {
      return NextResponse.json(
        { error: 'Exportar CSV solo disponible en plan Pro' },
        { status: 403 }
      )
    }

    const period = request.nextUrl.searchParams.get('period') || '7d'
    const days = period === '90d' ? 90 : period === '30d' ? 30 : 7

    const [visits, conversion, topProducts, sources] = await Promise.all([
      getVisitStats(tenant.id, days),
      getLeadConversionRate(tenant.id, days),
      getTopProducts(tenant.id, days, 50),
      getTrafficSources(tenant.id, days),
    ])

    // Build CSV
    const lines: string[] = []
    lines.push('Reporte de Analytics - ' + tenant.name)
    lines.push('Periodo: ultimos ' + days + ' dias')
    lines.push('')

    lines.push('Fecha,Visitas,Visitantes unicos')
    for (const day of visits.byDay) {
      lines.push(`${day.date},${day.total},${day.unique}`)
    }
    lines.push('')

    lines.push('Metrica,Valor')
    lines.push(`Total visitas,${visits.total}`)
    lines.push(`Visitantes unicos,${visits.unique}`)
    lines.push(`Leads,${conversion.leads}`)
    lines.push(`Tasa de conversion,${conversion.rate}%`)
    lines.push('')

    lines.push('Producto,Vistas')
    for (const p of topProducts) {
      lines.push(`${p.name},${p.views}`)
    }
    lines.push('')

    lines.push('Fuente de trafico,Visitas,Porcentaje')
    for (const s of sources) {
      lines.push(`${s.source},${s.count},${s.percentage}%`)
    }

    const csv = lines.join('\n')

    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="analytics-${tenant.slug}-${period}.csv"`,
      },
    })
  } catch (error) {
    console.error('GET /api/partners/analytics/export error:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
