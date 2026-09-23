/**
 * Fase 3 pieza B — compositor unico, determinístico (solo sharp, sin Gemini).
 *
 * `renderProductMockup` pega el diseño del partner TAL CUAL (nunca lo
 * redibuja) sobre la base estandar (`lib/garments/std-bases.json`, ver
 * `scripts/f3-build-std-bases.mts`) en la medida y posicion pedidas. Sin
 * `designBuffer` devuelve la prenda lisa (para el lado sin estampa, o el
 * boton "Dorso liso").
 *
 * Mientras una combinacion no tenga base estandar (52 generadas, 1 pendiente
 * — ver std-bases.json y el hallazgo de scripts/f3-build-std-bases.mts) cae
 * a `lib/garment-mappings.json` + la foto original detras de la MISMA
 * interfaz (`resolveBase`), asi el resto del compositor no necesita saber
 * cual de las dos fuentes se uso.
 */
import sharp from 'sharp'
import fs from 'fs'
import path from 'path'
import { knockoutBackground } from './perfect-stamp'
import { getGarmentMapping } from '@/lib/garment-mappings'
import stdBasesData from '@/lib/garments/std-bases.json'

export type MockupSide = 'front' | 'back'
export type MockupSize = 'chico' | 'mediano' | 'grande'
export type MockupPlacement = 'pecho-izq' | 'centro' | 'nuca'

export interface RenderProductMockupOptions {
  garmentKey: string
  color: string
  side: MockupSide
  /** Buffer del diseño (PNG/JPG). Si se omite, se devuelve la prenda lisa. */
  designBuffer?: Buffer | null
  size?: MockupSize
  placement?: MockupPlacement
}

export const CANVAS_SIZE = 2000
const OUTPUT_BG = { r: 0xd9, g: 0xd9, b: 0xd9 }

/** Ancho de la estampa en cm por lado x tamaño (ver PLAN-FASE3.md pieza B). */
const SIZE_CM: Record<MockupSide, Record<MockupSize, number>> = {
  front: { chico: 9, mediano: 24, grande: 35 },
  back: { chico: 14, mediano: 24, grande: 35 },
}

interface Rect { x: number; y: number; w: number; h: number }

interface StdBaseEntry {
  garmentKey: string
  color: string
  side: MockupSide
  file: string
  printArea: Rect
  pxPerCm: number
}

const STD_BASES = stdBasesData as StdBaseEntry[]

function findStdBase(garmentKey: string, color: string, side: MockupSide): StdBaseEntry | undefined {
  return STD_BASES.find((b) => b.garmentKey === garmentKey && b.color === color && b.side === side)
}

interface ResolvedBase {
  /** Buffer ya leido del disco. */
  buffer: Buffer
  printArea: Rect
  pxPerCm: number
}

/** Letterbox 400x500 que usa garment-mappings.json (ver perfect-stamp.ts cajaEnPx). */
function letterboxRect(W: number, H: number, coords: { x: number; y: number; width: number; height: number }): Rect {
  const baseW = 400, baseH = 500
  const s = Math.min(W / baseW, H / baseH)
  const offX = (W - baseW * s) / 2
  const offY = (H - baseH * s) / 2
  return { x: offX + coords.x * s, y: offY + coords.y * s, w: coords.width * s, h: coords.height * s }
}

/**
 * Lee un archivo de public/. En local (y si el file tracing lo incluyó) sale
 * del disco; en Vercel las funciones NO traen public/ (se excluye en
 * next.config.mjs porque arrastraba ~870 MB), así que se baja del propio
 * sitio, donde public/ se sirve estático. Cache en memoria por instancia.
 */
