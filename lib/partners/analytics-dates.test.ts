import { describe, expect, it } from 'vitest'
import { artDayKey, artWindowStartIso, lastNArtDayKeys } from './analytics-dates'

describe('artDayKey', () => {
  it('un evento a las 2026-10-09T01:30:00Z (22:30 ART del 08) cuenta el 2026-10-08', () => {
    expect(artDayKey('2026-10-09T01:30:00.000Z')).toBe('2026-10-08')
  })

  it('un evento a las 2026-10-09T03:00:00Z (00:00 ART del 09) ya cuenta el 2026-10-09', () => {
    expect(artDayKey('2026-10-09T03:00:00.000Z')).toBe('2026-10-09')
  })

  it('acepta Date además de ISO string', () => {
    expect(artDayKey(new Date('2026-10-09T01:30:00.000Z'))).toBe('2026-10-08')
  })

  it('"hoy" (sin argumento) coincide con el último elemento de lastNArtDayKeys', () => {
    const now = new Date()
    expect(artDayKey(now)).toBe(lastNArtDayKeys(5, now).at(-1))
  })
})

describe('lastNArtDayKeys', () => {
  it('devuelve N días ascendentes terminando en el día ART de "now"', () => {
    const now = new Date('2026-10-09T12:00:00.000Z') // 09:00 ART del 09
    const keys = lastNArtDayKeys(5, now)
    expect(keys).toEqual(['2026-10-05', '2026-10-06', '2026-10-07', '2026-10-08', '2026-10-09'])
  })

  it('con "now" tarde en la noche ART (ya pasó medianoche UTC) sigue terminando en el día ART correcto', () => {
    // 2026-10-09T01:00:00Z = 2026-10-08T22:00:00 ART → el día ART de "hoy" es el 08
    const now = new Date('2026-10-09T01:00:00.000Z')
    const keys = lastNArtDayKeys(3, now)
    expect(keys).toEqual(['2026-10-06', '2026-10-07', '2026-10-08'])
  })
})

describe('artWindowStartIso', () => {
  it('es el instante UTC de la medianoche ART del día más viejo de la ventana', () => {
    const now = new Date('2026-10-09T12:00:00.000Z')
    // día más viejo de una ventana de 5 días terminando el 09 = 05 → medianoche ART del 05 = 03:00 UTC del 05
    expect(artWindowStartIso(5, now)).toBe('2026-10-05T03:00:00.000Z')
  })

  it('el cutoff nunca cae después del comienzo del día ART más viejo (no trunca el bucket más viejo)', () => {
    const now = new Date('2026-10-09T01:00:00.000Z')
    const since = artWindowStartIso(3, now)
    const oldestDayKey = lastNArtDayKeys(3, now)[0]
    expect(artDayKey(since)).toBe(oldestDayKey)
  })
})
