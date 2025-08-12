"use client"
import { Button } from "@/components/ui/button"
import { ChevronsUpDown, ChevronsLeftRight } from "lucide-react"

interface DesignPositionerProps {
  onPositionChange: (position: { x: number; y: number }) => void
  onCenterDesign: () => void
  currentPosition: { x: number; y: number }
}

export function DesignPositioner({ onPositionChange, onCenterDesign, currentPosition }: DesignPositionerProps) {
  const positionStep = 5 // Pixels to move per button click

  // Mover el diseño en una dirección específica
  const moveDesign = (direction: "up" | "down" | "left" | "right") => {
    const newPosition = { ...currentPosition }

    switch (direction) {
      case "up":
        newPosition.y -= positionStep
        break
      case "down":
        newPosition.y += positionStep
        break
      case "left":
        newPosition.x -= positionStep
        break
      case "right":
        newPosition.x += positionStep
        break
    }

    onPositionChange(newPosition)
  }

  return (
    <div className="flex flex-col items-center gap-2 mt-4">
      <Button variant="outline" size="sm" className="w-full" onClick={onCenterDesign}>
        Centrar diseño
      </Button>

      <div className="grid grid-cols-3 gap-1">
        <div></div>
        <Button variant="outline" size="icon" onClick={() => moveDesign("up")}>
          <ChevronsUpDown className="h-4 w-4 rotate-180" />
        </Button>
        <div></div>

        <Button variant="outline" size="icon" onClick={() => moveDesign("left")}>
          <ChevronsLeftRight className="h-4 w-4 rotate-180" />
        </Button>

        <div className="flex items-center justify-center">
          <div className="h-4 w-4 rounded-full bg-primary"></div>
        </div>

        <Button variant="outline" size="icon" onClick={() => moveDesign("right")}>
          <ChevronsLeftRight className="h-4 w-4" />
        </Button>

        <div></div>
        <Button variant="outline" size="icon" onClick={() => moveDesign("down")}>
          <ChevronsUpDown className="h-4 w-4" />
        </Button>
        <div></div>
      </div>

      <div className="text-xs text-muted-foreground mt-1">
        Posición: X: {currentPosition.x.toFixed(0)}, Y: {currentPosition.y.toFixed(0)}
      </div>
    </div>
  )
}
