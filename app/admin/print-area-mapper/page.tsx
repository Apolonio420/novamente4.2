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
  { name: "Hoodie Negro Front", path: "/garments/hoodie-black-front.jpeg" },
  { name: "Hoodie Caramel Front", path: "/garments/hoodie-caramel-front.jpeg" },
  { name: "Hoodie Crema Front", path: "/garments/hoodie-cream-front.jpeg" },
  { name: "Hoodie Gris Front", path: "/garments/hoodie-gray-front.jpeg" },
  { name: "Hoodie Negro Back", path: "/garments/hoodie-black-back.png" },
  { name: "Hoodie Caramel Back", path: "/garments/hoodie-caramel-back.png" },
  { name: "Hoodie Crema Back", path: "/garments/hoodie-cream-back.png" },
  { name: "Hoodie Gris Back", path: "/garments/hoodie-gray-back.png" },
  { name: "T-Shirt Negro Oversize Front", path: "/garments/tshirt-black-oversize-front.jpeg" },
  { name: "T-Shirt Blanco Oversize Front", path: "/garments/tshirt-white-oversize-front.jpeg" },
  { name: "T-Shirt Caramel Oversize Front", path: "/garments/tshirt-caramel-oversize-front.jpeg" },
  { name: "T-Shirt Negro Classic Front", path: "/garments/tshirt-black-classic-front.jpeg" },
  { name: "T-Shirt Blanco Classic Front", path: "/garments/tshirt-white-classic-front.jpeg" },
  { name: "T-Shirt Negro Oversize Back", path: "/garments/tshirt-black-oversize-back.jpeg" },
  { name: "T-Shirt Blanco Oversize Back", path: "/garments/tshirt-white-oversize-back.jpeg" },
  { name: "T-Shirt Caramel Oversize Back", path: "/garments/tshirt-caramel-oversize-back.jpeg" },
  { name: "T-Shirt Negro Classic Back", path: "/garments/tshirt-black-classic-back.jpeg" },
  { name: "T-Shirt Blanco Classic Back", path: "/garments/tshirt-white-classic-back.jpeg" },
]

const PRESETS = {
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

  const handleGarmentSelect = (imagePath: string) => {
    setSelectedGarment(imagePath)

    // Auto-apply preset based on garment type
    if (imagePath.includes("hoodie") && imagePath.includes("front")) {
      setPrintArea(PRESETS["hoodie-front"])
    } else if (imagePath.includes("hoodie") && imagePath.includes("back")) {
      setPrintArea(PRESETS["hoodie-back"])
    } else if (imagePath.includes("tshirt") && imagePath.includes("front")) {
      setPrintArea(PRESETS["tshirt-front"])
    } else if (imagePath.includes("tshirt") && imagePath.includes("back")) {
      setPrintArea(PRESETS["tshirt-back"])
    }
  }

  const handlePrintAreaChange = (side: keyof PrintArea, value: number) => {
    setPrintArea((prev) => ({ ...prev, [side]: Math.max(0, Math.min(50, value)) }))
  }

  const saveMapping = () => {
    if (!selectedGarment) return

    const garmentName = GARMENT_IMAGES.find((g) => g.path === selectedGarment)?.name || selectedGarment
    const newMapping: GarmentMapping = {
      name: garmentName,
      image: selectedGarment,
      printArea: { ...printArea },
    }

    const updatedMappings = savedMappings.filter((m) => m.image !== selectedGarment)
    updatedMappings.push(newMapping)

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

  const selectedGarmentName = GARMENT_IMAGES.find((g) => g.path === selectedGarment)?.name || ""

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Mapeador de Áreas de Impresión</h1>
        <p className="text-muted-foreground">
          Herramienta para definir visualmente las áreas de impresión en cada prenda
        </p>
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
                <Button
                  key={garment.path}
                  variant={selectedGarment === garment.path ? "default" : "outline"}
                  className="w-full justify-start text-left h-auto p-3"
                  onClick={() => handleGarmentSelect(garment.path)}
                >
                  <div>
                    <div className="font-medium">{garment.name}</div>
                    <div className="text-xs text-muted-foreground">{garment.path}</div>
                  </div>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Vista Previa */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Vista Previa</CardTitle>
          </CardHeader>
          <CardContent>
            {selectedGarment ? (
              <div className="relative">
                <img
                  src={selectedGarment || "/placeholder.svg"}
                  alt={selectedGarmentName}
                  className="w-full h-auto rounded-lg"
                />
                {/* Overlay de área de impresión */}
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
                {/* Overlay para áreas no imprimibles */}
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
              <div className="flex items-center justify-center h-64 bg-muted rounded-lg">
                <p className="text-muted-foreground">Selecciona una prenda para comenzar</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Controles */}
        <Card>
          <CardHeader>
            <CardTitle>Controles de Área</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Controles de márgenes */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="top">Margen Superior (%)</Label>
                <Input
                  id="top"
                  type="number"
                  min="0"
                  max="50"
                  value={printArea.top}
                  onChange={(e) => handlePrintAreaChange("top", Number(e.target.value))}
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
                  onChange={(e) => handlePrintAreaChange("right", Number(e.target.value))}
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
                  onChange={(e) => handlePrintAreaChange("bottom", Number(e.target.value))}
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
                  onChange={(e) => handlePrintAreaChange("left", Number(e.target.value))}
                />
              </div>
            </div>

            <Separator />

            {/* Presets rápidos */}
            <div>
              <Label className="text-sm font-medium">Presets Rápidos</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <Button variant="outline" size="sm" onClick={() => setPrintArea(PRESETS["hoodie-front"])}>
                  Hoodie Front
                </Button>
                <Button variant="outline" size="sm" onClick={() => setPrintArea(PRESETS["hoodie-back"])}>
                  Hoodie Back
                </Button>
                <Button variant="outline" size="sm" onClick={() => setPrintArea(PRESETS["tshirt-front"])}>
                  T-Shirt Front
                </Button>
                <Button variant="outline" size="sm" onClick={() => setPrintArea(PRESETS["tshirt-back"])}>
                  T-Shirt Back
                </Button>
              </div>
            </div>

            <Separator />

            {/* Coordenadas actuales */}
            <div>
              <Label className="text-sm font-medium">Coordenadas Actuales</Label>
              <div className="mt-2 p-3 bg-muted rounded-lg">
                <pre className="text-xs">
                  {JSON.stringify(
                    {
                      name: selectedGarmentName,
                      image: selectedGarment,
                      printArea,
                    },
                    null,
                    2,
                  )}
                </pre>
              </div>
            </div>

            {/* Botones de acción */}
            <div className="flex gap-2">
              <Button onClick={saveMapping} disabled={!selectedGarment}>
                <Save className="w-4 h-4 mr-2" />
                Guardar
              </Button>
              <Button variant="outline" onClick={resetArea}>
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset
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
            <Button onClick={exportMappings}>
              <Download className="w-4 h-4 mr-2" />
              Exportar JSON
            </Button>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {savedMappings.map((mapping, index) => (
                <div key={index} className="border rounded-lg p-3">
                  <h4 className="font-medium text-sm mb-2">{mapping.name}</h4>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <div>Top: {mapping.printArea.top}%</div>
                    <div>Right: {mapping.printArea.right}%</div>
                    <div>Bottom: {mapping.printArea.bottom}%</div>
                    <div>Left: {mapping.printArea.left}%</div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2 w-full bg-transparent"
                    onClick={() => {
                      setSelectedGarment(mapping.image)
                      setPrintArea(mapping.printArea)
                    }}
                  >
                    Cargar
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
