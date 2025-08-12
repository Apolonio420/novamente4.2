"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Image from "next/image"

interface GarmentSelectorProps {
  selectedGarment: string
  selectedColor: string
  selectedSize: string
  onGarmentChange: (garment: string) => void
  onColorChange: (color: string) => void
  onSizeChange: (size: string) => void
}

export function GarmentSelector({
  selectedGarment,
  selectedColor,
  selectedSize,
  onGarmentChange,
  onColorChange,
  onSizeChange,
}: GarmentSelectorProps) {
  const garments = [
    {
      id: "aura-oversize-tshirt",
      name: "Aura Oversize T-Shirt",
      price: 37000,
      image: "/products/aura-tshirt-negro-front.jpeg",
      colors: ["black", "white", "caramel"],
      sizes: ["S", "M", "L", "XL"], // Solo estos talles
    },
    {
      id: "aldea-classic-tshirt",
      name: "Aldea Classic Fit T-Shirt",
      price: 33000,
      image: "/products/tshirt-aldea-negro-front.jpeg",
      colors: ["black", "white"],
      sizes: ["S", "M", "L", "XL"], // Solo estos talles
    },
    {
      id: "astra-oversize-hoodie",
      name: "Astra Oversize Hoodie",
      price: 60000, // Precio actualizado
      image: "/products/hoodie-negro-front.jpeg",
      colors: ["black", "caramel", "cream", "gray"],
      sizes: ["S", "M", "L", "XL"], // Solo estos talles
    },
    {
      id: "lienzo",
      name: "Lienzo",
      price: 59900,
      image: "/products/lienzo-main.png",
      colors: ["white"],
      sizes: ["30x40cm", "40x50cm", "50x70cm"], // Tamaños específicos para lienzo
    },
  ]

  const colorNames: { [key: string]: string } = {
    black: "Negro",
    white: "Blanco",
    caramel: "Caramelo",
    cream: "Crema",
    gray: "Gris",
  }

  const selectedGarmentData = garments.find((g) => g.id === selectedGarment)

  const handleGarmentChange = (garmentId: string) => {
    const newGarment = garments.find((g) => g.id === garmentId)
    if (newGarment) {
      onGarmentChange(garmentId)

      // Reset color and size when changing garment
      if (!newGarment.colors.includes(selectedColor)) {
        onColorChange(newGarment.colors[0])
      }

      if (!newGarment.sizes.includes(selectedSize)) {
        onSizeChange(newGarment.sizes[0])
      }
    }
  }

  return (
    <div className="space-y-6">
      {/* Garment Selection */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Elegí tu prenda</h3>
        <div className="grid grid-cols-1 gap-3">
          {garments.map((garment) => (
            <Card
              key={garment.id}
              className={`cursor-pointer transition-all duration-200 ${
                selectedGarment === garment.id
                  ? "ring-2 ring-primary border-primary bg-primary/5"
                  : "hover:border-primary/50"
              }`}
              onClick={() => handleGarmentChange(garment.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 relative rounded-md overflow-hidden">
                      <Image
                        src={garment.image || "/placeholder.svg"}
                        alt={garment.name}
                        fill
                        className="object-cover"
                        sizes="48px"
                      />
                    </div>
                    <div>
                      <h4 className="font-medium">{garment.name}</h4>
                      <p className="text-sm text-muted-foreground">${garment.price.toLocaleString()}</p>
                    </div>
                  </div>
                  {selectedGarment === garment.id && (
                    <Badge className="bg-primary text-primary-foreground">Seleccionada</Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Color Selection */}
      {selectedGarmentData && selectedGarmentData.colors.length > 1 && (
        <div>
          <h3 className="text-lg font-semibold mb-3">Color</h3>
          <div className="grid grid-cols-2 gap-2">
            {selectedGarmentData.colors.map((color) => (
              <Button
                key={color}
                variant={selectedColor === color ? "default" : "outline"}
                onClick={() => onColorChange(color)}
                className="justify-start"
              >
                <div
                  className={`w-4 h-4 rounded-full mr-2 border ${
                    color === "white" ? "border-gray-300" : "border-transparent"
                  }`}
                  style={{
                    backgroundColor:
                      color === "black"
                        ? "#000000"
                        : color === "white"
                          ? "#ffffff"
                          : color === "caramel"
                            ? "#D2B48C"
                            : color === "cream"
                              ? "#F5F5DC"
                              : color === "gray"
                                ? "#808080"
                                : color,
                  }}
                />
                {colorNames[color] || color}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Size Selection */}
      {selectedGarmentData && (
        <div>
          <h3 className="text-lg font-semibold mb-3">{selectedGarment === "lienzo" ? "Tamaño" : "Talle"}</h3>
          <div className="grid grid-cols-2 gap-2">
            {selectedGarmentData.sizes.map((size) => (
              <Button
                key={size}
                variant={selectedSize === size ? "default" : "outline"}
                onClick={() => onSizeChange(size)}
              >
                {size}
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
