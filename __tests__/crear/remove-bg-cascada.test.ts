/**
 * "Sin fondo" de /crear — la cascada con gate de alpha real.
 *
 * El bug (verificado en producción 28/08/2026 con un diseño real): el endpoint
 * le pedía a Gemini "fondo transparente" y subía SU salida sin mirar. Gemini
 * nunca devuelve alpha: pinta el damero como píxeles opacos, y eso quedaba
 * como "el diseño sin fondo" — listo para IMPRIMIRSE con cuadriculado. Es la
 * variante pública del mismo bug arreglado en partners el 26/08.
 *
 * Acá se testea la pieza determinística nueva (el pelado por capas) y los
 * gates que protegen el resto.
 */
import { describe, it, expect } from 'vitest'
import sharp from 'sharp'
import { removeFlatLayeredBackground } from '@/lib/designer/remove-flat-bg'
import { hasRealAlpha } from '@/lib/mockup/perfect-stamp'

/** Arte "tipo póster": sujeto colorido sobre placa gris con marco degradé. */
async function posterConMarco() {
  const W = 600
  // canvas transparente
  let img = sharp({ create: { width: W, height: W, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
  const capas: sharp.OverlayOptions[] = []
  // marco degradé (tres anillos de gris, como el bisel real 96→192)
  for (const [inset, tono] of [[60, 190], [64, 150], [68, 110]] as const) {
    const lado = W - inset * 2
    capas.push({
      input: await sharp({ create: { width: lado, height: lado, channels: 4, background: { r: tono, g: tono, b: tono, alpha: 1 } } }).png().toBuffer(),
      left: inset, top: inset,
    })
  }
  // placa gris oscura
  const placa = W - 72 * 2
  capas.push({
    input: await sharp({ create: { width: placa, height: placa, channels: 4, background: { r: 32, g: 32, b: 34, alpha: 1 } } }).png().toBuffer(),
    left: 72, top: 72,
  })
  // sujeto colorido en el centro
  capas.push({
    input: await sharp({ create: { width: 200, height: 200, channels: 4, background: { r: 230, g: 120, b: 40, alpha: 1 } } }).png().toBuffer(),
    left: 200, top: 200,
  })
  return await img.composite(capas).png().toBuffer()
}

describe('pelado por capas (arte tipo póster)', () => {
  it('saca el marco degradé Y la placa, y deja el sujeto', async () => {
    const poster = await posterConMarco()
    const r = await removeFlatLayeredBackground(poster)
    expect(r.removed).toBe(true)

    const { data, info } = await sharp(r.buffer).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
    const px = (x: number, y: number) => {
      const i = (y * info.width + x) * info.channels
      return { r: data[i], a: data[i + 3] }
    }
    expect(px(66, 300).a).toBe(0)        // donde estaba el marco
    expect(px(120, 300).a).toBe(0)       // donde estaba la placa
    const sujeto = px(300, 300)
    expect(sujeto.a).toBe(255)           // el sujeto sigue
    expect(sujeto.r).toBe(230)           //   ...con sus colores intactos
  })

  it('una foto (borde multicolor) NO se toca', async () => {
    // borde con ruido de colores: ninguna pasada supera el gate de uniformidad
    const W = 300
    const raw = Buffer.alloc(W * W * 4)
    for (let i = 0; i < W * W; i++) {
      raw[i * 4] = (i * 37) % 256
      raw[i * 4 + 1] = (i * 101) % 256
      raw[i * 4 + 2] = (i * 173) % 256
      raw[i * 4 + 3] = 255
    }
    const foto = await sharp(raw, { raw: { width: W, height: W, channels: 4 } }).png().toBuffer()
    const r = await removeFlatLayeredBackground(foto)
    expect(r.removed).toBe(false)
  })

  it('si el fondo plano ES casi todo el canvas, no devuelve un png vacío', async () => {
    const lisa = await sharp({ create: { width: 300, height: 300, channels: 4, background: { r: 40, g: 40, b: 40, alpha: 1 } } }).png().toBuffer()
    const r = await removeFlatLayeredBackground(lisa)
    // guardarraíl: comerse >97% = no era un fondo, era el diseño
    expect(r.removed).toBe(false)
  })
})

describe('gate de alpha real (lo que faltaba en el endpoint)', () => {
  it('un damero PINTADO (opaco) no cuenta como transparencia', async () => {
    // celdas grises y claras alternadas, 0% de alpha — la salida típica de Gemini
    const W = 128
    const raw = Buffer.alloc(W * W * 4)
    for (let y = 0; y < W; y++) for (let x = 0; x < W; x++) {
      const c = ((x >> 4) + (y >> 4)) % 2 ? 240 : 210
      const i = (y * W + x) * 4
      raw[i] = c; raw[i + 1] = c; raw[i + 2] = c; raw[i + 3] = 255
    }
    const damero = await sharp(raw, { raw: { width: W, height: W, channels: 4 } }).png().toBuffer()
    expect(await hasRealAlpha(damero)).toBe(false)
  })

  it('alpha de verdad sí pasa', async () => {
    const conAlpha = await sharp({ create: { width: 64, height: 64, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
      .composite([{ input: await sharp({ create: { width: 30, height: 30, channels: 4, background: { r: 200, g: 50, b: 50, alpha: 1 } } }).png().toBuffer(), left: 17, top: 17 }])
      .png().toBuffer()
    expect(await hasRealAlpha(conAlpha)).toBe(true)
  })
})
