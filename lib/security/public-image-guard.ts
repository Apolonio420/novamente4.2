import { createHash } from "crypto"
import type { NextRequest } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { rateLimit as memoryRateLimit } from "@/lib/rate-limit"

/**
 * Guard compartido para los endpoints publicos/anonimos que llaman a Gemini
 * imagen (generate-image, generate-stamp, remove-bg, try-on, lifestyle,
 * mockup-lifestyle, process-design, magic-remove-bg,
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
 *  5. Tope MENSUAL en dolares (PUBLIC_GEMINI_BUDGET_USD, default 60) sobre
 *     el gasto real (cost_usd) de TODOS los endpoints publicos combinados,
 *     contado desde max(inicio del mes calendario UTC, PUBLIC_BUDGET_EPOCH
 *     — default 2026-07-17, dia del deploy). El epoch evita que el gasto
 *     pre-tope del mes de arranque (ya contaminado, no filtrable por
 *     "publico" vs "no publico" retroactivamente) tire el tope de arranque
 *     y bloquee /crear el mismo dia — el pedido era un tope hacia
 *     adelante, no apagar la web hoy. A diferencia del tope 4 (cuenta
 *     requests), este cuenta plata: un abuso con pocos requests pero al
 *     modelo caro (gemini-3-pro-image, $0.134/unidad) puede volar el
 *     presupuesto sin tocar el tope diario de requests. Ver aprobacion del
 *     dueño 2026-07-16.
 *
 * Backend: tabla public_imagegen_requests (migrations/create_public_imagegen_requests.sql)
 * para los topes 3-4. Una fila por request ALLOWED (se inserta antes de
 * dejar pasar la llamada a Gemini), asi la misma tabla sirve de contador
 * para el rate-limit por IP y para el tope global de requests.
 *
 * El tope 5 (USD) lee de `api_usage` (lib/security/meter-usage.ts), que
 * registra el COSTO REAL despues de una generacion exitosa (provider
 * siempre "gemini" para estos endpoints — es el unico writer de esa tabla
 * hoy en todo el ecosistema, ver comentario en meter-usage.ts). OJO: el
 * campo `operation` NO tiene el prefijo "public/" de forma consistente
 * (ej. "generate-stamp", "storefront/studio/generate", "magic-remove-bg"
 * no lo tienen; "public/generate-image", "public/design/edit" si) — por
 * eso el tope 5 suma TODO api_usage con provider='gemini' del mes, sin
 * filtrar por prefijo de `operation` (filtrar por "public/%" subcontaria
 * ~la mitad del gasto real y el tope quedaria de adorno).
 */

// Shape PLANO a proposito (no discriminated union): con strict:false el
// narrowing de `!guard.allowed` no funciona en este tsconfig y los call
// sites no compilan (TS2339). Misma leccion ya aplicada en el repo para
// TenantAuthResult (lib/partners/permissions.ts). Cuando allowed=false,
// status y message SIEMPRE vienen seteados en runtime.
export interface ImageGuardResult {
  allowed: boolean
  /** true si la request quedo exenta por secret interno */
  exempt?: boolean
  /** HTTP status a devolver cuando allowed=false */
  status?: number
  /** Mensaje amigable a devolver cuando allowed=false */
  message?: string
}

// Lo que ve el visitante cuando el que se quedo sin cupo es EL SISTEMA, no el.
// Un error comun y corriente: nadie tiene por que enterarse de nuestros topes.
const PLATFORM_SIDE_ERROR =
  "No pudimos generar el diseño en este momento. Probá de nuevo en un rato; si sigue pasando, escribinos y lo diseñamos con vos."

const DAILY_CAP_DEFAULT = 400

// El tope mensual en USD es la RED DE EMERGENCIA, no el limitador de todos los
// dias: es global y compartido, asi que cuando salta corta /crear para TODO el
// mundo hasta el 1ro del mes que viene. Quien reparte el uso de forma justa es
// el cupo semanal por visitante (abajo). Por eso este numero tiene que quedar
// lo bastante alto como para que solo se dispare ante una anomalia real.
const MONTHLY_BUDGET_USD_DEFAULT = 60

// Cupo por visitante, ventana rodante de 7 dias. Mismo criterio que el plan
// Starter de partners (20/semana): es personal, se explica solo y no castiga
// a alguien que entra por primera vez por lo que consumio otro.
const WEEKLY_PER_VISITOR_DEFAULT = 20

// Solo las familias que producen un DISEÑO cuentan para el cupo semanal, y
// cuentan juntas: generar y editar son las dos caras de la misma tarea (igual
// que en partners, donde diseños y mockups suman al mismo contador). El resto
// (try-on, remove-bg, lifestyle) son accesorias y ya tienen sus topes por IP.
const WEEKLY_QUOTA_FAMILIES = ["generate-image", "design-edit"]

// Dedupe muy simple para no floodear Telegram: solo alerta una vez cada 15
// min por instancia tibia. No es cross-instancia (best-effort), ver TODO.
let lastCapAlertAt = 0
const CAP_ALERT_THROTTLE_MS = 15 * 60 * 1000

