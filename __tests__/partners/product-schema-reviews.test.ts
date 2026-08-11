import { describe, it, expect } from "vitest"
import { generateProductSchema } from "@/lib/partners/seo"
import type { ReviewStats } from "@/lib/partners/reviews"

/**
 * aggregateRating en el JSON-LD de producto.
 *
 * Antes de esto, /products/[id] emitía un aggregateRating construido con reseñas
 * inventadas en código. Google exige que el rating corresponda a reseñas reales
 * visibles en la misma página; inventarlo es causa de acción manual sobre el
 * dominio. La regla que este test protege: SIN reseñas aprobadas, NO se emite
 * rating — nunca un promedio por defecto.
 */

const tenant = {
  id: "t1",
  slug: "cabalaurbana",
  name: "Cábala Urbana",
  currency: "ARS",
  country: "AR",
} as any

const product = {
  id: "3f2b1a44-5c6d-4e7f-8a9b-0c1d2e3f4a5b",
  slug: "buzo-berlin",
  name: "Buzo Berlin",
  description: "Buzo oversize",
  price: 62000,
  currency: "ARS",
  images: ["https://cdn.test/1.jpg"],
  availability: "in_stock",
  category: "Buzos",
} as any

const stats: ReviewStats = {
  avg: 4.7,
  count: 3,
  top: [
    { author: "Marcos G.", rating: 5, body: "Calidad impecable, el talle justo.", createdAt: "2026-08-01T10:00:00.000Z" },
    { author: "Ana P.", rating: 5, body: "Llegó rápido y la estampa es perfecta.", createdAt: "2026-07-20T10:00:00.000Z" },
    { author: "Sin texto", rating: 4, body: null, createdAt: "2026-07-10T10:00:00.000Z" },
  ],
}

describe("generateProductSchema · aggregateRating", () => {
  it("NO emite rating cuando no hay reseñas aprobadas", () => {
    for (const reviews of [undefined, null, { avg: 0, count: 0, top: [] } as ReviewStats]) {
      const schema: any = generateProductSchema(product, tenant, { enhanced: true, reviews })
      expect(schema.aggregateRating).toBeUndefined()
      expect(schema.review).toBeUndefined()
    }
  })

  it("emite el promedio y la cantidad reales", () => {
    const schema: any = generateProductSchema(product, tenant, { enhanced: true, reviews: stats })
    expect(schema.aggregateRating).toEqual({
      "@type": "AggregateRating",
      ratingValue: 4.7,
      reviewCount: 3,
      bestRating: 5,
      worstRating: 1,
    })
  })

  it("solo manda al schema las reseñas que tienen texto", () => {
    const schema: any = generateProductSchema(product, tenant, { enhanced: true, reviews: stats })
    expect(schema.review).toHaveLength(2)
    expect(schema.review.map((r: any) => r.author.name)).toEqual(["Marcos G.", "Ana P."])
    expect(schema.review[0].reviewBody).toBe("Calidad impecable, el talle justo.")
    expect(schema.review[0].datePublished).toBe("2026-08-01")
  })

  it("omite el array review si ninguna reseña trae texto, pero mantiene el rating", () => {
    const soloEstrellas: ReviewStats = {
      avg: 5,
      count: 2,
      top: [
        { author: "A", rating: 5, body: null, createdAt: "2026-08-01T10:00:00.000Z" },
        { author: "B", rating: 5, body: "   ", createdAt: "2026-08-02T10:00:00.000Z" },
      ],
    }
    const schema: any = generateProductSchema(product, tenant, { enhanced: true, reviews: soloEstrellas })
    expect(schema.aggregateRating.reviewCount).toBe(2)
    expect(schema.review).toBeUndefined()
  })

  it("no rompe el resto del schema", () => {
    const schema: any = generateProductSchema(product, tenant, { enhanced: true, reviews: stats })
    expect(schema["@type"]).toBe("Product")
    expect(schema.offers.price).toBe(62000)
    expect(schema.offers["@type"]).toBe("Offer")
  })
})
