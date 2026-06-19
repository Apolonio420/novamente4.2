/**
 * El arte print-ready (print_ready_url / print_side) se guarda en
 * partner_products.metadata para que el match de estampa sea exacto, pero NUNCA
 * debe exponerse en la tienda pública. stripSensitiveMetadata (que corren las
 * lecturas públicas getPublishedProducts / getProductBySlug) debe quitarlo,
 * conservando el resto del metadata.
 */
import { describe, it, expect } from 'vitest'
import { stripSensitiveMetadata } from '@/lib/partners/catalog'

describe('stripSensitiveMetadata — arte print-ready', () => {
  it('quita print_ready_url y print_side del metadata público', () => {
    const product = {
      id: 'p1',
      name: 'Remera',
      metadata: {
        sizes: ['S', 'M', 'L'],
        colors: [{ name: 'Negro', hex: '#000', images: { front: 'f.png', back: 'b.png' } }],
        cardDescription: 'desc',
        print_ready_url: 'https://bucket/partner-print-ready/tenant/arte.png',
        print_side: 'dorso',
      },
    }

    const safe = stripSensitiveMetadata(product)
    const meta = safe.metadata as Record<string, unknown>

    // Lo sensible se va
    expect(meta.print_ready_url).toBeUndefined()
    expect(meta.print_side).toBeUndefined()
    // Lo público se conserva
    expect(meta.sizes).toEqual(['S', 'M', 'L'])
    expect(meta.cardDescription).toBe('desc')
    expect(Array.isArray(meta.colors)).toBe(true)
    // No filtra el arte en ninguna serialización del objeto saneado
    expect(JSON.stringify(safe)).not.toContain('partner-print-ready')
    expect(JSON.stringify(safe)).not.toContain('print_ready_url')
  })

  it('sigue quitando costo/margen (no rompe el comportamiento previo)', () => {
    const product = { metadata: { costo: 1000, margen: 500, sizes: ['M'] } }
    const meta = stripSensitiveMetadata(product).metadata as Record<string, unknown>
    expect(meta.costo).toBeUndefined()
    expect(meta.margen).toBeUndefined()
    expect(meta.sizes).toEqual(['M'])
  })
})
