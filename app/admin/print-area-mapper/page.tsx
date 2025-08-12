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
  topMargin: number
  bottomMargin: number
  leftMargin: number
  rightMargin: number
  printArea: {
    x: number
    y: number
    width: number
    height: number
  }
}

interface GarmentInfo {
  path: string
  name: string
  type: "hoodie" | "tshirt"
  side: "front" | "back"
}

const GARMENTS: GarmentInfo[] = [
  // Hoodies
  { path: "/garments/hoodie-black-front.jpeg", name: "Hoodie Negro Frontal", type: "hoodie", side: "front" },
  { path: "/garments/hoodie-black-back.png", name: "Hoodie Negro Trasero", type: "hoodie", side: "back" },
  { path: "/garments/hoodie-caramel-front.jpeg", name: "Hoodie Caramelo Frontal", type: "hoodie", side: "front" },
  { path: "/garments/hoodie-caramel-back.png", name: "Hoodie Caramelo Trasero", type: "hoodie", side: "back" },
  { path: "/garments/hoodie-cream-front.jpeg", name: "Hoodie Crema Frontal", type: "hoodie", side: "front" },
  { path: "/garments/hoodie-cream-back.png", name: "Hoodie Crema Trasero", type: "hoodie", side: "back" },
  { path: "/garments/hoodie-gray-front.jpeg", name: "Hoodie Gris Frontal", type: "hoodie", side: "front" },
  { path: "/garments/hoodie-gray-back.png", name: "Hoodie Gris Trasero", type: "hoodie", side: "back" },

  // T-shirts
  {
    path: "/garments/tshirt-black-classic-front.jpeg",
    name: "T-shirt Negro Clásico Frontal",
    type: "tshirt",
    side: "front",
  },
  {
    path: "/garments/tshirt-black-classic-back.jpeg",
    name: "T-shirt Negro Clásico Trasero",
    type: "tshirt",
    side: "back",
  },
  {
    path: "/garments/tshirt-black-oversize-front.jpeg",
    name: "T-shirt Negro Oversize Frontal",
    type: "tshirt",
    side: "front",
  },
  {
    path: "/garments/tshirt-black-oversize-back.jpeg",
    name: "T-shirt Negro Oversize Trasero",
    type: "tshirt",
    side: "back",
  },
  {
    path: "/garments/tshirt-white-classic-front.jpeg",
    name: "T-shirt Blanco Clásico Frontal",
    type: "tshirt",
    side: "front",
  },
  {
    path: "/garments/tshirt-white-classic-back.jpeg",
    name: "T-shirt Blanco Clásico Trasero",
    type: "tshirt",
    side: "back",
  },
  {
    path: "/garments/tshirt-white-oversize-front.jpeg",
    name: "T-shirt Blanco Oversize Frontal",
    type: "tshirt",
    side: "front",
  },
  {
    path: "/garments/tshirt-white-oversize-back.jpeg",
    name: "T-shirt Blanco Oversize Trasero",
    type: "tshirt",
    side: "back",
  },
  {
    path: "/garments/tshirt-caramel-oversize-front.jpeg",
    name: "T-shirt Caramelo Oversize Frontal",
    type: "tshirt",
    side: "front",
  },
  {
    path: "/garments/tshirt-caramel-oversize-back.jpeg",
    name: "T-shirt Caramelo Oversize Trasero",
    type: "tshirt",
    side: "back",
  },
]

const PRESETS = {
  hoodie: {
    front: { top: 25, bottom: 45, left: 15, right: 15 },
    back: { top: 20, bottom: 30, left: 15, right: 15 },
  },
  tshirt: {
    front: { top: 20, bottom: 25, left: 10, right: 10 },
    back: { top: 15, bottom: 20, left: 10, right: 10 },
  },
}

