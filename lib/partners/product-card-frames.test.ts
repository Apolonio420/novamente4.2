import { describe, it, expect } from 'vitest'
import { isBackOnlyPrint, resolveDisplayImages } from './product-card-frames'

const FRONT = '/api/proxy-image?key=x-black-front.jpg'
const BACK = '/api/proxy-image?key=x-black-back.jpg'
const EXTRA = '/api/proxy-image?key=lifestyle.jpg'
const DESIGN = { designUrl: '/api/proxy-image?key=design.png' }

describe('isBackOnlyPrint', () => {
  it('true solo con diseño atrás y frente liso', () => {
    expect(isBackOnlyPrint({ print: { front: null, back: DESIGN } })).toBe(true)
    expect(isBackOnlyPrint({ print: { front: DESIGN, back: DESIGN } })).toBe(false)
    expect(isBackOnlyPrint({ print: { front: DESIGN, back: null } })).toBe(false)
    expect(isBackOnlyPrint({})).toBe(false)
    expect(isBackOnlyPrint(null)).toBe(false)
  })
})

describe('resolveDisplayImages', () => {
  // Pedido La blancq 03/10: con estampa solo atrás la portada era el frente liso.
  it('solo espalda: el dorso va primero', () => {
    const r = resolveDisplayImages({ images: [FRONT, BACK, EXTRA], metadata: { print: { front: null, back: DESIGN } } })
    expect(r).toEqual({ images: [BACK, FRONT, EXTRA], backFirst: true })
  })

  it('con frente estampado: orden de siempre', () => {
    const r = resolveDisplayImages({ images: [FRONT, BACK, EXTRA], metadata: { print: { front: DESIGN, back: null } } })
    expect(r).toEqual({ images: [FRONT, BACK, EXTRA], backFirst: false })
  })

  it('sin metadata.print (productos legacy): orden de siempre', () => {
    expect(resolveDisplayImages({ images: [FRONT, BACK] })).toEqual({ images: [FRONT, BACK], backFirst: false })
  })

  it('solo espalda con dorso en metadata.colors: también lo pone primero', () => {
    const r = resolveDisplayImages({
      images: [FRONT],
      metadata: { print: { back: DESIGN }, colors: [{ key: 'black', images: { front: FRONT, back: BACK } }] },
    })
    expect(r.images).toEqual([BACK, FRONT])
    expect(r.backFirst).toBe(true)
  })

  it('una sola foto: no inventa nada', () => {
    expect(resolveDisplayImages({ images: [FRONT], metadata: { print: { back: DESIGN } } })).toEqual({ images: [FRONT], backFirst: false })
  })
})
