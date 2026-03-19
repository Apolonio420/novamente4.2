import { NextRequest, NextResponse } from 'next/server'
import { getGeminiClient } from '@/lib/gemini'

export async function POST(req: NextRequest) {
  try {
    const { url, mode = 'brand' } = await req.json()
    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'URL requerida' }, { status: 400 })
    }

    let normalizedUrl = url.trim()
    if (!/^https?:\/\//i.test(normalizedUrl)) {
      normalizedUrl = `https://${normalizedUrl}`
    }

    const apiKey = process.env.FIRECRAWL_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'Firecrawl API key not configured' }, { status: 500 })
    }

    // ── Firecrawl: branding + markdown (1 credit) ──
    const fcRes = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: normalizedUrl,
        formats: ['branding', 'markdown', 'links'],
      }),
    })

    if (!fcRes.ok) {
      console.error('Firecrawl error:', fcRes.status)
      return NextResponse.json({ error: 'No se pudo acceder al sitio' }, { status: 422 })
    }

    const result = await fcRes.json()
    if (!result.success) {
      return NextResponse.json({ error: 'No se pudo extraer informacion' }, { status: 422 })
    }

    const data = result.data || result
    const branding = data.branding || {}
    const metadata = data.metadata || {}
    const markdown = (data.markdown || '').slice(0, 4000)
    const links: string[] = (data.links || []).map((l: any) => typeof l === 'string' ? l : l?.url || l?.href || '').filter(Boolean)

    // ── Parse branding ──
    const colors = branding.colors || {}
    const allColors = [
      colors.primary, colors.accent, colors.secondary,
      colors.background, colors.textPrimary, colors.link,
    ].filter((c): c is string => !!c && typeof c === 'string' && c.startsWith('#'))
    // Deduplicate
    const uniqueColors = [...new Set(allColors)]

    const fonts = branding.typography?.fontFamilies || {}
    const fontList = branding.fonts?.map((f: any) => f.family).filter(Boolean) || []
    const primaryFont = fonts.primary || fonts.heading || fontList[0] || null

    const logo = branding.images?.logo
      || branding.logo
      || branding.images?.ogImage
      || metadata.ogImage
      || branding.images?.favicon
      || null

    // Personality from Firecrawl (already analyzed by their LLM)
    const personality = branding.personality || {}

    // ── Social links from links array ──
    const socialPatterns: Record<string, RegExp> = {
      instagram: /instagram\.com\/([^/?#]+)/i,
      facebook: /facebook\.com\/([^/?#]+)/i,
      twitter: /(twitter|x)\.com\/([^/?#]+)/i,
      tiktok: /tiktok\.com\/@?([^/?#]+)/i,
      linkedin: /linkedin\.com\/(company|in)\/([^/?#]+)/i,
    }
    const socialLinks: Record<string, string> = {}
    for (const href of links) {
      for (const [platform, regex] of Object.entries(socialPatterns)) {
        if (!socialLinks[platform] && regex.test(href)) {
          socialLinks[platform] = href
        }
      }
    }

    // ── Map Firecrawl personality tone → our visual styles ──
    const toneToStyle: Record<string, string> = {
      modern: 'minimal',
      professional: 'corporate',
      playful: 'creativo',
      bold: 'bold',
      elegant: 'editorial',
      luxury: 'editorial',
      edgy: 'urbano',
      energetic: 'sport',
      casual: 'urbano',
      friendly: 'minimal',
      corporate: 'corporate',
      creative: 'creativo',
      artistic: 'creativo',
      sporty: 'sport',
      dynamic: 'sport',
    }
    const suggestedStyle = toneToStyle[personality.tone?.toLowerCase()] || null

    // ── Gemini: extract tagline + business overview from markdown ──
    let tagline: string | null = null
    let businessOverview: string | null = null
    let brandTone: string | null = personality.tone || null

    if (markdown.length > 100) {
      try {
        const genAI = getGeminiClient()
        const model = genAI.getGenerativeModel({
          model: process.env.GEMINI_TEXT_MODEL || 'gemini-2.0-flash',
        })

        const prompt = `Analiza este sitio web y extrae informacion de marca.

URL: ${normalizedUrl}
Contenido:
${markdown}

Responde SOLO con JSON valido (sin backticks ni markdown):
{"tagline":"frase corta del sitio max 100 chars o null","businessOverview":"descripcion del negocio en español 2-3 oraciones max 280 chars o null","brandTone":"uno de: formal casual playful professional edgy luxury friendly modern"}`

        const geminiResult = await model.generateContent([prompt])
        const text = geminiResult.response.text().trim()
        const jsonStr = text.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '')
        const parsed = JSON.parse(jsonStr)
        tagline = parsed.tagline || null
        businessOverview = parsed.businessOverview || null
        if (parsed.brandTone) brandTone = parsed.brandTone
      } catch (err) {
        console.error('Gemini analysis error:', err)
      }
    }

    // ── Build response ──
    const name = metadata.ogSiteName || metadata.ogTitle || metadata.title || null

    return NextResponse.json({
      success: true,
      extracted: {
        name,
        description: metadata.ogDescription || metadata.description || null,
        logo,
        images: [
          branding.images?.ogImage,
          metadata.ogImage,
          branding.images?.logo,
        ].filter((v): v is string => !!v && typeof v === 'string'),

        colors: {
          primary: colors.primary || colors.accent || null,
          secondary: colors.secondary || colors.background || null,
          accent: colors.accent || colors.link || null,
          background: colors.background || null,
          text: colors.textPrimary || null,
          all: uniqueColors,
        },
        colorScheme: branding.colorScheme || null,

        font: primaryFont,
        fonts: fontList.length > 0 ? fontList : (primaryFont ? [primaryFont] : []),

        socialLinks,
        instagram: socialLinks.instagram
          ? socialLinks.instagram.match(/instagram\.com\/([^/?#]+)/i)?.[1] || null
          : null,

        tagline,
        businessOverview,
        brandTone,
        suggestedStyle,

        // Raw personality from Firecrawl for extra context
        personality: {
          tone: personality.tone || null,
          energy: personality.energy || null,
          targetAudience: personality.targetAudience || null,
        },

        // UI components info (borderRadius, etc)
        designSystem: {
          borderRadius: branding.spacing?.borderRadius || null,
          framework: branding.designSystem?.framework || null,
        },
      },
    })
  } catch (err: unknown) {
    console.error('Extract error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Error al extraer' },
      { status: 500 },
    )
  }
}
