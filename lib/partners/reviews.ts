/**
 * Lectura server-side de reseñas aprobadas.
 *
 * El widget del storefront trae las reseñas por fetch desde el cliente, pero el
 * JSON-LD tiene que salir en el HTML inicial para que Google lo lea. Esta es la
 * fuente para eso.
 *
 * Regla que no se rompe: el `aggregateRating` del schema tiene que reflejar
 * reseñas reales visibles en la página. Si no hay reseñas aprobadas devolvemos
 * null y la página no emite rating — nunca un promedio inventado.
 */
import { supabaseAdmin } from '@/lib/supabase-admin'

export interface ReviewStats {
  avg: number
  count: number
  /** Las más recientes, para emitir como `review` en el schema. */
  top: {
    author: string
    rating: number
    body: string | null
    createdAt: string
  }[]
}

const SCHEMA_REVIEW_LIMIT = 5

export async function getApprovedReviewStats(
  tenantId: string,
  productId: string,
): Promise<ReviewStats | null> {
  try {
    const { data, error } = await (supabaseAdmin as any)
      .from('product_reviews')
      .select('customer_name, rating, body, created_at')
      .eq('tenant_id', tenantId)
      .eq('product_id', productId)
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
      .limit(100)

    if (error || !Array.isArray(data) || data.length === 0) return null

    const ratings = data
      .map((r: any) => Number(r.rating))
      .filter((n: number) => Number.isFinite(n) && n >= 1 && n <= 5)
    if (ratings.length === 0) return null

    const avg = Math.round((ratings.reduce((s, n) => s + n, 0) / ratings.length) * 10) / 10

    return {
      avg,
      count: ratings.length,
      top: data.slice(0, SCHEMA_REVIEW_LIMIT).map((r: any) => ({
        author: String(r.customer_name || 'Cliente'),
        rating: Number(r.rating),
        body: r.body ? String(r.body) : null,
        createdAt: String(r.created_at),
      })),
    }
  } catch {
    // Una caída de DB no puede tumbar la página de producto — sin rating y listo.
    return null
  }
}
