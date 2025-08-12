"use client"

import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import { Trash2, ZoomIn, ZoomOut } from "lucide-react"

interface PositionControlsProps {
  scale: number
  onScaleChange: (scale: number) => void
  onRemove: () => void
}

export function PositionControls({ scale, onScaleChange, onRemove }: PositionControlsProps) {
  const handleScaleChange = (value: number[]) => {
    onScaleChange(value[0])
  }

  return (
    <div className="mt-4 space-y-4">
      <div className="flex items-center gap-4">
        <ZoomOut className="h-4 w-4 text-muted-foreground" />
        <Slider value={[scale]} min={0.25} max={1.0} step={0.01} onValueChange={handleScaleChange} />
        <ZoomIn className="h-4 w-4 text-muted-foreground" />
      </div>

      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={onRemove} className="text-destructive hover:text-destructive">
          <Trash2 className="h-4 w-4 mr-2" />
          Remove Design
        </Button>
      </div>
    </div>
  )
}
