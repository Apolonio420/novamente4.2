"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Stage, Layer, Image as KonvaImage, Transformer, Rect, Text } from "react-konva"
import type Konva from "konva"
import {
  Undo2,
  Redo2,
  RotateCcw,
  ShoppingCart,
  RefreshCw,
  Shirt,
  Loader2,
  Type,
  Trash2,
  Copy,
  Eye,
  EyeOff,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold,
  Italic,
  Image as ImageIcon,
  Layers,
  ChevronUp,
  ChevronDown,
  Lock,
  Unlock,
  AlertTriangle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useCart } from "@/lib/cartStore"
import { useToast } from "@/hooks/use-toast"
import type { DesignSession } from "./page"
import { getCatalogProduct, CATALOG_PRODUCTS } from "@/lib/catalog/products"
import * as fpixel from "@/lib/fpixel"

// --- Constants ---

// Canvas CUADRADO: todos los templates de prenda son 1:1 (600x600/4000x4000).
// Antes era 600x800 y la prenda se estiraba 33% en vertical.
const CANVAS_W = 600
const CANVAS_H = 600
const CANVAS_ASPECT = CANVAS_W / CANVAS_H // 1

type PrintBox = { x: number; y: number; w: number; h: number }

// Áreas de impresión REALES por prenda+lado (calibradas visualmente contra
// cada template 600x600 — ver scripts/_print-areas-proof.mjs). El hoodie
// frente termina JUSTO arriba del bolsillo y no toca mangas/capucha.
const PRINT_AREAS: Record<string, { front: PrintBox; back?: PrintBox }> = {
  tshirt:    { front: { x: 185, y: 170, w: 230, h: 270 }, back: { x: 180, y: 150, w: 240, h: 290 } },
  // hoodie front: del borde de la capucha al bolsillo justo, hombro a hombro
  // sin mangas (medidas del dibujo del usuario 2026-06-12)
  hoodie:    { front: { x: 160, y: 140, w: 280, h: 215 }, back: { x: 165, y: 245, w: 270, h: 215 } },
  crew:      { front: { x: 195, y: 195, w: 210, h: 240 } },
  clasica:   { front: { x: 195, y: 195, w: 210, h: 230 } },
  crop:      { front: { x: 195, y: 185, w: 210, h: 200 } },
  musculosa: { front: { x: 220, y: 230, w: 160, h: 210 } },
}

function garmentKind(garmentType: string): keyof typeof PRINT_AREAS {
  const g = garmentType.toLowerCase()
  if (g.includes("hoodie")) return "hoodie"
  if (g.includes("cuello-redondo") || g.includes("crew")) return "crew"
  if (g.includes("crop")) return "crop"
  if (g.includes("musculosa") || g.includes("bali")) return "musculosa"
  if (g.includes("clasica-mujer")) return "clasica"
  return "tshirt"
}

/** Área de impresión para la prenda+lado actual (fallback al frente). */
function getPrintArea(garmentType: string, side: "front" | "back"): PrintBox {
  const areas = PRINT_AREAS[garmentKind(garmentType)]
  return (side === "back" ? areas.back : areas.front) ?? areas.front
}

/** Prendas que tienen template de espalda disponible. */
function hasBackTemplate(garmentType: string): boolean {
  return PRINT_AREAS[garmentKind(garmentType)].back != null
}

// --- Confinamiento al área de impresión ---
// El diseño NO puede salirse del recuadro: lo que está afuera no se imprime.

/** Bounding box del nodo en coords del canvas (el Stage escala, los hijos no). */
function nodeRect(node: Konva.Node) {
  const stage = node.getStage()
  return node.getClientRect({ relativeTo: (stage ?? undefined) as never })
}

/** ¿El bounding box entra completo en el área? (tolerancia sub-píxel) */
function rectInsideArea(r: { x: number; y: number; width: number; height: number }, area: PrintBox): boolean {
  const t = 0.5
  return (
    r.x >= area.x - t &&
    r.y >= area.y - t &&
    r.x + r.width <= area.x + area.w + t &&
    r.y + r.height <= area.y + area.h + t
  )
}

/** Corrige la POSICIÓN del nodo para que su bounding box quede dentro del área. */
function clampNodeToArea(node: Konva.Node, area: PrintBox) {
  const r = nodeRect(node)
  let dx = 0
  let dy = 0
  if (r.width <= area.w) {
    if (r.x < area.x) dx = area.x - r.x
    else if (r.x + r.width > area.x + area.w) dx = area.x + area.w - (r.x + r.width)
  } else {
    dx = area.x + area.w / 2 - (r.x + r.width / 2)
  }
  if (r.height <= area.h) {
    if (r.y < area.y) dy = area.y - r.y
    else if (r.y + r.height > area.y + area.h) dy = area.y + area.h - (r.y + r.height)
  } else {
    dy = area.y + area.h / 2 - (r.y + r.height / 2)
  }
  if (dx !== 0 || dy !== 0) node.position({ x: node.x() + dx, y: node.y() + dy })
}

type NodeAttrsSnapshot = { x: number; y: number; scaleX: number; scaleY: number; rotation: number }
const snapshotAttrs = (node: Konva.Node): NodeAttrsSnapshot => ({
  x: node.x(), y: node.y(), scaleX: node.scaleX(), scaleY: node.scaleY(), rotation: node.rotation(),
})

const MAX_HISTORY = 30
const MIN_SCALE = 0.05 // ahora se puede achicar mucho
const MAX_SCALE = 4.0  // y agrandar mas

const SIZES = ["S", "M", "L", "XL", "XXL"] as const
type Size = (typeof SIZES)[number]

// Fuentes curadas — Google Fonts populares para apparel
const FONT_OPTIONS = [
  { key: "Inter", label: "Inter (default)", weight: "400" },
  { key: "Bebas Neue", label: "Bebas Neue", weight: "400" },
  { key: "Anton", label: "Anton (bold)", weight: "400" },
  { key: "Playfair Display", label: "Playfair", weight: "700" },
  { key: "Permanent Marker", label: "Marker", weight: "400" },
  { key: "Press Start 2P", label: "Pixel 8-bit", weight: "400" },
  { key: "Caveat", label: "Caveat (script)", weight: "700" },
  { key: "Bungee", label: "Bungee", weight: "400" },
  { key: "Archivo Black", label: "Archivo Black", weight: "900" },
  { key: "Major Mono Display", label: "Mono", weight: "400" },
  { key: "Rubik Mono One", label: "Rubik Mono", weight: "400" },
  { key: "Special Elite", label: "Typewriter", weight: "400" },
] as const

const TEXT_COLORS = [
  "#ffffff", "#000000", "#ef4444", "#f97316", "#eab308",
  "#22c55e", "#06b6d4", "#3b82f6", "#a855f7", "#ec4899",
  "#fbbf24", "#dc2626", "#1e293b", "#94a3b8",
]

