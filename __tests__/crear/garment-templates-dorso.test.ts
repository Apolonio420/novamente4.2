/**
 * El dorso de la musculosa estaba deshabilitado por un bloqueo fantasma
 * ("falta la foto en negro") — la Bali se vende sólo en blanca y gris, y esos
 * dos dorsos existen con mapping propio. Habilitado el 30/08/2026.
 */
import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import { hasBackTemplate, getPrintArea, CANVAS_W, CANVAS_H } from '@/app/crear/garment-templates'

describe('dorso de la musculosa', () => {
  it('el doble estampado queda habilitado', () => {
    expect(hasBackTemplate('musculosa-bali')).toBe(true)
  })

  it('la caja del dorso entra en el canvas y es más angosta que el frente (breteles)', () => {
    const f = getPrintArea('musculosa-bali', 'front')
    const b = getPrintArea('musculosa-bali', 'back')
    expect(b.w).toBeLessThan(f.w)
    expect(b.x).toBeGreaterThan(0)
    expect(b.x + b.w).toBeLessThan(CANVAS_W)
    expect(b.y + b.h).toBeLessThan(CANVAS_H)
    // centrada como el frente
    expect(Math.abs((b.x + b.w / 2) - (f.x + f.w / 2))).toBeLessThanOrEqual(2)
  })

  it('las fotos de dorso existen para TODOS los colores que se venden (blanca y gris)', () => {
    for (const c of ['white', 'gray']) {
      expect(fs.existsSync(`public/garments/musculosa-bali-${c}-back.png`)).toBe(true)
    }
  })
})
