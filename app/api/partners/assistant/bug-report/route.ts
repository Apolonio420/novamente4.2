import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getRequestTenant } from '@/lib/partners/permissions'
import { notifyUrgent, escapeTelegramHtml } from '@/lib/notifications'
import { checkAlertCooldown, formatRepeatedSuffix } from '@/lib/alerts/alert-cooldown'
import { hashAlertKey, normalizeAlertText } from '@/lib/alerts/dedupe-key'
import { runAfterResponse } from '@/lib/partners/support-notify'

export const runtime = 'nodejs'

const BugReportSchema = z.object({
    description: z.string().min(1).max(5000),
    errorMessage: z.string().max(2000).optional(),
    errorStack: z.string().max(5000).optional(),
    errorDigest: z.string().max(200).optional(),
    sourceUrl: z.string().max(500).optional(),
    screenshotUrl: z.string().url().optional(),
})

/** Tope por tenant: un loop de errores en el navegador no puede llenar la tabla ni el bot. */
export const BUG_REPORT_LIMIT = 5
export const BUG_REPORT_WINDOW_MS = 10 * 60 * 1000

function pathOf(sourceUrl?: string): string {
    if (!sourceUrl) return 'desconocida'
    try {
        return new URL(sourceUrl).pathname
    } catch {
        return sourceUrl.split('?')[0].split('#')[0].slice(0, 200)
    }
}

/**
 * El partner chocó con un error del workspace. Se guarda SIEMPRE en bug_reports
 * (el cooldown solo limita Telegram) y se avisa a "🚨 Urgente" con cooldown de
 * 30 min por tenant+ruta+mensaje normalizado, para que un loop no spamee.
 */
export async function POST(request: NextRequest) {
    try {
        // Cualquier rol con membresía aceptada (un viewer también se topa con
        // errores — por eso no se exige un permiso de escritura).
        const ctx = await getRequestTenant(request)
        if (!ctx) {
            return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
        }
        const tenant = ctx.tenant

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
        const db = supabaseAdmin as any

        // Rate limit durable (cuenta en la base, vale entre instancias serverless).
        // Fail-open: si el conteo falla, se deja pasar.
        try {
            const since = new Date(Date.now() - BUG_REPORT_WINDOW_MS).toISOString()
            const { count, error: countError } = await db
                .from('bug_reports')
                .select('id', { count: 'exact', head: true })
                .eq('tenant_id', tenant.id)
                .gte('created_at', since)
            if (!countError && (count ?? 0) >= BUG_REPORT_LIMIT) {
                return NextResponse.json(
                    { error: 'Ya recibimos varios reportes tuyos hace un momento. Nos están llegando, gracias.' },
                    { status: 429, headers: { 'Retry-After': String(Math.ceil(BUG_REPORT_WINDOW_MS / 1000)) } },
                )
            }
        } catch (e) {
            console.error('[Bug Report] rate-limit check falló (fail-open):', e instanceof Error ? e.message : e)
        }

        // bug_reports table created by migration 13
        const { data, error } = await db
            .from('bug_reports')
            .insert({
                tenant_id: tenant.id,
                reporter_type: 'partner',
                description,
                error_message: errorMessage ?? null,
                error_stack: errorStack ?? null,
                error_digest: errorDigest ?? null,
                source_url: sourceUrl ?? null,
                screenshot_url: screenshotUrl ?? null,
                status: 'new',
            })
            .select('id')
            .single()

        if (error) {
            console.error('[Bug Report] Insert error:', error.message)
        }

        // Aviso a Urgente aunque el insert haya fallado: perder el reporte en
        // silencio es justo lo que se quiere evitar.
        const path = pathOf(sourceUrl)
        const msgForKey = errorMessage || description
        runAfterResponse(async () => {
            const key = hashAlertKey(['bug', tenant.id, path, normalizeAlertText(msgForKey)])
            const decision = await checkAlertCooldown(key)
            if (!decision.send) return
            const lines = [
                `🐞 <b>ERROR EN EL WORKSPACE — ${escapeTelegramHtml(tenant.name)}</b>`,
                `<b>Ruta:</b> <code>${escapeTelegramHtml(path)}</code>`,
                `<b>Error:</b> <code>${escapeTelegramHtml((errorMessage || description).slice(0, 300))}</code>`,
                errorDigest ? `<b>Digest:</b> <code>${escapeTelegramHtml(errorDigest)}</code>` : '',
                error ? '⚠️ <i>No se pudo guardar en bug_reports.</i>' : '',
            ].filter(Boolean)
            await notifyUrgent(`${lines.join('\n')}${formatRepeatedSuffix(decision.repeatedCount)}`)
        })

        if (error) {
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
