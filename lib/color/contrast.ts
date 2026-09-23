/**
 * Utilidad de contraste WCAG para el storefront de partners (/p/[slug]).
 *
 * La auditoría de las 88 tiendas públicas encontró botones de compra con
 * texto blanco sobre `primary_color` casi negro — invisibles contra el fondo
 * `#09090b` del storefront. Este módulo calcula qué texto (negro/blanco) es
 * legible sobre un color dado, y qué fondo de botón usar para que la
 * SUPERFICIE del botón también se distinga del fondo de la página.
 *
 * Fórmulas: WCAG 2.x relative luminance + contrast ratio.
 * https://www.w3.org/TR/WCAG21/#dfn-relative-luminance
 */

const HEX_RE = /^#?([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/

const FALLBACK_PRIMARY = '#71717a' // zinc-500 — punto medio seguro, sirve de piso

export interface RGB {
  r: number
  g: number
  b: number
}

/** Normaliza y valida un hex. Devuelve null si no es un hex válido (#RGB o #RRGGBB). */
function parseHex(hex: string): RGB | null {
  if (typeof hex !== 'string') return null
  const trimmed = hex.trim()
  if (!HEX_RE.test(trimmed)) return null
  const body = trimmed.replace('#', '')
  const full =
    body.length === 3
      ? body
          .split('')
          .map((c) => c + c)
          .join('')
      : body
  const r = parseInt(full.slice(0, 2), 16)
  const g = parseInt(full.slice(2, 4), 16)
  const b = parseInt(full.slice(4, 6), 16)
  if ([r, g, b].some((n) => Number.isNaN(n))) return null
  return { r, g, b }
}

function toHex({ r, g, b }: RGB): string {
  const clamp = (n: number) => Math.max(0, Math.min(255, Math.round(n)))
  return (
    '#' +
    [clamp(r), clamp(g), clamp(b)]
      .map((n) => n.toString(16).padStart(2, '0'))
      .join('')
  )
}

function channelLuminance(c: number): number {
  const cs = c / 255
  return cs <= 0.03928 ? cs / 12.92 : Math.pow((cs + 0.055) / 1.055, 2.4)
}

/** Luminancia relativa (0..1) de un color hex. Hex inválido → 0 (tratado como negro). */
export function luminance(hex: string): number {
  const rgb = parseHex(hex)
  if (!rgb) return 0
  const { r, g, b } = rgb
  return (
    0.2126 * channelLuminance(r) +
    0.7152 * channelLuminance(g) +
    0.0722 * channelLuminance(b)
  )
}

/** Ratio de contraste WCAG (1..21) entre dos colores hex. Hex inválido se trata como negro. */
export function contrastRatio(a: string, b: string): number {
  const l1 = luminance(a)
  const l2 = luminance(b)
  const lighter = Math.max(l1, l2)
  const darker = Math.min(l1, l2)
  return (lighter + 0.05) / (darker + 0.05)
}

/** Texto '#000' o '#fff', el que dé mayor contraste sobre `hex`. Hex inválido → '#fff'. */
export function readableTextOn(hex: string): '#000' | '#fff' {
  const rgb = parseHex(hex)
  if (!rgb) return '#fff'
  const contrastWithBlack = contrastRatio(hex, '#000000')
  const contrastWithWhite = contrastRatio(hex, '#ffffff')
  return contrastWithWhite >= contrastWithBlack ? '#fff' : '#000'
}

/** Mezcla `hex` hacia blanco en proporción `amount` (0..1). */
function mixWithWhite(hex: string, amount: number): string {
  const rgb = parseHex(hex)
  if (!rgb) return hex
  const t = Math.max(0, Math.min(1, amount))
  return toHex({
    r: rgb.r + (255 - rgb.r) * t,
    g: rgb.g + (255 - rgb.g) * t,
    b: rgb.b + (255 - rgb.b) * t,
  })
}

export interface ButtonColors {
  background: string
  color: '#000' | '#fff'
  borderColor?: string
}

/**
 * Colores de botón "Comprar ahora" / CTAs del storefront, dados el
 * `primary_color` del partner y el fondo de la página (`#09090b` por
 * default, el `bg-zinc-950` del storefront).
 *
 * Garantiza:
 *  - texto ≥ 4.5:1 contra el fondo del botón (WCAG AA texto normal)
 *  - superficie del botón ≥ 3:1 contra `pageBg` (WCAG AA "non-text contrast")
 *
 * Estrategia (la más simple que cumple ambos umbrales):
 *  1. Si el primario ya tiene ≥3:1 contra pageBg, se usa tal cual como fondo
 *     del botón, con el texto de mayor contraste (negro o blanco).
 *  2. Si no, se aclara el primario mezclándolo hacia blanco en pasos hasta
 *     que la superficie llegue a ≥3:1 contra pageBg (nunca hace falta más de
 *     ~20 pasos: el tope es blanco puro, que siempre da máximo contraste).
 *     Además se agrega un borde claro para reforzar el límite del botón.
 *  3. Hex de `primary` inválido → fallback seguro (zinc-500 aclarado).
 */
export function buttonColors(primary: string, pageBg: string = '#09090b'): ButtonColors {
  const validPrimary = parseHex(primary) ? primary : FALLBACK_PRIMARY

  if (contrastRatio(validPrimary, pageBg) >= 3) {
    return {
      background: validPrimary,
      color: readableTextOn(validPrimary),
    }
  }

  // Negro/gris casi sin tinte sobre fondo oscuro: aclararlo da un gris medio
  // que parece un botón deshabilitado (visto en la captura de abond). Para
  // esas marcas el botón claro con texto negro es el look que corresponde.
  const rgb = parseHex(validPrimary)!
  const spread = Math.max(rgb.r, rgb.g, rgb.b) - Math.min(rgb.r, rgb.g, rgb.b)
  if (spread < 24 && luminance(pageBg) < 0.2) {
    return { background: '#f4f4f5', color: '#000' }
  }

  // Aclarar hasta pasar el umbral de superficie (o llegar a blanco puro).
  let background = validPrimary
  for (let step = 1; step <= 20; step++) {
    const candidate = mixWithWhite(validPrimary, step / 20)
    background = candidate
    if (contrastRatio(candidate, pageBg) >= 3) break
  }

  return {
    background,
    color: readableTextOn(background),
    borderColor: mixWithWhite(validPrimary, 0.85),
  }
}
