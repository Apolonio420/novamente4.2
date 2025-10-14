// Mapeo de prendas con cuadrados rojos para estampado
export interface RedSquareGarment {
  id: string
  type: 'hoodie' | 'tshirt'
  variant: 'classic' | 'oversize'
  color: 'black' | 'gray' | 'caramel' | 'white' | 'cream' | 'model'
  side: 'front' | 'back'
  size: 'R1' | 'R2' | 'R3'
  position?: 'center' | 'left' // Solo para R1
  imagePath: string
}

// Función para obtener la imagen de referencia con cuadrado rojo
export function getRedSquareGarmentImage(
  type: 'hoodie' | 'tshirt',
  variant: 'classic' | 'oversize',
  color: 'black' | 'gray' | 'caramel' | 'white' | 'cream' | 'model',
  side: 'front' | 'back',
  size: 'R1' | 'R2' | 'R3',
  position?: 'center' | 'left'
): string | null {
  // Nota: Los archivos con naming simple (hoodie-black-front.jpeg) no existen en el directorio.
  // Solo existen los archivos con naming MRoja-XX. Por lo tanto, siempre usamos el mapeo por índices.

  // 2) Fallback: mapeo anterior por índices (MRoja-XX-...)
  // Mapeo de colores
  const colorMap = {
    'black': 'N',
    'gray': 'G', 
    'caramel': 'M', // Caramelo se mapea a M (Marrón) en las imágenes
    'white': 'B',
    'cream': 'C', // Cream usa las imágenes con código C (MRoja-5/6/7/8/9/10)
    'model': 'M'
  }

  // Mapeo de tipos
  const typeMap = {
    'hoodie': 'BuzoOver',
    'tshirt': variant === 'classic' ? 'RemeraClassic' : 'RemeraOver'
  }

  // Mapeo de lados
  const sideMap = {
    'front': 'Frente',
    'back': 'Dorso'
  }

  const colorCode = colorMap[color]
  const typeCode = typeMap[type]
  const sideCode = sideMap[side]

  // Mapeo de números para cada combinación
  const getImageNumber = (type: string, color: string, side: string, size: string, position?: string) => {
    // Construir la clave correcta
    // Solo R1 usa códigos de posición (C/I), R2 y R3 no
    const positionCode = size === 'R1' ? (position === 'center' ? 'C' : position === 'left' ? 'I' : '') : ''
    const key = `${type}_${color}_${side}_${size}${positionCode}`
    
    // Mapeo basado en los archivos existentes
    const mapping: Record<string, number> = {
      'BuzoOver_N_Frente_R1C': 17,
      'BuzoOver_N_Frente_R1I': 16,
      'BuzoOver_N_Frente_R2': 18,
      'BuzoOver_N_Frente_R3': 54, // Imagen real R3
      'BuzoOver_N_Dorso_R1': 15,
      'BuzoOver_N_Dorso_R2': 14,
      'BuzoOver_N_Dorso_R3': 1,
      'BuzoOver_G_Frente_R1C': 3,
      'BuzoOver_G_Frente_R1I': 4,
      'BuzoOver_G_Frente_R2': 2,
      'BuzoOver_G_Frente_R3': 2, // R3 no disponible para frente, usar R2
      'BuzoOver_G_Dorso_R1': 13,
      'BuzoOver_G_Dorso_R2': 12,
      'BuzoOver_G_Dorso_R3': 11,
      'BuzoOver_C_Frente_R1C': 6,
      'BuzoOver_C_Frente_R1I': 7,
      'BuzoOver_C_Frente_R2': 5,
      'BuzoOver_C_Frente_R3': 5, // R3 no disponible para frente, usar R2
      'BuzoOver_C_Dorso_R1': 10,
      'BuzoOver_C_Dorso_R2': 9,
      'BuzoOver_C_Dorso_R3': 8,
      'BuzoOver_M_Frente_R1C': 23,
      'BuzoOver_M_Frente_R1I': 24,
      'BuzoOver_M_Frente_R2': 22,
      'BuzoOver_M_Frente_R3': 22, // R3 no disponible para frente, usar R2
      'BuzoOver_M_Dorso_R1': 21,
      'BuzoOver_M_Dorso_R2': 20,
      'BuzoOver_M_Dorso_R3': 19,
      // BuzoOver_B (Blanco/Crema) - usar imágenes existentes como fallback
      'BuzoOver_B_Frente_R1C': 17, // Usar N como fallback
      'BuzoOver_B_Frente_R1I': 16, // Usar N como fallback
      'BuzoOver_B_Frente_R2': 18, // Usar N como fallback
      'BuzoOver_B_Frente_R3': 18, // Usar N como fallback
      'BuzoOver_B_Dorso_R1': 15, // Usar N como fallback
      'BuzoOver_B_Dorso_R2': 14, // Usar N como fallback
      'BuzoOver_B_Dorso_R3': 1, // Usar N como fallback
      'RemeraOver_M_Frente_R1C': 25,
      'RemeraOver_M_Frente_R1I': 26,
      'RemeraOver_M_Frente_R2': 27,
      'RemeraOver_M_Frente_R3': 28,
      'RemeraOver_M_Dorso_R1': 31,
      'RemeraOver_M_Dorso_R2': 30,
      'RemeraOver_M_Dorso_R3': 29,
      'RemeraOver_B_Frente_R1C': 45,
      'RemeraOver_B_Frente_R1I': 44,
      'RemeraOver_B_Frente_R2': 43,
      'RemeraOver_B_Frente_R3': 42,
      'RemeraOver_B_Dorso_R1': 39,
      'RemeraOver_B_Dorso_R2': 40,
      'RemeraOver_B_Dorso_R3': 41,
      'RemeraOver_N_Frente_R1C': 56,
      'RemeraOver_N_Frente_R1I': 55,
      'RemeraOver_N_Frente_R2': 53,
      'RemeraOver_N_Frente_R3': 54,
      'RemeraOver_N_Dorso_R1': 59,
      'RemeraOver_N_Dorso_R2': 57,
      'RemeraOver_N_Dorso_R3': 58,
      'RemeraClassic_B_Frente_R1C': 37,
      'RemeraClassic_B_Frente_R1I': 38,
      'RemeraClassic_B_Frente_R2': 36,
      'RemeraClassic_B_Frente_R3': 35,
      'RemeraClassic_B_Dorso_R1': 33,
      'RemeraClassic_B_Dorso_R2': 32,
      'RemeraClassic_B_Dorso_R3': 34,
      'RemeraClassic_N_Frente_R1C': 49,
      'RemeraClassic_N_Frente_R1I': 50,
      'RemeraClassic_N_Frente_R2': 52,
      'RemeraClassic_N_Frente_R3': 51,
      'RemeraClassic_N_Dorso_R1': 46,
      'RemeraClassic_N_Dorso_R2': 47,
      'RemeraClassic_N_Dorso_R3': 48,
    }
    
    return mapping[key] || null
  }

  const imageNumber = getImageNumber(typeCode, colorCode, sideCode, size, position)
  
  // Getting red square garment image
  
  // Debug específico para R1C (removed for cleaner console)
  
  if (!imageNumber) {
    console.warn(`No se encontró imagen para: ${typeCode}_${colorCode}_${sideCode}_${size}${position || ''}`)
    return null
  }

  // Solo R1 usa códigos de posición en el nombre del archivo
  const positionCode = size === 'R1' ? (position === 'center' ? 'C' : position === 'left' ? 'I' : '') : ''
  const fileName = `MRoja-${imageNumber}-${typeCode}_${colorCode}_${sideCode}_${size}${positionCode}.png`
  return `/garments/red-square/${fileName}`
}

