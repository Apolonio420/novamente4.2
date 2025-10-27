"use client"

/**
 * Scroll to the generator section in the homepage
 * If user is on /, scrolls smoothly without reload
 * If user is on another route, navigates to /#generator-section
 */
export function scrollToGenerator() {
  if (typeof window === "undefined") return

  const isHome = window.location.pathname === "/"
  const target = "generator-section"

  if (!isHome) {
    // Navigate to home with hash; browser will scroll on load
    window.location.href = `/#${target}`
    return
  }

  const el = document.getElementById(target)
  if (el) {
    el.scrollIntoView({ behavior: "smooth", block: "start" })
  }
}

