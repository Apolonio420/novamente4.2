import { describe, it, expect } from "vitest"
import { appendEditToConcept, CONCEPT_MAX } from "@/lib/designer/concept-prompt"

const CONCEPT = "Quiero una remera que tenga un buen dibujo de una playa, un delfin saltando y esas camionetas volkswagen tipo la de scooby doo"

describe("appendEditToConcept", () => {
  it("suma la edición al concepto", () => {
    expect(appendEditToConcept(CONCEPT, "el delfín más chico")).toBe(`${CONCEPT} · el delfín más chico`)
  })
  it("con muchas ediciones conserva el concepto y descarta las más viejas", () => {
    let p = CONCEPT
    for (let i = 0; i < 30; i++) p = appendEditToConcept(p, `edición número ${i} con bastante texto para llenar el tope`)
    expect(p.length).toBeLessThanOrEqual(CONCEPT_MAX)
    expect(p.startsWith(CONCEPT)).toBe(true)
    expect(p).toContain("edición número 29")
    expect(p).not.toContain("edición número 0 ")
  })
})
