"use client"

import { useState, type ReactNode } from "react"
import ImageGalleryClient from "./ImageGalleryClient"
import { AddToCartButtons, type AddToCartButtonsProps } from "./AddToCartButtons"

interface ColorImages {
  front?: string
  back?: string
}

interface ProductMediaBuyProps {
  // Imágenes base del producto (fallback cuando el color activo no tiene
  // fotos propias — no debería pasar porque este componente solo se monta
  // cuando SÍ hay colores con images válidas, pero se mantiene como red de
  // seguridad).
  images: string[]
  productName: string
  // Mapa color -> { front, back }. Solo trae entradas con al menos una imagen
  // válida (filtrado ya en page.tsx).
  colorImages: Record<string, ColorImages>
  // Color inicial — misma fórmula que AddToCartButtons usa para su propio
  // useState interno (defaultColor si es válido, si no el primer color).
  initialColor: string
  hotSaleBadge?: ReactNode
  infoTop: ReactNode
  comingSoon: boolean
  comingSoonNotice?: ReactNode
  // Resto de props de AddToCartButtons — se le agregan selectedColor/onSelectColor
  // acá para pasarlo a modo controlado.
  addToCartProps: Omit<AddToCartButtonsProps, "selectedColor" | "onSelectColor">
  backLink: ReactNode
}

/**
 * Wrapper client que sincroniza el color elegido en el picker (AddToCartButtons)
 * con las fotos que muestra la galería (ImageGalleryClient). Solo se usa cuando
 * el producto tiene metadata.colors[].images válidas — para el resto de los
 * productos (la gran mayoría) page.tsx sigue usando el árbol original sin pasar
 * por este componente.
 */
export default function ProductMediaBuy({
  images,
  productName,
  colorImages,
  initialColor,
  hotSaleBadge,
  infoTop,
  comingSoon,
  comingSoonNotice,
  addToCartProps,
  backLink,
}: ProductMediaBuyProps) {
  const [selectedColor, setSelectedColor] = useState<string>(initialColor)

  const colorImg = colorImages[selectedColor]
  const hasImagesForColor = !!(colorImg && (colorImg.front || colorImg.back))
  const galleryImages = hasImagesForColor
    ? ([colorImg!.front, colorImg!.back].filter(Boolean) as string[])
    : images

  return (
    <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
      {/* Image Gallery — key={selectedColor} solo cuando el color activo tiene
          fotos propias, para resetear activeIdx/zoom al cambiar de color sin
          remontar innecesariamente cuando el cambio no afecta la galería. */}
      <div className="relative">
        <ImageGalleryClient
          key={hasImagesForColor ? selectedColor : undefined}
          images={galleryImages}
          name={productName}
        />
        {hotSaleBadge}
      </div>

      {/* Product Info */}
      <div className="flex flex-col gap-6">
        {infoTop}

        {comingSoon ? (
          comingSoonNotice
        ) : (
          <AddToCartButtons
            {...addToCartProps}
            selectedColor={selectedColor}
            onSelectColor={setSelectedColor}
          />
        )}

        {backLink}
      </div>
    </div>
  )
}
