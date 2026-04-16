/**
 * Novamente Prompt Optimizer
 * Transforms user prompts into textile-print-optimized prompts for Gemini image generation.
 *
 * Key behaviours:
 *  - Injects style keywords when a styleId is provided
 *  - Always forces vectorial output to prevent garments from appearing
 *  - Limits the final prompt to 400 characters
 *  - Adds textile-specific constraints (no garments, isolated design, transparent bg)
 *  - Generates 2 variant prompts with compatible styles
 *  - Auto-detects style from free-text prompt
 */

import type { GarmentColorway, PrintArea } from './types'
import {
  getStyleById,
  PRINT_AREAS,
  TEXTILE_COLOR_PALETTES,
  STYLE_DEFINITIONS,
} from './styles'

// ---------------------------------------------------------------------------
// Compatible style mapping (used for variant generation)
// ---------------------------------------------------------------------------

const COMPATIBLE_STYLES: Record<string, string[]> = {
  'minimalista-lineal': ['vectorial', 'line-art-tatuaje', 'brutalista-minimalista'],
  'line-art-tatuaje': ['minimalista-lineal', 'vectorial', 'manga-anime'],
  'sticker-style': ['pop-minimalista', 'cartoon', 'vectorial'],
  'manga-anime': ['line-art-tatuaje', 'manga-estilizado', 'chibi-3d'],
  'chibi-3d': ['manga-anime', 'cartoon', 'sticker-style'],
  'voxel-lego': ['pixel-art-retro', 'isometrico-futurista', 'conceptual-isometrico'],
  'isometrico-futurista': ['voxel-lego', 'conceptual-isometrico', 'geometrico-abstracto'],
  'vintage-poster': ['psicodelico', 'pop-minimalista', 'editorial-tipografia'],
  'geometrico-abstracto': ['isometrico-futurista', 'brutalista-minimalista', 'editorial-tipografia'],
  'psicodelico': ['vintage-poster', 'surreal-vectorial', 'neon-cyberpunk'],
  'collage-surrealista': ['surreal-vectorial', 'surrealista', 'vintage-poster'],
  'pop-minimalista': ['sticker-style', 'editorial-tipografia', 'brutalista-minimalista'],
  'pixel-art-retro': ['voxel-lego', 'retro-vaporwave', 'retro-cassette'],
  'grunge-distressed': ['tribal-etnico', 'brutalista-minimalista', 'cartoon-western'],
  'tribal-etnico': ['grunge-distressed', 'line-art-tatuaje', 'geometrico-abstracto'],
  'tipografico': ['editorial-tipografia', 'pop-minimalista', 'brutalista-minimalista'],
  'neon-cyberpunk': ['psicodelico', 'isometrico-futurista', '3d-translucido'],
  '3d-translucido': ['neon-cyberpunk', 'conceptual-isometrico', 'chibi-3d'],
  'conceptual-isometrico': ['3d-translucido', 'isometrico-futurista', 'voxel-lego'],
  'cartoon-western': ['grunge-distressed', 'cartoon', 'vintage'],
  'acuarela-digital': ['botanica-vintage', 'ghibli-like', 'vintage'],
  'brutalista-minimalista': ['minimalista-lineal', 'geometrico-abstracto', 'tipografico'],
  'botanica-vintage': ['acuarela-digital', 'vintage', 'line-art-tatuaje'],
  'surreal-vectorial': ['psicodelico', 'collage-surrealista', 'geometrico-abstracto'],
  'editorial-tipografia': ['tipografico', 'pop-minimalista', 'geometrico-abstracto'],
  'geometrico': ['minimalista-lineal', 'vectorial', 'geometrico-abstracto'],
  'vectorial': ['minimalista-lineal', 'geometrico', 'sticker-style'],
  'cartoon': ['manga-estilizado', 'ghibli-like', 'chibi-3d'],
  'manga-estilizado': ['cartoon', 'ghibli-like', 'manga-anime'],
  'ghibli-like': ['manga-estilizado', 'cartoon', 'acuarela-digital'],
  'vintage': ['minimalista-lineal', 'vectorial', 'botanica-vintage'],
  'surrealista': ['vintage', 'ghibli-like', 'collage-surrealista'],
  'retro-vaporwave': ['neon-cyberpunk', 'pixel-art-retro', 'retro-cassette'],
  'retro-cassette': ['retro-vaporwave', 'vintage', 'pop-minimalista'],
  'urbano-streetwear': ['grunge-distressed', 'pop-minimalista', 'neon-cyberpunk'],
  'acuarela-naturaleza': ['acuarela-digital', 'botanica-vintage', 'ghibli-like'],
  'acuarela-urbana': ['acuarela-digital', 'vintage', 'grunge-distressed'],
}

// ---------------------------------------------------------------------------
// Style detection patterns (regex -> styleId)
// ---------------------------------------------------------------------------

