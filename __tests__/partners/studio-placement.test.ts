/**
 * El Studio dejaba caer la posición elegida: el partner elegía "Centro alto" y
 * la estampa salía "Sobre el corazón" (bug 26/08/2026, Pablo "Zurdo" / ORIGEN).
 * La causa era que `placement` llegaba al endpoint y nunca se pasaba al motor,
 * que tenía el rect de R1 hardcodeado.
 *
 * Estos tests miran el cuadro rojo, que es lo que define DÓNDE imprime Gemini
 * (ver STAMP_PROMPT: "placed exactly where the red rectangle is"). Son puro
 * sharp — no gastan una sola llamada a Gemini.
 */
import { describe, it, expect } from 'vitest'
import sharp from 'sharp'
import {
  buildDynamicRedSquare,
  PLACEMENT_RECTS,
  resolvePlacementRect,
  type ImprintBox,
} from '@/lib/mockup/perfect-stamp'

const IMPRINT: ImprintBox = { x: 96, y: 135, width: 204, height: 265 }
const W = 800, H = 1000

async function blankGarment() {
  return sharp({
    create: { width: W, height: H, channels: 3, background: { r: 20, g: 20, b: 20 } },
  }).jpeg().toBuffer()
}

/** Caja imprimible en px, con la misma matemática de letterbox del motor. */
function box() {
  const s = Math.min(W / 400, H / 500)
  return {
    x: (W - 400 * s) / 2 + IMPRINT.x * s,
    y: (H - 500 * s) / 2 + IMPRINT.y * s,
    w: IMPRINT.width * s,
    h: IMPRINT.height * s,
  }
}

/** Centro del rectángulo rojo, como fracción de la caja imprimible. */
async function redCenter(png: Buffer) {
  const { data, info } = await sharp(png).raw().toBuffer({ resolveWithObject: true })
  let minX = Infinity, minY = Infinity, maxX = -1, maxY = -1
  for (let y = 0; y < info.height; y++) {
    for (let x = 0; x < info.width; x++) {
      const i = (y * info.width + x) * info.channels
      if (data[i] > 190 && data[i + 1] < 80 && data[i + 2] < 80) {
        if (x < minX) minX = x; if (x > maxX) maxX = x
        if (y < minY) minY = y; if (y > maxY) maxY = y
      }
    }
  }
  expect(maxX).toBeGreaterThan(-1)
  const b = box()
  return {
    cx: (minX + maxX) / 2 - b.x === 0 ? 0 : ((minX + maxX) / 2 - b.x) / b.w,
    cy: ((minY + maxY) / 2 - b.y) / b.h,
    left: (minX - b.x) / b.w,
    right: (maxX - b.x) / b.w,
    top: (minY - b.y) / b.h,
    bottom: (maxY - b.y) / b.h,
  }
}

describe('placement del Studio → cuadro rojo', () => {
  it('el bug original: "centro alto" NO cae donde "sobre el corazón"', async () => {
    const g = await blankGarment()
    const centro = await redCenter(await buildDynamicRedSquare(g, IMPRINT, 'R1', 'front', 'center-high'))
    const corazon = await redCenter(await buildDynamicRedSquare(g, IMPRINT, 'R1', 'front', 'left-chest'))

    expect(centro.cx).toBeCloseTo(0.5, 1)          // centrado de verdad
    expect(Math.abs(centro.cx - corazon.cx)).toBeGreaterThan(0.2) // y bien lejos del corazón
  })

  it('cada posición del menú da un rect distinto (ninguna se ignora)', async () => {
    const g = await blankGarment()
    for (const [size, side, keys] of [
      ['R1', 'front', ['left-chest', 'right-chest', 'center-high', 'pocket', 'hem-left', 'hem-right']],
      ['R1', 'back', ['upper-center', 'upper-left', 'upper-right', 'center-high', 'hem-center']],
      ['R2', 'front', ['center', 'center-high', 'chest-wide']],
      ['R2', 'back', ['center', 'center-high', 'shoulder-blades']],
    ] as const) {
      const seen = new Set<string>()
      for (const k of keys) {
        const c = await redCenter(await buildDynamicRedSquare(g, IMPRINT, size, side, k))
        const sig = `${c.cx.toFixed(2)}/${c.cy.toFixed(2)}`
        expect(seen.has(sig), `${size}:${side}:${k} repite el rect ${sig}`).toBe(false)
        seen.add(sig)
      }
    }
  })

  it('"sobre el corazón" cae a la derecha de quien mira, como los cuadros rojos de la tienda', async () => {
    const g = await blankGarment()
    // public/garments/red-square/*_Frente_R1I.png miden cx ≈ 0.77-0.82 de la caja
    const c = await redCenter(await buildDynamicRedSquare(g, IMPRINT, 'R1', 'front', 'left-chest'))
    expect(c.cx).toBeGreaterThan(0.6)
    const d = await redCenter(await buildDynamicRedSquare(g, IMPRINT, 'R1', 'front', 'right-chest'))
    expect(d.cx).toBeLessThan(0.4)
  })

  it('el dorso NO se espeja: hombro izq. queda a la izquierda de quien mira', async () => {
    const g = await blankGarment()
    const izq = await redCenter(await buildDynamicRedSquare(g, IMPRINT, 'R1', 'back', 'upper-left'))
    expect(izq.cx).toBeLessThan(0.4)
  })

  it('R2 "centro" y R3 no cambian respecto del comportamiento viejo', async () => {
    const g = await blankGarment()
    const r2 = await redCenter(await buildDynamicRedSquare(g, IMPRINT, 'R2', 'front', 'center'))
    expect(r2.cx).toBeCloseTo(0.5, 1)
    expect(r2.cy).toBeCloseTo(0.5, 1)

    // R3 = caja completa, y la posición no lo altera
    const a = await redCenter(await buildDynamicRedSquare(g, IMPRINT, 'R3', 'front', 'center'))
    const b = await redCenter(await buildDynamicRedSquare(g, IMPRINT, 'R3', 'front', 'hem-left'))
    expect(a).toEqual(b)
    expect(a.cx).toBeCloseTo(0.5, 1)
  })

  it('una posición desconocida cae al default en vez de romper', async () => {
    const g = await blankGarment()
    const raro = await redCenter(await buildDynamicRedSquare(g, IMPRINT, 'R1', 'front', 'no-existe'))
    const def = await redCenter(await buildDynamicRedSquare(g, IMPRINT, 'R1', 'front', 'left-chest'))
    expect(raro).toEqual(def)
    expect(resolvePlacementRect('R3', 'front', 'lo-que-sea')).toBeNull()
  })

  it('ningún rect se sale de la caja imprimible de 35×40', () => {
    for (const [key, r] of Object.entries(PLACEMENT_RECTS)) {
      expect(r.fx, `${key} fx`).toBeGreaterThanOrEqual(0)
      expect(r.fy, `${key} fy`).toBeGreaterThanOrEqual(0)
      // margen estricto: el prompt trata el rojo como borde RÍGIDO y el motor
      // redondea a px, así que no queremos rects pegados justo al 1.0
      expect(r.fx + r.fw, `${key} se pasa a la derecha`).toBeLessThanOrEqual(0.97)
      expect(r.fy + r.fh, `${key} se pasa abajo`).toBeLessThanOrEqual(0.97)
    }
  })
})
