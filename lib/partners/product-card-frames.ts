/**
 * Fase 3 pieza E1 — de qué imágenes sale el frente/dorso de una card de
 * tienda. `images[]` es lo que hoy lee `ProductCardImage` (front=[0],
 * back=[1]), pero los productos creados por `from-design` (pieza B) solo
 * ponen ahí el PRIMER color: el resto de los colores vive en
 * `metadata.colors[].images.front/back` y nunca llega a la card si `images[]`
 * quedó con 1 sola foto (ver hallazgo de la auditoría, pieza E1).
 *
 * Esta función es pura (sin React, sin fetch) para poder testearla con
 * vitest: dado `images` + `metadata`, devuelve las 2 URLs a mostrar (o 1 si
 * no hay dorso real en ningún lado).
 */

export interface ProductCardFramesInput {
  images?: string[] | null
  metadata?: {
    colors?: Array<{ key?: string; name?: string; images?: { front?: string; back?: string } }>
  } | null
}

export interface ProductCardFrames {
  front: string | null
  back: string | null
  /** true si hay una segunda cara real distinta de la primera. */
  hasBack: boolean
}

export function resolveCardFrames(product: ProductCardFramesInput): ProductCardFrames {
  const images = (product.images || []).filter((u): u is string => !!u)

  if (images.length >= 2 && images[0] !== images[1]) {
    return { front: images[0], back: images[1], hasBack: true }
  }

  const front = images[0] || null

  // Sin dorso en `images[]`: buscar el color cuyo frente matchea la portada
  // (o el primero con datos) en metadata.colors.
  const colors = product.metadata?.colors || []
  const matching =
    colors.find((c) => c.images?.front && c.images.front === front) || colors[0] || null

  const back = matching?.images?.back || null
  const resolvedFront = front || matching?.images?.front || null

  if (back && resolvedFront && back !== resolvedFront) {
    return { front: resolvedFront, back, hasBack: true }
  }

  return { front: resolvedFront, back: null, hasBack: false }
}
