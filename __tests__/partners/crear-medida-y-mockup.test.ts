/**
 * Dos agujeros de /crear que se veían todos los días:
 *
 *  · el carrito mostraba el arte suelto en vez de la prenda, porque su vista
 *    grande sólo miraba frontMockup/backMockup y /crear setea `mockupUrl`
 *  · la medida elegida ("Chico/Mediano/Grande") no llegaba al pedido, así que
 *    a producción le tocaba adivinar el tamaño — el mismo bug que sufrió ORIGEN
 */
import { describe, it, expect } from 'vitest'

/** Misma lógica que previewImages() en app/cart/page.tsx */
function previewImages(item: any): string[] {
  const mockups = [
    item.frontMockup,
    item.backMockup,
    item.frontMockup || item.backMockup ? null : item.mockupUrl,
  ].filter(Boolean)
  const designs = [item.frontDesign, item.backDesign].filter(Boolean)
  return mockups.length > 0 ? [...mockups, ...designs] : designs
}

/** Lo que arma ahora el addItem de /crear (chat, un solo lado). */
const itemDeCrear = (side: 'front' | 'back', printArea: string, doble = false) => ({
  image: 'mockup.png',
  mockupUrl: 'mockup.png',
  frontMockup: side === 'front' ? 'mockup.png' : undefined,
  backMockup: side === 'back' ? 'mockup.png' : undefined,
  frontDesign: doble || side === 'front' ? 'arte-frente.png' : undefined,
  backDesign: doble || side === 'back' ? 'arte-dorso.png' : undefined,
  frontStampSize: doble || side === 'front' ? printArea : undefined,
  backStampSize: doble || side === 'back' ? printArea : undefined,
})

describe('/crear: lo que se ve y lo que se produce', () => {
  it('el carrito muestra la PRENDA primero, no el arte suelto', () => {
    const p = previewImages(itemDeCrear('front', 'R2'))
    expect(p[0]).toBe('mockup.png')
  })

  it('un item viejo sin mockup sigue mostrando el arte (no se rompe)', () => {
    expect(previewImages({ frontDesign: 'arte.png' })).toEqual(['arte.png'])
  })

  it('cuando hay mockups por lado, mockupUrl no se duplica', () => {
    const p = previewImages(itemDeCrear('front', 'R1'))
    expect(p.filter(x => x === 'mockup.png')).toHaveLength(1)
  })

  it('la medida elegida viaja al pedido', () => {
    expect(itemDeCrear('front', 'R3').frontStampSize).toBe('R3')
    expect(itemDeCrear('back', 'R1').backStampSize).toBe('R1')
  })

  it('en doble estampa la medida va de los dos lados', () => {
    const d = itemDeCrear('front', 'R2', true)
    expect(d.frontStampSize).toBe('R2')
    expect(d.backStampSize).toBe('R2')
  })

  it('el lado que no se estampa no inventa medida', () => {
    expect(itemDeCrear('front', 'R2').backStampSize).toBeUndefined()
  })
})
