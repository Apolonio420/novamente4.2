import { describe, it, expect } from "vitest"
import { buildEditPrompt } from "@/lib/designer/edit-prompt"

const INSTR = "Saca la ola, el delfin un poquito mas abajo y que del lado izquierdo se vea apareciendo la trompa de la camioneta"

describe("buildEditPrompt", () => {
  it("pone la instrucción primero y la repite al final", () => {
    const p = buildEditPrompt(INSTR)
    const first = p.indexOf(INSTR)
    expect(first).toBeGreaterThan(-1)
    expect(first).toBeLessThan(120)
    expect(p.lastIndexOf(INSTR)).toBeGreaterThan(p.length - INSTR.length - 120)
  })

  it("no le pide preservar la composición ni trae la regla de 'nada toca el borde' de generar", () => {
    const p = buildEditPrompt(INSTR)
    expect(p).not.toMatch(/preserv(e|ing) the overall composition/i)
    expect(p).not.toMatch(/CRITICAL FRAMING/)
    expect(p).toMatch(/even if it means changing the layout, sizes or positions/)
  })

  it("explica tamaño, proporción, izquierda/derecha y 'protagonismo'", () => {
    const p = buildEditPrompt("Corré la camioneta para darle más protagonismo al mar")
    expect(p).toMatch(/viewer's left \/ right/)
    expect(p).toMatch(/real-world relative sizes/)
    expect(p).toMatch(/Y must end up occupying MORE of the image and being LESS covered/)
    expect(p).toMatch(/never by rotating or enlarging them/)
  })

  it("el reintento avisa que el primer intento salió igual", () => {
    expect(buildEditPrompt(INSTR, { attempt: 1 })).not.toMatch(/UNCHANGED/)
    expect(buildEditPrompt(INSTR, { attempt: 2 })).toMatch(/previous attempt returned this image practically UNCHANGED/)
  })

  it("en foto preserva a las personas y no agrega reglas de estampa", () => {
    const p = buildEditPrompt("sacale el fondo", { mode: "photo" })
    expect(p).toMatch(/same people, faces, pets/)
    expect(p).not.toMatch(/PRINT RULES/)
  })

  it("reglas de contraste según el color de la prenda", () => {
    expect(buildEditPrompt(INSTR, { garmentColor: "negro" })).toMatch(/dark garment/)
    expect(buildEditPrompt(INSTR, { garmentColor: "blanco" })).toMatch(/light garment/)
  })
})
