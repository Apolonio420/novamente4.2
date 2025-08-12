"use client"

import type { ReactNode } from "react"

interface ScrollButtonProps {
  children: ReactNode
  className?: string
  targetId?: string
}

export function ScrollButton({ children, className, targetId = "generator" }: ScrollButtonProps) {
  const handleClick = () => {
    const element = document.getElementById(targetId)
    if (element) {
      element.scrollIntoView({ behavior: "smooth" })
    }
  }

  return (
    <button type="button" className={className} onClick={handleClick}>
      {children}
    </button>
  )
}
