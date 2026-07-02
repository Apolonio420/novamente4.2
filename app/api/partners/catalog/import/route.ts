import { NextRequest, NextResponse } from 'next/server'
import { requireTenantPermission } from '@/lib/partners/permissions'
import { parseCsvProducts } from '@/lib/partners/csv-parser'
import { countProducts, createProduct } from '@/lib/partners/catalog'
import { validatePartnerProductForCreation } from '@/lib/partners/product-policy'
import { PLAN_FEATURES } from '@/lib/partners/plans'
import type { Plan } from '@/lib/partners/types'

export async function POST(request: NextRequest) {
  try {
    const auth = await requireTenantPermission(request, 'catalog:write')
    if (!auth.ok) return auth.response

    const tenant = auth.tenant
    const plan = tenant.plan as Plan
    const features = PLAN_FEATURES[plan]

    // Only Growth+ can import CSV
    if (plan === 'starter') {
      return NextResponse.json(
        { error: 'CSV import disponible en plan Growth o superior' },
        { status: 403 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'Se requiere un archivo CSV' }, { status: 400 })
    }

    if (!file.name.endsWith('.csv')) {
      return NextResponse.json({ error: 'El archivo debe ser .csv' }, { status: 400 })
    }

    const csvText = await file.text()
    const { products: parsed, errors: parseErrors } = parseCsvProducts(csvText)

    if (parsed.length === 0) {
      return NextResponse.json(
        { error: 'No se encontraron productos válidos', parseErrors },
        { status: 400 }
      )
    }

    // Check plan limits
    const currentCount = await countProducts(tenant.id)
    const maxAllowed = features.maxProducts
    const remaining = maxAllowed - currentCount

    if (remaining <= 0) {
      return NextResponse.json(
        { error: `Alcanzaste el límite de ${maxAllowed} productos` },
        { status: 403 }
      )
    }

    const toImport = parsed.slice(0, remaining)
    const created: string[] = []
    const importErrors: string[] = []

    for (const p of toImport) {
      // Policy: solo prendas del catalogo Novamente
      const policy = validatePartnerProductForCreation({
        name: p.name,
        description: p.description,
        category: p.category,
      })
      if (!policy.ok) {
        importErrors.push(`"${p.name}" rechazado: ${policy.reason}`)
        continue
      }

      try {
        const product = await createProduct(tenant.id, {
          name: p.name,
          price: p.price,
          category: p.category,
          description: p.description,
          tags: p.tags,
        })
        if (product) {
          created.push(product.id)
        }
      } catch (err) {
        importErrors.push(`Error importando "${p.name}": ${err instanceof Error ? err.message : 'unknown'}`)
      }
    }

    return NextResponse.json({
      imported: created.length,
      skipped: parsed.length - toImport.length,
      errors: [...parseErrors, ...importErrors],
    })
  } catch (error) {
    console.error('POST /api/partners/catalog/import error:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