// Mismo throttle pero con su propio timestamp: no queremos que una alerta
// de tope de REQUESTS se coma la ventana de la alerta de tope de USD (o
// viceversa) si ambas cruzan el umbral casi al mismo tiempo.
let lastBudgetAlertAt = 0

// Cache en memoria del proceso para no sumar toda `api_usage` en cada
// request (a $60/mes con generate-image gratis eso puede ser cientos de
// requests/dia). TTL corto: el overshoot maximo posible es "gasto de 60s
// de trafico" antes de que el tope se entere de que ya se paso.
const BUDGET_CACHE_TTL_MS = 60_000
const BUDGET_PAGE_SIZE = 1000
let budgetCache: { monthKey: string; totalUsd: number; fetchedAt: number } | null = null

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

/** <= 0 desactiva el chequeo de tope mensual en USD. */
function getMonthlyBudgetUsd(): number {
  const raw = Number(process.env.PUBLIC_GEMINI_BUDGET_USD ?? MONTHLY_BUDGET_USD_DEFAULT)
  return Number.isFinite(raw) ? raw : MONTHLY_BUDGET_USD_DEFAULT
}

/** <= 0 desactiva el cupo semanal por visitante. */
function getWeeklyPerVisitor(): number {
  const raw = Number(process.env.PUBLIC_IMAGEGEN_WEEKLY_PER_VISITOR ?? WEEKLY_PER_VISITOR_DEFAULT)
  return Number.isFinite(raw) ? raw : WEEKLY_PER_VISITOR_DEFAULT
}

/** "YYYY-MM" en UTC — clave del mes calendario en curso. */
function currentUtcMonthKey(): string {
  return new Date().toISOString().slice(0, 7)
}

function startOfUtcMonthIso(): string {
  return `${currentUtcMonthKey()}-01T00:00:00.000Z`
}

/**
 * Epoch de arranque del tope (default 2026-07-17, dia del deploy). Sin
 * esto, el primer dia el tope suma TODO julio retroactivo — incluido el
 * gasto pre-tope del mes (ya ~$26.87 el 2026-07-17, antes de que esta
 * feature existiera) — y bloquea /crear al instante hasta el 1 de agosto.
 * El dueño pidio un tope hacia ADELANTE, no apagar la web el dia del
 * deploy. En meses siguientes el epoch queda en el pasado (antes del
 * inicio del mes calendario) y `startOfBudgetWindowIso` lo ignora — cuenta
 * el mes entero como siempre. Mismo patron que GEMINI_BUDGET_EPOCH en los
 * gates del robot de platform.
 */
function getBudgetEpochIso(): string {
  const raw = (process.env.PUBLIC_BUDGET_EPOCH ?? "2026-07-17").trim()
  const parsed = new Date(`${raw}T00:00:00.000Z`)
  return Number.isNaN(parsed.getTime()) ? "2026-07-17T00:00:00.000Z" : parsed.toISOString()
}

/** max(inicio del mes calendario UTC, epoch del tope) — ver getBudgetEpochIso. */
function startOfBudgetWindowIso(): string {
  const startOfMonth = startOfUtcMonthIso()
  const epoch = getBudgetEpochIso()
  return epoch > startOfMonth ? epoch : startOfMonth
}

/**
 * Suma cost_usd de `api_usage` (provider=gemini) desde max(inicio del mes
 * calendario UTC, PUBLIC_BUDGET_EPOCH) — ver startOfBudgetWindowIso. Pagina
 * de a BUDGET_PAGE_SIZE filas: el limite default de PostgREST/Supabase
 * corta en 1000 filas por request si no se pagina, y a $25/mes con el
 * modelo mas barato (~$0.039/unidad) eso son ~640 filas — cerca del
 * limite, y si el tope se sube esto silenciosamente subcontaria el gasto
 * real. Sin filtro por `operation`: ver comentario arriba del archivo (el
 * prefijo "public/" no es consistente entre endpoints).
 */
async function fetchMonthlySpendUsd(): Promise<number> {
  const startIso = startOfBudgetWindowIso()
  let total = 0
  let from = 0
  for (;;) {
    const { data, error } = await supabaseAdmin
      .from("api_usage")
      .select("cost_usd")
      .eq("provider", "gemini")
      .gte("created_at", startIso)
      .range(from, from + BUDGET_PAGE_SIZE - 1)
    if (error) throw new Error(error.message)
    const rows = (data ?? []) as { cost_usd: number | null }[]
    for (const row of rows) total += row.cost_usd ?? 0
    if (rows.length < BUDGET_PAGE_SIZE) break
    from += BUDGET_PAGE_SIZE
  }
  return total
}

/** Devuelve el gasto mensual cacheado (TTL BUDGET_CACHE_TTL_MS), recalculando en background al vencer. */
async function getCachedMonthlySpendUsd(): Promise<number> {
  const monthKey = currentUtcMonthKey()
  const now = Date.now()
  if (budgetCache && budgetCache.monthKey === monthKey && now - budgetCache.fetchedAt < BUDGET_CACHE_TTL_MS) {
    return budgetCache.totalUsd
  }
  const totalUsd = await fetchMonthlySpendUsd()
  budgetCache = { monthKey, totalUsd, fetchedAt: now }
  return totalUsd
}

