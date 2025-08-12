"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Download, Save, RotateCcw, Zap } from "lucide-react"
import Image from "next/image"

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

// Coordenadas exactas del JSON proporcionado
const EXACT_MAPPINGS: PrintAreaMapping[] = [
  {
    id: "1755023347511",
    name: "Hoodie Negro Frontal",
    garmentPath: "/garments/hoodie-black-front.jpeg",
    margins: { top: 35, right: 27, bottom: 36, left: 28 },
    coordinates: { x: 112, y: 175, width: 180, height: 145 },
    timestamp: 1755023347511,
  },
  {
    id: "1755023390559",
    name: "Hoodie Negro Trasero",
    garmentPath: "/garments/hoodie-black-back.jpeg",
    margins: { top: 35, right: 26, bottom: 17, left: 29 },
    coordinates: { x: 116, y: 175, width: 180, height: 240 },
    timestamp: 1755023390559,
  },
  {
    id: "1755023468831",
    name: "Hoodie Caramelo Frontal",
    garmentPath: "/garments/hoodie-caramel-front.jpeg",
    margins: { top: 32, right: 28, bottom: 39, left: 28 },
    coordinates: { x: 112, y: 160, width: 176, height: 145 },
    timestamp: 1755023468831,
  },
  {
    id: "1755023509358",
    name: "Hoodie Caramelo Trasero",
    garmentPath: "/garments/hoodie-caramel-back.png",
    margins: { top: 31, right: 32, bottom: 20, left: 32 },
    coordinates: { x: 128, y: 155, width: 144, height: 245 },
    timestamp: 1755023509358,
  },
  {
    id: "1755023531199",
    name: "Hoodie Crema Frontal",
    garmentPath: "/garments/hoodie-cream-front.jpeg",
    margins: { top: 31, right: 31, bottom: 42, left: 29 },
    coordinates: { x: 116, y: 155, width: 160, height: 135 },
    timestamp: 1755023531199,
  },
  {
    id: "1755023566679",
    name: "Hoodie Crema Trasero",
    garmentPath: "/garments/hoodie-cream-back.png",
    margins: { top: 30, right: 30, bottom: 19, left: 31 },
    coordinates: { x: 124, y: 150, width: 156, height: 255 },
    timestamp: 1755023566679,
  },
  {
    id: "1755023609951",
    name: "Hoodie Gris Frontal",
    garmentPath: "/garments/hoodie-gray-front.jpeg",
    margins: { top: 29, right: 31, bottom: 41, left: 29 },
    coordinates: { x: 116, y: 145, width: 160, height: 150 },
    timestamp: 1755023609951,
  },
  {
    id: "1755023640767",
    name: "Hoodie Gris Trasero",
    garmentPath: "/garments/hoodie-gray-back.png",
    margins: { top: 30, right: 30, bottom: 19, left: 29 },
    coordinates: { x: 116, y: 150, width: 164, height: 255 },
    timestamp: 1755023640767,
  },
  {
    id: "1755023682390",
    name: "T-shirt Negro Clásico Frontal",
    garmentPath: "/garments/tshirt-black-classic-front.jpeg",
    margins: { top: 27, right: 25, bottom: 20, left: 24 },
    coordinates: { x: 96, y: 135, width: 204, height: 265 },
    timestamp: 1755023682390,
  },
  {
    id: "1755023706200",
    name: "T-shirt Negro Clásico Trasero",
    garmentPath: "/garments/tshirt-black-classic-back.jpeg",
    margins: { top: 21, right: 27, bottom: 17, left: 25 },
    coordinates: { x: 100, y: 105, width: 192, height: 310 },
    timestamp: 1755023706200,
  },
  {
    id: "1755023730447",
    name: "T-shirt Negro Oversize Frontal",
    garmentPath: "/garments/tshirt-black-oversize-front.jpeg",
    margins: { top: 26, right: 28, bottom: 19, left: 26 },
    coordinates: { x: 104, y: 130, width: 184, height: 275 },
    timestamp: 1755023730447,
  },
  {
    id: "1755023755554",
    name: "T-shirt Negro Oversize Trasero",
    garmentPath: "/garments/tshirt-black-oversize-back.jpeg",
    margins: { top: 21, right: 27, bottom: 17, left: 27 },
    coordinates: { x: 108, y: 105, width: 184, height: 310 },
    timestamp: 1755023755554,
  },
  {
    id: "1755023779606",
    name: "T-shirt Blanco Clásico Frontal",
    garmentPath: "/garments/tshirt-white-classic-front.jpeg",
    margins: { top: 25, right: 25, bottom: 17, left: 24 },
    coordinates: { x: 96, y: 125, width: 204, height: 290 },
    timestamp: 1755023779606,
  },
  {
    id: "1755023805622",
    name: "T-shirt Blanco Clásico Trasero",
    garmentPath: "/garments/tshirt-white-classic-back.jpeg",
    margins: { top: 22, right: 27, bottom: 18, left: 28 },
    coordinates: { x: 112, y: 110, width: 180, height: 300 },
    timestamp: 1755023805622,
  },
  {
    id: "1755023823255",
    name: "T-shirt Blanco Oversize Frontal",
    garmentPath: "/garments/tshirt-white-oversize-front.jpeg",
    margins: { top: 23, right: 31, bottom: 16, left: 28 },
    coordinates: { x: 112, y: 115, width: 164, height: 305 },
    timestamp: 1755023823255,
  },
  {
    id: "1755023843496",
    name: "T-shirt Blanco Oversize Trasero",
    garmentPath: "/garments/tshirt-white-oversize-back.jpeg",
    margins: { top: 21, right: 26, bottom: 16, left: 30 },
    coordinates: { x: 120, y: 105, width: 176, height: 315 },
    timestamp: 1755023843496,
  },
  {
    id: "1755024175022",
    name: "T-shirt Caramelo Oversize Frontal",
    garmentPath: "/garments/tshirt-caramel-oversize-front.jpeg",
    margins: { top: 24, right: 27, bottom: 18, left: 29 },
    coordinates: { x: 116, y: 120, width: 176, height: 290 },
    timestamp: 1755024175022,
  },
  {
    id: "1755024195151",
    name: "T-shirt Caramelo Oversize Trasero",
    garmentPath: "/garments/tshirt-caramel-oversize-back.jpeg",
    margins: { top: 20, right: 28, bottom: 17, left: 29 },
    coordinates: { x: 116, y: 100, width: 172, height: 315 },
    timestamp: 1755024195151,
  },
]

