"use client"
import { useEffect, useMemo, useRef, useState } from "react"
import Image from "next/image"
import { getGarmentMapping } from "@/lib/garment-mappings"

interface PrintAreaProps {
  garmentType: string
  garmentColor: string
  activeTab: "front" | "back"
  mockupSrc?: string // opcional override
  designImage: string | null
  designPos: { x: number; y: number } // 0–100 relativo al área
  designSizePct: number // % del ancho del área
  onPos: (p: { x: number; y: number }) => void
  onSize: (sizePct: number) => void
  showFrame?: boolean
}

export function PrintArea({
  garmentType,
  garmentColor,
  activeTab,
  mockupSrc,
  designImage,
  designPos,
  designSizePct,
  onPos,
  onSize,
  showFrame = true,
}: PrintAreaProps) {
  const mapping = useMemo(
    () => getGarmentMapping(garmentType, garmentColor, activeTab),
    [garmentType, garmentColor, activeTab],
  )

  const [nat, setNat] = useState<{ w: number; h: number } | null>(null)
  const [drag, setDrag] = useState(false)
  const wrapRef = useRef<HTMLDivElement | null>(null)

  const mockup = mockupSrc ?? mapping?.garmentPath ?? "/placeholder.svg"

  const framePct = useMemo(() => {
    if (!mapping || !nat) return null
    const { x, y, width, height } = mapping.coordinates
    return {
      leftPct: (x / nat.w) * 100,
      topPct: (y / nat.h) * 100,
      widthPct: (width / nat.w) * 100,
      heightPct: (height / nat.h) * 100,
    }
  }, [mapping, nat])

  useEffect(() => {
    if (!drag) return
    const onMove = (e: MouseEvent | TouchEvent) => {
      if (!wrapRef.current || !framePct) return
      const rect = wrapRef.current.getBoundingClientRect()
      const cx = ((("touches" in e ? e.touches[0].clientX : (e as MouseEvent).clientX) - rect.left) / rect.width) * 100
      const cy = ((("touches" in e ? e.touches[0].clientY : (e as MouseEvent).clientY) - rect.top) / rect.height) * 100
      // convertir a % RELATIVO AL ÁREA
      const xRel = ((cx - framePct.leftPct) / framePct.widthPct) * 100
      const yRel = ((cy - framePct.topPct) / framePct.heightPct) * 100
      onPos({ x: Math.max(0, Math.min(100, xRel)), y: Math.max(0, Math.min(100, yRel)) })
    }
    const stop = () => setDrag(false)
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
  }, [drag, framePct, onPos])

  const overlayWidthPctOfContainer = framePct ? framePct.widthPct * (designSizePct / 100) : 0

  return (
    <div ref={wrapRef} className="relative aspect-square bg-gray-100">
      <Image
        src={mockup || "/placeholder.svg"}
        alt="Mockup"
        fill
        className="object-contain"
        unoptimized
        onLoadingComplete={(img) => setNat({ w: img.naturalWidth, h: img.naturalHeight })}
        onError={() => setNat(null)}
      />

      {framePct && showFrame && (
        <div
          className="absolute border-2 border-red-500 border-dashed pointer-events-none"
          style={{
            left: `${framePct.leftPct}%`,
            top: `${framePct.topPct}%`,
            width: `${framePct.widthPct}%`,
            height: `${framePct.heightPct}%`,
            zIndex: 5,
          }}
        />
      )}

      {framePct && designImage && (
        <div className="absolute inset-0" onMouseDown={() => setDrag(true)} onTouchStart={() => setDrag(true)}>
          <div
            className="absolute"
            style={{
              left: `${framePct.leftPct + (framePct.widthPct * designPos.x) / 100}%`,
              top: `${framePct.topPct + (framePct.heightPct * designPos.y) / 100}%`,
              width: `${overlayWidthPctOfContainer}%`,
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
    </div>
  )
}