// --- Types ---

type LayerKind = "image" | "text"

interface CanvasLayer {
  id: string
  kind: LayerKind
  x: number
  y: number
  scaleX: number
  scaleY: number
  rotation: number
  opacity: number
  locked?: boolean
  // image-specific
  imageUrl?: string
  // text-specific
  text?: string
  fontFamily?: string
  fontSize?: number
  fill?: string
  fontStyle?: string // "normal" | "bold" | "italic" | "bold italic"
  align?: "left" | "center" | "right"
}

interface CanvasSnapshot {
  layers: CanvasLayer[]
  activeId: string | null
}

function emptySnapshot(): CanvasSnapshot {
  return { layers: [], activeId: null }
}

// --- Helpers ---

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v))
}

function uid() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

/** dataURL → Blob sin fetch() — el CSP del sitio bloquea connect-src data:. */
function dataUrlToBlob(dataUrl: string): Blob {
  const [head, b64] = dataUrl.split(",")
  const mime = /data:([^;]+)/.exec(head)?.[1] ?? "image/png"
  const bin = atob(b64)
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  return new Blob([bytes], { type: mime })
}

/** Prueba una lista de URLs en orden y devuelve la primera imagen que carga. */
function useKonvaImageFallback(urls: string[]): HTMLImageElement | null {
  const [img, setImg] = useState<HTMLImageElement | null>(null)
  useEffect(() => {
    let cancelled = false
    setImg(null)
    const tryAt = (i: number) => {
      if (cancelled || i >= urls.length) return
      const el = new window.Image()
      el.crossOrigin = "anonymous"
      el.onload = () => { if (!cancelled) setImg(el) }
      el.onerror = () => tryAt(i + 1)
      el.src = urls[i]
    }
    tryAt(0)
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urls.join("|")])
  return img
}

function useKonvaImage(url: string | null | undefined): HTMLImageElement | null {
  const [img, setImg] = useState<HTMLImageElement | null>(null)
  useEffect(() => {
    if (!url) { setImg(null); return }
    const el = new window.Image()
    el.crossOrigin = "anonymous"
    el.onload = () => setImg(el)
    el.onerror = () => setImg(null)
    el.src = url
    return () => { el.onload = null; el.onerror = null }
  }, [url])
  return img
}

// --- Garment template resolver ---
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

function resolveGarmentTemplate(garmentType: string, color: string, side: "front" | "back"): string[] {
  const mappedColor = COLOR_MAP[color.toLowerCase()] ?? color
  const c = mappedColor.toLowerCase().replace(/\s+/g, "-")
  const s = side

  const candidates: string[] = []
  switch (garmentType) {
    case "aldea-classic-tshirt":
      candidates.push(`/garments/tshirt-${c}-classic-${s}.jpeg`, `/garments/tshirt-${c}-classic-${s}.png`)
      break
    case "aura-oversize-tshirt":
      candidates.push(`/garments/tshirt-${c}-oversize-${s}.jpeg`, `/garments/tshirt-${c}-oversize-${s}.png`)
      break
    case "remera-clasica-mujer":
      candidates.push(`/garments/remera-clasica-mujer-${c}-${s}.png`)
      break
    case "remera-crop-mujer":
      candidates.push(`/garments/remera-crop-mujer-${c}-${s}.png`)
      break
    case "musculosa-bali":
      candidates.push(`/garments/musculosa-bali-${c}-${s}.png`)
      break
    case "buzo-cuello-redondo":
      candidates.push(`/garments/buzo-cuello-redondo-${c}-${s}.png`)
      break
    case "buzo-hoodie-unisex":
      candidates.push(`/garments/buzo-hoodie-unisex-${c}-${s}.png`, `/garments/buzo-hoodie-unisex-${c}-${s}.jpeg`)
      break
    default:
      if (garmentType.includes("hoodie")) candidates.push(`/garments/buzo-hoodie-unisex-${c}-${s}.png`)
      else if (garmentType.includes("buzo")) candidates.push(`/garments/buzo-cuello-redondo-${c}-${s}.png`)
      else if (garmentType.includes("crop")) candidates.push(`/garments/remera-crop-mujer-${c}-${s}.png`)
      else if (garmentType.includes("musculosa")) candidates.push(`/garments/musculosa-bali-${c}-${s}.png`)
      else candidates.push(`/garments/tshirt-${c}-classic-${s}.jpeg`)
  }
  return candidates
}

// --- Google Fonts loader ---
// Inyecta <link> al <head> una sola vez con todas las fuentes que usamos.
function useGoogleFonts() {
  useEffect(() => {
    if (typeof document === "undefined") return
    if (document.getElementById("nm-canvas-fonts")) return
    const families = FONT_OPTIONS.filter(f => f.key !== "Inter")
      .map(f => `family=${encodeURIComponent(f.key)}:wght@${f.weight}`)
      .join("&")
    const link = document.createElement("link")
    link.id = "nm-canvas-fonts"
    link.rel = "stylesheet"
    link.href = `https://fonts.googleapis.com/css2?${families}&display=swap`
    document.head.appendChild(link)
  }, [])
}

// --- KonvaImageLayer ---
// Componente helper que carga la imagen del layer (cada layer image puede tener su propia url)
function ImageLayerNode({
  layer,
  onSelect,
  onChange,
  onChangeCommit,
  registerRef,
  selected,
  printArea,
}: {
  layer: CanvasLayer
  onSelect: () => void
  onChange: (patch: Partial<CanvasLayer>) => void
  onChangeCommit: (patch: Partial<CanvasLayer>) => void
  registerRef: (node: Konva.Node | null) => void
  selected: boolean
  printArea: PrintBox
}) {
  const img = useKonvaImage(layer.imageUrl ?? null)
  const ref = useRef<Konva.Image>(null)
  const lastGood = useRef<NodeAttrsSnapshot | null>(null)

  useEffect(() => {
    registerRef(ref.current)
    return () => registerRef(null)
  }, [img, registerRef])

  if (!img) return null

  const w = img.naturalWidth || 200
  const h = img.naturalHeight || 200

  return (
    <KonvaImage
      ref={ref}
      image={img}
      x={layer.x}
      y={layer.y}
      width={w}
      height={h}
      offsetX={w / 2}
      offsetY={h / 2}
      scaleX={layer.scaleX}
      scaleY={layer.scaleY}
      rotation={layer.rotation}
      opacity={layer.opacity}
      draggable={!layer.locked}
      listening
      onClick={onSelect}
      onTap={onSelect}
      onMouseDown={onSelect}
      onTouchStart={onSelect}
      onDragMove={(e) => {
        // confinado al área de impresión — lo de afuera no se imprime
        clampNodeToArea(e.target, printArea)
        onChange({ x: e.target.x(), y: e.target.y() })
      }}
      onDragEnd={(e) => {
        clampNodeToArea(e.target, printArea)
        onChangeCommit({ x: e.target.x(), y: e.target.y() })
      }}
      onTransformStart={(e) => {
        lastGood.current = snapshotAttrs(e.target)
      }}
      onTransform={(e) => {
        // si el resize/rotate saca el bbox del área → revertir al último válido
        const node = e.target
        if (rectInsideArea(nodeRect(node), printArea)) {
          lastGood.current = snapshotAttrs(node)
        } else if (lastGood.current) {
          node.setAttrs(lastGood.current)
        }
      }}
      onTransformEnd={(e) => {
        const node = e.target
        const sx = clamp(node.scaleX(), MIN_SCALE, MAX_SCALE)
        const sy = clamp(node.scaleY(), MIN_SCALE, MAX_SCALE)
        node.scaleX(sx)
        node.scaleY(sy)
        if (!rectInsideArea(nodeRect(node), printArea)) {
          if (lastGood.current) node.setAttrs(lastGood.current)
          clampNodeToArea(node, printArea)
        }
        onChangeCommit({
          x: node.x(),
          y: node.y(),
          scaleX: node.scaleX(),
          scaleY: node.scaleY(),
          rotation: node.rotation(),
        })
      }}
    />
  )
}

