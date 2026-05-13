/**
 * Sistema Avanzado de Optimización de Prompts para NovaMente
 * Basado en las instrucciones del sistema para generar estampas de alta calidad
 */

// Parámetros de marca NovaMente
export interface NovaMenteBrandParams {
  garmentType: 'buzo-oversize' | 'remera-oversize' | 'remera-clasica'
  colorway: 'crema' | 'negro' | 'blanco' | 'gris' | 'caramel' | 'marron'
  printArea: 'R1' | 'R2' | 'R3' | 'espalda-completa' | 'pecho-pequeno'
  artisticStyle: 'minimalista-lineal' | 'line-art-tatuaje' | 'sticker-style' | 'manga-anime' | 'chibi-3d' | 'voxel-lego' | 'isometrico-futurista' | 'vintage-poster' | 'geometrico-abstracto' | 'psicodelico' | 'collage-surrealista' | 'pop-minimalista' | 'pixel-art-retro' | 'grunge-distressed' | 'tribal-etnico' | 'tipografico' | 'neon-cyberpunk' | '3d-translucido' | 'conceptual-isometrico' | 'cartoon-western' | 'acuarela-digital' | 'brutalista-minimalista' | 'botanica-vintage' | 'surreal-vectorial' | 'editorial-tipografia' | 'geometrico' | 'surrealista' | 'cartoon' | 'ghibli-like' | 'vintage' | 'vectorial' | 'manga-estilizado'
  colorPalette: string[] // Máximo 4-5 colores
}

