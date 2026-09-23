// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { validateFrontAndBackForPublish, MISSING_SIDES_ERROR } from '@/lib/partners/product-sides'

describe('validateFrontAndBackForPublish — E3 (frente y dorso siempre)', () => {
  it('rechaza sin imágenes', () => {
    const r = validateFrontAndBackForPublish([], null)
    expect(r.ok).toBe(false)
    expect(r.reason).toBe(MISSING_SIDES_ERROR)
  })

  it('rechaza con una sola imagen', () => {
    const r = validateFrontAndBackForPublish(['https://x/front.jpg'], null)
    expect(r.ok).toBe(false)
  })

  it('acepta con 2 imágenes y sin metadata.colors', () => {
    const r = validateFrontAndBackForPublish(['https://x/front.jpg', 'https://x/back.jpg'], null)
    expect(r.ok).toBe(true)
  })

  it('rechaza si algún color tiene front pero no back', () => {
    const r = validateFrontAndBackForPublish(
      ['https://x/front.jpg', 'https://x/back.jpg'],
      [
        { key: 'black', images: { front: 'https://x/black-front.jpg', back: 'https://x/black-back.jpg' } },
        { key: 'white', images: { front: 'https://x/white-front.jpg' } },
      ],
    )
    expect(r.ok).toBe(false)
    expect(r.reason).toBe(MISSING_SIDES_ERROR)
  })

  it('acepta cuando todos los colores tienen front y back', () => {
    const r = validateFrontAndBackForPublish(
      ['https://x/front.jpg', 'https://x/back.jpg'],
      [
        { key: 'black', images: { front: 'https://x/black-front.jpg', back: 'https://x/black-back.jpg' } },
        { key: 'white', images: { front: 'https://x/white-front.jpg', back: 'https://x/white-back.jpg' } },
      ],
    )
    expect(r.ok).toBe(true)
  })

  it('ignora colores vacíos ([])', () => {
    const r = validateFrontAndBackForPublish(['https://x/front.jpg', 'https://x/back.jpg'], [])
    expect(r.ok).toBe(true)
  })
})
