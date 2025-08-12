"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"

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
  { name: "Hoodie Negro Front", path: "/garments/hoodie-black-front.jpeg" },
  { name: "Hoodie Negro Back", path: "/garments/hoodie-black-back.png" },
  { name: "Hoodie Caramel Front", path: "/garments/hoodie-caramel-front.jpeg" },
  { name: "Hoodie Caramel Back", path: "/garments/hoodie-caramel-back.png" },
  { name: "Hoodie Crema Front", path: "/garments/hoodie-cream-front.jpeg" },
  { name: "Hoodie Crema Back", path: "/garments/hoodie-cream-back.png" },
  { name: "Hoodie Gris Front", path: "/garments/hoodie-gray-front.jpeg" },
  { name: "Hoodie Gris Back", path: "/garments/hoodie-gray-back.png" },

  // T-shirts Oversize
  { name: "T-shirt Negro Oversize Front", path: "/garments/tshirt-black-oversize-front.jpeg" },
  { name: "T-shirt Negro Oversize Back", path: "/garments/tshirt-black-oversize-back.jpeg" },
  { name: "T-shirt Blanco Oversize Front", path: "/garments/tshirt-white-oversize-front.jpeg" },
  { name: "T-shirt Blanco Oversize Back", path: "/garments/tshirt-white-oversize-back.jpeg" },
  { name: "T-shirt Caramel Oversize Front", path: "/garments/tshirt-caramel-oversize-front.jpeg" },
  { name: "T-shirt Caramel Oversize Back", path: "/garments/tshirt-caramel-oversize-back.jpeg" },

  // T-shirts Classic
  { name: "T-shirt Negro Classic Front", path: "/garments/tshirt-black-classic-front.jpeg" },
  { name: "T-shirt Negro Classic Back", path: "/garments/tshirt-black-classic-back.jpeg" },
  { name: "T-shirt Blanco Classic Front", path: "/garments/tshirt-white-classic-front.jpeg" },
  { name: "T-shirt Blanco Classic Back", path: "/garments/tshirt-white-classic-back.jpeg" },
]

