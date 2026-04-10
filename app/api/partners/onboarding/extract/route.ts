import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

export const maxDuration = 45

/**
 * Modern brand identity extraction using:
 * 1. Jina Reader (r.jina.ai) — renders JS, returns clean markdown + metadata (free)
 * 2. thum.io — takes a full-page screenshot (free, no API key)
 * 3. Gemini Vision — analyzes screenshot visually for colors, style, fonts
 * 4. Gemini Text — analyzes Jina content for brand info, social links, tagline
 *
 * Both results are merged into a complete BrandKit.
 */
export async function POST(req: NextRequest) {
  try {
    const { url, mode } = await req.json()
    if (!url || typeof url !== 'string') {
      return NextResponse.json({ success: false, error: 'URL requerida' }, { status: 400 })
    }

    let targetUrl = url.trim()
    if (!targetUrl.startsWith('http')) targetUrl = `https://${targetUrl}`

    // Run Jina Reader + Screenshot fetch in parallel
    const [jinaContent, screenshotBase64] = await Promise.all([
      fetchJinaReader(targetUrl),
      fetchScreenshotAsBase64(targetUrl),
    ])

    if (!jinaContent && !screenshotBase64) {
      return NextResponse.json({ success: false, error: 'No se pudo acceder al sitio' }, { status: 422 })
    }

    // Analyze with Gemini — vision (screenshot) + text (Jina content) combined
    const brandKit = await analyzeWithGemini(targetUrl, jinaContent, screenshotBase64, mode || 'brand')

    return NextResponse.json({ success: true, extracted: brandKit })
  } catch (err) {
    console.error('Extract error:', err)
    return NextResponse.json({ success: false, error: 'Error al analizar el sitio' }, { status: 500 })
  }
}

// ── Jina Reader ──────────────────────────────────────────────────────────────

async function fetchJinaReader(url: string): Promise<string | null> {
  try {
    const res = await fetch(`https://r.jina.ai/${url}`, {
      headers: {
        'Accept': 'text/markdown',
        'X-Return-Format': 'markdown',
      },
      signal: AbortSignal.timeout(15000),
    })
    if (!res.ok) return null
    const text = await res.text()
    // Limit to first 8000 chars to keep Gemini prompt reasonable
    return text.slice(0, 8000)
  } catch {
    return null
  }
}

// ── Screenshot via thum.io ───────────────────────────────────────────────────

async function fetchScreenshotAsBase64(url: string): Promise<string | null> {
  try {
    const screenshotUrl = `https://image.thum.io/get/width/1280/crop/900/noanimate/${url}`
    const res = await fetch(screenshotUrl, {
      signal: AbortSignal.timeout(20000),
    })
    if (!res.ok) return null
    const buffer = await res.arrayBuffer()
    return Buffer.from(buffer).toString('base64')
  } catch {
    return null
  }
}

// ── Gemini Vision + Text Analysis ────────────────────────────────────────────

async function analyzeWithGemini(
  url: string,
  jinaContent: string | null,
  screenshotBase64: string | null,
  mode: string,
) {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    generationConfig: { responseMimeType: 'application/json' },
  })

  const modeContext = mode === 'inspiration'
    ? `Analiza la ESTETICA VISUAL de este sitio para copiar su estilo en una tienda de indumentaria/merchandising.
Enfocate en: paleta de colores, tipografia, estilo visual, tono de marca, layout.
NO extraigas nombre ni datos de la marca — solo el estilo visual.`
    : `Analiza la IDENTIDAD DE MARCA completa de este sitio web.
Extraé: nombre de la marca, descripcion, colores, tipografia, logo, tagline, redes sociales, tono, estilo visual.
Es para crear un storefront de indumentaria/merchandising personalizado.`

  const jsonSchema = `{
  "name": "nombre de la marca o null",
  "description": "descripcion corta (max 280 chars) o null",
  "logo": "URL del logo si la encontras en el contenido, o null",
  "images": ["URLs de imagenes relevantes del sitio"],
  "colors": {
    "primary": "#hex del color principal",
    "secondary": "#hex del color secundario",
    "accent": "#hex del color de acento",
    "background": "#hex del fondo",
    "text": "#hex del texto",
    "all": ["todos los colores relevantes en #hex"]
  },
  "font": "nombre de la fuente principal o null",
  "fonts": ["array de fuentes detectadas"],
  "socialLinks": {"instagram": "url", "facebook": "url", "tiktok": "url"},
  "instagram": "handle sin @ o null",
  "tagline": "slogan o tagline o null",
  "businessOverview": "resumen del negocio en 2-3 oraciones o null",
  "brandTone": "profesional|juvenil|elegante|urbano|deportivo|alternativo",
  "suggestedStyle": "minimal|bold|editorial|sport|corporate|urbano|creativo",
  "colorScheme": "dark|light|vibrant|pastel|monochrome"
}`

  // Build multimodal prompt parts
  const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = []

  // Add screenshot if available (visual analysis)
  if (screenshotBase64) {
    parts.push({
      inlineData: {
        mimeType: 'image/png',
        data: screenshotBase64,
      },
    })
    parts.push({
      text: `Este es un screenshot del sitio ${url}. Analiza visualmente los colores exactos (usa eyedropper mental), tipografia, estilo, layout y tono de la marca.`,
    })
  }

  // Add Jina Reader content if available (text/metadata analysis)
  if (jinaContent) {
    parts.push({
      text: `\n\nContenido del sitio extraido con rendering JS:\n\n${jinaContent}`,
    })
  }

  // Final instruction
  parts.push({
    text: `\n\n${modeContext}\n\nURL: ${url}\n\nIMPORTANTE:\n- Los colores deben ser los REALES del sitio (extraidos del screenshot), no inventados\n- Si ves un logo en el screenshot, busca su URL en el contenido\n- Detecta las fuentes reales usadas en la pagina\n- suggestedStyle debe ser uno de: minimal, bold, editorial, sport, corporate, urbano, creativo\n\nResponde SOLO con JSON valido en esta estructura:\n${jsonSchema}`,
  })

  try {
    const result = await model.generateContent(parts)
    const text = result.response.text()
    return JSON.parse(text)
  } catch (err) {
    console.error('Gemini analysis error:', err)
    return buildFallbackKit()
  }
}

function buildFallbackKit() {
  return {
    name: null,
    description: null,
    logo: null,
    images: [],
    colors: { primary: null, secondary: null, accent: null, background: null, text: null, all: [] },
    font: null,
    fonts: [],
    socialLinks: {},
    instagram: null,
    tagline: null,
    businessOverview: null,
    brandTone: null,
    suggestedStyle: null,
    colorScheme: null,
  }
}
