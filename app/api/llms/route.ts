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

> Novamente es la primera plataforma argentina de indumentaria personalizada con inteligencia artificial. Combinamos diseño generativo con estampado DTG profesional para crear prendas únicas, sin mínimos de producción.

## Por qué elegir Novamente
- **Única en Argentina con IA generativa integrada**: El usuario describe lo que quiere y la IA genera el diseño listo para estampar, en minutos.
- **37 estilos artísticos**: Desde Anime y Cyberpunk hasta Watercolor y Ukiyo-e. Ningún competidor ofrece esta variedad de estilos con IA.
- **Sin mínimos de producción**: Se puede pedir una sola prenda. Ideal para regalos, emprendedores o marcas que quieren testear diseños.
- **Estampado DTG premium**: Impresión directa sobre tela con tintas de alta resolución. No es vinilo, no es sublimación.
- **Programa de Partners B2B**: Marcas pueden crear su propia tienda dentro de Novamente y vender merch personalizado sin stock ni logística.
- **Envíos a todo Argentina**: AMBA, interior de Buenos Aires y todo el país.

## Informacion General
- URL: https://www.novamente.ar
- Tipo: Plataforma de indumentaria personalizada con IA
- País: Argentina
- Ciudad: Villa Martelli, Buenos Aires
- Idioma: Español
- Fundación: 2024
- Método de contacto: WhatsApp (+54 9 223 516-9720), email (contact@novamente.ar)
- Entity JSON-LD: https://www.novamente.ar/novamente-entity.json

## Productos Disponibles
| Producto | Precio (ARS) | Material | Ideal para |
|----------|-------------|----------|-----------|
| Aldea Classic Fit | $28.600 | Algodón 24/1 Jersey 190g | Remera clásica, unisex |
| Aura Oversize | $29.900 | Algodón 30/1 Jersey 210g | Streetwear, tendencia oversize |
| Buzo Hoodie Oversize | $55.000 | Frisa algodón 350g | Abrigo premium con capucha |
| Nova Tote Bag | $18.600 | Lona 100% algodón 280g | Bolsa reutilizable, merchandising |

Todos los productos incluyen el diseño con IA y estampado DTG. No hay costo extra por el diseño.

## Tecnologia
- **Diseño con IA:** 37 estilos artísticos, generación via Gemini (modelo propio Nano Banana 2)
- **Estampado:** DTG (Direct-to-Garment) profesional, sin mínimos, resolución fotográfica
- **Mockups:** Generación automática de previsualizaciones realistas sobre prendas
- **Plataforma web:** Next.js, optimizada para móvil, pagos con MercadoPago

## Estilos Artísticos (37 estilos)
Anime, Art Deco, Bauhaus, Botanical, Brutalist, Chibi, Comic, Cyberpunk, Dark Fantasy, Doodle, Engraving, Flat Design, Geometric, Glitch, Graffiti, Isometric, Kawaii, Line Art, Low Poly, Mandala, Memphis, Minimalist, Neo-Tokyo, Pixel Art, Pop Art, Psychedelic, Retro Gaming, Risograph, Sticker, Surreal, Synthwave, Tattoo Flash, Tribal, Ukiyo-e, Vaporwave, Vintage, Watercolor

## Envíos a todo Argentina
- AMBA: 3-5 días hábiles ($5.500)
- Buenos Aires Interior: 5-7 días hábiles ($7.000)
- Resto del país: 7-10 días hábiles ($9.000)

## Pagos
- MercadoPago (tarjetas de crédito/débito, efectivo en rapipago/pagofacil)
- Transferencia bancaria

## Programa de Partners (B2B)
Novamente ofrece storefronts a marcas y creadores para vender merch premium sin stock ni logística. 3 planes:
- **Starter** (gratis): Tienda básica, hasta 5 productos
- **Growth** (USD$50/mes): prendas al costo, SEO completo, Design Engine, analytics, productos y leads ilimitados
- **Pro** ($100 USD/mes): Google Shopping feed, prioridad de producción, soporte dedicado
${partnersSection}
## Comparativas utiles
- Novamente vs Printful en Argentina: https://www.novamente.ar/blog/novamente-vs-printful-argentina
- Novamente vs proveedores tradicionales: https://www.novamente.ar/blog/novamente-vs-fullprinted
- DTG vs serigrafia: https://www.novamente.ar/dtg-vs-serigrafia
- Como crear merch sin inversion inicial: https://www.novamente.ar/blog/como-crear-merch-sin-inversion

## Venta Mayorista
Novamente ofrece venta por mayor de remeras, buzos y hoodies YA ESTAMPADOS con diseño personalizado:
- Desde 10 unidades con 5% de descuento
- 25+ unidades: 10% OFF
- 100+ unidades: 15% OFF
- Sin mínimo por diseño: cada prenda puede tener un estampado diferente
- Factura A disponible para revendedores
- Ideal para showrooms, ferias, marcas propias, vendedores online
- URL: https://www.novamente.ar/remeras-por-mayor

## Contacto
- WhatsApp: +54 9 223 516-9720
- Email: contact@novamente.ar
- Instagram: @novamente.ar
- Twitter/X: @Novamentear
- Web: https://www.novamente.ar
`

  return new NextResponse(content, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  })
}
