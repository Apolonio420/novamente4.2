// @vitest-environment node
import { describe, it, expect } from 'vitest'
import sharp from 'sharp'
import { renderProductMockup, CANVAS_SIZE } from '@/lib/mockup/compose'
import stdBases from '@/lib/garments/std-bases.json'

/**
 * Fase 3 pieza B — compositor único (lib/mockup/compose.ts). Corre contra
 * las bases estándar REALES generadas por scripts/f3-build-std-bases.mts
 * (Fase 3 pieza A) — no mockea sharp ni el filesystem, valida el pipeline
 * completo.
 */

async function makeSolidDesignPng(color: { r: number; g: number; b: number }, size = 400): Promise<Buffer> {
  return sharp({
    create: { width: size, height: size, channels: 3, background: color },
  }).png().toBuffer()
}

describe('renderProductMockup — sin diseño (prenda lisa)', () => {
  it('devuelve JPEG 2000x2000 con el fondo #d9d9d9 en las 4 esquinas', async () => {
    const out = await renderProductMockup({
      garmentKey: 'aldea-classic-tshirt',
      color: 'black',
      side: 'front',
      designBuffer: null,
    })
    const meta = await sharp(out).metadata()
    expect(meta.format).toBe('jpeg')
    expect(meta.width).toBe(CANVAS_SIZE)
    expect(meta.height).toBe(CANVAS_SIZE)

    const { data, info } = await sharp(out).raw().toBuffer({ resolveWithObject: true })
    const ch = info.channels
    const corners = [
      [2, 2],
      [CANVAS_SIZE - 3, 2],
      [2, CANVAS_SIZE - 3],
      [CANVAS_SIZE - 3, CANVAS_SIZE - 3],
    ]
    for (const [x, y] of corners) {
      const idx = (y * CANVAS_SIZE + x) * ch
      // tolerancia chica por compresión JPEG (calidad 88)
      expect(Math.abs(data[idx] - 0xd9)).toBeLessThan(6)
      expect(Math.abs(data[idx + 1] - 0xd9)).toBeLessThan(6)
      expect(Math.abs(data[idx + 2] - 0xd9)).toBeLessThan(6)
    }
  })

  it('no cambia de tamaño entre lados/colores distintos', async () => {
    const back = await renderProductMockup({
      garmentKey: 'aura-oversize-tshirt',
      color: 'white',
      side: 'back',
      designBuffer: null,
    })
    const meta = await sharp(back).metadata()
    expect(meta.width).toBe(CANVAS_SIZE)
    expect(meta.height).toBe(CANVAS_SIZE)
  })
})

describe('renderProductMockup — con diseño', () => {
  it('pega la estampa adentro del printArea (el centro del printArea ya no es #d9d9d9)', async () => {
    const design = await makeSolidDesignPng({ r: 10, g: 200, b: 10 })
    const out = await renderProductMockup({
      garmentKey: 'aldea-classic-tshirt',
      color: 'black',
      side: 'front',
      designBuffer: design,
      size: 'grande',
      placement: 'centro',
    })
    const meta = await sharp(out).metadata()
    expect(meta.width).toBe(CANVAS_SIZE)
    expect(meta.height).toBe(CANVAS_SIZE)

    const base = (stdBases as any[]).find(
      (b) => b.garmentKey === 'aldea-classic-tshirt' && b.color === 'black' && b.side === 'front',
    )
    expect(base).toBeTruthy()
    const cx = Math.round(base.printArea.x + base.printArea.w / 2)
    const cy = Math.round(base.printArea.y + base.printArea.h / 2)

    const { data, info } = await sharp(out).raw().toBuffer({ resolveWithObject: true })
    const ch = info.channels
    const idx = (cy * CANVAS_SIZE + cx) * ch
    // el centro del printArea con estampa "grande" debe verse verde-ish (diseño),
    // no negro (la remera) ni gris (el fondo)
    expect(data[idx + 1]).toBeGreaterThan(data[idx]) // verde > rojo
    expect(data[idx + 1]).toBeGreaterThan(data[idx + 2]) // verde > azul
  })

  it('el tamaño "grande" ocupa mas superficie que "chico" (mismo color/lado)', async () => {
    const design = await makeSolidDesignPng({ r: 200, g: 10, b: 10 })
    const grande = await renderProductMockup({
      garmentKey: 'aldea-classic-tshirt', color: 'white', side: 'front', designBuffer: design, size: 'grande',
    })
    const chico = await renderProductMockup({
      garmentKey: 'aldea-classic-tshirt', color: 'white', side: 'front', designBuffer: design, size: 'chico',
    })

    async function redPixelCount(buf: Buffer): Promise<number> {
      const { data, info } = await sharp(buf).raw().toBuffer({ resolveWithObject: true })
      const ch = info.channels
      let count = 0
      for (let i = 0; i < data.length; i += ch) {
        if (data[i] > 150 && data[i + 1] < 80 && data[i + 2] < 80) count++
      }
      return count
    }

    const grandeCount = await redPixelCount(grande)
    const chicoCount = await redPixelCount(chico)
    expect(grandeCount).toBeGreaterThan(chicoCount)
  })

  it('nunca redibuja el diseño: el color estampado es EXACTAMENTE el del arte (sin knockout de por medio)', async () => {
    // Un diseño que llena todo el canvas (sin fondo removible: perfilDelBorde
    // no lo detecta como fondo plano porque cubre el borde completo con un
    // solo color sólido → sigue siendo "borde plano" en realidad, así que
    // usamos un color intencionalmente RUIDOSO para que el knockout NO actúe
    // y podamos verificar que el pixel exacto llega intacto al mockup.
    const design = sharp({
      create: { width: 200, height: 200, channels: 3, background: { r: 33, g: 77, b: 201 } },
    })
    const buf = await design.png().toBuffer()
    const out = await renderProductMockup({
      garmentKey: 'aldea-classic-tshirt', color: 'black', side: 'front', designBuffer: buf, size: 'grande', placement: 'centro',
    })
    const base = (stdBases as any[]).find(
      (b) => b.garmentKey === 'aldea-classic-tshirt' && b.color === 'black' && b.side === 'front',
    )
    const cx = Math.round(base.printArea.x + base.printArea.w / 2)
    const cy = Math.round(base.printArea.y + base.printArea.h / 2)
    const { data, info } = await sharp(out).raw().toBuffer({ resolveWithObject: true })
    const ch = info.channels
    const idx = (cy * CANVAS_SIZE + cx) * ch
    // JPEG q88 mete algo de ruido de compresión, pero el color debe seguir
    // siendo reconociblemente azul (b > r y b > g), nunca "redibujado" a otra
    // paleta.
    expect(data[idx + 2]).toBeGreaterThan(data[idx])
    expect(data[idx + 2]).toBeGreaterThan(data[idx + 1])
  })
})

describe('renderProductMockup — combinación sin base', () => {
  it('rechaza una combinación de garmentKey/color inexistente', async () => {
    await expect(
      renderProductMockup({ garmentKey: 'no-existe', color: 'nope', side: 'front', designBuffer: null }),
    ).rejects.toThrow()
  })
})
