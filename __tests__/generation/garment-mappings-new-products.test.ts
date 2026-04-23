import { describe, expect, it } from "vitest"
import { getGarmentMapping } from "@/lib/garment-mappings"

const NEW_PRODUCTS: Array<{ type: string; colors: string[] }> = [
  { type: "buzo-hoodie-unisex", colors: ["black", "white", "stone-wash"] },
  { type: "buzo-cuello-redondo-unisex", colors: ["black", "white", "stone-wash"] },
  { type: "musculosa-bali", colors: ["black", "white", "gray"] },
  { type: "remera-clasica-mujer", colors: ["black", "white"] },
  { type: "remera-crop-mujer", colors: ["black", "chocolate", "gray", "yellow"] },
]

describe("garment-mappings: new products (front)", () => {
  for (const { type, colors } of NEW_PRODUCTS) {
    for (const color of colors) {
      it(`${type} / ${color} / front → real mapping (not fallback)`, () => {
        const m = getGarmentMapping(type, color, "front")
        expect(m).not.toBeNull()
        expect(m!.id).not.toBe("fallback")
        expect(m!.garmentPath).toMatch(new RegExp(`${type.replace("unisex", "")}.*${color}.*front`))
        expect(m!.coordinates.width).toBeGreaterThan(0)
        expect(m!.coordinates.height).toBeGreaterThan(0)
      })
    }
  }

  it("legacy products still work (regression)", () => {
    expect(getGarmentMapping("astra-oversize-hoodie", "black", "front")?.name).toBe("Hoodie Negro Frontal")
    expect(getGarmentMapping("aura-oversize-tshirt", "white", "back")?.name).toBe("T-shirt Blanco Oversize Trasero")
    expect(getGarmentMapping("aldea-classic-tshirt", "black", "front")?.name).toBe("T-shirt Negro Clásico Frontal")
    expect(getGarmentMapping("lienzo", "any", "front")?.name).toBe("Lienzo Base")
  })
})
