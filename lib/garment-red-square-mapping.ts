// ---------------------------------------------------------------------------
// novamente4.2 — legacy adapter over @novamente/catalog.
//
// Before: this file contained a hardcoded mapping of 60+ red-square PNGs
// and its own shape system. Now: resolves everything through the shared
// @novamente/catalog package. The exported function signatures are kept
// unchanged so callers (generate-stamp route, StampSizeSelector, tests)
// don't need to know the catalog exists yet.
//
// Migration target: once callers switch to resolveAssets() from
// @novamente/catalog directly, this file can be deleted.
// ---------------------------------------------------------------------------

import {
  resolveAssets,
  getRenderableProducts,
  CatalogError,
  type ColorId,
  type Side,
  type StampSize,
  type StampPosition,
} from '@novamente/catalog'

// Public types kept for backwards compatibility with current callers.
export type GarmentType = 'hoodie' | 'tshirt'
export type GarmentVariant = 'classic' | 'oversize'
export type GarmentColor = 'black' | 'gray' | 'caramel' | 'white' | 'cream' | 'model'
export type GarmentSide = Side
export { type StampSize, type StampPosition } from '@novamente/catalog'

export interface RedSquareGarment {
  id: string
  type: GarmentType
  variant: GarmentVariant
  color: GarmentColor
  side: GarmentSide
  size: StampSize
  position?: StampPosition
  imagePath: string
}

/**
 * Translate the legacy (type, variant, color) triple to a productKey.
 * - hoodie                → buzo-hoodie-unisex
 * - tshirt + classic      → aldea-classic-tshirt
 * - tshirt + oversize     → aura-oversize-tshirt
 */
function legacyToProductKey(type: GarmentType, variant: GarmentVariant): string {
  if (type === 'hoodie') return 'buzo-hoodie-unisex'
  return variant === 'classic' ? 'aldea-classic-tshirt' : 'aura-oversize-tshirt'
}

function normalizeColor(color: GarmentColor): ColorId {
  if (color === 'model') return 'black' // legacy placeholder
  return color as ColorId
}

export function getRedSquareGarmentImage(
  type: GarmentType,
  variant: GarmentVariant,
  color: GarmentColor,
  side: GarmentSide,
  size: StampSize,
  position?: StampPosition,
): string | null {
  try {
    const r = resolveAssets({
      productKey: legacyToProductKey(type, variant),
      color: normalizeColor(color),
      side,
      stampSize: size,
      stampPosition: position,
    })
    return r.redSquarePath
  } catch (e) {
    if (e instanceof CatalogError) {
      console.warn(`[garment-red-square-mapping] ${e.code}: ${e.message}`)
      return null
    }
    throw e
  }
}

export function getAvailableRedSquareOptions(
  type: GarmentType,
  variant: GarmentVariant,
  color: GarmentColor,
  side: GarmentSide,
): Array<{ size: StampSize; position?: StampPosition; imagePath: string }> {
  const options: Array<{ size: StampSize; position?: StampPosition; imagePath: string }> = []

  // R1: front has center/left, back has single default
  if (side === 'front') {
    const r1C = getRedSquareGarmentImage(type, variant, color, side, 'R1', 'center')
    if (r1C) options.push({ size: 'R1', position: 'center', imagePath: r1C })
    const r1L = getRedSquareGarmentImage(type, variant, color, side, 'R1', 'left')
    if (r1L) options.push({ size: 'R1', position: 'left', imagePath: r1L })
  } else {
    const r1 = getRedSquareGarmentImage(type, variant, color, side, 'R1')
    if (r1) options.push({ size: 'R1', imagePath: r1 })
  }

  // R2
  const r2 = getRedSquareGarmentImage(type, variant, color, side, 'R2')
  if (r2) options.push({ size: 'R2', imagePath: r2 })

  // R3 — only where mold supports it (tshirt, hoodie back)
  if (type === 'tshirt' || (type === 'hoodie' && side === 'back')) {
    const r3 = getRedSquareGarmentImage(type, variant, color, side, 'R3')
    if (r3) options.push({ size: 'R3', imagePath: r3 })
  }

  return options
}

export function getBaseGarmentImage(
  type: GarmentType,
  variant: GarmentVariant,
  color: GarmentColor,
  side: GarmentSide,
): string {
  try {
    const r = resolveAssets({
      productKey: legacyToProductKey(type, variant),
      color: normalizeColor(color),
      side,
      stampSize: 'R2', // any valid size — we only care about baseGarmentPath
    })
    return r.baseGarmentPath
  } catch {
    // Fallback to the legacy filename convention for callers that hit edge cases.
    const sideCode = side === 'front' ? 'front' : 'back'
    const ext = color === 'caramel' || color === 'cream' || color === 'gray' ? 'png' : 'jpeg'
    if (type === 'hoodie') return `/garments/hoodie-${color}-${sideCode}.${ext}`
    return `/garments/tshirt-${color}-${variant}-${sideCode}.${ext}`
  }
}

/** Re-export for new callers that want to browse the full catalog directly. */
export { getRenderableProducts }
