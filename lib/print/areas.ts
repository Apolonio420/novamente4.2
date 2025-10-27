// lib/print/areas.ts
export type RegionKey = "R1_center" | "R1_left" | "R2_center" | "R3_center";
export type SideKey = "front" | "back";

interface PrintArea {
  wPct: number;  // ancho del estampado (% del ancho de la prenda)
  hPct: number;  // alto del estampado (% del alto de la prenda)
  xPct: number; // posición horizontal (% desde la izquierda)
  yPct: number; // posición vertical (% desde arriba)
}

// Proporciones calibradas según imágenes modelo con recuadro rojo
export const PRINT_AREAS: Record<SideKey, Record<RegionKey, PrintArea>> = {
  front: {
    R1_center: { wPct: 12, hPct: 12, xPct: 44, yPct: 28 }, // pequeño tipo bolsillo
    R1_left:   { wPct: 12, hPct: 12, xPct: 28, yPct: 28 },
    R2_center: { wPct: 24, hPct: 24, xPct: 38, yPct: 24 }, // mediano pechera estándar
    R3_center: { wPct: 38, hPct: 38, xPct: 31, yPct: 20 }  // grande torso completo
  },
  back: {
    R1_center: { wPct: 12, hPct: 12, xPct: 44, yPct: 30 }, // igual al frente con ajuste vertical
    R1_left:   { wPct: 12, hPct: 12, xPct: 28, yPct: 30 },
    R2_center: { wPct: 24, hPct: 24, xPct: 38, yPct: 26 },
    R3_center: { wPct: 38, hPct: 38, xPct: 31, yPct: 22 }
  }
};

/**
 * Convierte porcentajes de área a píxeles absolutos
 */
export function areaToPixels(
  area: PrintArea,
  garmentWidth: number,
  garmentHeight: number
): { 
  width: number
  height: number
  x: number
  y: number
} {
  return {
    width: Math.round(area.wPct / 100 * garmentWidth),
    height: Math.round(area.hPct / 100 * garmentHeight),
    x: Math.round(area.xPct / 100 * garmentWidth),
    y: Math.round(area.yPct / 100 * garmentHeight),
  }
}

/**
 * Obtiene el área de impresión con fallback seguro
 */
export function getPrintArea(
  side: SideKey,
  region: RegionKey
): PrintArea | null {
  const area = PRINT_AREAS[side]?.[region]
  if (area) return area
  
  // Fallback a R2_center si la región no existe
  console.warn(`⚠️ Región inválida: ${side}/${region}, usando fallback R2_center`)
  return PRINT_AREAS[side]?.["R2_center"] || null
}