// Estilos artísticos disponibles con sus características
export const ARTISTIC_STYLES = {
  'minimalista-lineal': {
    name: 'Minimalista Lineal',
    description: 'Líneas limpias, formas simples, mucho espacio en blanco',
    keywords: 'minimalist line art, clean lines, simple shapes, negative space, monochrome',
    printOptimized: true
  },
  'line-art-tatuaje': {
    name: 'Line Art Minimalista',
    description: 'Trazos negros finos, tipo tatuaje',
    keywords: 'line art, thin black lines, tattoo style, minimalist, clean strokes',
    printOptimized: true
  },
  'sticker-style': {
    name: 'Sticker Style',
    description: 'Colores planos, borde grueso, estética coleccionable',
    keywords: 'sticker style, flat colors, thick border, collectible aesthetic, bold outline',
    printOptimized: true
  },
  'manga-anime': {
    name: 'Manga / Anime Linework',
    description: 'Líneas dinámicas estilo manga/anime',
    keywords: 'manga linework, anime style, dynamic lines, japanese illustration, clean line art',
    printOptimized: true
  },
  'chibi-3d': {
    name: 'Chibi 3D / Mascota Estilizada',
    description: 'Personajes chibi en 3D, estilo mascota',
    keywords: 'chibi 3d, cute mascot style, kawaii, 3d character, stylized',
    printOptimized: true
  },
  'voxel-lego': {
    name: 'Voxel Art / Lego Style',
    description: 'Arte voxel, estilo Lego, pixelado 3D',
    keywords: 'voxel art, lego style, pixelated 3d, blocky, retro gaming',
    printOptimized: true
  },
  'isometrico-futurista': {
    name: 'Isométrico Futurista',
    description: 'Diseño isométrico con elementos futuristas',
    keywords: 'isometric futurist, 3d isometric, futuristic design, geometric perspective',
    printOptimized: true
  },
  'vintage-poster': {
    name: 'Ilustración Vintage de Póster',
    description: 'Como afiches de los 60/70, estilo retro',
    keywords: 'vintage poster, 60s 70s style, retro illustration, psychedelic poster, classic design',
    printOptimized: true
  },
  'geometrico-abstracto': {
    name: 'Arte Geométrico Abstracto',
    description: 'Formas geométricas abstractas, patrones complejos',
    keywords: 'abstract geometric art, complex patterns, geometric shapes, modern abstract',
    printOptimized: true
  },
  'psicodelico': {
    name: 'Estilo Psicodélico',
    description: 'Colores vibrantes, patrones fractales',
    keywords: 'psychedelic art, vibrant colors, fractal patterns, trippy design, neon colors',
    printOptimized: false
  },
  'collage-surrealista': {
    name: 'Collage Digital Surrealista',
    description: 'Collage digital con elementos surrealistas',
    keywords: 'digital collage, surrealist art, mixed media, dreamlike composition',
    printOptimized: false
  },
  'pop-minimalista': {
    name: 'Arte Pop Minimalista',
    description: 'Estilo Warhol-esque, colores planos',
    keywords: 'pop art minimal, warhol style, flat colors, bold graphics, pop culture',
    printOptimized: true
  },
  'pixel-art-retro': {
    name: 'Pixel Art Retro',
    description: 'Arte pixelado retro, estilo 8-bit',
    keywords: 'pixel art, 8-bit style, retro gaming, pixelated graphics, chunky pixels',
    printOptimized: true
  },
  'grunge-distressed': {
    name: 'Grunge / Distressed Texture',
    description: 'Ideal para oversize streetwear, texturas desgastadas',
    keywords: 'grunge style, distressed texture, streetwear aesthetic, worn look, urban design',
    printOptimized: true
  },
  'tribal-etnico': {
    name: 'Arte Tribal / Étnico',
    description: 'Líneas simbólicas, patrones repetitivos',
    keywords: 'tribal art, ethnic patterns, symbolic lines, repetitive motifs, cultural design',
    printOptimized: true
  },
  'tipografico': {
    name: 'Arte Tipográfico',
    description: 'Juego con letras como protagonistas de la estampa',
    keywords: 'typography art, lettering design, text as art, creative typography, word art',
    printOptimized: true
  },
  'neon-cyberpunk': {
    name: 'Glow Neon Cyberpunk',
    description: 'Efecto neón, ideal en negro',
    keywords: 'neon glow, cyberpunk style, glowing effects, dark background, electric colors',
    printOptimized: true
  },
  '3d-translucido': {
    name: 'Arte 3D Translúcido',
    description: 'Vidrio/gel, efectos de transparencia',
    keywords: '3d translucent, glass effect, gel material, transparent 3d, crystal design',
    printOptimized: true
  },
  'conceptual-isometrico': {
    name: 'Arte Conceptual Isométrico',
    description: 'Tipo maquetas digitales, diseño conceptual',
    keywords: 'conceptual isometric, digital mockup, architectural visualization, 3d concept',
    printOptimized: true
  },
  'cartoon-western': {
    name: 'Estilo Cartoon Western',
    description: 'Caricatura simple pero con textura',
    keywords: 'cartoon western, simple caricature, textured illustration, vintage cartoon',
    printOptimized: true
  },
  'acuarela-digital': {
    name: 'Arte Acuarela Digital',
    description: 'Fondos suaves para prendas claras',
    keywords: 'digital watercolor, soft backgrounds, gentle colors, artistic painting',
    printOptimized: true
  },
  'brutalista-minimalista': {
    name: 'Minimalismo Brutalista',
    description: 'Formas crudas, sin adornos, muy plano',
    keywords: 'brutalist minimalism, raw forms, no decorations, very flat, stark design',
    printOptimized: true
  },
  'botanica-vintage': {
    name: 'Ilustración Botánica Vintage',
    description: 'Plantas, flores detalladas como en enciclopedias',
    keywords: 'vintage botanical illustration, detailed plants, encyclopedia style, scientific drawing',
    printOptimized: true
  },
  'surreal-vectorial': {
    name: 'Arte Surreal Vectorial',
    description: 'Formas imposibles, perspectivas raras, colores planos',
    keywords: 'surreal vector art, impossible shapes, weird perspectives, flat colors, abstract surreal',
    printOptimized: true
  },
  'editorial-tipografia': {
    name: 'Diseño Editorial / Tipografía + Geometría',
    description: 'Inspirado en portadas de revistas',
    keywords: 'editorial design, typography geometry, magazine cover style, layout design, graphic design',
    printOptimized: true
  },
  'geometrico': {
    name: 'Arte Geométrico',
    description: 'Formas geométricas, patrones abstractos, colores planos',
    keywords: 'geometric art, abstract patterns, flat colors, vector graphics, bold shapes',
    printOptimized: true
  },
  'surrealista': {
    name: 'Surrealista',
    description: 'Elementos oníricos, composiciones inusuales, colores vibrantes',
    keywords: 'surreal art, dreamlike elements, unusual composition, vibrant colors, artistic',
    printOptimized: false
  },
  'cartoon': {
    name: 'Cartoon/Ilustración',
    description: 'Estilo caricaturesco, colores brillantes, líneas definidas',
    keywords: 'cartoon illustration, bold outlines, bright colors, playful design, character art',
    printOptimized: true
  },
  'ghibli-like': {
    name: 'Estilo Ghibli',
    description: 'Inspirado en Studio Ghibli, suave, orgánico, colores pastel',
    keywords: 'studio ghibli style, soft lines, organic shapes, pastel colors, whimsical',
    printOptimized: true
  },
  'vintage': {
    name: 'Vintage/Retro',
    description: 'Estilo retro, colores desaturados, texturas envejecidas',
    keywords: 'vintage style, retro design, muted colors, aged textures, classic',
    printOptimized: true
  },
  'vectorial': {
    name: 'Ilustración Vectorial',
    description: 'Diseño vectorial, colores planos, perfecto para impresión',
    keywords: 'vector illustration, flat design, clean graphics, print ready, scalable',
    printOptimized: true
  },
  'manga-estilizado': {
    name: 'Manga Estilizado',
    description: 'Inspirado en manga/anime, líneas dinámicas, sombreado suave',
    keywords: 'manga style, anime inspired, dynamic lines, soft shading, japanese art',
    printOptimized: true
  }
}

