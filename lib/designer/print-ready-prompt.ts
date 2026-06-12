/**
 * buildPrintReadyPrompt
 *
 * Capa global para diseños print-ready DTG/DTF.
 * Toma el prompt raw del user + el color de prenda y le inyecta reglas
 * de contraste, separación de bordes y readability para que el diseño
 * no se rompa al estamparse.
 *
 * Se invoca antes de pasar el prompt al modelo de generación (Gemini NB2)
 * cuando el flag `raw: true` viene del nuevo flow de /crear.
 */

export type PrintGarmentColor = "black" | "dark" | "white" | "cream" | "light" | "auto"

const COLOR_TO_PRINT_CATEGORY: Record<string, PrintGarmentColor> = {
  // dark
  negro: "black", black: "black", "stone-wash": "dark", stone_wash: "dark",
  marron: "dark", marrón: "dark", brown: "dark", gris: "dark", gray: "dark", grey: "dark",
  // light
  blanco: "white", white: "white", crema: "cream", cream: "cream",
  caramel: "light", caramelo: "light",
}

export function normalizeGarmentColor(color: string | undefined | null): PrintGarmentColor {
  if (!color) return "auto"
  const k = color.toLowerCase().replace(/\s+/g, "-")
  return COLOR_TO_PRINT_CATEGORY[k] ?? "auto"
}

// NOTA: NO pedir "transparent background" — Gemini no genera alpha real y lo
// FINGE pintando un patrón de cuadriculado gris como píxeles (quedaba impreso
// en la prenda). Pedimos fondo BLANCO PURO sólido y lo removemos server-side
// con flood-fill (ver removeWhiteBackground en /api/generate-image).
const BASE_RULES = `This is a print-ready apparel graphic, not a mockup, not a poster, and not a garment photo. The artwork must be isolated and suitable for DTG/DTF printing. Do not show a hoodie, t-shirt, model, hanger, or mockup. ALWAYS place the isolated artwork on a plain SOLID PURE WHITE background (#FFFFFF). NEVER draw a checkerboard or transparency pattern — the background must be uniform flat white with no texture. Do not rely on the background for visibility. All important shapes, typography, smoke, shadows, clothing, hair, ornaments, and textures must remain visible on the intended garment color.`

const DARK_RULES = `IMPORTANT FOR BLACK / DARK GARMENT PRINTING: The artwork is intended for a black or dark garment. Do not use a solid black background. Do not rely on black as the outer edge of important shapes. Dark elements such as black clothing, hats, hair, shadows, cars, buildings, smoke or typography must have visible separation using aged ivory, smoke gray, ash gray, off-white rim light, contour lines or subtle highlights. Black may only be used as internal shading, never as the only defining silhouette. The design must remain readable when placed on black fabric.`

const LIGHT_RULES = `IMPORTANT FOR WHITE / CREAM / LIGHT GARMENT PRINTING: The artwork is intended for a white, cream or light garment. Do not rely on white areas as the only visible shapes. Avoid white typography, smoke, highlights or ornaments without dark outline. All light details must be contained by dark linework, charcoal outlines, engraving lines or defined shading. The design must remain readable on a white or cream garment without needing a colored background.`

const AUTO_RULES = `UNIVERSAL PRINT SAFETY RULE: The artwork must work on both dark and light garments. Use a closed or semi-closed composition, badge, emblem, patch, sticker-style contour or visible outer keyline around the full artwork. Use both light and dark internal contrast so the design remains readable on black, white, cream and colored garments. Avoid relying on pure black or pure white as the only edge of any important element.`

const TYPOGRAPHY_RULES = `Typography must be clean, readable, centered and correctly spelled. If the text is light and the garment is light, add a dark outline or shadow. If the text is dark and the garment is dark, add a light outline or rim highlight. Do not create white letters without outline for light garments. Do not create black letters without outline for dark garments. Avoid very thin typography that may disappear in print.`

