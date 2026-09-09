// normalizeIndustry mapea el texto libre de tenants.industry (onboarding /
// settings) a una categoría canónica para estadísticas. Los fixtures son
// valores REALES de producción (~200 tenants, ~100 valores distintos) para
// no diseñar reglas en el aire — ver lib/partners/industry.ts para el
// contexto completo y el orden de prioridad cuando un texto matchea más de
// una categoría.
import { describe, it, expect } from 'vitest'
import { normalizeIndustry, industryLabel, isIndustrySlug, INDUSTRY_CATEGORIES } from './industry'

describe('normalizeIndustry', () => {
  it('devuelve null para vacío, null, undefined y "-"', () => {
    expect(normalizeIndustry(null)).toBeNull()
    expect(normalizeIndustry(undefined)).toBeNull()
    expect(normalizeIndustry('')).toBeNull()
    expect(normalizeIndustry('   ')).toBeNull()
    expect(normalizeIndustry('-')).toBeNull()
  })

  it('respeta la prioridad cuando el texto matchea más de una categoría', () => {
    // deportes > streetwear > coleccionismo_web3 > musica_arte >
    // comunidad_causa > merch_empresa > indumentaria
    expect(normalizeIndustry('indumentaria deportiva')).toBe('deportes')
    expect(normalizeIndustry('fitness · streetwear')).toBe('deportes')
    expect(normalizeIndustry('ropa urbana')).toBe('streetwear')
    expect(normalizeIndustry('merch / indumentaria')).toBe('merch_empresa')
  })

  // raw → slug esperado, valores reales de prod (2026-09).
  const cases: [string, string | null][] = [
    ['indumentaria', 'indumentaria'],
    ['ropa', 'indumentaria'],
    ['moda', 'indumentaria'],
    ['gym', 'deportes'],
    ['coleccionismo / web3', 'coleccionismo_web3'],
    ['deporte', 'deportes'],
    ['indumentaria_streetwear', 'streetwear'],
    ['otro', 'otro'],
    ['ropa personalizada', 'indumentaria'],
    ['textil', 'indumentaria'],
    ['estudio creativo', 'musica_arte'],
    ['indumentaria deportiva', 'deportes'],
    ['merch / indumentaria', 'merch_empresa'],
    ['musica', 'musica_arte'],
    ['streetwear', 'streetwear'],
    ['-', null],
    ['academia de ia generativa', 'comunidad_causa'],
    ['banda', 'musica_arte'],
    ['beer sommelier', 'merch_empresa'],
    ['ciclismo', 'deportes'],
    ['cursos de fútbol', 'deportes'],
    ['danzas / indumentaria', 'musica_arte'],
    ['emprendimiento social', 'comunidad_causa'],
    ['estancia de campo', 'merch_empresa'],
    ['fitness · streetwear', 'deportes'],
    ['gastronomía', 'merch_empresa'],
    ['indmentaria', 'indumentaria'], // typo real de prod (falta la "u")
    ['indumentaria y regalería', 'merch_empresa'],
    ['inmobiliaria', 'merch_empresa'],
    ['remeras peronistas', 'comunidad_causa'],
    ['ropa cristiana', 'comunidad_causa'],
    ['ropa urbana adolescente', 'streetwear'],
    ['streetwear · identidad argentina', 'streetwear'],
    ['surf y deportes acuáticos', 'deportes'],
    ['tienda online', 'indumentaria'],
    ['varios', 'otro'],
    ['windsurf y deportes acuáticos', 'deportes'],
    ['productos naturales kit metabólicos soluciones naturales', 'merch_empresa'],
    ['imágenes digitales', 'musica_arte'],
  ]

  it.each(cases)('%s → %s', (raw, expected) => {
    expect(normalizeIndustry(raw)).toBe(expected)
  })

  it('es case/accent-insensitive', () => {
    expect(normalizeIndustry('INDUMENTARIA')).toBe('indumentaria')
    expect(normalizeIndustry('Música')).toBe('musica_arte')
    expect(normalizeIndustry('GASTRONOMÍA')).toBe('merch_empresa')
  })

  it.each(INDUSTRY_CATEGORIES.map((c) => c.slug))(
    'es idempotente: normalizeIndustry(%s) === %s',
    (slug) => {
      expect(normalizeIndustry(slug)).toBe(slug)
    },
  )
})

describe('isIndustrySlug', () => {
  it('reconoce todos los slugs de INDUSTRY_CATEGORIES', () => {
    for (const { slug } of INDUSTRY_CATEGORIES) {
      expect(isIndustrySlug(slug)).toBe(true)
    }
  })

  it('rechaza texto libre, vacío y valores no-string', () => {
    expect(isIndustrySlug('remeras peronistas')).toBe(false)
    expect(isIndustrySlug('')).toBe(false)
    expect(isIndustrySlug(null)).toBe(false)
    expect(isIndustrySlug(undefined)).toBe(false)
  })
})

describe('industryLabel', () => {
  it('prioriza metadata.industry_raw sobre la etiqueta de categoría', () => {
    expect(industryLabel({ industry: 'indumentaria', metadata: { industry_raw: 'remeras peronistas' } }))
      .toBe('remeras peronistas')
  })

  it('cae a la etiqueta de la categoría si no hay industry_raw', () => {
    expect(industryLabel({ industry: 'streetwear', metadata: {} })).toBe('Streetwear')
    expect(industryLabel({ industry: 'merch_empresa' })).toBe('Merch para tu negocio')
  })

  it('devuelve null si no hay industry ni metadata', () => {
    expect(industryLabel({})).toBeNull()
    expect(industryLabel({ industry: null })).toBeNull()
  })

  it('ignora industry_raw en blanco', () => {
    expect(industryLabel({ industry: 'otro', metadata: { industry_raw: '   ' } })).toBe('Otro')
  })

  // Filas sin backfill: el texto original del partner sigue en la columna
  // `industry` y no hay metadata.industry_raw. Devolver null ahi borraba el
  // rubro de /marcas y del directorio para la mayoria de las tiendas.
  it('cae al texto libre de industry cuando no es un slug canónico', () => {
    expect(industryLabel({ industry: 'Beer Sommelier' })).toBe('Beer Sommelier')
    expect(industryLabel({ industry: 'fitness · streetwear', metadata: {} })).toBe('fitness · streetwear')
    expect(industryLabel({ industry: '  Remeras Peronistas  ' })).toBe('Remeras Peronistas')
  })

  it('trata industry vacío o "-" como sin dato', () => {
    expect(industryLabel({ industry: '' })).toBeNull()
    expect(industryLabel({ industry: '   ' })).toBeNull()
    expect(industryLabel({ industry: '-' })).toBeNull()
  })
})

describe('INDUSTRY_CATEGORIES', () => {
  it('tiene exactamente los 8 slugs esperados, en orden', () => {
    expect(INDUSTRY_CATEGORIES.map((c) => c.slug)).toEqual([
      'indumentaria',
      'streetwear',
      'deportes',
      'musica_arte',
      'comunidad_causa',
      'coleccionismo_web3',
      'merch_empresa',
      'otro',
    ])
  })
})
