// @vitest-environment node
/**
 * Tests for Nova's system prompt — verifies capabilities, action format, and language.
 */
import { describe, it, expect, vi, beforeAll } from 'vitest'

// Mock catalog exports so the module loads without DB/env
vi.mock('@/lib/catalog', () => ({
  buildProductListForPrompt: () => 'Aldea Classic $28600\nAura Oversize $31000',
  buildShippingForPrompt: () => 'AMBA $5500, Interior $7000',
  SIZES: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
}))

// Mock embedding/vector deps
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

let SYSTEM_PROMPT: string

beforeAll(async () => {
  // Dynamically import to get the evaluated SYSTEM_PROMPT
  // We read it from the source since it's not exported — parse the file
  const fs = await import('node:fs')
  const path = await import('node:path')
  const src = fs.readFileSync(
    path.resolve(__dirname, '../../lib/rag/public-chat.ts'),
    'utf-8',
  )
  // Extract the SYSTEM_PROMPT template literal (between the backticks)
  const match = src.match(/const SYSTEM_PROMPT = `([\s\S]*?)`/)
  if (!match) throw new Error('Could not extract SYSTEM_PROMPT from source')
  SYSTEM_PROMPT = match[1]
})

describe('Nova system prompt', () => {
  describe('required capabilities', () => {
    it('mentions design generation', () => {
      expect(SYSTEM_PROMPT).toContain('Generar disenos con IA')
    })

    it('mentions mockup creation', () => {
      expect(SYSTEM_PROMPT).toContain('mockup')
    })

    it('mentions cart functionality', () => {
      expect(SYSTEM_PROMPT).toContain('carrito')
    })

    it('mentions product catalog', () => {
      expect(SYSTEM_PROMPT).toContain('catalogo')
    })

    it('mentions artistic styles', () => {
      expect(SYSTEM_PROMPT).toContain('estilos artisticos')
    })

    it('mentions shipping info', () => {
      expect(SYSTEM_PROMPT).toContain('envios')
    })

    it('mentions pricing info', () => {
      expect(SYSTEM_PROMPT).toContain('precios')
    })

    it('mentions guiding to purchase', () => {
      expect(SYSTEM_PROMPT).toContain('compra')
    })
  })

  describe('action format instructions', () => {
    const ACTIONS = [
      'GENERATE_DESIGN',
      'SHOW_MOCKUP',
      'ADD_TO_CART',
      'SHOW_CATALOG',
      'SHOW_STYLES',
      'SHOW_PRICING',
      'CHECKOUT',
    ]

    it.each(ACTIONS)('includes [ACTION:%s] format', (action) => {
      expect(SYSTEM_PROMPT).toContain(`[ACTION:${action}]`)
    })

    it('explains pipe-separated params', () => {
      expect(SYSTEM_PROMPT).toContain('|')
    })

    it('includes usage examples', () => {
      expect(SYSTEM_PROMPT).toContain('Ejemplo:')
    })

    it('includes "Usar cuando" guidance for actions', () => {
      expect(SYSTEM_PROMPT).toContain('Usar cuando:')
    })
  })

  describe('language', () => {
    it('is written in Spanish', () => {
      // Key Spanish markers
      expect(SYSTEM_PROMPT).toContain('Sos Nova')
      expect(SYSTEM_PROMPT).toContain('espanol argentino')
    })

    it('instructs to always respond in Argentine Spanish', () => {
      expect(SYSTEM_PROMPT).toContain('Responde SIEMPRE en espanol argentino')
    })

    it('uses voseo (Argentine informal)', () => {
      // "Sos" is Argentine voseo for "you are"
      expect(SYSTEM_PROMPT).toContain('Sos ')
    })
  })
})
