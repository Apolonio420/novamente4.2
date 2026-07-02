import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireTenantPermission } from '@/lib/partners/permissions'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const runtime = 'nodejs'

const SuperActionSchema = z.object({
    actionType: z.enum(['storefront_edit', 'catalog_generation', 'bug_fix', 'custom']),
    description: z.string().min(1).max(5000),
    imageUrls: z.array(z.string().url()).max(5).optional(),
})

const PLAN_CREDITS: Record<string, number> = {
    starter: 0,
    growth: 1,
    pro: 3,
}

export async function POST(request: NextRequest) {
    try {
        const auth = await requireTenantPermission(request, 'support:write')
        if (!auth.ok) return auth.response

        const tenant = auth.tenant

        const body = await request.json().catch(() => null)
        const parsed = SuperActionSchema.safeParse(body)
        if (!parsed.success) {
            return NextResponse.json({ error: 'Datos invalidos' }, { status: 400 })
        }

        const plan = tenant.plan ?? 'starter'

        // Check credits for current month
        const now = new Date()
        const periodStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

        const { data: credits } = await (supabaseAdmin as any)
            .from('super_credits')
            .select('id, credits_remaining')
            .eq('tenant_id', tenant.id)
            .eq('period_start', periodStart)
            .single()

        if (!credits || credits.credits_remaining <= 0) {
            const maxCredits = PLAN_CREDITS[plan] ?? 0
            if (maxCredits === 0) {
                return NextResponse.json(
                    { error: 'Tu plan no incluye Super Acciones. Upgrade a Growth o Pro.' },
                    { status: 403 },
                )
            }
            return NextResponse.json(
                { error: 'No te quedan creditos este mes. Se renuevan el 1ro del proximo mes.' },
                { status: 403 },
            )
        }

        // Deduct credit atomically
        const { error: deductError } = await (supabaseAdmin as any)
            .from('super_credits')
            .update({ credits_remaining: credits.credits_remaining - 1, updated_at: new Date().toISOString() })
            .eq('id', credits.id)
            .gt('credits_remaining', 0)

        if (deductError) {
            return NextResponse.json({ error: 'Error al procesar credito' }, { status: 500 })
        }

        // Create the super action request
        const { data: actionData, error: insertError } = await (supabaseAdmin as any)
            .from('super_action_requests')
            .insert({
                tenant_id: tenant.id,
                credit_id: credits.id,
                action_type: parsed.data.actionType,
                description: parsed.data.description,
                status: 'pending',
                image_urls: parsed.data.imageUrls ?? [],
            })
            .select('id')
            .single()

        if (insertError) {
            return NextResponse.json({ error: 'Error al crear la solicitud' }, { status: 500 })
        }

        return NextResponse.json({
            id: actionData?.id,
            creditsRemaining: credits.credits_remaining - 1,
        })
    } catch (err) {
        console.error('[Super Action] Error:', err)
        return NextResponse.json({ error: 'Error interno' }, { status: 500 })
    }
}
