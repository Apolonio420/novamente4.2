import { createHash } from "crypto"
import type { NextRequest } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { rateLimit as memoryRateLimit } from "@/lib/rate-limit"

/**
 * Guard compartido para los endpoints publicos/anonimos que llaman a Gemini
 * imagen (generate-image, generate-stamp, remove-bg, try-on, lifestyle,
 * mockup-lifestyle, apply-design, process-design, magic-remove-bg,
 * storefront studio generate/mockup, partners/onboarding/extract).
 *
 * Reemplaza el rate-limiter viejo (lib/rate-limit.ts: Map en memoria por
 * instancia serverless — inutil, cada cold start / instancia nueva resetea
 * el contador, asi que 12 req/min "por IP" en realidad eran 12 req/min POR
 * INSTANCIA, sin techo real). Ver auditoria 2026-07-11.
 *
 * Capas:
 *  1. Kill-switch global (PUBLIC_IMAGEGEN_ENABLED)
 *  2. Bypass por secret interno (INTERNAL_API_SECRET) — para callers
 *     server-to-server de confianza (bot/platform). HOY no hay ningun
 *     caller interno real detectado en Fase 0 para estos endpoints de 4.2,
 *     asi que esto queda inerte hasta que se configure la env var.
 *  3. Rate-limit por IP (hasheada, no se guarda cruda) por familia de
 *     endpoint: 10/min, 60/dia.
 *  4. Tope global diario cross-instancia (PUBLIC_IMAGEGEN_DAILY_CAP,
 *     default 400) sobre TODOS los endpoints publicos combinados.
 *
 * Backend: tabla public_imagegen_requests (migrations/create_public_imagegen_requests.sql).
 * Una fila por request ALLOWED (se inserta antes de dejar pasar la llamada
 * a Gemini), asi la misma tabla sirve de contador para el rate-limit por IP
 * y para el tope global.
 */

export interface ImageGuardBlocked {
  allowed: false
  status: number
  message: string
}

export interface ImageGuardAllowed {
  allowed: true
  exempt?: boolean
}

export type ImageGuardResult = ImageGuardBlocked | ImageGuardAllowed

const DAILY_CAP_DEFAULT = 400

// Dedupe muy simple para no floodear Telegram: solo alerta una vez cada 15
// min por instancia tibia. No es cross-instancia (best-effort), ver TODO.
let lastCapAlertAt = 0
const CAP_ALERT_THROTTLE_MS = 15 * 60 * 1000

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  )
}

function hashIp(ip: string): string {
  return createHash("sha256").update(ip).digest("hex").slice(0, 32)
}

function isKillSwitchOff(): boolean {
  return (process.env.PUBLIC_IMAGEGEN_ENABLED ?? "true").toLowerCase() === "false"
}

function getDailyCap(): number {
  const raw = Number(process.env.PUBLIC_IMAGEGEN_DAILY_CAP)
  return Number.isFinite(raw) && raw > 0 ? raw : DAILY_CAP_DEFAULT
}

function hasInternalBypass(request: NextRequest): boolean {
  const secret = process.env.INTERNAL_API_SECRET
  if (!secret) return false
  return request.headers.get("x-internal-secret") === secret
}

async function maybeAlertCapThreshold(dayCount: number, cap: number, endpointFamily: string) {
  const now = Date.now()
  if (now - lastCapAlertAt < CAP_ALERT_THROTTLE_MS) return
  lastCapAlertAt = now
  try {
    const { notifyError } = await import("@/lib/notifications")
    await notifyError({
      area: "Tope diario de generacion de imagen publica",
      endpoint: endpointFamily,
      message: `Uso al ${Math.round((dayCount / cap) * 100)}% del tope diario (${dayCount}/${cap}). Revisar abuso o subir PUBLIC_IMAGEGEN_DAILY_CAP.`,
    })
  } catch (e) {
    console.warn(
      `[public-image-guard] 80% del tope diario alcanzado (${dayCount}/${cap}) en "${endpointFamily}" — notifyError fallo:`,
      (e as Error).message,
    )
  }
}

