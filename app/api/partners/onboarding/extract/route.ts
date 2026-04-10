import { NextRequest, NextResponse } from 'next/server'
import * as cheerio from 'cheerio'
import { GoogleGenerativeAI } from '@google/generative-ai'

export const maxDuration = 30

export async function POST(req: NextRequest) {
  try {
    const { url, mode } = await req.json()
    if (!url || typeof url !== 'string') {
      return NextResponse.json({ success: false, error: 'URL requerida' }, { status: 400 })
    }

    // Normalize URL
    let targetUrl = url.trim()
    if (!targetUrl.startsWith('http')) targetUrl = `https://${targetUrl}`

    // Fetch the page
    let html: string
    try {
      const res = await fetch(targetUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; NovamenteBot/1.0)',
          'Accept': 'text/html,application/xhtml+xml',
        },
        signal: AbortSignal.timeout(10000),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      html = await res.text()
    } catch {
      return NextResponse.json({ success: false, error: 'No se pudo acceder al sitio' }, { status: 422 })
    }

    const $ = cheerio.load(html)

    // Extract raw data from HTML
    const extracted = {
      title: $('title').text().trim() || $('meta[property="og:title"]').attr('content') || null,
      description: $('meta[name="description"]').attr('content') || $('meta[property="og:description"]').attr('content') || null,
      ogImage: $('meta[property="og:image"]').attr('content') || null,
      logo: extractLogo($, targetUrl),
      colors: extractColors($, html),
      fonts: extractFonts($, html),
      socialLinks: extractSocialLinks($),
      instagram: extractInstagram($),
      tagline: $('h1').first().text().trim() || $('meta[property="og:title"]').attr('content') || null,
      images: extractImages($, targetUrl),
    }

    // Use Gemini to analyze and structure the brand identity
    const brandKit = await analyzeBrandWithGemini(extracted, targetUrl, mode || 'brand')

    return NextResponse.json({ success: true, extracted: brandKit })
  } catch (err) {
    console.error('Extract error:', err)
    return NextResponse.json({ success: false, error: 'Error al analizar el sitio' }, { status: 500 })
  }
}

function resolveUrl(href: string | undefined, base: string): string | null {
  if (!href) return null
  try {
    return new URL(href, base).href
  } catch {
    return null
  }
}

function extractLogo($: cheerio.CheerioAPI, base: string): string | null {
  // Try common logo selectors
  const selectors = [
    'link[rel="icon"][type="image/svg+xml"]',
    'link[rel="apple-touch-icon"]',
    'link[rel="icon"][sizes="192x192"]',
    'link[rel="icon"][sizes="180x180"]',
    'link[rel="shortcut icon"]',
    'link[rel="icon"]',
    'img[class*="logo"]',
    'img[alt*="logo" i]',
    'img[src*="logo" i]',
    'header img:first-of-type',
    'nav img:first-of-type',
  ]

  for (const sel of selectors) {
    const el = $(sel).first()
    const src = el.attr('href') || el.attr('src')
    const resolved = resolveUrl(src, base)
    if (resolved) return resolved
  }

  return null
}

function extractColors($: cheerio.CheerioAPI, html: string): string[] {
  const colors = new Set<string>()

  // From inline styles and CSS
  const hexPattern = /#[0-9a-fA-F]{3,8}/g
  const rgbPattern = /rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)/g

  // Check style tags
  $('style').each((_, el) => {
    const css = $(el).text()
    const hexMatches = css.match(hexPattern)
    if (hexMatches) hexMatches.forEach(c => colors.add(c.toLowerCase()))
    const rgbMatches = css.match(rgbPattern)
    if (rgbMatches) rgbMatches.forEach(c => colors.add(c))
  })

  // Check inline styles on key elements
  $('[style]').each((_, el) => {
    const style = $(el).attr('style') || ''
    const hexMatches = style.match(hexPattern)
    if (hexMatches) hexMatches.forEach(c => colors.add(c.toLowerCase()))
  })

  // Check CSS custom properties (--brand-color etc)
  const cssVarPattern = /--[\w-]*(color|bg|brand|primary|secondary|accent)[\w-]*:\s*([^;]+)/gi
  const allStyles = $('style').map((_, el) => $(el).text()).get().join('\n')
  let match
  while ((match = cssVarPattern.exec(allStyles)) !== null) {
    const val = match[2].trim()
    if (val.startsWith('#') || val.startsWith('rgb')) colors.add(val)
  }

  // Filter out common non-brand colors
  const filtered = [...colors].filter(c => {
    const lower = c.toLowerCase()
    return !['#fff', '#ffffff', '#000', '#000000', '#333', '#666', '#999', '#ccc', '#eee', '#f5f5f5', '#e5e7eb', 'rgb(0, 0, 0)', 'rgb(255, 255, 255)'].includes(lower)
  })

  return filtered.slice(0, 20)
}

