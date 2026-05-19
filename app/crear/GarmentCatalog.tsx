"use client"

import Image from "next/image"
import { useState } from "react"
import { Check } from "lucide-react"

// ============================================================
// Types
// ============================================================

export interface GarmentSelection {
  garmentType: string
  garmentColor: string
  side: "front" | "back"
}

interface GarmentCatalogProps extends GarmentSelection {
  onChange: (next: GarmentSelection) => void
}

// ============================================================
// Color map: Spanish UI value → English filename segment
// ============================================================

const COLOR_MAP: Record<string, string> = {
  negro: "black",
  blanco: "white",
  stone_wash: "stone-wash",
  "stone-wash": "stone-wash",
  gris: "gray",
  crema: "crema",
  caramel: "caramel",
  marron: "marron",
  chocolate: "chocolate",
  amarillo: "yellow",
}

function toFileColor(color: string): string {
  return COLOR_MAP[color.toLowerCase()] ?? color.toLowerCase().replace(/\s+/g, "-")
}

// ============================================================
// Catalog definition
// Each entry declares the garmentType key used in session state,
// display name, B2C price, available colors (Spanish UI keys),
// and a function to resolve the public garment image path.
// ============================================================

interface GarmentDef {
  garmentType: string
  label: string
  price: number
  colors: { value: string; label: string; hex: string }[]
  imagePath: (color: string, side: "front" | "back") => string
  availableSides: ("front" | "back")[]
}

const COLOR_HEX: Record<string, string> = {
  negro: "#1a1a1a",
  blanco: "#f5f5f5",
  stone_wash: "#9e9e9e",
  gris: "#7a7a7a",
  crema: "#f0e6d3",
  caramel: "#b5813a",
  marron: "#6b3a2a",
  chocolate: "#4a2c17",
  amarillo: "#f5c842",
}

const GARMENTS: GarmentDef[] = [
  {
    garmentType: "aldea_classic_fit",
    label: "Remera Clásica",
    price: 28600,
    colors: [
      { value: "negro", label: "Negro", hex: COLOR_HEX.negro },
      { value: "blanco", label: "Blanco", hex: COLOR_HEX.blanco },
    ],
    imagePath: (color, side) => `/garments/tshirt-${toFileColor(color)}-classic-${side}.jpeg`,
    availableSides: ["front", "back"],
  },
  {
    garmentType: "aura_oversized",
    label: "Remera Oversize",
    price: 31000,
    colors: [
      { value: "negro", label: "Negro", hex: COLOR_HEX.negro },
      { value: "blanco", label: "Blanco", hex: COLOR_HEX.blanco },
    ],
    imagePath: (color, side) => `/garments/tshirt-${toFileColor(color)}-oversize-${side}.jpeg`,
    availableSides: ["front", "back"],
  },
  {
    garmentType: "boston_hoodie",
    label: "Buzo Hoodie",
    price: 52000,
    colors: [
      { value: "negro", label: "Negro", hex: COLOR_HEX.negro },
      { value: "blanco", label: "Blanco", hex: COLOR_HEX.blanco },
      { value: "stone_wash", label: "Stone Wash", hex: COLOR_HEX.stone_wash },
      { value: "gris", label: "Gris", hex: COLOR_HEX.gris },
      { value: "crema", label: "Crema", hex: COLOR_HEX.crema },
      { value: "marron", label: "Marrón", hex: COLOR_HEX.marron },
    ],
    imagePath: (color, side) => {
      // Spanish colors (crema/gris/marron) have buzo-hoodie-unisex-{color}-{side}.jpeg
      if (["crema", "gris", "marron"].includes(color)) {
        return `/garments/buzo-hoodie-unisex-${color}-${side}.jpeg`
      }
      // negro/blanco/stone_wash: front exists as .png; back falls back to hoodie-{color}-back.jpeg
      const fc = toFileColor(color)
      if (side === "back") {
        // hoodie-black-back.jpeg / hoodie-cream-back.png exist; black/white use hoodie- prefix
        return `/garments/hoodie-${fc}-back.jpeg`
      }
      return `/garments/buzo-hoodie-unisex-${fc}-${side}.png`
    },
    availableSides: ["front", "back"],
  },
  {
    garmentType: "buzo_cuello_redondo",
    label: "Buzo Cuello Redondo",
    price: 43000,
    colors: [
      { value: "negro", label: "Negro", hex: COLOR_HEX.negro },
      { value: "blanco", label: "Blanco", hex: COLOR_HEX.blanco },
      { value: "stone_wash", label: "Stone Wash", hex: COLOR_HEX.stone_wash },
    ],
    imagePath: (color, _side) => `/garments/buzo-cuello-redondo-${toFileColor(color)}-front.png`,
    availableSides: ["front"],
  },
  {
    garmentType: "musculosa_bali",
    label: "Musculosa Bali",
    price: 21800,
    colors: [
      { value: "negro", label: "Negro", hex: COLOR_HEX.negro },
      { value: "blanco", label: "Blanco", hex: COLOR_HEX.blanco },
      { value: "gris", label: "Gris", hex: COLOR_HEX.gris },
    ],
    imagePath: (color, _side) => `/garments/musculosa-bali-${toFileColor(color)}-front.png`,
    availableSides: ["front"],
  },
  {
    garmentType: "astra_crop",
    label: "Remera Crop",
    price: 23500,
    colors: [
      { value: "negro", label: "Negro", hex: COLOR_HEX.negro },
      { value: "blanco", label: "Blanco", hex: COLOR_HEX.blanco },
    ],
    imagePath: (color, _side) => `/garments/remera-crop-mujer-${toFileColor(color)}-front.png`,
    availableSides: ["front"],
  },
]