export default function PrintAreaMapper() {
  const [selectedGarment, setSelectedGarment] = useState<string>("")
  const [mappingName, setMappingName] = useState<string>("")
  const [margins, setMargins] = useState({ top: 25, right: 25, bottom: 25, left: 25 })
  const [coordinates, setCoordinates] = useState({ x: 100, y: 150, width: 200, height: 200 })
  const [savedMappings, setSavedMappings] = useState<PrintAreaMapping[]>([])
  const [isExactMode, setIsExactMode] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)

  // Cargar mappings guardados al iniciar
  useEffect(() => {
    const saved = localStorage.getItem("printAreaMappings")
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        setSavedMappings(parsed)
      } catch (error) {
        console.error("Error loading saved mappings:", error)
      }
    }
  }, [])

  // Lista completa de prendas disponibles
  const availableGarments = [
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

  // Verificar si una prenda tiene coordenadas exactas
  const hasExactCoordinates = (garmentPath: string) => {
    return EXACT_MAPPINGS.some((mapping) => mapping.garmentPath === garmentPath)
  }

  // Cargar coordenadas exactas si están disponibles
  const loadExactCoordinates = (garmentPath: string) => {
    const exactMapping = EXACT_MAPPINGS.find((mapping) => mapping.garmentPath === garmentPath)
    if (exactMapping) {
      setMargins(exactMapping.margins)
      setCoordinates(exactMapping.coordinates)
      setMappingName(exactMapping.name)
      setIsExactMode(true)
      return true
    }
    setIsExactMode(false)
    return false
  }

  // Manejar selección de prenda
  const handleGarmentSelect = (garmentPath: string) => {
    setSelectedGarment(garmentPath)

    // Intentar cargar coordenadas exactas
    if (!loadExactCoordinates(garmentPath)) {
      // Si no hay coordenadas exactas, generar nombre automático
      const garmentName =
        garmentPath
          .split("/")
          .pop()
          ?.replace(/\.(jpeg|jpg|png)$/, "")
          ?.split("-")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ") || "Nueva Prenda"

      setMappingName(garmentName)
      // Aplicar preset por defecto
      applyPreset("center")
    }
  }

  // Aplicar presets rápidos
  const applyPreset = (preset: string) => {
    if (isExactMode) return // No cambiar si estamos en modo exacto

    switch (preset) {
      case "center":
        setMargins({ top: 25, right: 25, bottom: 25, left: 25 })
        setCoordinates({ x: 100, y: 150, width: 200, height: 200 })
        break
      case "chest":
        setMargins({ top: 20, right: 30, bottom: 50, left: 30 })
        setCoordinates({ x: 120, y: 100, width: 160, height: 120 })
        break
      case "large":
        setMargins({ top: 15, right: 15, bottom: 15, left: 15 })
        setCoordinates({ x: 60, y: 100, width: 280, height: 300 })
        break
    }
  }

  // Guardar mapping
  const saveMapping = () => {
    if (!selectedGarment || !mappingName.trim()) {
      alert("Por favor selecciona una prenda y asigna un nombre")
      return
    }

    const newMapping: PrintAreaMapping = {
      id: Date.now().toString(),
      name: mappingName.trim(),
      garmentPath: selectedGarment,
      margins: { ...margins },
      coordinates: { ...coordinates },
      timestamp: Date.now(),
    }

    const updatedMappings = [...savedMappings, newMapping]
    setSavedMappings(updatedMappings)
    localStorage.setItem("printAreaMappings", JSON.stringify(updatedMappings))

    alert("Mapping guardado exitosamente!")
  }

  // Exportar todos los mappings (exactos + guardados)
  const exportMappings = () => {
    const allMappings = [...EXACT_MAPPINGS, ...savedMappings]
    const dataStr = JSON.stringify(allMappings, null, 2)
    const dataBlob = new Blob([dataStr], { type: "application/json" })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement("a")
    link.href = url
    link.download = `print-area-mappings-${Date.now()}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  // Resetear valores
  const resetValues = () => {
    if (selectedGarment && hasExactCoordinates(selectedGarment)) {
      loadExactCoordinates(selectedGarment)
    } else {
      setMargins({ top: 25, right: 25, bottom: 25, left: 25 })
      setCoordinates({ x: 100, y: 150, width: 200, height: 200 })
      setIsExactMode(false)
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Print Area Mapper</h1>
        <p className="text-muted-foreground">
          Herramienta para mapear áreas de impresión en prendas. Las coordenadas exactas del JSON están preconfiguradas.
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Panel de Control */}
        <div className="space-y-6">
          {/* Selección de Prenda */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Seleccionar Prenda
                {isExactMode && (
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    ✓ EXACT
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto">
                {availableGarments.map((garment) => (
                  <Button
                    key={garment}
                    variant={selectedGarment === garment ? "default" : "outline"}
                    className="justify-between text-left h-auto p-3"
                    onClick={() => handleGarmentSelect(garment)}
                  >
                    <span className="truncate">
                      {garment
                        .split("/")
                        .pop()
                        ?.replace(/\.(jpeg|jpg|png)$/, "")}
                    </span>
                    {hasExactCoordinates(garment) && (
                      <Badge variant="outline" className="ml-2 text-xs">
                        EXACT JSON
                      </Badge>
                    )}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Configuración */}
          {selectedGarment && (
            <Card>
              <CardHeader>
                <CardTitle>Configuración del Área</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="mappingName">Nombre del Mapping</Label>
                  <Input
                    id="mappingName"
                    value={mappingName}
                    onChange={(e) => setMappingName(e.target.value)}
                    placeholder="Ej: Hoodie Negro Frontal"
                    disabled={isExactMode}
                  />
                </div>

                {!isExactMode && (
                  <div>
                    <Label className="text-sm font-medium mb-3 block">Presets Rápidos</Label>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => applyPreset("center")}>
                        Centro
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => applyPreset("chest")}>
                        Pecho
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => applyPreset("large")}>
                        Grande
                      </Button>
                    </div>
                  </div>
                )}

                <Separator />

                {/* Márgenes */}
                <div>
                  <Label className="text-sm font-medium mb-3 block">
                    Márgenes (%)
                    {isExactMode && <span className="text-green-600 ml-2">(Coordenadas Exactas)</span>}
                  </Label>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="marginTop" className="text-xs">
                        Superior
                      </Label>
                      <Input
                        id="marginTop"
                        type="number"
                        value={margins.top}
                        onChange={(e) => setMargins((prev) => ({ ...prev, top: Number(e.target.value) }))}
                        disabled={isExactMode}
                        className="text-center"
                      />
                    </div>
                    <div>
                      <Label htmlFor="marginRight" className="text-xs">
                        Derecho
                      </Label>
                      <Input
                        id="marginRight"
                        type="number"
                        value={margins.right}
                        onChange={(e) => setMargins((prev) => ({ ...prev, right: Number(e.target.value) }))}
                        disabled={isExactMode}
                        className="text-center"
                      />
                    </div>
                    <div>
                      <Label htmlFor="marginBottom" className="text-xs">
                        Inferior
                      </Label>
                      <Input
                        id="marginBottom"
                        type="number"
                        value={margins.bottom}
                        onChange={(e) => setMargins((prev) => ({ ...prev, bottom: Number(e.target.value) }))}
                        disabled={isExactMode}
                        className="text-center"
                      />
                    </div>
                    <div>
                      <Label htmlFor="marginLeft" className="text-xs">
                        Izquierdo
                      </Label>
                      <Input
                        id="marginLeft"
                        type="number"
                        value={margins.left}
                        onChange={(e) => setMargins((prev) => ({ ...prev, left: Number(e.target.value) }))}
                        disabled={isExactMode}
                        className="text-center"
                      />
                    </div>
                  </div>
                </div>

                {/* Coordenadas */}
                <div>
                  <Label className="text-sm font-medium mb-3 block">Coordenadas Absolutas (px)</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="coordX" className="text-xs">
                        X
                      </Label>
                      <Input
                        id="coordX"
                        type="number"
                        value={coordinates.x}
                        onChange={(e) => setCoordinates((prev) => ({ ...prev, x: Number(e.target.value) }))}
                        disabled={isExactMode}
                        className="text-center"
                      />
                    </div>
                    <div>
                      <Label htmlFor="coordY" className="text-xs">
                        Y
                      </Label>
                      <Input
                        id="coordY"
                        type="number"
                        value={coordinates.y}
                        onChange={(e) => setCoordinates((prev) => ({ ...prev, y: Number(e.target.value) }))}
                        disabled={isExactMode}
                        className="text-center"
                      />
                    </div>
                    <div>
                      <Label htmlFor="coordWidth" className="text-xs">
                        Ancho
                      </Label>
                      <Input
                        id="coordWidth"
                        type="number"
                        value={coordinates.width}
                        onChange={(e) => setCoordinates((prev) => ({ ...prev, width: Number(e.target.value) }))}
                        disabled={isExactMode}
                        className="text-center"
                      />
                    </div>
                    <div>
                      <Label htmlFor="coordHeight" className="text-xs">
                        Alto
                      </Label>
                      <Input
                        id="coordHeight"
                        type="number"
                        value={coordinates.height}
                        onChange={(e) => setCoordinates((prev) => ({ ...prev, height: Number(e.target.value) }))}
                        disabled={isExactMode}
                        className="text-center"
                      />
                    </div>
                  </div>
                </div>

                {/* Acciones */}
                <div className="flex gap-2 pt-4">
                  <Button onClick={resetValues} variant="outline" size="sm">
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Reset
                  </Button>
                  {!isExactMode && (
                    <Button onClick={saveMapping} size="sm">
                      <Save className="w-4 h-4 mr-2" />
                      Guardar
                    </Button>
                  )}
                  <Button onClick={exportMappings} variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    Export JSON
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Vista Previa */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Vista Previa</CardTitle>
            </CardHeader>
            <CardContent>
              {selectedGarment ? (
                <div className="relative bg-gray-100 rounded-lg overflow-hidden">
                  <Image
                    src={selectedGarment || "/placeholder.svg"}
                    alt="Prenda seleccionada"
                    width={400}
                    height={500}
                    className="w-full h-auto"
                  />

                  {/* Área de impresión usando márgenes */}
                  <div
                    className="absolute border-2 border-dashed border-red-500 bg-red-500/10"
                    style={{
                      left: `${margins.left}%`,
                      top: `${margins.top}%`,
                      right: `${margins.right}%`,
                      bottom: `${margins.bottom}%`,
                    }}
                  />

                  {/* Indicador de coordenadas */}
                  <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                    {coordinates.x}, {coordinates.y} | {coordinates.width}×{coordinates.height}
                  </div>

                  {isExactMode && (
                    <div className="absolute top-2 right-2 bg-green-600 text-white text-xs px-2 py-1 rounded">
                      EXACT JSON
                    </div>
                  )}
                </div>
              ) : (
                <div className="aspect-[4/5] bg-gray-100 rounded-lg flex items-center justify-center text-gray-500">
                  Selecciona una prenda para ver la vista previa
                </div>
              )}
            </CardContent>
          </Card>

          {/* Mappings Guardados */}
          {savedMappings.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Mappings Guardados ({savedMappings.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {savedMappings.map((mapping) => (
                    <div key={mapping.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span className="text-sm font-medium">{mapping.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {mapping.coordinates.width}×{mapping.coordinates.height}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Estadísticas */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5" />
                Estadísticas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-green-600">{EXACT_MAPPINGS.length}</div>
                  <div className="text-sm text-muted-foreground">Coordenadas Exactas</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-600">{savedMappings.length}</div>
                  <div className="text-sm text-muted-foreground">Mappings Custom</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
