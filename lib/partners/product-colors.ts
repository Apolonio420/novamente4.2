/**
 * Helpers puros de color para productos de partner.
 *
 * Por qué (01/10, caso la-blancq): el compositor (`from-design`) escribía
 * `metadata.colors` como `{ key, images }`, SIN `name`/`hex` — la PDP pública
 * exige `name` para mostrar el selector, así que ese producto quedaba "sin
 * colores" a ojos del comprador y el carrito terminaba con `color: ""`.
 * Esta pieza centraliza la lectura/escritura de `metadata.colors` para que
 * el alta (from-design), la lectura (PDP) y la validación de publicación
 * (panel + API) compartan la MISMA noción de "este producto tiene color".
 *
 * Sin dependencias de React/Next — todo acá es testeable con vitest puro.
 */
import { getCatalogProduct, getCatalogProductColor } from '@/lib/catalog/products'

export interface PartnerColorImages {
  front?: string
  back?: string
}

export interface PartnerColorEntry {
  key: string
  name: string
  hex: string
  images: PartnerColorImages
}

/**
 * Arma una entrada de `metadata.colors[]` resolviendo `name`/`hex` desde el
 * catálogo (lib/catalog/products.ts) a partir de `garmentKey` + `colorKey`.
 * Usado al crear productos desde el compositor — así `metadata.colors` nunca
 * vuelve a quedar solo con `key` (bug la-blancq).
 *
 * Si el color no matchea el catálogo (no debería pasar — ya se valida antes
 * contra `catalogProduct.colors` en el caller), cae a `key` tal cual como
 * `name` en vez de esconder el color por completo.
 */
export function buildPartnerColorEntry(
  garmentKey: string,
  colorKey: string,
  images: PartnerColorImages,
): PartnerColorEntry {
  const catalogColor = getCatalogProductColor(garmentKey, colorKey)
  return {
    key: colorKey,
    name: catalogColor?.name ?? colorKey,
    hex: catalogColor?.hex ?? '#000000',
    images,
  }
}

export interface ParsedPartnerColor {
  name: string
  code: string
  /** `key` interno (ej. "stone-wash") cuando la entrada lo trae — permite matchear
   *  por key además de por name (lo usa lib/checkout/partner-items.ts). */
  key?: string
  images?: PartnerColorImages
}

/**
 * Normaliza `metadata.colors` (o el legacy `metadata.available_colors`) a la
 * forma que consumen la PDP / AddToCartButtons: `{ name, code, images? }[]`.
 *
 * Acepta tres formatos históricos:
 *  - `{ name, hex|code, images? }` — formato "rico" (panel manual, y
 *    from-design desde el fix de `buildPartnerColorEntry`).
 *  - `{ key, images }` SIN `name` — formato roto de from-design pre-fix. Se
 *    resuelve `name`/`hex` desde el catálogo vía `garmentKey`; si ni así
 *    matchea, se usa el `key` tal cual como nombre (mejor eso que ocultar el
 *    color).
 *  - `available_colors`: `{ name, code }[]` legacy.
 */
export function parsePartnerProductColors(
  garmentKey: string | undefined | null,
  rawColors: unknown,
  legacyColors?: unknown,
): ParsedPartnerColor[] {
  if (Array.isArray(rawColors) && rawColors.length > 0) {
    const parsed = rawColors
      .map((c: unknown): ParsedPartnerColor | null => {
        if (!c || typeof c !== 'object') return null
        const entry = c as Record<string, unknown>
        const images =
          entry.images && typeof entry.images === 'object'
            ? {
                front:
                  typeof (entry.images as Record<string, unknown>).front === 'string' &&
                  (entry.images as Record<string, unknown>).front
                    ? ((entry.images as Record<string, unknown>).front as string)
                    : undefined,
                back:
                  typeof (entry.images as Record<string, unknown>).back === 'string' &&
                  (entry.images as Record<string, unknown>).back
                    ? ((entry.images as Record<string, unknown>).back as string)
                    : undefined,
              }
            : undefined

        const key = typeof entry.key === 'string' && entry.key.trim() ? entry.key : undefined

        if (typeof entry.name === 'string' && entry.name.trim()) {
          const code =
            (typeof entry.hex === 'string' && entry.hex) ||
            (typeof entry.code === 'string' && entry.code) ||
            '#000000'
          return { name: entry.name, code, key, images }
        }

        // Legacy "solo key" (bug from-design, la-blancq): resolver desde el
        // catálogo si hay garmentKey; si no matchea (o no hay garmentKey para
        // consultar), usar el key tal cual como nombre — mejor eso que ocultar
        // el color por completo.
        if (key) {
          const catalogColor = garmentKey ? getCatalogProductColor(garmentKey, key) : undefined
          if (catalogColor) return { name: catalogColor.name, code: catalogColor.hex, key, images }
          return { name: key, code: '#000000', key, images }
        }
        return null
      })
      .filter((c): c is ParsedPartnerColor => c !== null)
    if (parsed.length > 0) return parsed
  }

  if (Array.isArray(legacyColors) && legacyColors.length > 0) {
    return legacyColors.filter(
      (c): c is ParsedPartnerColor => !!c && typeof c === 'object' && typeof (c as any).name === 'string' && (c as any).name.trim(),
    )
  }

  return []
}