const STYLE_DETECTION_PATTERNS: Array<{ pattern: RegExp; styleId: string }> = [
  { pattern: /\b(tatuaje|tattoo|line art|linea|trazos)\b/i, styleId: 'line-art-tatuaje' },
  { pattern: /\b(sticker|pegatina|coleccionable)\b/i, styleId: 'sticker-style' },
  { pattern: /\b(manga|anime|japonés|japanese)\b/i, styleId: 'manga-anime' },
  { pattern: /\b(chibi|kawaii|mascota|cute)\b/i, styleId: 'chibi-3d' },
  { pattern: /\b(voxel|lego)\b/i, styleId: 'voxel-lego' },
  { pattern: /\b(pixel art|8-bit|retro gaming|pixelado)\b/i, styleId: 'pixel-art-retro' },
  { pattern: /\b(isométrico|isometric|futurista|futuristic)\b/i, styleId: 'isometrico-futurista' },
  { pattern: /\b(póster|poster|60s|70s)\b/i, styleId: 'vintage-poster' },
  { pattern: /\b(psicodélico|psychedelic|fractal|trippy)\b/i, styleId: 'psicodelico' },
  { pattern: /\b(vaporwave|synthwave|retrowave)\b/i, styleId: 'retro-vaporwave' },
  { pattern: /\b(cassette|casete|good vibes)\b/i, styleId: 'retro-cassette' },
  { pattern: /\b(collage|mixed media)\b/i, styleId: 'collage-surrealista' },
  { pattern: /\b(pop art|warhol|pop culture)\b/i, styleId: 'pop-minimalista' },
  { pattern: /\b(grunge|distressed|streetwear)\b/i, styleId: 'grunge-distressed' },
  { pattern: /\b(tribal|étnico|ethnic|cultural)\b/i, styleId: 'tribal-etnico' },
  { pattern: /\b(tipografía|typography|letras|lettering)\b/i, styleId: 'tipografico' },
  { pattern: /\b(neon|cyberpunk|glow|electric)\b/i, styleId: 'neon-cyberpunk' },
  { pattern: /\b(translúcido|translucent|vidrio|glass|gel)\b/i, styleId: '3d-translucido' },
  { pattern: /\b(conceptual|maqueta)\b/i, styleId: 'conceptual-isometrico' },
  { pattern: /\b(western|cowboy|caricatura|caricature)\b/i, styleId: 'cartoon-western' },
  { pattern: /\b(acuarela|watercolor)\b/i, styleId: 'acuarela-digital' },
  { pattern: /\b(brutalista|brutalist|crudo|raw)\b/i, styleId: 'brutalista-minimalista' },
  { pattern: /\b(botánica|botanical|plantas|flores|plants|flowers)\b/i, styleId: 'botanica-vintage' },
  { pattern: /\b(editorial|magazine|revista|layout)\b/i, styleId: 'editorial-tipografia' },
  { pattern: /\b(geométrico|geometric|abstracto|abstract)\b/i, styleId: 'geometrico-abstracto' },
  { pattern: /\b(surrealista|surreal|onírico|dreamlike)\b/i, styleId: 'surrealista' },
  { pattern: /\b(ghibli|studio ghibli)\b/i, styleId: 'ghibli-like' },
  { pattern: /\b(urban|urbano|callejero|street)\b/i, styleId: 'urbano-streetwear' },
  { pattern: /\b(cartoon|dibujo animado)\b/i, styleId: 'cartoon' },
  { pattern: /\b(vintage|retro|clásico|classic)\b/i, styleId: 'vintage' },
  { pattern: /\b(minimal|minimalista|simple|clean)\b/i, styleId: 'minimalista-lineal' },
  { pattern: /\b(vector|vectorial|flat)\b/i, styleId: 'vectorial' },
]

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Auto-detect a style from free-text user prompt.
 * Returns the first matching style id, or null if nothing matches.
 */
export function detectStyleFromPrompt(prompt: string): string | null {
  for (const { pattern, styleId } of STYLE_DETECTION_PATTERNS) {
    if (pattern.test(prompt)) {
      return styleId
    }
  }
  return null
}

/**
 * Main entry point -- optimizes a user prompt for textile-print image generation.
 *
 * @param userPrompt   Raw prompt from the user
 * @param styleId      Optional explicit style id (from STYLE_DEFINITIONS)
 * @param options      Optional colorway, printArea, and colorPalette overrides
 * @returns            Optimized prompt, two variant prompts, and the applied style id
 */
