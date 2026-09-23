import { describe, it, expect } from 'vitest'
import sharp from 'sharp'
import { toBanner16x9, needsBannerTreatment, BANNER_TARGET_WIDTH, BANNER_TARGET_HEIGHT } from './banner-image'

async function synthetic(width: number, height: number, color = { r: 200, g: 50, b: 50 }): Promise<Buffer> {
  return sharp({
    create: {
      width,
      height,
      channels: 3,
      background: color,
    },
  })
    .png()
    .toBuffer()
}

describe('needsBannerTreatment', () => {
  it('true para una imagen cuadrada (el caso del Studio, 1024x1024)', () => {
    expect(needsBannerTreatment(1024, 1024)).toBe(true)
  })

  it('false para una imagen ya ~16:9', () => {
    expect(needsBannerTreatment(1600, 900)).toBe(false)
    expect(needsBannerTreatment(1920, 1090)).toBe(false)
  })

  it('false si falta ancho o alto', () => {
    expect(needsBannerTreatment(0, 900)).toBe(false)
    expect(needsBannerTreatment(1600, 0)).toBe(false)
  })
})

describe('toBanner16x9', () => {
  it('produce un lienzo 1600x900 a partir de una imagen cuadrada (caso Studio)', async () => {
    const input = await synthetic(1024, 1024)
    const out = await toBanner16x9(input)
    const meta = await sharp(out).metadata()
    expect(meta.width).toBe(BANNER_TARGET_WIDTH)
    expect(meta.height).toBe(BANNER_TARGET_HEIGHT)
    expect(meta.format).toBe('png')
  })

  it('produce 1600x900 a partir de una imagen vertical', async () => {
    const input = await synthetic(800, 1200)
    const out = await toBanner16x9(input)
    const meta = await sharp(out).metadata()
    expect(meta.width).toBe(BANNER_TARGET_WIDTH)
    expect(meta.height).toBe(BANNER_TARGET_HEIGHT)
  })

  it('produce 1600x900 a partir de una imagen ya ~16:9 (cover simple)', async () => {
    const input = await synthetic(1920, 1080)
    const out = await toBanner16x9(input)
    const meta = await sharp(out).metadata()
    expect(meta.width).toBe(BANNER_TARGET_WIDTH)
    expect(meta.height).toBe(BANNER_TARGET_HEIGHT)
  })

  it('no revienta con una imagen muy chica', async () => {
    const input = await synthetic(50, 50)
    const out = await toBanner16x9(input)
    const meta = await sharp(out).metadata()
    expect(meta.width).toBe(BANNER_TARGET_WIDTH)
    expect(meta.height).toBe(BANNER_TARGET_HEIGHT)
  })
})