// Paletas de colores compatibles con estampado textil
export const TEXTILE_COLOR_PALETTES = {
  'crema': ['#F5F5DC', '#8B4513', '#000000', '#FFFFFF', '#D2691E'],
  'negro': ['#000000', '#FFFFFF', '#FFD700', '#FF0000', '#00FF00'],
  'blanco': ['#FFFFFF', '#000000', '#FF6B6B', '#4ECDC4', '#45B7D1'],
  'gris': ['#808080', '#000000', '#FFFFFF', '#FFA500', '#FF69B4'],
  'caramel': ['#D2691E', '#8B4513', '#FFFFFF', '#000000', '#F4A460'],
  'marron': ['#8B4513', '#A0522D', '#FFFFFF', '#000000', '#D2691E']
}

// Mapeo de áreas de impresión
export const PRINT_AREAS = {
  'R1': {
    name: 'R1 (10×10 cm)',
    description: 'Área pequeña, diseño centrado, ideal para logos o símbolos',
    keywords: 'small print area, centered design, logo placement, compact',
    maxColors: 3
  },
  'R2': {
    name: 'R2 (20×20 cm)',
    description: 'Área mediana, más espacio para detalles',
    keywords: 'medium print area, detailed design, balanced composition',
    maxColors: 4
  },
  'R3': {
    name: 'R3 (35×40 cm)',
    description: 'Área grande, espalda completa, máximo detalle',
    keywords: 'large print area, full back design, maximum detail, complex composition',
    maxColors: 5
  },
  'espalda-completa': {
    name: 'Espalda Completa',
    description: 'Toda la espalda, diseño impactante',
    keywords: 'full back design, large format, bold statement, maximum impact',
    maxColors: 5
  },
  'pecho-pequeno': {
    name: 'Pecho Pequeño',
    description: 'Área del pecho, diseño sutil',
    keywords: 'chest area, subtle design, small format, elegant placement',
    maxColors: 3
  }
}

// Función principal de optimización
export function optimizePromptForNovaMente(
  originalPrompt: string,
  brandParams: Partial<NovaMenteBrandParams> = {}
): {
  optimizedPrompt: string
  variants: string[]
  printSuggestions: string[]
} {
  console.log('🎨 NOVAMENTE PROMPT OPTIMIZER: Iniciando optimización')
  console.log('📥 PROMPT ORIGINAL:', originalPrompt)
  console.log('⚙️ PARÁMETROS DE MARCA:', brandParams)

  // 1. Extraer tema central del prompt original
  const centralTheme = extractCentralTheme(originalPrompt)
  console.log('🎯 TEMA CENTRAL EXTRAÍDO:', centralTheme)

  // 2. Aplicar parámetros de marca
  const appliedParams = applyBrandParameters(brandParams)
  console.log('🏷️ PARÁMETROS APLICADOS:', appliedParams)

  // 3. Generar prompt optimizado principal
  const optimizedPrompt = generateOptimizedPrompt(centralTheme, appliedParams)
  console.log('✨ PROMPT OPTIMIZADO:', optimizedPrompt)

  // 4. Generar variantes con diferentes estilos
  const variants = generateStyleVariants(centralTheme, appliedParams)
  console.log('🔄 VARIANTES GENERADAS:', variants.length)

  // 5. Generar sugerencias para impresión
  const printSuggestions = generatePrintSuggestions(appliedParams)
  console.log('🖨️ SUGERENCIAS DE IMPRESIÓN:', printSuggestions)

  return {
    optimizedPrompt,
    variants,
    printSuggestions
  }
}

