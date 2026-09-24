/**
 * Gate "solo nuestros mockups" para fotos de producto de la tienda pública
 * (`partner_products.images`).
 *
 * Por qué: hoy `app/api/partners/upload/route.ts` (antes de este cambio)
 * aceptaba cualquier jpg/png/webp/svg con `type` libre y lo guardaba sin
 * validar — el catálogo (`app/workspace/catalog/page.tsx`) lo usa con
 * `type="product"`, así que un partner podía subir un mockup ajeno, una
 * prenda colgada, o una foto de stock, y la tienda terminaba mostrando
 * prendas que Novamente no fabrica. El flujo correcto ya existe: Studio
 * (`app/workspace/design-engine`) → `POST /api/partners/design/mockup`,
 * que compone SOBRE nuestras bases reales (`lib/garment-mappings.json` +
 * `public/garments/*`) y sube el resultado a R2 con la key
 * `partners/${tenant.slug}/mockups/${assetId}.png`
 * (ver `app/api/partners/design/mockup/route.ts`).
 *
 * `isOwnMockupUrl` decide si una URL de imagen de producto es "nuestra":
 *
 * 1. Fuente de verdad para mockups del Studio: `partner_assets` del tenant con
 *    `type = 'mockup'` y `source != 'uploaded'` — coincidencia por
 *    `public_url` o por `storage_key` (la key R2, ya sea que la URL venga
 *    como `/api/proxy-image?key=...`, con un CDN público, o el dominio R2
 *    directo). Scopeado por `tenant_id`, así que sobrevive a un cambio de slug.
 *
 *    Hasta el 23/09/2026 la tabla no tenía NINGUNA fila de Studio: el insert
 *    de `saveDesignAsset()` fallaba siempre (status 'active' fuera del CHECK)
 *    y el error se tragaba. Arreglado en 45aec5b + migración
 *    20260923_partner_assets_design_types.sql, y los 705 archivos que ya
 *    estaban en R2 se reconstruyeron con scripts/backfill-partner-assets-r2.ts.
 *    Desde ahí, un mockup del Studio SIN fila es un mockup que no pasó por el
 *    compositor oficial (o cuyo insert falló — eso ahora alerta por
 *    notifyError) y se rechaza.
 *
 *    El patrón de key `partners/{slug}/mockups/` solo se usa si la CONSULTA a
 *    la tabla falla (error de DB): en ese caso degradamos al criterio anterior
 *    en vez de bloquear a todos los partners por un blip de Supabase.
 *
 * 2. Legacy que nunca pasó por `partner_assets` (no hay fila posible), por
 *    PATRÓN DE PATH:
 *
 *      - bucket Supabase `images/mockups/{slug}/...` (mockups curados a mano
 *        de una corrida pre-Studio; visto en datos reales — 41 imágenes en
 *        `partner_products.images` sobre una muestra de 500 productos)
 *      - bucket Supabase `mockups-fallback/...` (compositor del bot de
 *        WhatsApp — nunca lo escribe el endpoint de upload libre, así que no
 *        hay riesgo de que un partner lo falsifique subiendo un archivo con
 *        ese nombre; el path no lleva el slug del tenant sino un teléfono,
 *        por lo que acá se acepta ancho — ver nota en el código).
 *
 * SOLO se usa para URLs NUEVAS de un producto (POST, o PUT agregando una URL
 * que el producto no tenía antes) — URLs que el producto ya tenía siguen
 * permitidas para no romper productos legacy al editar precio/nombre.
 */
import { supabaseAdmin } from '@/lib/supabase-admin'
import { normalizeR2Key } from '@/lib/r2'

const db = () => supabaseAdmin as any

function safeDecodeKey(url: string): string | null {
  const key = normalizeR2Key(url)
  return key || null
}

/** true si `key` (una R2 key, sin barra inicial) es del compositor Studio para este tenant. */
function isStudioMockupKey(key: string, tenantSlug: string): boolean {
  const cleaned = key.replace(/^\/+/, '')
  return cleaned.startsWith(`partners/${tenantSlug}/mockups/`)
}

/** true si `url` es del bucket legacy `images/mockups/{slug}/...` (Supabase Storage). */
function isLegacyCuratedMockupUrl(url: string, tenantSlug: string): boolean {
  return url.includes(`/storage/v1/object/public/images/mockups/${tenantSlug}/`)
    || url.includes(`/object/public/images/mockups/${tenantSlug}/`)
}

