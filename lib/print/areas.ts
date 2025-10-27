// lib/print/areas.ts
export type RegionKey = "R1_center" | "R1_left" | "R2_center" | "R3_center";
export type SideKey = "front" | "back";

interface Area {
  wPct: number;  // ancho en porcentaje del total de la prenda
  hPct: number;  // alto en porcentaje del total de la prenda
  xPct: number; // posición X (centro) en porcentaje
  yPct: number; // posición Y (centro) en porcentaje
}

export const PRINT_AREAS: Record<SideKey, Record<RegionKey, Area>> = {
  front: {
    R1_center: { wPct: 16, hPct: 16, xPct: 42, yPct: 26 },
    R1_left:   { wPct: 16, hPct: 16, xPct: 28, yPct: 26 },
    R2_center: { wPct: 28, hPct: 28, xPct: 36, yPct: 22 },
    R3_center: { wPct: 44, hPct: 44, xPct: 28, yPct: 20 },
  },
  back: {
    R1_center: { wPct: 16, hPct: 16, xPct: 42, yPct: 26 },
    R1_left:   { wPct: 16, hPct: 16, xPct: 28, yPct: 26 },
    R2_center: { wPct: 28, hPct: 28, xPct: 36, yPct: 22 },
    R3_center: { wPct: 44, hPct: 44, xPct: 28, yPct: 20 },
  }
};

/**
 * Convierte porcentajes de área a píxeles absolutos
 */
export function areaToPixels(
  area: Area,
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