export default function PrintAreaMapper() {
  const [selectedGarment, setSelectedGarment] = useState<(typeof GARMENT_IMAGES)[0] | null>(null)
  const [printArea, setPrintArea] = useState<PrintArea>({ top: 20, right: 20, bottom: 20, left: 20 })
  const [savedMappings, setSavedMappings] = useState<GarmentMapping[]>([])
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 })
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)

  // Cargar imagen y calcular tamaño
  useEffect(() => {
    if (selectedGarment && imageRef.current) {
      const img = imageRef.current
      img.onload = () => {
        setImageSize({ width: img.naturalWidth, height: img.naturalHeight })
      }
    }
  }, [selectedGarment])

  // Dibujar área de impresión en canvas
  useEffect(() => {
    if (!canvasRef.current || !selectedGarment || !imageSize.width) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Limpiar canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Calcular coordenadas del área de impresión
    const displayWidth = 500 // Ancho fijo para display
    const displayHeight = (imageSize.height * displayWidth) / imageSize.width

    canvas.width = displayWidth
    canvas.height = displayHeight

    // Calcular área de impresión en píxeles
    const printAreaPixels = {
      left: (printArea.left / 100) * displayWidth,
      top: (printArea.top / 100) * displayHeight,
      right: displayWidth - (printArea.right / 100) * displayWidth,
      bottom: displayHeight - (printArea.bottom / 100) * displayHeight,
    }

    // Dibujar rectángulo del área de impresión
    ctx.strokeStyle = "#00BFFF"
    ctx.lineWidth = 3
    ctx.setLineDash([10, 5])
    ctx.strokeRect(
      printAreaPixels.left,
      printAreaPixels.top,
      printAreaPixels.right - printAreaPixels.left,
      printAreaPixels.bottom - printAreaPixels.top,
    )

    // Dibujar overlay semi-transparente fuera del área
    ctx.fillStyle = "rgba(0, 0, 0, 0.3)"

    // Top
    ctx.fillRect(0, 0, displayWidth, printAreaPixels.top)
    // Bottom
    ctx.fillRect(0, printAreaPixels.bottom, displayWidth, displayHeight - printAreaPixels.bottom)
    // Left
    ctx.fillRect(0, printAreaPixels.top, printAreaPixels.left, printAreaPixels.bottom - printAreaPixels.top)
    // Right
    ctx.fillRect(
      printAreaPixels.right,
      printAreaPixels.top,
      displayWidth - printAreaPixels.right,
      printAreaPixels.bottom - printAreaPixels.top,
    )

    // Dibujar puntos de control
    const controlSize = 8
    ctx.fillStyle = "#FF00FF"
    ctx.setLineDash([])

    // Esquinas
    ctx.fillRect(
      printAreaPixels.left - controlSize / 2,
      printAreaPixels.top - controlSize / 2,
      controlSize,
      controlSize,
    )
    ctx.fillRect(
      printAreaPixels.right - controlSize / 2,
      printAreaPixels.top - controlSize / 2,
      controlSize,
      controlSize,
    )
    ctx.fillRect(
      printAreaPixels.left - controlSize / 2,
      printAreaPixels.bottom - controlSize / 2,
      controlSize,
      controlSize,
    )
    ctx.fillRect(
      printAreaPixels.right - controlSize / 2,
      printAreaPixels.bottom - controlSize / 2,
      controlSize,
      controlSize,
    )
  }, [selectedGarment, printArea, imageSize])

  const handleSaveMapping = () => {
    if (!selectedGarment) return

    const newMapping: GarmentMapping = {
      name: selectedGarment.name,
      image: selectedGarment.path,
      printArea: { ...printArea },
    }

    setSavedMappings((prev) => {
      const existing = prev.findIndex((m) => m.name === selectedGarment.name)
      if (existing >= 0) {
        const updated = [...prev]
        updated[existing] = newMapping
        return updated
      }
      return [...prev, newMapping]
    })
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

  const loadPreset = (garmentType: string) => {
    const presets = {
      "hoodie-front": { top: 25, right: 15, bottom: 45, left: 15 },
      "hoodie-back": { top: 20, right: 15, bottom: 30, left: 15 },
      "tshirt-front": { top: 20, right: 20, bottom: 40, left: 20 },
      "tshirt-back": { top: 15, right: 20, bottom: 25, left: 20 },
    }

    const preset = presets[garmentType as keyof typeof presets]
    if (preset) {
      setPrintArea(preset)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Mapeador de Áreas de Impresión</h1>
          <p className="text-gray-600">
            Herramienta para definir las coordenadas de las áreas imprimibles en cada prenda
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Panel de selección */}
          <Card>
            <CardHeader>
              <CardTitle>Seleccionar Prenda</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-2 max-h-96 overflow-y-auto">
                {GARMENT_IMAGES.map((garment, index) => (
                  <Button
                    key={index}
                    variant={selectedGarment?.path === garment.path ? "default" : "outline"}
                    className="justify-start text-left h-auto p-3"
                    onClick={() => setSelectedGarment(garment)}
                  >
                    <div>
                      <div className="font-medium">{garment.name}</div>
                      <div className="text-xs text-gray-500">{garment.path}</div>
                    </div>
                  </Button>
                ))}
              </div>

              <Separator />

              <div>
                <Label className="text-sm font-medium mb-2 block">Presets Rápidos</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Button size="sm" variant="outline" onClick={() => loadPreset("hoodie-front")}>
                    Hoodie Front
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => loadPreset("hoodie-back")}>
                    Hoodie Back
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => loadPreset("tshirt-front")}>
                    T-shirt Front
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => loadPreset("tshirt-back")}>
                    T-shirt Back
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Panel de edición */}
          <Card>
            <CardHeader>
              <CardTitle>Ajustar Márgenes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedGarment ? (
                <>
                  <div className="text-sm text-gray-600 mb-4">
                    Editando: <strong>{selectedGarment.name}</strong>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="top">Superior (%)</Label>
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
                      <Label htmlFor="bottom">Inferior (%)</Label>
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
                      <Label htmlFor="left">Izquierdo (%)</Label>
                      <Input
                        id="left"
                        type="number"
                        min="0"
                        max="50"
                        value={printArea.left}
                        onChange={(e) => setPrintArea((prev) => ({ ...prev, left: Number(e.target.value) }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="right">Derecho (%)</Label>
                      <Input
                        id="right"
                        type="number"
                        min="0"
                        max="50"
                        value={printArea.right}
                        onChange={(e) => setPrintArea((prev) => ({ ...prev, right: Number(e.target.value) }))}
                      />
                    </div>
                  </div>

                  <Separator />

                  <div className="bg-gray-100 p-4 rounded-lg">
                    <h4 className="font-medium mb-2">Coordenadas Actuales</h4>
                    <div className="text-sm font-mono space-y-1">
                      <div>Top: {printArea.top}%</div>
                      <div>Right: {printArea.right}%</div>
                      <div>Bottom: {printArea.bottom}%</div>
                      <div>Left: {printArea.left}%</div>
                    </div>
                  </div>

                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-medium mb-2">Área de Impresión</h4>
                    <div className="text-sm space-y-1">
                      <div>Ancho: {100 - printArea.left - printArea.right}%</div>
                      <div>Alto: {100 - printArea.top - printArea.bottom}%</div>
                    </div>
                  </div>

                  <Button onClick={handleSaveMapping} className="w-full">
                    Guardar Mapeo
                  </Button>
                </>
              ) : (
                <div className="text-center text-gray-500 py-8">Selecciona una prenda para comenzar</div>
              )}
            </CardContent>
          </Card>

          {/* Panel de vista previa */}
          <Card>
            <CardHeader>
              <CardTitle>Vista Previa</CardTitle>
            </CardHeader>
            <CardContent>
              {selectedGarment ? (
                <div className="relative">
                  <img
                    ref={imageRef}
                    src={selectedGarment.path || "/placeholder.svg"}
                    alt={selectedGarment.name}
                    className="w-full max-w-[500px] mx-auto"
                    style={{ display: "block" }}
                  />
                  <canvas
                    ref={canvasRef}
                    className="absolute top-0 left-1/2 transform -translate-x-1/2 pointer-events-none"
                    style={{ maxWidth: "500px" }}
                  />
                  <div className="mt-4 text-xs text-gray-500 text-center">
                    Área azul: zona imprimible | Puntos magenta: esquinas
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-500 py-16">Selecciona una prenda para ver la vista previa</div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Panel de mapeos guardados */}
        {savedMappings.length > 0 && (
          <Card className="mt-6">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Mapeos Guardados ({savedMappings.length})</CardTitle>
              <Button onClick={exportMappings} variant="outline">
                Exportar JSON
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {savedMappings.map((mapping, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-2">
                    <div className="font-medium text-sm">{mapping.name}</div>
                    <div className="text-xs text-gray-500">{mapping.image}</div>
                    <div className="flex flex-wrap gap-1">
                      <Badge variant="outline">T: {mapping.printArea.top}%</Badge>
                      <Badge variant="outline">R: {mapping.printArea.right}%</Badge>
                      <Badge variant="outline">B: {mapping.printArea.bottom}%</Badge>
                      <Badge variant="outline">L: {mapping.printArea.left}%</Badge>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="w-full"
                      onClick={() => {
                        const garment = GARMENT_IMAGES.find((g) => g.path === mapping.image)
                        if (garment) {
                          setSelectedGarment(garment)
                          setPrintArea(mapping.printArea)
                        }
                      }}
                    >
                      Editar
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
