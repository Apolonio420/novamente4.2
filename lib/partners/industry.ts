/**
 * Categorización canónica de `tenants.industry`.
 *
 * `industry` es texto libre que el partner escribe en el onboarding
 * (app/api/partners/onboarding/route.ts) o en Configuración
 * (app/api/partners/settings/route.ts) — en prod hay ~200 tenants con ~100
 * valores distintos ("indumentaria", "ropa", "remeras peronistas",
 * "coleccionismo / web3", "beer sommelier", etc.), inútil para estadísticas.
 *
 * `normalizeIndustry` mapea ese texto libre a una de las categorías de abajo
 * para poder agrupar/graficar. El texto original del partner NO se pierde:
 * se guarda tal cual en `tenants.metadata.industry_raw` (ver escritores en
 * onboarding/settings) para que los generadores de copy con IA
 * (lib/partners/agent.ts, ad-templates.ts, app/api/llms/route.ts,
 * unified-directory.ts) sigan teniendo el matiz descriptivo — usar
 * `industryLabel(tenant)` en esos lectores.
 */

export interface IndustryCategory {
  slug: string
  label: string
}

// Orden = orden de presentación en el <select> del onboarding.
export const INDUSTRY_CATEGORIES: IndustryCategory[] = [
  { slug: 'indumentaria', label: 'Indumentaria' },
  { slug: 'streetwear', label: 'Streetwear' },
  { slug: 'deportes', label: 'Deportes' },
  { slug: 'musica_arte', label: 'Música / Arte' },
  { slug: 'comunidad_causa', label: 'Comunidad / Causa' },
  { slug: 'coleccionismo_web3', label: 'Coleccionismo / Web3' },
  { slug: 'merch_empresa', label: 'Merch para tu negocio' },
  { slug: 'otro', label: 'Otro' },
]

const CATEGORY_LABEL: Record<string, string> = Object.fromEntries(
  INDUSTRY_CATEGORIES.map((c) => [c.slug, c.label]),
)

const INDUSTRY_SLUGS = new Set(INDUSTRY_CATEGORIES.map((c) => c.slug))

/** true si `value` ya es, tal cual, uno de los slugs de INDUSTRY_CATEGORIES. */
export function isIndustrySlug(value: string | null | undefined): value is string {
  return typeof value === 'string' && INDUSTRY_SLUGS.has(value)
}

/** Minúsculas y sin acentos, para matchear case/accent-insensitive. */
export function fold(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
}

// Prioridad de match cuando el texto matchea mas de una categoria (ej.
// "indumentaria deportiva" → deportes, "fitness · streetwear" → deportes,
// "ropa urbana" → streetwear, "merch / indumentaria" → merch_empresa).
// El orden de este array ES la prioridad: se evalúa de arriba hacia abajo y
// gana la primera que matchea.
const RULES: { slug: string; keywords: string[] }[] = [
  {
    slug: 'deportes',
    keywords: ['gym', 'fitness', 'running', 'ciclismo', 'surf', 'futbol', 'deportiv', 'deporte'],
  },
  {
    slug: 'streetwear',
    keywords: ['streetwear', 'urbano', 'urbana', 'alternativ'],
  },
  {
    slug: 'coleccionismo_web3',
    keywords: ['coleccionismo', 'coleccion', 'web3', 'blockchain'],
  },
  {
    slug: 'musica_arte',
    keywords: ['banda', 'musica', 'arte', 'diseno', 'estudio creativo', 'entretenimiento', 'imagen', 'danza'],
  },
  {
    slug: 'comunidad_causa',
    keywords: ['comunidad', 'social', 'religios', 'cristian', 'politic', 'peronis', 'identidad', 'nacional', 'educacion', 'academia', 'conferencia'],
  },
  {
    slug: 'merch_empresa',
    keywords: ['gastronom', 'cerveza', 'cervecer', 'beer', 'inmobiliari', 'estancia', 'bellez', 'salud', 'natural', 'comercio', 'bares', 'regaleria', 'regalos', 'merch'],
  },
  {
    slug: 'indumentaria',
    keywords: ['indumentaria', 'indmentaria', 'ropa', 'remera', 'textil', 'tienda', 'moda'],
  },
]

/**
 * Mapea texto libre a una categoría canónica. Case/accent-insensitive.
 * - `null`/vacío/"-" → null (sin dato)
 * - texto no vacío que no matchea ninguna regla → 'otro'
 */
export function normalizeIndustry(raw: string | null | undefined): string | null {
  if (!raw) return null
  const trimmed = raw.trim()
  if (!trimmed || trimmed === '-') return null

  const folded = fold(trimmed)
  for (const rule of RULES) {
    if (rule.keywords.some((k) => folded.includes(k))) return rule.slug
  }
  return 'otro'
}

/**
 * Texto para mostrar/usar como contexto descriptivo (copy IA, listados
 * públicos): prioriza la redacción original del partner
 * (`metadata.industry_raw`) y cae a la etiqueta de la categoría si no hay.
 */
export function industryLabel(tenant: { industry?: string | null; metadata?: any }): string | null {
  const raw = tenant?.metadata?.industry_raw
  if (typeof raw === 'string' && raw.trim()) return raw.trim()

  const slug = tenant?.industry
  if (slug && CATEGORY_LABEL[slug]) return CATEGORY_LABEL[slug]

  return null
}