function TextLayerNode({
  layer,
  onSelect,
  onChange,
  onChangeCommit,
  registerRef,
  printArea,
}: {
  layer: CanvasLayer
  onSelect: () => void
  onChange: (patch: Partial<CanvasLayer>) => void
  onChangeCommit: (patch: Partial<CanvasLayer>) => void
  registerRef: (node: Konva.Node | null) => void
  printArea: PrintBox
}) {
  const ref = useRef<Konva.Text>(null)
  const lastGood = useRef<NodeAttrsSnapshot | null>(null)

  useEffect(() => {
    registerRef(ref.current)
    return () => registerRef(null)
  }, [registerRef])

  // Recalcular offset cuando cambia el texto/fuente para que el rotate/scale sea desde el centro
  useEffect(() => {
    const node = ref.current
    if (!node) return
    const w = node.width()
    const h = node.height()
    node.offsetX(w / 2)
    node.offsetY(h / 2)
    node.getLayer()?.batchDraw()
  }, [layer.text, layer.fontFamily, layer.fontSize, layer.fontStyle, layer.align])

  return (
    <Text
      ref={ref}
      x={layer.x}
      y={layer.y}
      text={layer.text || ""}
      fontFamily={layer.fontFamily || "Inter"}
      fontSize={layer.fontSize || 48}
      fontStyle={layer.fontStyle || "normal"}
      align={layer.align || "center"}
      fill={layer.fill || "#ffffff"}
      scaleX={layer.scaleX}
      scaleY={layer.scaleY}
      rotation={layer.rotation}
      opacity={layer.opacity}
      draggable={!layer.locked}
      listening
      onClick={onSelect}
      onTap={onSelect}
      onMouseDown={onSelect}
      onTouchStart={onSelect}
      onDragMove={(e) => {
        // confinado al área de impresión — lo de afuera no se imprime
        clampNodeToArea(e.target, printArea)
        onChange({ x: e.target.x(), y: e.target.y() })
      }}
      onDragEnd={(e) => {
        clampNodeToArea(e.target, printArea)
        onChangeCommit({ x: e.target.x(), y: e.target.y() })
      }}
      onTransformStart={(e) => {
        lastGood.current = snapshotAttrs(e.target)
      }}
      onTransform={(e) => {
        // si el resize/rotate saca el bbox del área → revertir al último válido
        const node = e.target
        if (rectInsideArea(nodeRect(node), printArea)) {
          lastGood.current = snapshotAttrs(node)
        } else if (lastGood.current) {
          node.setAttrs(lastGood.current)
        }
      }}
      onTransformEnd={(e) => {
        const node = e.target
        const sx = clamp(node.scaleX(), MIN_SCALE, MAX_SCALE)
        const sy = clamp(node.scaleY(), MIN_SCALE, MAX_SCALE)
        node.scaleX(sx)
        node.scaleY(sy)
        if (!rectInsideArea(nodeRect(node), printArea)) {
          if (lastGood.current) node.setAttrs(lastGood.current)
          clampNodeToArea(node, printArea)
        }
        onChangeCommit({
          x: node.x(),
          y: node.y(),
          scaleX: node.scaleX(),
          scaleY: node.scaleY(),
          rotation: node.rotation(),
        })
      }}
    />
  )
}

// --- Main Component ---

