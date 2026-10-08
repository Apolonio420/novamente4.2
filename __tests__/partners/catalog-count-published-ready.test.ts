// countPublishedProductsReady (lib/partners/catalog.ts) — contraparte "en
// regla" de countPublishedProducts, usada por el camino de AUTO-publish del
// storefront (ver lib/partners/auto-publish.ts: onProductPublished y
// app/api/partners/branding/route.ts).
//
// Requerimiento del dueño (08/10): "que sea automatica siempre y cuando ...
// MINIMAMENTE tenga un producto EN REGLA publicado". countPublishedProducts
// cuenta CUALQUIER fila status='published' — incluye un producto publicado
// sin imagenes (caso real: buzo con "Imagenes 0/8" que mostraba la vidriera
// en blanco) o con precio 0. countPublishedProductsReady exige ademas
// imagenes (array no vacio) y precio > 0 — mismo criterio que ya usan
// feed-generator.ts (`p.price && p.price > 0 && p.images.length > 0`) y
// daily-attention.ts (missingPrice/missingImage).
import { describe, it, expect, vi } from 'vitest'

type Row = { price: number | null; images: unknown }

const state = vi.hoisted(() => ({
  rows: [] as Row[],
  error: null as { message: string } | null,
}))

vi.mock('@/lib/supabase-admin', () => {
  // countPublishedProductsReady hace: .from().select().eq().eq() y despues
  // await directo sobre el resultado encadenado — cada metodo devuelve el
  // mismo builder (chainable) que ademas es thenable (awaitable) en
  // cualquier punto de la cadena.
  const builder: any = {
    from: () => builder,
    select: () => builder,
    eq: () => builder,
    then: (resolve: (v: { data: Row[] | null; error: { message: string } | null }) => void) =>
      resolve({ data: state.error ? null : state.rows, error: state.error }),
  }
  return { supabaseAdmin: builder }
})

import { countPublishedProductsReady } from '@/lib/partners/catalog'

describe('countPublishedProductsReady', () => {
  it('producto published SIN imagenes => no cuenta (0)', async () => {
    state.error = null
    state.rows = [{ price: 25000, images: [] }]
    expect(await countPublishedProductsReady('tenant-1')).toBe(0)
  })

  it('producto published con precio 0/null => no cuenta', async () => {
    state.error = null
    state.rows = [
      { price: 0, images: ['https://cdn/front.jpg'] },
      { price: null, images: ['https://cdn/front.jpg'] },
    ]
    expect(await countPublishedProductsReady('tenant-1')).toBe(0)
  })

  it('producto published CON imagenes y precio > 0 => cuenta (en regla)', async () => {
    state.error = null
    state.rows = [{ price: 25000, images: ['https://cdn/front.jpg'] }]
    expect(await countPublishedProductsReady('tenant-1')).toBe(1)
  })

  it('mezcla: solo suma los que estan en regla', async () => {
    state.error = null
    state.rows = [
      { price: 25000, images: ['https://cdn/front.jpg'] }, // en regla
      { price: 0, images: ['https://cdn/front.jpg'] }, // precio 0
      { price: 10000, images: [] }, // sin imagenes
      { price: 15000, images: ['https://cdn/a.jpg', 'https://cdn/b.jpg'] }, // en regla
    ]
    expect(await countPublishedProductsReady('tenant-1')).toBe(2)
  })

  it('sin filas => 0', async () => {
    state.error = null
    state.rows = []
    expect(await countPublishedProductsReady('tenant-1')).toBe(0)
  })

  it('error de supabase => 0 (nunca rompe el caller)', async () => {
    state.error = { message: 'boom' }
    state.rows = []
    expect(await countPublishedProductsReady('tenant-1')).toBe(0)
  })
})
