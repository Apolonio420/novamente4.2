// @vitest-environment node
/**
 * Tests for RAG knowledge base sources — verifies all public docs exist and contain expected content.
 */
import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

const DOCS_DIR = path.resolve(__dirname, '../../docs/public')

const PUBLIC_SOURCES = [
  'PRODUCTS.md',
  'STYLES.md',
  'SHIPPING.md',
  'FAQ.md',
  'COMPANY.md',
  'PARTNERS.md',
]

describe('RAG public docs', () => {
  describe('all 6 sources exist and are non-empty', () => {
    it.each(PUBLIC_SOURCES)('%s exists', (file) => {
      const filePath = path.join(DOCS_DIR, file)
      expect(fs.existsSync(filePath)).toBe(true)
    })

    it.each(PUBLIC_SOURCES)('%s is non-empty', (file) => {
      const content = fs.readFileSync(path.join(DOCS_DIR, file), 'utf-8')
      expect(content.trim().length).toBeGreaterThan(100)
    })
  })

  describe('STYLES.md contains all 37 style names', () => {
    let stylesContent: string

    beforeAll(() => {
      stylesContent = fs.readFileSync(path.join(DOCS_DIR, 'STYLES.md'), 'utf-8')
    })

    it('mentions 37 styles', () => {
      expect(stylesContent).toContain('37 estilos')
    })

    // Extract style slugs from the file: pattern (slug-name)
    it('contains exactly 37 style entries', () => {
      const styleEntries = stylesContent.match(/\*\*[^*]+\*\* \([a-z0-9-]+\)/g) || []
      expect(styleEntries.length).toBe(37)
    })

    const EXPECTED_STYLES = [
      'minimalista-lineal',
      'line-art-tatuaje',
      'brutalista-minimalista',
      'sticker-style',
      'pop-minimalista',
      'vintage-poster',
      'vintage',
      'pixel-art-retro',
      'retro-vaporwave',
      'retro-cassette',
      'manga-anime',
      'manga-estilizado',
      'ghibli-like',
      'chibi-3d',
      'voxel-lego',
      'isometrico-futurista',
      'neon-cyberpunk',
      '3d-translucido',
      'conceptual-isometrico',
      'acuarela-digital',
      'psicodelico',
      'grunge-distressed',
      'tribal-etnico',
      'geometrico-abstracto',
      'geometrico',
      'cartoon-western',
      'cartoon',
      'collage-surrealista',
      'surrealista',
      'surreal-vectorial',
      'tipografico',
      'editorial-tipografia',
      'vectorial',
      'botanica-vintage',
      'acuarela-naturaleza',
      'acuarela-urbana',
      'urbano-streetwear',
    ]

    it('has all 37 expected style slugs', () => {
      expect(EXPECTED_STYLES.length).toBe(37)
      for (const slug of EXPECTED_STYLES) {
        expect(stylesContent).toContain(`(${slug})`)
      }
    })
  })

  describe('FAQ.md contains real FAQs', () => {
    let faqContent: string

    beforeAll(() => {
      faqContent = fs.readFileSync(path.join(DOCS_DIR, 'FAQ.md'), 'utf-8')
    })

    it('has question headings (###)', () => {
      const questions = faqContent.match(/^### .+/gm) || []
      expect(questions.length).toBeGreaterThanOrEqual(10)
    })

    it('covers key FAQ topics', () => {
      const topics = [
        'DTG',
        'envío',
        'talles',
        'devolucion',
        'pago',
        'Partners',
        'IA',
        'lavado',
      ]
      for (const topic of topics) {
        expect(faqContent.toLowerCase()).toContain(topic.toLowerCase())
      }
    })

    it('includes contact info', () => {
      expect(faqContent).toContain('WhatsApp')
      expect(faqContent).toContain('contact@novamente.ar')
    })

    it('includes real product prices (not placeholders)', () => {
      // Should have ARS prices like $28,600
      const prices = faqContent.match(/\$[\d.,]+/g) || []
      expect(prices.length).toBeGreaterThanOrEqual(3)
    })
  })
})
