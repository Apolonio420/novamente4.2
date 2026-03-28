// @vitest-environment node
/**
 * Tests for parseActions() — validates action tag extraction from assistant responses.
 */
import { describe, it, expect, vi } from 'vitest'

// Mock deps so module loads
vi.mock('@/lib/catalog', () => ({
  buildProductListForPrompt: () => '',
  buildShippingForPrompt: () => '',
  SIZES: [],
}))
vi.mock('@/lib/rag/chunker', () => ({ chunkMarkdown: () => [] }))
vi.mock('@/lib/rag/embeddings', () => ({
  embedDocuments: async () => [],
  embedQuery: async () => [],
}))
vi.mock('@/lib/rag/vector-store', () => ({
  InMemoryVectorStore: vi.fn().mockImplementation(() => ({
    size: 0,
    addDocuments: vi.fn(),
    search: vi.fn().mockReturnValue([]),
  })),
}))

import { parseActions } from '@/lib/rag/public-chat'

describe('parseActions', () => {
  it('returns empty actions for plain text', () => {
    const result = parseActions('Hola, soy Nova! En que te puedo ayudar?')
    expect(result.actions).toHaveLength(0)
    expect(result.cleanText).toBe('Hola, soy Nova! En que te puedo ayudar?')
  })

  describe('[ACTION:GENERATE_DESIGN]', () => {
    it('parses description and style', () => {
      const text = 'Te genero un diseno!\n[ACTION:GENERATE_DESIGN] leon geometrico minimalista | geometrico-abstracto'
      const { actions, cleanText } = parseActions(text)

      expect(actions).toHaveLength(1)
      expect(actions[0].type).toBe('GENERATE_DESIGN')
      expect(actions[0].params[0]).toBe('leon geometrico minimalista')
      expect(actions[0].params[1]).toBe('geometrico-abstracto')
      expect(cleanText).toBe('Te genero un diseno!')
    })

    it('works without optional style', () => {
      const text = 'Dale!\n[ACTION:GENERATE_DESIGN] un gato con sombrero'
      const { actions } = parseActions(text)

      expect(actions[0].type).toBe('GENERATE_DESIGN')
      expect(actions[0].params).toHaveLength(1)
      expect(actions[0].params[0]).toBe('un gato con sombrero')
    })
  })

  describe('[ACTION:SHOW_STYLES]', () => {
    it('triggers style gallery with no params', () => {
      const text = 'Aca te muestro los estilos disponibles:\n[ACTION:SHOW_STYLES]'
      const { actions, cleanText } = parseActions(text)

      expect(actions).toHaveLength(1)
      expect(actions[0].type).toBe('SHOW_STYLES')
      expect(actions[0].params).toHaveLength(0)
      expect(cleanText).toBe('Aca te muestro los estilos disponibles:')
    })
  })

  describe('[ACTION:SHOW_MOCKUP]', () => {
    it('includes all required params: url, garment, color, side, size', () => {
      const text = 'Aca va el mockup!\n[ACTION:SHOW_MOCKUP] https://r2.example.com/design.png | aura-oversize-tshirt | black | front | R3'
      const { actions } = parseActions(text)

      expect(actions).toHaveLength(1)
      expect(actions[0].type).toBe('SHOW_MOCKUP')
      expect(actions[0].params).toHaveLength(5)
      expect(actions[0].params[0]).toContain('https://')
      expect(actions[0].params[1]).toBe('aura-oversize-tshirt')
      expect(actions[0].params[2]).toBe('black')
      expect(actions[0].params[3]).toBe('front')
      expect(actions[0].params[4]).toBe('R3')
    })
  })

  describe('[ACTION:ADD_TO_CART]', () => {
    it('includes all product fields: name, garmentType, color, size, price, mockupUrl', () => {
      const text = 'Listo, te lo agrego al carrito!\n[ACTION:ADD_TO_CART] Aura Oversize Negra | aura-oversize-tshirt | black | M | 31000 | https://r2.example.com/mockup.png'
      const { actions } = parseActions(text)

      expect(actions).toHaveLength(1)
      expect(actions[0].type).toBe('ADD_TO_CART')
      expect(actions[0].params).toHaveLength(6)
      expect(actions[0].params[0]).toBe('Aura Oversize Negra')       // name
      expect(actions[0].params[1]).toBe('aura-oversize-tshirt')      // garmentType
      expect(actions[0].params[2]).toBe('black')                      // color
      expect(actions[0].params[3]).toBe('M')                          // size
      expect(actions[0].params[4]).toBe('31000')                      // price
      expect(actions[0].params[5]).toContain('https://')              // mockupUrl
    })
  })

  describe('[ACTION:SHOW_CATALOG]', () => {
    it('parses with no params', () => {
      const text = 'Te muestro nuestros productos!\n[ACTION:SHOW_CATALOG]'
      const { actions } = parseActions(text)

      expect(actions[0].type).toBe('SHOW_CATALOG')
      expect(actions[0].params).toHaveLength(0)
    })
  })

  describe('[ACTION:SHOW_PRICING]', () => {
    it('parses with no params', () => {
      const text = 'Aca estan los precios:\n[ACTION:SHOW_PRICING]'
      const { actions } = parseActions(text)

      expect(actions[0].type).toBe('SHOW_PRICING')
      expect(actions[0].params).toHaveLength(0)
    })
  })

  describe('[ACTION:CHECKOUT]', () => {
    it('parses with no params', () => {
      const text = 'Te llevo al checkout!\n[ACTION:CHECKOUT]'
      const { actions } = parseActions(text)

      expect(actions[0].type).toBe('CHECKOUT')
      expect(actions[0].params).toHaveLength(0)
    })
  })

  describe('multiple actions in one response', () => {
    it('parses two actions', () => {
      const text = 'Te genero el diseno y te lo muestro!\n[ACTION:GENERATE_DESIGN] dragon | manga-anime\n[ACTION:SHOW_STYLES]'
      const { actions, cleanText } = parseActions(text)

      expect(actions).toHaveLength(2)
      expect(actions[0].type).toBe('GENERATE_DESIGN')
      expect(actions[1].type).toBe('SHOW_STYLES')
      expect(cleanText).toBe('Te genero el diseno y te lo muestro!')
    })
  })

  describe('clean text extraction', () => {
    it('removes action lines and trims', () => {
      const text = 'Texto antes\n[ACTION:SHOW_CATALOG]\nTexto despues'
      const { cleanText } = parseActions(text)

      // The regex removes action lines; remaining text is joined
      expect(cleanText).not.toContain('[ACTION:')
      expect(cleanText).toContain('Texto antes')
    })
  })
})
