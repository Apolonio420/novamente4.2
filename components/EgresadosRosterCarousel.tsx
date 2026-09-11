"use client"

import { useState, useRef } from "react"
import Image from "next/image"
import { ChevronLeft, ChevronRight, Sparkles, Shirt, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface CharacterOutfit {
  id: string
  name: string
  role: string
  garmentName: string
  garmentType: string
  colorName: string
  colorHex: string
  printDescription: string
  badgeText: string
  imageSrc: string
}

const ROSTER: CharacterOutfit[] = [
  {
    id: "mateo-hoodie-negro",
    name: "Mateo",
    role: "Promo '26",
    garmentName: "Hoodie Boston",
    garmentType: "Con capucha y bolsillo canguro",
    colorName: "Negro",
    colorHex: "#18181b",
    printDescription: "Escudo Varsity C.S.M.F. Buenos Aires",
    badgeText: "El más elegido",
    imageSrc: "/marketing/lifestyle/egresados/personaje-1-hoodie-negro.webp",
  },
  {
    id: "sofia-buzo-crema",
    name: "Sofía",
    role: "Capitana Promo",
    garmentName: "Buzo Berlin",
    garmentType: "Cuello redondo (crewneck)",
    colorName: "Crema",
    colorHex: "#f5f5f0",
    printDescription: "Arco colegial Instituto San Javier",
    badgeText: "Clásico retro",
    imageSrc: "/marketing/lifestyle/egresados/personaje-2-buzo-crema.webp",
  },
  {
    id: "lucas-hoodie-caramel",
    name: "Lucas",
    role: "Promo '26",
    garmentName: "Hoodie Boston",
    garmentType: "Con capucha y bolsillo canguro",
    colorName: "Caramel",
    colorHex: "#9a6538",
    printDescription: "Escudo con águila Buenos Aires High School",
    badgeText: "Tendencia",
    imageSrc: "/marketing/lifestyle/egresados/personaje-3-hoodie-caramel.webp",
  },
  {
    id: "valen-hoodie-gris",
    name: "Valen",
    role: "Bariloche Crew",
    garmentName: "Hoodie Boston",
    garmentType: "Con capucha y bolsillo canguro",
    colorName: "Gris Melange",
    colorHex: "#9ca3af",
    printDescription: "Tipografía varsity Colegio Nacional CN",
    badgeText: "Favorito del curso",
    imageSrc: "/marketing/lifestyle/egresados/personaje-4-hoodie-gris.webp",
  },
  {
    id: "nico-buzo-stonewash",
    name: "Nico",
    role: "Promo '26",
    garmentName: "Buzo Berlin",
    garmentType: "Cuello redondo (crewneck)",
    colorName: "Stone Wash",
    colorHex: "#52525b",
    printDescription: "Escudo deportivo Promo Egresados Argentina",
    badgeText: "Vintage Wash",
    imageSrc: "/marketing/lifestyle/egresados/personaje-5-buzo-stonewash.webp",
  },
]

export function EgresadosRosterCarousel() {
  const [selectedIndex, setSelectedIndex] = useState<number>(0)
  const scrollRef = useRef<HTMLDivElement>(null)

  const active = ROSTER[selectedIndex]

  const handleScroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return
    const cardWidth = 300
    const scrollAmount = direction === "left" ? -cardWidth : cardWidth
    scrollRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" })
  }

  const selectCharacter = (index: number) => {
    setSelectedIndex(index)
    if (!scrollRef.current) return
    const cards = scrollRef.current.children
    if (cards[index]) {
      ;(cards[index] as HTMLElement).scrollIntoView({
        behavior: "smooth",
        inline: "center",
        block: "nearest",
      })
    }
  }

  return (
    <div className="w-full">
      {/* Header del Roster con estética arcade elegante */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-xs font-semibold uppercase tracking-widest text-cyan-300 mb-2">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            Roster de Alumnos & Outfits
          </div>
          <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Elegí el estilo de tu promo
          </h3>
          <p className="text-sm text-zinc-400">
            Diferentes alumnos, diferentes cortes (Hoodies con capucha o Buzos cuello redondo) y colores reales.
          </p>
        </div>

        {/* Controles de navegación */}
        <div className="flex items-center gap-2 self-end sm:self-center">
          <Button
            variant="outline"
            size="icon"
            onClick={() => handleScroll("left")}
            className="h-9 w-9 rounded-full border-zinc-800 bg-zinc-900/80 hover:bg-zinc-800 hover:text-white"
            aria-label="Anterior personaje"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => handleScroll("right")}
            className="h-9 w-9 rounded-full border-zinc-800 bg-zinc-900/80 hover:bg-zinc-800 hover:text-white"
            aria-label="Siguiente personaje"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Selector de Chips interactivo estilo Character Select */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none mb-6">
        {ROSTER.map((char, index) => {
          const isSelected = selectedIndex === index
          return (
            <button
              key={char.id}
              onClick={() => selectCharacter(index)}
              className={`flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all duration-200 border ${
                isSelected
                  ? "bg-cyan-500/20 border-cyan-500/60 text-white shadow-lg shadow-cyan-950/40 ring-1 ring-cyan-400/40"
                  : "bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:bg-zinc-800/80 hover:text-zinc-200"
              }`}
            >
              <span
                className="w-2.5 h-2.5 rounded-full ring-1 ring-white/20"
                style={{ backgroundColor: char.colorHex }}
              />
              <span>{char.name}</span>
              <span className="opacity-50">·</span>
              <span className="text-[11px] text-zinc-400">{char.garmentName}</span>
            </button>
          )
        })}
      </div>

      {/* Carrusel Horizontal estilo personajes */}
      <div
        ref={scrollRef}
        className="flex gap-4 sm:gap-6 overflow-x-auto scrollbar-none pb-4 pt-1 snap-x snap-mandatory scroll-smooth"
        style={{ scrollbarWidth: "none" }}
      >
        {ROSTER.map((char, index) => {
          const isSelected = selectedIndex === index
          return (
            <div
              key={char.id}
              onClick={() => setSelectedIndex(index)}
              className={`relative flex-shrink-0 w-[260px] sm:w-[285px] cursor-pointer snap-center group rounded-3xl overflow-hidden transition-all duration-300 border ${
                isSelected
                  ? "border-cyan-500/60 bg-zinc-900 ring-2 ring-cyan-400/30 shadow-2xl shadow-cyan-950/60 scale-[1.02]"
                  : "border-zinc-800 bg-zinc-950/70 hover:border-zinc-700 hover:bg-zinc-900/80"
              }`}
            >
              {/* Badge superior */}
              <div className="absolute top-3.5 left-3.5 right-3.5 z-10 flex items-center justify-between">
                <Badge className="bg-black/70 backdrop-blur-md border border-white/10 text-cyan-300 text-[11px] px-2.5 py-0.5">
                  {char.role}
                </Badge>
                <span className="inline-flex items-center text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  {char.badgeText}
                </span>
              </div>

              {/* Imagen del Alumno / Personaje (896x1200 en aspecto 3:4) */}
              <div className="relative aspect-[3/4] w-full overflow-hidden bg-zinc-900">
                <Image
                  src={char.imageSrc}
                  alt={`${char.name} con ${char.garmentName} ${char.colorName}`}
                  fill
                  sizes="(max-width: 768px) 260px, 285px"
                  priority={index < 2}
                  className="object-cover object-top transition-transform duration-500 group-hover:scale-105"
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
              </div>

              {/* Info inferior de la tarjeta */}
              <div className="p-4 bg-zinc-950/90 border-t border-zinc-800/80">
                <div className="flex items-center justify-between mb-1.5">
                  <h4 className="text-base font-bold text-white tracking-tight">
                    {char.name}
                  </h4>
                  <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                    <span
                      className="w-2.5 h-2.5 rounded-full border border-white/30"
                      style={{ backgroundColor: char.colorHex }}
                    />
                    <span className="font-medium text-zinc-300">{char.colorName}</span>
                  </div>
                </div>

                <div className="space-y-1 text-xs">
                  <p className="text-cyan-400 font-medium flex items-center gap-1.5">
                    <Shirt className="w-3.5 h-3.5 shrink-0" />
                    {char.garmentName}
                  </p>
                  <p className="text-zinc-400 text-[11px] truncate">
                    {char.printDescription}
                  </p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Ficha Activa de Personaje / Detalle del Outfit */}
      <div className="mt-6 rounded-2xl border border-cyan-500/30 bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 p-5 sm:p-6 shadow-xl shadow-cyan-950/20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-cyan-400">
                Outfit Seleccionado:
              </span>
              <Badge variant="outline" className="text-xs border-cyan-500/40 text-cyan-300">
                {active.name} · {active.role}
              </Badge>
            </div>
            <h4 className="text-lg font-bold text-white">
              {active.garmentName} en color {active.colorName}
            </h4>
            <p className="text-sm text-zinc-400">
              <span className="text-zinc-300">Estampa colegial:</span> {active.printDescription} (adaptable con el logo, escudo y tipografía de tu colegio).
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Button
              asChild
              className="bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white shadow-lg shadow-cyan-950/40"
            >
              <a
                href={`https://wa.me/5492235169720?text=${encodeURIComponent(
                  `Hola Novamente! Vimos en la web el outfit de ${active.name} (${active.garmentName} color ${active.colorName}) y queremos cotizar algo así para nuestro curso 🎓`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Cotizar este modelo
                <ArrowRight className="ml-1.5 w-4 h-4" />
              </a>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
