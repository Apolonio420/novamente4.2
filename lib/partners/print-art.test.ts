import { describe, it, expect } from 'vitest'
import { readPrintArt, writePrintArt } from './print-art'

const FRONT = 'https://cdn.test/escudo.png'
const BACK = 'https://cdn.test/logo-nuca.png'

describe('readPrintArt', () => {
  it('lee el modelo nuevo (metadata.print)', () => {
    expect(readPrintArt({ print: { front: { designUrl: FRONT }, back: { designUrl: BACK } } }))
      .toEqual({ front: FRONT, back: BACK })
  })

  it('cae al modelo viejo cuando print_side es frente', () => {
    expect(readPrintArt({ print_ready_url: FRONT, print_side: 'frente' }))
      .toEqual({ front: FRONT, back: '' })
  })

  it('ubica el arte viejo en el DORSO cuando print_side es dorso', () => {
    // Éste es el caso del partner sponsors: subió el logo de nuca en el campo de
    // un solo archivo y eligió "dorso". No debe leerse como arte de frente.
    expect(readPrintArt({ print_ready_url: BACK, print_side: 'dorso' }))
      .toEqual({ front: '', back: BACK })
  })

  it("trata 'ambos' como frente: el campo viejo guardaba un solo archivo", () => {
    expect(readPrintArt({ print_ready_url: FRONT, print_side: 'ambos' }))
      .toEqual({ front: FRONT, back: '' })
  })

  it('el modelo nuevo gana sobre el viejo', () => {
    expect(readPrintArt({
      print: { front: { designUrl: FRONT } },
      print_ready_url: 'https://cdn.test/viejo.png',
      print_side: 'frente',
    })).toEqual({ front: FRONT, back: '' })
  })

  it('completa con el viejo el lado que el nuevo no tiene', () => {
    expect(readPrintArt({
      print: { front: { designUrl: FRONT }, back: null },
      print_ready_url: BACK,
      print_side: 'dorso',
    })).toEqual({ front: FRONT, back: BACK })
  })

  it('no explota con metadata vacía o rota', () => {
    expect(readPrintArt(null)).toEqual({ front: '', back: '' })
    expect(readPrintArt({})).toEqual({ front: '', back: '' })
    expect(readPrintArt({ print: 'nope' })).toEqual({ front: '', back: '' })
  })
})

describe('writePrintArt', () => {
  it('cargar el dorso NO pisa el arte del frente', () => {
    const before = writePrintArt({}, { front: FRONT })
    const after = writePrintArt(before, { front: FRONT, back: BACK })
    expect(readPrintArt(after)).toEqual({ front: FRONT, back: BACK })
    expect(after.dualSide).toBe(true)
  })

  it('preserva stampMode/placement/widthCm que escribió el Studio', () => {
    const meta = { print: { front: { designUrl: 'viejo', stampMode: 'large', placement: 'center', widthCm: 30 } } }
    const out = writePrintArt(meta, { front: FRONT, back: BACK })
    expect(out.print).toMatchObject({
      front: { designUrl: FRONT, stampMode: 'large', placement: 'center', widthCm: 30 },
      back: { designUrl: BACK },
    })
  })

  it('deriva los campos viejos para lo que todavía los lee', () => {
    expect(writePrintArt({}, { front: FRONT })).toMatchObject({ print_ready_url: FRONT, print_side: 'frente', dualSide: false })
    expect(writePrintArt({}, { back: BACK })).toMatchObject({ print_ready_url: BACK, print_side: 'dorso', dualSide: false })
    expect(writePrintArt({}, { front: FRONT, back: BACK })).toMatchObject({ print_ready_url: FRONT, print_side: 'ambos', dualSide: true })
  })

  it('vaciar los dos lados limpia todo', () => {
    const out = writePrintArt({ print: { front: { designUrl: FRONT } }, dualSide: true, print_ready_url: FRONT, print_side: 'frente' }, {})
    expect(out.print).toBeUndefined()
    expect(out.dualSide).toBeUndefined()
    expect(out.print_ready_url).toBeUndefined()
    expect(out.print_side).toBeUndefined()
  })

  it('vaciar los lados no borra otras claves de print que este form no conoce', () => {
    const out = writePrintArt({ print: { front: { designUrl: FRONT }, sleeve: { designUrl: 'x' } } }, {})
    expect(out.print).toMatchObject({ front: null, back: null, sleeve: { designUrl: 'x' } })
  })

  it('no toca el resto de la metadata', () => {
    const out = writePrintArt({ sizes: ['M'], garmentKey: 'buzo-hoodie-unisex' }, { front: FRONT })
    expect(out.sizes).toEqual(['M'])
    expect(out.garmentKey).toBe('buzo-hoodie-unisex')
  })

  it('migra un producto viejo de dorso sin perder el arte', () => {
    // El form ahora hidrata con readPrintArt y guarda con writePrintArt: un
    // producto legacy con print_side='dorso' tiene que sobrevivir el round-trip.
    const legacy = { print_ready_url: BACK, print_side: 'dorso', sizes: ['L'] }
    const art = readPrintArt(legacy)
    const saved = writePrintArt(legacy, art)
    expect(readPrintArt(saved)).toEqual({ front: '', back: BACK })
    expect(saved.sizes).toEqual(['L'])
  })
})
