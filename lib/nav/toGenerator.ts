export const GENERATOR_HASH = "#generator-section"

export function getGeneratorHref(base = "/") {
  return `${base}${GENERATOR_HASH}`
}

export function scrollToGeneratorIfHome(e?: React.MouseEvent) {
  if (typeof window === "undefined") return
  const isHome = window.location.pathname === "/" || window.location.pathname === ""
  if (isHome) {
    e?.preventDefault?.()
    const el = document.querySelector(GENERATOR_HASH)
    if (el) (el as HTMLElement).scrollIntoView({ behavior: "smooth", block: "start" })
  }
}


