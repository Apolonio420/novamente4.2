/**
 * Novamente Designer Style System
 * 31+ artistic styles optimized for textile print design
 * Each style maps to a thumbnail PNG and includes keywords for prompt injection
 */

import type { StyleDefinition, GarmentColorway, PrintArea } from './types'

// ---------------------------------------------------------------------------
// Style Definitions (31 styles migrated from novamente4.2 + apparel extras)
// ---------------------------------------------------------------------------

export const STYLE_DEFINITIONS: StyleDefinition[] = [
  // --- Minimalista ---
  {
    id: 'minimalista-lineal',
    name: 'Minimalista Lineal',
    description: 'Lineas limpias, formas simples, mucho espacio en blanco',
    keywords: 'minimalist line art, clean lines, simple shapes, negative space, monochrome',
    printOptimized: true,
    thumbnailPath: '/styles/line-art-planta.png',
  },
  {
    id: 'line-art-tatuaje',
    name: 'Line Art Minimalista',
    description: 'Trazos negros finos, tipo tatuaje',
    keywords: 'line art, thin black lines, tattoo style, minimalist, clean strokes',
    printOptimized: true,
    thumbnailPath: '/styles/line-art-retrato.png',
  },
  {
    id: 'brutalista-minimalista',
    name: 'Minimalismo Brutalista',
    description: 'Formas crudas, sin adornos, muy plano',
    keywords: 'brutalist minimalism, raw forms, no decorations, very flat, stark design',
    printOptimized: true,
    thumbnailPath: '/styles/bauhaus-geometrico.png',
  },

  // --- Pop & Retro ---
  {
    id: 'sticker-style',
    name: 'Sticker Style',
    description: 'Colores planos, borde grueso, estetica coleccionable',
    keywords: 'sticker style, flat colors, thick border, collectible aesthetic, bold outline',
    printOptimized: true,
    thumbnailPath: '/styles/pop-art-sandia.png',
  },
  {
    id: 'pop-minimalista',
    name: 'Arte Pop Minimalista',
    description: 'Estilo Warhol-esque, colores planos',
    keywords: 'pop art minimal, warhol style, flat colors, bold graphics, pop culture',
    printOptimized: true,
    thumbnailPath: '/styles/pop-art-comic.png',
  },
  {
    id: 'vintage-poster',
    name: 'Ilustracion Vintage de Poster',
    description: 'Como afiches de los 60/70, estilo retro',
    keywords: 'vintage poster, 60s 70s style, retro illustration, psychedelic poster, classic design',
    printOptimized: true,
    thumbnailPath: '/styles/retro-endless-summer.png',
  },
  {
    id: 'vintage',
    name: 'Vintage/Retro',
    description: 'Estilo retro, colores desaturados, texturas envejecidas',
    keywords: 'vintage style, retro design, muted colors, aged textures, classic',
    printOptimized: true,
    thumbnailPath: '/styles/retro-typewriter.png',
  },
  {
    id: 'pixel-art-retro',
    name: 'Pixel Art Retro',
    description: 'Arte pixelado retro, estilo 8-bit',
    keywords: 'pixel art, 8-bit style, retro gaming, pixelated graphics, chunky pixels',
    printOptimized: true,
    thumbnailPath: '/styles/pixel-art-astronauta.png',
  },
  {
    id: 'retro-vaporwave',
    name: 'Vaporwave / Synthwave',
    description: 'Estetica retro-futurista, gradientes neon, palmas y grids',
    keywords: 'vaporwave, synthwave, retro futuristic, neon gradients, palm trees, 80s grid',
    printOptimized: true,
    thumbnailPath: '/styles/retro-vaporwave-synthwave.png',
  },
  {
    id: 'retro-cassette',
    name: 'Retro Cassette / Good Vibes',
    description: 'Nostalgia musical, cassettes, tipografia retro',
    keywords: 'retro cassette, good vibes, vintage music, 80s nostalgia, retro typography',
    printOptimized: true,
    thumbnailPath: '/styles/retro-cassette.png',
  },

  // --- Oriental ---
  {
    id: 'manga-anime',
    name: 'Manga / Anime Linework',
    description: 'Lineas dinamicas estilo manga/anime',
    keywords: 'manga linework, anime style, dynamic lines, japanese illustration, clean line art',
    printOptimized: true,
    thumbnailPath: '/styles/japones-gran-ola.png',
  },
  {
    id: 'manga-estilizado',
    name: 'Manga Estilizado',
    description: 'Inspirado en manga/anime, lineas dinamicas, sombreado suave',
    keywords: 'manga style, anime inspired, dynamic lines, soft shading, japanese art',
    printOptimized: true,
    thumbnailPath: '/styles/japones-paisaje-tradicional.png',
  },
  {
    id: 'ghibli-like',
    name: 'Estilo Ghibli',
    description: 'Inspirado en Studio Ghibli, suave, organico, colores pastel',
    keywords: 'studio ghibli style, soft lines, organic shapes, pastel colors, whimsical',
    printOptimized: true,
    thumbnailPath: '/styles/acuarela-paisaje-japones.png',
  },
  {
    id: 'chibi-3d',
    name: 'Chibi 3D / Mascota Estilizada',
    description: 'Personajes chibi en 3D, estilo mascota',
    keywords: 'chibi 3d, cute mascot style, kawaii, 3d character, stylized',
    printOptimized: true,
    thumbnailPath: '/styles/pixel-art-colibri.png',
  },

  // --- Digital & Futurista ---
  {
    id: 'voxel-lego',
    name: 'Voxel Art / Lego Style',
    description: 'Arte voxel, estilo Lego, pixelado 3D',
    keywords: 'voxel art, lego style, pixelated 3d, blocky, retro gaming',
    printOptimized: true,
    thumbnailPath: '/styles/pixel-art-skater.png',
  },
  {
    id: 'isometrico-futurista',
    name: 'Isometrico Futurista',
    description: 'Diseno isometrico con elementos futuristas',
    keywords: 'isometric futurist, 3d isometric, futuristic design, geometric perspective',
    printOptimized: true,
    thumbnailPath: '/styles/bauhaus-geometrico.png',
  },
  {
    id: 'neon-cyberpunk',
    name: 'Glow Neon Cyberpunk',
    description: 'Efecto neon, ideal en negro',
    keywords: 'neon glow, cyberpunk style, glowing effects, dark background, electric colors',
    printOptimized: true,
    thumbnailPath: '/styles/retro-vaporwave-palmera.png',
  },
  {
    id: '3d-translucido',
    name: 'Arte 3D Translucido',
    description: 'Vidrio/gel, efectos de transparencia',
    keywords: '3d translucent, glass effect, gel material, transparent 3d, crystal design',
    printOptimized: true,
    thumbnailPath: '/styles/alquimia-ojo-dorado.png',
  },
  {
    id: 'conceptual-isometrico',
    name: 'Arte Conceptual Isometrico',
    description: 'Tipo maquetas digitales, diseno conceptual',
    keywords: 'conceptual isometric, digital mockup, architectural visualization, 3d concept',
    printOptimized: true,
    thumbnailPath: '/styles/bauhaus-geometrico.png',
  },

  // --- Textural ---
  {
    id: 'acuarela-digital',
    name: 'Arte Acuarela Digital',
    description: 'Fondos suaves para prendas claras',
    keywords: 'digital watercolor, soft backgrounds, gentle colors, artistic painting',
    printOptimized: true,
    thumbnailPath: '/styles/acuarela-colibri.png',
  },
  {
    id: 'psicodelico',
    name: 'Estilo Psicodelico',
    description: 'Colores vibrantes, patrones fractales',
    keywords: 'psychedelic art, vibrant colors, fractal patterns, trippy design, neon colors',
    printOptimized: false,
    thumbnailPath: '/styles/psicodelico-rostro-1.png',
  },
  {
    id: 'grunge-distressed',
    name: 'Grunge / Distressed Texture',
    description: 'Ideal para oversize streetwear, texturas desgastadas',
    keywords: 'grunge style, distressed texture, streetwear aesthetic, worn look, urban design',
    printOptimized: true,
    thumbnailPath: '/styles/urbano-retrato.png',
  },
  {
    id: 'tribal-etnico',
    name: 'Arte Tribal / Etnico',
    description: 'Lineas simbolicas, patrones repetitivos',
    keywords: 'tribal art, ethnic patterns, symbolic lines, repetitive motifs, cultural design',
    printOptimized: true,
    thumbnailPath: '/styles/mandala-floral.png',
  },

  // --- Geometrico ---
  {
    id: 'geometrico-abstracto',
    name: 'Arte Geometrico Abstracto',
    description: 'Formas geometricas abstractas, patrones complejos',
    keywords: 'abstract geometric art, complex patterns, geometric shapes, modern abstract',
    printOptimized: true,
    thumbnailPath: '/styles/geometrico-aguila.png',
  },
  {
    id: 'geometrico',
    name: 'Arte Geometrico',
    description: 'Formas geometricas, patrones abstractos, colores planos',
    keywords: 'geometric art, abstract patterns, flat colors, vector graphics, bold shapes',
    printOptimized: true,
    thumbnailPath: '/styles/geometrico-leon.png',
  },

  // --- Ilustracion ---
  {
    id: 'cartoon-western',
    name: 'Estilo Cartoon Western',
    description: 'Caricatura simple pero con textura',
    keywords: 'cartoon western, simple caricature, textured illustration, vintage cartoon',
    printOptimized: true,
    thumbnailPath: '/styles/pop-art-retrato.png',
  },
  {
    id: 'cartoon',
    name: 'Cartoon/Ilustracion',
    description: 'Estilo caricaturesco, colores brillantes, lineas definidas',
    keywords: 'cartoon illustration, bold outlines, bright colors, playful design, character art',
    printOptimized: true,
    thumbnailPath: '/styles/pop-art-auto.png',
  },
  {
    id: 'collage-surrealista',
    name: 'Collage Digital Surrealista',
    description: 'Collage digital con elementos surrealistas',
    keywords: 'digital collage, surrealist art, mixed media, dreamlike composition',
    printOptimized: false,
    thumbnailPath: '/styles/surrealista-guitarra.png',
  },
  {
    id: 'surrealista',
    name: 'Surrealista',
    description: 'Elementos oniricos, composiciones inusuales, colores vibrantes',
    keywords: 'surreal art, dreamlike elements, unusual composition, vibrant colors, artistic',
    printOptimized: false,
    thumbnailPath: '/styles/surrealista-leopardo.png',
  },
  {
    id: 'surreal-vectorial',
    name: 'Arte Surreal Vectorial',
    description: 'Formas imposibles, perspectivas raras, colores planos',
    keywords: 'surreal vector art, impossible shapes, weird perspectives, flat colors, abstract surreal',
    printOptimized: true,
    thumbnailPath: '/styles/psicodelico-rostro-2.png',
  },

  // --- Tipografico ---
  {
    id: 'tipografico',
    name: 'Arte Tipografico',
    description: 'Juego con letras como protagonistas de la estampa',
    keywords: 'typography art, lettering design, text as art, creative typography, word art',
    printOptimized: true,
    thumbnailPath: '/styles/retro-good-vibes.png',
  },
  {
    id: 'editorial-tipografia',
    name: 'Diseno Editorial / Tipografia + Geometria',
    description: 'Inspirado en portadas de revistas',
    keywords: 'editorial design, typography geometry, magazine cover style, layout design, graphic design',
    printOptimized: true,
    thumbnailPath: '/styles/retro-good-vibes.png',
  },

  // --- Vectorial / Base ---
  {
    id: 'vectorial',
    name: 'Ilustracion Vectorial',
    description: 'Diseno vectorial, colores planos, perfecto para impresion',
    keywords: 'vector illustration, flat design, clean graphics, print ready, scalable',
    printOptimized: true,
    thumbnailPath: '/styles/geometrico-colibri.png',
  },

  // --- Naturaleza / Botanica ---
  {
    id: 'botanica-vintage',
    name: 'Ilustracion Botanica Vintage',
    description: 'Plantas, flores detalladas como en enciclopedias',
    keywords: 'vintage botanical illustration, detailed plants, encyclopedia style, scientific drawing',
    printOptimized: true,
    thumbnailPath: '/styles/botanico-vintage.png',
  },

  // --- Apparel-specific extra styles ---
  {
    id: 'urbano-streetwear',
    name: 'Urbano Streetwear',
    description: 'Estetica callejera, autos clasicos, retratos urbanos',
    keywords: 'urban streetwear, street art, hip hop culture, city life, bold graphic, spray paint',
    printOptimized: true,
    thumbnailPath: '/styles/urbano-muscle-car.png',
  },
  {
    id: 'acuarela-naturaleza',
    name: 'Acuarela Naturaleza',
    description: 'Paisajes y fauna en acuarela, ideal para prendas claras',
    keywords: 'watercolor nature, landscape painting, fauna illustration, soft tones, artistic',
    printOptimized: true,
    thumbnailPath: '/styles/acuarela-leon.png',
  },
  {
    id: 'acuarela-urbana',
    name: 'Acuarela Urbana',
    description: 'Ciudades y paisajes urbanos en tecnica acuarela',
    keywords: 'urban watercolor, cityscape painting, architectural watercolor, soft urban',
    printOptimized: true,
    thumbnailPath: '/styles/acuarela-ciudad.png',
  },
]

