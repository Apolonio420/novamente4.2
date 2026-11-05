import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import path from "node:path"
import { measureImageChange, isUnchanged, UNCHANGED_THRESHOLD_PCT } from "@/lib/designer/image-change"

// Pares reales de /crear (R2, 07/10–05/11), achicados a 128 px.
const FIX = path.join(__dirname, "fixtures/edit-change")
const pair = (name: string) => [readFileSync(path.join(FIX, `${name}-in.png`)), readFileSync(path.join(FIX, `${name}-out.png`))] as const

describe("measureImageChange — calibrado con ediciones reales", () => {
  it.each([
    ["delfin", "05/11: 'delfín más proporcionado' → misma imagen"],
    ["ocultista", "29/10: 'Cara del ocultista' → misma imagen"],
    ["colores-argentinos", "28/10: 'con los colores argentinos' → casi igual"],
  ])("%s cuenta como SIN CAMBIO (%s)", async (name) => {
    const [a, b] = pair(name)
    expect(isUnchanged(await measureImageChange(a, b))).toBe(true)
  })

  it.each([
    ["escudo-22", "'+22 más chico y el escudo de Rosario Central' (cambio chico y correcto)"],
    ["rayo", "'Solo el rayo, nada alrededor'"],
    ["line-art", "'convertilo a estilo line-art'"],
  ])("%s cuenta como CAMBIADA (%s)", async (name) => {
    const [a, b] = pair(name)
    expect(isUnchanged(await measureImageChange(a, b))).toBe(false)
  })

  it("una imagen contra sí misma da 0 %", async () => {
    const [a] = pair("rayo")
    expect(await measureImageChange(a, a)).toBe(0)
    expect(UNCHANGED_THRESHOLD_PCT).toBeGreaterThan(0)
  })
})
