import { describe, expect, it } from "vitest"
import { CATALOG_PRODUCTS } from "@/lib/catalog/products"
import { getGarmentMapping } from "@/lib/garment-mappings"

/**
 * Cobertura completa del catálogo Studio (partners self-service).
 *
 * Recorre CATALOG_PRODUCTS (fuente única, lib/catalog/products.ts) x colores x
 * lado (front/back) y falla si getGarmentMapping cae a fallback — es decir, si
 * el endpoint de mockup del Studio devolvería 422 "combinación no disponible"
 * para esa combinación real que el partner puede elegir en el selector.
 *
 * EXCEPCIONES CONOCIDAS ("KNOWN_GAPS"):
 * Combinaciones que hoy caen a fallback porque NO existe imagen base física en
 * public/garments/ (no es un bug de mapeo, es que falta el asset). Mientras
 * sigan sin base, quedan documentadas acá para que el test pase; si alguien
 * agrega la imagen base, hay que calibrar el mapping en garment-mappings.json
 * (ver README de esa auditoría) y sacar la entrada de esta lista — el test
 * empezará a exigir que resuelva.
 *
 * CÓMO AGREGAR UNA EXCEPCIÓN NUEVA:
 * 1. Confirmá que realmente falta la imagen base (public/garments/<needle>.*).
 * 2. Agregá `{ product: "<catalog key>", color: "<color key>", side: "front"|"back" }`
 *    a KNOWN_GAPS con un comentario de por qué.
 * 3. Si en cambio la imagen SÍ existe, el problema es que falta la entrada en
 *    garment-mappings.json — calibrala (ver el patrón en ese archivo) en vez
 *    de agregar la excepción acá.
 */
const KNOWN_GAPS: Array<{ product: string; color: string; side: "front" | "back" }> = [
  // Aura Oversize Stone Wash: solo existe /garments/tshirt-stone-wash-oversize-back.jpeg
  // (ya calibrado). No hay foto stone-wash-oversize-FRONT en public/garments/.
  { product: "aura-oversize-tshirt", color: "stone-wash", side: "front" },
  // Musculosa Bali Negra: existe front (musculosa-bali-black-front.png) pero no
  // hay foto de espalda (musculosa-bali-black-back.png) en public/garments/.
  { product: "musculosa-bali", color: "black", side: "back" },
]

function isKnownGap(product: string, color: string, side: string) {
  return KNOWN_GAPS.some((g) => g.product === product && g.color === color && g.side === side)
}

describe("garment-mappings: cobertura completa CATALOG_PRODUCTS x color x side", () => {
  for (const product of CATALOG_PRODUCTS) {
    for (const color of product.colors) {
      for (const side of ["front", "back"] as const) {
        const label = `${product.key} / ${color.key} / ${side}`
        const gap = isKnownGap(product.key, color.key, side)

        it(`${label}${gap ? " (known gap, sin base física)" : ""}`, () => {
          const mapping = getGarmentMapping(product.key, color.key, side)
          const isFallback = !mapping || mapping.id === "fallback"

          if (gap) {
            // Documentado: hoy cae a fallback porque no hay imagen base. Si esto
            // deja de ser cierto (alguien agregó la base + el mapping), el test
            // FALLA acá para forzar sacar la excepción de KNOWN_GAPS.
            expect(isFallback, `${label} ya no es fallback — sacá la excepción de KNOWN_GAPS`).toBe(true)
          } else {
            expect(isFallback, `${label} cayó a fallback (422 en el Studio) — falta entrada en garment-mappings.json o base en public/garments/`).toBe(false)
            expect(mapping!.coordinates.width).toBeGreaterThan(0)
            expect(mapping!.coordinates.height).toBeGreaterThan(0)
          }
        })
      }
    }
  }

  it("no hay combos KNOWN_GAPS obsoletos (producto/color ya no existe en CATALOG_PRODUCTS)", () => {
    for (const gap of KNOWN_GAPS) {
      const product = CATALOG_PRODUCTS.find((p) => p.key === gap.product)
      expect(product, `KNOWN_GAPS referencia producto inexistente: ${gap.product}`).toBeTruthy()
      expect(
        product!.colors.some((c) => c.key === gap.color),
        `KNOWN_GAPS referencia color inexistente: ${gap.product}/${gap.color}`,
      ).toBe(true)
    }
  })
})

describe("garment-mappings: Bambino (remera-infantil) — prep para alta en CATALOG_PRODUCTS", () => {
  // remera-infantil todavía NO está en CATALOG_PRODUCTS (no se ofrece en el
  // Studio hoy), pero el PATH_BUILDER y las bases/mappings ya están listos
  // (ver lib/garment-mappings.ts + public/garments/remera-infantil-*). Este
  // bloque asegura que cuando se agregue a CATALOG_PRODUCTS, el mapping ya
  // resuelve sin fallback.
  const BAMBINO_COLORS = ["white", "black", "gray", "yellow", "celeste", "rosa"]

  for (const color of BAMBINO_COLORS) {
    for (const side of ["front", "back"] as const) {
      it(`remera-infantil / ${color} / ${side} → real mapping (not fallback)`, () => {
        const mapping = getGarmentMapping("remera-infantil", color, side)
        expect(mapping).not.toBeNull()
        expect(mapping!.id).not.toBe("fallback")
        expect(mapping!.garmentPath).toBe(`/garments/remera-infantil-${color}-${side}.jpeg`)
        expect(mapping!.coordinates.width).toBeGreaterThan(0)
        expect(mapping!.coordinates.height).toBeGreaterThan(0)
      })
    }
  }
})