const NEGATIVE_RULES = `Negative rules: No mockup. No garment. No hoodie. No t-shirt. No model wearing the design. No hanger. No black rectangle. No white rectangle. No poster background. No textured background that needs to be removed. No pure black silhouette without outline. No white letters without outline on light garments. No black letters without outline on dark garments. No tiny unreadable typography. No watermark. No extra logos.`

// Regla anti-split-canvas: el modelo a veces divide la imagen en dos paneles
// (design isolated + design on hoodie) cuando el user prompt menciona la
// prenda. Va al final para maximo peso por recency bias.
const SINGLE_PANEL_RULE = `CRITICAL OUTPUT FORMAT: Output ONE single artwork only. Do NOT split the image into multiple panels, side-by-side comparisons, before/after layouts, diptychs or grids. Do NOT show the artwork twice (once isolated, once on a garment). Do NOT include any garment (hoodie, t-shirt, sweatshirt, buzo, remera, crop, tank, vest, hanger) anywhere in the output, even as a secondary element or thumbnail. The output must be a single isolated graphic. If the user prompt mentions a garment ("para buzo", "para remera", "for a hoodie", "on a t-shirt", "para hoodie"), treat that as TARGET INTENT only — generate ONLY the standalone artwork suitable for printing on that garment, never the garment itself.`

// Regla dura anti-texto: Gemini agrega texto literal cuando el prompt
// describe estilos como "estetica lujo salvaje 2026", "vibe noir 80s", etc.
// Lo interpreta como TEXTO a estampar. Bloqueamos a menos que el user
// pida texto explicitamente.
const NO_TEXT_RULE = `CRITICAL: Do NOT include any text, words, letters, typography, numbers, dates, brand names, slogans, titles, captions or written language anywhere in the artwork. No fake brands, no "EST 2026", no taglines. The user did not request text. Style/aesthetic descriptors in the prompt (like "luxury 2026", "noir 80s", "vintage", "estetica X") describe the VISUAL MOOD ONLY and must NEVER appear as written text in the output. Output a purely visual / pictorial illustration with zero readable characters.`

// Cues que indican que el user SI quiere texto en el diseño
const TEXT_INTENT_RX =
  /\b(con\s+texto|que\s+diga|que\s+ponga|tipografi[aá]|tipografia|letras?|letrero|frase|palabra|texto\s+que\s+diga|que\s+lea|lettering|typography|text\s+that\s+says|word\s+that\s+says|slogan|tag\s*line|titulo|t[ií]tulo|escrito|leyenda|caption|cita|quote|name|nombre|firma|signature|escribir|escribilo|escribime)\b/i

// ============================================================
// sanitizeUserPrompt
// Quita frases del prompt del usuario que el modelo suele interpretar
// literalmente como "agrega la prenda al output". Conserva el contenido
// creativo pero elimina referencias directas a "para buzo negro", "para
// remera blanca", "en hoodie", etc.
// ============================================================
export function sanitizeUserPrompt(prompt: string): string {
  if (!prompt) return prompt
  let cleaned = prompt
  // Patron: "para <prenda> [color]" / "en <prenda> [color]" / "sobre <prenda>"
  const garmentWord =
    "(buzo|remera|hoodie|t-?shirt|tee|sweat(shirt)?|crewneck|crop(\\s+top)?|musculosa|tank(\\s+top)?|camiseta|playera|chomba|chompa|sudadera|camisa)"
  const colorWord =
    "(?:\\s+(negro|negra|blanco|blanca|gris|crema|stone[-\\s]?wash|caramel|caramelo|marron|marrón|rojo|roja|azul|verde|amarillo))?"
  // "para buzo negro" / "en hoodie" / "sobre remera blanca"
  const patterns = [
    new RegExp(`\\b(para|en|sobre|en\\s+una|para\\s+un|para\\s+una|en\\s+un)\\s+${garmentWord}${colorWord}\\b`, "gi"),
    new RegExp(`\\b(for|on)\\s+(a\\s+|an\\s+|the\\s+)?${garmentWord}${colorWord}\\b`, "gi"),
    // "composicion para buzo" / "diseño para hoodie"
    new RegExp(`\\b(composici[oó]n|dise[ñn]o|estampa|artwork|design)\\s+(para|for)\\s+${garmentWord}${colorWord}\\b`, "gi"),
  ]
  for (const re of patterns) cleaned = cleaned.replace(re, "").trim()
  // Limpiar comas/puntos sueltos que quedan tras la remocion
  cleaned = cleaned
    .replace(/\s*,\s*,/g, ",")
    .replace(/\s+,/g, ",")
    .replace(/,\s*\./g, ".")
    .replace(/\s{2,}/g, " ")
    .replace(/^[\s,;.]+/, "")
    .replace(/[\s,;]+$/, "")
  return cleaned
}

