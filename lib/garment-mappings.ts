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
}

export function getGarmentMapping(garmentType: string, color: string, side: "front" | "back"): GarmentMapping | null {
  const builder = PATH_BUILDERS[garmentType]
  if (!builder) {
    console.log(`[v0] No path builder found for garment type: ${garmentType}`)
    return null
  }

  const needle = builder(color.toLowerCase(), side.toLowerCase())
  // Searching for garment mapping

  const mapping = garmentMappings.find((g) => g.garmentPath.toLowerCase().includes(needle))

  if (!mapping) {
    return {
      id: "fallback",
      name: "Fallback Mapping",
      garmentPath: "fallback",
      margins: { top: 0, right: 0, bottom: 0, left: 0 },
      coordinates: { x: 112, y: 175, width: 180, height: 145 }, // Hoodie Negro Frontal coordinates
      timestamp: Date.now(),
    }
  }
  return mapping
}

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
