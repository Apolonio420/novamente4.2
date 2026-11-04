import { describe, it, expect } from 'vitest'
import {
  colorLabelFor,
  isAldeaWashAzul,
  resolveAldeaColorAlias,
  sizeChartFor,
  sizeChartImageFor,
  WASH_AZUL_SIZE_CHART,
  WASH_AZUL_SIZE_CHART_IMAGE,
} from './aldea-wash-azul'
import { resolveGarmentTemplate } from '@/app/crear/garment-templates'
import { PRODUCTS } from './products'
import fs from 'node:fs'
import path from 'node:path'

const ALDEA = 'aldea-classic-tshirt'

describe('colorLabelFor', () => {
  it('Aldea + stone-wash => "Wash Azul"', () => {
    expect(colorLabelFor(ALDEA, 'stone-wash', 'Stone Wash')).toBe('Wash Azul')
  })
  it('Aura / Berlin / Boston / hoodie siguen "Stone Wash"', () => {
    for (const g of ['aura-oversize-tshirt', 'buzo-hoodie-unisex', 'buzo-cuello-redondo-unisex', 'otra']) {
      expect(colorLabelFor(g, 'stone-wash', 'Stone Wash')).toBe('Stone Wash')
    }
  })
  it('otros colores de la Aldea no cambian', () => {
    expect(colorLabelFor(ALDEA, 'black', 'Negro')).toBe('Negro')
    expect(colorLabelFor(undefined, 'stone-wash', 'Stone Wash')).toBe('Stone Wash')
  })
})

describe('alias de entrada', () => {
  it('Aldea: wash azul / wash-azul / wash_azul / stone wash => stone-wash', () => {
    for (const raw of ['wash azul', 'Wash Azul', 'wash-azul', 'wash_azul', 'Stone Wash', 'stone-wash']) {
      expect(resolveAldeaColorAlias(ALDEA, raw)).toBe('stone-wash')
    }
  })
  it('otras prendas: no se toca', () => {
    expect(resolveAldeaColorAlias('aura-oversize-tshirt', 'wash azul')).toBe('wash azul')
    expect(resolveAldeaColorAlias('aura-oversize-tshirt', 'Stone Wash')).toBe('Stone Wash')
  })
  it('Aldea: otros colores intactos', () => {
    expect(resolveAldeaColorAlias(ALDEA, 'negro')).toBe('negro')
  })
  it('garment-templates: "wash azul" en la Aldea resuelve el template stone-wash', () => {
    const c = resolveGarmentTemplate(ALDEA, 'wash azul', 'front')
    expect(c[0]).toBe('/garments/tshirt-stone-wash-classic-front.jpeg')
    expect(resolveGarmentTemplate(ALDEA, 'wash_azul', 'back')[0]).toBe('/garments/tshirt-stone-wash-classic-back.jpeg')
    expect(resolveGarmentTemplate(ALDEA, 'stone_wash', 'front')[0]).toBe('/garments/tshirt-stone-wash-classic-front.jpeg')
  })
})

describe('guía de talles por color', () => {
  const base = { sizes: ['S', 'M', 'L', 'XL', 'XXL'], width: ['48', '52', '56', '58', '60'], length: ['63', '68', '72', '75', '77'] }
  it('Aldea stone-wash => tabla Wash Azul (S 56/72 ... 2XL 66/80)', () => {
    const t = sizeChartFor(ALDEA, 'stone-wash', base)
    expect(t).toBe(WASH_AZUL_SIZE_CHART)
    expect(t.sizes).toEqual(['S', 'M', 'L', 'XL', '2XL'])
    expect(t.width).toEqual(['56', '58', '60', '63', '66'])
    expect(t.length).toEqual(['72', '74', '76', '78', '80'])
  })
  it('Aldea blanco/negro/beige y otras prendas conservan la tabla base', () => {
    for (const c of ['black', 'white', 'beige']) expect(sizeChartFor(ALDEA, c, base)).toBe(base)
    expect(sizeChartFor('aura-oversize-tshirt', 'stone-wash', base)).toBe(base)
  })
  it('imagen de medidas solo cambia para Wash Azul y el archivo existe', () => {
    expect(sizeChartImageFor(ALDEA, 'stone-wash', 'x.png')).toBe(WASH_AZUL_SIZE_CHART_IMAGE)
    expect(sizeChartImageFor(ALDEA, 'black', 'x.png')).toBe('x.png')
    expect(sizeChartImageFor('aura-oversize-tshirt', 'stone-wash', 'x.png')).toBe('x.png')
    expect(isAldeaWashAzul(ALDEA, 'stone-wash')).toBe(true)
    expect(fs.existsSync(path.join(process.cwd(), 'public', WASH_AZUL_SIZE_CHART_IMAGE))).toBe(true)
  })
  it('el producto PDP de la Aldea stone wash usa la imagen nueva; blanco/negro/beige no', () => {
    const sw = PRODUCTS.find((p) => p.id === 'aldea-tshirt-stone-wash')!
    expect(sw.images.measurements).toBe(WASH_AZUL_SIZE_CHART_IMAGE)
    for (const p of PRODUCTS.filter((x) => x.id.startsWith('aldea-tshirt') && x.id !== sw.id)) {
      expect(p.images.measurements).not.toBe(WASH_AZUL_SIZE_CHART_IMAGE)
    }
  })
})
