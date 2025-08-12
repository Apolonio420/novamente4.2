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
  garmentPath: string
  garmentName: string
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
  timestamp: string
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
  default: { top: 20, right: 15, bottom: 30, left: 15 },
}

const GARMENTS = [
  { path: "/garments/hoodie-black-front.jpeg", name: "Hoodie Negro Frontal" },
  { path: "/garments/hoodie-black-back.jpeg", name: "Hoodie Negro Trasero" },
  { path: "/garments/hoodie-cream-front.jpeg", name: "Hoodie Crema Frontal" },
  { path: "/garments/hoodie-cream-back.png", name: "Hoodie Crema Trasero" },
  { path: "/garments/hoodie-caramel-front.jpeg", name: "Hoodie Caramelo Frontal" },
  { path: "/garments/hoodie-caramel-back.png", name: "Hoodie Caramelo Trasero" },
  { path: "/garments/hoodie-gray-front.jpeg", name: "Hoodie Gris Frontal" },
  { path: "/garments/hoodie-gray-back.png", name: "Hoodie Gris Trasero" },
  { path: "/garments/tshirt-black-oversize-front.jpeg", name: "T-shirt Negro Oversize Frontal" },
  { path: "/garments/tshirt-black-oversize-back.jpeg", name: "T-shirt Negro Oversize Trasero" },
  { path: "/garments/tshirt-black-classic-front.jpeg", name: "T-shirt Negro Clásico Frontal" },
  { path: "/garments/tshirt-black-classic-back.jpeg", name: "T-shirt Negro Clásico Trasero" },
  { path: "/garments/tshirt-white-oversize-front.jpeg", name: "T-shirt Blanco Oversize Frontal" },
  { path: "/garments/tshirt-white-oversize-back.jpeg", name: "T-shirt Blanco Oversize Trasero" },
  { path: "/garments/tshirt-white-classic-front.jpeg", name: "T-shirt Blanco Clásico Frontal" },
  { path: "/garments/tshirt-white-classic-back.jpeg", name: "T-shirt Blanco Clásico Trasero" },
  { path: "/garments/tshirt-caramel-oversize-front.jpeg", name: "T-shirt Caramelo Oversize Frontal" },
  { path: "/garments/tshirt-caramel-oversize-back.jpeg", name: "T-shirt Caramelo Oversize Trasero" },
]

