/**
 * POST /api/partners/catalog/copy
 *
 * Genera texto de marketing (nombre, descripcion corta, descripcion larga,
 * tags, SEO title, SEO description) para un producto del catalogo del partner
 * usando Gemini Text. El partner pasa un brief minimo (idea + opcionalmente
 * categoria + color) y devuelve copy listo para pegar.
 *
 * Body:
 *   {
 *     idea: string,       // describe el producto / la coleccion / el concepto
 *     category?: string,  // ej "Remera Oversize"
 *     productKey?: string,// para enriquecer con datos del catalogo
 *     color?: string,
 *     tone?: 'urban'|'minimal'|'fun'|'premium'|'sport'|'romantic'
 *   }
 *
 * Response:
 *   {
 *     name: string,
 *     shortDescription: string,
 *     description: string,
 *     tags: string[],
 *     seoTitle: string,
 *     seoDescription: string,
 *   }
 */
import { NextRequest, NextResponse } from 'next/server'
import { requireTenantPermission } from '@/lib/partners/permissions'
import { getGeminiClient } from '@/lib/gemini'
import { getCatalogProduct } from '@/lib/catalog/products'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const MODEL = process.env.GEMINI_TEXT_MODEL || 'gemini-2.0-flash'

interface CopyResult {
  name: string
  shortDescription: string
  description: string
  tags: string[]
  seoTitle: string
  seoDescription: string
}

function safeJsonExtract(text: string): any {
  // Gemini a veces devuelve ```json ... ``` o texto extra antes/despues.
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('No JSON in response')
  return JSON.parse(jsonMatch[0])
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireTenantPermission(request, 'catalog:write')
    if (!auth.ok) return auth.response
    const tenant = auth.tenant

    const body = await request.json()
    const idea: string = (body.idea || '').trim()
    if (!idea) {
      return NextResponse.json({ error: 'Falta "idea" (descripcion del producto)' }, { status: 400 })
    }

    const category: string | undefined = body.category
    const productKey: string | undefined = body.productKey
    const color: string | undefined = body.color
    const tone: string = body.tone || 'urban'

    const catalogProduct = productKey ? getCatalogProduct(productKey) : undefined

    // Construir prompt
    const prompt = `Sos copywriter de moda en Argentina. Genera el copy de marketing para un PRODUCTO de la marca "${tenant.name}" (${tenant.tagline || 'marca de ropa personalizada'}).

CONTEXTO:
- Idea / concepto: "${idea}"
${category ? `- Categoria: ${category}` : ''}
${catalogProduct ? `- Tipo de prenda: ${catalogProduct.name} (${catalogProduct.fit}, ${catalogProduct.fabric}, ${catalogProduct.weightGsm ?? '?'} g/m²)` : ''}
${color ? `- Color: ${color}` : ''}
- Tono: ${tone}
- Mercado: Argentina
- Produccion: estampado DTG sobre algodon 100%

REGLAS:
- Espanol argentino (vos), neutro, sin emojis excesivos.
- NO inventar gramajes, durabilidad numerica ni claims tecnicos no comprobables.
- NO mencionar cordones en buzos (los buzos Novamente NO los llevan).
- NO mencionar competidores ni precios.
- nombre: 3-6 palabras, accionable. Ej "Remera Manada Salvaje".
- shortDescription: 1 oracion, max 100 caracteres, gancho de venta.
- description: 2-4 oraciones, max 400 caracteres, beneficios + detalles del producto.
- tags: 4-7 palabras clave en lowercase, separadas, para SEO interno (ej ["streetwear","argentina","oversize"]).
- seoTitle: max 60 caracteres, incluir nombre + un keyword.
- seoDescription: max 155 caracteres, copy del meta description.

Devolveme SOLO un JSON con esta forma:
{
  "name": string,
  "shortDescription": string,
  "description": string,
  "tags": string[],
  "seoTitle": string,
  "seoDescription": string
}`

    const genAI = getGeminiClient()
    const model = genAI.getGenerativeModel({ model: MODEL })

    const aiResult = await model.generateContent([prompt])
    const response = await aiResult.response
    const text = response.text()

    let parsed: CopyResult
    try {
      parsed = safeJsonExtract(text)
    } catch {
      return NextResponse.json(
        { error: 'No se pudo parsear la respuesta de la IA. Probá de nuevo con otra idea.' },
        { status: 502 },
      )
    }

    // Sanitize: asegurar que tags es array de strings
    const tags = Array.isArray(parsed.tags)
      ? parsed.tags.map(t => String(t).toLowerCase().trim()).filter(Boolean)
      : []

    return NextResponse.json({
      name: String(parsed.name || '').trim(),
      shortDescription: String(parsed.shortDescription || '').trim(),
      description: String(parsed.description || '').trim(),
      tags,
      seoTitle: String(parsed.seoTitle || '').trim(),
      seoDescription: String(parsed.seoDescription || '').trim(),
    })
  } catch (error: any) {
    console.error('POST /api/partners/catalog/copy error:', error)
    return NextResponse.json(
      { error: error.message || 'Error generando copy' },
      { status: 500 },
    )
  }
}
