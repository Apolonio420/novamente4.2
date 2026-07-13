/**
 * Formateo de precios en ARS. Extraido de garment-pricing.ts para que los
 * componentes cliente puedan formatear precios (ya derivados server-side, sin
 * `cost` crudo) sin tener que importar el modulo que contiene el catalogo de
 * costos de produccion. Ver hallazgo [1] de docs/reviews/REVIEW-caminos-de-plata-2026-07-03.md.
 */
export function formatPrice(amount: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}
