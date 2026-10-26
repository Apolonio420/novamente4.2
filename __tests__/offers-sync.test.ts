import { describe, it, expect } from "vitest"
import { decidePriceSync, parseOfferTarget } from "@/lib/offers-sync"
import { OFFERS } from "@/lib/offers"

const offer = {
  priceCurrent: 24500,
  priceOriginal: 35000,
  startsAt: "2026-11-02T00:00:00-03:00",
  endsAt: "2026-11-04T23:59:59-03:00",
}
const before = new Date("2026-11-01T12:00:00-03:00")
const during = new Date("2026-11-03T12:00:00-03:00")
const after = new Date("2026-11-05T00:00:00-03:00")

describe("decidePriceSync", () => {
  it("no toca antes de empezar", () => {
    expect(decidePriceSync(offer, { price: 35000, compare_at_price: null }, before).action).toBe("none")
  })
  it("aplica durante la ventana", () => {
    expect(decidePriceSync(offer, { price: 35000, compare_at_price: null }, during)).toMatchObject({
      action: "update", price: 24500, compare_at_price: 35000,
    })
  })
  it("es idempotente durante la ventana", () => {
    expect(decidePriceSync(offer, { price: 24500, compare_at_price: 35000 }, during).action).toBe("none")
  })
  it("restaura al terminar si price === priceCurrent", () => {
    expect(decidePriceSync(offer, { price: 24500, compare_at_price: 35000 }, after)).toMatchObject({
      action: "update", price: 35000, compare_at_price: null,
    })
  })
  it("no pisa ediciones manuales al terminar", () => {
    expect(decidePriceSync(offer, { price: 30000, compare_at_price: 35000 }, after).action).toBe("none")
  })
  it("despues de restaurar no hace nada", () => {
    expect(decidePriceSync(offer, { price: 35000, compare_at_price: null }, after).action).toBe("none")
  })
  it("limites inclusivos de la ventana", () => {
    expect(decidePriceSync(offer, { price: 35000, compare_at_price: null }, new Date(offer.startsAt)).action).toBe("update")
    expect(decidePriceSync(offer, { price: 24500, compare_at_price: 35000 }, new Date(offer.endsAt)).action).toBe("none")
  })
})

describe("parseOfferTarget", () => {
  it("parsea tenant y producto", () => {
    expect(parseOfferTarget("https://www.novamente.ar/p/novamente-originals/buzo-novamente-originals")).toEqual({
      tenantSlug: "novamente-originals", productSlug: "buzo-novamente-originals",
    })
  })
  it("devuelve null para urls invalidas", () => {
    expect(parseOfferTarget("nope")).toBeNull()
    expect(parseOfferTarget("https://www.novamente.ar/ofertas")).toBeNull()
  })
})

describe("ofertas Cyber Monday", () => {
  const cm = OFFERS.filter(o => o.campaign === "Cyber Monday")
  it("son 8, con precio = original * 0.7 redondeado a $100", () => {
    expect(cm).toHaveLength(8)
    for (const o of cm) expect(o.priceCurrent).toBe(Math.round((o.priceOriginal * 0.7) / 100) * 100)
  })
  it("todas tienen target parseable", () => {
    for (const o of cm) expect(parseOfferTarget(o.url)).not.toBeNull()
  })
})
