/**
 * Healthcheck diario de storefronts partner (app/api/cron/partners/storefront-health).
 *
 * Caso Orlando (08/2026): su tienda estuvo en 404 público un mes entero y nos
 * enteramos porque se quejó por WhatsApp. La causa raíz (publicar un producto
 * nunca publicaba la tienda) ya se arregló en lib/partners/auto-publish.ts —
 * esto es la red de seguridad para que la PRÓXIMA vez que algo similar pase
 * (o cualquier otra forma de tienda rota) lo sepamos nosotros primero.
 *
 * Este módulo es solo lógica pura/testeable: clasificación de tenants y el
 * chequeo HTTP de una tienda. La orquestación (leer Supabase, notificar por
 * Telegram) vive en el route handler, que es quien tiene los side effects.
 */

export interface TenantHealthInput {
  id: string
  slug: string
  name: string
  status: string
  storefront_published: boolean
  metadata?: Record<string, unknown> | null
}

export interface DeadSilentFinding {
  slug: string
  name: string
  publishedProducts: number
  excluded: boolean
}

export interface EmptyStorefrontFinding {
  slug: string
  name: string
  excluded: boolean
}

export interface LiveCheckCandidate {
  slug: string
  name: string
  excluded: boolean
}

export type BrokenReason = 'not_found_marker' | 'http_status' | 'fetch_error' | 'timeout'

export interface BrokenLiveFinding {
  slug: string
  name: string
  excluded: boolean
  reason: BrokenReason
  detail: string
}

// ---------------------------------------------------------------------------
// Exclusiones — casos legítimos y conocidos que NO deben hacer ruido en el
// aviso diario. Explícita y comentada a propósito (pedido del owner: si se
// agrega una lista de exclusión, que quede clara por qué existe cada caso).
//
// - 'wod-armor': apagada A PROPÓSITO (dueño la ocultó manualmente). Sigue
//   teniendo productos publicados por eso cae en "dead silent" si no la
//   excluimos, pero acá "muerta" es la decisión correcta de alguien, no un bug.
// - metadata.is_demo === true: mismo flag que ya usan app/sitemap.ts y
//   app/api/openai-feed/route.ts para no indexar/exportar tiendas de
//   demostración interna (demo-clinica, tu-marca, novamente-training, etc.).
//   Reusamos el campo existente en vez de inventar otro criterio: cubre TODOS
//   los tenants demo, no solo los que además tienen slug con prefijo "demo-".
// - slug que empieza con 'test': tenants de QA / test-suite (test, test1,
//   test2, test-250eff...) que nunca van a tener catálogo real ni deben
//   generar alertas de "vidriera vacía" o "tienda caída".
//
// OJO: 'ms' (duplicado de 'ms-store', con productos publicados pero
// storefront apagado) NO está acá a propósito. A diferencia de wod-armor,
// nadie decidió activamente apagarla — es basura de datos pendiente de
// limpiar, así que el aviso debe seguir señalándola hasta que se resuelva.
const EXPLICIT_EXCLUDED_SLUGS = new Set(['wod-armor'])

export function isExcludedTenant(tenant: Pick<TenantHealthInput, 'slug' | 'metadata'>): boolean {
  if (EXPLICIT_EXCLUDED_SLUGS.has(tenant.slug)) return true
  if (tenant.metadata?.is_demo === true) return true
  if (tenant.slug.startsWith('test')) return true
  return false
}

// ---------------------------------------------------------------------------
// Clasificación (pura, sin I/O)
// ---------------------------------------------------------------------------

export interface ClassifyResult {
  deadSilent: DeadSilentFinding[]
  emptyStorefront: EmptyStorefrontFinding[]
  liveCheckCandidates: LiveCheckCandidate[]
}

/**
 * Clasifica los tenants en las 3 categorías del healthcheck:
 *  1. dead silent: tiene >=1 producto publicado pero storefront_published=false
 *     (el caso Orlando — el partner cargó catálogo y nadie lo ve).
 *  2. empty storefront: publicada + activa pero 0 productos publicados (señal
 *     comercial, no bug).
 *  3. live check candidates: publicada + activa (independiente de cuántos
 *     productos tenga) — a estos hay que pegarles un fetch real para ver si
 *     el "publicada" del registro coincide con lo que devuelve el sitio.
 *
 * `publishedProductCounts` es un Map tenant_id -> cantidad de partner_products
 * con status='published', ya agregado por el caller (una sola query a
 * partner_products, no una por tenant).
 */
