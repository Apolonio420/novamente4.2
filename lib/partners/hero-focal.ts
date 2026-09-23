/**
 * Punto de foco del banner del hero (Fase 2 tiendas partner).
 *
 * `tenants.metadata.hero_focal = { x, y }` (0-100, porcentaje) alimenta el
 * `object-position` de la imagen del hero en /p/[slug], para que el partner
 * pueda elegir qué parte de su banner NO se recorta en mobile (auditoría:
 * 40/80 tiendas pierden ≥50% de la imagen con el crop centrado por default).
 */

export interface HeroFocal {
  x: number
  y: number
}

export const DEFAULT_HERO_FOCAL: HeroFocal = { x: 50, y: 50 }

/**
 * Valida y normaliza un `hero_focal` recibido del panel. Devuelve `null` si
 * el input no es un punto válido (no es objeto, falta x/y, no son números
 * finitos, o están fuera de 0-100) — el llamador decide qué hacer con `null`
 * (rechazar la request en la API, o usar el default en el render).
 */
export function parseHeroFocal(input: unknown): HeroFocal | null {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return null
  const { x, y } = input as Record<string, unknown>
  if (typeof x !== 'number' || typeof y !== 'number') return null
  if (!Number.isFinite(x) || !Number.isFinite(y)) return null
  if (x < 0 || x > 100 || y < 0 || y > 100) return null
  return { x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 }
}

/** `object-position` CSS a partir de `metadata.hero_focal` (o el default 50/50). */
export function heroFocalToObjectPosition(metadata: unknown): string {
  const raw = metadata && typeof metadata === 'object'
    ? (metadata as Record<string, unknown>).hero_focal
    : null
  const focal = parseHeroFocal(raw) || DEFAULT_HERO_FOCAL
  return `${focal.x}% ${focal.y}%`
}