export function optimizeDesignPrompt(
  userPrompt: string,
  styleId?: string,
  options?: {
    colorway?: GarmentColorway
    printArea?: PrintArea
    colorPalette?: string[]
  },
): {
  optimizedPrompt: string
  variants: string[]
  styleApplied: string | null
} {
  const cleanPrompt = userPrompt.trim()
  if (!cleanPrompt) {
    return { optimizedPrompt: '', variants: [], styleApplied: null }
  }

  // Resolve style -- explicit > auto-detected > fallback to vectorial
  const resolvedStyleId = styleId ?? detectStyleFromPrompt(cleanPrompt) ?? 'vectorial'
  const style = getStyleById(resolvedStyleId)

  // Resolve print area info
  const printAreaKey = options?.printArea ?? 'R3'
  const printArea = PRINT_AREAS[printAreaKey]

  // Resolve color palette
  const colorPalette =
    options?.colorPalette ??
    (options?.colorway ? TEXTILE_COLOR_PALETTES[options.colorway] : undefined)

  // Extract the central theme (strip technical / garment words)
  const theme = extractCentralTheme(cleanPrompt)

  // Build the optimized prompt
  const optimizedPrompt = buildOptimizedPrompt(theme, style?.keywords, printArea, printAreaKey, colorPalette)

  // Build two variant prompts with compatible styles
  const variants = buildVariants(theme, resolvedStyleId, printArea, printAreaKey, colorPalette)

  return {
    optimizedPrompt,
    variants,
    styleApplied: resolvedStyleId,
  }
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Strips garment / technical noise from the user prompt so we keep only the
 * creative concept.
 */
function extractCentralTheme(prompt: string): string {
  const cleaned = prompt
    .replace(
      /\b(estampa|stamp|diseño|design|vector|digital|illustration|mockup|imagen|image)\b/gi,
      '',
    )
    .replace(
      /\b(para|for|en|on|de|of|la|el|un|una|a|an|the)\b/gi,
      '',
    )
    .replace(
      /\b(camiseta|tshirt|remera|buzo|hoodie|prenda|ropa|clothing|garment|shirt|sweater)\b/gi,
      '',
    )
    .replace(/\s{2,}/g, ' ')
    .trim()

  return cleaned.length >= 3 ? cleaned : prompt.trim()
}

/**
 * Assembles the final optimized prompt.
 * Enforces vectorial output, textile constraints, and the 400-char limit.
 */
function buildOptimizedPrompt(
  theme: string,
  styleKeywords: string | undefined,
  printArea: { name: string; keywords: string; maxColors: number } | undefined,
  printAreaKey: string,
  colorPalette: string[] | undefined,
): string {
  const parts: string[] = []

  // 1. Vectorial header + theme
  parts.push(`Ilustracion vectorial: ${theme}`)

  // 2. Style keywords
  if (styleKeywords) {
    parts.push(styleKeywords)
  }

  // 3. Force vectorial output
  parts.push('Diseno vectorial, colores planos, lineas definidas, sin texturas, sin sombras realistas')

  // 4. Print area context
  if (printArea) {
    parts.push(printArea.keywords)
  }

  // 5. Composition hint based on print area
  if (printAreaKey === 'R1' || printAreaKey === 'pecho-pequeno') {
    parts.push('Composicion centrada, diseno compacto, elemento unico')
  } else if (printAreaKey === 'R3' || printAreaKey === 'espalda-completa') {
    parts.push('Composicion completa, maximo detalle, diseno complejo')
  } else {
    parts.push('Composicion equilibrada, diseno mediano')
  }

  // 6. Color palette hint
  if (colorPalette && colorPalette.length > 0) {
    const maxColors = printArea?.maxColors ?? 5
    const trimmedPalette = colorPalette.slice(0, maxColors)
    parts.push(`Paleta: ${trimmedPalette.join(', ')}`)
  }

  // 7. Textile print + high-res
  parts.push('Alta resolucion, contraste optimizado para estampado textil, colores solidos')

  // 8. CRITICAL: no garments
  parts.push(
    'SOLO el diseno, SIN prendas, SIN ropa, SIN camisetas, SIN buzos, SIN vestimenta',
  )
  parts.push('Fondo transparente, elemento aislado, listo para estampar')

  // 9. Single composition
  parts.push('Una unica composicion centrada, sin duplicados, sin versiones alternativas')

  // Join and enforce 400-char limit
  let result = parts.join('. ')
  if (result.length > 400) {
    result = result.substring(0, 397) + '...'
  }

  return result
}

/**
 * Generates two variant prompts using compatible styles.
 */
function buildVariants(
  theme: string,
  mainStyleId: string,
  printArea: { name: string; keywords: string; maxColors: number } | undefined,
  printAreaKey: string,
  colorPalette: string[] | undefined,
): string[] {
  const compatible = getCompatibleStyleIds(mainStyleId)
  const variants: string[] = []

  for (const altId of compatible.slice(0, 2)) {
    const altStyle = getStyleById(altId)
    const prompt = buildOptimizedPrompt(
      theme,
      altStyle?.keywords,
      printArea,
      printAreaKey,
      colorPalette,
    )
    variants.push(prompt)
  }

  return variants
}

/**
 * Returns up to 3 compatible style ids for the given main style.
 * Falls back to vectorial + minimalista-lineal if no mapping exists.
 */
function getCompatibleStyleIds(mainStyle: string): string[] {
  return COMPATIBLE_STYLES[mainStyle] ?? ['vectorial', 'minimalista-lineal']
}
