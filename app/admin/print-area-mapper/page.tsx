"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Download, Save, Trash2, RotateCcw, Plus, Minus, Upload } from "lucide-react"

interface PrintAreaMapping {
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

interface GarmentPreset {
  top: number
  right: number
  bottom: number
  left: number
}

// Coordenadas exactas de las prendas ya mapeadas
const PREDEFINED_MAPPINGS: Record<string, PrintAreaMapping> = {
  "/garments/hoodie-black-front.jpeg": {
    id: "1755023347511",
    name: "Hoodie Negro Frontal",
    garmentPath: "/garments/hoodie-black-front.jpeg",
    margins: { top: 35, right: 27, bottom: 36, left: 28 },
    coordinates: { x: 112, y: 175, width: 180, height: 145 },
    timestamp: 1755023347511,
  },
  "/garments/hoodie-black-back.jpeg": {
    id: "1755023390559",
    name: "Hoodie Negro Trasero",
    garmentPath: "/garments/hoodie-black-back.jpeg",
    margins: { top: 35, right: 26, bottom: 17, left: 29 },
    coordinates: { x: 116, y: 175, width: 180, height: 240 },
    timestamp: 1755023390559,
  },
  "/garments/hoodie-caramel-front.jpeg": {
    id: "1755023468831",
    name: "Hoodie Caramelo Frontal",
    garmentPath: "/garments/hoodie-caramel-front.jpeg",
    margins: { top: 32, right: 28, bottom: 39, left: 28 },
    coordinates: { x: 112, y: 160, width: 176, height: 145 },
    timestamp: 1755023468831,
  },
  "/garments/hoodie-caramel-back.png": {
    id: "1755023509358",
    name: "Hoodie Caramelo Trasero",
    garmentPath: "/garments/hoodie-caramel-back.png",
    margins: { top: 31, right: 32, bottom: 20, left: 32 },
    coordinates: { x: 128, y: 155, width: 144, height: 245 },
    timestamp: 1755023509358,
  },
  "/garments/hoodie-cream-front.jpeg": {
    id: "1755023531199",
    name: "Hoodie Crema Frontal",
    garmentPath: "/garments/hoodie-cream-front.jpeg",
    margins: { top: 31, right: 31, bottom: 42, left: 29 },
    coordinates: { x: 116, y: 155, width: 160, height: 135 },
    timestamp: 1755023531199,
  },
  "/garments/hoodie-cream-back.png": {
    id: "1755023566679",
    name: "Hoodie Crema Trasero",
    garmentPath: "/garments/hoodie-cream-back.png",
    margins: { top: 30, right: 30, bottom: 19, left: 31 },
    coordinates: { x: 124, y: 150, width: 156, height: 255 },
    timestamp: 1755023566679,
  },
  "/garments/hoodie-gray-front.jpeg": {
    id: "1755023609951",
    name: "Hoodie Gris Frontal",
    garmentPath: "/garments/hoodie-gray-front.jpeg",
    margins: { top: 29, right: 31, bottom: 41, left: 29 },
    coordinates: { x: 116, y: 145, width: 160, height: 150 },
    timestamp: 1755023609951,
  },
  "/garments/hoodie-gray-back.png": {
    id: "1755023640767",
    name: "Hoodie Gris Trasero",
    garmentPath: "/garments/hoodie-gray-back.png",
    margins: { top: 30, right: 30, bottom: 19, left: 29 },
    coordinates: { x: 116, y: 150, width: 164, height: 255 },
    timestamp: 1755023640767,
  },
  "/garments/tshirt-black-classic-front.jpeg": {
    id: "1755023682390",
    name: "T-shirt Negro Clásico Frontal",
    garmentPath: "/garments/tshirt-black-classic-front.jpeg",
    margins: { top: 27, right: 25, bottom: 20, left: 24 },
    coordinates: { x: 96, y: 135, width: 204, height: 265 },
    timestamp: 1755023682390,
  },
  "/garments/tshirt-black-classic-back.jpeg": {
    id: "1755023706200",
    name: "T-shirt Negro Clásico Trasero",
    garmentPath: "/garments/tshirt-black-classic-back.jpeg",
    margins: { top: 21, right: 27, bottom: 17, left: 25 },
    coordinates: { x: 100, y: 105, width: 192, height: 310 },
    timestamp: 1755023706200,
  },
  "/garments/tshirt-black-oversize-front.jpeg": {
    id: "1755023730447",
    name: "T-shirt Negro Oversize Frontal",
    garmentPath: "/garments/tshirt-black-oversize-front.jpeg",
    margins: { top: 26, right: 28, bottom: 19, left: 26 },
    coordinates: { x: 104, y: 130, width: 184, height: 275 },
    timestamp: 1755023730447,
  },
  "/garments/tshirt-black-oversize-back.jpeg": {
    id: "1755023755554",
    name: "T-shirt Negro Oversize Trasero",
    garmentPath: "/garments/tshirt-black-oversize-back.jpeg",
    margins: { top: 21, right: 27, bottom: 17, left: 27 },
    coordinates: { x: 108, y: 105, width: 184, height: 310 },
    timestamp: 1755023755554,
  },
  "/garments/tshirt-white-classic-front.jpeg": {
    id: "1755023779606",
    name: "T-shirt Blanco Clásico Frontal",
    garmentPath: "/garments/tshirt-white-classic-front.jpeg",
    margins: { top: 25, right: 25, bottom: 17, left: 24 },
    coordinates: { x: 96, y: 125, width: 204, height: 290 },
    timestamp: 1755023779606,
  },
  "/garments/tshirt-white-classic-back.jpeg": {
    id: "1755023805622",
    name: "T-shirt Blanco Clásico Trasero",
    garmentPath: "/garments/tshirt-white-classic-back.jpeg",
    margins: { top: 22, right: 27, bottom: 18, left: 28 },
    coordinates: { x: 112, y: 110, width: 180, height: 300 },
    timestamp: 1755023805622,
  },
  "/garments/tshirt-white-oversize-front.jpeg": {
    id: "1755023823255",
    name: "T-shirt Blanco Oversize Frontal",
    garmentPath: "/garments/tshirt-white-oversize-front.jpeg",
    margins: { top: 23, right: 31, bottom: 16, left: 28 },
    coordinates: { x: 112, y: 115, width: 164, height: 305 },
    timestamp: 1755023823255,
  },
  "/garments/tshirt-white-oversize-back.jpeg": {
    id: "1755023843496",
    name: "T-shirt Blanco Oversize Trasero",
    garmentPath: "/garments/tshirt-white-oversize-back.jpeg",
    margins: { top: 21, right: 26, bottom: 16, left: 30 },
    coordinates: { x: 120, y: 105, width: 176, height: 315 },
    timestamp: 1755023843496,
  },
  "/garments/tshirt-caramel-oversize-front.jpeg": {
    id: "1755024175022",
    name: "T-shirt Caramelo Oversize Frontal",
    garmentPath: "/garments/tshirt-caramel-oversize-front.jpeg",
    margins: { top: 24, right: 27, bottom: 18, left: 29 },
    coordinates: { x: 116, y: 120, width: 176, height: 290 },
    timestamp: 1755024175022,
  },
  "/garments/tshirt-caramel-oversize-back.jpeg": {
    id: "1755024195151",
    name: "T-shirt Caramelo Oversize Trasero",
    garmentPath: "/garments/tshirt-caramel-oversize-back.jpeg",
    margins: { top: 20, right: 28, bottom: 17, left: 29 },
    coordinates: { x: 116, y: 100, width: 172, height: 315 },
    timestamp: 1755024195151,
  },
}

const GARMENT_PRESETS: Record<string, GarmentPreset> = {
  "hoodie-front": { top: 25, right: 15, bottom: 45, left: 15 },
  "hoodie-back": { top: 20, right: 15, bottom: 30, left: 15 },
  "tshirt-front": { top: 20, right: 10, bottom: 25, left: 10 },
  "tshirt-back": { top: 15, right: 10, bottom: 20, left: 10 },
}

const GARMENTS = [
  { path: "/garments/hoodie-black-front.jpeg", name: "Hoodie Negro Frontal" },
  { path: "/garments/hoodie-black-back.jpeg", name: "Hoodie Negro Trasero" },
  { path: "/garments/hoodie-caramel-front.jpeg", name: "Hoodie Caramelo Frontal" },
  { path: "/garments/hoodie-caramel-back.png", name: "Hoodie Caramelo Trasero" },
  { path: "/garments/hoodie-cream-front.jpeg", name: "Hoodie Crema Frontal" },
  { path: "/garments/hoodie-cream-back.png", name: "Hoodie Crema Trasero" },
  { path: "/garments/hoodie-gray-front.jpeg", name: "Hoodie Gris Frontal" },
  { path: "/garments/hoodie-gray-back.png", name: "Hoodie Gris Trasero" },
  { path: "/garments/tshirt-black-classic-front.jpeg", name: "T-shirt Negro Clásico Frontal" },
  { path: "/garments/tshirt-black-classic-back.jpeg", name: "T-shirt Negro Clásico Trasero" },
  { path: "/garments/tshirt-black-oversize-front.jpeg", name: "T-shirt Negro Oversize Frontal" },
  { path: "/garments/tshirt-black-oversize-back.jpeg", name: "T-shirt Negro Oversize Trasero" },
  { path: "/garments/tshirt-white-classic-front.jpeg", name: "T-shirt Blanco Clásico Frontal" },
  { path: "/garments/tshirt-white-classic-back.jpeg", name: "T-shirt Blanco Clásico Trasero" },
  { path: "/garments/tshirt-white-oversize-front.jpeg", name: "T-shirt Blanco Oversize Frontal" },
  { path: "/garments/tshirt-white-oversize-back.jpeg", name: "T-shirt Blanco Oversize Trasero" },
  { path: "/garments/tshirt-caramel-oversize-front.jpeg", name: "T-shirt Caramelo Oversize Frontal" },
  { path: "/garments/tshirt-caramel-oversize-back.jpeg", name: "T-shirt Caramelo Oversize Trasero" },
]

const MARGIN_PRESETS = [
  { name: "Mínimo", values: { top: 10, right: 8, bottom: 15, left: 8 } },
  { name: "Estándar", values: { top: 20, right: 15, bottom: 30, left: 15 } },
  { name: "Conservador", values: { top: 30, right: 20, bottom: 40, left: 20 } },
]

export default function PrintAreaMapper() {
  const [selectedGarment, setSelectedGarment] = useState<string>("")
  const [margins, setMargins] = useState({ top: 20, right: 15, bottom: 30, left: 15 })
  const [mappingName, setMappingName] = useState("")
  const [savedMappings, setSavedMappings] = useState<PrintAreaMapping[]>([])
  const [currentCoordinates, setCurrentCoordinates] = useState<{
    x: number
    y: number
    width: number
    height: number
  } | null>(null)
  const [isUsingPredefined, setIsUsingPredefined] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem("printAreaMappings")
    if (saved) {
      try {
        setSavedMappings(JSON.parse(saved))
      } catch (error) {
        console.error("Error loading saved mappings:", error)
        setSavedMappings([])
      }
    }
  }, [])

  const getGarmentType = (path: string): string => {
    const filename = path.split("/").pop() || ""
    if (filename.includes("hoodie") && filename.includes("front")) return "hoodie-front"
    if (filename.includes("hoodie") && filename.includes("back")) return "hoodie-back"
    if (filename.includes("tshirt") && filename.includes("front")) return "tshirt-front"
    if (filename.includes("tshirt") && filename.includes("back")) return "tshirt-back"
    return "tshirt-front"
  }

  const handleGarmentSelect = (garmentPath: string) => {
    setSelectedGarment(garmentPath)

    // Check if we have predefined mapping for this garment
    const predefinedMapping = PREDEFINED_MAPPINGS[garmentPath]

    if (predefinedMapping) {
      // Use exact predefined coordinates and margins
      setMargins(predefinedMapping.margins)
      setCurrentCoordinates(predefinedMapping.coordinates)
      setMappingName(predefinedMapping.name)
      setIsUsingPredefined(true)
    } else {
      // Fallback to preset logic
      const garmentType = getGarmentType(garmentPath)
      const preset = GARMENT_PRESETS[garmentType]
      if (preset) {
        setMargins(preset)
      }
      setCurrentCoordinates(null)
      setIsUsingPredefined(false)

      const garmentInfo = GARMENTS.find((g) => g.path === garmentPath)
      setMappingName(garmentInfo?.name || "")
    }
  }

  const calculateCoordinates = () => {
    // If we're using predefined coordinates, return those
    if (isUsingPredefined && currentCoordinates) {
      return currentCoordinates
    }

    // Otherwise calculate from margins
    const imageWidth = 400
    const imageHeight = 500

    return {
      x: Math.round((margins.left / 100) * imageWidth),
      y: Math.round((margins.top / 100) * imageHeight),
      width: Math.round(imageWidth - ((margins.left + margins.right) / 100) * imageWidth),
      height: Math.round(imageHeight - ((margins.top + margins.bottom) / 100) * imageHeight),
    }
  }

  const adjustMargin = (side: keyof typeof margins, delta: number) => {
    setMargins((prev) => ({
      ...prev,
      [side]: Math.max(0, Math.min(50, prev[side] + delta)),
    }))
    setIsUsingPredefined(false) // User is manually adjusting
    setCurrentCoordinates(null)
  }

  const applyPreset = (preset: { top: number; right: number; bottom: number; left: number }) => {
    setMargins(preset)
    setIsUsingPredefined(false)
    setCurrentCoordinates(null)
  }

  const loadPredefinedMapping = () => {
    if (selectedGarment && PREDEFINED_MAPPINGS[selectedGarment]) {
      const predefined = PREDEFINED_MAPPINGS[selectedGarment]
      setMargins(predefined.margins)
      setCurrentCoordinates(predefined.coordinates)
      setMappingName(predefined.name)
      setIsUsingPredefined(true)
    }
  }

  const saveMapping = () => {
    if (!selectedGarment || !mappingName.trim()) return

    const coordinates = calculateCoordinates()
    const mapping: PrintAreaMapping = {
      id: Date.now().toString(),
      name: mappingName.trim(),
      garmentPath: selectedGarment,
      margins: { ...margins },
      coordinates,
      timestamp: Date.now(),
    }

    const updatedMappings = [...savedMappings, mapping]
    setSavedMappings(updatedMappings)
    localStorage.setItem("printAreaMappings", JSON.stringify(updatedMappings))
  }

  const deleteMapping = (id: string) => {
    const updatedMappings = savedMappings.filter((m) => m.id !== id)
    setSavedMappings(updatedMappings)
    localStorage.setItem("printAreaMappings", JSON.stringify(updatedMappings))
  }

  const resetMargins = () => {
    setMargins({ top: 20, right: 15, bottom: 30, left: 15 })
    setIsUsingPredefined(false)
    setCurrentCoordinates(null)
  }

  const exportMappings = () => {
    const allMappings = [...Object.values(PREDEFINED_MAPPINGS), ...savedMappings]
    const dataStr = JSON.stringify(allMappings, null, 2)
    const dataUri = "data:application/json;charset=utf-8," + encodeURIComponent(dataStr)

    const exportFileDefaultName = `complete-print-area-mappings-${new Date().toISOString().split("T")[0]}.json`

    const linkElement = document.createElement("a")
    linkElement.setAttribute("href", dataUri)
    linkElement.setAttribute("download", exportFileDefaultName)
    linkElement.click()
  }

  const coordinates = selectedGarment ? calculateCoordinates() : null

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Print Area Mapper</h1>
        <p className="text-muted-foreground">
          Map print areas for garments using precise coordinates and visual margin controls.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Garment Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Select Garment</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {GARMENTS.map((garment) => (
                <Button
                  key={garment.path}
                  variant={selectedGarment === garment.path ? "default" : "outline"}
                  className="w-full justify-start text-left h-auto p-3"
                  onClick={() => handleGarmentSelect(garment.path)}
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={garment.path || "/placeholder.svg"}
                      alt={garment.name}
                      className="w-12 h-12 object-cover rounded"
                    />
                    <div className="flex flex-col items-start">
                      <span className="text-sm">{garment.name}</span>
                      {PREDEFINED_MAPPINGS[garment.path] && (
                        <span className="text-xs text-green-600 font-medium">✓ Mapped</span>
                      )}
                    </div>
                  </div>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Controls */}
        <Card>
          <CardHeader>
            <CardTitle>Print Area Controls</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label htmlFor="mapping-name">Mapping Name</Label>
              <Input
                id="mapping-name"
                value={mappingName}
                onChange={(e) => setMappingName(e.target.value)}
                placeholder="Enter mapping name"
                className="text-base"
              />
            </div>

            {/* Status Indicator */}
            {selectedGarment && (
              <div className="p-3 rounded-lg bg-gray-50">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    {isUsingPredefined ? "Using Predefined Mapping" : "Custom Mapping"}
                  </span>
                  {PREDEFINED_MAPPINGS[selectedGarment] && (
                    <Button variant="outline" size="sm" onClick={loadPredefinedMapping} disabled={isUsingPredefined}>
                      <Upload className="w-4 h-4 mr-1" />
                      Load Exact
                    </Button>
                  )}
                </div>
                {isUsingPredefined && (
                  <p className="text-xs text-green-600 mt-1">Using exact coordinates from your mapping data</p>
                )}
              </div>
            )}

            <Separator />

            {/* Preset Buttons */}
            <div className="space-y-3">
              <h4 className="font-medium">Quick Presets</h4>
              <div className="grid grid-cols-3 gap-2">
                {MARGIN_PRESETS.map((preset) => (
                  <Button
                    key={preset.name}
                    variant="outline"
                    size="sm"
                    onClick={() => applyPreset(preset.values)}
                    className="text-xs"
                  >
                    {preset.name}
                  </Button>
                ))}
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Margins (%)</h4>
                <Button variant="outline" size="sm" onClick={resetMargins}>
                  <RotateCcw className="w-4 h-4 mr-1" />
                  Reset
                </Button>
              </div>

              {/* Top Margin */}
              <div className="space-y-2">
                <Label>Top: {margins.top}%</Label>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => adjustMargin("top", -1)} className="h-10 w-10 p-0">
                    <Minus className="w-4 h-4" />
                  </Button>
                  <div className="flex-1">
                    <input
                      type="range"
                      min="0"
                      max="50"
                      value={margins.top}
                      onChange={(e) => {
                        setMargins((prev) => ({ ...prev, top: Number(e.target.value) }))
                        setIsUsingPredefined(false)
                        setCurrentCoordinates(null)
                      }}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                    />
                  </div>
                  <Button variant="outline" size="sm" onClick={() => adjustMargin("top", 1)} className="h-10 w-10 p-0">
                    <Plus className="w-4 h-4" />
                  </Button>
                  <Input
                    type="number"
                    min="0"
                    max="50"
                    value={margins.top}
                    onChange={(e) => {
                      setMargins((prev) => ({ ...prev, top: Number(e.target.value) }))
                      setIsUsingPredefined(false)
                      setCurrentCoordinates(null)
                    }}
                    className="w-16 text-center text-sm"
                  />
                </div>
              </div>

              {/* Bottom Margin */}
              <div className="space-y-2">
                <Label>Bottom: {margins.bottom}%</Label>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => adjustMargin("bottom", -1)}
                    className="h-10 w-10 p-0"
                  >
                    <Minus className="w-4 h-4" />
                  </Button>
                  <div className="flex-1">
                    <input
                      type="range"
                      min="0"
                      max="50"
                      value={margins.bottom}
                      onChange={(e) => {
                        setMargins((prev) => ({ ...prev, bottom: Number(e.target.value) }))
                        setIsUsingPredefined(false)
                        setCurrentCoordinates(null)
                      }}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                    />
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => adjustMargin("bottom", 1)}
                    className="h-10 w-10 p-0"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                  <Input
                    type="number"
                    min="0"
                    max="50"
                    value={margins.bottom}
                    onChange={(e) => {
                      setMargins((prev) => ({ ...prev, bottom: Number(e.target.value) }))
                      setIsUsingPredefined(false)
                      setCurrentCoordinates(null)
                    }}
                    className="w-16 text-center text-sm"
                  />
                </div>
              </div>

              {/* Left Margin */}
              <div className="space-y-2">
                <Label>Left: {margins.left}%</Label>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => adjustMargin("left", -1)}
                    className="h-10 w-10 p-0"
                  >
                    <Minus className="w-4 h-4" />
                  </Button>
                  <div className="flex-1">
                    <input
                      type="range"
                      min="0"
                      max="50"
                      value={margins.left}
                      onChange={(e) => {
                        setMargins((prev) => ({ ...prev, left: Number(e.target.value) }))
                        setIsUsingPredefined(false)
                        setCurrentCoordinates(null)
                      }}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                    />
                  </div>
                  <Button variant="outline" size="sm" onClick={() => adjustMargin("left", 1)} className="h-10 w-10 p-0">
                    <Plus className="w-4 h-4" />
                  </Button>
                  <Input
                    type="number"
                    min="0"
                    max="50"
                    value={margins.left}
                    onChange={(e) => {
                      setMargins((prev) => ({ ...prev, left: Number(e.target.value) }))
                      setIsUsingPredefined(false)
                      setCurrentCoordinates(null)
                    }}
                    className="w-16 text-center text-sm"
                  />
                </div>
              </div>

              {/* Right Margin */}
              <div className="space-y-2">
                <Label>Right: {margins.right}%</Label>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => adjustMargin("right", -1)}
                    className="h-10 w-10 p-0"
                  >
                    <Minus className="w-4 h-4" />
                  </Button>
                  <div className="flex-1">
                    <input
                      type="range"
                      min="0"
                      max="50"
                      value={margins.right}
                      onChange={(e) => {
                        setMargins((prev) => ({ ...prev, right: Number(e.target.value) }))
                        setIsUsingPredefined(false)
                        setCurrentCoordinates(null)
                      }}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                    />
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => adjustMargin("right", 1)}
                    className="h-10 w-10 p-0"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                  <Input
                    type="number"
                    min="0"
                    max="50"
                    value={margins.right}
                    onChange={(e) => {
                      setMargins((prev) => ({ ...prev, right: Number(e.target.value) }))
                      setIsUsingPredefined(false)
                      setCurrentCoordinates(null)
                    }}
                    className="w-16 text-center text-sm"
                  />
                </div>
              </div>
            </div>

            {coordinates && (
              <>
                <Separator />
                <div className="space-y-2">
                  <h4 className="font-medium">{isUsingPredefined ? "Exact Coordinates" : "Calculated Coordinates"}</h4>
                  <div className="text-sm space-y-1 bg-gray-50 p-3 rounded">
                    <div>X: {coordinates.x}px</div>
                    <div>Y: {coordinates.y}px</div>
                    <div>Width: {coordinates.width}px</div>
                    <div>Height: {coordinates.height}px</div>
                    {isUsingPredefined && (
                      <div className="text-green-600 font-medium text-xs mt-2">
                        ✓ Using your exact mapped coordinates
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            <Button onClick={saveMapping} disabled={!selectedGarment || !mappingName.trim()} className="w-full">
              <Save className="w-4 h-4 mr-2" />
              Save Mapping
            </Button>
          </CardContent>
        </Card>

        {/* Preview */}
        <Card>
          <CardHeader>
            <CardTitle>Preview</CardTitle>
          </CardHeader>
          <CardContent>
            {selectedGarment ? (
              <div className="relative">
                <img
                  src={selectedGarment || "/placeholder.svg"}
                  alt="Selected garment"
                  className="w-full max-w-sm mx-auto rounded-lg"
                />

                {/* Print area overlay */}
                <div
                  className="absolute border-2 border-dashed border-blue-500 bg-blue-100/20"
                  style={{
                    left: `${margins.left}%`,
                    top: `${margins.top}%`,
                    right: `${margins.right}%`,
                    bottom: `${margins.bottom}%`,
                  }}
                >
                  {/* Corner indicators */}
                  <div className="absolute -top-1 -left-1 w-2 h-2 bg-blue-500 rounded-full"></div>
                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full"></div>
                  <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-blue-500 rounded-full"></div>
                  <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-blue-500 rounded-full"></div>

                  {/* Exact coordinates indicator */}
                  {isUsingPredefined && (
                    <div className="absolute top-1 left-1 bg-green-500 text-white text-xs px-1 py-0.5 rounded">
                      EXACT
                    </div>
                  )}
                </div>

                {/* Non-printable area overlays */}
                <div
                  className="absolute top-0 left-0 right-0 bg-red-500/20"
                  style={{ height: `${margins.top}%` }}
                ></div>
                <div
                  className="absolute bottom-0 left-0 right-0 bg-red-500/20"
                  style={{ height: `${margins.bottom}%` }}
                ></div>
                <div
                  className="absolute left-0 bg-red-500/20"
                  style={{
                    top: `${margins.top}%`,
                    bottom: `${margins.bottom}%`,
                    width: `${margins.left}%`,
                  }}
                ></div>
                <div
                  className="absolute right-0 bg-red-500/20"
                  style={{
                    top: `${margins.top}%`,
                    bottom: `${margins.bottom}%`,
                    width: `${margins.right}%`,
                  }}
                ></div>
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-12">Select a garment to see the preview</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Predefined Mappings Summary */}
      <Card className="mt-6">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Predefined Mappings ({Object.keys(PREDEFINED_MAPPINGS).length})</CardTitle>
          <Button onClick={exportMappings} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export All
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.values(PREDEFINED_MAPPINGS).map((mapping) => (
              <div key={mapping.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium truncate">{mapping.name}</h4>
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">EXACT</span>
                </div>

                <div className="relative aspect-square">
                  <img
                    src={mapping.garmentPath || "/placeholder.svg"}
                    alt={mapping.name}
                    className="w-full h-full object-cover rounded"
                  />
                  <div
                    className="absolute border border-blue-400 bg-blue-100/30"
                    style={{
                      left: `${mapping.margins.left}%`,
                      top: `${mapping.margins.top}%`,
                      right: `${mapping.margins.right}%`,
                      bottom: `${mapping.margins.bottom}%`,
                    }}
                  ></div>
                </div>

                <div className="text-xs text-muted-foreground space-y-1">
                  <div>
                    Margins: {mapping.margins.top}% {mapping.margins.right}% {mapping.margins.bottom}%{" "}
                    {mapping.margins.left}%
                  </div>
                  <div>
                    Size: {mapping.coordinates.width}×{mapping.coordinates.height}px
                  </div>
                  <div>
                    Position: ({mapping.coordinates.x}, {mapping.coordinates.y})
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Saved Mappings */}
      {savedMappings.length > 0 && (
        <Card className="mt-6">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Custom Saved Mappings ({savedMappings.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {savedMappings.map((mapping) => (
                <div key={mapping.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium truncate">{mapping.name}</h4>
                    <Button onClick={() => deleteMapping(mapping.id)} variant="ghost" size="sm">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="relative aspect-square">
                    <img
                      src={mapping.garmentPath || "/placeholder.svg"}
                      alt={mapping.name}
                      className="w-full h-full object-cover rounded"
                    />
                    <div
                      className="absolute border border-blue-400 bg-blue-100/30"
                      style={{
                        left: `${mapping.margins.left}%`,
                        top: `${mapping.margins.top}%`,
                        right: `${mapping.margins.right}%`,
                        bottom: `${mapping.margins.bottom}%`,
                      }}
                    ></div>
                  </div>

                  <div className="text-xs text-muted-foreground space-y-1">
                    <div>
                      Margins: {mapping.margins.top}% {mapping.margins.right}% {mapping.margins.bottom}%{" "}
                      {mapping.margins.left}%
                    </div>
                    <div>
                      Size: {mapping.coordinates.width}×{mapping.coordinates.height}px
                    </div>
                    <div>
                      Position: ({mapping.coordinates.x}, {mapping.coordinates.y})
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>How to Use</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground space-y-2">
            <p>
              <strong>1.</strong> Select a garment - items marked with ✓ have exact predefined coordinates
            </p>
            <p>
              <strong>2.</strong> Predefined mappings load automatically with exact coordinates
            </p>
            <p>
              <strong>3.</strong> Use "Load Exact" button to restore predefined mapping if modified
            </p>
            <p>
              <strong>4.</strong> Adjust margins manually to create custom mappings
            </p>
            <p>
              <strong>5.</strong> Blue area shows printable zone, red areas are margins
            </p>
            <p>
              <strong>6.</strong> Export includes both predefined and custom mappings
            </p>
          </div>
        </CardContent>
      </Card>

      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          border: 2px solid #ffffff;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }

        .slider::-moz-range-thumb {
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          border: 2px solid #ffffff;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }

        .slider::-webkit-slider-track {
          height: 8px;
          border-radius: 4px;
          background: #e5e7eb;
        }

        .slider::-moz-range-track {
          height: 8px;
          border-radius: 4px;
          background: #e5e7eb;
        }
      `}</style>
    </div>
  )
}