// Extraer el tema central del prompt del usuario
function extractCentralTheme(prompt: string): string {
  // Limpiar el prompt de palabras técnicas y prendas
  const cleanedPrompt = prompt
    .replace(/\b(estampa|stamp|diseño|design|vector|digital|illustration|mockup|imagen|image)\b/gi, '')
    .replace(/\b(para|for|en|on|de|of|la|el|un|una|a|an|the)\b/gi, '')
    .replace(/\b(camiseta|tshirt|remera|buzo|hoodie|prenda|ropa|clothing|garment|shirt|sweater)\b/gi, '')
    .replace(/\b(rick|morty|personaje|character|persona|people|gente)\b/gi, '')
    .trim()

  // Si el prompt está muy limpio, usar el original
  if (cleanedPrompt.length < 3) {
    return prompt.trim()
  }

  return cleanedPrompt
}

// Aplicar parámetros de marca NovaMente
function applyBrandParameters(params: Partial<NovaMenteBrandParams>): NovaMenteBrandParams {
  return {
    garmentType: params.garmentType || 'remera-oversize',
    colorway: params.colorway || 'negro',
    printArea: params.printArea || 'R3',
    artisticStyle: params.artisticStyle || 'vectorial',
    colorPalette: params.colorPalette || TEXTILE_COLOR_PALETTES[params.colorway || 'negro']
  }
}

// Generar prompt optimizado principal
function generateOptimizedPrompt(theme: string, params: NovaMenteBrandParams): string {
  // Fallback robusto: si la UI pasa un estilo/printArea que no esta en el enum
  // (ej: "minimal" en vez de "minimalista-lineal"), caer a defaults seguros para
  // no crashear con "Cannot read properties of undefined (reading 'name')".
  const style = ARTISTIC_STYLES[params.artisticStyle] || ARTISTIC_STYLES['vectorial']
  const printArea = PRINT_AREAS[params.printArea] || PRINT_AREAS['R3']
  
  // Construir el prompt optimizado - SIEMPRE vectorial para evitar prendas
  let optimizedPrompt = `Ilustración vectorial: ${theme}`
  
  // Forzar estilo vectorial para evitar que aparezcan prendas
  optimizedPrompt += `. Diseño vectorial, colores planos, líneas definidas, sin texturas, sin sombras realistas`
  
  // Agregar especificaciones de impresión
  optimizedPrompt += `. ${printArea.keywords}`
  
  // Agregar especificaciones técnicas para estampado
  optimizedPrompt += `. Alta resolución, contraste optimizado para estampado textil, colores sólidos`
  
  // Agregar composición según área de impresión
  if (params.printArea === 'R1') {
    optimizedPrompt += `. Composición centrada, diseño compacto, elemento único`
  } else if (params.printArea === 'R3' || params.printArea === 'espalda-completa') {
    optimizedPrompt += `. Composición completa, máximo detalle, diseño complejo`
  } else {
    optimizedPrompt += `. Composición equilibrada, diseño mediano`
  }
  
  // CRÍTICO: Evitar que aparezcan prendas o ropa
  optimizedPrompt += `. SOLO el diseño, SIN prendas, SIN ropa, SIN camisetas, SIN buzos, SIN vestimenta`
  optimizedPrompt += `. Fondo transparente, elemento aislado, listo para estampar`
  
  // Limitar longitud del prompt
  if (optimizedPrompt.length > 400) {
    optimizedPrompt = optimizedPrompt.substring(0, 397) + '...'
  }
  
  return optimizedPrompt
}

