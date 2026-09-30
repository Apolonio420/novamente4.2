/**
 * Alta de color "Beige" para Aldea Classic Fit T-Shirt (mismo talle S–XXL
 * y mismo precio que negro/blanco/stone wash). Verifica los puntos de
 * integración tocados: catálogo web (lib/products.ts), catálogo fuente
 * única (lib/catalog/products.ts) y mapeo de área de impresión
 * (lib/garment-mappings.json).
 */
import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { PRODUCTS } from '@/lib/products'
import { CATALOG_PRODUCTS } from '@/lib/catalog/products'
import { getGarmentMapping } from '@/lib/garment-mappings'

describe('Aldea Classic Fit T-Shirt — Beige', () => {
  it('lib/products.ts tiene la entrada B2C con el mismo precio que el resto de la línea', () => {
    const product = PRODUCTS.find((p) => p.id === 'aldea-tshirt-beige')
    expect(product).toBeDefined()
    expect(product?.name).toBe('Aldea Classic Fit T-Shirt - Beige')
    expect(product?.price).toBe('$28.600')
    expect(product?.color).toBe('Beige')
    expect(product?.available).toBe(true)
  })

  it('lib/catalog/products.ts (fuente única) tiene el color beige con thumbnail existente en public/', () => {
    const aldea = CATALOG_PRODUCTS.find((p) => p.key === 'aldea-classic-tshirt')
    expect(aldea).toBeDefined()
    const beige = aldea?.colors.find((c) => c.key === 'beige')
    expect(beige).toBeDefined()
    expect(beige?.name).toBe('Beige')
    expect(beige?.thumbnail).toBeTruthy()
    expect(beige?.hero).toBeTruthy()
    const thumbPath = path.join(process.cwd(), 'public', beige!.thumbnail!.replace(/^\//, ''))
    const heroPath = path.join(process.cwd(), 'public', beige!.hero!.replace(/^\//, ''))
    expect(fs.existsSync(thumbPath)).toBe(true)
    expect(fs.existsSync(heroPath)).toBe(true)
  })

  it('garment-mappings tiene entradas reales (no fallback) de frente y dorso', () => {
    const front = getGarmentMapping('aldea-classic-tshirt', 'beige', 'front')
    const back = getGarmentMapping('aldea-classic-tshirt', 'beige', 'back')
    expect(front).not.toBeNull()
    expect(front!.id).not.toBe('fallback')
    expect(front!.garmentPath).toBe('/garments/tshirt-beige-classic-front.jpeg')
    expect(back).not.toBeNull()
    expect(back!.id).not.toBe('fallback')
    expect(back!.garmentPath).toBe('/garments/tshirt-beige-classic-back.jpeg')

    // Misma caja de impresión que el negro clásico (silueta idéntica: la base
    // beige es el negro reteñido pixel a pixel, ver garments std-bases).
    const blackFront = getGarmentMapping('aldea-classic-tshirt', 'black', 'front')
    const blackBack = getGarmentMapping('aldea-classic-tshirt', 'black', 'back')
    expect(front!.coordinates).toEqual(blackFront!.coordinates)
    expect(front!.margins).toEqual(blackFront!.margins)
    expect(back!.coordinates).toEqual(blackBack!.coordinates)
    expect(back!.margins).toEqual(blackBack!.margins)
  })
})