/**
 * Subcarpetas de `mockups-fallback` que son mockups compuestos de verdad
 * (foto de la prenda con el diseño puesto), verificado listando el bucket
 * real (Supabase Storage, `mockups-fallback`, 2026-09-23):
 *
 *   remove-bg/          → recortes sueltos (salida de quitar fondo), NO mockup
 *   robot-images/images  → imágenes genéricas del robot de posteos, NO mockup
 *   robot-images/mockups → mockups compuestos del robot — SÍ
 *   v1/stamps/           → diseños/estampas sueltos (el nombre lo dice), NO mockup
 *   v2/uploads/dashboard/{telefono}/... → mockup entregado por WhatsApp al
 *                          dashboard del cliente — SÍ (ya visto como imagen
 *                          real de un producto publicado)
 *   videos/              → video, no imagen
 *
 * Solo se aceptan las dos subcarpetas marcadas "SÍ" arriba.
 */
const LEGACY_BOT_MOCKUP_SUBPATHS = [
  'mockups-fallback/robot-images/mockups/',
  'mockups-fallback/v2/uploads/dashboard/',
]

/**
 * true si `url` es del bucket legacy `mockups-fallback/...` del compositor del
 * bot de WhatsApp, y cae en una de las subcarpetas que SÍ son mockups
 * compuestos (ver `LEGACY_BOT_MOCKUP_SUBPATHS`). El path no lleva el slug del
 * tenant (lleva un teléfono), así que no se puede scopear por tenant acá —
 * ese bucket nunca lo escribe `/api/partners/upload` (el path de un partner
 * upload libre es siempre `partner-assets/{tenantId}/{type}/...`), así que un
 * partner no puede "fingir" esta URL subiendo un archivo con ese nombre.
 */
function isLegacyBotMockupUrl(url: string): boolean {
  return LEGACY_BOT_MOCKUP_SUBPATHS.some(
    (sub) => url.includes(`/storage/v1/object/public/${sub}`) || url.includes(`/object/public/${sub}`),
  )
}

export interface OwnMockupCheckResult {
  ok: boolean
  reason?: 'db_asset' | 'studio_key_pattern_db_down' | 'legacy_curated' | 'legacy_bot_fallback'
}

/**
 * Valida que `url` sea una imagen de producto "nuestra": generada por el
 * Studio (o un mockup legacy reconocible), nunca una subida libre.
 */
export async function isOwnMockupUrl(
  tenantId: string,
  tenantSlug: string,
  url: string,
): Promise<OwnMockupCheckResult> {
  if (!url || typeof url !== 'string') return { ok: false }

  // data: URIs nunca son "nuestro mockup" — no hay forma de que vengan del
  // Studio (que siempre sube a R2 y devuelve una URL pública).
  if (url.startsWith('data:')) return { ok: false }

  const key = safeDecodeKey(url)

  // 1) Fuente de verdad: fila real en partner_assets.
  // Dos queries separadas (en vez de `.or()` con la URL interpolada) para no
  // depender de escapar comas/paréntesis de una URL arbitraria dentro del
  // string de filtro de PostgREST.
  let dbFailed = false
  try {
    const base = () =>
      db()
        .from('partner_assets')
        .select('id, source')
        .eq('tenant_id', tenantId)
        .eq('type', 'mockup')
        .neq('source', 'uploaded')
        .limit(1)

    const byUrl = await base().eq('public_url', url)
    if (byUrl.error) throw byUrl.error
    if (Array.isArray(byUrl.data) && byUrl.data.length > 0) {
      return { ok: true, reason: 'db_asset' }
    }

    if (key) {
      const byKey = await base().eq('storage_key', key)
      if (byKey.error) throw byKey.error
      if (Array.isArray(byKey.data) && byKey.data.length > 0) {
        return { ok: true, reason: 'db_asset' }
      }
    }
  } catch (e) {
    dbFailed = true
    console.error('[product-image-origin] consulta a partner_assets falló, uso patrón de key:', (e as Error)?.message ?? e)
  }

  // 2) Solo si la DB no respondió: patrón de key del compositor Studio.
  // Con la DB sana, una key de Studio sin fila se rechaza.
  if (dbFailed && key && isStudioMockupKey(key, tenantSlug)) {
    return { ok: true, reason: 'studio_key_pattern_db_down' }
  }

  // 3) Legacy: mockups curados a mano.
  if (isLegacyCuratedMockupUrl(url, tenantSlug)) {
    return { ok: true, reason: 'legacy_curated' }
  }

  // 4) Legacy: compositor del bot de WhatsApp.
  if (isLegacyBotMockupUrl(url)) {
    return { ok: true, reason: 'legacy_bot_fallback' }
  }

  return { ok: false }
}