function extractFonts($: cheerio.CheerioAPI, html: string): string[] {
  const fonts = new Set<string>()

  // Google Fonts links
  $('link[href*="fonts.googleapis.com"]').each((_, el) => {
    const href = $(el).attr('href') || ''
    const familyMatch = href.match(/family=([^&:]+)/g)
    if (familyMatch) {
      familyMatch.forEach(f => {
        const name = f.replace('family=', '').replace(/\+/g, ' ').split(':')[0]
        fonts.add(name)
      })
    }
  })

  // font-family in CSS
  const fontFamilyPattern = /font-family:\s*['"]?([^'",;}\n]+)/gi
  const allCSS = $('style').map((_, el) => $(el).text()).get().join('\n')
  let match
  while ((match = fontFamilyPattern.exec(allCSS)) !== null) {
    const name = match[1].trim()
    if (!['inherit', 'initial', 'sans-serif', 'serif', 'monospace', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Arial', 'Helvetica'].includes(name)) {
      fonts.add(name)
    }
  }

  return [...fonts].slice(0, 5)
}

function extractSocialLinks($: cheerio.CheerioAPI): Record<string, string> {
  const socials: Record<string, string> = {}
  const patterns: Record<string, RegExp> = {
    instagram: /instagram\.com\/([^/?#"]+)/,
    facebook: /facebook\.com\/([^/?#"]+)/,
    twitter: /(twitter|x)\.com\/([^/?#"]+)/,
    tiktok: /tiktok\.com\/@?([^/?#"]+)/,
    youtube: /youtube\.com\/(c\/|channel\/|@)?([^/?#"]+)/,
    linkedin: /linkedin\.com\/(company|in)\/([^/?#"]+)/,
  }

  $('a[href]').each((_, el) => {
    const href = $(el).attr('href') || ''
    for (const [platform, re] of Object.entries(patterns)) {
      if (!socials[platform] && re.test(href)) {
        socials[platform] = href
      }
    }
  })

  return socials
}

function extractInstagram($: cheerio.CheerioAPI): string | null {
  let ig: string | null = null
  $('a[href*="instagram.com"]').each((_, el) => {
    if (ig) return
    const href = $(el).attr('href') || ''
    const match = href.match(/instagram\.com\/([^/?#"]+)/)
    if (match && match[1] !== 'p' && match[1] !== 'reel') {
      ig = match[1]
    }
  })
  return ig
}

function extractImages($: cheerio.CheerioAPI, base: string): string[] {
  const imgs: string[] = []
  $('img[src]').each((_, el) => {
    const src = resolveUrl($(el).attr('src'), base)
    if (src && !src.includes('data:') && !src.includes('pixel') && !src.includes('1x1')) {
      imgs.push(src)
    }
  })
  return imgs.slice(0, 10)
}

async function analyzeBrandWithGemini(
  extracted: Record<string, unknown>,
  url: string,
  mode: string
) {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    generationConfig: { responseMimeType: 'application/json' },
  })

  const prompt = mode === 'inspiration'
    ? `Analiza la estetica visual de este sitio web y sugiere un estilo visual para una tienda de indumentaria/merchandising.

URL: ${url}
Datos extraidos: ${JSON.stringify(extracted, null, 2)}

Responde en JSON con esta estructura exacta:
{
  "name": null,
  "description": null,
  "logo": null,
  "images": [],
  "colors": {
    "primary": "#hex o null",
    "secondary": "#hex o null",
    "accent": "#hex o null",
    "background": "#hex o null",
    "text": "#hex o null",
    "all": ["array de todos los colores relevantes"]
  },
  "font": "nombre de la fuente principal o null",
  "fonts": ["array de fuentes detectadas"],
  "socialLinks": {},
  "instagram": null,
  "tagline": null,
  "businessOverview": null,
  "brandTone": "descripcion del tono de la marca en 1 linea",
  "suggestedStyle": "minimal|bold|editorial|sport|corporate|urbano|creativo",
  "colorScheme": "dark|light|vibrant|pastel|monochrome"
}`
    : `Analiza la identidad de marca de este sitio web para crear un storefront de indumentaria/merchandising.

URL: ${url}
Datos extraidos: ${JSON.stringify(extracted, null, 2)}

Extrae la identidad de la marca: nombre, colores principales, tipografia, tono, estilo visual.
Si el logo es una URL valida, incluyelo. Si no, pon null.

Responde en JSON con esta estructura exacta:
{
  "name": "nombre de la marca o null",
  "description": "descripcion corta de la marca (max 280 chars) o null",
  "logo": "URL del logo o null",
  "images": ["URLs de imagenes relevantes"],
  "colors": {
    "primary": "#hex del color principal o null",
    "secondary": "#hex del color secundario o null",
    "accent": "#hex del color de acento o null",
    "background": "#hex del fondo o null",
    "text": "#hex del texto o null",
    "all": ["array de todos los colores relevantes encontrados"]
  },
  "font": "nombre de la fuente principal o null",
  "fonts": ["array de fuentes detectadas"],
  "socialLinks": {"instagram": "url", "facebook": "url"},
  "instagram": "handle sin @ o null",
  "tagline": "slogan o tagline o null",
  "businessOverview": "resumen del negocio en 2-3 oraciones o null",
  "brandTone": "profesional|juvenil|elegante|urbano|deportivo|alternativo",
  "suggestedStyle": "minimal|bold|editorial|sport|corporate|urbano|creativo",
  "colorScheme": "dark|light|vibrant|pastel|monochrome"
}`

  try {
    const result = await model.generateContent(prompt)
    const text = result.response.text()
    return JSON.parse(text)
  } catch (err) {
    console.error('Gemini brand analysis error:', err)
    // Return raw extracted data as fallback
    return {
      name: extracted.title || null,
      description: extracted.description || null,
      logo: extracted.logo || null,
      images: extracted.images || [],
      colors: {
        primary: (extracted.colors as string[])?.[0] || null,
        secondary: (extracted.colors as string[])?.[1] || null,
        accent: (extracted.colors as string[])?.[2] || null,
        background: null,
        text: null,
        all: extracted.colors || [],
      },
      font: (extracted.fonts as string[])?.[0] || null,
      fonts: extracted.fonts || [],
      socialLinks: extracted.socialLinks || {},
      instagram: extracted.instagram || null,
      tagline: extracted.tagline || null,
      businessOverview: extracted.description || null,
      brandTone: null,
      suggestedStyle: null,
      colorScheme: null,
    }
  }
}