/** Red de contencion si la DB no responde: viejo limiter en memoria (mejor que nada, no que 0). */
const fallbackLimiters = new Map<string, ReturnType<typeof memoryRateLimit>>()
function fallbackLimiterFor(endpointFamily: string) {
  let l = fallbackLimiters.get(endpointFamily)
  if (!l) {
    l = memoryRateLimit({ limit: 10, windowSeconds: 60, prefix: `fallback-${endpointFamily}` })
    fallbackLimiters.set(endpointFamily, l)
  }
  return l
}

/**
 * Corre el guard completo. Devuelve `{allowed:false,...}` si hay que cortar
 * la request ahi mismo (el caller debe responder con `status`/`message`).
 * Si `allowed:true`, el caller puede seguir e idealmente llamar a
 * `meterPublicImageGen` despues de generar con exito.
 */
export async function guardPublicImageGen(
  request: NextRequest,
  endpointFamily: string,
): Promise<ImageGuardResult> {
  if (hasInternalBypass(request)) {
    return { allowed: true, exempt: true }
  }

  if (isKillSwitchOff()) {
    return {
      allowed: false,
      status: 503,
      message: "La generacion de imagenes esta temporalmente deshabilitada. Probá de nuevo en un rato.",
    }
  }

  const cap = getDailyCap()
  const ipHash = hashIp(getClientIp(request))

  try {
    const nowIso = new Date().toISOString()
    const oneMinuteAgo = new Date(Date.now() - 60_000).toISOString()
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const startOfUtcDay = new Date(new Date().toISOString().slice(0, 10) + "T00:00:00.000Z").toISOString()

    const [minuteRes, dayIpRes, dayGlobalRes] = await Promise.all([
      supabaseAdmin
        .from("public_imagegen_requests")
        .select("id", { count: "exact", head: true })
        .eq("ip_hash", ipHash)
        .eq("endpoint_family", endpointFamily)
        .gt("created_at", oneMinuteAgo),
      supabaseAdmin
        .from("public_imagegen_requests")
        .select("id", { count: "exact", head: true })
        .eq("ip_hash", ipHash)
        .eq("endpoint_family", endpointFamily)
        .gt("created_at", oneDayAgo),
      supabaseAdmin
        .from("public_imagegen_requests")
        .select("id", { count: "exact", head: true })
        .gt("created_at", startOfUtcDay),
    ])

    if (minuteRes.error || dayIpRes.error || dayGlobalRes.error) {
      throw new Error(
        minuteRes.error?.message || dayIpRes.error?.message || dayGlobalRes.error?.message || "unknown",
      )
    }

    const minuteCount = minuteRes.count ?? 0
    const dayIpCount = dayIpRes.count ?? 0
    const dayGlobalCount = dayGlobalRes.count ?? 0

    if (dayGlobalCount >= cap) {
      return {
        allowed: false,
        status: 429,
        message: "Alcanzamos el limite diario de generacion de imagenes. Probá de nuevo mañana o escribinos por WhatsApp.",
      }
    }

    if (dayGlobalCount >= cap * 0.8) {
      void maybeAlertCapThreshold(dayGlobalCount, cap, endpointFamily)
    }

    if (minuteCount >= 10) {
      return {
        allowed: false,
        status: 429,
        message: "Demasiadas solicitudes. Esperá un minuto e intentá de nuevo.",
      }
    }

    if (dayIpCount >= 60) {
      return {
        allowed: false,
        status: 429,
        message: "Alcanzaste el limite diario de generaciones desde tu conexion. Probá de nuevo mañana.",
      }
    }

    // `as any`: mismo workaround que el resto del repo para insert() con el
    // cliente supabaseAdmin sin Database generics (ver meter-usage.ts).
    const { error: insertError } = await (supabaseAdmin.from("public_imagegen_requests") as any)
      .insert({ ip_hash: ipHash, endpoint_family: endpointFamily, created_at: nowIso })
    if (insertError) {
      console.error("[public-image-guard] insert failed (dejamos pasar la request igual):", insertError.message)
    }

    return { allowed: true }
  } catch (err) {
    console.error(
      `[public-image-guard] DB check fallo para "${endpointFamily}", usando fallback en memoria:`,
      (err as Error).message,
    )
    const { success, resetAt } = fallbackLimiterFor(endpointFamily).check(request)
    if (!success) {
      return {
        allowed: false,
        status: 429,
        message: "Demasiadas solicitudes. Esperá un minuto e intentá de nuevo.",
      }
    }
    return { allowed: true }
  }
}
