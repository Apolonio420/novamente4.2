/**
 * Aldea clásica: la variante de color con key `stone-wash` se muestra al
 * público como "Wash Azul" (decisión Juan 04/11/2026).
 *
 * Qué NO cambia: la key `stone-wash`, el id `aldea-tshirt-stone-wash`, los
 * paths de imágenes, std-bases y garment-mappings. Aura, Berlin y Boston siguen
 * mostrando "Stone Wash". Por eso el label se resuelve por (prenda, color) y no
 * solo por color.
 *
 * "Stone Wash" sigue entendiéndose como alias legacy (pedidos y carritos viejos).
 */

export const ALDEA_GARMENT_KEY = 'aldea-classic-tshirt'
export const STONE_WASH_COLOR_KEY = 'stone-wash'
export const WASH_AZUL_LABEL = 'Wash Azul'

/** Imagen de la tabla de medidas de la "clásica especial" Wash Azul. */
export const WASH_AZUL_SIZE_CHART_IMAGE = '/products/tshirt-aldea-wash-azul-medidas.webp'

export type SizeChartData = { sizes: string[]; width: string[]; length: string[] }

/** Ancho de pecho (axila a axila) y largo, en cm. Fuente: tabla oficial Juan 04/11. */
export const WASH_AZUL_SIZE_CHART: SizeChartData = {
  sizes: ['S', 'M', 'L', 'XL', '2XL'],
  width: ['56', '58', '60', '63', '66'],
  length: ['72', '74', '76', '78', '80'],
}

function norm(v: string | null | undefined): string {
  return (v ?? '').trim().toLowerCase().replace(/[\s_]+/g, '-')
}

/** ¿Es la Aldea clásica en color stone-wash / wash azul (key o nombre visible)? */
export function isAldeaWashAzul(garmentKey: string | null | undefined, colorKey: string | null | undefined): boolean {
  if (garmentKey !== ALDEA_GARMENT_KEY) return false
  const c = norm(colorKey)
  return c === STONE_WASH_COLOR_KEY || c === 'wash-azul'
}

/**
 * Label visible de un color. Override: Aldea + stone-wash => "Wash Azul".
 * Para cualquier otra combinación devuelve `fallback` (el label que ya usaba
 * el mapa compartido).
 */
export function colorLabelFor(
  garmentKey: string | null | undefined,
  colorKey: string,
  fallback: string,
): string {
  return isAldeaWashAzul(garmentKey, colorKey) ? WASH_AZUL_LABEL : fallback
}

/**
 * Alias de entrada: "wash azul" / "wash-azul" / "wash_azul" (y el legacy
 * "stone wash") => key `stone-wash`, SOLO para la Aldea. Para otra prenda (o un
 * color que no es alias) devuelve `raw` sin tocar.
 */
export function resolveAldeaColorAlias(garmentKey: string | null | undefined, raw: string): string {
  if (garmentKey === ALDEA_GARMENT_KEY && isAldeaWashAzul(garmentKey, raw)) return STONE_WASH_COLOR_KEY
  return raw
}

/** Tabla de talles: Wash Azul tiene la suya; el resto devuelve `base` sin cambios. */
export function sizeChartFor<T extends SizeChartData>(
  garmentKey: string | null | undefined,
  colorKey: string | null | undefined,
  base: T,
): T | SizeChartData {
  return isAldeaWashAzul(garmentKey, colorKey) ? WASH_AZUL_SIZE_CHART : base
}

/** Imagen de medidas: la de Wash Azul para ese color; el resto `base`. */
export function sizeChartImageFor(
  garmentKey: string | null | undefined,
  colorKey: string | null | undefined,
  base: string,
): string {
  return isAldeaWashAzul(garmentKey, colorKey) ? WASH_AZUL_SIZE_CHART_IMAGE : base
}
