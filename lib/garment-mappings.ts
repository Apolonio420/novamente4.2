export interface GarmentMapping {
  id: string
  name: string
  garmentPath: string
  margins: { top: number; right: number; bottom: number; left: number }
  coordinates: { x: number; y: number; width: number; height: number }
  timestamp: number
}

import garmentMappingsData from "./garment-mappings.json"
export const garmentMappings: GarmentMapping[] = garmentMappingsData as GarmentMapping[]

const PATH_BUILDERS: Record<string, (color: string, side: "front" | "back") => string> = {
  "aura-oversize-tshirt": (c, s) => `tshirt-${c}-oversize-${s}`,
  "aldea-classic-tshirt": (c, s) => `tshirt-${c}-classic-${s}`,
  "astra-oversize-hoodie": (c, s) => `hoodie-${c}-${s}`,
  // "lienzo": ... (si aplica)
}

export function getGarmentMapping(garmentType: string, color: string, side: "front" | "back"): GarmentMapping | null {
  const builder = PATH_BUILDERS[garmentType]
  if (!builder) return null
  const needle = builder(color.toLowerCase(), side.toLowerCase())
  const m = garmentMappings.find((g) => g.garmentPath.toLowerCase().includes(needle))
  return m ?? null
}

/** COMPAT: viejo import en /design/placeholder */
export function getGarmentPositioning(mapping: GarmentMapping | null) {
  if (!mapping) {
    return {
      left: "50%",
      top: "45%",
      width: "200px",
      height: "200px",
      maxWidth: "40%",
      maxHeight: "40%",
    }
  }
  // Este helper queda como "dummy" y ya no se usa para el borde real (ver PrintArea).
  // Lo mantenemos solo para no romper imports antiguos.
  const baseWidth = 400,
    baseHeight = 500
  return {
    left: `${(mapping.coordinates.x / baseWidth) * 100}%`,
    top: `${(mapping.coordinates.y / baseHeight) * 100}%`,
    width: `${mapping.coordinates.width}px`,
    height: `${mapping.coordinates.height}px`,
    maxWidth: `${(mapping.coordinates.width / baseWidth) * 100}%`,
    maxHeight: `${(mapping.coordinates.height / baseHeight) * 100}%`,
  }
}
