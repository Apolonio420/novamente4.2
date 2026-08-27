"use client"

import { useEffect, useState } from "react"
import { Check } from "lucide-react"
import { resolveGarmentTemplate, printAreaPct, hasBackTemplate } from "./garment-templates"

/**
 * Qué fracción del área imprimible ocupa cada tamaño. Son las mismas
 * proporciones que usa el motor de mockups (lib/mockup/perfect-stamp.ts), para
 * que este preview no prometa algo distinto de lo que después se genera.
 */
const RECT_POR_TAMANO: Record<"R1" | "R2" | "R3", { w: number; h: number; y: number }> = {
  R1: { w: 0.38, h: 0.30, y: 0.04 },
  R2: { w: 0.70, h: 0.70, y: 0.15 },
  R3: { w: 1, h: 1, y: 0 },
}

/** <img> que cae a la siguiente URL candidata si una falla (jpeg → png, etc). */
function FallbackImg({
  candidates,
  alt,
  className,
}: {
  candidates: string[]
  alt: string
  className?: string
}) {
  const [i, setI] = useState(0)
  useEffect(() => setI(0), [candidates.join("|")])
  const src = candidates[Math.min(i, candidates.length - 1)] ?? ""
  return (
    <img
      src={src}
      alt={alt}
      draggable={false}
      className={className}
      onError={() => setI((p) => (p < candidates.length - 1 ? p + 1 : p))}
    />
  )
}

/** Una prenda (frente o espalda) posicionada dentro del recuadro compartido. */
function GarmentPanel({
  garmentType,
  garmentColor,
  side,
  label,
  design,
  active,
  anchor,
  rotation,
  printArea,
  placement,
  onSelect,
}: {
  garmentType: string
  garmentColor: string
  side: "front" | "back"
  label: string
  design: string | null
  active: boolean
  anchor: "left" | "right"
  rotation: number
  printArea?: "R1" | "R2" | "R3"
  placement?: "left-chest" | "center" | "right-chest"
  onSelect: () => void
}) {
  const templates = resolveGarmentTemplate(garmentType, garmentColor, side)
  const pa = printAreaPct(garmentType, side)

  // La estampa se dibujaba SIEMPRE ocupando toda el área imprimible: elegías
  // "chico" y en este preview seguía viéndose grande, contradiciendo lo que
  // después salía en la foto real.
  const rect = RECT_POR_TAMANO[printArea ?? "R3"]
  const fx =
    printArea === "R1" && placement === "center"
      ? (1 - rect.w) / 2
      : printArea === "R1" && placement === "right-chest"
        ? 0.04
        : printArea === "R1"
          ? 0.58            // sobre el corazón = derecha de quien mira
          : (1 - rect.w) / 2
  const designStyle = {
    left: `${(pa.left + fx * pa.width) * 100}%`,
    top: `${(pa.top + rect.y * pa.height) * 100}%`,
    width: `${rect.w * pa.width * 100}%`,
    height: `${rect.h * pa.height * 100}%`,
  }

  // Ambas prendas comparten el recuadro: se solapan ~14% (las estampas quedan
  // fuera de esa zona). La activa va al frente (z mayor) y con anillo violeta.
  const panelStyle: React.CSSProperties = {
    transform: `translateY(-50%) rotate(${rotation}deg)`,
    zIndex: active ? 20 : 10,
  }
  if (anchor === "left") panelStyle.left = "0%"
  else panelStyle.right = "0%"

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={active}
      aria-label={`Diseñar ${label.toLowerCase()}`}
      className="absolute top-1/2 aspect-square w-[57%] transition-transform duration-300 hover:-translate-y-[calc(50%+2px)] focus-visible:outline-none"
      style={panelStyle}
    >
      <div
        className={`relative h-full w-full overflow-hidden rounded-2xl ring-1 transition ${
          active
            ? "ring-2 ring-violet-500 shadow-2xl shadow-violet-900/50"
            : "ring-black/10 shadow-xl shadow-black/40"
        }`}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-100 to-zinc-200" />
        <FallbackImg
          candidates={templates}
          alt={`${label} de la prenda`}
          className="absolute inset-0 h-full w-full object-contain"
        />

        {design ? (
          <img
            src={design}
            alt={`Diseño ${label.toLowerCase()}`}
            draggable={false}
            className="absolute object-contain drop-shadow-[0_2px_8px_rgba(0,0,0,0.2)]"
            style={designStyle}
          />
        ) : (
          <div
            className="absolute flex flex-col items-center justify-center gap-0.5 rounded-lg border-2 border-dashed border-violet-400/60 bg-violet-500/[0.08] text-center"
            style={designStyle}
          >
            <span className="text-lg font-light leading-none text-violet-500/80">+</span>
            <span className="px-1 text-[10px] font-medium leading-tight text-violet-700/80">
              Diseñá la {label.toLowerCase()}
            </span>
          </div>
        )}

        {/* Etiqueta del lado */}
        <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-zinc-950/75 px-2 py-0.5 text-[11px] font-semibold text-white backdrop-blur-sm">
          {label}
          {design ? <Check className="h-3 w-3 text-emerald-400" /> : null}
        </span>
      </div>
    </button>
  )
}