export default function PrintAreaMapper() {
  const [selectedGarment, setSelectedGarment] = useState<string>("")
  const [margins, setMargins] = useState<GarmentPreset>({ top: 20, right: 15, bottom: 30, left: 15 })
  const [savedMappings, setSavedMappings] = useState<PrintAreaMapping[]>([])
  const [mappingName, setMappingName] = useState<string>("")

  useEffect(() => {
    const saved = localStorage.getItem("printAreaMappings")
    if (saved) {
      setSavedMappings(JSON.parse(saved))
    }
  }, [])

  const getPresetForGarment = (garmentPath: string): GarmentPreset => {
    if (garmentPath.includes("hoodie") && garmentPath.includes("front")) {
      return GARMENT_PRESETS["hoodie-front"]
    }
    if (garmentPath.includes("hoodie") && garmentPath.includes("back")) {
      return GARMENT_PRESETS["hoodie-back"]
    }
    if (garmentPath.includes("tshirt") && garmentPath.includes("front")) {
      return GARMENT_PRESETS["tshirt-front"]
    }
    if (garmentPath.includes("tshirt") && garmentPath.includes("back")) {
      return GARMENT_PRESETS["tshirt-back"]
    }
    return GARMENT_PRESETS["default"]
  }

  const handleGarmentSelect = (garmentPath: string) => {
    setSelectedGarment(garmentPath)
    const preset = getPresetForGarment(garmentPath)
    setMargins(preset)

    const garmentName = GARMENTS.find((g) => g.path === garmentPath)?.name || ""
    setMappingName(garmentName)
  }

  const calculateCoordinates = () => {
    const imageWidth = 400 // Base width for calculation
    const imageHeight = 500 // Base height for calculation

    const x = (margins.left / 100) * imageWidth
    const y = (margins.top / 100) * imageHeight
    const width = imageWidth - ((margins.left + margins.right) / 100) * imageWidth
    const height = imageHeight - ((margins.top + margins.bottom) / 100) * imageHeight

    return { x: Math.round(x), y: Math.round(y), width: Math.round(width), height: Math.round(height) }
  }

  const saveMapping = () => {
    if (!selectedGarment || !mappingName.trim()) return

    const coordinates = calculateCoordinates()
    const mapping: PrintAreaMapping = {
      id: Date.now().toString(),
      garmentPath: selectedGarment,
      garmentName: mappingName.trim(),
      margins,
      coordinates,
      timestamp: new Date().toISOString(),
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
        <h1 className="text-3xl font-bold mb-2">Mapeador de Áreas de Impresión</h1>
        <p className="text-muted-foreground">
          Herramienta para mapear visualmente las áreas de impresión en las prendas
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Panel de Control */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Selección de Prenda</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto">
                {GARMENTS.map((garment) => (
                  <Button
                    key={garment.path}
                    variant={selectedGarment === garment.path ? "default" : "outline"}
                    className="justify-start text-left h-auto p-3"
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

          <Card>
            <CardHeader>
              <CardTitle>Configuración de Márgenes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="top">Superior (%)</Label>
                  <Input
                    id="top"
                    type="number"
                    min="0"
                    max="50"
                    value={margins.top}
                    onChange={(e) => setMargins((prev) => ({ ...prev, top: Number(e.target.value) }))}
                  />
                </div>
                <div>
                  <Label htmlFor="bottom">Inferior (%)</Label>
                  <Input
                    id="bottom"
                    type="number"
                    min="0"
                    max="50"
                    value={margins.bottom}
                    onChange={(e) => setMargins((prev) => ({ ...prev, bottom: Number(e.target.value) }))}
                  />
                </div>
                <div>
                  <Label htmlFor="left">Izquierdo (%)</Label>
                  <Input
                    id="left"
                    type="number"
                    min="0"
                    max="50"
                    value={margins.left}
                    onChange={(e) => setMargins((prev) => ({ ...prev, left: Number(e.target.value) }))}
                  />
                </div>
                <div>
                  <Label htmlFor="right">Derecho (%)</Label>
                  <Input
                    id="right"
                    type="number"
                    min="0"
                    max="50"
                    value={margins.right}
                    onChange={(e) => setMargins((prev) => ({ ...prev, right: Number(e.target.value) }))}
                  />
                </div>
              </div>

              {coordinates && (
                <div className="mt-4 p-4 bg-muted rounded-lg">
                  <h4 className="font-semibold mb-2">Coordenadas Calculadas:</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>X: {coordinates.x}px</div>
                    <div>Y: {coordinates.y}px</div>
                    <div>Ancho: {coordinates.width}px</div>
                    <div>Alto: {coordinates.height}px</div>
                  </div>
                </div>
              )}

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="mappingName">Nombre del Mapeo</Label>
                <Input
                  id="mappingName"
                  value={mappingName}
                  onChange={(e) => setMappingName(e.target.value)}
                  placeholder="Nombre para identificar este mapeo"
                />
              </div>

              <Button onClick={saveMapping} disabled={!selectedGarment || !mappingName.trim()} className="w-full">
                <Save className="w-4 h-4 mr-2" />
                Guardar Mapeo
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Panel de Vista Previa */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Vista Previa</CardTitle>
            </CardHeader>
            <CardContent>
              {selectedGarment ? (
                <div className="relative inline-block">
                  <img
                    src={selectedGarment || "/placeholder.svg"}
                    alt="Prenda seleccionada"
                    className="max-w-full h-auto rounded-lg"
                    style={{ maxHeight: "500px" }}
                  />

                  {/* Overlay de área imprimible */}
                  <div
                    className="absolute border-2 border-blue-500 border-dashed bg-blue-500/10"
                    style={{
                      left: `${margins.left}%`,
                      top: `${margins.top}%`,
                      right: `${margins.right}%`,
                      bottom: `${margins.bottom}%`,
                    }}
                  >
                    {/* Puntos de control en las esquinas */}
                    <div className="absolute -top-1 -left-1 w-2 h-2 bg-blue-500 rounded-full"></div>
                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full"></div>
                    <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-blue-500 rounded-full"></div>
                    <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-blue-500 rounded-full"></div>
                  </div>

                  {/* Overlays para áreas no imprimibles */}
                  {/* Superior */}
                  <div
                    className="absolute top-0 left-0 right-0 bg-red-500/20"
                    style={{ height: `${margins.top}%` }}
                  ></div>
                  {/* Inferior */}
                  <div
                    className="absolute bottom-0 left-0 right-0 bg-red-500/20"
                    style={{ height: `${margins.bottom}%` }}
                  ></div>
                  {/* Izquierdo */}
                  <div
                    className="absolute top-0 bottom-0 left-0 bg-red-500/20"
                    style={{ width: `${margins.left}%` }}
                  ></div>
                  {/* Derecho */}
                  <div
                    className="absolute top-0 bottom-0 right-0 bg-red-500/20"
                    style={{ width: `${margins.right}%` }}
                  ></div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-64 bg-muted rounded-lg">
                  <p className="text-muted-foreground">Selecciona una prenda para ver la vista previa</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Panel de Mapeos Guardados */}
      <Card className="mt-8">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Mapeos Guardados ({savedMappings.length})</CardTitle>
          <Button onClick={exportMappings} disabled={savedMappings.length === 0}>
            <Download className="w-4 h-4 mr-2" />
            Exportar JSON
          </Button>
        </CardHeader>
        <CardContent>
          {savedMappings.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No hay mapeos guardados. Crea tu primer mapeo seleccionando una prenda y configurando los márgenes.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {savedMappings.map((mapping) => (
                <div key={mapping.id} className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-sm">{mapping.garmentName}</h4>
                    <Button variant="ghost" size="sm" onClick={() => deleteMapping(mapping.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>

                  <img
                    src={mapping.garmentPath || "/placeholder.svg"}
                    alt={mapping.garmentName}
                    className="w-full h-24 object-cover rounded"
                  />

                  <div className="text-xs space-y-1">
                    <div className="grid grid-cols-2 gap-1">
                      <span>
                        Márgenes: {mapping.margins.top}% {mapping.margins.right}% {mapping.margins.bottom}%{" "}
                        {mapping.margins.left}%
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-1">
                      <span>
                        Coord: {mapping.coordinates.x},{mapping.coordinates.y}
                      </span>
                      <span>
                        Tamaño: {mapping.coordinates.width}×{mapping.coordinates.height}
                      </span>
                    </div>
                    <div className="text-muted-foreground">{new Date(mapping.timestamp).toLocaleDateString()}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