export function classifyTenants(
  tenants: TenantHealthInput[],
  publishedProductCounts: Map<string, number>,
): ClassifyResult {
  const deadSilent: DeadSilentFinding[] = []
  const emptyStorefront: EmptyStorefrontFinding[] = []
  const liveCheckCandidates: LiveCheckCandidate[] = []

  for (const tenant of tenants) {
    const productCount = publishedProductCounts.get(tenant.id) || 0
    const excluded = isExcludedTenant(tenant)

    if (productCount > 0 && !tenant.storefront_published) {
      deadSilent.push({ slug: tenant.slug, name: tenant.name, publishedProducts: productCount, excluded })
    }

    if (tenant.storefront_published && tenant.status === 'active') {
      liveCheckCandidates.push({ slug: tenant.slug, name: tenant.name, excluded })

      if (productCount === 0) {
        emptyStorefront.push({ slug: tenant.slug, name: tenant.name, excluded })
      }
    }
  }

  return { deadSilent, emptyStorefront, liveCheckCandidates }
}

// ---------------------------------------------------------------------------
// Chequeo HTTP de una tienda viva
// ---------------------------------------------------------------------------

/**
 * Marcador de la página de not-found lógico de /p/[slug] (app/p/[slug]/page.tsx
 * → generateMetadata devuelve { title: 'Not Found' } cuando el tenant no existe
 * o no está activo/publicado; app/layout.tsx envuelve todo título con el
 * template "%s · Novamente"). CRÍTICO: esa ruta responde HTTP 200 igual — Next
 * renderiza el árbol de not-found.tsx como una página normal, no como un
 * error HTTP. Verificado con curl real (11/08/2026) contra 3 casos:
 *   - /p/wod-armor  (apagada a propósito)      → HTTP 200, <title>Not Found · Novamente</title>
 *   - /p/ms         (duplicado, apagada)       → HTTP 200, <title>Not Found · Novamente</title>
 *   - /p/este-slug-no-existe                   → HTTP 200, <title>Not Found · Novamente</title>
 *   - /p/ms-store   (viva, con productos)      → HTTP 200, <title>MS Indumentaria... · Novamente</title>
 * Si solo miráramos el status code, este chequeo nunca detectaría nada.
 */
export const NOT_FOUND_TITLE = 'Not Found · Novamente'

const TITLE_TAG_RE = /<title>([^<]*)<\/title>/i

export function looksLikeNotFoundPage(html: string): boolean {
  const match = TITLE_TAG_RE.exec(html)
  if (!match) return false
  return match[1].trim() === NOT_FOUND_TITLE
}

export interface StorefrontCheckResult {
  up: boolean
  reason?: BrokenReason
  detail?: string
}

/**
 * Pega un GET real a https://<baseUrl>/p/<slug> y decide si la tienda está
 * arriba. "Arriba" = HTTP 200 Y el <title> NO es el marcador de not-found.
 * Cualquier otro status, timeout, o error de red cuenta como caída (con su
 * propio `reason` para diferenciar en el reporte).
 */
export async function checkStorefrontHttp(
  baseUrl: string,
  slug: string,
  timeoutMs: number,
): Promise<StorefrontCheckResult> {
  const url = `${baseUrl}/p/${encodeURIComponent(slug)}`
  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(timeoutMs),
      headers: { 'User-Agent': 'novamente-storefront-healthcheck/1.0' },
    })

    if (!response.ok) {
      return { up: false, reason: 'http_status', detail: `HTTP ${response.status}` }
    }

    const html = await response.text()
    if (looksLikeNotFoundPage(html)) {
      return { up: false, reason: 'not_found_marker', detail: `título="${NOT_FOUND_TITLE}"` }
    }

    return { up: true }
  } catch (e: any) {
    const isTimeout = e?.name === 'TimeoutError' || e?.name === 'AbortError'
    return {
      up: false,
      reason: isTimeout ? 'timeout' : 'fetch_error',
      detail: e?.message || String(e),
    }
  }
}

/**
 * Decide si corresponde mandar el aviso a Telegram. "Silencio cuando todo
 * está bien" es un requisito explícito (no un detalle): un cron que manda
 * "todo ok" todos los días se vuelve invisible en una semana y el equipo
 * deja de leerlo — justo el mismo problema de fondo que el caso Orlando
 * (una señal que existe pero nadie mira). "Vidriera vacía" NUNCA dispara el
 * envío por sí sola a propósito: no es un bug, es una tienda sin catálogo
 * todavía, no algo urgente para interrumpir a alguien.
 */
export function shouldNotify(counts: { deadSilentActionable: number; brokenLiveActionable: number }): boolean {
  return counts.deadSilentActionable > 0 || counts.brokenLiveActionable > 0
}

/**
 * Corre `fn` sobre `items` con como máximo `limit` en paralelo. Son ~100
 * tiendas — sin límite de concurrencia dispararíamos 100 requests simultáneos
 * a nuestro propio dominio. Un `fn` que rechaza NO frena el resto: el caller
 * decide qué hacer con cada resultado (fn debe capturar sus propios errores
 * si no quiere que se propaguen acá).
 */
export async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length)
  let nextIndex = 0

  async function worker() {
    while (true) {
      const i = nextIndex++
      if (i >= items.length) return
      results[i] = await fn(items[i], i)
    }
  }

  const workers = Array.from({ length: Math.min(limit, items.length) }, () => worker())
  await Promise.all(workers)
  return results
}
