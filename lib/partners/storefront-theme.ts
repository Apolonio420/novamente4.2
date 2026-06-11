/**
 * Temas reales del storefront del partner.
 *
 * Cada `visual_style` del tenant deja de ser una clase decorativa y pasa a
 * definir tipografía, tratamiento del hero, radios y estilos de sección.
 * Server-safe (sin hooks) — se consume desde Server Components.
 */
import type { VisualStyle } from './types'

export interface StorefrontTheme {
  /** Clases para el H1 del hero */
  heroTitle: string
  /** Clases para el tagline bajo el título */
  heroTagline: string
  /** Clases para títulos de sección */
  sectionTitle: string
  /** Radio de tarjetas/imágenes */
  radius: string
  /** Clases del botón primario (el color viene por CSS var) */
  buttonPrimary: string
  /** Overlay del hero sobre la imagen */
  heroOverlay: string
  /** Altura mínima del hero (mobile-first) */
  heroHeight: string
}

const THEMES: Record<VisualStyle, StorefrontTheme> = {
  minimal: {
    heroTitle: 'font-light tracking-[0.25em] uppercase',
    heroTagline: 'font-light tracking-widest text-sm uppercase',
    sectionTitle: 'font-light tracking-[0.2em] uppercase text-xl md:text-2xl',
    radius: 'rounded-none',
    buttonPrimary: 'rounded-none tracking-widest uppercase text-xs font-medium',
    heroOverlay: 'bg-black/45',
    heroHeight: 'min-h-[55svh] md:min-h-[60vh]',
  },
  bold: {
    heroTitle: 'font-black tracking-tight uppercase',
    heroTagline: 'font-bold tracking-wide uppercase text-base',
    sectionTitle: 'font-black uppercase tracking-tight text-2xl md:text-3xl',
    radius: 'rounded-2xl',
    buttonPrimary: 'rounded-full font-bold uppercase tracking-wide',
    heroOverlay: 'bg-gradient-to-t from-black/80 via-black/30 to-black/20',
    heroHeight: 'min-h-[65svh] md:min-h-[70vh]',
  },
  editorial: {
    heroTitle: 'font-serif font-medium tracking-normal',
    heroTagline: 'font-serif italic text-base md:text-lg',
    sectionTitle: 'font-serif font-medium text-2xl md:text-3xl',
    radius: 'rounded-sm',
    buttonPrimary: 'rounded-sm font-serif tracking-wide',
    heroOverlay: 'bg-gradient-to-b from-black/30 via-black/40 to-black/70',
    heroHeight: 'min-h-[60svh] md:min-h-[65vh]',
  },
  sport: {
    heroTitle: 'font-extrabold italic tracking-tighter uppercase',
    heroTagline: 'font-semibold italic tracking-wide uppercase text-sm',
    sectionTitle: 'font-extrabold italic uppercase tracking-tight text-2xl md:text-3xl',
    radius: 'rounded-xl',
    buttonPrimary: 'rounded-lg font-extrabold italic uppercase',
    heroOverlay: 'bg-gradient-to-tr from-black/75 via-black/35 to-transparent',
    heroHeight: 'min-h-[60svh] md:min-h-[65vh]',
  },
  corporate: {
    heroTitle: 'font-semibold tracking-tight',
    heroTagline: 'font-normal text-base text-white/85',
    sectionTitle: 'font-semibold tracking-tight text-2xl',
    radius: 'rounded-lg',
    buttonPrimary: 'rounded-md font-medium',
    heroOverlay: 'bg-gradient-to-r from-black/70 via-black/45 to-black/25',
    heroHeight: 'min-h-[50svh] md:min-h-[55vh]',
  },
  urbano: {
    heroTitle: 'font-black uppercase tracking-[0.08em]',
    heroTagline: 'font-mono uppercase tracking-widest text-xs md:text-sm',
    sectionTitle: 'font-black uppercase tracking-wide text-2xl md:text-3xl',
    radius: 'rounded-md',
    buttonPrimary: 'rounded-none font-bold uppercase tracking-widest text-xs border-2 border-white/20',
    heroOverlay: 'bg-gradient-to-t from-black/85 via-black/40 to-black/30',
    heroHeight: 'min-h-[65svh] md:min-h-[75vh]',
  },
  creativo: {
    heroTitle: 'font-extrabold tracking-tight',
    heroTagline: 'font-medium text-base',
    sectionTitle: 'font-extrabold tracking-tight text-2xl md:text-3xl',
    radius: 'rounded-3xl',
    buttonPrimary: 'rounded-full font-semibold',
    heroOverlay: 'bg-gradient-to-br from-black/55 via-black/35 to-black/55',
    heroHeight: 'min-h-[60svh] md:min-h-[65vh]',
  },
}

export function getStorefrontTheme(style: string | null | undefined): StorefrontTheme {
  return THEMES[(style as VisualStyle) || 'minimal'] ?? THEMES.minimal
}

/** Convierte #rrggbb → "H S% L%" (formato de los tokens shadcn en globals.css). */
function hexToHslTriplet(hex: string): string | null {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim())
  if (!m) return null
  const n = parseInt(m[1], 16)
  const r = ((n >> 16) & 255) / 255
  const g = ((n >> 8) & 255) / 255
  const b = (n & 255) / 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2
  let h = 0
  let s = 0
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6
    else if (max === g) h = ((b - r) / d + 2) / 6
    else h = ((r - g) / d + 4) / 6
  }
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`
}

/** Vars CSS de marca para inyectar en el wrapper de la tienda. */
export function brandCssVars(tenant: {
  primary_color?: string | null
  secondary_color?: string | null
  accent_color?: string | null
}): Record<string, string> {
  const primary = tenant.primary_color || '#6366f1'
  const vars: Record<string, string> = {
    '--store-primary': primary,
    '--store-secondary': tenant.secondary_color || '#111827',
    '--store-accent': tenant.accent_color || primary,
  }
  // Pisar el token --primary de shadcn dentro de la tienda: precios, botones
  // y rings de ProductCard adoptan el color de la MARCA (no el violeta Novamente)
  const triplet = hexToHslTriplet(primary)
  if (triplet) vars['--primary'] = triplet
  return vars
}
