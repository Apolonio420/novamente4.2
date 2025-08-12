"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Download, Save, RotateCcw } from "lucide-react"

interface PrintArea {
  top: number
  right: number
  bottom: number
  left: number
}

interface GarmentMapping {
  name: string
  image: string
  printArea: PrintArea
}

const GARMENT_IMAGES = [
  // Hoodies
  { path: "/garments/hoodie-black-front.jpeg", name: "Hoodie Negro Front" },
  { path: "/garments/hoodie-caramel-front.jpeg", name: "Hoodie Caramel Front" },
  { path: "/garments/hoodie-cream-front.jpeg", name: "Hoodie Crema Front" },
  { path: "/garments/hoodie-gray-front.jpeg", name: "Hoodie Gris Front" },
  { path: "/garments/hoodie-black-back.jpeg", name: "Hoodie Negro Back" },
  { path: "/garments/hoodie-caramel-back.png", name: "Hoodie Caramel Back" },
  { path: "/garments/hoodie-cream-back.png", name: "Hoodie Crema Back" },
  { path: "/garments/hoodie-gray-back.png", name: "Hoodie Gris Back" },

  // T-shirts
  { path: "/garments/tshirt-black-oversize-front.jpeg", name: "T-shirt Negro Oversize Front" },
  { path: "/garments/tshirt-white-oversize-front.jpeg", name: "T-shirt Blanco Oversize Front" },
  { path: "/garments/tshirt-black-classic-front.jpeg", name: "T-shirt Negro Classic Front" },
  { path: "/garments/tshirt-white-classic-front.jpeg", name: "T-shirt Blanco Classic Front" },
  { path: "/garments/tshirt-caramel-oversize-front.jpeg", name: "T-shirt Caramel Oversize Front" },
  { path: "/garments/tshirt-black-oversize-back.jpeg", name: "T-shirt Negro Oversize Back" },
  { path: "/garments/tshirt-white-oversize-back.jpeg", name: "T-shirt Blanco Oversize Back" },
  { path: "/garments/tshirt-black-classic-back.jpeg", name: "T-shirt Negro Classic Back" },
  { path: "/garments/tshirt-white-classic-back.jpeg", name: "T-shirt Blanco Classic Back" },
  { path: "/garments/tshirt-caramel-oversize-back.jpeg", name: "T-shirt Caramel Oversize Back" },
]

const PRESETS: Record<string, PrintArea> = {
  "hoodie-front": { top: 25, right: 15, bottom: 45, left: 15 },
  "hoodie-back": { top: 20, right: 15, bottom: 30, left: 15 },
  "tshirt-front": { top: 20, right: 10, bottom: 25, left: 10 },
  "tshirt-back": { top: 15, right: 10, bottom: 20, left: 10 },
}