// ---------------------------------------------------------------------------
// Style Categories
// ---------------------------------------------------------------------------

const STYLE_CATEGORIES: Record<string, string[]> = {
  'Minimalista': [
    'minimalista-lineal',
    'line-art-tatuaje',
    'brutalista-minimalista',
  ],
  'Pop & Retro': [
    'sticker-style',
    'pop-minimalista',
    'vintage-poster',
    'vintage',
    'pixel-art-retro',
    'retro-vaporwave',
    'retro-cassette',
  ],
  'Oriental': [
    'manga-anime',
    'manga-estilizado',
    'ghibli-like',
    'chibi-3d',
  ],
  'Digital & Futurista': [
    'voxel-lego',
    'isometrico-futurista',
    'neon-cyberpunk',
    '3d-translucido',
    'conceptual-isometrico',
  ],
  'Textural': [
    'acuarela-digital',
    'psicodelico',
    'grunge-distressed',
    'tribal-etnico',
  ],
  'Geometrico': [
    'geometrico-abstracto',
    'geometrico',
  ],
  'Ilustracion': [
    'cartoon-western',
    'cartoon',
    'collage-surrealista',
    'surrealista',
    'surreal-vectorial',
  ],
  'Tipografico': [
    'tipografico',
    'editorial-tipografia',
  ],
  'Vectorial': [
    'vectorial',
  ],
  'Naturaleza': [
    'botanica-vintage',
    'acuarela-naturaleza',
    'acuarela-urbana',
  ],
  'Urbano': [
    'urbano-streetwear',
  ],
}