export const PRODUCT_IMAGE_ORIGIN_ERROR =
  'Las fotos de producto se generan en el Studio con nuestras prendas. Subí tu diseño y elegí prenda y color.'

/**
 * Regla de negocio (galería de producto, Fase 3): `images[0]` = frente,
 * `images[1]` = dorso — SIEMPRE mockups del Studio sobre nuestra prenda real,
 * gateados por `isOwnMockupUrl`. Desde este índice en adelante (`images[2+]`)
 * son fotos extra (lifestyle, detalle, producto real) y SÍ pueden ser una
 * subida libre del partner — ver `app/api/partners/upload/route.ts`
 * (type='other') y `components/partners/image-upload.tsx` en
 * `app/workspace/catalog/page.tsx`.
 *
 * Depende de que el array de `images` llegue siempre en orden
 * frente/dorso/extras — lo garantiza el form de catálogo
 * (`app/workspace/catalog/page.tsx`, `formImages`) y el insert de
 * `side: 'front'|'back'` en `app/api/partners/design/publish/route.ts`.
 */
export const MOCKUP_REQUIRED_SLOTS = 2

/** Máximo de fotos por producto: frente + dorso + hasta 6 extras. */
export const MAX_PRODUCT_IMAGES = 8

/**
 * Valida un array de URLs de imagen de producto, devolviendo la primera que
 * no pasa el gate (o null si todas pasan). Solo se valida hasta
 * `MOCKUP_REQUIRED_SLOTS` (frente + dorso) — las fotos extra (índice 2+)
 * nunca pasan por este gate. `existingUrls` son URLs que el producto ya
 * tenía antes de este PUT — nunca se re-validan (no romper productos legacy
 * al editar otros campos).
 */
export async function findFirstDisallowedProductImage(
  tenantId: string,
  tenantSlug: string,
  images: string[],
  existingUrls: string[] = [],
): Promise<string | null> {
  const existing = new Set(existingUrls)
  for (let i = 0; i < images.length && i < MOCKUP_REQUIRED_SLOTS; i++) {
    const url = images[i]
    if (existing.has(url)) continue
    const result = await isOwnMockupUrl(tenantId, tenantSlug, url)
    if (!result.ok) return url
  }
  return null
}

/**
 * Shape mínimo de `metadata.colors[]` (ver `app/workspace/catalog/page.tsx`,
 * `setOrDelete('colors', ...)`): cada color guarda `images.front`/`images.back`,
 * que `app/p/[slug]/[product]/page.tsx` (galería de colores) SÍ muestra en la
 * tienda pública — mismo riesgo que `partner_products.images`, así que pasa
 * por el mismo gate.
 */
export interface ProductColorMetadata {
  images?: { front?: unknown; back?: unknown } | null
  [key: string]: unknown
}

/** Extrae, en orden estable, las URLs de imagen (front/back) de `metadata.colors[]`. */
export function extractColorImageUrls(colors: unknown): string[] {
  if (!Array.isArray(colors)) return []
  const urls: string[] = []
  for (const color of colors as ProductColorMetadata[]) {
    const front = color?.images?.front
    const back = color?.images?.back
    if (typeof front === 'string' && front) urls.push(front)
    if (typeof back === 'string' && back) urls.push(back)
  }
  return urls
}

/**
 * Igual que `findFirstDisallowedProductImage`, pero para las imágenes por
 * color de `metadata.colors[]` en vez de `partner_products.images`.
 * `existingColors` es el `metadata.colors` que el producto ya tenía —  sus
 * URLs no se re-validan (mismo criterio: solo URLs nuevas).
 */
export async function findFirstDisallowedColorImage(
  tenantId: string,
  tenantSlug: string,
  colors: unknown,
  existingColors: unknown = [],
): Promise<string | null> {
  const newUrls = extractColorImageUrls(colors)
  const existingUrls = extractColorImageUrls(existingColors)
  return findFirstDisallowedProductImage(tenantId, tenantSlug, newUrls, existingUrls)
}
