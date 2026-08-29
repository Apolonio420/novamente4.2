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
  "Remera",
  "Remera Oversize",
  "Remera Classic",
  "Remera Classic Fit",
  "Remera Mujer",
  "Remera Crop",
  "Remera Crop Mujer",
  "Musculosa",
  // Sweatshirts / Buzos
  "Buzo",
  "Hoodie",
  "Buzo Hoodie",
  "Buzo Hoodie Oversize",
  "Buzo Crewneck",
  "Buzo Cuello Redondo",
  // Otros
  "Arte",
  // Bahía totebag — producto propio del catálogo (desbloqueada 29/08)
  "Totebag",
  "Tote Bag",
  "Accesorio",
  "Accesorios",
] as const

const ALLOWED_SET = new Set<string>(ALLOWED_PARTNER_CATEGORIES.map(c => c.toLowerCase()))

/**
 * Tokens raiz aceptados — si una categoria escrita por el partner contiene
 * alguno de estos como palabra (no como sustring arbitrario), se considera
 * valida. Esto es mas permisivo que el ALLOWED_SET exacto y evita falsos
 * negativos como "buzo" o "remera de verano" que claramente son del catalogo.
 */
const CATEGORY_ROOT_TOKENS = [
  "remera",
  "buzo",
  "hoodie",
  "musculosa",
  "crop",
  "arte",
  "totebag",
  "tote",
  "accesorio",
]

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
  // ("tote bag"/"totebag" salieron 29/08: la Bahía es producto PROPIO del catálogo
  // desde el 13/07 y este filtro — anterior a su alta — bloqueaba a los partners
  // publicar algo que nosotros mismos producimos. 1 sola tote en 502 productos.)
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

  // 1. Category, si esta presente: aceptar si esta en la allowlist exacta O si
  //    contiene alguno de los root tokens (remera, buzo, hoodie, etc.) como
  //    palabra. Esto permite categorias mas amplias como "buzo", "Remera de
  //    verano", "Hoodie unisex", etc. sin sobre-validar.
  if (category) {
    const isExactMatch = ALLOWED_SET.has(category)
    const tokens = category.split(/\s+/)
    const hasRootToken = tokens.some(t => CATEGORY_ROOT_TOKENS.includes(t)) ||
      CATEGORY_ROOT_TOKENS.some(root => category === root || category.startsWith(`${root} `) || category.endsWith(` ${root}`))
    if (!isExactMatch && !hasRootToken) {
      return {
        ok: false,
        reason: `La categoria "${input.category}" no esta permitida. Solo se pueden vender prendas del catalogo Novamente. Usa una categoria que contenga: ${CATEGORY_ROOT_TOKENS.join(", ")}.`,
      }
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
        reason: `El producto contiene "${kw}" en el nombre o descripcion. Solo se pueden vender prendas producidas por Novamente (remeras, hoodies, buzos, musculosas). Contactanos si tu producto deberia estar permitido.`,
      }
    }
  }

  return { ok: true }
}