// ---------------------------------------------------------------------------
// Textile Color Palettes (mapped by garment colorway)
// ---------------------------------------------------------------------------

export const TEXTILE_COLOR_PALETTES: Record<string, string[]> = {
  crema:   ['#F5F5DC', '#8B4513', '#000000', '#FFFFFF', '#D2691E'],
  negro:   ['#000000', '#FFFFFF', '#FFD700', '#FF0000', '#00FF00'],
  blanco:  ['#FFFFFF', '#000000', '#FF6B6B', '#4ECDC4', '#45B7D1'],
  gris:    ['#808080', '#000000', '#FFFFFF', '#FFA500', '#FF69B4'],
  caramel: ['#D2691E', '#8B4513', '#FFFFFF', '#000000', '#F4A460'],
  marron:  ['#8B4513', '#A0522D', '#FFFFFF', '#000000', '#D2691E'],
}

// ---------------------------------------------------------------------------
// Print Areas (with name, description, keywords, maxColors)
// ---------------------------------------------------------------------------

export const PRINT_AREAS: Record<
  string,
  { name: string; description: string; keywords: string; maxColors: number }
> = {
  R1: {
    name: 'R1 (10x10 cm)',
    description: 'Area pequena, diseno centrado, ideal para logos o simbolos',
    keywords: 'small print area, centered design, logo placement, compact',
    maxColors: 3,
  },
  R2: {
    name: 'R2 (20x20 cm)',
    description: 'Area mediana, mas espacio para detalles',
    keywords: 'medium print area, detailed design, balanced composition',
    maxColors: 4,
  },
  R3: {
    name: 'R3 (35x40 cm)',
    description: 'Area grande, espalda completa, maximo detalle',
    keywords: 'large print area, full back design, maximum detail, complex composition',
    maxColors: 5,
  },
  'espalda-completa': {
    name: 'Espalda Completa',
    description: 'Toda la espalda, diseno impactante',
    keywords: 'full back design, large format, bold statement, maximum impact',
    maxColors: 5,
  },
  'pecho-pequeno': {
    name: 'Pecho Pequeno',
    description: 'Area del pecho, diseno sutil',
    keywords: 'chest area, subtle design, small format, elegant placement',
    maxColors: 3,
  },
}

// ---------------------------------------------------------------------------
// Helper functions
// ---------------------------------------------------------------------------

/** Returns every registered style definition. */
export function getAllStyles(): StyleDefinition[] {
  return STYLE_DEFINITIONS
}

/** Looks up a single style by its id. */
export function getStyleById(id: string): StyleDefinition | undefined {
  return STYLE_DEFINITIONS.find((s) => s.id === id)
}

/**
 * Groups all styles into named categories.
 * Returns a record where the key is the category name and the value is an
 * array of StyleDefinition objects belonging to that category.
 */
export function getStylesByCategory(): Record<string, StyleDefinition[]> {
  const result: Record<string, StyleDefinition[]> = {}

  for (const [category, ids] of Object.entries(STYLE_CATEGORIES)) {
    result[category] = ids
      .map((id) => getStyleById(id))
      .filter((s): s is StyleDefinition => s !== undefined)
  }

  return result
}
