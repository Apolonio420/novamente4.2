import { describe, expect, it } from "vitest"
import colors from "tailwindcss/colors"
import { hexToChannels, lightVars, originalColorScopes, originalVars, themedColors } from "./tailwind-theme-palette"

describe("paleta temable", () => {
  it("hexToChannels convierte hex largo y corto", () => {
    expect(hexToChannels("#09090b")).toBe("9 9 11")
    expect(hexToChannels("#fff")).toBe("255 255 255")
  })

  it("el oscuro conserva los colores originales de Tailwind", () => {
    const v = originalVars()
    expect(v["--tw-zinc-950"]).toBe(hexToChannels(colors.zinc[950]))
    expect(v["--tw-purple-300"]).toBe(hexToChannels(colors.purple[300]))
    expect(v["--tw-white"]).toBe("255 255 255")
  })

  it("el claro espeja grises y oscurece los tonos pálidos", () => {
    const v = lightVars()
    expect(v["--tw-zinc-950"]).toBe("255 255 255") // fondo de página
    expect(v["--tw-zinc-100"]).toBe(hexToChannels(colors.zinc[900])) // texto principal
    expect(v["--tw-white"]).toBe(hexToChannels(colors.zinc[950]))
    expect(v["--tw-purple-300"]).toBe(hexToChannels(colors.purple[700]))
  })

  it("todo color temable tiene variable en los dos temas", () => {
    const light = lightVars()
    const dark = originalVars()
    for (const [name, value] of Object.entries(themedColors())) {
      const shades = typeof value === "string" ? { "": value } : value
      for (const [shade, css] of Object.entries(shades)) {
        const v = css.match(/var\((--[^)]+)\)/)![1]
        expect(light[v], `${name}-${shade}`).toBeDefined()
        expect(dark[v], `${name}-${shade}`).toBeDefined()
      }
    }
  })

  it("fondos sólidos de color y de marca mantienen los colores originales", () => {
    const scopes = originalColorScopes()
    expect(scopes).toContain(".dark")
    expect(scopes).toContain(".theme-fixed")
    expect(scopes).toContain('[class~="bg-purple-600"]')
    expect(scopes).toContain('[class~="from-primary"]')
    expect(scopes).not.toContain('[class~="bg-purple-300"]')
  })
})

describe("fondos casi sólidos", () => {
  it("bg-violet-600/80 y bg-amber-900/60 conservan los originales; los tintes /10 no", () => {
    const scopes = originalColorScopes()
    expect(scopes).toContain('[class~="bg-violet-600/80"]')
    expect(scopes).toContain('[class~="bg-amber-900/60"]')
    expect(scopes).toContain('[class~="from-primary/90"]')
    expect(scopes).not.toContain('[class~="bg-purple-500/10"]')
  })
})
