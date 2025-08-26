"use client"
import { useEffect, useMemo, useRef, useState } from "react"
import { getGarmentMapping } from "@/lib/garment-mappings"

interface PrintAreaProps {
  garmentType: string
  garmentColor: string
  activeTab: "front" | "back"
  designImage: string | null
  designPosition: { x: number; y: number } // 0–100 relativo al área
  designSizePct: number // % del ancho del área
  onPositionChange: (p: { x: number; y: number }) => void
  onSizeChange: (sizePct: number) => void
  showFrame?: boolean
}

const BASE = 400

export function PrintArea(props: PrintAreaProps) {
  const {
    garmentType,
    garmentColor,
    activeTab,
    designImage,
    designPosition,
    designSizePct,
    onPositionChange,
    onSizeChange,
    showFrame = true,
  } = props
  const areaRef = useRef<HTMLDivElement | null>(null)

  const mapping = useMemo(
    () => getGarmentMapping(garmentType, garmentColor, activeTab),
    [garmentType, garmentColor, activeTab],
  )

  const frame = useMemo(() => {
    if (!mapping) return null
    const { x, y, width, height } = mapping.coordinates
    return {
      leftPct: (x / BASE) * 100,
      topPct: (y / BASE) * 100,
      widthPct: (width / BASE) * 100,
      heightPct: (height / BASE) * 100,
    }
  }, [mapping])

  const [dragging, setDragging] = useState(false)

  useEffect(() => {
    if (!dragging) return
    const onMove = (e: MouseEvent | TouchEvent) => {
      if (!areaRef.current || !frame) return
      const rect = areaRef.current.getBoundingClientRect()
      const clientX = (e as TouchEvent).touches?.[0]?.clientX ?? (e as MouseEvent).clientX
      const clientY = (e as TouchEvent).touches?.[0]?.clientY ?? (e as MouseEvent).clientY
      const relX = ((clientX - rect.left) / rect.width) * 100
      const relY = ((clientY - rect.top) / rect.height) * 100
      const xInArea = ((relX - frame.leftPct) / frame.widthPct) * 100
      const yInArea = ((relY - frame.topPct) / frame.heightPct) * 100
      const cx = Math.max(0, Math.min(100, xInArea))
      const cy = Math.max(0, Math.min(100, yInArea))
      onPositionChange({ x: cx, y: cy })
    }
    const stop = () => setDragging(false)
    window.addEventListener("mousemove", onMove)
    window.addEventListener("mouseup", stop)
    window.addEventListener("touchmove", onMove, { passive: false })
    window.addEventListener("touchend", stop)
    return () => {
      window.removeEventListener("mousemove", onMove)
      window.removeEventListener("mouseup", stop)
      window.removeEventListener("touchmove", onMove as any)
      window.removeEventListener("touchend", stop)
    }
  }, [dragging, frame, onPositionChange])

  if (!frame) return null

  const designWidthPctOfContainer = frame.widthPct * (designSizePct / 100)

  return (
    <>
      {showFrame && (
        <div
          className="absolute border-2 border-red-500 border-dashed pointer-events-none"
          style={{
            left: `${frame.leftPct}%`,
            top: `${frame.topPct}%`,
            width: `${frame.widthPct}%`,
            height: `${frame.heightPct}%`,
          }}
        />
      )}

      {designImage && (
        <div
          ref={areaRef}
          className="absolute inset-0"
          onMouseDown={() => setDragging(true)}
          onTouchStart={() => setDragging(true)}
        >
          <div
            className="absolute"
            style={{
              left: `${frame.leftPct + (frame.widthPct * designPosition.x) / 100}%`,
              top: `${frame.topPct + (frame.heightPct * designPosition.y) / 100}%`,
              width: `${designWidthPctOfContainer}%`,
              transform: "translate(-50%, -50%)",
              zIndex: 10,
              cursor: "move",
            }}
          >
            <img
              src={designImage || "/placeholder.svg"}
              alt="Diseño"
              className="w-full h-auto object-contain pointer-events-none select-none"
              draggable={false}
              onError={(e) => (e.currentTarget.src = "/placeholder.svg")}
            />
          </div>
        </div>
      )}
    </>
  )
}