export default function PrintAreaMapper() {
  const [selectedGarment, setSelectedGarment] = useState<string>("")
  const [printArea, setPrintArea] = useState<PrintArea>({ top: 20, right: 15, bottom: 30, left: 15 })
  const [savedMappings, setSavedMappings] = useState<GarmentMapping[]>([])

  useEffect(() => {
    // Load saved mappings from localStorage
    const saved = localStorage.getItem("garment-mappings")
    if (saved) {
      setSavedMappings(JSON.parse(saved))
    }
  }, [])

  const applyPreset = (presetKey: string) => {
    setPrintArea(PRESETS[presetKey])
  }

  const getPresetForGarment = (garmentName: string): string => {
    if (garmentName.includes("hoodie") && garmentName.includes("front")) return "hoodie-front"
    if (garmentName.includes("hoodie") && garmentName.includes("back")) return "hoodie-back"
    if (garmentName.includes("tshirt") && garmentName.includes("front")) return "tshirt-front"
    if (garmentName.includes("tshirt") && garmentName.includes("back")) return "tshirt-back"
    return "tshirt-front"
  }

  const handleGarmentSelect = (garmentPath: string, garmentName: string) => {
    setSelectedGarment(garmentPath)

    // Check if we have a saved mapping for this garment
    const existingMapping = savedMappings.find((m) => m.image === garmentPath)
    if (existingMapping) {
      setPrintArea(existingMapping.printArea)
    } else {
      // Apply preset based on garment type
      const presetKey = getPresetForGarment(garmentName.toLowerCase())
      applyPreset(presetKey)
    }
  }

  const saveMapping = () => {
    if (!selectedGarment) return

    const garmentInfo = GARMENT_IMAGES.find((g) => g.path === selectedGarment)
    if (!garmentInfo) return

    const mapping: GarmentMapping = {
      name: garmentInfo.name,
      image: selectedGarment,
      printArea: { ...printArea },
    }

    const updatedMappings = savedMappings.filter((m) => m.image !== selectedGarment)
    updatedMappings.push(mapping)

    setSavedMappings(updatedMappings)
    localStorage.setItem("garment-mappings", JSON.stringify(updatedMappings))
  }

  const exportMappings = () => {
    const dataStr = JSON.stringify(savedMappings, null, 2)
    const dataUri = "data:application/json;charset=utf-8," + encodeURIComponent(dataStr)

    const exportFileDefaultName = "garment-print-areas.json"

    const linkElement = document.createElement("a")
    linkElement.setAttribute("href", dataUri)
    linkElement.setAttribute("download", exportFileDefaultName)
    linkElement.click()
  }

  const resetArea = () => {
    setPrintArea({ top: 20, right: 15, bottom: 30, left: 15 })
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Mapeador de Áreas de Impresión</h1>
          <p className="text-gray-600">Herramienta para definir visualmente las áreas de impresión de cada prenda</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Lista de Prendas */}
          <Card>
            <CardHeader>
              <CardTitle>Seleccionar Prenda</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {GARMENT_IMAGES.map((garment) => (
                  <button
                    key={garment.path}
                    onClick={() => handleGarmentSelect(garment.path, garment.name)}
                    className={`w-full text-left p-3 rounded-lg border transition-colors ${
                      selectedGarment === garment.path
                        ? "bg-blue-50 border-blue-300 text-blue-900"
                        : "bg-white border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    <div className="font-medium text-sm">{garment.name}</div>
                    <div className="text-xs text-gray-500">{garment.path}</div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Vista Previa */}
          <Card>
            <CardHeader>
              <CardTitle>Vista Previa</CardTitle>
            </CardHeader>
            <CardContent>
              {selectedGarment ? (
                <div className="relative">
                  <img
                    src={selectedGarment || "/placeholder.svg"}
                    alt="Prenda seleccionada"
                    className="w-full h-auto rounded-lg"
                  />

                  {/* Overlay del área de impresión */}
                  <div
                    className="absolute border-2 border-dashed border-blue-500 bg-blue-500/10"
                    style={{
                      top: `${printArea.top}%`,
                      right: `${printArea.right}%`,
                      bottom: `${printArea.bottom}%`,
                      left: `${printArea.left}%`,
                    }}
                  >
                    {/* Puntos de control en las esquinas */}
                    <div className="absolute -top-1 -left-1 w-2 h-2 bg-blue-500 rounded-full"></div>
                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full"></div>
                    <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-blue-500 rounded-full"></div>
                    <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-blue-500 rounded-full"></div>
                  </div>

                  {/* Overlay rojo para áreas no imprimibles */}
                  <div className="absolute inset-0 pointer-events-none">
                    {/* Top */}
                    <div
                      className="absolute top-0 left-0 right-0 bg-red-500/20"
                      style={{ height: `${printArea.top}%` }}
                    />
                    {/* Right */}
                    <div
                      className="absolute top-0 right-0 bottom-0 bg-red-500/20"
                      style={{ width: `${printArea.right}%` }}
                    />
                    {/* Bottom */}
                    <div
                      className="absolute bottom-0 left-0 right-0 bg-red-500/20"
                      style={{ height: `${printArea.bottom}%` }}
                    />
                    {/* Left */}
                    <div
                      className="absolute top-0 left-0 bottom-0 bg-red-500/20"
                      style={{ width: `${printArea.left}%` }}
                    />
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-64 bg-gray-100 rounded-lg">
                  <p className="text-gray-500">Selecciona una prenda para ver la vista previa</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Controles */}
          <Card>
            <CardHeader>
              <CardTitle>Controles de Área</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Presets rápidos */}
              <div>
                <Label className="text-sm font-medium mb-2 block">Presets Rápidos</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" size="sm" onClick={() => applyPreset("hoodie-front")}>
                    Hoodie Front
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => applyPreset("hoodie-back")}>
                    Hoodie Back
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => applyPreset("tshirt-front")}>
                    T-shirt Front
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => applyPreset("tshirt-back")}>
                    T-shirt Back
                  </Button>
                </div>
              </div>

              <Separator />

              {/* Controles de márgenes */}
              <div className="space-y-3">
                <div>
                  <Label htmlFor="top">Margen Superior (%)</Label>
                  <Input
                    id="top"
                    type="number"
                    min="0"
                    max="50"
                    value={printArea.top}
                    onChange={(e) => setPrintArea((prev) => ({ ...prev, top: Number(e.target.value) }))}
                  />
                </div>

                <div>
                  <Label htmlFor="right">Margen Derecho (%)</Label>
                  <Input
                    id="right"
                    type="number"
                    min="0"
                    max="50"
                    value={printArea.right}
                    onChange={(e) => setPrintArea((prev) => ({ ...prev, right: Number(e.target.value) }))}
                  />
                </div>

                <div>
                  <Label htmlFor="bottom">Margen Inferior (%)</Label>
                  <Input
                    id="bottom"
                    type="number"
                    min="0"
                    max="50"
                    value={printArea.bottom}
                    onChange={(e) => setPrintArea((prev) => ({ ...prev, bottom: Number(e.target.value) }))}
                  />
                </div>

                <div>
                  <Label htmlFor="left">Margen Izquierdo (%)</Label>
                  <Input
                    id="left"
                    type="number"
                    min="0"
                    max="50"
                    value={printArea.left}
                    onChange={(e) => setPrintArea((prev) => ({ ...prev, left: Number(e.target.value) }))}
                  />
                </div>
              </div>

              <Separator />

              {/* Coordenadas actuales */}
              <div>
                <Label className="text-sm font-medium mb-2 block">Coordenadas Actuales</Label>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <pre className="text-xs">
                    {JSON.stringify(
                      {
                        top: printArea.top,
                        right: printArea.right,
                        bottom: printArea.bottom,
                        left: printArea.left,
                      },
                      null,
                      2,
                    )}
                  </pre>
                </div>
              </div>

              {/* Botones de acción */}
              <div className="flex gap-2">
                <Button onClick={resetArea} variant="outline" size="sm">
                  <RotateCcw className="w-4 h-4 mr-1" />
                  Reset
                </Button>
                <Button onClick={saveMapping} disabled={!selectedGarment} size="sm">
                  <Save className="w-4 h-4 mr-1" />
                  Guardar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Mapeos guardados */}
        {savedMappings.length > 0 && (
          <Card className="mt-6">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Mapeos Guardados ({savedMappings.length})</CardTitle>
              <Button onClick={exportMappings} variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Exportar JSON
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {savedMappings.map((mapping, index) => (
                  <div key={index} className="border rounded-lg p-3 bg-gray-50">
                    <div className="font-medium text-sm mb-2">{mapping.name}</div>
                    <div className="text-xs text-gray-600 mb-2">{mapping.image}</div>
                    <div className="text-xs bg-white p-2 rounded">
                      <pre>{JSON.stringify(mapping.printArea, null, 1)}</pre>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Instrucciones */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Instrucciones de Uso</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-600 space-y-2">
              <p>
                <strong>1.</strong> Selecciona una prenda de la lista izquierda
              </p>
              <p>
                <strong>2.</strong> Usa los presets rápidos o ajusta manualmente los márgenes
              </p>
              <p>
                <strong>3.</strong> El área azul punteada muestra la zona imprimible
              </p>
              <p>
                <strong>4.</strong> Las áreas rojas muestran zonas no imprimibles
              </p>
              <p>
                <strong>5.</strong> Guarda el mapeo cuando esté perfecto
              </p>
              <p>
                <strong>6.</strong> Exporta todos los mapeos a JSON para usar en el código
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