/**
 * Color inicial a preseleccionar en el picker (AddToCartButtons / galería).
 *
 * Regla (01/10): con 1 solo color se usa automáticamente — no tiene sentido
 * preguntar. Con MÁS de 1 color, NO se preselecciona nada: el comprador tiene
 * que tocar un swatch a propósito (antes se preseleccionaba el primero o el
 * de `defaultColor`, y como el picker puede no notarse, el pedido salía con
 * el color "elegido" sin que el cliente lo haya mirado). Sin colors[] definidos
 * se mantiene el comportamiento viejo: `defaultColor` (metadata.color singular)
 * o nada.
 */
export function resolveInitialSelectedColor(
  availableColors: { name: string }[] | undefined | null,
  defaultColor?: string | null,
): string {
  if (availableColors && availableColors.length === 1) return availableColors[0].name
  if (availableColors && availableColors.length > 1) return ''
  return defaultColor || ''
}

/** True si, habiendo colores para elegir, el comprador necesita elegir uno (no alcanza con 0 o 1 opción). */
export function requiresColorSelection(availableColors?: { name: string }[] | null): boolean {
  return !!availableColors && availableColors.length > 1
}

/** True si corresponde bloquear "Agregar"/"Comprar" porque falta elegir color. */
export function isColorSelectionMissing(
  availableColors: { name: string }[] | undefined | null,
  selectedColor: string | undefined | null,
): boolean {
  return requiresColorSelection(availableColors) && !(selectedColor && selectedColor.trim())
}

// ---------------------------------------------------------------------------
// Validación de publicación (panel + API) — "¿esta prenda exige color?"
// ---------------------------------------------------------------------------

/**
 * True si la prenda del catálogo (garmentKey) tiene colores definidos y por
 * lo tanto el partner tiene que elegir al menos uno antes de publicar. Prendas
 * sin colores en el catálogo (láminas, lienzos, accesorios) no lo exigen.
 */
export function garmentRequiresColorChoice(garmentKey: string | null | undefined): boolean {
  if (!garmentKey) return false
  const product = getCatalogProduct(garmentKey)
  return !!product && product.colors.length > 0
}

/**
 * True si el producto YA tiene algún dato de color cargado, en cualquiera de
 * los 3 formatos que coexisten hoy: `metadata.colors[]` (rico o legacy "solo
 * key"), `metadata.available_colors` legacy, o `metadata.color` singular.
 */
export function productHasColorInfo(metadata: Record<string, unknown> | null | undefined): boolean {
  if (!metadata) return false
  const colors = metadata.colors
  if (Array.isArray(colors)) {
    const hasUsable = colors.some((c) => {
      if (!c || typeof c !== 'object') return false
      const entry = c as Record<string, unknown>
      return (typeof entry.name === 'string' && entry.name.trim()) || (typeof entry.key === 'string' && entry.key.trim())
    })
    if (hasUsable) return true
  }
  const legacy = metadata.available_colors
  if (Array.isArray(legacy) && legacy.length > 0) return true
  if (typeof metadata.color === 'string' && metadata.color.trim()) return true
  return false
}