// Generar variantes con diferentes estilos
function generateStyleVariants(theme: string, params: NovaMenteBrandParams): string[] {
  const variants: string[] = []
  const baseParams = { ...params }
  
  // Generar 2-3 variantes con estilos diferentes pero compatibles
  const compatibleStyles = getCompatibleStyles(params.artisticStyle)
  
  for (const style of compatibleStyles.slice(0, 2)) {
    const variantParams = { ...baseParams, artisticStyle: style } as any
    const variant = generateOptimizedPrompt(theme, variantParams)
    variants.push(variant)
  }
  
  return variants
}

// Obtener estilos compatibles con el estilo principal
function getCompatibleStyles(mainStyle: string): string[] {
  const compatibilityMap: Record<string, string[]> = {
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
    'pixel-art-retro': ['voxel-lego', '8-bit', 'retro-gaming'],
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
    'surrealista': ['vintage', 'ghibli-like', 'collage-surrealista']
  }
  
  return compatibilityMap[mainStyle] || ['vectorial', 'minimalista-lineal']
}

// Generar sugerencias para impresión
function generatePrintSuggestions(params: NovaMenteBrandParams): string[] {
  const suggestions: string[] = []
  // Mismo fallback que generateOptimizedPrompt para evitar crashes
  // cuando el style/printArea no esta en el enum esperado.
  const printArea = PRINT_AREAS[params.printArea] || PRINT_AREAS['R3']
  const style = ARTISTIC_STYLES[params.artisticStyle] || ARTISTIC_STYLES['vectorial']
  
  // Sugerencias generales
  suggestions.push(`Área de impresión: ${printArea.name}`)
  suggestions.push(`Estilo: ${style.name}`)
  suggestions.push(`Colores recomendados: ${params.colorPalette.slice(0, printArea.maxColors).join(', ')}`)
  
  // Sugerencias específicas por estilo
  if (style.printOptimized) {
    suggestions.push('✅ Estilo optimizado para impresión DTF/sublimación')
  } else {
    suggestions.push('⚠️ Considerar simplificar para mejor impresión')
  }
  
  // Sugerencias por área de impresión
  if (params.printArea === 'R1') {
    suggestions.push('💡 Diseño simple y centrado recomendado para R1')
  } else if (params.printArea === 'R3') {
    suggestions.push('💡 Máximo detalle permitido en R3')
  }
  
  return suggestions
}

