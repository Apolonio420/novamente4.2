"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { RotateCcw, Download, Trash2, Plus, Minus } from "lucide-react"

// Coordenadas predefinidas del JSON
const PREDEFINED_MAPPINGS = [
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

// Lista de prendas disponibles
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

interface Margins {
  top: number
  right: number
  bottom: number
  left: number
}

interface Coordinates {
  x: number
  y: number
  width: number
  height: number
}

interface Mapping {
  id: string
  name: string
  garmentPath: string
  margins: Margins
  coordinates: Coordinates
  timestamp: number
}

export default function PrintAreaMapper() {
  const [selectedGarment, setSelectedGarment] = useState<string>("")
  const [mappingName, setMappingName] = useState<string>("")
  const [margins, setMargins] = useState<Margins>({ top: 25, right: 15, bottom: 30, left: 15 })
  const [coordinates, setCoordinates] = useState<Coordinates>({ x: 0, y: 0, width: 0, height: 0 })
  const [customMappings, setCustomMappings] = useState<Mapping[]>([])
  const [isUsingExact, setIsUsingExact] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)

  // Cargar mappings custom del localStorage
  useEffect(() => {
    const saved = localStorage.getItem("print-area-mappings")
    if (saved) {
      try {
        setCustomMappings(JSON.parse(saved))
      } catch (error) {
        console.error("Error loading saved mappings:", error)
      }
    }
  }, [])

  // Guardar mappings custom en localStorage
  useEffect(() => {
    if (customMappings.length > 0) {
      localStorage.setItem("print-area-mappings", JSON.stringify(customMappings))
    }
  }, [customMappings])

  // Calcular coordenadas cuando cambian los márgenes
  useEffect(() => {
    if (imageRef.current) {
      calculateCoordinates()
    }
  }, [margins])

  // Manejar selección de prenda
  const handleGarmentSelect = (garmentPath: string) => {
    setSelectedGarment(garmentPath)

    // Buscar si existe un mapping predefinido para esta prenda
    const predefined = PREDEFINED_MAPPINGS.find((m) => m.garmentPath === garmentPath)

    if (predefined) {
      setMappingName(predefined.name)
      setMargins(predefined.margins)
      setCoordinates(predefined.coordinates)
      setIsUsingExact(true)
    } else {
      // Aplicar preset basado en el tipo de prenda
      const garmentName = GARMENTS.find((g) => g.path === garmentPath)?.name || ""
      setMappingName(garmentName)

      if (garmentName.includes("Hoodie")) {
        if (garmentName.includes("Frontal")) {
          setMargins({ top: 25, right: 15, bottom: 45, left: 15 })
        } else {
          setMargins({ top: 20, right: 15, bottom: 30, left: 15 })
        }
      } else {
        if (garmentName.includes("Frontal")) {
          setMargins({ top: 20, right: 10, bottom: 25, left: 10 })
        } else {
          setMargins({ top: 15, right: 10, bottom: 20, left: 10 })
        }
      }
      setIsUsingExact(false)
    }
  }

  // Cargar coordenadas exactas
  const loadExactCoordinates = () => {
    const predefined = PREDEFINED_MAPPINGS.find((m) => m.garmentPath === selectedGarment)
    if (predefined) {
      setMargins(predefined.margins)
      setCoordinates(predefined.coordinates)
      setIsUsingExact(true)
    }
  }

  // Calcular coordenadas basadas en márgenes
  const calculateCoordinates = () => {
    if (!imageRef.current) return

    const img = imageRef.current
    const imgWidth = 400 // Ancho fijo del preview
    const imgHeight = 500 // Alto fijo del preview

    const x = Math.round((margins.left / 100) * imgWidth)
    const y = Math.round((margins.top / 100) * imgHeight)
    const width = Math.round(imgWidth - ((margins.left + margins.right) / 100) * imgWidth)
    const height = Math.round(imgHeight - ((margins.top + margins.bottom) / 100) * imgHeight)

    setCoordinates({ x, y, width, height })
    setIsUsingExact(false)
  }

  // Actualizar margen individual
  const updateMargin = (side: keyof Margins, value: number) => {
    const newMargins = { ...margins, [side]: Math.max(0, Math.min(50, value)) }
    setMargins(newMargins)
  }

  // Presets rápidos
  const applyPreset = (preset: "minimal" | "standard" | "conservative") => {
    const presets = {
      minimal: { top: 10, right: 8, bottom: 12, left: 8 },
      standard: { top: 20, right: 15, bottom: 25, left: 15 },
      conservative: { top: 30, right: 25, bottom: 35, left: 25 },
    }
    setMargins(presets[preset])
    setIsUsingExact(false)
  }

  // Resetear márgenes
  const resetMargins = () => {
    setMargins({ top: 25, right: 15, bottom: 30, left: 15 })
    setIsUsingExact(false)
  }

  // Guardar mapping
  const saveMapping = () => {
    if (!selectedGarment || !mappingName.trim()) return

    const newMapping: Mapping = {
      id: Date.now().toString(),
      name: mappingName.trim(),
      garmentPath: selectedGarment,
      margins: { ...margins },
      coordinates: { ...coordinates },
      timestamp: Date.now(),
    }

    setCustomMappings((prev) => [newMapping, ...prev])
  }

  // Eliminar mapping custom
  const deleteMapping = (id: string) => {
    setCustomMappings((prev) => prev.filter((m) => m.id !== id))
  }

  // Exportar todos los mappings
  const exportMappings = () => {
    const allMappings = [...PREDEFINED_MAPPINGS, ...customMappings]
    const dataStr = JSON.stringify(allMappings, null, 2)
    const dataBlob = new Blob([dataStr], { type: "application/json" })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement("a")
    link.href = url
    link.download = `print-area-mappings-${Date.now()}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Print Area Mapper</h1>
        <p className="text-muted-foreground">
          Mapea las áreas de impresión para cada prenda con coordenadas exactas predefinidas
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Panel de Control */}
        <div className="lg:col-span-1 space-y-6">
          {/* Selección de Prenda */}
          <Card>
            <CardHeader>
              <CardTitle>Seleccionar Prenda</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2 max-h-96 overflow-y-auto">
                {GARMENTS.map((garment) => {
                  const predefined = PREDEFINED_MAPPINGS.find((m) => m.garmentPath === garment.path)
                  return (
                    <div key={garment.path} className="relative">
                      <button
                        onClick={() => handleGarmentSelect(garment.path)}
                        className={`w-full p-2 text-xs border rounded-lg hover:bg-accent transition-colors ${
                          selectedGarment === garment.path ? "border-primary bg-primary/10" : "border-border"
                        }`}
                      >
                        <img
                          src={garment.path || "/placeholder.svg"}
                          alt={garment.name}
                          className="w-full h-16 object-cover rounded mb-1"
                        />
                        <div className="text-center">
                          {garment.name}
                          {predefined && (
                            <Badge variant="secondary" className="ml-1 text-xs bg-green-100 text-green-800">
                              ✓ Mapped
                            </Badge>
                          )}
                        </div>
                      </button>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Configuración */}
          {selectedGarment && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Configuración
                  {isUsingExact && (
                    <Badge variant="default" className="bg-blue-100 text-blue-800">
                      EXACT
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Nombre del Mapping */}
                <div>
                  <Label htmlFor="mapping-name">Nombre del Mapping</Label>
                  <Input
                    id="mapping-name"
                    value={mappingName}
                    onChange={(e) => setMappingName(e.target.value)}
                    placeholder="Ej: Hoodie Negro Frontal"
                  />
                </div>

                {/* Botón para cargar coordenadas exactas */}
                {PREDEFINED_MAPPINGS.find((m) => m.garmentPath === selectedGarment) && (
                  <Button
                    onClick={loadExactCoordinates}
                    variant="outline"
                    className="w-full bg-transparent"
                    disabled={isUsingExact}
                  >
                    {isUsingExact ? "Usando Coordenadas Exactas" : "Cargar Coordenadas Exactas"}
                  </Button>
                )}

                {/* Presets Rápidos */}
                <div>
                  <Label>Presets Rápidos</Label>
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    <Button onClick={() => applyPreset("minimal")} variant="outline" size="sm">
                      Mínimo
                    </Button>
                    <Button onClick={() => applyPreset("standard")} variant="outline" size="sm">
                      Estándar
                    </Button>
                    <Button onClick={() => applyPreset("conservative")} variant="outline" size="sm">
                      Conservador
                    </Button>
                  </div>
                </div>

                {/* Controles de Márgenes Mejorados */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <Label>Márgenes (%)</Label>
                    <Button onClick={resetMargins} variant="outline" size="sm">
                      <RotateCcw className="w-4 h-4 mr-1" />
                      Reset
                    </Button>
                  </div>

                  {/* Top */}
                  <div className="space-y-3 mb-4">
                    <Label>Top ({margins.top}%)</Label>
                    <div className="flex items-center space-x-2">
                      <Button
                        onClick={() => updateMargin("top", margins.top - 1)}
                        variant="outline"
                        size="sm"
                        className="h-8 w-8 p-0"
                      >
                        <Minus className="w-3 h-3" />
                      </Button>
                      <div className="flex-1">
                        <input
                          type="range"
                          min="0"
                          max="50"
                          value={margins.top}
                          onChange={(e) => updateMargin("top", Number.parseInt(e.target.value))}
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                        />
                      </div>
                      <Button
                        onClick={() => updateMargin("top", margins.top + 1)}
                        variant="outline"
                        size="sm"
                        className="h-8 w-8 p-0"
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                      <Input
                        type="number"
                        min="0"
                        max="50"
                        value={margins.top}
                        onChange={(e) => updateMargin("top", Number.parseInt(e.target.value) || 0)}
                        className="w-16 h-8 text-xs"
                      />
                    </div>
                  </div>

                  {/* Bottom */}
                  <div className="space-y-3 mb-4">
                    <Label>Bottom ({margins.bottom}%)</Label>
                    <div className="flex items-center space-x-2">
                      <Button
                        onClick={() => updateMargin("bottom", margins.bottom - 1)}
                        variant="outline"
                        size="sm"
                        className="h-8 w-8 p-0"
                      >
                        <Minus className="w-3 h-3" />
                      </Button>
                      <div className="flex-1">
                        <input
                          type="range"
                          min="0"
                          max="50"
                          value={margins.bottom}
                          onChange={(e) => updateMargin("bottom", Number.parseInt(e.target.value))}
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                        />
                      </div>
                      <Button
                        onClick={() => updateMargin("bottom", margins.bottom + 1)}
                        variant="outline"
                        size="sm"
                        className="h-8 w-8 p-0"
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                      <Input
                        type="number"
                        min="0"
                        max="50"
                        value={margins.bottom}
                        onChange={(e) => updateMargin("bottom", Number.parseInt(e.target.value) || 0)}
                        className="w-16 h-8 text-xs"
                      />
                    </div>
                  </div>

                  {/* Left */}
                  <div className="space-y-3 mb-4">
                    <Label>Left ({margins.left}%)</Label>
                    <div className="flex items-center space-x-2">
                      <Button
                        onClick={() => updateMargin("left", margins.left - 1)}
                        variant="outline"
                        size="sm"
                        className="h-8 w-8 p-0"
                      >
                        <Minus className="w-3 h-3" />
                      </Button>
                      <div className="flex-1">
                        <input
                          type="range"
                          min="0"
                          max="50"
                          value={margins.left}
                          onChange={(e) => updateMargin("left", Number.parseInt(e.target.value))}
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                        />
                      </div>
                      <Button
                        onClick={() => updateMargin("left", margins.left + 1)}
                        variant="outline"
                        size="sm"
                        className="h-8 w-8 p-0"
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                      <Input
                        type="number"
                        min="0"
                        max="50"
                        value={margins.left}
                        onChange={(e) => updateMargin("left", Number.parseInt(e.target.value) || 0)}
                        className="w-16 h-8 text-xs"
                      />
                    </div>
                  </div>

                  {/* Right */}
                  <div className="space-y-3 mb-4">
                    <Label>Right ({margins.right}%)</Label>
                    <div className="flex items-center space-x-2">
                      <Button
                        onClick={() => updateMargin("right", margins.right - 1)}
                        variant="outline"
                        size="sm"
                        className="h-8 w-8 p-0"
                      >
                        <Minus className="w-3 h-3" />
                      </Button>
                      <div className="flex-1">
                        <input
                          type="range"
                          min="0"
                          max="50"
                          value={margins.right}
                          onChange={(e) => updateMargin("right", Number.parseInt(e.target.value))}
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                        />
                      </div>
                      <Button
                        onClick={() => updateMargin("right", margins.right + 1)}
                        variant="outline"
                        size="sm"
                        className="h-8 w-8 p-0"
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                      <Input
                        type="number"
                        min="0"
                        max="50"
                        value={margins.right}
                        onChange={(e) => updateMargin("right", Number.parseInt(e.target.value) || 0)}
                        className="w-16 h-8 text-xs"
                      />
                    </div>
                  </div>
                </div>

                {/* Coordenadas Calculadas */}
                <div>
                  <Label>Coordenadas Calculadas</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                    <div className="p-2 bg-muted rounded">
                      <div className="font-medium">X: {coordinates.x}px</div>
                      <div className="font-medium">Y: {coordinates.y}px</div>
                    </div>
                    <div className="p-2 bg-muted rounded">
                      <div className="font-medium">W: {coordinates.width}px</div>
                      <div className="font-medium">H: {coordinates.height}px</div>
                    </div>
                  </div>
                </div>

                {/* Botón Guardar */}
                <Button onClick={saveMapping} className="w-full" disabled={!mappingName.trim() || !selectedGarment}>
                  Guardar Mapping
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Preview */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Preview</CardTitle>
            </CardHeader>
            <CardContent>
              {selectedGarment ? (
                <div className="relative">
                  <img
                    ref={imageRef}
                    src={selectedGarment || "/placeholder.svg"}
                    alt="Garment preview"
                    className="w-full max-w-sm mx-auto"
                    style={{ width: "400px", height: "500px", objectFit: "cover" }}
                    onLoad={calculateCoordinates}
                  />

                  {/* Overlay de área de impresión */}
                  <div
                    className="absolute border-2 border-dashed border-blue-500 bg-blue-500/10"
                    style={{
                      left: `${margins.left}%`,
                      top: `${margins.top}%`,
                      width: `${100 - margins.left - margins.right}%`,
                      height: `${100 - margins.top - margins.bottom}%`,
                    }}
                  >
                    {/* Indicadores de esquinas */}
                    <div className="absolute -top-1 -left-1 w-2 h-2 bg-blue-500 rounded-full"></div>
                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full"></div>
                    <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-blue-500 rounded-full"></div>
                    <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-blue-500 rounded-full"></div>
                  </div>

                  {/* Overlays de márgenes */}
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

                  {/* Badge de estado */}
                  {isUsingExact && (
                    <div className="absolute top-2 right-2">
                      <Badge className="bg-blue-600 text-white">EXACT</Badge>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-center h-64 text-muted-foreground">
                  Selecciona una prenda para ver el preview
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Mappings Guardados */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Mappings Guardados
                <Button onClick={exportMappings} variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-1" />
                  Export
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {/* Mappings Predefinidos */}
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-2">
                    Predefinidos ({PREDEFINED_MAPPINGS.length})
                  </h4>
                  <div className="space-y-2">
                    {PREDEFINED_MAPPINGS.map((mapping) => (
                      <div
                        key={mapping.id}
                        className="flex items-center space-x-2 p-2 border rounded-lg bg-green-50 border-green-200"
                      >
                        <img
                          src={mapping.garmentPath || "/placeholder.svg"}
                          alt={mapping.name}
                          className="w-8 h-8 object-cover rounded"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">{mapping.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {mapping.coordinates.width}×{mapping.coordinates.height}
                          </div>
                        </div>
                        <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">
                          ✓
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Separator */}
                {customMappings.length > 0 && <Separator />}

                {/* Mappings Custom */}
                {customMappings.length > 0 && (
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground mb-2">Custom ({customMappings.length})</h4>
                    <div className="space-y-2">
                      {customMappings.map((mapping) => (
                        <div key={mapping.id} className="flex items-center space-x-2 p-2 border rounded-lg">
                          <img
                            src={mapping.garmentPath || "/placeholder.svg"}
                            alt={mapping.name}
                            className="w-8 h-8 object-cover rounded"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium truncate">{mapping.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {mapping.coordinates.width}×{mapping.coordinates.height}
                            </div>
                          </div>
                          <Button
                            onClick={() => deleteMapping(mapping.id)}
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {customMappings.length === 0 && (
                  <div className="text-center text-muted-foreground text-sm py-4">No hay mappings custom guardados</div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* CSS para los sliders */}
      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }

        .slider::-moz-range-thumb {
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          border: none;
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
