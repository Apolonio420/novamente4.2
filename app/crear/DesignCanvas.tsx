"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Stage, Layer, Image as KonvaImage, Transformer, Rect, Text } from "react-konva"
import type Konva from "konva"
import { Undo2, Redo2, RotateCcw, ShoppingCart, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useCart } from "@/lib/cartStore"
import type { DesignSession } from "./page"

// --- Constants ---

const CANVAS_W = 600
const CANVAS_H = 800
const CANVAS_ASPECT = CANVAS_W / CANVAS_H // 0.75

// Print area bounding box (torso zone on 600x800 canvas)
const PRINT_AREA = { x: 100, y: 150, w: 400, h: 400 }

const MAX_HISTORY = 20
const MIN_SCALE = 0.3
const MAX_SCALE = 2.0

const SIZES = ["S", "M", "L", "XL", "XXL"] as const
type Size = (typeof SIZES)[number]

// --- Types ---

interface CanvasState {
  x: number
  y: number
  scaleX: number
  scaleY: number
  rotation: number
}

function defaultState(): CanvasState {
  return {
    x: PRINT_AREA.x + PRINT_AREA.w / 2,
    y: PRINT_AREA.y + PRINT_AREA.h / 2,
    scaleX: 1,
    scaleY: 1,
    rotation: 0,
  }
}

// --- Helpers ---

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v))
}

function useKonvaImage(url: string | null): HTMLImageElement | null {
  const [img, setImg] = useState<HTMLImageElement | null>(null)
  useEffect(() => {
    if (!url) { setImg(null); return }
    const el = new window.Image()
    el.crossOrigin = "anonymous"
    el.onload = () => setImg(el)
    el.onerror = () => setImg(null)
    el.src = url
  }, [url])
  return img
}

// --- Garment template resolver ---
// Map Spanish color keys (usados en la UI) → English filename keys (en /public/garments/)
const COLOR_MAP: Record<string, string> = {
  negro: "black",
  blanco: "white",
  stone_wash: "stone-wash",
  "stone-wash": "stone-wash",
  gris: "gray",
  crema: "cream",
  caramel: "caramel",
  caramelo: "caramel",
  marron: "marron",
  black: "black",
  white: "white",
}

function resolveGarmentTemplate(garmentType: string, color: string, side: "front" | "back"): string | null {
  // Map Spanish/internal color keys to English filename keys, then normalize
  const mappedColor = COLOR_MAP[color.toLowerCase()] ?? color
  const c = mappedColor.toLowerCase().replace(/\s+/g, "-")
  const s = side

  // Map garmentType to likely filename prefixes
  const candidates: string[] = []

  if (garmentType.includes("hoodie") || garmentType.includes("buzo")) {
    candidates.push(
      `/garments/buzo-hoodie-unisex-${c}-${s}.png`,
      `/garments/buzo-hoodie-unisex-${c}-${s}.jpeg`,
      `/garments/hoodie-${c}-${s}.jpeg`,
      `/garments/hoodie-${c}-${s}.png`,
      `/garments/buzo-cuello-redondo-${c}-${s}.png`,
    )
  } else if (garmentType.includes("crop") || garmentType.includes("musculosa")) {
    candidates.push(
      `/garments/musculosa-bali-${c}-${s}.png`,
      `/garments/remera-crop-mujer-${c}-${s}.png`,
    )
  } else {
    // Default: remera / classic fit
    candidates.push(
      `/garments/tshirt-${c}-classic-${s}.jpeg`,
      `/garments/tshirt-${c}-classic-${s}.png`,
      `/garments/remera-clasica-mujer-${c}-${s}.png`,
      `/garments/tshirt-${c}-oversize-${s}.jpeg`,
    )
  }

  // Return first candidate - we can't check file existence at runtime on the client
  // so return the first one; if it fails, fallback logic in the component handles it
  return candidates[0] ?? null
}

// --- Main Component ---

