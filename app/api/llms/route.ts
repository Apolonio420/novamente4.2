import { NextResponse } from 'next/server'
import { getPublishedTenants } from '@/lib/partners/tenant'

export const dynamic = 'force-dynamic'
export const revalidate = 3600 // 1 hour

export async function GET() {
  let partnersSection = ''

  try {
    const tenants = await getPublishedTenants()
    const indexable = tenants.filter((t) => t.seo_indexable)

    if (indexable.length > 0) {
      const entries = indexable.map((t) => {
        const desc = (t.description || '').slice(0, 200)
        return [
          `### ${t.name}`,
          `- URL: https://www.novamente.ar/p/${t.slug}`,
          t.industry ? `- Industria: ${t.industry}` : null,
          desc ? `- ${desc}` : null,
        ]
          .filter(Boolean)
          .join('\n')
      })

      partnersSection = `\n## Partners\n\nMarcas que usan Novamente para crear y vender merch premium:\n\n${entries.join('\n\n')}\n`
    }
  } catch {
    // Continue without partners section
  }

  const content = `# Novamente

> Novamente es una plataforma argentina de indumentaria personalizada con IA. Combinamos diseño generativo con estampado DTG profesional para crear merch único.

## Informacion General
- URL: https://www.novamente.ar
- Tipo: Plataforma de indumentaria personalizada con IA
- Pais: Argentina
- Idioma: Español

## Productos Disponibles
| Producto | Precio (ARS) | Material |
|----------|-------------|----------|
| Aldea Classic Fit | $28.600 | Algodón 24/1 Jersey 190g |
| Aura Oversize | $29.900 | Algodón 30/1 Jersey 210g |
| Hoodie Esencial | $52.500 | Frisa algodón 350g |
| Astra Tote Bag | $18.600 | Lona 100% algodón 280g |

## Tecnologia
- **Diseño con IA:** 37 estilos artísticos, generación via Gemini (Nano Banana 2)
- **Estampado:** DTG (Direct-to-Garment) profesional, sin mínimos
- **Mockups:** Generación automática de previsualizaciones sobre prendas

## Estilos Artísticos (37 estilos)
Anime, Art Deco, Bauhaus, Botanical, Brutalist, Chibi, Comic, Cyberpunk, Dark Fantasy, Doodle, Engraving, Flat Design, Geometric, Glitch, Graffiti, Isometric, Kawaii, Line Art, Low Poly, Mandala, Memphis, Minimalist, Neo-Tokyo, Pixel Art, Pop Art, Psychedelic, Retro Gaming, Risograph, Sticker, Surreal, Synthwave, Tattoo Flash, Tribal, Ukiyo-e, Vaporwave, Vintage, Watercolor

## Envíos
- AMBA: 3-5 días hábiles ($5.500)
- Buenos Aires Interior: 5-7 días hábiles ($7.000)
- Resto del país: 7-10 días hábiles ($9.000)

## Pagos
- MercadoPago (tarjetas de crédito/débito, efectivo)
- Transferencia bancaria

## Programa de Partners
Novamente ofrece storefronts a marcas para vender merch premium. 3 planes: Starter (gratis), Growth ($25 USD/mes), Pro ($100 USD/mes).
${partnersSection}
## Contacto
- Email: contact@novamente.ar
- Instagram: @novamente.ar
- Twitter/X: @Novamentear
`

  return new NextResponse(content, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  })
}