// Estilos oscuros — refuerzan reglas anti-disappearing-on-dark
const DARK_STYLE_REGEX =
  /\b(mafia|noir|dark|black|gothic|grunge|metal|horror|skull|skulls|smoke|shadow|gangster|vintage)\b/i

const DARK_STYLE_BOOST = `Because this is a dark / noir / high-shadow design, every black or very dark element must have printable edge separation. Add rim lighting, ivory contour, gray engraving lines or distressed light outlines around important shapes so the design does not disappear on dark fabric.`

export type PrintReadyOptions = {
  /** Color de la prenda destino — determina qué bloque de reglas inyectar */
  garmentColor?: PrintGarmentColor | string
  /** Si true, agrega reglas extra para estilos noir/dark detectados en el prompt */
  reinforceDarkStyles?: boolean
}

export function buildPrintReadyPrompt(
  userPrompt: string,
  options: PrintReadyOptions = {},
): string {
  const garment = normalizeGarmentColor(
    typeof options.garmentColor === "string"
      ? options.garmentColor
      : (options.garmentColor ?? "auto"),
  )

  const blocks: string[] = []

  // 0) sanitizar — quitar "para buzo negro" y similares que el modelo
  //    interpreta literal y termina renderizando la prenda en el output.
  const sanitized = sanitizeUserPrompt(userPrompt)

  // 1) prompt del user (limpio) — primero, para que sea el núcleo creativo
  blocks.push(sanitized.trim())

  // 2) reglas base obligatorias
  blocks.push(BASE_RULES)

  // 3) regla específica de color de prenda
  if (garment === "black" || garment === "dark") {
    blocks.push(DARK_RULES)
  } else if (garment === "white" || garment === "cream" || garment === "light") {
    blocks.push(LIGHT_RULES)
  } else {
    blocks.push(AUTO_RULES)
  }

  // 4) tipografía
  blocks.push(TYPOGRAPHY_RULES)

  // 5) refuerzo para estilos oscuros detectados en el prompt
  const isDarkStylePrompt =
    (options.reinforceDarkStyles ?? true) && DARK_STYLE_REGEX.test(userPrompt)
  if (isDarkStylePrompt) blocks.push(DARK_STYLE_BOOST)

  // 6) reglas negativas
  blocks.push(NEGATIVE_RULES)

  // 7) Si el user NO pidio texto explicito, agregar regla dura anti-texto.
  //    Si pidio texto, dejamos las TYPOGRAPHY_RULES manejar el caso.
  const userWantsText = TEXT_INTENT_RX.test(sanitized) || TEXT_INTENT_RX.test(userPrompt)
  if (!userWantsText) {
    blocks.push(NO_TEXT_RULE)
  }

  // 8) regla critica de output format (single panel, no garment) — al final
  //    para maximo peso por recency bias del modelo
  blocks.push(SINGLE_PANEL_RULE)

  return blocks.join("\n\n")
}