export function DesignCanvas({
  session,
  setSession,
}: {
  session: DesignSession
  setSession: React.Dispatch<React.SetStateAction<DesignSession>>
}) {
  const { addItem } = useCart()

  // Responsive canvas size
  const [stageW, setStageW] = useState(CANVAS_W)
  const stageH = Math.round(stageW / CANVAS_ASPECT)
  const scale = stageW / CANVAS_W // factor to map 600x800 coords → actual px

  useEffect(() => {
    function handleResize() {
      const available = Math.min(window.innerWidth - 32, CANVAS_W)
      setStageW(available)
    }
    handleResize()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  // History
  const [history, setHistory] = useState<CanvasState[]>([defaultState()])
  const [histIdx, setHistIdx] = useState(0)

  const state = history[histIdx]

  const pushState = useCallback(
    (next: CanvasState) => {
      setHistory((prev) => {
        const trimmed = prev.slice(0, histIdx + 1)
        const clamped = trimmed.length >= MAX_HISTORY ? trimmed.slice(1) : trimmed
        return [...clamped, next]
      })
      setHistIdx((i) => Math.min(i + 1, MAX_HISTORY - 1))
    },
    [histIdx],
  )

  const undo = () => setHistIdx((i) => Math.max(0, i - 1))
  const redo = () => setHistIdx((i) => Math.min(history.length - 1, i + 1))
  const reset = () => {
    const s = defaultState()
    setHistory([s])
    setHistIdx(0)
  }

  // Konva refs
  const stageRef = useRef<Konva.Stage>(null)
  const imgRef = useRef<Konva.Image>(null)
  const trRef = useRef<Konva.Transformer>(null)

  // Images
  const garmentUrl = useMemo(
    () => resolveGarmentTemplate(session.garmentType, session.garmentColor, session.side),
    [session.garmentType, session.garmentColor, session.side],
  )
  const garmentImg = useKonvaImage(garmentUrl)
  const designImg = useKonvaImage(session.currentDesignUrl)

  // Attach transformer when design image loads
  useEffect(() => {
    if (imgRef.current && trRef.current) {
      trRef.current.nodes([imgRef.current])
      trRef.current.getLayer()?.batchDraw()
    }
  }, [designImg])

  // Size & cart
  const [selectedSize, setSelectedSize] = useState<Size>("M")
  const [applying, setApplying] = useState(false)

  // --- Constraint helpers ---
  function constrainPosition(x: number, y: number, sX: number, sY: number, rotation: number, imgW: number, imgH: number) {
    // Clamp the center of the image within print area with some tolerance
    const cx = clamp(x, PRINT_AREA.x, PRINT_AREA.x + PRINT_AREA.w)
    const cy = clamp(y, PRINT_AREA.y, PRINT_AREA.y + PRINT_AREA.h)
    return { x: cx, y: cy }
  }

  // --- Apply & Add to Cart ---
  const handleApply = async () => {
    if (!stageRef.current) return
    setApplying(true)
    try {
      // Export canvas at 2x resolution
      const dataUrl = stageRef.current.toDataURL({ pixelRatio: 2 })

      // Convert to Blob and upload
      const res = await fetch(dataUrl)
      const blob = await res.blob()

      const formData = new FormData()
      formData.append("file", blob, `canvas-${Date.now()}.png`)
      formData.append("folder", "canvas-exports")

      // Public upload endpoint (creado en Fase 1)
      const uploadRes = await fetch("/api/public/design/upload", {
        method: "POST",
        body: formData,
      })

      let mockupUrl: string = dataUrl // fallback to data URL if upload fails

      if (uploadRes.ok) {
        const json = await uploadRes.json()
        mockupUrl = json.url ?? dataUrl
      }

      setSession((prev) => ({ ...prev, currentMockupUrl: mockupUrl }))

      const sideKey = session.side === "front" ? "frontDesign" : "backDesign"

      addItem({
        id: `custom-${Date.now()}`,
        name: "Remera Custom — Novamente",
        garmentType: session.garmentType,
        color: session.garmentColor,
        garmentColor: session.garmentColor,
        size: selectedSize,
        price: 35000,
        quantity: 1,
        image: mockupUrl,
        mockupUrl,
        [sideKey]: session.currentDesignUrl ?? undefined,
        customDesign: session.currentDesignUrl
          ? {
              image: session.currentDesignUrl,
              position: { x: state.x, y: state.y },
              scale: state.scaleX,
              side: session.side,
            }
          : undefined,
      })
    } catch (err) {
      console.error("DesignCanvas: apply failed", err)
    } finally {
      setApplying(false)
    }
  }

  // --- Render ---
  if (!session.currentDesignUrl) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-zinc-800 bg-zinc-900 p-10 text-center">
        <p className="text-zinc-400 text-sm">
          Primero generá un diseño en el modo <strong className="text-white">Chat con IA</strong>.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Header */}
      <p className="text-xs text-zinc-500 text-center">
        Arrastrá el diseño donde lo quieras. Pellizcá para escalar. Botones para rotar.
      </p>

      {/* Canvas */}
      <div className="rounded-xl overflow-hidden border border-zinc-800 shadow-xl">
        <Stage
          ref={stageRef}
          width={stageW}
          height={stageH}
          scaleX={scale}
          scaleY={scale}
        >
          {/* Layer 1: Garment background (immobile) */}
          <Layer listening={false}>
            {garmentImg ? (
              <KonvaImage
                image={garmentImg}
                x={0}
                y={0}
                width={CANVAS_W}
                height={CANVAS_H}
              />
            ) : (
              <>
                <Rect x={0} y={0} width={CANVAS_W} height={CANVAS_H} fill="#27272a" />
                <Text
                  x={0}
                  y={CANVAS_H / 2 - 20}
                  width={CANVAS_W}
                  text={`Template para "${session.garmentType} / ${session.garmentColor}" no disponible`}
                  fill="#71717a"
                  fontSize={14}
                  align="center"
                />
              </>
            )}
          </Layer>

          {/* Layer 2: Design stamp (movable) */}
          <Layer>
            {designImg && (
              <>
                <KonvaImage
                  ref={imgRef}
                  image={designImg}
                  x={state.x}
                  y={state.y}
                  width={designImg.naturalWidth || 200}
                  height={designImg.naturalHeight || 200}
                  offsetX={(designImg.naturalWidth || 200) / 2}
                  offsetY={(designImg.naturalHeight || 200) / 2}
                  scaleX={state.scaleX}
                  scaleY={state.scaleY}
                  rotation={state.rotation}
                  draggable
                  dragBoundFunc={(pos) => {
                    // pos is in stage coords (already scaled), convert to logical
                    const lx = pos.x / scale
                    const ly = pos.y / scale
                    const clamped = constrainPosition(lx, ly, state.scaleX, state.scaleY, state.rotation, designImg.naturalWidth || 200, designImg.naturalHeight || 200)
                    return { x: clamped.x * scale, y: clamped.y * scale }
                  }}
                  onDragEnd={(e) => {
                    const node = e.target
                    const lx = node.x()
                    const ly = node.y()
                    pushState({ ...state, x: lx, y: ly })
                  }}
                  onTransformEnd={(e) => {
                    const node = e.target
                    const newScaleX = clamp(node.scaleX(), MIN_SCALE, MAX_SCALE)
                    const newScaleY = clamp(node.scaleY(), MIN_SCALE, MAX_SCALE)
                    node.scaleX(newScaleX)
                    node.scaleY(newScaleY)
                    pushState({
                      x: node.x(),
                      y: node.y(),
                      scaleX: newScaleX,
                      scaleY: newScaleY,
                      rotation: node.rotation(),
                    })
                  }}
                />
                <Transformer
                  ref={trRef}
                  keepRatio
                  rotateEnabled
                  boundBoxFunc={(oldBox, newBox) => {
                    // Prevent scaling too small
                    if (Math.abs(newBox.width) < 20 || Math.abs(newBox.height) < 20) {
                      return oldBox
                    }
                    return newBox
                  }}
                />
              </>
            )}
          </Layer>
        </Stage>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-center gap-2 w-full max-w-lg">
        <Button
          variant="outline"
          size="sm"
          onClick={undo}
          disabled={histIdx === 0}
          className="border-zinc-700"
          title="Deshacer"
        >
          <Undo2 className="h-4 w-4" />
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={redo}
          disabled={histIdx === history.length - 1}
          className="border-zinc-700"
          title="Rehacer"
        >
          <Redo2 className="h-4 w-4" />
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={reset}
          className="border-zinc-700"
          title="Resetear posición"
        >
          <RefreshCw className="h-4 w-4" />
        </Button>

        {/* Rotate buttons */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => pushState({ ...state, rotation: state.rotation - 15 })}
          className="border-zinc-700"
          title="Rotar -15°"
        >
          <RotateCcw className="h-4 w-4" />
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => pushState({ ...state, rotation: state.rotation + 15 })}
          className="border-zinc-700 scale-x-[-1]"
          title="Rotar +15°"
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
      </div>

      {/* Size selector + Apply */}
      <div className="flex flex-wrap items-center gap-3 justify-center w-full max-w-lg">
        <div className="flex items-center gap-1">
          {SIZES.map((s) => (
            <button
              key={s}
              onClick={() => setSelectedSize(s)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium border transition ${
                selectedSize === s
                  ? "bg-white text-zinc-950 border-white"
                  : "border-zinc-700 text-zinc-300 hover:border-zinc-500"
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        <Button
          onClick={handleApply}
          disabled={applying}
          className="bg-white text-zinc-950 hover:bg-zinc-100 flex items-center gap-2"
        >
          <ShoppingCart className="h-4 w-4" />
          {applying ? "Aplicando..." : "Aplicar y agregar al carrito"}
        </Button>
      </div>
    </div>
  )
}
