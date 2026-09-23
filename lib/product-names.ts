/**
 * Nombres descriptivos de prendas (cliente) vs. nombre de modelo (interno).
 *
 * Ver PLAN-NOMBRES-DESCRIPTIVOS.md — pedido de Juan (23/09/2026): que al
 * cliente se le muestre la prenda por LO QUE ES ("Remera oversize", "Buzo
 * con capucha"...) en vez del nombre de modelo (Aura, Aldea, Boston...).
 *
 * Los nombres de modelo NO se borran: siguen siendo el vocabulario interno
 * (ids, keys de catálogo, columnas de DB, fichas de producción, ads viejos)
 * y el bot/asistente los tiene que seguir ENTENDIENDO. Esta tabla es SOLO
 * para decidir qué se RENDERIZA al cliente — nunca cambia ids/keys/slugs.
 *
 * Reusa vocabulario de lib/orders/product-aliases.ts CANONICAL_PRODUCTS
 * donde coincide con la tabla del plan.
 */

export interface ProductNameEntry {
  /** Nombre de modelo interno (Aura, Aldea...) — para la línea secundaria "Modelo Aura". */
  modelo: string
  /** Nombre por lo que es la prenda, para mostrar al cliente. */
  descriptivo: string
}

/**
 * Forma mínima que necesita productDisplayName / lookupProductName. Acepta
 * lo que ya tengamos a mano (id de lib/products.ts, garmentType de
 * lib/catalog.ts / lib/catalog/products.ts, o simplemente el name actual)
 * — no hace falta tener las tres cosas.
 */
export interface ProductNameLookupInput {
  id?: string | null
  garmentType?: string | null
  name?: string | null
  color?: string | null
}

/**
 * Tabla canónica (ver PLAN-NOMBRES-DESCRIPTIVOS.md). El orden de
 * MATCH_ORDER importa: los tokens más específicos van primero para que
 * "buzo-cuello-redondo" no caiga en el match genérico de "buzo-hoodie", y
 * "remera-clasica-mujer" no caiga en el match genérico de "aldea".
 */
const CANONICAL_NAMES: Record<string, ProductNameEntry> = {
  'buzo-cuello-redondo': { modelo: 'Berlin', descriptivo: 'Buzo cuello redondo' },
  'buzo-hoodie': { modelo: 'Boston', descriptivo: 'Buzo hoodie oversize' },
  hoodie: { modelo: 'Boston', descriptivo: 'Buzo hoodie oversize' },
  'remera-clasica-mujer': { modelo: 'Buenos Aires', descriptivo: 'Remera clásica mujer' },
  'remera-crop': { modelo: 'Bahamas', descriptivo: 'Remera crop mujer' },
  'remera-infantil': { modelo: 'Bambino', descriptivo: 'Remera infantil' },
  bambino: { modelo: 'Bambino', descriptivo: 'Remera infantil' },
  'musculosa-bali': { modelo: 'Bali', descriptivo: 'Musculosa' },
  musculosa: { modelo: 'Bali', descriptivo: 'Musculosa' },
  bali: { modelo: 'Bali', descriptivo: 'Musculosa' },
  totebag: { modelo: 'Bahía', descriptivo: 'Totebag' },
  'tote-bag': { modelo: 'Bahía', descriptivo: 'Totebag' },
  bahia: { modelo: 'Bahía', descriptivo: 'Totebag' },
  aldea: { modelo: 'Aldea', descriptivo: 'Remera clásica' },
  aura: { modelo: 'Aura', descriptivo: 'Remera oversize' },
}

/** Orden de chequeo: del más específico al más genérico. */
const MATCH_ORDER = [
  'buzo-cuello-redondo',
  'buzo-hoodie',
  'hoodie',
  'remera-clasica-mujer',
  'remera-crop',
  'remera-infantil',
  'bambino',
  'musculosa-bali',
  'musculosa',
  'bali',
  'totebag',
  'tote-bag',
  'bahia',
  'aldea',
  'aura',
]

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
}

/**
 * Busca en la tabla canónica a partir de id / garmentType / name (lo que
 * haya disponible). Devuelve null si no matchea nada (partner DB products,
 * lienzos, gorras, totebag legacy sin key reconocible, etc.).
 */
export function lookupProductName(input: ProductNameLookupInput): ProductNameEntry | null {
  const haystacks = [input.id, input.garmentType, input.name]
    .filter((s): s is string => !!s)
    .map(normalize)
  if (haystacks.length === 0) return null

  for (const key of MATCH_ORDER) {
    if (haystacks.some((h) => h.includes(key))) {
      return CANONICAL_NAMES[key]
    }
  }
  return null
}

/**
 * Nombre de modelo interno (Aura, Aldea, Boston...) para la línea
 * secundaria "Modelo Aura". null si no hay match (no se muestra la línea).
 */
export function productModelName(input: ProductNameLookupInput): string | null {
  return lookupProductName(input)?.modelo ?? null
}

/**
 * Nombre para mostrar al cliente: descriptivo + color si viene, ej.
 * "Remera oversize - Blanco". Si no hay match en la tabla, cae a
 * input.name tal cual (fallback seguro para productos no mapeados:
 * partner DB products, lienzos, gorras...).
 */
export function productDisplayName(input: ProductNameLookupInput): string {
  const entry = lookupProductName(input)
  const base = entry ? entry.descriptivo : input.name ?? ''
  if (!base) return input.name ?? ''
  if (input.color) {
    // Evitar duplicar el color si por algún motivo ya viene en la base.
    if (normalize(base).includes(normalize(input.color))) return base
    return `${base} - ${input.color}`
  }
  return base
}