// Función para obtener todas las opciones disponibles para una prenda
export function getAvailableRedSquareOptions(
  type: 'hoodie' | 'tshirt',
  variant: 'classic' | 'oversize',
  color: 'black' | 'gray' | 'caramel' | 'white' | 'cream' | 'model',
  side: 'front' | 'back'
): Array<{ size: 'R1' | 'R2' | 'R3', position?: 'center' | 'left', imagePath: string }> {
  const options = []

  // R1 con posiciones
  if (type === 'tshirt' || (type === 'hoodie' && side === 'front')) {
    // R1 Centro
    const r1CenterPath = getRedSquareGarmentImage(type, variant, color, side, 'R1', 'center')
    if (r1CenterPath) {
      options.push({ size: 'R1', position: 'center', imagePath: r1CenterPath })
    }

    // R1 Izquierda (solo para front)
    if (side === 'front') {
      const r1LeftPath = getRedSquareGarmentImage(type, variant, color, side, 'R1', 'left')
      if (r1LeftPath) {
        options.push({ size: 'R1', position: 'left', imagePath: r1LeftPath })
      }
    }
  } else {
    // R1 simple para back de hoodie
    const r1Path = getRedSquareGarmentImage(type, variant, color, side, 'R1')
    if (r1Path) {
      options.push({ size: 'R1', imagePath: r1Path })
    }
  }

  // R2
  const r2Path = getRedSquareGarmentImage(type, variant, color, side, 'R2')
  if (r2Path) {
    options.push({ size: 'R2', imagePath: r2Path })
  }

  // R3: disponible para remeras (frente/dorso) y buzos en la espalda
  if (type === 'tshirt' || (type === 'hoodie' && side === 'back')) {
    const r3Path = getRedSquareGarmentImage(type, variant, color, side, 'R3')
    if (r3Path) {
      options.push({ size: 'R3', imagePath: r3Path })
    }
  }

  return options
}

// Función para obtener la imagen base de la prenda (sin cuadrado rojo)
export function getBaseGarmentImage(
  type: 'hoodie' | 'tshirt',
  variant: 'classic' | 'oversize',
  color: 'black' | 'gray' | 'caramel' | 'white' | 'cream' | 'model',
  side: 'front' | 'back'
): string {
  const colorMap = {
    'black': 'black',
    'gray': 'gray', 
    'caramel': 'caramel', // Mantener 'caramel' para las rutas de archivos
    'white': 'white',
    'cream': 'cream', // Cream usa sus propios assets hoodie-cream-*.jpeg
    'model': 'model'
  }

  const colorCode = colorMap[color]
  const sideCode = side === 'front' ? 'front' : 'back'

  // Generar la ruta correcta según el tipo de prenda
  if (type === 'hoodie') {
    return `/garments/hoodie-${colorCode}-${sideCode}.jpeg`
  } else if (type === 'tshirt') {
    return `/garments/tshirt-${colorCode}-${variant}-${sideCode}.jpeg`
  }

  return `/garments/${type}-${variant}-${colorCode}-${sideCode}.jpeg`
}
