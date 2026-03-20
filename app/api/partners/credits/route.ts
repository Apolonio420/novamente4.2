import { NextRequest, NextResponse } from 'next/server'
import { getRequestTenant } from '@/lib/partners/auth'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
    try {
        const result = await getRequestTenant(request)
        if (!result) {
            return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
        }

        const { tenant } = result

        // Get current month period
        const now = new Date()
        const periodStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

        const { data } = await (supabaseAdmin as any)
            .from('super_credits')
            .select('credits_remaining, credits_total, period_end')
            .eq('tenant_id', tenant.id)
            .eq('period_start', periodStart)
            .single()

        if (!data) {
            return NextResponse.json({ remaining: 0, total: 0, periodEnd: null })
        }

        return NextResponse.json({
            remaining: data.credits_remaining,
            total: data.credits_total,
            periodEnd: data.period_end,
        })
    } catch (error) {
        console.error('GET /api/partners/credits error:', error)
        return NextResponse.json({ error: 'Error interno' }, { status: 500 })
    }
}
