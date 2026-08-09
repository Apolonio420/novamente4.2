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

// Pricing (USD, tier standard / no-batch). Verificado contra
// ai.google.dev/gemini-api/docs/pricing, 2026-08-05 (auditoria factura
// julio: Google facturó US$364.42, medidores solo veían US$78.71).
// gemini-3.1-flash-image estaba mal cargado acá como 0.04 — el precio real
// (salida 1K, tier standard) es 0.067. Los otros dos ya estaban correctos.
const IMAGE_MODEL_COST_USD: Record<string, number> = {
  "gemini-2.5-flash-image": 0.039, // salida 1024×1024, sin componente de thinking separado
  "gemini-3-pro-image": 0.134, // salida 1K/2K — 4K sería 0.24, no usado hoy
  "gemini-3.1-flash-image": 0.067, // salida 1K — antes 0.04 (mal). Fuente: ai.google.dev/gemini-api/docs/pricing, 2026-08-05
  // Modelos legacy/preview ausentes de esta tabla hasta hoy → medían
  // cost_usd=0 pese a llamar a Gemini de verdad (auditoría 2026-08-09).
  "gemini-2.0-flash-exp": 0.039, // bg-removal en app/api/process-design/route.ts ("Nano Banana" original, salida imagen 1024×1024). Nunca tuvo precio oficial publicado (era free-tier preview) y ya no figura en la pricing page vigente → APROX = tarifa del equivalente GA gemini-2.5-flash-image (misma clase de salida). Fuente: ai.google.dev/gemini-api/docs/pricing, 2026-08-09.
  "gemini-2.0-flash": 0.0008, // NO genera imagen en este repo — solo texto+vision-input (partners/onboarding/extract, partners/catalog/copy, lib/rag/*chat.ts). APROX por tokens, no por imagen: última tarifa oficial standard $0.10/1M input + $0.40/1M output (modelo deprecado, shutdown oficial 01/06/2026 según la pricing page — sigue en uso en el repo, ver hallazgo aparte), asumiendo ~6K tokens input (screenshot+markdown) + ~600 output por call. Fuente: ai.google.dev/gemini-api/docs/pricing, 2026-08-09.
  "gemini-2.5-flash-preview-05-20": 0.039, // fallback de imagen en app/api/public/design/try-on/route.ts cuando el modelo primario falla. No listado en la pricing page vigente (preview retirado) → APROX = tarifa del equivalente GA gemini-2.5-flash-image (mismo tier, salida 1024×1024). Fuente: ai.google.dev/gemini-api/docs/pricing, 2026-08-09.
}

/**
 * gemini-3-pro-image y gemini-3.1-flash-image (familia "Nano Banana Pro/2")
 * facturan "text and thinking" tokens de razonamiento SEPARADO del precio
 * plano por imagen (ver ai.google.dev/gemini-api/docs/pricing, 2026-08-05:
 * gemini-3.1-flash-image = "$3 (text and thinking)" + "$60.00 (images)";
 * gemini-3-pro-image = "$12.00 (text and thinking)" + "$120.00 (images)").
 * Ese componente de thinking NO está en `usageMetadata` de los tipos del SDK
 * (@google/generative-ai, deprecado) pero SÍ viene en la respuesta real como
 * `thoughtsTokenCount` — mismo hallazgo que motivó el fix de hoy en
 * chatbot-whastapp/lib/ai/usage-meter.ts (texto, no imagen). Si el caller no
 * pasa `usageMetadata`, el costo queda igual que antes (solo el plano por
 * imagen) — cambio 100% aditivo, no afecta a los callers existentes.
 * gemini-2.5-flash-image NO tiene línea de thinking en el pricing oficial →
 * sin entrada acá, cost_known no se ve afectado.
 */
const IMAGE_MODEL_THINKING_COST_PER_TOKEN_USD: Record<string, number> = {
  "gemini-3-pro-image": 12.0 / 1_000_000,
  "gemini-3.1-flash-image": 3.0 / 1_000_000,
}

interface ImageUsageMetadataLike {
  promptTokenCount?: number
  candidatesTokenCount?: number
  totalTokenCount?: number
  /** Ver comentario de IMAGE_MODEL_THINKING_COST_PER_TOKEN_USD arriba. */
  thoughtsTokenCount?: number
}

export async function meterPublicImageGen(params: {
  /** nombre de endpoint, ej "public/generate-image" */
  endpoint: string
  /** modelo Gemini efectivamente usado */
  model: string
  /** cantidad de imagenes generadas en esta llamada (default 1) */
  units?: number
  /**
   * usageMetadata crudo de la respuesta de Gemini, si el caller lo tiene a
   * mano (ej. `(response as any).usageMetadata` con el SDK viejo). Opcional
   * — si no se pasa, el costo es el plano por imagen de siempre (sin
   * componente de thinking). Solo suma costo extra para modelos con
   * thinking facturado aparte (ver IMAGE_MODEL_THINKING_COST_PER_TOKEN_USD).
   */
  usageMetadata?: ImageUsageMetadataLike | null
  /** metadata extra opcional (sessionId, endpointFamily, etc — sin IP cruda) */
  metadata?: Record<string, unknown>
}) {
  try {
    const units = params.units ?? 1
    const perUnitCost = IMAGE_MODEL_COST_USD[params.model]
    const thoughtsTokens = params.usageMetadata?.thoughtsTokenCount ?? 0
    const thinkingRate = IMAGE_MODEL_THINKING_COST_PER_TOKEN_USD[params.model]
    const thinkingCost = thinkingRate && thoughtsTokens > 0 ? thinkingRate * thoughtsTokens : 0
    const costUsd = (perUnitCost ?? 0) * units + thinkingCost

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
        ...(thoughtsTokens > 0 ? { thinking_tokens: thoughtsTokens, thinking_cost_usd: thinkingCost } : {}),
      },
    })
    if (error) {
      console.error("[meter-usage] insert failed (non-fatal):", error.message)
    }
  } catch (err) {
    console.error("[meter-usage] unexpected error (non-fatal):", (err as Error).message)
  }
}
