/**
 * Fase 3 pieza E3 — regla "frente y dorso siempre": para publicar, un
 * producto necesita minimo 2 imagenes (frente y dorso), y si tiene
 * `metadata.colors[]` cada color necesita front Y back (no alcanza con una
 * sola cara global si el partner cargo colores por separado).
 *
 * Aplica en la transicion a `published` (POST/PUT de catalogo, y en
 * from-design cuando pide status:'published' directo) — igual criterio que
 * el resto del publish gate: no rompe ediciones de precio/nombre de
 * productos legacy que ya estaban publicados con una sola cara (esos se
 * re-validan solo si el partner vuelve a tocar imagenes o re-publica, ver
 * needsPublishedProductValidation en lib/partners/variants.ts).
 */

export const MISSING_SIDES_ERROR =
  "Subí frente y dorso: si el dorso es liso, usá 'Dorso liso' y lo generamos"

export interface ProductColorImages {
  images?: { front?: unknown; back?: unknown } | null
  [key: string]: unknown
}

/**
 * `images`: array de imagenes del producto (`partner_products.images`).
 * `colors`: `metadata.colors[]` si el producto tiene colores separados.
 */
export function validateFrontAndBackForPublish(
  images: unknown,
  colors: unknown,
): { ok: boolean; reason?: string } {
  const imgs = Array.isArray(images) ? images.filter((u) => typeof u === 'string' && u) : []
  if (imgs.length < 2) {
    return { ok: false, reason: MISSING_SIDES_ERROR }
  }

  if (Array.isArray(colors) && colors.length > 0) {
    for (const color of colors as ProductColorImages[]) {
      const front = color?.images?.front
      const back = color?.images?.back
      if (!front || !back) {
        return { ok: false, reason: MISSING_SIDES_ERROR }
      }
    }
  }

  return { ok: true }
}
