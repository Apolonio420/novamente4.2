/**
 * Politica de productos del catalogo partner.
 *
 * Los partners solo pueden vender prendas producidas por Novamente. No esta
 * permitido subir productos que el partner haya producido por su cuenta o que
 * no formen parte del catalogo Novamente (toallones, ropa de cama, accesorios
 * no textiles, etc.).
 *
 * Esta validacion se aplica en el POST/PUT del API de catalog del partner.
 * Si un producto existente no pasa la validacion, sigue visible (legacy) pero
 * cualquier UPDATE puede revalidarlo si se ajusta el endpoint.
 */

/** Categorias permitidas — corresponden al catalogo Novamente. */
export const ALLOWED_PARTNER_CATEGORIES = [
  // T-shirts / Remeras
  "Remera Oversize",
  "Remera Classic",
  "Remera Classic Fit",
  "Remera Mujer",
  "Remera Crop",
  "Remera Crop Mujer",
  "Musculosa",
  // Sweatshirts / Buzos
  "Hoodie",
  "Buzo Hoodie",
  "Buzo Hoodie Oversize",
  "Buzo Crewneck",
  "Buzo Cuello Redondo",
  // Otros
  "Arte",
  "Lienzo",
] as const

const ALLOWED_SET = new Set<string>(ALLOWED_PARTNER_CATEGORIES.map(c => c.toLowerCase()))

/**
 * Keywords prohibidos en name o description — productos que claramente NO son
 * indumentaria Novamente. Si alguno aparece, se rechaza la creacion.
 */
const FORBIDDEN_KEYWORDS = [
  "toallon",
  "toallón",
  "toalla",
  "frazada",
  "manta",
  "sabana",
  "sábana",
  "almohada",
  "funda",
  "alfombra",
  "cortina",
  "mantel",
  "pantalon",
  "pantalón",
  "jean",
  "short",
  "vestido",
  "pollera",
  "falda",
  "bermuda",
  "calzoncillo",
  "bombacha",
  "ropa interior",
  "boxer",
  "calza",
  "leggings",
  "zapatilla",
  "zapato",
  "ojota",
  "sandalia",
  "bota",
  "cartera",
  "mochila",
  "billetera",
  "rinonera",
  "riñonera",
  "tote bag",
  "totebag",
  "gorra",
  "gorro",
  "sombrero",
  "boina",
  "campera",
  "chaqueta",
  "chaleco",
  "blazer",
  "saco",
  "tapado",
  "abrigo",
  "kimono",
  "bata",
  "pijama",
]

export interface ProductPolicyValidation {
  ok: boolean
  reason?: string
}

export function validatePartnerProductForCreation(input: {
  name: string
  description?: string
  category?: string
}): ProductPolicyValidation {
  const name = (input.name || "").toLowerCase()
  const description = (input.description || "").toLowerCase()
  const category = (input.category || "").toLowerCase().trim()

  // 1. Category, si esta presente, debe estar en allowlist
  if (category && !ALLOWED_SET.has(category)) {
    return {
      ok: false,
      reason: `La categoria "${input.category}" no esta permitida. Solo se pueden vender prendas del catalogo Novamente. Categorias validas: ${ALLOWED_PARTNER_CATEGORIES.join(", ")}.`,
    }
  }

  // 2. Detectar keywords prohibidos en name o description
  const haystack = `${name} ${description}`
  for (const kw of FORBIDDEN_KEYWORDS) {
    // Match con word boundary aproximado (start/end o whitespace alrededor)
    const re = new RegExp(`(^|\\W)${kw}(\\W|$)`, "i")
    if (re.test(haystack)) {
      return {
        ok: false,
        reason: `El producto contiene "${kw}" en el nombre o descripcion. Solo se pueden vender prendas producidas por Novamente (remeras, hoodies, buzos, musculosas, lienzos). Contactanos si tu producto deberia estar permitido.`,
      }
    }
  }

  return { ok: true }
}
