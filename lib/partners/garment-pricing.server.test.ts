import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

/**
 * Hallazgo #1 (parcial): garment-pricing.server.ts es el único punto server-only
 * desde el que código server puede acceder al pricing crudo (con `cost`, el costo
 * real de producción). Estos tests verifican que:
 *  1. El módulo arranca con `import 'server-only'` como primera línea no comentada
 *     — así, si algún día se importa (directa o transitivamente) desde un
 *     componente cliente, el build de Next falla en runtime real.
 *  2. Ninguno de los 4 componentes cliente conocidos que hoy importan el pricing
 *     "crudo" (`./garment-pricing`, todavía sin extraer del todo — ver comentario
 *     en garment-pricing.ts) importa por error el módulo server-only nuevo.
 */

const REPO_ROOT = join(__dirname, '..', '..')

const KNOWN_CLIENT_FILES = [
  'app/workspace/design-engine/page.tsx',
  'app/workspace/catalog/page.tsx',
  'components/workspace/MarginBreakdown.tsx',
  'components/partners/storefront-designer.tsx',
]

describe('garment-pricing.server.ts — aislamiento server-only', () => {
  it('tiene `import \'server-only\'` como primera línea no comentada', () => {
    const src = readFileSync(join(__dirname, 'garment-pricing.server.ts'), 'utf-8')
    const firstNonEmptyLine = src.split('\n').find((l) => l.trim().length > 0) || ''
    expect(firstNonEmptyLine.trim()).toBe("import 'server-only'")
  })

  it('ningún componente cliente conocido importa garment-pricing.server', () => {
    const offenders: string[] = []
    for (const relPath of KNOWN_CLIENT_FILES) {
      const src = readFileSync(join(REPO_ROOT, relPath), 'utf-8')
      if (/garment-pricing\.server/.test(src)) {
        offenders.push(relPath)
      }
    }
    expect(offenders).toEqual([])
  })

  it('los 4 archivos cliente conocidos siguen marcados \'use client\' (sanity check de que el fixture es correcto)', () => {
    for (const relPath of KNOWN_CLIENT_FILES) {
      const src = readFileSync(join(REPO_ROOT, relPath), 'utf-8')
      expect(src.includes("'use client'") || src.includes('"use client"')).toBe(true)
    }
  })
})
