"use client"

import type { ReactNode } from "react"
import { scrollToGenerator } from "@/lib/scrollToGenerator"

interface ScrollButtonProps {
  children: ReactNode
  className?: string
  targetId?: string
}

export function ScrollButton({ children, className, targetId = "generator-section" }: ScrollButtonProps) {
  const handleClick = () => {
    if (targetId === "generator-section") {
      // Use the new scrollToGenerator utility
      scrollToGenerator()
    } else {
      // Fallback for custom targetId
      const element = document.getElementById(targetId)
      if (element) {
        element.scrollIntoView({ behavior: "smooth" })
      }
    }
  }

  return (
    <button type="button" className={className} onClick={handleClick}>
      {children}
    </button>
  )
}
