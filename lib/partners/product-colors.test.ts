import { describe, it, expect } from 'vitest'
import {
  buildPartnerColorEntry,
  parsePartnerProductColors,
  resolveInitialSelectedColor,
  requiresColorSelection,
  isColorSelectionMissing,
  garmentRequiresColorChoice,
  productHasColorInfo,
} from './product-colors'

// aldea-classic-tshirt: black/white/beige/stone-wash (lib/catalog/products.ts)
const GARMENT = 'aldea-classic-tshirt'

describe('buildPartnerColorEntry', () => {
  it('resuelve name/hex desde el catálogo a partir de garmentKey + colorKey', () => {
    const entry = buildPartnerColorEntry(GARMENT, 'stone-wash', { front: 'f.jpg', back: 'b.jpg' })
    expect(entry).toEqual({ key: 'stone-wash', name: 'Stone Wash', hex: '#9a9085', images: { front: 'f.jpg', back: 'b.jpg' } })
  })

  it('si el color no matchea el catálogo, cae al key tal cual como name (no lo esconde)', () => {
    const entry = buildPartnerColorEntry(GARMENT, 'no-existe', { front: 'f.jpg', back: 'b.jpg' })
    expect(entry.name).toBe('no-existe')
    expect(entry.key).toBe('no-existe')
  })
})

describe('parsePartnerProductColors', () => {
  it('formato rico { name, hex, images } pasa derecho', () => {
    const out = parsePartnerProductColors(GARMENT, [{ name: 'Blanco', hex: '#f5f5f5', images: { front: 'f' } }])
    expect(out).toEqual([{ name: 'Blanco', code: '#f5f5f5', key: undefined, images: { front: 'f', back: undefined } }])
  })

  it('BUG la-blancq: { key, images } SIN name se resuelve contra el catálogo', () => {
    const out = parsePartnerProductColors(GARMENT, [{ key: 'stone-wash', images: { front: 'f', back: 'b' } }])
    expect(out).toEqual([{ name: 'Stone Wash', code: '#9a9085', key: 'stone-wash', images: { front: 'f', back: 'b' } }])
  })

  it('{ key } sin garmentKey o sin match en el catálogo: usa el key como name en vez de ocultar el color', () => {
    const out = parsePartnerProductColors(undefined, [{ key: 'misterioso' }])
    expect(out).toEqual([{ name: 'misterioso', code: '#000000', key: 'misterioso', images: undefined }])
  })

  it('sin colors[] pero con available_colors legacy, usa el legacy', () => {
    const out = parsePartnerProductColors(GARMENT, undefined, [{ name: 'Negro', code: '#111' }])
    expect(out).toEqual([{ name: 'Negro', code: '#111' }])
  })

  it('sin ningún dato de color, devuelve []', () => {
    expect(parsePartnerProductColors(GARMENT, undefined, undefined)).toEqual([])
    expect(parsePartnerProductColors(GARMENT, [], [])).toEqual([])
  })

  it('entradas inválidas (sin name ni key) se descartan sin romper el resto', () => {
    const out = parsePartnerProductColors(GARMENT, [{ foo: 'bar' }, { name: 'Blanco' }])
    expect(out).toEqual([{ name: 'Blanco', code: '#000000', key: undefined, images: undefined }])
  })
})

describe('resolveInitialSelectedColor', () => {
  it('con 1 solo color, lo preselecciona', () => {
    expect(resolveInitialSelectedColor([{ name: 'Blanco' }])).toBe('Blanco')
  })

  it('con 2+ colores, NO preselecciona nada (fuerza elección) aunque haya defaultColor', () => {
    expect(resolveInitialSelectedColor([{ name: 'Blanco' }, { name: 'Negro' }], 'Negro')).toBe('')
  })

  it('sin colores definidos, cae a defaultColor (metadata.color singular)', () => {
    expect(resolveInitialSelectedColor(undefined, 'Negro')).toBe('Negro')
    expect(resolveInitialSelectedColor([], 'Negro')).toBe('Negro')
  })

  it('sin colores ni defaultColor, devuelve string vacío', () => {
    expect(resolveInitialSelectedColor(undefined, undefined)).toBe('')
  })
})

describe('requiresColorSelection / isColorSelectionMissing', () => {
  it('requiresColorSelection solo es true con 2+ opciones', () => {
    expect(requiresColorSelection(undefined)).toBe(false)
    expect(requiresColorSelection([])).toBe(false)
    expect(requiresColorSelection([{ name: 'Blanco' }])).toBe(false)
    expect(requiresColorSelection([{ name: 'Blanco' }, { name: 'Negro' }])).toBe(true)
  })

  it('isColorSelectionMissing: bloquea con 2+ opciones y nada elegido', () => {
    const dosColores = [{ name: 'Blanco' }, { name: 'Negro' }]
    expect(isColorSelectionMissing(dosColores, '')).toBe(true)
    expect(isColorSelectionMissing(dosColores, undefined)).toBe(true)
    expect(isColorSelectionMissing(dosColores, 'Negro')).toBe(false)
  })

  it('isColorSelectionMissing: con 0 o 1 color nunca bloquea', () => {
    expect(isColorSelectionMissing(undefined, '')).toBe(false)
    expect(isColorSelectionMissing([{ name: 'Blanco' }], '')).toBe(false)
  })
})

describe('garmentRequiresColorChoice', () => {
  it('prenda del catálogo con colores → true', () => {
    expect(garmentRequiresColorChoice(GARMENT)).toBe(true)
  })

  it('sin garmentKey → false (láminas/lienzos/accesorios sin garment asociado)', () => {
    expect(garmentRequiresColorChoice(undefined)).toBe(false)
    expect(garmentRequiresColorChoice(null)).toBe(false)
    expect(garmentRequiresColorChoice('')).toBe(false)
  })

  it('garmentKey que no existe en el catálogo → false (no bloquea por las dudas)', () => {
    expect(garmentRequiresColorChoice('no-existe-en-el-catalogo')).toBe(false)
  })
})

describe('productHasColorInfo', () => {
  it('sin metadata → false', () => {
    expect(productHasColorInfo(null)).toBe(false)
    expect(productHasColorInfo(undefined)).toBe(false)
  })

  it('metadata.colors[] con name → true', () => {
    expect(productHasColorInfo({ colors: [{ name: 'Blanco' }] })).toBe(true)
  })

  it('metadata.colors[] solo con key (bug from-design) → true (cuenta como "tiene color")', () => {
    expect(productHasColorInfo({ colors: [{ key: 'white' }] })).toBe(true)
  })

  it('metadata.colors[] vacío, sin legacy, sin singular → false', () => {
    expect(productHasColorInfo({ colors: [] })).toBe(false)
  })

  it('metadata.available_colors legacy → true', () => {
    expect(productHasColorInfo({ available_colors: [{ name: 'Negro', code: '#111' }] })).toBe(true)
  })

  it('metadata.color singular → true', () => {
    expect(productHasColorInfo({ color: 'Negro' })).toBe(true)
    expect(productHasColorInfo({ color: '   ' })).toBe(false)
  })

  it('metadata sin ningún campo de color → false', () => {
    expect(productHasColorInfo({ garmentKey: GARMENT, sizes: ['S', 'M'] })).toBe(false)
  })
})
