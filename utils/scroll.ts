/**
 * Helper para hacer scroll suave a un elemento
 * Incluye fallback para navegadores antiguos y soporte para offset de navbar sticky
 */
export function smoothScrollIntoView(el: HTMLElement | null) {
  if (!el) return

  try {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  } catch {
    // Fallback para Safari/navegadores antiguos
    const top = el.getBoundingClientRect().top + window.scrollY - 80 // offset para navbar sticky
    window.scrollTo({ top, behavior: 'smooth' })
  }
}

