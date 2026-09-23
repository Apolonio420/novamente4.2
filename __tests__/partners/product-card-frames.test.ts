import { describe, it, expect } from 'vitest'
import { resolveCardFrames } from '@/lib/partners/product-card-frames'

describe('resolveCardFrames', () => {
  it('usa images[0]/images[1] cuando ya hay 2 imágenes distintas', () => {
    const frames = resolveCardFrames({ images: ['front.jpg', 'back.jpg'] })
    expect(frames).toEqual({ front: 'front.jpg', back: 'back.jpg', hasBack: true })
  })

  it('sin dorso, si images tiene 1 sola foto y no hay metadata.colors', () => {
    const frames = resolveCardFrames({ images: ['front.jpg'] })
    expect(frames).toEqual({ front: 'front.jpg', back: null, hasBack: false })
  })

  it('cae a metadata.colors[].images.back cuando images[] no trae dorso (from-design, color != primero)', () => {
    const frames = resolveCardFrames({
      images: ['front-black.jpg'],
      metadata: {
        colors: [
          { key: 'black', images: { front: 'front-black.jpg', back: 'back-black.jpg' } },
          { key: 'white', images: { front: 'front-white.jpg', back: 'back-white.jpg' } },
        ],
      },
    })
    expect(frames).toEqual({ front: 'front-black.jpg', back: 'back-black.jpg', hasBack: true })
  })

  it('no repite la misma imagen como frente y dorso', () => {
    const frames = resolveCardFrames({ images: ['same.jpg', 'same.jpg'] })
    expect(frames.hasBack).toBe(false)
    expect(frames.front).toBe('same.jpg')
  })

  it('sin images ni metadata devuelve todo null', () => {
    const frames = resolveCardFrames({})
    expect(frames).toEqual({ front: null, back: null, hasBack: false })
  })

  it('usa el primer color de metadata si el frente no matchea ninguno', () => {
    const frames = resolveCardFrames({
      images: [],
      metadata: { colors: [{ key: 'black', images: { front: 'f.jpg', back: 'b.jpg' } }] },
    })
    expect(frames).toEqual({ front: 'f.jpg', back: 'b.jpg', hasBack: true })
  })
})
