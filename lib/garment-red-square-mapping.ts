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
  // Mapeo de colores
  const colorMap = {
    'black': 'N',
    'gray': 'G',
    'caramel': 'M',
    'white': 'B',
    'cream': 'C',
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

  const colorCode = colorMap[color] || 'N'
  const typeCode = typeMap[type] || 'BuzoOver'
  const sideCode = sideMap[side] || 'Frente'

  // Mapeo de números para cada combinación
  const getImageNumber = (tCode: string, cCode: string, sCode: string, sz: string, pos?: string) => {
    const positionSuffix = sz === 'R1' ? (pos === 'center' ? 'C' : pos === 'left' ? 'I' : '') : ''
    const key = `${tCode}_${cCode}_${sCode}_${sz}${positionSuffix}`

    const mapping: Record<string, number> = {
      'BuzoOver_N_Frente_R1C': 17,
      'BuzoOver_N_Frente_R1I': 16,
      'BuzoOver_N_Frente_R2': 18,
      'BuzoOver_N_Frente_R3': 54,
      'BuzoOver_N_Dorso_R1': 15,
      'BuzoOver_N_Dorso_R1C': 15,
      'BuzoOver_N_Dorso_R2': 14,
      'BuzoOver_N_Dorso_R3': 1,
      'BuzoOver_G_Frente_R1C': 3,
      'BuzoOver_G_Frente_R1I': 4,
      'BuzoOver_G_Frente_R2': 2,
      'BuzoOver_G_Frente_R3': 2, // Fallback a R2
      'BuzoOver_G_Dorso_R1': 13,
      'BuzoOver_G_Dorso_R1C': 13,
      'BuzoOver_G_Dorso_R2': 12,
      'BuzoOver_G_Dorso_R3': 11,
      'BuzoOver_C_Frente_R1C': 6,
      'BuzoOver_C_Frente_R1I': 7,
      'BuzoOver_C_Frente_R2': 5,
      'BuzoOver_C_Frente_R3': 5, // Fallback a R2
      'BuzoOver_C_Dorso_R1': 10,
      'BuzoOver_C_Dorso_R1C': 10,
      'BuzoOver_C_Dorso_R2': 9,
      'BuzoOver_C_Dorso_R3': 8,
      'BuzoOver_M_Frente_R1C': 23,
      'BuzoOver_M_Frente_R1I': 24,
      'BuzoOver_M_Frente_R2': 22,
      'BuzoOver_M_Frente_R3': 22, // Fallback a R2
      'BuzoOver_M_Dorso_R1': 21,
      'BuzoOver_M_Dorso_R1C': 21,
      'BuzoOver_M_Dorso_R2': 20,
      'BuzoOver_M_Dorso_R3': 19,
      // Fallbacks generalizados
      'BuzoOver_B_Frente_R1C': 17,
      'BuzoOver_B_Frente_R1I': 16,
      'BuzoOver_B_Frente_R2': 18,
      'BuzoOver_B_Frente_R3': 18,
      'BuzoOver_B_Dorso_R1': 15,
      'BuzoOver_B_Dorso_R2': 14,
      'BuzoOver_B_Dorso_R3': 1,
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

  const imageIdx = getImageNumber(typeCode, colorCode, sideCode, size, position)

  if (!imageIdx) {
    console.warn(`No se encontró imagen para: ${typeCode}_${colorCode}_${sideCode}_${size}${position || ''}`)
    return null
  }

  // Lógica de detección de tamaño real para el nombre del archivo
  let actualSize = size
  if (size === 'R3') {
    const r2Idx = getImageNumber(typeCode, colorCode, sideCode, 'R2')
    if (imageIdx === r2Idx) {
      actualSize = 'R2'
    }
  }

  const posCode = (actualSize === 'R1' && side === 'front') ? (position === 'center' ? 'C' : position === 'left' ? 'I' : '') : ''
  const fileName = `MRoja-${imageIdx}-${typeCode}_${colorCode}_${sideCode}_${actualSize}${posCode}.png`

  return `/garments/red-square/${fileName}`
}

export function getAvailableRedSquareOptions(
  type: 'hoodie' | 'tshirt',
  variant: 'classic' | 'oversize',
  color: 'black' | 'gray' | 'caramel' | 'white' | 'cream' | 'model',
  side: 'front' | 'back'
): Array<{ size: 'R1' | 'R2' | 'R3', position?: 'center' | 'left', imagePath: string }> {
  const options: Array<{ size: 'R1' | 'R2' | 'R3', position?: 'center' | 'left', imagePath: string }> = []

  // R1
  if (type === 'tshirt' || (type === 'hoodie' && side === 'front')) {
    const r1C = getRedSquareGarmentImage(type, variant, color, side, 'R1', 'center')
    if (r1C) options.push({ size: 'R1', position: 'center', imagePath: r1C })

    const r1L = getRedSquareGarmentImage(type, variant, color, side, 'R1', 'left')
    if (r1L) options.push({ size: 'R1', position: 'left', imagePath: r1L })
  } else {
    const r1 = getRedSquareGarmentImage(type, variant, color, side, 'R1')
    if (r1) options.push({ size: 'R1', imagePath: r1 })
  }

  // R2
  const r2 = getRedSquareGarmentImage(type, variant, color, side, 'R2')
  if (r2) options.push({ size: 'R2', imagePath: r2 })

  // R3
  if (type === 'tshirt' || (type === 'hoodie' && side === 'back')) {
    const r3 = getRedSquareGarmentImage(type, variant, color, side, 'R3')
    if (r3) options.push({ size: 'R3', imagePath: r3 })
  }

  return options
}

export function getBaseGarmentImage(
  type: 'hoodie' | 'tshirt',
  variant: 'classic' | 'oversize',
  color: 'black' | 'gray' | 'caramel' | 'white' | 'cream' | 'model',
  side: 'front' | 'back'
): string {
  const { getGarmentMapping } = require("@/lib/garment-mappings")
  const garmentTypeMap = {
    'hoodie': 'astra-oversize-hoodie',
    'tshirt': variant === 'classic' ? 'aldea-classic-tshirt' : 'aura-oversize-tshirt'
  }

  const garmentType = garmentTypeMap[type]
  const mapping = getGarmentMapping(garmentType, color, side)

  if (mapping && mapping.garmentPath !== 'fallback') {
    return mapping.garmentPath
  }

  const sideCode = side === 'front' ? 'front' : 'back'
  let ext = 'jpeg'
  if (color === 'caramel' || color === 'cream' || color === 'gray') {
    if (type === 'hoodie' && side === 'back') ext = 'png'
    if (type === 'tshirt' && color === 'caramel' && side === 'front') ext = 'png'
  }

  if (type === 'hoodie') {
    return `/garments/hoodie-${color}-${sideCode}.${ext}`
  } else {
    return `/garments/tshirt-${color}-${variant}-${sideCode}.${ext}`
  }
}
