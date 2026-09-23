import { describe, expect, it } from 'vitest'
import sharp from 'sharp'
import { computeLogoTone } from './logo-tone'

async function makeSolidPng(opts: {
  width: number
  height: number
  r: number
  g: number
  b: number
  alpha?: number
}): Promise<Buffer> {
  const { width, height, r, g, b, alpha = 255 } = opts
  return sharp({
    create: {
      width,
      height,
      channels: 4,
      background: { r, g, b, alpha },
    },
  })
    .png()
    .toBuffer()
}

describe('computeLogoTone', () => {
  it('logo negro opaco → dark', async () => {
    const buf = await makeSolidPng({ width: 40, height: 40, r: 10, g: 10, b: 10 })
    const { tone } = await computeLogoTone(buf)
    expect(tone).toBe('dark')
  })

  it('logo blanco opaco → light', async () => {
    const buf = await makeSolidPng({ width: 40, height: 40, r: 250, g: 250, b: 250 })
    const { tone } = await computeLogoTone(buf)
    expect(tone).toBe('light')
  })

  it('logo oscuro con fondo TRANSPARENTE (alpha=0) → se ignora el fondo, cuenta solo el logo opaco', async () => {
    // Base transparente + un cuadrado opaco oscuro superpuesto en el centro.
    const base = sharp({
      create: { width: 60, height: 60, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
    })
    const darkSquare = await makeSolidPng({ width: 20, height: 20, r: 5, g: 5, b: 5 })
    const buf = await base
      .composite([{ input: darkSquare, top: 20, left: 20 }])
      .png()
      .toBuffer()
    const { tone } = await computeLogoTone(buf)
    expect(tone).toBe('dark')
  })

  it('completamente transparente (sin píxeles opacos) → light por default', async () => {
    const buf = await sharp({
      create: { width: 30, height: 30, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
    })
      .png()
      .toBuffer()
    const { tone } = await computeLogoTone(buf)
    expect(tone).toBe('light')
  })

  it('calcula el aspect ratio ancho/alto', async () => {
    const buf = await makeSolidPng({ width: 200, height: 80, r: 100, g: 100, b: 100 })
    const { aspect } = await computeLogoTone(buf)
    expect(aspect).toBeCloseTo(2.5, 1)
  })

  it('logo cuadrado tiene aspect ~1', async () => {
    const buf = await makeSolidPng({ width: 100, height: 100, r: 100, g: 100, b: 100 })
    const { aspect } = await computeLogoTone(buf)
    expect(aspect).toBeCloseTo(1, 1)
  })
})
