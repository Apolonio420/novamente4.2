"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getAvailableRedSquareOptions } from "@/lib/garment-red-square-mapping"
import { OptimizedImage } from "./OptimizedImage"

interface StampSizeSelectorProps {
  garmentType: 'hoodie' | 'tshirt'
  garmentVariant: 'classic' | 'oversize'
  garmentColor: 'black' | 'gray' | 'caramel' | 'white' | 'cream' | 'model'
  side: 'front' | 'back'
  onSizeSelect: (size: 'R1' | 'R2', position?: 'center' | 'left') => void
  selectedSize?: 'R1' | 'R2'
  selectedPosition?: 'center' | 'left'
}

export function StampSizeSelector({
  garmentType,
  garmentVariant,
  garmentColor,
  side,
  onSizeSelect,
  selectedSize,
  selectedPosition
}: StampSizeSelectorProps) {
  const [hoveredOption, setHoveredOption] = useState<string | null>(null)

  const availableOptions = getAvailableRedSquareOptions(
    garmentType,
    garmentVariant,
    garmentColor,
    side
  )

  console.log("StampSizeSelector - Available options:", availableOptions)
  console.log("StampSizeSelector - Props:", { garmentType, garmentVariant, garmentColor, side })

  // Fallback options si no hay opciones disponibles
  const fallbackOptions = [
    { size: 'R1' as const, position: 'center' as const, imagePath: '/placeholder.svg' },
    { size: 'R1' as const, position: 'left' as const, imagePath: '/placeholder.svg' },
    { size: 'R2' as const, imagePath: '/placeholder.svg' }
  ]

  const displayOptions = availableOptions.length > 0 ? availableOptions : fallbackOptions

  const getSizeLabel = (size: 'R1' | 'R2') => {
    switch (size) {
      case 'R1': return 'Pequeño'
      case 'R2': return 'Mediano'
    }
  }

  const getPositionLabel = (position?: 'center' | 'left') => {
    if (!position) return ''
    return position === 'center' ? 'Centro' : 'Izquierda'
  }

  const getOptionKey = (size: 'R1' | 'R2', position?: 'center' | 'left') => {
    return `${size}${position || ''}`
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-2">Tamaño del Estampado</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Selecciona el tamaño y posición del estampado en tu prenda
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {displayOptions.map((option) => {
          const optionKey = getOptionKey(option.size, option.position)
          const isSelected = selectedSize === option.size && selectedPosition === option.position
          const isHovered = hoveredOption === optionKey

          return (
            <Card
              key={optionKey}
              className={`cursor-pointer transition-all duration-200 ${
                isSelected 
                  ? "ring-2 ring-primary bg-primary/5" 
                  : "hover:shadow-md hover:scale-105"
              }`}
              onMouseEnter={() => setHoveredOption(optionKey)}
              onMouseLeave={() => setHoveredOption(null)}
              onClick={() => onSizeSelect(option.size, option.position)}
            >
              <CardContent className="p-4">
                <div className="space-y-3">
                  {/* Imagen de referencia */}
                  <div className="relative aspect-square rounded-lg overflow-hidden bg-muted">
                    <OptimizedImage
                      src={option.imagePath}
                      alt={`Estampado ${getSizeLabel(option.size)} ${getPositionLabel(option.position)}`}
                      width={200}
                      height={200}
                      className="object-cover w-full h-full"
                      sizes="(max-width: 768px) 50vw, 33vw"
                    />
                    {isHovered && (
                      <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                        <Badge variant="secondary" className="text-xs">
                          {isSelected ? "Seleccionado" : "Seleccionar"}
                        </Badge>
                      </div>
                    )}
                  </div>

                  {/* Información del tamaño */}
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <Badge 
                        variant={isSelected ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {option.size}
                      </Badge>
                      {option.position && (
                        <Badge 
                          variant={isSelected ? "outline" : "secondary"}
                          className="text-xs"
                        >
                          {getPositionLabel(option.position)}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm font-medium">
                      {getSizeLabel(option.size)}
                    </p>
                    {option.position && (
                      <p className="text-xs text-muted-foreground">
                        {getPositionLabel(option.position)}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {selectedSize && (
        <div className="mt-4 p-3 bg-primary/10 rounded-lg">
          <p className="text-sm text-primary font-medium">
            ✓ Estampado {getSizeLabel(selectedSize)} seleccionado
            {selectedPosition && ` - ${getPositionLabel(selectedPosition)}`}
          </p>
        </div>
      )}
    </div>
  )
}
