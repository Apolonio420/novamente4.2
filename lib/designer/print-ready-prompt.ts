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

const BASE_RULES = `This is a print-ready apparel graphic, not a mockup, not a poster, and not a garment photo. The artwork must be isolated and suitable for DTG/DTF printing. Do not show a hoodie, t-shirt, model, hanger, or mockup. Use transparent background whenever possible. If transparency is not supported, use a flat chroma background color such as #00FF00 or #FF00FF, and do not use that color anywhere inside the artwork. Do not rely on a black, white, or colored background for visibility. All important shapes, typography, smoke, shadows, clothing, hair, ornaments, and textures must remain visible on the intended garment color.`

const DARK_RULES = `IMPORTANT FOR BLACK / DARK GARMENT PRINTING: The artwork is intended for a black or dark garment. Do not use a solid black background. Do not rely on black as the outer edge of important shapes. Dark elements such as black clothing, hats, hair, shadows, cars, buildings, smoke or typography must have visible separation using aged ivory, smoke gray, ash gray, off-white rim light, contour lines or subtle highlights. Black may only be used as internal shading, never as the only defining silhouette. The design must remain readable when placed on black fabric.`

const LIGHT_RULES = `IMPORTANT FOR WHITE / CREAM / LIGHT GARMENT PRINTING: The artwork is intended for a white, cream or light garment. Do not rely on white areas as the only visible shapes. Avoid white typography, smoke, highlights or ornaments without dark outline. All light details must be contained by dark linework, charcoal outlines, engraving lines or defined shading. The design must remain readable on a white or cream garment without needing a colored background.`

const AUTO_RULES = `UNIVERSAL PRINT SAFETY RULE: The artwork must work on both dark and light garments. Use a closed or semi-closed composition, badge, emblem, patch, sticker-style contour or visible outer keyline around the full artwork. Use both light and dark internal contrast so the design remains readable on black, white, cream and colored garments. Avoid relying on pure black or pure white as the only edge of any important element.`

const TYPOGRAPHY_RULES = `Typography must be clean, readable, centered and correctly spelled. If the text is light and the garment is light, add a dark outline or shadow. If the text is dark and the garment is dark, add a light outline or rim highlight. Do not create white letters without outline for light garments. Do not create black letters without outline for dark garments. Avoid very thin typography that may disappear in print.`

const NEGATIVE_RULES = `Negative rules: No mockup. No garment. No hoodie. No t-shirt. No model wearing the design. No hanger. No black rectangle. No white rectangle. No poster background. No textured background that needs to be removed. No pure black silhouette without outline. No white letters without outline on light garments. No black letters without outline on dark garments. No tiny unreadable typography. No watermark. No extra logos.`

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

  // 1) prompt del user — primero, para que sea el núcleo creativo
  blocks.push(userPrompt.trim())

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

  // 6) reglas negativas — al final
  blocks.push(NEGATIVE_RULES)

  return blocks.join("\n\n")
}