async function maybeAlertBudgetThreshold(spentUsd: number, budgetUsd: number, endpointFamily: string, capped: boolean) {
  const now = Date.now()
  if (now - lastBudgetAlertAt < CAP_ALERT_THROTTLE_MS) return
  lastBudgetAlertAt = now
  const pct = Math.round((spentUsd / budgetUsd) * 100)
  const message = capped
    ? `Tope MENSUAL en USD alcanzado: gasto $${spentUsd.toFixed(2)} >= $${budgetUsd} (PUBLIC_GEMINI_BUDGET_USD). Generacion publica bloqueada hasta el mes que viene (o hasta subir el tope).`
    : `Uso al ${pct}% del tope mensual en USD ($${spentUsd.toFixed(2)}/$${budgetUsd}). Revisar abuso o subir PUBLIC_GEMINI_BUDGET_USD.`
  try {
    const { notifyError } = await import("@/lib/notifications")
    await notifyError({
      area: "Tope mensual USD de generacion de imagen publica",
      endpoint: endpointFamily,
      message,
    })
  } catch (e) {
    console.warn(`[public-image-guard] ${pct}% del tope MENSUAL en USD ($${spentUsd.toFixed(2)}/$${budgetUsd}) en "${endpointFamily}" — notifyError fallo:`, (e as Error).message)
  }
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

  // Tope 5: gasto mensual en USD. Va antes de las consultas de tope de
  // requests (evita esas 3 queries en paralelo si ya estamos bloqueados
  // por plata). Fail-OPEN si la query falla: preferimos un mes ocasional
  // sin este tope a tirar abajo /crear por un hiccup de DB — el tope de
  // requests (mas abajo) sigue de pie como red de contencion aparte.
  const budgetUsd = getMonthlyBudgetUsd()
  if (budgetUsd > 0) {
    try {
      const spentUsd = await getCachedMonthlySpendUsd()
      if (spentUsd >= budgetUsd) {
        void maybeAlertBudgetThreshold(spentUsd, budgetUsd, endpointFamily, true)
        return {
          allowed: false,
          status: 429,
          // Los topes GLOBALES los puede ver alguien que entra por primera vez y
          // no hizo nada: no le contamos el limite interno, le damos un error
          // normal y la salida por WhatsApp (el boton lo pone la UI del chat).
          message: PLATFORM_SIDE_ERROR,
        }
      }
      if (spentUsd >= budgetUsd * 0.8) {
        void maybeAlertBudgetThreshold(spentUsd, budgetUsd, endpointFamily, false)
      }
    } catch (err) {
      console.warn(
        `[public-image-guard] chequeo de tope mensual USD fallo para "${endpointFamily}", dejamos pasar (fail-open):`,
        (err as Error).message,
      )
    }
  }

  const cap = getDailyCap()
  const ipHash = hashIp(getClientIp(request))

  try {
    const nowIso = new Date().toISOString()
    const oneMinuteAgo = new Date(Date.now() - 60_000).toISOString()
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const startOfUtcDay = new Date(new Date().toISOString().slice(0, 10) + "T00:00:00.000Z").toISOString()

    const weeklyQuota = getWeeklyPerVisitor()
    const weeklyApplies = weeklyQuota > 0 && WEEKLY_QUOTA_FAMILIES.includes(endpointFamily)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

    const [minuteRes, dayIpRes, dayGlobalRes, weekIpRes] = await Promise.all([
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
      weeklyApplies
        ? supabaseAdmin
            .from("public_imagegen_requests")
            .select("id", { count: "exact", head: true })
            .eq("ip_hash", ipHash)
            .in("endpoint_family", WEEKLY_QUOTA_FAMILIES)
            .gt("created_at", sevenDaysAgo)
        : Promise.resolve({ count: 0, error: null }),
    ])

    if (minuteRes.error || dayIpRes.error || dayGlobalRes.error || weekIpRes.error) {
      throw new Error(
        minuteRes.error?.message ||
          dayIpRes.error?.message ||
          dayGlobalRes.error?.message ||
          weekIpRes.error?.message ||
          "unknown",
      )
    }

    const minuteCount = minuteRes.count ?? 0
    const dayIpCount = dayIpRes.count ?? 0
    const dayGlobalCount = dayGlobalRes.count ?? 0

    if (dayGlobalCount >= cap) {
      return {
        allowed: false,
        status: 429,
        message: PLATFORM_SIDE_ERROR,
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

    // Cupo semanal por visitante: es el que reparte de forma justa. Va DESPUES
    // de los topes de abuso (minuto/dia) porque es el mas alto de los tres.
    if (weeklyApplies && (weekIpRes.count ?? 0) >= weeklyQuota) {
      return {
        allowed: false,
        status: 429,
        message: `Llegaste a los ${weeklyQuota} diseños de esta semana. Se van liberando día a día — o escribinos por WhatsApp y lo diseñamos con vos.`,
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
