export interface GarmentMapping {
  id: string
  name: string
  garmentPath: string
  margins: {
    top: number
    right: number
    bottom: number
    left: number
  }
  coordinates: {
    x: number
    y: number
    width: number
    height: number
  }
  timestamp: number
}

// Import the JSON data
import garmentMappingsData from "./garment-mappings.json"

export const garmentMappings: GarmentMapping[] = garmentMappingsData

// Helper function to get garment mapping by name pattern
export function getGarmentMapping(garmentType: string, color: string, side: "front" | "back"): GarmentMapping | null {
  const searchPattern = `${garmentType.toLowerCase()}-${color.toLowerCase()}-${side.toLowerCase()}`

  const mapping = garmentMappings.find(
    (mapping) =>
      mapping.garmentPath.toLowerCase().includes(searchPattern) || mapping.name.toLowerCase().includes(searchPattern),
  )

  return mapping || null
}

// Helper function to convert garment coordinates to CSS positioning
export function getGarmentPositioning(mapping: GarmentMapping | null) {
  if (!mapping) {
    // Default positioning if no mapping found
    return {
      left: "50%",
      top: "45%",
      width: "200px",
      height: "200px",
      maxWidth: "40%",
      maxHeight: "40%",
    }
  }

  // Convert absolute coordinates to percentage-based positioning
  // Assuming garment images are roughly 400px wide for calculation
  const baseWidth = 400
  const baseHeight = 500

  return {
    left: `${(mapping.coordinates.x / baseWidth) * 100}%`,
    top: `${(mapping.coordinates.y / baseHeight) * 100}%`,
    width: `${mapping.coordinates.width}px`,
    height: `${mapping.coordinates.height}px`,
    maxWidth: `${(mapping.coordinates.width / baseWidth) * 100}%`,
    maxHeight: `${(mapping.coordinates.height / baseHeight) * 100}%`,
  }
}
