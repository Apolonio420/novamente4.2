/**
 * Bug ORIGEN 26/08/2026: el diseño se estampaba con un rectángulo blanco
 * detrás ("me aparece en negativo").
 *
 * Causa: gemini-2.5-flash-image NO devuelve canal alpha — devuelve un PNG
 * OPACO con el damero de transparencia PINTADO como píxeles, y encima
 * re-renderiza el arte. Medido sobre los diseños reales del partner:
 * hasAlpha=false, 0 transparentes de 1.048.576.
 *
 * Estos tests NO llaman a Gemini: verifican el recorte determinístico que
 * ahora corre cuando el modelo no trae transparencia real.
 */
import { describe, it, expect } from 'vitest'
import sharp from 'sharp'
import { removeDesignBackground } from '@/lib/mockup/perfect-stamp'
import { removeWhiteBackground } from '@/lib/designer/remove-white-bg'
import { removeCheckerboardBackground } from '@/lib/designer/remove-checkerboard-bg'

const W = 200, H = 200

/** Arte oscuro centrado sobre fondo blanco — el póster típico. */
async function posterFondoBlanco() {
  const art = await sharp({ create: { width: 90, height: 90, channels: 4, background: { r: 20, g: 20, b: 30, alpha: 1 } } }).png().toBuffer()
  return sharp({ create: { width: W, height: H, channels: 4, background: { r: 255, g: 255, b: 255, alpha: 1 } } })
    .composite([{ input: art, top: 55, left: 55 }]).png().toBuffer()
}

/** Lo que devuelve Gemini: damero gris/blanco OPACO pintado detrás del arte. */
async function conDameroPintado() {
  const cell = 10
  const px = Buffer.alloc(W * H * 4)
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const o = (y * W + x) * 4
    const claro = ((x / cell | 0) + (y / cell | 0)) % 2 === 0
    const v = claro ? 244 : 216           // los dos grises del damero de Photoshop
    px[o] = v; px[o + 1] = v; px[o + 2] = v; px[o + 3] = 255  // OPACO
  }
  const base = await sharp(px, { raw: { width: W, height: H, channels: 4 } }).png().toBuffer()
  const art = await sharp({ create: { width: 90, height: 90, channels: 4, background: { r: 20, g: 20, b: 30, alpha: 1 } } }).png().toBuffer()
  return sharp(base).composite([{ input: art, top: 55, left: 55 }]).png().toBuffer()
}

async function fraccionTransparente(buf: Buffer) {
  const { data, info } = await sharp(buf).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  let t = 0
  for (let i = 3; i < data.length; i += info.channels) if (data[i] === 0) t++
  return t / (info.width * info.height)
}

/** Foto: cada lado del borde tiene colores distintos y con saturación. */
async function fotoFullBleed() {
  const px = Buffer.alloc(W * H * 4)
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const o = (y * W + x) * 4
    px[o] = 40 + ((x * 7 + y * 3) % 180)          // r
    px[o + 1] = 30 + ((y * 5) % 150)              // g
    px[o + 2] = 90 + ((x * 3) % 120)              // b
    px[o + 3] = 255
  }
  return sharp(px, { raw: { width: W, height: H, channels: 4 } }).png().toBuffer()
}

describe('el recorte NO toca arte de borde a borde', () => {
  it('una foto full-bleed sale intacta (no se le hacen agujeros)', async () => {
    const foto = await fotoFullBleed()
    const out = await removeDesignBackground(foto)
    // sin fondo plano ni damero: se devuelve tal cual, 0 transparencia
    expect(await fraccionTransparente(out)).toBe(0)
  })

  it('el damero pintado SÍ se recorta aunque el borde no sea plano', async () => {
    // borde 100% neutro (los dos grises del damero) → es fondo, no arte
    const out = await removeDesignBackground(await conDameroPintado())
    expect(await fraccionTransparente(out)).toBeGreaterThan(0.5)
  })

  it('un fondo liso se sigue recortando', async () => {
    const out = await removeDesignBackground(await posterFondoBlanco())
    expect(await fraccionTransparente(out)).toBeGreaterThan(0.5)
  })
})

describe('recorte de fondo sin depender del modelo', () => {
  it('el fondo blanco del póster se vuelve transparente de verdad', async () => {
    const antes = await posterFondoBlanco()
    expect(await fraccionTransparente(antes)).toBe(0)   // opaco, como llega

    const { buffer, removed } = await removeWhiteBackground(antes)
    expect(removed).toBe(true)
    expect(await fraccionTransparente(buffer)).toBeGreaterThan(0.5)
  })

  it('el damero OPACO de Gemini no sobrevive al recorte', async () => {
    const antes = await conDameroPintado()
    expect(await fraccionTransparente(antes)).toBe(0)   // esto es lo que se estampaba

    // mismo par de pases que corre el motor
    const blanco = await removeWhiteBackground(antes)
    const chk = await removeCheckerboardBackground(blanco.buffer)
    const final = chk.removed ? chk.buffer : blanco.buffer

    expect(await fraccionTransparente(final)).toBeGreaterThan(0.5)
  })

  it('el arte en sí no se come: el centro sigue opaco', async () => {
    const { buffer } = await removeWhiteBackground(await posterFondoBlanco())
    const { data, info } = await sharp(buffer).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
    const centro = ((H / 2 | 0) * info.width + (W / 2 | 0)) * info.channels
    expect(data[centro + 3]).toBe(255)
  })

  it('con fondo recortable NO se llama a Gemini (el recorte va primero)', async () => {
    const stats = { geminiCalls: 0 }
    const out = await removeDesignBackground(await posterFondoBlanco(), stats)
    expect(stats.geminiCalls).toBe(0)                       // gratis y ~200ms
    expect(await fraccionTransparente(out)).toBeGreaterThan(0.5)
  })

  it('un diseño que YA viene con alpha no se toca', async () => {
    const conAlpha = await sharp({ create: { width: W, height: H, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
      .composite([{ input: await sharp({ create: { width: 60, height: 60, channels: 4, background: { r: 10, g: 200, b: 90, alpha: 1 } } }).png().toBuffer(), top: 70, left: 70 }])
      .png().toBuffer()
    const { removed } = await removeWhiteBackground(conAlpha)
    expect(removed).toBe(false)   // no hay blanco que morder
  })
})
