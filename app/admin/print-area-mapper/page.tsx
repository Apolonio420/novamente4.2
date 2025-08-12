"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Download, Save, Trash2, RotateCcw, Plus, Minus } from "lucide-react"

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
    const garmentType = getGarmentType(garmentPath)
    const preset = GARMENT_PRESETS[garmentType]
    if (preset) {
      setMargins(preset)
    }

    const garmentInfo = GARMENTS.find((g) => g.path === garmentPath)
    setMappingName(garmentInfo?.name || "")
  }

  const calculateCoordinates = () => {
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
  }

  const applyPreset = (preset: { top: number; right: number; bottom: number; left: number }) => {
    setMargins(preset)
  }

  const saveMapping = () => {
    if (!selectedGarment || !mappingName.trim()) return

    const mapping: PrintAreaMapping = {
      id: Date.now().toString(),
      name: mappingName.trim(),
      garmentPath: selectedGarment,
      margins: { ...margins },
      coordinates: calculateCoordinates(),
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
  }

  const exportMappings = () => {
    const dataStr = JSON.stringify(savedMappings, null, 2)
    const dataUri = "data:application/json;charset=utf-8," + encodeURIComponent(dataStr)

    const exportFileDefaultName = `print-area-mappings-${new Date().toISOString().split("T")[0]}.json`

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
          Map print areas for garments by adjusting margins and visualizing the printable zone.
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
                    <span className="text-sm">{garment.name}</span>
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
                      onChange={(e) => setMargins((prev) => ({ ...prev, top: Number(e.target.value) }))}
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
                    onChange={(e) => setMargins((prev) => ({ ...prev, top: Number(e.target.value) }))}
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
                      onChange={(e) => setMargins((prev) => ({ ...prev, bottom: Number(e.target.value) }))}
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
                    onChange={(e) => setMargins((prev) => ({ ...prev, bottom: Number(e.target.value) }))}
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
                      onChange={(e) => setMargins((prev) => ({ ...prev, left: Number(e.target.value) }))}
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
                    onChange={(e) => setMargins((prev) => ({ ...prev, left: Number(e.target.value) }))}
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
                      onChange={(e) => setMargins((prev) => ({ ...prev, right: Number(e.target.value) }))}
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
                    onChange={(e) => setMargins((prev) => ({ ...prev, right: Number(e.target.value) }))}
                    className="w-16 text-center text-sm"
                  />
                </div>
              </div>
            </div>

            {coordinates && (
              <>
                <Separator />
                <div className="space-y-2">
                  <h4 className="font-medium">Calculated Coordinates</h4>
                  <div className="text-sm space-y-1 bg-gray-50 p-3 rounded">
                    <div>X: {coordinates.x}px</div>
                    <div>Y: {coordinates.y}px</div>
                    <div>Width: {coordinates.width}px</div>
                    <div>Height: {coordinates.height}px</div>
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

      {/* Saved Mappings */}
      {savedMappings.length > 0 && (
        <Card className="mt-6">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Saved Mappings ({savedMappings.length})</CardTitle>
            <Button onClick={exportMappings} variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export JSON
            </Button>
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
              <strong>1.</strong> Select a garment from the list on the left
            </p>
            <p>
              <strong>2.</strong> Use sliders, +/- buttons, or quick presets to adjust margins
            </p>
            <p>
              <strong>3.</strong> The blue dashed area shows the printable zone
            </p>
            <p>
              <strong>4.</strong> Red areas indicate non-printable margins
            </p>
            <p>
              <strong>5.</strong> Save your mapping with a descriptive name
            </p>
            <p>
              <strong>6.</strong> Export all mappings to JSON for integration
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
