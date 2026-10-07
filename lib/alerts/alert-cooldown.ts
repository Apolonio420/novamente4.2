/**
 * Cooldown central de alertas operativas de Telegram — tarea Juan 07/10/2026
 * (auditoria-datos-2026-10/AUDITORIA-NOTIFICACIONES-2026-10.md, cambio #4):
 * los 7 sitios de `notifyError` (generate-stamp/process-design/generate-image/
 * checkout/…) re-alertaban en CADA intento fallido, sin ventana de silencio —
 * si un proveedor externo (Gemini/remove-bg) cae en loop, eso era ruido
 * audible ilimitado al grupo "🔔 Contenido".
 *
 * Regla: la MISMA alerta (misma `key`) no se manda de nuevo antes de
 * `cooldownMs` (default 30min). Si se repite durante la ventana, se cuenta;
 * cuando vuelve a mandarse (pasado el cooldown) se agrega el conteo de
 * repeticiones al mensaje — ver `formatRepeatedSuffix`.
 *
 * Estado persistido en `app_settings` — tabla genérica key/value que YA
 * existe en este proyecto Supabase (creada por
 * novamente-platform-master/lib/storage/migration-app-settings.sql; mismo
 * proyecto Supabase que esta tienda, confirmado por NEXT_PUBLIC_SUPABASE_URL
 * en ambos .env.local — no hace falta una migración nueva). Namespaced con
 * el prefijo `alert_cooldown:` para no pisar las keys de economía
 * (usd_ars_rate, balance_meta_ars, etc.) que ya viven ahí.
 *
 * Fail-open SIEMPRE: ante cualquier error o timeout de Supabase se manda la
 * alerta igual — nunca se pierde una alerta real por un problema del cooldown
 * (mismo criterio que lib/notifications.ts del bot, chatbot-whastapp).
 */
import { supabaseAdmin } from '@/lib/supabase-admin';

// `app_settings` no está en los Database generics de este cliente (mismo
// caso que "public_imagegen_requests" en lib/security/public-image-guard.ts)
// — se castea sin tipar, como ya se hace ahí.
const db = () => supabaseAdmin as any;

export const DEFAULT_ALERT_COOLDOWN_MS = 30 * 60 * 1000;
const DB_TIMEOUT_MS = 1500;
const SETTINGS_KEY_PREFIX = 'alert_cooldown:';

interface CooldownState {
  lastSentAt: string;
  suppressedCount: number;
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

export interface CooldownDecision {
  /** true = mandar la alerta ahora. false = suprimida por cooldown (ya se contó). */
  send: boolean;
  /** Solo relevante con send=true: cuántas veces se suprimió esta alerta en la ventana que recién cerró. */
  repeatedCount: number;
}

function isFreshEnough(state: CooldownState | null, cooldownMs: number): boolean {
  if (!state) return false;
  const lastSentMs = new Date(state.lastSentAt).getTime();
  if (!Number.isFinite(lastSentMs)) return false;
  return Date.now() - lastSentMs < cooldownMs;
}

/**
 * Decide si una alerta con esta `key` se manda ahora o se suprime por
 * cooldown. SIEMPRE awaitear antes de llamar al sender real: si decide
 * send=false, el caller no debe mandar nada a Telegram.
 */
export async function checkAlertCooldown(
  key: string,
  cooldownMs: number = DEFAULT_ALERT_COOLDOWN_MS,
): Promise<CooldownDecision> {
  const settingsKey = `${SETTINGS_KEY_PREFIX}${key}`;
  try {
    const { data, error } = await withTimeout(
      db().from('app_settings').select('value').eq('key', settingsKey).maybeSingle() as PromiseLike<{
        data: { value: CooldownState } | null;
        error: { message: string } | null;
      }>,
      DB_TIMEOUT_MS,
      { data: null, error: { message: 'timeout' } },
    );

    if (error) {
      console.error('[ALERT-COOLDOWN] lectura falló (fail-open, se manda igual):', error.message);
      return { send: true, repeatedCount: 0 };
    }

    const state = (data?.value as CooldownState | undefined) ?? null;

    if (!isFreshEnough(state, cooldownMs)) {
      // Primera vez, o la ventana anterior ya cerró: se manda, y si hubo
      // supresiones durante esa ventana se las reporta en el resultado.
      const repeatedCount = state?.suppressedCount ?? 0;
      await writeState(settingsKey, { lastSentAt: new Date().toISOString(), suppressedCount: 0 });
      return { send: true, repeatedCount };
    }

    // Dentro de la ventana: se suprime y se cuenta para el próximo envío.
    await writeState(settingsKey, {
      lastSentAt: (state as CooldownState).lastSentAt,
      suppressedCount: ((state as CooldownState).suppressedCount ?? 0) + 1,
    });
    return { send: false, repeatedCount: 0 };
  } catch (e) {
    console.error('[ALERT-COOLDOWN] excepción (fail-open, se manda igual):', e instanceof Error ? e.message : e);
    return { send: true, repeatedCount: 0 };
  }
}

async function writeState(settingsKey: string, state: CooldownState): Promise<void> {
  try {
    await withTimeout(
      db().from('app_settings').upsert({ key: settingsKey, value: state }, { onConflict: 'key' }) as PromiseLike<unknown>,
      DB_TIMEOUT_MS,
      null,
    );
  } catch (e) {
    console.error('[ALERT-COOLDOWN] no se pudo persistir el estado (no bloquea el envío):', e instanceof Error ? e.message : e);
  }
}

/** Sufijo a appendear al mensaje cuando `repeatedCount > 0`. Texto plano (sin tags) — válido tanto en HTML como en Markdown de Telegram. */
export function formatRepeatedSuffix(repeatedCount: number, windowLabel = '30 min'): string {
  if (repeatedCount <= 0) return '';
  return `\n\n(se repitió ${repeatedCount} veces en los últimos ${windowLabel})`;
}
