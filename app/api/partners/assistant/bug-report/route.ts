import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const runtime = 'nodejs'

const BugReportSchema = z.object({
    description: z.string().min(1).max(5000),
    errorMessage: z.string().max(2000).optional(),
    errorStack: z.string().max(5000).optional(),
    errorDigest: z.string().max(200).optional(),
    sourceUrl: z.string().max(500).optional(),
    screenshotUrl: z.string().url().optional(),
})

async function getAuthenticatedUser(request: NextRequest) {
    const authHeader = request.headers.get('authorization')
    let token: string | null = authHeader?.replace('Bearer ', '') ?? null

    if (!token) {
        for (const cookie of request.cookies.getAll()) {
            if (cookie.name.startsWith('sb-') && cookie.name.endsWith('-auth-token')) {
                try {
                    const parsed = JSON.parse(cookie.value)
                    token = Array.isArray(parsed) ? parsed[0] : parsed
                } catch {
                    token = cookie.value
                }
                break
            }
        }
    }

    if (!token) return null
    const { data, error } = await supabaseAdmin.auth.getUser(token)
    if (error || !data?.user) return null
    return data.user
}

export async function POST(request: NextRequest) {
    try {
        const user = await getAuthenticatedUser(request)
        if (!user) {
            return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
        }

        let body: unknown
        try {
            body = await request.json()
        } catch {
            return NextResponse.json({ error: 'JSON invalido' }, { status: 400 })
        }

        const parsed = BugReportSchema.safeParse(body)
        if (!parsed.success) {
            return NextResponse.json({ error: 'Datos invalidos' }, { status: 400 })
        }

        const { description, errorMessage, errorStack, errorDigest, sourceUrl, screenshotUrl } = parsed.data

        // Get tenant_id from user metadata
        const tenantId = user.user_metadata?.tenant_id ?? null

        // bug_reports table created by migration 13
        const { data, error } = await (supabaseAdmin as ReturnType<typeof supabaseAdmin['from']> & { from: (table: string) => ReturnType<typeof supabaseAdmin['from']> })
            .from('bug_reports' as 'tenants')
            .insert({
                tenant_id: tenantId,
                reporter_type: 'partner',
                description,
                error_message: errorMessage ?? null,
                error_stack: errorStack ?? null,
                error_digest: errorDigest ?? null,
                source_url: sourceUrl ?? null,
                screenshot_url: screenshotUrl ?? null,
                status: 'new',
            } as never)
            .select('id')
            .single()

        if (error) {
            console.error('[Bug Report] Insert error:', error.message)
            return NextResponse.json(
                { error: 'No se pudo guardar el reporte. Intenta de nuevo.' },
                { status: 500 },
            )
        }

        return NextResponse.json({ id: (data as { id: string } | null)?.id ?? 'unknown', status: 'new' })
    } catch (err) {
        console.error('[Bug Report] Unexpected error:', err)
        return NextResponse.json({ error: 'Error interno' }, { status: 500 })
    }
}