export function DesignCanvas({
  session,
  setSession,
}: {
  session: DesignSession
  setSession: React.Dispatch<React.SetStateAction<DesignSession>>
}) {
  useGoogleFonts()
  const { addItem } = useCart()
  const { toast } = useToast()
  const [generatingMockup, setGeneratingMockup] = useState(false)

  const currentProduct = useMemo(
    () => getCatalogProduct(session.garmentType),
    [session.garmentType],
  )

  // Responsive canvas size
  const [stageW, setStageW] = useState(CANVAS_W)
  const stageH = Math.round(stageW / CANVAS_ASPECT)
  const scale = stageW / CANVAS_W

  useEffect(() => {
    function handleResize() {
      const available = Math.min(window.innerWidth - 32, CANVAS_W)
      setStageW(available)
    }
    handleResize()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  // --- History (snapshots completos) ---
  const [history, setHistory] = useState<CanvasSnapshot[]>([emptySnapshot()])
  const [histIdx, setHistIdx] = useState(0)
  const snap = history[histIdx]
  const layers = snap.layers
  const activeId = snap.activeId
  const activeLayer = layers.find(l => l.id === activeId) ?? null

  // Ajustes ephemeros (durante drag, antes de commit) — no van al history
  const [ephemeral, setEphemeral] = useState<Record<string, Partial<CanvasLayer>>>({})

  const commitSnapshot = useCallback((mutator: (current: CanvasSnapshot) => CanvasSnapshot) => {
    setHistory((prev) => {
      const current = prev[histIdx] ?? emptySnapshot()
      const next = mutator(current)
      const trimmed = prev.slice(0, histIdx + 1)
      const withNext = [...trimmed, next]
      const clamped = withNext.length > MAX_HISTORY ? withNext.slice(withNext.length - MAX_HISTORY) : withNext
      return clamped
    })
    setHistIdx((i) => Math.min(i + 1, MAX_HISTORY - 1))
    setEphemeral({})
  }, [histIdx])

  const undo = () => { setHistIdx(i => Math.max(0, i - 1)); setEphemeral({}) }
  const redo = () => { setHistIdx(i => Math.min(history.length - 1, i + 1)); setEphemeral({}) }
  const reset = () => {
    setHistory([emptySnapshot()])
    setHistIdx(0)
    setEphemeral({})
  }

  // Konva refs
  const stageRef = useRef<Konva.Stage>(null)
  const trRef = useRef<Konva.Transformer>(null)
  const nodeRefs = useRef<Map<string, Konva.Node>>(new Map())

  // Attach transformer to active layer
  useEffect(() => {
    if (!trRef.current) return
    const node = activeId ? nodeRefs.current.get(activeId) : null
    if (node) {
      trRef.current.nodes([node])
    } else {
      trRef.current.nodes([])
    }
    trRef.current.getLayer()?.batchDraw()
  }, [activeId, layers])

  // Images
  const garmentUrl = useMemo(
    () => resolveGarmentTemplate(session.garmentType, session.garmentColor, session.side),
    [session.garmentType, session.garmentColor, session.side],
  )
  const garmentImg = useKonvaImageFallback(garmentUrl)

  // Auto-add design from chat as image layer when first loaded
  const initializedDesignRef = useRef<string | null>(null)
  useEffect(() => {
    if (!session.currentDesignUrl) return
    if (initializedDesignRef.current === session.currentDesignUrl) return
    initializedDesignRef.current = session.currentDesignUrl

    // Si ya hay un image layer con este url, no agregar de nuevo
    const existing = layers.find(l => l.kind === "image" && l.imageUrl === session.currentDesignUrl)
    if (existing) return

    // Crear layer image centrado en print area, escalado para entrar
    const newId = uid()
    const newLayer: CanvasLayer = {
      id: newId,
      kind: "image",
      imageUrl: session.currentDesignUrl,
      x: getPrintArea(session.garmentType, session.side).x + getPrintArea(session.garmentType, session.side).w / 2,
      y: getPrintArea(session.garmentType, session.side).y + getPrintArea(session.garmentType, session.side).h / 2,
      scaleX: 0.3,
      scaleY: 0.3,
      rotation: 0,
      opacity: 1,
    }
    // Auto-fit despues — esperamos a que cargue la imagen para conocer su size
    const probe = new window.Image()
    probe.crossOrigin = "anonymous"
    probe.onload = () => {
      const w = probe.naturalWidth || 200
      const h = probe.naturalHeight || 200
      const pa = getPrintArea(session.garmentType, session.side)
      const targetMax = Math.min(pa.w, pa.h) * 0.7
      const fit = clamp(targetMax / Math.max(w, h), MIN_SCALE, MAX_SCALE)
      commitSnapshot((current) => ({
        layers: [...current.layers, { ...newLayer, scaleX: fit, scaleY: fit }],
        activeId: newId,
      }))
    }
    probe.onerror = () => {
      commitSnapshot((current) => ({
        layers: [...current.layers, newLayer],
        activeId: newId,
      }))
    }
    probe.src = session.currentDesignUrl
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.currentDesignUrl])

  // Size & cart
  const [selectedSize, setSelectedSize] = useState<Size>("M")
  const [applying, setApplying] = useState(false)

  // UI state
  // Guías ON por default: el usuario tiene que VER dónde se imprime su diseño
  // (antes arrancaba oculto y la gente posicionaba a ciegas fuera del área)
  const [showGuides, setShowGuides] = useState(true)
  const [textPanelOpen, setTextPanelOpen] = useState(false)

  // --- Layer operations ---
  const selectLayer = useCallback((id: string | null) => {
    setHistory((prev) => {
      const trimmed = prev.slice(0, histIdx + 1)
      const current = trimmed[trimmed.length - 1]
      if (!current) return prev
      const updated: CanvasSnapshot = { ...current, activeId: id }
      return [...trimmed.slice(0, -1), updated]
    })
  }, [histIdx])

  const updateLayerEphemeral = useCallback((id: string, patch: Partial<CanvasLayer>) => {
    setEphemeral((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }))
  }, [])

  const updateLayerCommit = useCallback((id: string, patch: Partial<CanvasLayer>) => {
    commitSnapshot((current) => ({
      ...current,
      layers: current.layers.map(l => l.id === id ? { ...l, ...patch } : l),
    }))
  }, [commitSnapshot])

  // Escala/rotación desde los CONTROLES del panel (slider, botones ±15°):
  // mide sobre el nodo Konva real, reduce la escala si el bbox no entra en el
  // área de impresión y corrige la posición. Mismo confinamiento que el drag.
  const applyTransformClamped = useCallback((id: string, t: { scale?: number; rotation?: number }, commit: boolean) => {
    const node = nodeRefs.current.get(id)
    if (!node) return
    const area = getPrintArea(session.garmentType, session.side)
    if (t.scale != null) { node.scaleX(t.scale); node.scaleY(t.scale) }
    if (t.rotation != null) node.rotation(t.rotation)
    const r = nodeRect(node)
    const f = Math.min(area.w / r.width, area.h / r.height, 1)
    if (f < 1) {
      const s = Math.max(MIN_SCALE, node.scaleX() * f)
      node.scaleX(s)
      node.scaleY(s)
    }
    clampNodeToArea(node, area)
    const out = { x: node.x(), y: node.y(), scaleX: node.scaleX(), scaleY: node.scaleY(), rotation: node.rotation() }
    if (commit) updateLayerCommit(id, out)
    else updateLayerEphemeral(id, out)
  }, [session.garmentType, session.side, updateLayerCommit, updateLayerEphemeral])

  const deleteLayer = useCallback((id: string) => {
    commitSnapshot((current) => ({
      layers: current.layers.filter(l => l.id !== id),
      activeId: current.activeId === id ? null : current.activeId,
    }))
  }, [commitSnapshot])

  // Al cambiar prenda/lado el área de impresión cambia: re-encajar las capas
  // que hayan quedado fuera del recuadro nuevo.
  useEffect(() => {
    const area = getPrintArea(session.garmentType, session.side)
    // esperar un frame a que Konva re-renderice con la nueva prenda
    const t = setTimeout(() => {
      for (const [id, node] of nodeRefs.current.entries()) {
        if (rectInsideArea(nodeRect(node), area)) continue
        clampNodeToArea(node, area)
        updateLayerCommit(id, { x: node.x(), y: node.y() })
      }
    }, 50)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.garmentType, session.side])

  const duplicateLayer = useCallback((id: string) => {
    const layer = layers.find(l => l.id === id)
    if (!layer) return
    const newId = uid()
    const duped = { ...layer, id: newId, x: layer.x + 20, y: layer.y + 20 }
    commitSnapshot((current) => ({
      layers: [...current.layers, duped],
      activeId: newId,
    }))
  }, [layers, commitSnapshot])

  const moveLayer = useCallback((id: string, dir: "up" | "down") => {
    commitSnapshot((current) => {
      const idx = current.layers.findIndex(l => l.id === id)
      if (idx < 0) return current
      const swap = dir === "up" ? idx + 1 : idx - 1
      if (swap < 0 || swap >= current.layers.length) return current
      const next = [...current.layers]
      ;[next[idx], next[swap]] = [next[swap], next[idx]]
      return { ...current, layers: next }
    })
  }, [commitSnapshot])

  const toggleLock = useCallback((id: string) => {
    commitSnapshot((current) => ({
      ...current,
      layers: current.layers.map(l => l.id === id ? { ...l, locked: !l.locked } : l),
    }))
  }, [commitSnapshot])

  const addTextLayer = useCallback(() => {
    const id = uid()
    const newLayer: CanvasLayer = {
      id,
      kind: "text",
      text: "Tu texto",
      fontFamily: "Bebas Neue",
      fontSize: 72,
      fontStyle: "normal",
      fill: "#ffffff",
      align: "center",
      x: getPrintArea(session.garmentType, session.side).x + getPrintArea(session.garmentType, session.side).w / 2,
      y: getPrintArea(session.garmentType, session.side).y + getPrintArea(session.garmentType, session.side).h / 2,
      scaleX: 1,
      scaleY: 1,
      rotation: 0,
      opacity: 1,
    }
    commitSnapshot((current) => ({
      layers: [...current.layers, newLayer],
      activeId: id,
    }))
    setTextPanelOpen(true)
  }, [commitSnapshot])

  // Click on empty area deselects
  const handleStageClick = useCallback((e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
    // Si el click fue en el Stage mismo (no en un nodo hijo), deseleccionar
    if (e.target === e.target.getStage()) {
      selectLayer(null)
    }
  }, [selectLayer])

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey) {
        if (e.key === "z" && !e.shiftKey) { e.preventDefault(); undo() }
        if (e.key === "z" && e.shiftKey) { e.preventDefault(); redo() }
        if (e.key === "y") { e.preventDefault(); redo() }
        if (e.key === "d" && activeId) { e.preventDefault(); duplicateLayer(activeId) }
      } else {
        if ((e.key === "Delete" || e.key === "Backspace") && activeId) {
          // Solo si no estamos en un input
          const tag = (e.target as HTMLElement)?.tagName?.toLowerCase()
          if (tag !== "input" && tag !== "textarea") {
            e.preventDefault()
            deleteLayer(activeId)
          }
        }
        if (e.key === "Escape") selectLayer(null)
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [activeId, duplicateLayer, deleteLayer, selectLayer])

  // --- Render layers con merge ephemeral ---
  const renderedLayers = layers.map(l => ({ ...l, ...(ephemeral[l.id] ?? {}) }))

  // --- Apply & Add to Cart ---
  const handleApply = async () => {
    if (!stageRef.current) return
    setApplying(true)
    try {
      // Antes de exportar, ocultar transformer + guías para que no salgan en el PNG
      selectLayer(null)
      setShowGuides(false)
      await new Promise(r => setTimeout(r, 60))

      const dataUrl = stageRef.current.toDataURL({ pixelRatio: 2 })

      // dataURL→Blob directo (fetch(data:) está bloqueado por CSP)
      const blob = dataUrlToBlob(dataUrl)
      const formData = new FormData()
      formData.append("file", blob, `canvas-${Date.now()}.png`)
      formData.append("folder", "canvas-exports")

      const uploadRes = await fetch("/api/public/design/upload", {
        method: "POST",
        body: formData,
      })

      let mockupUrl: string = dataUrl
      if (uploadRes.ok) {
        const json = await uploadRes.json()
        mockupUrl = json.url ?? dataUrl
      }

      setSession((prev) => ({ ...prev, currentMockupUrl: mockupUrl }))

      const sideKey = session.side === "front" ? "frontDesign" : "backDesign"
      const product = getCatalogProduct(session.garmentType)
      const price = product?.retailARS ?? 35000
      const productName = `${product?.name ?? "Remera"} Custom — Novamente`
      const itemId = `custom-canvas-${Date.now()}`

      addItem({
        id: itemId,
        name: productName,
        garmentType: session.garmentType,
        color: session.garmentColor,
        garmentColor: session.garmentColor,
        size: selectedSize,
        price,
        quantity: 1,
        image: mockupUrl,
        mockupUrl,
        // por lado, que es lo que mira la vista grande del carrito
        [session.side === "back" ? "backMockup" : "frontMockup"]: mockupUrl,
        [sideKey]: session.currentDesignUrl ?? undefined,
        // la medida elegida tiene que llegar a producción
        [session.side === "back" ? "backStampSize" : "frontStampSize"]: session.printArea,
      })

      fpixel.event("AddToCart", {
        content_ids: [itemId],
        content_name: productName,
        content_type: "product",
        content_category: session.garmentType,
        value: price,
        currency: "ARS",
      })

      toast({ title: "Agregado al carrito", description: `${product?.name} talle ${selectedSize}` })
    } catch (err) {
      console.error("DesignCanvas: apply failed", err)
      toast({ title: "Error", description: "No se pudo agregar al carrito", variant: "destructive" })
    } finally {
      setApplying(false)
    }
  }

  // --- Empty state ---
  if (!session.currentDesignUrl && layers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900/50 p-8 text-center">
        <Layers className="w-10 h-10 text-zinc-700" />
        <p className="text-zinc-400 text-sm max-w-xs">
          Primero generá un diseño en <strong className="text-white">Chat con IA</strong>, o agregá texto acá:
        </p>
        <Button onClick={addTextLayer} className="bg-violet-600 hover:bg-violet-500 text-white">
          <Type className="w-4 h-4 mr-2" /> Agregar texto
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Prenda + color + side picker */}
      <div className="w-full max-w-lg flex flex-col gap-2">
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {CATALOG_PRODUCTS.map((p) => (
            <button
              key={p.key}
              type="button"
              onClick={() => setSession((prev) => ({
                ...prev,
                garmentType: p.key,
                garmentColor: p.colors.some((c) => c.key === prev.garmentColor)
                  ? prev.garmentColor
                  : (p.colors[0]?.key ?? prev.garmentColor),
                currentMockupUrl: null,
                mockupGeneratedFor: null,
              }))}
              className={`shrink-0 text-[11px] rounded-md border px-2.5 py-1 transition ${
                session.garmentType === p.key
                  ? "bg-white text-zinc-950 border-white"
                  : "border-zinc-700 text-zinc-300 hover:border-zinc-500"
              }`}
            >
              {p.name.replace("Remera ", "").replace("Buzo ", "")}
            </button>
          ))}
        </div>
        <div className="flex items-center justify-between gap-2">
          <div className="flex gap-1.5 overflow-x-auto">
            {(currentProduct?.colors ?? []).map((c) => (
              <button
                key={c.key}
                type="button"
                aria-label={c.name}
                title={c.name}
                onClick={() => setSession((prev) => ({
                  ...prev,
                  garmentColor: c.key,
                  currentMockupUrl: null,
                  mockupGeneratedFor: null,
                }))}
                className={`w-7 h-7 rounded-full border-2 transition ${
                  session.garmentColor === c.key ? "border-white" : "border-zinc-700 hover:border-zinc-500"
                }`}
                style={{ background: c.hex ?? "#444" }}
              />
            ))}
          </div>
          <div className="flex gap-1 shrink-0">
            {(["front", "back"] as const).map((s) => {
              const backUnavailable = s === "back" && !hasBackTemplate(session.garmentType)
              return (
              <button
                key={s}
                type="button"
                disabled={backUnavailable}
                title={backUnavailable ? "Espalda próximamente para esta prenda" : undefined}
                onClick={() => setSession((prev) => ({
                  ...prev,
                  side: s,
                  currentDesignUrl: s === "front"
                    ? prev.frontDesignUrl ?? prev.currentDesignUrl
                    : prev.backDesignUrl ?? prev.currentDesignUrl,
                  currentMockupUrl: null,
                  mockupGeneratedFor: null,
                }))}
                className={`text-[11px] rounded-md border px-2.5 py-1 transition disabled:opacity-30 disabled:cursor-not-allowed ${
                  session.side === s ? "bg-white text-zinc-950 border-white" : "border-zinc-700 text-zinc-300"
                }`}
              >
                {s === "front" ? "Frente" : "Espalda"}
              </button>
            )})}
          </div>
        </div>
      </div>

      {/* Toolbar superior — herramientas de creacion */}
      <div className="w-full max-w-lg flex items-center justify-between gap-2 bg-zinc-900/60 rounded-xl border border-zinc-800 px-2 py-1.5">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={addTextLayer}
            className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium bg-violet-600 hover:bg-violet-500 text-white transition"
            title="Agregar texto"
          >
            <Type className="w-3.5 h-3.5" />
            Texto
          </button>
          <button
            type="button"
            onClick={() => setShowGuides(v => !v)}
            className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium border transition ${
              showGuides
                ? "bg-zinc-800 border-zinc-600 text-white"
                : "bg-transparent border-zinc-700 text-zinc-400 hover:text-zinc-200"
            }`}
            title="Mostrar / ocultar guías"
          >
            {showGuides ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            Guías
          </button>
        </div>

        <div className="flex items-center gap-0.5">
          <Button variant="ghost" size="sm" onClick={undo} disabled={histIdx === 0} title="Deshacer (Ctrl+Z)" className="h-8 w-8 p-0 text-zinc-300 hover:text-white">
            <Undo2 className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="sm" onClick={redo} disabled={histIdx === history.length - 1} title="Rehacer (Ctrl+Shift+Z)" className="h-8 w-8 p-0 text-zinc-300 hover:text-white">
            <Redo2 className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="sm" onClick={reset} title="Resetear todo" className="h-8 w-8 p-0 text-zinc-300 hover:text-white">
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Hint contextual — solo si hay layer activa y guias off */}
      {!showGuides && activeLayer && (
        <p className="text-[10px] text-zinc-500 text-center -mb-1">
          {activeLayer.kind === "text" ? "Tocá fuera para deseleccionar · doble click no editable acá (usá el panel)" : "Pellizcá o arrastrá las esquinas para escalar · arrastrá el centro para mover"}
        </p>
      )}

      {/* Aviso de area de impresion */}
      <div className="w-full max-w-lg bg-yellow-500/10 border border-yellow-500/20 text-yellow-200/90 text-[11px] px-3 py-2 rounded-lg flex items-start gap-2">
        <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-yellow-500" />
        <p>
          <strong>Atención:</strong> El área de estampado es de 35 x 40 cm (marcada por las guías). Todo diseño que quede fuera de este recuadro, como en mangas u hombros, no será estampado.
        </p>
      </div>

      {/* Canvas */}
      <div className="relative rounded-xl overflow-hidden border border-zinc-800 shadow-xl bg-white">
        <Stage
          ref={stageRef}
          width={stageW}
          height={stageH}
          scaleX={scale}
          scaleY={scale}
          onMouseDown={handleStageClick}
          onTouchStart={handleStageClick}
        >
          {/* Layer 1: Garment */}
          <Layer listening={false}>
            <Rect x={0} y={0} width={CANVAS_W} height={CANVAS_H} fill="#f4f4f5" />
            {garmentImg ? (
              <KonvaImage image={garmentImg} x={0} y={0} width={CANVAS_W} height={CANVAS_H} />
            ) : (
              <Text
                x={0}
                y={CANVAS_H / 2 - 20}
                width={CANVAS_W}
                text={`Template para "${session.garmentType} / ${session.garmentColor}" no disponible`}
                fill="#71717a"
                fontSize={14}
                align="center"
              />
            )}
          </Layer>

          {/* Layer 2: Guides — solo si showGuides */}
          {showGuides && (
            <Layer listening={false}>
              <Rect
                x={getPrintArea(session.garmentType, session.side).x}
                y={getPrintArea(session.garmentType, session.side).y}
                width={getPrintArea(session.garmentType, session.side).w}
                height={getPrintArea(session.garmentType, session.side).h}
                stroke="#a78bfa"
                strokeWidth={2}
                dash={[8, 6]}
                opacity={0.7}
              />
            </Layer>
          )}

          {/* Layer 3: User layers (designs + texts) */}
          <Layer>
            {renderedLayers.map((layer) => {
              const isActive = layer.id === activeId
              if (layer.kind === "image") {
                return (
                  <ImageLayerNode
                    key={layer.id}
                    layer={layer}
                    selected={isActive}
                    printArea={getPrintArea(session.garmentType, session.side)}
                    registerRef={(n) => {
                      if (n) nodeRefs.current.set(layer.id, n)
                      else nodeRefs.current.delete(layer.id)
                    }}
                    onSelect={() => selectLayer(layer.id)}
                    onChange={(patch) => updateLayerEphemeral(layer.id, patch)}
                    onChangeCommit={(patch) => updateLayerCommit(layer.id, patch)}
                  />
                )
              }
              return (
                <TextLayerNode
                  key={layer.id}
                  layer={layer}
                  printArea={getPrintArea(session.garmentType, session.side)}
                  registerRef={(n) => {
                    if (n) nodeRefs.current.set(layer.id, n)
                    else nodeRefs.current.delete(layer.id)
                  }}
                  onSelect={() => selectLayer(layer.id)}
                  onChange={(patch) => updateLayerEphemeral(layer.id, patch)}
                  onChangeCommit={(patch) => updateLayerCommit(layer.id, patch)}
                />
              )
            })}

            {/* Transformer — solo visible cuando hay activeId */}
            <Transformer
              ref={trRef}
              keepRatio={false}
              rotateEnabled
              enabledAnchors={[
                "top-left", "top-right", "bottom-left", "bottom-right",
                "middle-left", "middle-right", "top-center", "bottom-center",
              ]}
              anchorSize={12}
              anchorCornerRadius={6}
              anchorStroke="#a78bfa"
              anchorFill="#ffffff"
              borderStroke="#a78bfa"
              borderStrokeWidth={1.5}
              borderDash={[4, 4]}
              padding={4}
              rotateAnchorOffset={26}
              boundBoxFunc={(oldBox, newBox) => {
                if (Math.abs(newBox.width) < 8 || Math.abs(newBox.height) < 8) return oldBox
                return newBox
              }}
            />
          </Layer>
        </Stage>
      </div>

      {/* Panel de propiedades de la layer activa */}
      {activeLayer && (
        <div className="w-full max-w-lg rounded-xl border border-violet-700/40 bg-zinc-900/80 p-3 space-y-3 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-violet-300 uppercase tracking-wider flex items-center gap-1.5">
              {activeLayer.kind === "text" ? <Type className="w-3 h-3" /> : <ImageIcon className="w-3 h-3" />}
              {activeLayer.kind === "text" ? "Texto" : "Imagen"}
            </span>
            <div className="flex items-center gap-0.5">
              <Button variant="ghost" size="sm" onClick={() => moveLayer(activeLayer.id, "down")} title="Bajar" className="h-7 w-7 p-0 text-zinc-400 hover:text-white">
                <ChevronDown className="w-3.5 h-3.5" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => moveLayer(activeLayer.id, "up")} title="Subir" className="h-7 w-7 p-0 text-zinc-400 hover:text-white">
                <ChevronUp className="w-3.5 h-3.5" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => toggleLock(activeLayer.id)} title={activeLayer.locked ? "Desbloquear" : "Bloquear"} className="h-7 w-7 p-0 text-zinc-400 hover:text-white">
                {activeLayer.locked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => duplicateLayer(activeLayer.id)} title="Duplicar (Ctrl+D)" className="h-7 w-7 p-0 text-zinc-400 hover:text-white">
                <Copy className="w-3.5 h-3.5" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => deleteLayer(activeLayer.id)} title="Eliminar (Del)" className="h-7 w-7 p-0 text-red-400 hover:text-red-300 hover:bg-red-950/30">
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>

          {/* Quick rotate */}
          <div className="flex items-center justify-center gap-1.5">
            <button
              type="button"
              onClick={() => applyTransformClamped(activeLayer.id, { rotation: (activeLayer.rotation || 0) - 15 }, true)}
              className="inline-flex items-center justify-center w-8 h-8 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
              title="Rotar -15°"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <span className="text-[11px] text-zinc-500 font-mono w-12 text-center">{Math.round(activeLayer.rotation || 0)}°</span>
            <button
              type="button"
              onClick={() => applyTransformClamped(activeLayer.id, { rotation: (activeLayer.rotation || 0) + 15 }, true)}
              className="inline-flex items-center justify-center w-8 h-8 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-300 scale-x-[-1]"
              title="Rotar +15°"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Slider escala */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-zinc-500 w-10">Tamaño</span>
            <input
              type="range"
              min={MIN_SCALE}
              max={MAX_SCALE}
              step={0.01}
              value={activeLayer.scaleX}
              onChange={(e) => applyTransformClamped(activeLayer.id, { scale: parseFloat(e.target.value) }, false)}
              onMouseUp={(e) => applyTransformClamped(activeLayer.id, { scale: parseFloat((e.target as HTMLInputElement).value) }, true)}
              onTouchEnd={(e) => applyTransformClamped(activeLayer.id, { scale: parseFloat((e.target as HTMLInputElement).value) }, true)}
              className="flex-1 accent-violet-500"
            />
            <span className="text-[10px] text-zinc-500 font-mono w-10 text-right">{Math.round(activeLayer.scaleX * 100)}%</span>
          </div>

          {/* Slider opacidad */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-zinc-500 w-10">Opacid.</span>
            <input
              type="range"
              min={0.1}
              max={1}
              step={0.05}
              value={activeLayer.opacity}
              onChange={(e) => updateLayerEphemeral(activeLayer.id, { opacity: parseFloat(e.target.value) })}
              onMouseUp={(e) => updateLayerCommit(activeLayer.id, { opacity: parseFloat((e.target as HTMLInputElement).value) })}
              onTouchEnd={(e) => updateLayerCommit(activeLayer.id, { opacity: parseFloat((e.target as HTMLInputElement).value) })}
              className="flex-1 accent-violet-500"
            />
            <span className="text-[10px] text-zinc-500 font-mono w-10 text-right">{Math.round(activeLayer.opacity * 100)}%</span>
          </div>

          {/* Text-specific controls */}
          {activeLayer.kind === "text" && (
            <div className="space-y-2 pt-2 border-t border-zinc-800">
              <textarea
                value={activeLayer.text || ""}
                onChange={(e) => updateLayerCommit(activeLayer.id, { text: e.target.value })}
                placeholder="Escribí tu texto"
                rows={2}
                className="w-full rounded-md bg-zinc-800 border border-zinc-700 px-2 py-1.5 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
              />

              {/* Fuente */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-zinc-500 w-10">Fuente</span>
                <select
                  value={activeLayer.fontFamily || "Inter"}
                  onChange={(e) => updateLayerCommit(activeLayer.id, { fontFamily: e.target.value })}
                  className="flex-1 rounded-md bg-zinc-800 border border-zinc-700 px-2 py-1.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                  style={{ fontFamily: activeLayer.fontFamily }}
                >
                  {FONT_OPTIONS.map(f => (
                    <option key={f.key} value={f.key} style={{ fontFamily: f.key }}>{f.label}</option>
                  ))}
                </select>
              </div>

              {/* Size text */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-zinc-500 w-10">Px</span>
                <input
                  type="range"
                  min={12}
                  max={200}
                  step={1}
                  value={activeLayer.fontSize || 48}
                  onChange={(e) => updateLayerCommit(activeLayer.id, { fontSize: parseInt(e.target.value, 10) })}
                  className="flex-1 accent-violet-500"
                />
                <span className="text-[10px] text-zinc-500 font-mono w-10 text-right">{activeLayer.fontSize}</span>
              </div>

              {/* Style + align */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    const cur = (activeLayer.fontStyle || "normal").split(" ")
                    const has = cur.includes("bold")
                    const next = has ? cur.filter(x => x !== "bold") : [...cur.filter(x => x !== "normal"), "bold"]
                    updateLayerCommit(activeLayer.id, { fontStyle: next.length ? next.join(" ") : "normal" })
                  }}
                  className={`inline-flex items-center justify-center w-8 h-8 rounded-md transition ${
                    (activeLayer.fontStyle || "").includes("bold")
                      ? "bg-violet-600 text-white"
                      : "bg-zinc-800 text-zinc-400 hover:text-white"
                  }`}
                  title="Negrita"
                >
                  <Bold className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const cur = (activeLayer.fontStyle || "normal").split(" ")
                    const has = cur.includes("italic")
                    const next = has ? cur.filter(x => x !== "italic") : [...cur.filter(x => x !== "normal"), "italic"]
                    updateLayerCommit(activeLayer.id, { fontStyle: next.length ? next.join(" ") : "normal" })
                  }}
                  className={`inline-flex items-center justify-center w-8 h-8 rounded-md transition ${
                    (activeLayer.fontStyle || "").includes("italic")
                      ? "bg-violet-600 text-white"
                      : "bg-zinc-800 text-zinc-400 hover:text-white"
                  }`}
                  title="Cursiva"
                >
                  <Italic className="w-3.5 h-3.5" />
                </button>
                <div className="w-px h-6 bg-zinc-800 mx-1" />
                {(["left", "center", "right"] as const).map(a => {
                  const Icon = a === "left" ? AlignLeft : a === "center" ? AlignCenter : AlignRight
                  return (
                    <button
                      key={a}
                      type="button"
                      onClick={() => updateLayerCommit(activeLayer.id, { align: a })}
                      className={`inline-flex items-center justify-center w-8 h-8 rounded-md transition ${
                        activeLayer.align === a
                          ? "bg-violet-600 text-white"
                          : "bg-zinc-800 text-zinc-400 hover:text-white"
                      }`}
                      title={`Alinear ${a}`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                    </button>
                  )
                })}
              </div>

              {/* Color swatches */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-zinc-500 w-10">Color</span>
                <div className="flex-1 flex items-center flex-wrap gap-1">
                  {TEXT_COLORS.map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => updateLayerCommit(activeLayer.id, { fill: c })}
                      className={`w-6 h-6 rounded-full border-2 transition ${
                        activeLayer.fill === c ? "border-violet-400 scale-110" : "border-zinc-700 hover:border-zinc-500"
                      }`}
                      style={{ background: c }}
                      aria-label={`Color ${c}`}
                    />
                  ))}
                  <input
                    type="color"
                    value={activeLayer.fill || "#ffffff"}
                    onChange={(e) => updateLayerCommit(activeLayer.id, { fill: e.target.value })}
                    className="w-6 h-6 rounded-full overflow-hidden cursor-pointer border-2 border-zinc-700"
                    title="Color personalizado"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Probar lifestyle */}
      <Button
        variant="outline"
        size="sm"
        className="w-full max-w-lg border-zinc-700 hover:bg-zinc-800"
        disabled={generatingMockup || (!session.currentDesignUrl && layers.length === 0)}
        onClick={async () => {
          if (!session.currentDesignUrl && layers.length === 0) {
            toast({ title: "Tip", description: "Para foto lifestyle necesitás un diseño base. Generá uno en Chat IA o agregá una imagen/texto.", variant: "destructive" })
            return
          }
          setGeneratingMockup(true)
          try {
            // Exportar la COMPOSICIÓN del canvas (capas del usuario tal cual
            // las acomodó, SIN la prenda de fondo, recortada al área de
            // impresión) — antes se mandaba el diseño crudo y se ignoraban
            // los edits/textos del canvas.
            let designImageUrl = session.currentDesignUrl
            const stage = stageRef.current
            if (stage && layers.length > 0) {
              selectLayer(null)
              const guidesWereOn = showGuides
              setShowGuides(false)
              await new Promise((r) => setTimeout(r, 60))
              const garmentLayer = stage.getLayers()[0]
              garmentLayer?.visible(false)
              const area = getPrintArea(session.garmentType, session.side)
              const dataUrl = stage.toDataURL({
                x: area.x * scale,
                y: area.y * scale,
                width: area.w * scale,
                height: area.h * scale,
                pixelRatio: 2 / scale,
              })
              garmentLayer?.visible(true)
              setShowGuides(guidesWereOn)
              // subir a R2 para pasar una URL (la API descarga la imagen)
              const blob = dataUrlToBlob(dataUrl)
              const formData = new FormData()
              formData.append("file", blob, `canvas-design-${Date.now()}.png`)
              formData.append("folder", "canvas-exports")
              const uploadRes = await fetch("/api/public/design/upload", { method: "POST", body: formData })
              if (uploadRes.ok) {
                const json = await uploadRes.json()
                if (json.url) designImageUrl = json.url
              }
            }
            if (!designImageUrl) throw new Error("No hay diseño para el mockup")

            const res = await fetch("/api/public/design/mockup-lifestyle", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                // la API espera designImageUrl (antes se mandaba designUrl → 400 siempre)
                designImageUrl,
                garmentType: session.garmentType,
                garmentColor: session.garmentColor,
                side: session.side,
                printArea: session.printArea,
              }),
            })
            const data = await res.json()
            const mockupUrl = data?.publicUrl ?? data?.mockupUrl
            if (!res.ok || !mockupUrl) throw new Error(data?.error ?? "No se pudo generar el mockup")
            setSession((prev) => ({
              ...prev,
              currentMockupUrl: mockupUrl,
              mockupGeneratedFor: {
                garmentType: session.garmentType,
                garmentColor: session.garmentColor,
                side: session.side,
                designUrl: session.currentDesignUrl ?? "",
              },
            }))
            toast({ title: "Mockup listo", description: "Andá a la pestaña Lifestyle para verlo." })
          } catch (e: any) {
            toast({ title: "Error generando mockup", description: e.message, variant: "destructive" })
          } finally {
            setGeneratingMockup(false)
          }
        }}
      >
        {generatingMockup ? (
          <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Generando foto lifestyle...</>
        ) : (
          <><Shirt className="h-4 w-4 mr-2" /> Probar en {currentProduct?.name ?? "prenda"} (foto lifestyle)</>
        )}
      </Button>

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
          disabled={applying || layers.length === 0}
          className="bg-violet-600 hover:bg-violet-500 text-white flex items-center gap-2 shadow-lg shadow-violet-600/20 h-11 px-6 flex-1 sm:flex-initial"
        >
          <ShoppingCart className="h-4 w-4" />
          {applying ? "Aplicando..." : "Aplicar y agregar al carrito"}
        </Button>
      </div>
    </div>
  )
}
