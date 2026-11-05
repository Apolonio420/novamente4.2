"use client"

import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { Moon, Sun } from "lucide-react"
import { useEffect, useState } from "react"

/**
 * Botón claro/oscuro. El tema elegido queda en localStorage ("novamente-theme")
 * vía next-themes; sin elección, la web arranca en claro (ver app/layout.tsx).
 */
export function ThemeToggle({ withLabel = false }: { withLabel?: boolean }) {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const isDark = mounted && resolvedTheme === "dark"
  const label = isDark ? "Cambiar a tema claro" : "Cambiar a tema oscuro"

  return (
    <Button
      variant="ghost"
      size={withLabel ? "default" : "icon"}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      disabled={!mounted}
      aria-label={label}
      title={label}
      data-testid="theme-toggle"
      className={withLabel ? "gap-2 justify-start" : undefined}
    >
      {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
      {withLabel && <span className="text-sm">{isDark ? "Tema claro" : "Tema oscuro"}</span>}
    </Button>
  )
}
