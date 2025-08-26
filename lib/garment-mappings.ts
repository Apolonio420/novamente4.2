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
