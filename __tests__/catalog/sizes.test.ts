import { describe, it, expect } from "vitest"
import { isKidsGarment, isSizeValidForGarment, KIDS_SIZES, KIDS_SIZE_TABLE, pickSizeFor, sizeChartForGarment, sizesForGarment } from "@/lib/catalog/sizes"
import { getCatalogProduct } from "@/lib/catalog/products"

// Pedido real NOV-20261105-9051 (05/11): remera infantil talle "L" desde /crear.
describe("talles por prenda", () => {
  it("la remera infantil ofrece 4 a 16, nunca talles de adulto", () => {
    expect(sizesForGarment("remera-infantil")).toEqual(["4", "6", "8", "10", "12", "14", "16"])
    expect(sizesForGarment("remera-infantil")).not.toContain("L")
  })
  it("coincide con el catálogo y con la tabla del proveedor", () => {
    expect(getCatalogProduct("remera-infantil")!.sizes).toEqual([...KIDS_SIZES])
    expect(KIDS_SIZE_TABLE.map((r) => r.size)).toEqual([...KIDS_SIZES])
    expect(KIDS_SIZE_TABLE.find((r) => r.size === "16")).toEqual({ size: "16", chestCm: 50, lengthCm: 66 })
    expect(sizeChartForGarment("remera-infantil")).toBe("/products/remera-infantil-medidas.png")
  })
  it("las prendas de adulto usan los talles del catálogo (la Aldea no tiene XS)", () => {
    expect(sizesForGarment("aldea-classic-tshirt")).toEqual(["S", "M", "L", "XL", "XXL"])
    expect(sizesForGarment("aura-oversize-tshirt")).toContain("2XS")
  })
  it("respeta la liquidación (hoodie crema y Aura caramel: solo S-XL)", () => {
    expect(sizesForGarment("buzo-hoodie-unisex", "crema")).toEqual(["S", "M", "L", "XL"])
    expect(sizesForGarment("aura-oversize-tshirt", "caramel")).toEqual(["S", "M", "L", "XL"])
  })
  it("al pasar a la infantil, un 'M' se cambia por un talle infantil; si existe se conserva", () => {
    expect(pickSizeFor(sizesForGarment("remera-infantil"), "M")).toBe("10")
    expect(pickSizeFor(sizesForGarment("remera-infantil"), "8")).toBe("8")
    expect(pickSizeFor(sizesForGarment("aldea-classic-tshirt"), "10")).toBe("M")
  })
})

describe("isSizeValidForGarment (validación del checkout)", () => {
  it.each([
    ["remera-infantil", "L", false],
    ["remera-infantil", "8", true],
    ["Bambino Remera Infantil", "XL", false],
    ["aldea-classic-tshirt", "8", false],
    ["aldea-classic-tshirt", "L", true],
    ["remera-infantil", "", true],
    ["", "8", true],
  ])("%s talle %s → %s", (g, s, ok) => {
    expect(isSizeValidForGarment(g, s)).toBe(ok)
  })
  it("reconoce la infantil por texto libre", () => {
    expect(isKidsGarment("Remera infantil Custom — Novamente")).toBe(true)
    expect(isKidsGarment("remera niño")).toBe(true)
    expect(isKidsGarment("buzo-hoodie-unisex")).toBe(false)
  })
})