/**
 * Doble estampado: muestra el frente y la espalda de la prenda levemente
 * interpuestos en un único recuadro, con cada estampa perfectamente visible.
 * Devuelve null si la prenda no soporta espalda.
 */
export function DoubleSidePreview({
  garmentType,
  garmentColor,
  frontDesign,
  backDesign,
  activeSide,
  onSelectSide,
  className,
  printAreaPorLado,
  placementPorLado,
}: {
  garmentType: string
  garmentColor: string
  frontDesign: string | null
  backDesign: string | null
  activeSide: "front" | "back"
  onSelectSide: (side: "front" | "back") => void
  className?: string
  /** Tamaño y posición de CADA lado: cada uno tiene los suyos. */
  printAreaPorLado?: Record<"front" | "back", "R1" | "R2" | "R3">
  placementPorLado?: Record<"front" | "back", "left-chest" | "center" | "right-chest">
}) {
  if (!hasBackTemplate(garmentType)) return null

  const bothReady = !!frontDesign && !!backDesign

  return (
    <div
      className={`rounded-2xl border border-white/10 bg-gradient-to-b from-zinc-900/80 to-zinc-900/40 p-3 sm:p-4 ${className ?? ""}`}
    >
      <div className="mb-0.5 flex items-center justify-between gap-2">
        <h3 className="flex items-center gap-1.5 text-sm font-semibold text-white">
          <span className="inline-block h-2 w-2 rounded-full bg-violet-500" />
          Doble estampado
        </h3>
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
            bothReady ? "bg-emerald-500/15 text-emerald-300" : "bg-amber-500/15 text-amber-300"
          }`}
        >
          {bothReady ? "Ambos lados listos" : "Falta un lado"}
        </span>
      </div>
      <p className="mb-2 text-[11px] text-zinc-400">Frente y espalda de tu prenda en una sola imagen</p>

      {/* Recuadro único con ambas prendas interpuestas */}
      <div className="relative mx-auto aspect-[3/2] w-full max-w-md">
        <GarmentPanel
          garmentType={garmentType}
          garmentColor={garmentColor}
          side="back"
          label="Espalda"
          design={backDesign}
          active={activeSide === "back"}
          anchor="left"
          rotation={-4}
          printArea={printAreaPorLado?.back}
          placement={placementPorLado?.back}
          onSelect={() => onSelectSide("back")}
        />
        <GarmentPanel
          garmentType={garmentType}
          garmentColor={garmentColor}
          side="front"
          label="Frente"
          design={frontDesign}
          active={activeSide === "front"}
          anchor="right"
          rotation={4}
          printArea={printAreaPorLado?.front}
          placement={placementPorLado?.front}
          onSelect={() => onSelectSide("front")}
        />
      </div>

      <p className="mt-1 text-center text-[11px] text-zinc-500">Tocá un lado para diseñarlo</p>
    </div>
  )
}
