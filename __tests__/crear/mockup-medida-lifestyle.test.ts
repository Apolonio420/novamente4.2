/**
 * La foto lifestyle tiene que respetar el TAMAÑO elegido.
 *
 * Lo reportado (27/08/2026, con capturas): se generaron las tres medidas sobre
 * el mismo diseño y "las tres se ve el mismo tamaño la estampa". Verificado
 * generando R1/R2/R3 en el mismo escenario: R1 salía bien, pero R2 y R3 salían
 * iguales — Gemini no tiene escala, "20 cm" y "35 cm" le dan lo mismo, y caía
 * siempre en su prior de "estampa de medio pecho".
 *
 * El arreglo es no describir la medida con palabras: se le pasa la prenda plana
 * con la estampa YA pegada en su medida exacta (sharp, 0 llamadas al modelo) y
 * Gemini sólo tiene que ponerla sobre una persona.
 */
import { describe, it, expect } from 'vitest'
import sharp from 'sharp'
import { pegarEstampaPlana } from '@/lib/mockup/perfect-stamp'

/** Prenda base lisa, del tamaño de las reales. */
async function prendaBase(w = 1200, h = 1200) {
  return await sharp({
    create: { width: w, height: h, channels: 3, background: { r: 20, g: 20, b: 20 } },
  }).png().toBuffer()
}

/** Arte cuadrado opaco: sirve para medir cuánto ocupa el resultado. */
async function arte(lado = 512) {
  return await sharp({
    create: { width: lado, height: lado, channels: 4, background: { r: 240, g: 40, b: 40, alpha: 1 } },
  }).png().toBuffer()
}

const IMPRINT = { x: 96, y: 135, width: 204, height: 265, baseW: 400, baseH: 500 }

/** Ancho en px de la mancha roja (la estampa) dentro del mockup. */
async function anchoDeLaEstampa(png: Buffer): Promise<number> {
  const { data, info } = await sharp(png).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  let min = info.width, max = -1
  for (let y = 0; y < info.height; y++) {
    for (let x = 0; x < info.width; x++) {
      const i = (y * info.width + x) * info.channels
      if (data[i] > 180 && data[i + 1] < 100 && data[i + 2] < 100) {
        if (x < min) min = x
        if (x > max) max = x
      }
    }
  }
  return max < 0 ? 0 : max - min + 1
}

describe('la medida elegida llega al mockup', () => {
  it('R1, R2 y R3 dan tres tamaños DISTINTOS y crecientes', async () => {
    const base = await prendaBase()
    const a = await arte()
    const anchos: number[] = []
    for (const [size, cm] of [['R1', 10], ['R2', 20], ['R3', 35]] as const) {
      const png = await pegarEstampaPlana(a, base, IMPRINT, cm, size, 'front', 'center-high')
      anchos.push(await anchoDeLaEstampa(png))
    }
    const [r1, r2, r3] = anchos
    expect(r1).toBeGreaterThan(0)
    // esto es lo que fallaba en la foto lifestyle: R2 y R3 salían iguales
    expect(r2).toBeGreaterThan(r1 * 1.5)
    expect(r3).toBeGreaterThan(r2 * 1.4)
  })

  it('la proporción sale de los cm pedidos, no de la interpretación del modelo', async () => {
    const base = await prendaBase()
    const a = await arte()
    const r1 = await anchoDeLaEstampa(await pegarEstampaPlana(a, base, IMPRINT, 10, 'R1', 'front', 'center-high'))
    const r3 = await anchoDeLaEstampa(await pegarEstampaPlana(a, base, IMPRINT, 35, 'R3', 'front', 'center-high'))
    expect(r3 / r1).toBeGreaterThan(3)
    expect(r3 / r1).toBeLessThan(4)
  })

  it('nunca se pasa del área imprimible aunque se pidan cm de más', async () => {
    const base = await prendaBase()
    const a = await arte()
    const png = await pegarEstampaPlana(a, base, IMPRINT, 200, 'R3', 'front', 'center-high')
    const meta = await sharp(base).metadata()
    const s = Math.min((meta.width ?? 0) / 400, (meta.height ?? 0) / 500)
    expect(await anchoDeLaEstampa(png)).toBeLessThanOrEqual(Math.round(IMPRINT.width * s) + 2)
  })

  it('el arte con aire alrededor se recorta: los cm son los del dibujo', async () => {
    const base = await prendaBase()
    const chico = await arte(200)
    const conAire = await sharp({
      create: { width: 600, height: 600, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
    }).composite([{ input: chico, left: 200, top: 200 }]).png().toBuffer()

    const sinAire = await anchoDeLaEstampa(await pegarEstampaPlana(chico, base, IMPRINT, 35, 'R3', 'front', 'center-high'))
    const recortado = await anchoDeLaEstampa(await pegarEstampaPlana(conAire, base, IMPRINT, 35, 'R3', 'front', 'center-high'))
    // sin el recorte, el de la derecha saldría 3 veces más chico
    expect(Math.abs(recortado - sinAire)).toBeLessThan(sinAire * 0.05)
  })
})
