"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Download, Save, Trash2 } from "lucide-react"

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
  "/garments/hoodie-black-front.jpeg",
  "/garments/hoodie-black-back.jpeg",
  "/garments/hoodie-caramel-front.jpeg",
  "/garments/hoodie-caramel-back.png",
  "/garments/hoodie-cream-front.jpeg",
  "/garments/hoodie-cream-back.png",
  "/garments/hoodie-gray-front.jpeg",
  "/garments/hoodie-gray-back.png",
  "/garments/tshirt-black-classic-front.jpeg",
  "/garments/tshirt-black-classic-back.jpeg",
  "/garments/tshirt-black-oversize-front.jpeg",
  "/garments/tshirt-black-oversize-back.jpeg",
  "/garments/tshirt-white-classic-front.jpeg",
  "/garments/tshirt-white-classic-back.jpeg",
  "/garments/tshirt-white-oversize-front.jpeg",
  "/garments/tshirt-white-oversize-back.jpeg",
  "/garments/tshirt-caramel-oversize-front.jpeg",
  "/garments/tshirt-caramel-oversize-back.jpeg",
]

export default function PrintAreaMapper() {
  const [selectedGarment, setSelectedGarment] = useState<string>("")
  const [margins, setMargins] = useState({ top: 20, right: 15, bottom: 30, left: 15 })
  const [mappingName, setMappingName] = useState("")
  const [savedMappings, setSavedMappings] = useState<PrintAreaMapping[]>([])

  useEffect(() => {
    const saved = localStorage.getItem("printAreaMappings")
    if (saved) {
      setSavedMappings(JSON.parse(saved))
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

    const garmentName =
      garmentPath
        .split("/")
        .pop()
        ?.replace(/\.(jpeg|jpg|png)$/, "") || ""
    setMappingName(garmentName)
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

  const exportMappings = () => {
    const dataStr = JSON.stringify(savedMappings, null, 2)
    const dataUri = "data:application/json;charset=utf-8," + encodeURIComponent(dataStr)

    const exportFileDefaultName = "print-area-mappings.json"

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
            <div className="grid grid-cols-2 gap-2 max-h-96 overflow-y-auto">
              {GARMENTS.map((garment) => (
                <button
                  key={garment}
                  onClick={() => handleGarmentSelect(garment)}
                  className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all hover:scale-105 ${
                    selectedGarment === garment ? "border-blue-500 ring-2 ring-blue-200" : "border-gray-200"
                  }`}
                >
                  <img
                    src={garment || "/placeholder.svg"}
                    alt={garment.split("/").pop()}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs p-1 truncate">
                    {garment
                      .split("/")
                      .pop()
                      ?.replace(/\.(jpeg|jpg|png)$/, "")}
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Controls */}
        <Card>
          <CardHeader>
            <CardTitle>Print Area Controls</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="mapping-name">Mapping Name</Label>
              <Input
                id="mapping-name"
                value={mappingName}
                onChange={(e) => setMappingName(e.target.value)}
                placeholder="Enter mapping name"
              />
            </div>

            <Separator />

            <div className="space-y-3">
              <h4 className="font-medium">Margins (%)</h4>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="top-margin">Top</Label>
                  <Input
                    id="top-margin"
                    type="number"
                    min="0"
                    max="50"
                    value={margins.top}
                    onChange={(e) => setMargins((prev) => ({ ...prev, top: Number(e.target.value) }))}
                  />
                </div>
                <div>
                  <Label htmlFor="bottom-margin">Bottom</Label>
                  <Input
                    id="bottom-margin"
                    type="number"
                    min="0"
                    max="50"
                    value={margins.bottom}
                    onChange={(e) => setMargins((prev) => ({ ...prev, bottom: Number(e.target.value) }))}
                  />
                </div>
                <div>
                  <Label htmlFor="left-margin">Left</Label>
                  <Input
                    id="left-margin"
                    type="number"
                    min="0"
                    max="50"
                    value={margins.left}
                    onChange={(e) => setMargins((prev) => ({ ...prev, left: Number(e.target.value) }))}
                  />
                </div>
                <div>
                  <Label htmlFor="right-margin">Right</Label>
                  <Input
                    id="right-margin"
                    type="number"
                    min="0"
                    max="50"
                    value={margins.right}
                    onChange={(e) => setMargins((prev) => ({ ...prev, right: Number(e.target.value) }))}
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
    </div>
  )
}