// ============================================================
// Sub-components
// ============================================================

function ColorDot({
  color,
  selected,
  onClick,
}: {
  color: { value: string; label: string; hex: string }
  selected: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      title={color.label}
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
      className={`relative w-5 h-5 rounded-full border-2 transition-all shrink-0 ${
        selected ? "border-violet-400 scale-110" : "border-zinc-600 hover:border-zinc-400"
      }`}
      style={{ backgroundColor: color.hex }}
    >
      {selected && (
        <span className="absolute inset-0 flex items-center justify-center">
          <Check className="w-2.5 h-2.5 text-white drop-shadow-sm" strokeWidth={3} />
        </span>
      )}
    </button>
  )
}

function SideToggle({
  side,
  available,
  onChange,
}: {
  side: "front" | "back"
  available: ("front" | "back")[]
  onChange: (s: "front" | "back") => void
}) {
  if (available.length < 2) return null
  return (
    <div className="flex gap-1 mt-2">
      {(["front", "back"] as const).map((s) => (
        <button
          key={s}
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onChange(s)
          }}
          className={`flex-1 py-1 rounded text-[10px] font-medium transition ${
            side === s
              ? "bg-violet-600 text-white"
              : "bg-zinc-700 text-zinc-400 hover:text-zinc-200"
          }`}
        >
          {s === "front" ? "Frente" : "Espalda"}
        </button>
      ))}
    </div>
  )
}

// ============================================================
// Main component
// ============================================================

