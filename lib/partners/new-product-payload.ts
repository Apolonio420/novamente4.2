/**
 * Fase 3 pieza C — lógica pura del panel "Nuevo producto" (sin React, sin
 * fetch) para poder testearla con vitest: armado del payload que va a
 * `POST /api/partners/products/from-design` y validación de precio en vivo
 * en el cliente (el servidor es la fuente de verdad — ver
 * `lib/partners/product-policy.ts` — esto es solo feedback inmediato en la UI).
 */
import type { MockupPlacement, MockupSide, MockupSize } from '@/lib/mockup/compose'

export const MIN_PRODUCT_PRICE_ARS = 1000

export interface SidePick {
  designUrl: string | null
  size: MockupSize
  placement: MockupPlacement
}

export interface NewProductFormState {
  name: string
  price: string
  garmentKey: string
  colors: string[]
  front: SidePick | null
  back: SidePick | null
  status: 'draft' | 'published'
  description?: string
  category?: string
}

export interface FromDesignPayload {
  name: string
  price: number
  garmentKey: string
  colors: string[]
  front: { designUrl?: string; size?: MockupSize; placement?: MockupPlacement } | null
  back: { designUrl?: string; size?: MockupSize; placement?: MockupPlacement } | null
  status: 'draft' | 'published'
  description?: string
  category?: string
}

/**
 * Un lado "cuenta" (viaja al payload) solo si tiene diseño propio. Sin
 * diseño, `from-design` ya renderiza la prenda lisa de ese lado — no hace
 * falta (ni corresponde) mandar un objeto vacío.
 */
function sideToPayload(side: SidePick | null): FromDesignPayload['front'] {
  if (!side || !side.designUrl) return null
  return { designUrl: side.designUrl, size: side.size, placement: side.placement }
}

export function buildFromDesignPayload(state: NewProductFormState): FromDesignPayload {
  return {
    name: state.name.trim(),
    price: Math.round(Number(state.price) || 0),
    garmentKey: state.garmentKey,
    colors: state.colors,
    front: sideToPayload(state.front),
    back: sideToPayload(state.back),
    status: state.status,
    ...(state.description ? { description: state.description } : {}),
    ...(state.category ? { category: state.category } : {}),
  }
}

export interface PriceValidation {
  ok: boolean
  reason: string | null
}

/**
 * Validación en vivo del precio (feedback inmediato mientras el partner
 * tipea). `minCost` es el piso de costo real de la prenda elegida (viene del
 * catálogo de precios que ya carga /workspace/catalog, `garmentPricing`); si
 * no se conoce todavía, solo se valida el piso general de $1000. El servidor
 * SIEMPRE vuelve a validar ambas cosas en `from-design` — esto no reemplaza
 * esa validación, solo evita que el partner llegue al submit con un precio
 * que ya sabemos que va a rebotar.
 */
export function validatePriceLive(price: string, minCost?: number | null): PriceValidation {
  const n = Number(price)
  if (!price.trim() || Number.isNaN(n) || n <= 0) {
    return { ok: false, reason: 'Ingresá un precio' }
  }
  if (n < MIN_PRODUCT_PRICE_ARS) {
    return { ok: false, reason: `El precio mínimo es $${MIN_PRODUCT_PRICE_ARS.toLocaleString('es-AR')}` }
  }
  if (typeof minCost === 'number' && minCost > 0 && n <= minCost) {
    return { ok: false, reason: `El precio tiene que superar el costo ($${minCost.toLocaleString('es-AR')})` }
  }
  return { ok: true, reason: null }
}

export function suggestProductName(designLabel: string | null, garmentName: string | null): string {
  if (designLabel && garmentName) return `${designLabel} · ${garmentName}`
  return garmentName || designLabel || ''
}

/**
 * "mi_diseño-FINAL (2).png" → "Mi Diseño FINAL (2)" — para sugerir el nombre
 * del producto a partir del archivo que subió el partner. Saca la
 * extensión, cambia guiones/guiones bajos por espacios y capitaliza cada
 * palabra (sin tocar las que ya vienen en mayúsculas, tipo siglas).
 */
export function prettifyDesignFileName(fileName: string): string {
  const base = fileName.replace(/\.[^./\\]+$/, '')
  const cleaned = base
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  if (!cleaned) return ''
  return cleaned
    .split(' ')
    .map((w) => (w === w.toUpperCase() ? w : w.charAt(0).toUpperCase() + w.slice(1)))
    .join(' ')
}
