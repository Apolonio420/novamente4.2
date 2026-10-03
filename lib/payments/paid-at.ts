/**
 * `paid_at` — momento en que una orden (`orders`) quedó PAGADA, usado por
 * reconcile.ts (repo novamente-platform-master) para fechar la VENTA por
 * cuándo se cobró en vez de por cuándo se creó (decisión del founder
 * 03/10/2026). Mismo patrón que `lib/ventas/paid-at.ts` del repo platform
 * (duplicado acá porque son codebases separados) — ver
 * auditoria-datos-2026-10/fecha-de-cobro-diseno.md.
 *
 * Dos garantías en cada call site que marca una orden como pagada:
 *  1. IDEMPOTENTE — nunca pisa un `paid_at` ya seteado (`.is('paid_at', null)`
 *     en el UPDATE).
 *  2. TOLERANTE A LA MIGRACIÓN NO CORRIDA — la columna se agrega en
 *     sql/2026-10-03-paid-at.sql (repo chatbot, auditoria-datos-2026-10/sql/),
 *     que puede deployarse DESPUÉS de este código. Si la columna todavía no
 *     existe, supabase-js devuelve 'PGRST204' (columna ausente del schema
 *     cacheado por PostgREST) — se loguea y se sigue, NUNCA rompe la
 *     confirmación de un pago real.
 */
import type { SupabaseClient } from "@supabase/supabase-js"

/** True si el error es "la columna no existe" (migración de paid_at sin correr todavía). */
export function isMissingColumnError(err: { code?: string | null; message?: string | null } | null | undefined): boolean {
  const code = String(err?.code ?? "")
  if (code === "PGRST204" || code === "42703") return true
  return /column .*paid_at.* does not exist/i.test(String(err?.message ?? ""))
}

/**
 * UPDATE condicional: setea `paid_at = now()` en `orders` para `id` SOLO SI
 * todavía es NULL. Nunca lanza.
 */
export async function markPaidAtIfMissing(supabase: SupabaseClient, id: string): Promise<void> {
  try {
    const { error } = await (supabase as any)
      .from("orders")
      .update({ paid_at: new Date().toISOString() })
      .eq("id", id)
      .is("paid_at", null)
    if (error && !isMissingColumnError(error)) {
      console.error(`[paid-at] orders ${id}: error marcando paid_at:`, error.message ?? error)
    }
  } catch (err) {
    console.error(`[paid-at] orders ${id}: excepción marcando paid_at:`, err instanceof Error ? err.message : err)
  }
}
