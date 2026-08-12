import { describe, it, expect } from "vitest"
import { staticProductUuid, staticProductNamesByUuid, OWN_CATALOG_TENANT_SLUG } from "@/lib/partners/catalog-reviews"
import { PRODUCTS } from "@/lib/products"

/**
 * Puente catálogo propio ↔ reseñas.
 *
 * product_reviews.product_id es UUID y el catálogo propio usa ids tipo
 * "aura-tshirt-blanco". El UUID se deriva del id: si esa derivación cambiara,
 * TODAS las reseñas ya cargadas quedarían huérfanas (apuntando a un product_id
 * que ninguna página consulta). Por eso hay un valor congelado abajo.
 */

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/

describe("catalog-reviews", () => {
  it("las reseñas del catálogo propio cuelgan del tenant que sí tiene miembros", () => {
    // novamente / novamente-originals no tienen NINGÚN tenant_user: nadie podría
    // moderar y las reseñas quedarían en pending para siempre.
    expect(OWN_CATALOG_TENANT_SLUG).toBe("novamente-internal")
  })

  it("genera un UUID v5 válido", () => {
    expect(staticProductUuid("aura-tshirt-blanco")).toMatch(UUID_RE)
  })

  it("es determinístico y CONGELADO — si esto cambia, se huerfanizan las reseñas", () => {
    expect(staticProductUuid("aura-tshirt-blanco")).toBe(staticProductUuid("aura-tshirt-blanco"))
    expect(staticProductUuid("aura-tshirt-blanco")).toBe("3fb96fe5-4ae9-5706-ad8e-ec5b21ba7e01")
  })

  it("no colisiona entre productos del catálogo", () => {
    const uuids = PRODUCTS.map((p) => staticProductUuid(p.id))
    expect(new Set(uuids).size).toBe(PRODUCTS.length)
  })

  it("todos los productos del catálogo son mapeables a su nombre", () => {
    const names = staticProductNamesByUuid()
    expect(Object.keys(names)).toHaveLength(PRODUCTS.length)
    for (const p of PRODUCTS) {
      expect(names[staticProductUuid(p.id)]).toBe(p.name)
    }
  })
})
