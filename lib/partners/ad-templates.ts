/**
 * Meta Ads template definitions and ad copy generation.
 */

export interface AdTemplate {
  type: string
  name: string
  desc: string
  dimensions: string
  format: 'feed' | 'story'
}

export const AD_TEMPLATES: AdTemplate[] = [
  {
    type: 'showcase',
    name: 'Product Showcase',
    desc: 'Producto hero con marca y CTA',
    dimensions: '1080x1080',
    format: 'feed',
  },
  {
    type: 'carousel',
    name: 'Carousel',
    desc: 'Multi-producto, un producto por slide',
    dimensions: '1080x1080',
    format: 'feed',
  },
  {
    type: 'story',
    name: 'Story',
    desc: 'Formato vertical full-screen',
    dimensions: '1080x1920',
    format: 'story',
  },
  {
    type: 'collection',
    name: 'Collection',
    desc: 'Grid de 4 productos',
    dimensions: '1080x1080',
    format: 'feed',
  },
  {
    type: 'before_after',
    name: 'Before/After',
    desc: 'Prenda lisa vs con diseno',
    dimensions: '1080x1080',
    format: 'feed',
  },
  {
    type: 'testimonial',
    name: 'Testimonial',
    desc: 'Quote sobre imagen de producto',
    dimensions: '1080x1080',
    format: 'feed',
  },
]

interface TenantInfo {
  name: string
  industry?: string
}

interface ProductInfo {
  name: string
  price?: number
}

interface AdCopyVariant {
  headline: string
  primaryText: string
  description: string
}

/**
 * Generate 3 ad copy variants for a given tenant + product combination.
 */
export function generateAdCopy(
  tenant: TenantInfo,
  product: ProductInfo,
): AdCopyVariant[] {
  const brand = tenant.name
  const industry = tenant.industry || 'moda'
  const prodName = product.name
  const priceText = product.price ? `$${product.price.toLocaleString('es-AR')}` : ''

  return [
    // Variant 1: Direct / urgency
    {
      headline: priceText
        ? `${prodName} - ${priceText}`
        : `${prodName} by ${brand}`,
      primaryText: `Dale identidad a tu marca con ${prodName} de ${brand}. Calidad premium, diseno unico.${priceText ? ` Desde ${priceText}.` : ''} Compra ahora.`,
      description: `${brand} | ${industry.charAt(0).toUpperCase() + industry.slice(1)} personalizada`,
    },
    // Variant 2: Emotional / aspirational
    {
      headline: `Tu marca merece ${prodName}`,
      primaryText: `Imagina tu equipo vistiendo ${prodName} con tu logo. ${brand} lo hace posible. Diseno exclusivo, entrega rapida.`,
      description: priceText
        ? `Desde ${priceText} | Envio a todo el pais`
        : `Personaliza hoy | Envio a todo el pais`,
    },
    // Variant 3: Social proof / FOMO
    {
      headline: `+100 marcas eligen ${brand}`,
      primaryText: `${prodName}: la eleccion favorita de marcas que buscan calidad y diseno. Unite a la comunidad ${brand}.${priceText ? ` ${priceText}.` : ''}`,
      description: `Pedidos personalizados | ${brand}`,
    },
  ]
}

/**
 * Budget recommendations by industry.
 */
export interface BudgetRecommendation {
  dailyMin: number
  dailyMax: number
  currency: string
  tip: string
}

const INDUSTRY_BUDGETS: Record<string, BudgetRecommendation> = {
  gastronomia: { dailyMin: 1500, dailyMax: 5000, currency: 'ARS', tip: 'Los anuncios de comida funcionan mejor entre 11am-1pm y 6pm-9pm' },
  deporte: { dailyMin: 2000, dailyMax: 6000, currency: 'ARS', tip: 'Segmenta por intereses deportivos y eventos locales' },
  cerveceria: { dailyMin: 1500, dailyMax: 4000, currency: 'ARS', tip: 'Los jueves y viernes tienen mejor CTR para bares y cervecerias' },
  gym: { dailyMin: 1000, dailyMax: 3000, currency: 'ARS', tip: 'Enero y septiembre son los meses de mayor conversion' },
  agencia: { dailyMin: 2000, dailyMax: 8000, currency: 'ARS', tip: 'Usa testimoniales y casos de exito como creatividades' },
  moda: { dailyMin: 2000, dailyMax: 7000, currency: 'ARS', tip: 'Los carruseles tienen 72% mas engagement en moda' },
  musica: { dailyMin: 1000, dailyMax: 3000, currency: 'ARS', tip: 'Sincroniza tus anuncios con fechas de shows o lanzamientos' },
  educacion: { dailyMin: 1000, dailyMax: 4000, currency: 'ARS', tip: 'Febrero-marzo y julio son las mejores epocas para captar alumnos' },
}

const DEFAULT_BUDGET: BudgetRecommendation = {
  dailyMin: 1500,
  dailyMax: 5000,
  currency: 'ARS',
  tip: 'Empieza con el minimo y escala cuando encuentres tu audiencia ganadora',
}

export function getBudgetRecommendation(industry?: string): BudgetRecommendation {
  if (!industry) return DEFAULT_BUDGET
  const key = industry.toLowerCase().replace(/\s+/g, '')
  return INDUSTRY_BUDGETS[key] || DEFAULT_BUDGET
}

/**
 * Targeting suggestions based on industry.
 */
export function getTargetingSuggestions(industry?: string): string[] {
  const base = [
    'Personas de 25-45 anos en tu ciudad',
    'Interesados en "merchandising" y "personalizacion"',
    'Lookalike audience basada en tus clientes actuales',
  ]

  const industryTargets: Record<string, string[]> = {
    gastronomia: ['Interesados en "restaurantes" y "gastronomia"', 'Seguidores de foodbloggers locales'],
    deporte: ['Interesados en deportes especificos', 'Miembros de clubes deportivos'],
    cerveceria: ['Interesados en "cerveza artesanal"', 'Seguidores de +21 anos'],
    moda: ['Interesados en "diseno de moda" y "streetwear"', 'Compradores frecuentes de ropa online'],
    musica: ['Interesados en generos musicales relevantes', 'Asistentes a eventos musicales'],
  }

  const key = (industry || '').toLowerCase().replace(/\s+/g, '')
  return [...base, ...(industryTargets[key] || [])]
}
