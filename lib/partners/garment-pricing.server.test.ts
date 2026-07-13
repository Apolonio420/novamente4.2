import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

/**
 * Hallazgo #1 (CERRADO 2026-07-04): garment-pricing.server.ts es el único punto
 * server-only desde el que código server puede acceder al pricing crudo (con
 * `cost`, el costo real de producción). Estos tests verifican que:
 *  1. El módulo arranca con `import 'server-only'` como primera línea no comentada
 *     — así, si algún día se importa (directa o transitivamente) desde un
 *     componente cliente, el build de Next falla en runtime real.
 *  2. Ninguno de los 4 componentes cliente conocidos importa VALORES de
 *     garment-pricing.server (solo se permite `import type` — se borra en
 *     compile time, nunca evalúa el módulo `server-only`).
 *  3. Ninguno de los 4 componentes cliente conocidos importa nada (valor o tipo)
 *     desde `./garment-pricing` que incluya el objeto crudo con `cost`
 *     (ALL_GARMENT_PRICING / GARMENT_PRICING / EXTRA_GARMENT_PRICING /
 *     getPartnerPlanPrice / getGrowthPrice / getPlanMargin / GarmentPricing).
 *     Ahora consumen `PublicGarmentPricing` (sin `cost`) servido por API routes
 *     server-side vía getAllPublicGarmentPricing/getPublicGarmentPricing.
 */

const REPO_ROOT = join(__dirname, '..', '..')

const KNOWN_CLIENT_FILES = [
  'app/workspace/design-engine/page.tsx',
  'app/workspace/catalog/page.tsx',
  'components/workspace/MarginBreakdown.tsx',
  'components/partners/storefront-designer.tsx',
]

// Símbolos que exponen (directa o vía el tipo) el campo `cost` crudo. Si
// cualquiera de estos aparece importado por VALOR en un componente cliente,
// el costo de producción vuelve a viajar al bundle público.
const UNSAFE_VALUE_SYMBOLS = [
  'ALL_GARMENT_PRICING',
  'GARMENT_PRICING',
  'EXTRA_GARMENT_PRICING',
  'getPartnerPlanPrice',
  'getGrowthPrice',
  'getPlanMargin',
]

/** Extrae los imports (no `import type`) que vienen de un módulo dado. */
function findValueImportsFrom(src: string, moduleSuffix: RegExp): string[] {
  const found: string[] = []
  const importRegex = /import\s+(type\s+)?\{([^}]*)\}\s+from\s+['"]([^'"]+)['"]/g
  let match: RegExpExecArray | null
  while ((match = importRegex.exec(src))) {
    const [, isTypeOnly, specifiers, moduleSpecifier] = match
    if (isTypeOnly) continue
    if (!moduleSuffix.test(moduleSpecifier)) continue
    for (const spec of specifiers.split(',')) {
      const name = spec.trim().replace(/^type\s+/, '').split(/\s+as\s+/)[0].trim()
      if (name) found.push(name)
    }
  }
  return found
}

describe('garment-pricing.server.ts — aislamiento server-only', () => {
  it('tiene `import \'server-only\'` como primera línea no comentada', () => {
    const src = readFileSync(join(__dirname, 'garment-pricing.server.ts'), 'utf-8')
    const firstNonEmptyLine = src.split('\n').find((l) => l.trim().length > 0) || ''
    expect(firstNonEmptyLine.trim()).toBe("import 'server-only'")
  })

  it('ningún componente cliente conocido importa VALORES de garment-pricing.server (solo `import type` permitido)', () => {
    const offenders: string[] = []
    for (const relPath of KNOWN_CLIENT_FILES) {
      const src = readFileSync(join(REPO_ROOT, relPath), 'utf-8')
      const valueImports = findValueImportsFrom(src, /garment-pricing\.server/)
      if (valueImports.length > 0) {
        offenders.push(`${relPath}: ${valueImports.join(', ')}`)
      }
    }
    expect(offenders).toEqual([])
  })

  it('ningún componente cliente conocido importa el pricing crudo (ALL_GARMENT_PRICING/GARMENT_PRICING/getPartnerPlanPrice/etc.) de ./garment-pricing', () => {
    const offenders: string[] = []
    for (const relPath of KNOWN_CLIENT_FILES) {
      const src = readFileSync(join(REPO_ROOT, relPath), 'utf-8')
      // Matchea el module specifier './garment-pricing' o '@/lib/partners/garment-pricing'
      // (nunca el .server, que se valida en el test anterior).
      const rawImports = findValueImportsFrom(src, /\/garment-pricing$/)
      const unsafe = rawImports.filter((name) => UNSAFE_VALUE_SYMBOLS.includes(name))
      if (unsafe.length > 0) {
        offenders.push(`${relPath}: ${unsafe.join(', ')}`)
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

  it('garment-pricing.ts (importable desde componentes cliente) no tiene un `import ... from` de garment-pricing-data.ts (donde vive `cost`)', () => {
    const src = readFileSync(join(__dirname, 'garment-pricing.ts'), 'utf-8')
    const imports = findValueImportsFrom(src, /garment-pricing-data/)
    expect(imports).toEqual([])
  })

  it('garment-pricing.ts no contiene el literal `cost:` (regresion: alguien reinlineo el catalogo crudo en el modulo client-safe)', () => {
    const src = readFileSync(join(__dirname, 'garment-pricing.ts'), 'utf-8')
    expect(src).not.toMatch(/\bcost\s*:\s*\d/)
  })

  it('garment-pricing-data.ts (el catalogo crudo) solo lo importa garment-pricing.server.ts, ningun otro modulo server ni los 4 componentes cliente', () => {
    const offenders: string[] = []
    const candidateFiles = [
      'lib/partners/garment-pricing.ts',
      'lib/partners/daily-attention.ts',
      'lib/partners/variants.ts',
      'lib/partners/ledger.ts',
      ...KNOWN_CLIENT_FILES,
    ]
    for (const relPath of candidateFiles) {
      const src = readFileSync(join(REPO_ROOT, relPath), 'utf-8')
      const imports = findValueImportsFrom(src, /garment-pricing-data/)
      if (imports.length > 0) {
        offenders.push(`${relPath}: ${imports.join(', ')}`)
      }
    }
    expect(offenders).toEqual([])
  })
})
