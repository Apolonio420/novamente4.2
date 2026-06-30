// Precio "anchor" (precio antes, tachado) para el catálogo propio de Novamente.
// SOLO display: el precio real NO cambia y NO se toca la base de datos. Mostramos
// un "precio antes" un poco más alto, tachado y chiquito arriba del real, para dar
// sensación de descuento. Aplica únicamente al catálogo Novamente (/products),
// no a las tiendas de partners.
export const ANCHOR_MARKUP_PCT = 0.25 // +25% (sutil)

/**
 * Recibe un precio ya formateado ("$28.600") y devuelve el anchor formateado
 * ("$35.750"), redondeado a la decena de $50 más cercana. Devuelve null si no
 * se puede parsear (para no romper el render).
 */
export function anchorPriceLabel(priceStr: string | null | undefined): string | null {
  if (!priceStr) return null
  const n = parseInt(String(priceStr).replace(/[^0-9]/g, ''), 10)
  if (!n || Number.isNaN(n)) return null
  const rounded = Math.round((n * (1 + ANCHOR_MARKUP_PCT)) / 50) * 50
  if (rounded <= n) return null
  return `$${rounded.toLocaleString('es-AR')}`
}