export default function PrintAreaMapper() {
  const [selectedGarment, setSelectedGarment] = useState<GarmentInfo | null>(null)
  const [margins, setMargins] = useState({
    top: 20,
    bottom: 30,
    left: 15,
    right: 15,
  })
  const [savedMappings, setSavedMappings] = useState<PrintAreaMapping[]>([])
  const [mappingName, setMappingName] = useState("")

  // Load saved mappings from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("printAreaMappings")
    if (saved) {
      setSavedMappings(JSON.parse(saved))
    }
  }, [])

  // Apply preset when garment changes
  useEffect(() => {
    if (selectedGarment) {
      const preset = PRESETS[selectedGarment.type][selectedGarment.side]
      setMargins(preset)
      setMappingName(selectedGarment.name)
    }
  }, [selectedGarment])

  const calculatePrintArea = () => {
    if (!selectedGarment) return { x: 0, y: 0, width: 0, height: 0 }

    // Assuming standard garment dimensions (adjust as needed)
    const garmentWidth = 400
    const garmentHeight = 500

    const x = (margins.left / 100) * garmentWidth
    const y = (margins.top / 100) * garmentHeight
    const width = garmentWidth - ((margins.left + margins.right) / 100) * garmentWidth
    const height = garmentHeight - ((margins.top + margins.bottom) / 100) * garmentHeight

    return { x, y, width, height }
  }

  const saveMapping = () => {
    if (!selectedGarment || !mappingName.trim()) return

    const printArea = calculatePrintArea()
    const mapping: PrintAreaMapping = {
      id: Date.now().toString(),
      garmentPath: selectedGarment.path,
      garmentName: mappingName.trim(),
      topMargin: margins.top,
      bottomMargin: margins.bottom,
      leftMargin: margins.left,
      rightMargin: margins.right,
      printArea,
    }

    const updated = [...savedMappings, mapping]
    setSavedMappings(updated)
    localStorage.setItem("printAreaMappings", JSON.stringify(updated))
  }

  const deleteMapping = (id: string) => {
    const updated = savedMappings.filter((m) => m.id !== id)
    setSavedMappings(updated)
    localStorage.setItem("printAreaMappings", JSON.stringify(updated))
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

  const printArea = calculatePrintArea()

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Mapeador de Áreas de Impresión</h1>
        <p className="text-muted-foreground">Herramienta para definir las áreas imprimibles en cada prenda</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Garment Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Seleccionar Prenda</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {GARMENTS.map((garment) => (
                <Button
                  key={garment.path}
                  variant={selectedGarment?.path === garment.path ? "default" : "outline"}
                  className="w-full justify-start text-left h-auto p-3"
                  onClick={() => setSelectedGarment(garment)}
                >
                  <div>
                    <div className="font-medium">{garment.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {garment.type} - {garment.side}
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
            <CardTitle>Controles de Márgenes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="mapping-name">Nombre del Mapeo</Label>
              <Input
                id="mapping-name"
                value={mappingName}
                onChange={(e) => setMappingName(e.target.value)}
                placeholder="Nombre del mapeo..."
              />
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="top-margin">Margen Superior (%)</Label>
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
                <Label htmlFor="bottom-margin">Margen Inferior (%)</Label>
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
                <Label htmlFor="left-margin">Margen Izquierdo (%)</Label>
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
                <Label htmlFor="right-margin">Margen Derecho (%)</Label>
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

            <Separator />

            <div className="space-y-2">
              <div className="text-sm font-medium">Área de Impresión Calculada:</div>
              <div className="text-xs text-muted-foreground space-y-1">
                <div>X: {printArea.x.toFixed(1)}px</div>
                <div>Y: {printArea.y.toFixed(1)}px</div>
                <div>Ancho: {printArea.width.toFixed(1)}px</div>
                <div>Alto: {printArea.height.toFixed(1)}px</div>
              </div>
            </div>

            <Button onClick={saveMapping} disabled={!selectedGarment || !mappingName.trim()} className="w-full">
              <Save className="w-4 h-4 mr-2" />
              Guardar Mapeo
            </Button>
          </CardContent>
        </Card>

        {/* Preview */}
        <Card>
          <CardHeader>
            <CardTitle>Vista Previa</CardTitle>
          </CardHeader>
          <CardContent>
            {selectedGarment ? (
              <div className="relative">
                <img
                  src={selectedGarment.path || "/placeholder.svg"}
                  alt={selectedGarment.name}
                  className="w-full h-auto rounded-lg"
                  style={{ maxHeight: "400px", objectFit: "contain" }}
                />

                {/* Print area overlay */}
                <div
                  className="absolute border-2 border-blue-500 border-dashed bg-blue-500/10"
                  style={{
                    left: `${margins.left}%`,
                    top: `${margins.top}%`,
                    width: `${100 - margins.left - margins.right}%`,
                    height: `${100 - margins.top - margins.bottom}%`,
                  }}
                >
                  {/* Corner indicators */}
                  <div className="absolute -top-1 -left-1 w-2 h-2 bg-blue-500 rounded-full"></div>
                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full"></div>
                  <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-blue-500 rounded-full"></div>
                  <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-blue-500 rounded-full"></div>
                </div>

                {/* Non-printable area overlays */}
                {/* Top */}
                <div
                  className="absolute top-0 left-0 right-0 bg-red-500/20"
                  style={{ height: `${margins.top}%` }}
                ></div>
                {/* Bottom */}
                <div
                  className="absolute bottom-0 left-0 right-0 bg-red-500/20"
                  style={{ height: `${margins.bottom}%` }}
                ></div>
                {/* Left */}
                <div
                  className="absolute top-0 bottom-0 left-0 bg-red-500/20"
                  style={{ width: `${margins.left}%` }}
                ></div>
                {/* Right */}
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

      {/* Saved Mappings */}
      <Card className="mt-6">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Mapeos Guardados ({savedMappings.length})</CardTitle>
          <Button onClick={exportMappings} disabled={savedMappings.length === 0}>
            <Download className="w-4 h-4 mr-2" />
            Exportar JSON
          </Button>
        </CardHeader>
        <CardContent>
          {savedMappings.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No hay mapeos guardados aún</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {savedMappings.map((mapping) => (
                <div key={mapping.id} className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-start justify-between">
                    <h4 className="font-medium text-sm">{mapping.garmentName}</h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteMapping(mapping.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <div>
                      Márgenes: {mapping.topMargin}% | {mapping.rightMargin}% | {mapping.bottomMargin}% |{" "}
                      {mapping.leftMargin}%
                    </div>
                    <div>
                      Área: {mapping.printArea.width.toFixed(0)}×{mapping.printArea.height.toFixed(0)}px
                    </div>
                    <div>
                      Posición: ({mapping.printArea.x.toFixed(0)}, {mapping.printArea.y.toFixed(0)})
                    </div>
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
