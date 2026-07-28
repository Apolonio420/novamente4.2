import { describe, it, expect } from "vitest"
import { matchGarmentKey, matchStockColor, normalizeStockSize } from "./liquidation"

describe("matchGarmentKey", () => {
  it("matchea buzo/hoodie/boston -> buzo-oversize", () => {
    expect(matchGarmentKey("Buzo Boston MARRÓN")).toBe("buzo-oversize")
    expect(matchGarmentKey("Buzo Hoodie Oversize - Marron")).toBe("buzo-oversize")
  })

  it("matchea aura -> remera-oversize", () => {
    expect(matchGarmentKey("Aura Oversize Caramel")).toBe("remera-oversize")
  })

  it("matchea remera/t-shirt/tee + oversiz -> remera-oversize", () => {
    expect(matchGarmentKey("Remera Oversize Marron")).toBe("remera-oversize")
    expect(matchGarmentKey("T-Shirt Oversize")).toBe("remera-oversize")
  })

  it("NO matchea remera sin oversiz (clasica, sin buzo/aura/oversiz)", () => {
    expect(matchGarmentKey("Remera Clásica gris")).toBe(null)
  })

  it("excluye clasic/crop/infantil/musculosa/cuello redondo/bebe/lienzo/gorra/tote aunque matcheen buzo/hoodie/aura/oversiz", () => {
    expect(matchGarmentKey("Buzo Cuello Redondo Negro")).toBe(null)
    expect(matchGarmentKey("Remera Crop Mujer Oversize")).toBe(null)
    expect(matchGarmentKey("Bambino Oversize Infantil")).toBe(null)
    expect(matchGarmentKey("Musculosa Bali Oversize")).toBe(null)
    expect(matchGarmentKey("Lienzo Oversize")).toBe(null)
  })

  it("no matchea prendas sin ninguna keyword", () => {
    expect(matchGarmentKey("Gorra Trucker")).toBe(null)
    expect(matchGarmentKey("Totebag Bahia")).toBe(null)
  })
})

describe("matchStockColor", () => {
  it("matchea marron", () => {
    expect(matchStockColor("Marrón")).toBe("marron")
    expect(matchStockColor("marron")).toBe("marron")
  })

  it("matchea crema/cream", () => {
    expect(matchStockColor("Crema")).toBe("crema")
    expect(matchStockColor("cream")).toBe("crema")
  })

  it("matchea melange/gris/gray/grey -> gris-melange", () => {
    expect(matchStockColor("hoodie gris melange")).toBe("gris-melange")
    expect(matchStockColor("Gris")).toBe("gris-melange")
    expect(matchStockColor("gray")).toBe("gris-melange")
    expect(matchStockColor("grey")).toBe("gris-melange")
  })

  it("NO matchea caramel ni chocolate (reposicion permanente)", () => {
    expect(matchStockColor("Caramel")).toBe(null)
    expect(matchStockColor("Chocolate")).toBe(null)
  })

  it("no matchea otros colores", () => {
    expect(matchStockColor("Negro")).toBe(null)
    expect(matchStockColor("Blanco")).toBe(null)
    expect(matchStockColor("Stone Wash")).toBe(null)
  })
})

describe("normalizeStockSize", () => {
  it("acepta S/M/L/XL, trim + uppercase", () => {
    expect(normalizeStockSize("s")).toBe("S")
    expect(normalizeStockSize(" m ")).toBe("M")
    expect(normalizeStockSize("l")).toBe("L")
    expect(normalizeStockSize("xl")).toBe("XL")
  })

  it("rechaza talles no trackeados (XXL, unico, etc.)", () => {
    expect(normalizeStockSize("XXL")).toBe(null)
    expect(normalizeStockSize("Unico")).toBe(null)
    expect(normalizeStockSize("40x50cm")).toBe(null)
  })
})
