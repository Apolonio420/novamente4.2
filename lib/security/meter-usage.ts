import { supabaseAdmin } from "@/lib/supabase-admin"

/**
 * Metering de costo real de generacion de imagen para los endpoints
 * publicos. Inserta en `api_usage` (tabla ya existente, usada hoy solo por
 * novamente-platform-master/lib/finanzas/sync.ts para agregar gasto
 * mensual — pero HASTA HOY nadie escribia filas ahi, "Sin registros en
 * api_usage este mes" era el estado permanente). Este es el primer caller
 * que instrumenta escritura real.
 *
 * cost_ars queda en 0 a proposito: no hay un util de tipo de cambio
 * USD->ARS en ningun repo del ecosistema todavia (ver auditoria
 * 2026-07-11). TODO: wire real ARS conversion cuando exista esa pieza
 * (ver memoria project-economics-faro).
 *
 * Falla SIEMPRE en silencio — el metering jamas puede romper una
 * generacion exitosa para el usuario.
 */

const IMAGE_MODEL_COST_USD: Record<string, number> = {
  "gemini-2.5-flash-image": 0.039,
  "gemini-3-pro-image": 0.134,
  "gemini-3.1-flash-image": 0.04,
}

export async function meterPublicImageGen(params: {
  /** nombre de endpoint, ej "public/generate-image" */
  endpoint: string
  /** modelo Gemini efectivamente usado */
  model: string
  /** cantidad de imagenes generadas en esta llamada (default 1) */
  units?: number
  /** metadata extra opcional (sessionId, endpointFamily, etc — sin IP cruda) */
  metadata?: Record<string, unknown>
}) {
  try {
    const units = params.units ?? 1
    const perUnitCost = IMAGE_MODEL_COST_USD[params.model]
    const costUsd = (perUnitCost ?? 0) * units

    // `as any`: mismo workaround que el resto del repo (ver process-design,
    // drops/[id]/use-design) — el cliente supabaseAdmin sin Database
    // generics infiere `never` para insert() en TS 5.9.
    const { error } = await (supabaseAdmin.from("api_usage") as any).insert({
      provider: "gemini",
      operation: params.endpoint,
      model: params.model,
      units,
      cost_usd: costUsd,
      cost_ars: 0,
      metadata: {
        ...params.metadata,
        cost_known: perUnitCost !== undefined,
      },
    })
    if (error) {
      console.error("[meter-usage] insert failed (non-fatal):", error.message)
    }
  } catch (err) {
    console.error("[meter-usage] unexpected error (non-fatal):", (err as Error).message)
  }
}
