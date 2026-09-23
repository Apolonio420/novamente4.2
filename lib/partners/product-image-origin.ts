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
 * 1. Fuente de verdad (cuando existe fila): `partner_assets` del tenant con
 *    `type = 'mockup'` y `source != 'uploaded'` — coincidencia por
 *    `public_url` o por `storage_key` (la key R2, ya sea que la URL venga
 *    como `/api/proxy-image?key=...`, con un CDN público, o el dominio R2
 *    directo).
 *
 * 2. Fallback por PATRÓN DE KEY/PATH, aceptado aunque no haya fila en
 *    `partner_assets`. Esto es necesario porque, a la fecha de este cambio
 *    (verificado con un SELECT de solo lectura sobre la base real, 2026-09-23),
 *    la tabla `partner_assets` tiene 518 filas y **0** de `type IN ('mockup',
 *    'design', 'stamp')` — solo existen 'logo' | 'product' | 'other' | 'banner'
 *    | 'hero' — pese a que `saveDesignAsset()` (lib/partners/design-engine.ts)
 *    escribe esos tipos en cada corrida del Studio. `saveDesignAsset` traga el
 *    error de insert (`console.error` + `return null`) y sus callers
 *    (`design/mockup`, `design/upload`, `design/generate`) igual devuelven
 *    `asset?.id || <uuid generado localmente>`, así que la subida a R2/el
 *    mockup en sí SÍ funciona pero la fila de auditoría en `partner_assets`
 *    puede faltar en silencio (posible drift entre el CHECK constraint de
 *    `type` en prod — `create_partners_os_tables.sql` solo declara
 *    `'logo','banner','hero','product','mockup','generated','approved','other'`,
 *    sin 'design'/'stamp' — y lo que el código intenta insertar). Ver
 *    hallazgo reportado aparte; NO se toca ese bug acá, fuera de alcance de
 *    esta tarea. Por eso el gate NO puede depender solo de la fila en DB:
 *    valida también por el patrón de key que el compositor oficial siempre
 *    usa, scopeado al tenant.
 *
 *    Patrones aceptados (siempre exigiendo que el segmento de tenant en el
 *    path sea el `tenant.slug` del auth actual, o legacy sin ese segmento):
 *      - key R2 `partners/{slug}/mockups/...` (compositor Studio, vigente)
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
 * true si `url` es del bucket legacy `mockups-fallback/...` del compositor del
 * bot de WhatsApp. Path no lleva el slug del tenant (lleva un teléfono), así
 * que no se puede scopear por tenant acá — se acepta ancho a propósito: ese
 * bucket nunca lo escribe `/api/partners/upload` (el path de un partner
 * upload libre es siempre `partner-assets/{tenantId}/{type}/...`), así que un
 * partner no puede "fingir" esta URL subiendo un archivo con ese nombre.
 */
function isLegacyBotMockupUrl(url: string): boolean {
  return url.includes('/storage/v1/object/public/mockups-fallback/')
    || url.includes('/object/public/mockups-fallback/')
}

export interface OwnMockupCheckResult {
  ok: boolean
  reason?: 'db_asset' | 'studio_key_pattern' | 'legacy_curated' | 'legacy_bot_fallback'
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

  // 1) Fuente de verdad: fila real en partner_assets, si existe.
  // Dos queries separadas (en vez de `.or()` con la URL interpolada) para no
  // depender de escapar comas/paréntesis de una URL arbitraria dentro del
  // string de filtro de PostgREST.
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
    if (Array.isArray(byUrl.data) && byUrl.data.length > 0) {
      return { ok: true, reason: 'db_asset' }
    }

    if (key) {
      const byKey = await base().eq('storage_key', key)
      if (Array.isArray(byKey.data) && byKey.data.length > 0) {
        return { ok: true, reason: 'db_asset' }
      }
    }
  } catch {
    // best-effort: si falla la consulta, seguimos con los patrones legacy.
  }

  // 2) Patrón de key del compositor Studio vigente.
  if (key && isStudioMockupKey(key, tenantSlug)) {
    return { ok: true, reason: 'studio_key_pattern' }
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
 * Valida un array de URLs de imagen de producto, devolviendo la primera que
 * no pasa el gate (o null si todas pasan). `existingUrls` son URLs que el
 * producto ya tenía antes de este PUT — nunca se re-validan (no romper
 * productos legacy al editar otros campos).
 */
export async function findFirstDisallowedProductImage(
  tenantId: string,
  tenantSlug: string,
  images: string[],
  existingUrls: string[] = [],
): Promise<string | null> {
  const existing = new Set(existingUrls)
  for (const url of images) {
    if (existing.has(url)) continue
    const result = await isOwnMockupUrl(tenantId, tenantSlug, url)
    if (!result.ok) return url
  }
  return null
}
