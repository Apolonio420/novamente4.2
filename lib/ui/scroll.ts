"use client"

/**
 * Scroll to element by ID
 */
export function scrollToId(
  id: string,
  opts: ScrollIntoViewOptions = { behavior: "smooth", block: "start" }
) {
  const el = document.getElementById(id)
  if (el) {
    el.scrollIntoView(opts)
  }
}

/**
 * Focus first focusable element in container
 */
export function focusFirstFocusable(id: string) {
  const container = document.getElementById(id)
  if (!container) return
  
  const focusable = container.querySelector<HTMLElement>(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  )
  
  focusable?.focus()
}

/**
 * Scroll and focus simultaneously
 */
export function scrollToIdAndFocus(id: string) {
  scrollToId(id)
  // Delay focus to ensure scroll completes
  setTimeout(() => focusFirstFocusable(id), 200)
}