// Función de utilidad para detectar automáticamente parámetros del prompt
export function detectBrandParametersFromPrompt(prompt: string): Partial<NovaMenteBrandParams> {
  const detected: Partial<NovaMenteBrandParams> = {}
  
  // Detectar tipo de prenda
  if (/\b(buzo|hoodie|sweater)\b/i.test(prompt)) {
    detected.garmentType = 'buzo-oversize'
  } else if (/\b(remera|tshirt|camiseta)\b/i.test(prompt)) {
    detected.garmentType = 'remera-oversize'
  }
  
  // Detectar colorway
  if (/\b(negro|black)\b/i.test(prompt)) {
    detected.colorway = 'negro'
  } else if (/\b(blanco|white)\b/i.test(prompt)) {
    detected.colorway = 'blanco'
  } else if (/\b(crema|cream|beige)\b/i.test(prompt)) {
    detected.colorway = 'crema'
  } else if (/\b(gris|gray|grey)\b/i.test(prompt)) {
    detected.colorway = 'gris'
  } else if (/\b(caramel|caramelo|marrón|brown)\b/i.test(prompt)) {
    detected.colorway = 'caramel'
  }
  
  // Detectar estilo artístico
  if (/\b(tatuaje|tattoo|line art|linea|trazos)\b/i.test(prompt)) {
    detected.artisticStyle = 'line-art-tatuaje'
  } else if (/\b(sticker|pegatina|coleccionable)\b/i.test(prompt)) {
    detected.artisticStyle = 'sticker-style'
  } else if (/\b(manga|anime|japonés|japanese)\b/i.test(prompt)) {
    detected.artisticStyle = 'manga-anime'
  } else if (/\b(chibi|kawaii|mascota|cute)\b/i.test(prompt)) {
    detected.artisticStyle = 'chibi-3d'
  } else if (/\b(voxel|lego|pixel|8-bit|retro gaming)\b/i.test(prompt)) {
    detected.artisticStyle = 'voxel-lego'
  } else if (/\b(isométrico|isometric|futurista|futuristic)\b/i.test(prompt)) {
    detected.artisticStyle = 'isometrico-futurista'
  } else if (/\b(póster|poster|60s|70s|psicodélico|psychedelic)\b/i.test(prompt)) {
    detected.artisticStyle = 'vintage-poster'
  } else if (/\b(geométrico|geometric|abstracto|abstract)\b/i.test(prompt)) {
    detected.artisticStyle = 'geometrico-abstracto'
  } else if (/\b(psicodélico|psychedelic|fractal|trippy)\b/i.test(prompt)) {
    detected.artisticStyle = 'psicodelico'
  } else if (/\b(collage|surrealista|surreal)\b/i.test(prompt)) {
    detected.artisticStyle = 'collage-surrealista'
  } else if (/\b(pop art|warhol|pop culture)\b/i.test(prompt)) {
    detected.artisticStyle = 'pop-minimalista'
  } else if (/\b(pixel art|8-bit|retro gaming)\b/i.test(prompt)) {
    detected.artisticStyle = 'pixel-art-retro'
  } else if (/\b(grunge|distressed|streetwear|urban)\b/i.test(prompt)) {
    detected.artisticStyle = 'grunge-distressed'
  } else if (/\b(tribal|étnico|ethnic|cultural)\b/i.test(prompt)) {
    detected.artisticStyle = 'tribal-etnico'
  } else if (/\b(tipografía|typography|letras|lettering)\b/i.test(prompt)) {
    detected.artisticStyle = 'tipografico'
  } else if (/\b(neon|cyberpunk|glow|electric)\b/i.test(prompt)) {
    detected.artisticStyle = 'neon-cyberpunk'
  } else if (/\b(translúcido|translucent|vidrio|glass|gel)\b/i.test(prompt)) {
    detected.artisticStyle = '3d-translucido'
  } else if (/\b(conceptual|maqueta|mockup)\b/i.test(prompt)) {
    detected.artisticStyle = 'conceptual-isometrico'
  } else if (/\b(western|cowboy|caricatura|caricature)\b/i.test(prompt)) {
    detected.artisticStyle = 'cartoon-western'
  } else if (/\b(acuarela|watercolor|suave|soft)\b/i.test(prompt)) {
    detected.artisticStyle = 'acuarela-digital'
  } else if (/\b(brutalista|brutalist|crudo|raw)\b/i.test(prompt)) {
    detected.artisticStyle = 'brutalista-minimalista'
  } else if (/\b(botánica|botanical|plantas|flores|plants|flowers)\b/i.test(prompt)) {
    detected.artisticStyle = 'botanica-vintage'
  } else if (/\b(editorial|magazine|revista|layout)\b/i.test(prompt)) {
    detected.artisticStyle = 'editorial-tipografia'
  } else if (/\b(minimal|minimalista|simple|clean)\b/i.test(prompt)) {
    detected.artisticStyle = 'minimalista-lineal'
  } else if (/\b(cartoon|caricatura|dibujo)\b/i.test(prompt)) {
    detected.artisticStyle = 'cartoon'
  } else if (/\b(ghibli|studio ghibli)\b/i.test(prompt)) {
    detected.artisticStyle = 'ghibli-like'
  } else if (/\b(vintage|retro|clásico|classic)\b/i.test(prompt)) {
    detected.artisticStyle = 'vintage'
  } else if (/\b(vector|vectorial|flat)\b/i.test(prompt)) {
    detected.artisticStyle = 'vectorial'
  }
  
  return detected
}

// Función para obtener todos los estilos disponibles
export function getAllArtisticStyles() {
  return Object.entries(ARTISTIC_STYLES).map(([key, value]) => ({
    key,
    ...value
  }))
}

// Función para obtener todas las paletas de colores
export function getAllColorPalettes() {
  return Object.entries(TEXTILE_COLOR_PALETTES).map(([key, colors]) => ({
    colorway: key,
    colors
  }))
}

// Función para obtener todas las áreas de impresión
export function getAllPrintAreas() {
  return Object.entries(PRINT_AREAS).map(([key, value]) => ({
    key,
    ...value
  }))
}
