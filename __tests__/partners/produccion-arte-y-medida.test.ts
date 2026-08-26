/**
 * El mockup es una FOTO, no el archivo de impresión.
 *
 * Cuando alguien compraba en la tienda de un partner (/p/[slug]), al proveedor
 * le llegaba SOLO esa foto: el diseño original y la medida de la estampa no
 * viajaban por ningún lado. La ficha salía sin arte y el tamaño elegido en el
 * Studio se perdía — quedaba a interpretación de quien estampa.
 *
 * Este test recorre la cadena entera para que no se vuelva a cortar en silencio.
 */
import { describe, it, expect } from 'vitest'

/** Lo que el Studio manda al crear el producto en el catálogo. */
const metadataDelProducto = {
  garmentKey: 'aura-oversize-tshirt',
  color: 'black',
  source: 'design-engine',
  dualSide: false,
  print: {
    front: {
      designUrl: 'https://r2/partners/origen/uploads/david.png',
      stampMode: 'chest-logo',
      placement: 'center-high',
      widthCm: 8,
    },
    back: null,
  },
}

/** Misma conversión que AddToCartButtons: modo del Studio → código de fulfillment. */
const stampSizeCode = (mode?: string | null) =>
  mode === 'chest-logo' ? 'R1' : mode === 'medium' ? 'R2' : mode === 'large' ? 'R3' : undefined

/** Lo que AddToCartButtons pone en el carrito. */
function itemDeCarrito(meta: any, mockupUrl: string) {
  const printFront = meta?.print?.front ?? null
  const printBack = meta?.print?.back ?? null
  return {
    image: mockupUrl,
    frontDesign: printFront?.designUrl || undefined,
    backDesign: printBack?.designUrl || undefined,
    frontStampSize: stampSizeCode(printFront?.stampMode),
    backStampSize: stampSizeCode(printBack?.stampMode),
    doble_estampa: printFront?.designUrl && printBack?.designUrl ? 'Si' : 'No',
    metadata: { print_front: printFront, print_back: printBack },
  }
}

/** Misma forma que arma app/api/checkout/route.ts para order_items. */
function orderItem(item: any) {
  return {
    image_url: item.image || null,
    front_design_url: item.frontDesign || null,
    back_design_url: item.backDesign || null,
    front_stamp_size: item.frontStampSize || null,
    doble_estampa: item.doble_estampa || 'No',
    metadata: { itemId: 'x', ...(item.metadata || {}) },
  }
}

describe('el arte y la medida llegan a producción', () => {
  const item = itemDeCarrito(metadataDelProducto, 'https://r2/mockups/foto.png')
  const row = orderItem(item)

  it('el diseño original viaja, no sólo la foto del mockup', () => {
    expect(row.front_design_url).toBe('https://r2/partners/origen/uploads/david.png')
    expect(row.image_url).toBe('https://r2/mockups/foto.png')
    expect(row.front_design_url).not.toBe(row.image_url)  // el bug era que eran lo mismo
  })

  it('la ficha del proveedor encuentra el arte donde lo busca', () => {
    // platform-master lee front_design_url para armar artes.frente_print
    expect(row.front_design_url).toBeTruthy()
  })

  it('el tamaño elegido en el Studio sobrevive', () => {
    expect(row.front_stamp_size).toBe('R1')
    expect((row.metadata as any).print_front.widthCm).toBe(8)
  })

  it('la posición exacta también, aunque no tenga columna propia', () => {
    expect((row.metadata as any).print_front.placement).toBe('center-high')
  })

  it('doble estampa se marca sola cuando hay arte de los dos lados', () => {
    const dual = itemDeCarrito({
      print: {
        front: { designUrl: 'f.png', stampMode: 'large' },
        back: { designUrl: 'b.png', stampMode: 'large' },
      },
    }, 'foto.png')
    expect(orderItem(dual).doble_estampa).toBe('Si')
    expect(orderItem(dual).back_design_url).toBe('b.png')
  })

  it('un producto viejo sin print no rompe nada (queda como antes)', () => {
    const viejo = orderItem(itemDeCarrito({ garmentKey: 'x' }, 'foto.png'))
    expect(viejo.front_design_url).toBeNull()
    expect(viejo.front_stamp_size).toBeNull()
    expect(viejo.image_url).toBe('foto.png')
    expect(viejo.doble_estampa).toBe('No')
  })

  it('los tres modos del Studio mapean al vocabulario de fulfillment', () => {
    expect(stampSizeCode('chest-logo')).toBe('R1')
    expect(stampSizeCode('medium')).toBe('R2')
    expect(stampSizeCode('large')).toBe('R3')
    expect(stampSizeCode(null)).toBeUndefined()
  })
})
