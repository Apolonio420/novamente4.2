/**
 * Tema claro/oscuro sobre la paleta de Tailwind (v3).
 *
 * La web se diseñó oscura: ~5.300 clases `zinc-*`, ~1.700 `white` y cientos de
 * `text-purple-300` y parecidos que suponen fondo negro. En Tailwind v3 esas
 * clases compilan a hex fijos, así que cambiar de tema clase por clase serían
 * miles de `dark:`. En cambio, cada color de la paleta pasa a leer una variable
 * CSS (`rgb(var(--tw-zinc-950) / <alpha-value>)`) y el tema decide su valor:
 *
 * - `.dark` (y los alcances de "colores originales", ver abajo) → los valores
 *   originales de Tailwind: el oscuro se ve igual que siempre.
 * - `:root` (tema claro, el default) → los grises se espejan (950 ↔ 50,
 *   `white` ↔ `black`) y los tonos 50-400 de los colores con matiz se
 *   oscurecen para que el texto pálido lea sobre blanco.
 *
 * Alcances que conservan los colores originales en tema claro:
 * - `.theme-fixed`: bloques ya diseñados claros (landings con `bg-white`) o que
 *   tienen que quedar oscuros (texto sobre foto).
 * - elementos con fondo sólido saturado (`bg-purple-600`, `from-violet-600`…):
 *   su `text-white` sigue blanco y su contenido no se invierte.
 */
import colors from "tailwindcss/colors"

const NEUTRALS = ["slate", "gray", "zinc", "neutral", "stone"] as const
const HUES = [
  "red", "orange", "amber", "yellow", "lime", "green", "emerald", "teal", "cyan",
  "sky", "blue", "indigo", "violet", "purple", "fuchsia", "pink", "rose",
] as const
const SHADES = ["50", "100", "200", "300", "400", "500", "600", "700", "800", "900", "950"] as const
type Shade = (typeof SHADES)[number]

/** Espejo de grises: el fondo 950 pasa a blanco puro y el texto 50 a casi negro. */
const NEUTRAL_MIRROR: Record<Shade, Shade> = {
  "50": "950", "100": "900", "200": "800", "300": "700", "400": "600",
  // 600 → 500 y no 400: en claro el gris "más apagado" igual tiene que leerse (4,8:1 sobre blanco).
  "500": "500", "600": "500", "700": "300", "800": "200", "900": "100", "950": "50",
}

/** Tonos pálidos (pensados como texto sobre negro) → tonos que leen sobre blanco. */
const HUE_LIGHT: Record<Shade, Shade> = {
  "50": "900", "100": "800", "200": "800", "300": "700", "400": "600",
  // 500 → 600: ámbar, verde o cian 500 como texto sobre blanco no llegan a 3:1.
  "500": "600", "600": "700", "700": "700", "800": "800", "900": "900", "950": "950",
}

/** Fondos sólidos que mantienen texto blanco y contenido original en tema claro. */
const SOLID_SHADES = ["500", "600", "700", "800", "900", "950"] as const

export function hexToChannels(hex: string): string {
  const h = hex.replace("#", "")
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h
  const n = parseInt(full, 16)
  return `${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255}`
}

const palette = colors as unknown as Record<string, Record<Shade, string>>
const varName = (color: string, shade?: string) => `--tw-${color}${shade ? `-${shade}` : ""}`

/** Negro de marca (`bg-novamente-black`): #121212 en oscuro, casi blanco en claro. */
export const novamenteBlack = `rgb(var(${varName("novamente-black")}) / <alpha-value>)`

/** `theme.extend.colors`: cada color de la paleta lee su variable. */
export function themedColors(): Record<string, string | Record<string, string>> {
  const out: Record<string, string | Record<string, string>> = {
    white: `rgb(var(${varName("white")}) / <alpha-value>)`,
    black: `rgb(var(${varName("black")}) / <alpha-value>)`,
  }
  for (const color of [...NEUTRALS, ...HUES]) {
    out[color] = Object.fromEntries(
      SHADES.map((s) => [s, `rgb(var(${varName(color, s)}) / <alpha-value>)`]),
    )
  }
  return out
}

/** Valores originales de Tailwind (tema oscuro y alcances fijos). */
export function originalVars(): Record<string, string> {
  const vars: Record<string, string> = {
    [varName("white")]: "255 255 255",
    [varName("black")]: "0 0 0",
    [varName("novamente-black")]: "18 18 18",
  }
  for (const color of [...NEUTRALS, ...HUES]) {
    for (const s of SHADES) vars[varName(color, s)] = hexToChannels(palette[color][s])
  }
  return vars
}

/** Valores del tema claro. */
export function lightVars(): Record<string, string> {
  const vars: Record<string, string> = {
    [varName("white")]: hexToChannels(colors.zinc[950]),
    [varName("black")]: "255 255 255",
    [varName("novamente-black")]: "250 250 250",
  }
  for (const color of NEUTRALS) {
    for (const s of SHADES) {
      // El fondo de página (950) va a blanco puro, no al gris 50.
      vars[varName(color, s)] = s === "950" ? "255 255 255" : hexToChannels(palette[color][NEUTRAL_MIRROR[s]])
    }
  }
  for (const color of HUES) {
    for (const s of SHADES) vars[varName(color, s)] = hexToChannels(palette[color][HUE_LIGHT[s]])
  }
  return vars
}

/** Selectores que conservan los colores originales dentro del tema claro. */
export function originalColorScopes(): string[] {
  const selectors = [".dark", ".theme-fixed"]
  // Fondos de marca sólidos (shadcn y novamente-*): texto blanco encima.
  for (const token of ["primary", "accent", "destructive", "novamente-purple", "novamente-magenta", "novamente-blue"]) {
    selectors.push(`[class~="bg-${token}"]`, `[class~="from-${token}"]`)
  }
  for (const color of HUES) {
    for (const s of SOLID_SHADES) {
      selectors.push(`[class~="bg-${color}-${s}"]`, `[class~="from-${color}-${s}"]`)
    }
  }
  return selectors
}