const publicFileCache = new Map<string, Buffer>()
async function loadPublicFile(relPath: string): Promise<Buffer> {
  const rel = relPath.replace(/^\//, '')
  const cached = publicFileCache.get(rel)
  if (cached) return cached
  // En Vercel siempre por HTTP. El nombre de la carpeta se arma en runtime a
  // propósito: `path.join(process.cwd(), 'public', x)` literal hace que el file
  // tracing de Vercel meta public/ entero en la función (909 MB, 23/09).
  const publicDir = ['pub', 'lic'].join('')
  const filePath = path.join(process.cwd(), publicDir, rel)
  let buffer: Buffer
  if (!process.env.VERCEL && fs.existsSync(filePath)) {
    buffer = fs.readFileSync(filePath)
  } else {
    const origin = (process.env.NEXT_PUBLIC_BASE_URL || 'https://www.novamente.ar').replace(/\/$/, '')
    const res = await fetch(`${origin}/${rel}`)
    if (!res.ok) throw new Error(`No se pudo leer la base ${rel} (HTTP ${res.status})`)
    buffer = Buffer.from(await res.arrayBuffer())
  }
  publicFileCache.set(rel, buffer)
  return buffer
}

/**
 * Resuelve la base (buffer + printArea + pxPerCm) para garmentKey/color/side.
 * Primero la base estandar (piezaA); si no existe, cae a garment-mappings.json
 * + la foto original detras de la misma interfaz.
 */
async function resolveBase(garmentKey: string, color: string, side: MockupSide): Promise<ResolvedBase> {
  const std = findStdBase(garmentKey, color, side)
  if (std) {
    const buffer = await loadPublicFile(std.file)
    return { buffer, printArea: std.printArea, pxPerCm: std.pxPerCm }
  }

  const mapping = getGarmentMapping(garmentKey, color, side)
  if (!mapping || mapping.garmentPath === 'fallback') {
    throw new Error(`No hay base disponible para ${garmentKey}/${color}/${side}`)
  }
  const buffer = await loadPublicFile(mapping.garmentPath)
  const meta = await sharp(buffer).metadata()
  const W = meta.width || 400, H = meta.height || 500
  const printArea = letterboxRect(W, H, mapping.coordinates)
  const AREA_IMPRIMIBLE_CM = 35
  const pxPerCm = printArea.w / AREA_IMPRIMIBLE_CM
  return { buffer, printArea, pxPerCm }
}

/**
 * Punto de anclaje (fraccion 0..1 del printArea) segun lado + ubicacion.
 * Convencion propia de este compositor (no depende de PLACEMENT_RECTS de
 * perfect-stamp.ts, que estan atados al frame legacy 400x500): "pecho-izq" es
 * el pecho izquierdo DE QUIEN LA USA, que en una foto de frente cae a la
 * derecha de quien mira (mismo criterio ya documentado en perfect-stamp.ts).
 */
function anchorFraction(side: MockupSide, placement: MockupPlacement): { fx: number; fy: number } {
  if (placement === 'pecho-izq') return { fx: 0.72, fy: 0.18 }
  if (placement === 'nuca') return { fx: 0.5, fy: 0.08 }
  return { fx: 0.5, fy: 0.5 } // centro
}

function defaultPlacement(side: MockupSide, size: MockupSize): MockupPlacement {
  if (side === 'front' && size === 'chico') return 'pecho-izq'
  if (side === 'back' && size === 'chico') return 'nuca'
  return 'centro'
}

/**
 * Genera el mockup de producto: prenda base + diseño del partner pegado TAL
 * CUAL (nunca redibujado) en la medida/ubicacion pedida. Sin `designBuffer`
 * devuelve la prenda lisa. Salida: JPEG 2000x2000 calidad 88.
 */
export async function renderProductMockup(opts: RenderProductMockupOptions): Promise<Buffer> {
  const { garmentKey, color, side, designBuffer, size = 'mediano' } = opts
  const placement = opts.placement ?? defaultPlacement(side, size)

  const base = await resolveBase(garmentKey, color, side)
  const baseMeta = await sharp(base.buffer).metadata()
  const baseW = baseMeta.width || CANVAS_SIZE
  const baseH = baseMeta.height || CANVAS_SIZE
  const needsFinalResize = baseW !== CANVAS_SIZE || baseH !== CANVAS_SIZE

  if (!designBuffer) {
    let pipeline = sharp(base.buffer)
    if (needsFinalResize) pipeline = pipeline.resize(CANVAS_SIZE, CANVAS_SIZE, { fit: 'contain', background: OUTPUT_BG })
    return pipeline.flatten({ background: OUTPUT_BG }).jpeg({ quality: 88 }).toBuffer()
  }

  // Quitar fondo del diseño con el knockout determinístico (nunca redibuja el
  // arte; si no hay fondo recortable se estampa tal cual, igual que antes).
  const cleanDesign = await knockoutBackground(designBuffer)

  // Recortar el aire transparente/uniforme alrededor ANTES de escalar, para
  // que el cm pedido sea el del dibujo y no el del canvas del archivo
  // (mismo criterio que pegarEstampaPlana en perfect-stamp.ts).
  let arte = cleanDesign
  try {
    const trimmed = await sharp(cleanDesign).trim({ threshold: 1 }).png().toBuffer()
    const tm = await sharp(trimmed).metadata()
    if ((tm.width ?? 0) >= 8 && (tm.height ?? 0) >= 8) arte = trimmed
  } catch {
    // trim falla sobre imagenes sin bordes uniformes: se sigue con el original
  }

  const cmWidth = SIZE_CM[side][size]
  const dm = await sharp(arte).metadata()
  const ratio = (dm.height || 1) / (dm.width || 1)

  let stampW = Math.max(8, Math.round(cmWidth * base.pxPerCm))
  let stampH = Math.round(stampW * ratio)
  // nunca mas grande que el area imprimible
  if (stampH > base.printArea.h) { stampH = Math.round(base.printArea.h); stampW = Math.max(8, Math.round(stampH / ratio)) }
  if (stampW > base.printArea.w) { stampW = Math.round(base.printArea.w); stampH = Math.max(8, Math.round(stampW * ratio)) }

  const stampBuffer = await sharp(arte).resize(stampW, stampH, { fit: 'inside' }).png().toBuffer()

  const anchor = anchorFraction(side, placement)
  const cx = base.printArea.x + anchor.fx * base.printArea.w
  const cy = base.printArea.y + anchor.fy * base.printArea.h
  let left = Math.round(cx - stampW / 2)
  let top = Math.round(cy - stampH / 2)
  // clamp: la estampa nunca sale del area imprimible
  left = Math.min(Math.max(left, Math.round(base.printArea.x)), Math.round(base.printArea.x + base.printArea.w - stampW))
  top = Math.min(Math.max(top, Math.round(base.printArea.y)), Math.round(base.printArea.y + base.printArea.h - stampH))

  let pipeline = sharp(base.buffer).composite([{ input: stampBuffer, left, top }])
  if (needsFinalResize) pipeline = pipeline.resize(CANVAS_SIZE, CANVAS_SIZE, { fit: 'contain', background: OUTPUT_BG })
  return pipeline.flatten({ background: OUTPUT_BG }).jpeg({ quality: 88 }).toBuffer()
}

/** true si garmentKey/color/side tiene una base (estandar o de fallback) resolvible. */
export async function hasMockupBase(garmentKey: string, color: string, side: MockupSide): Promise<boolean> {
  try {
    await resolveBase(garmentKey, color, side)
    return true
  } catch {
    return false
  }
}
