/**
 * Resumen técnico diario — lado tienda (Juan 08/10/2026): los errores que no
 * frenan ventas no suenan en "🔔 Contenido"; se guardan acá y el admin
 * (novamente-platform-master, cron /api/cron/ops-digest, 08:30 ART) los manda
 * en UN mensaje silencioso a "📊 Rutinas & Reportes".
 *
 * MISMO formato de fila que lib/alerts/ops-digest.ts del admin (comparten el
 * Supabase y la tabla `app_settings`): `ops_digest:<YYYY-MM-DD>:<hash>` con
 * { source, text, count, firstAt, lastAt }. Si cambia uno, cambiar el otro.
 */
import { createHash } from 'crypto';
import { supabaseAdmin } from '@/lib/supabase-admin';

export const OPS_DIGEST_PREFIX = 'ops_digest:';
const DB_TIMEOUT_MS = 2500;
const MAX_TEXT = 600;
const db = () => supabaseAdmin as any;

interface OpsDigestItem {
    source: string;
    text: string;
    count: number;
    firstAt: string;
    lastAt: string;
}

function withTimeout<T>(p: PromiseLike<T>, ms: number, fallback: T): Promise<T> {
    return new Promise((resolve) => {
        const t = setTimeout(() => resolve(fallback), ms);
        Promise.resolve(p).then(
            (v) => {
                clearTimeout(t);
                resolve(v);
            },
            () => {
                clearTimeout(t);
                resolve(fallback);
            },
        );
    });
}

/** Día en Argentina (UTC-3, sin horario de verano). */
export function argDay(d: Date = new Date()): string {
    return new Date(d.getTime() - 3 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

export function normalizeForDigest(text: string): string {
    return text.replace(/\d+/g, '#').replace(/\s+/g, ' ').trim().slice(0, 200).toLowerCase();
}

export function digestKey(source: string, text: string, day: string = argDay()): string {
    const h = createHash('sha1').update(`${source}|${normalizeForDigest(text)}`).digest('hex').slice(0, 16);
    return `${OPS_DIGEST_PREFIX}${day}:${h}`;
}

/** Guarda (o suma) un aviso para el resumen diario. false = no se pudo (el caller lo manda directo). */
export async function enqueueOpsDigest(source: string, text: string): Promise<boolean> {
    const key = digestKey(source, text);
    const now = new Date().toISOString();
    try {
        const { data, error } = await withTimeout(
            db().from('app_settings').select('value').eq('key', key).maybeSingle() as PromiseLike<{
                data: { value: OpsDigestItem } | null;
                error: { message: string } | null;
            }>,
            DB_TIMEOUT_MS,
            { data: null, error: { message: 'timeout' } },
        );
        if (error) return false;
        const prev = data?.value ?? null;
        const value: OpsDigestItem = prev
            ? { ...prev, count: (prev.count ?? 1) + 1, lastAt: now }
            : { source, text: text.slice(0, MAX_TEXT), count: 1, firstAt: now, lastAt: now };
        const res = await withTimeout(
            db().from('app_settings').upsert({ key, value }, { onConflict: 'key' }) as PromiseLike<{
                error: { message: string } | null;
            }>,
            DB_TIMEOUT_MS,
            { error: { message: 'timeout' } },
        );
        return !res.error;
    } catch (e) {
        console.error('[OPS-DIGEST] no se pudo guardar:', e instanceof Error ? e.message : e);
        return false;
    }
}