export function GarmentCatalog({ garmentType, garmentColor, side, onChange }: GarmentCatalogProps) {
  // Track per-card hover color separately so inactive cards still show their color picker
  const [hoverCard, setHoverCard] = useState<string | null>(null)

  return (
    <div className="space-y-3">
      <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Elegí tu prenda</p>

      {/* Side toggle — shown above grid only when active garment has both sides */}
      {(() => {
        const activeDef = GARMENTS.find((g) => g.garmentType === garmentType)
        if (!activeDef || activeDef.availableSides.length < 2) return null
        return (
          <div className="flex gap-2">
            <span className="text-xs text-zinc-500 self-center">Posición:</span>
            {(["front", "back"] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => onChange({ garmentType, garmentColor, side: s })}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                  side === s
                    ? "bg-violet-600 text-white"
                    : "bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-700"
                }`}
              >
                {s === "front" ? "Frente" : "Espalda"}
              </button>
            ))}
          </div>
        )
      })()}

      {/* Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {GARMENTS.map((def) => {
          const isActive = def.garmentType === garmentType
          // For inactive cards, show first color; for active card use garmentColor
          const displayColor = isActive ? garmentColor : def.colors[0].value
          const effectiveSide = isActive ? side : "front"
          const imgSrc = def.imagePath(displayColor, effectiveSide)

          return (
            <div
              key={def.garmentType}
              role="button"
              tabIndex={0}
              aria-pressed={isActive}
              onClick={() =>
                onChange({
                  garmentType: def.garmentType,
                  garmentColor: isActive ? garmentColor : def.colors[0].value,
                  side: def.availableSides.includes(side) ? side : def.availableSides[0],
                })
              }
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault()
                  onChange({
                    garmentType: def.garmentType,
                    garmentColor: isActive ? garmentColor : def.colors[0].value,
                    side: def.availableSides.includes(side) ? side : def.availableSides[0],
                  })
                }
              }}
              onMouseEnter={() => setHoverCard(def.garmentType)}
              onMouseLeave={() => setHoverCard(null)}
              className={`relative flex flex-col rounded-xl border overflow-hidden cursor-pointer transition-all select-none ${
                isActive
                  ? "border-violet-500 ring-1 ring-violet-500/50 bg-zinc-900"
                  : "border-zinc-700 bg-zinc-900 hover:border-zinc-500"
              }`}
            >
              {/* Active badge */}
              {isActive && (
                <div className="absolute top-2 right-2 z-10 w-5 h-5 rounded-full bg-violet-600 flex items-center justify-center">
                  <Check className="w-3 h-3 text-white" strokeWidth={3} />
                </div>
              )}

              {/* Mockup image */}
              <div className="relative aspect-square bg-zinc-950 flex items-center justify-center overflow-hidden">
                <Image
                  src={imgSrc}
                  alt={`${def.label} ${displayColor}`}
                  fill
                  className="object-contain p-2"
                  sizes="(max-width: 768px) 45vw, 140px"
                  onError={(e) => {
                    // Fallback to black front if specific image not found
                    const target = e.currentTarget as HTMLImageElement
                    if (!target.src.includes("tshirt-black-classic-front")) {
                      target.src = "/garments/tshirt-black-classic-front.jpeg"
                    }
                  }}
                />
              </div>

              {/* Info */}
              <div className="p-2 space-y-1.5">
                <p className="text-xs font-semibold text-zinc-100 leading-tight">{def.label}</p>
                <p className="text-xs font-bold text-violet-400">
                  ${def.price.toLocaleString("es-AR")}
                </p>

                {/* Color dots — always visible, interactive on active card */}
                <div className="flex gap-1.5 flex-wrap">
                  {def.colors.map((c) => (
                    <ColorDot
                      key={c.value}
                      color={c}
                      selected={isActive && garmentColor === c.value}
                      onClick={() => {
                        if (isActive) {
                          onChange({ garmentType, garmentColor: c.value, side })
                        } else {
                          // Select garment + this color
                          onChange({
                            garmentType: def.garmentType,
                            garmentColor: c.value,
                            side: def.availableSides.includes(side) ? side : def.availableSides[0],
                          })
                        }
                      }}
                    />
                  ))}
                </div>

                {/* Color label when hovering or active */}
                {(isActive || hoverCard === def.garmentType) && (
                  <p className="text-[10px] text-zinc-500 truncate">
                    {isActive
                      ? def.colors.find((c) => c.value === garmentColor)?.label ?? garmentColor
                      : def.colors[0].label}
                  </p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
