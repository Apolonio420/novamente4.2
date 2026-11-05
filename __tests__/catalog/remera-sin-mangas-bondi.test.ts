import { describe, it, expect, vi } from "vitest"

// partner-cost importa garment-pricing.server (`server-only`): en vitest se neutraliza.
vi.mock("server-only", () => ({}))
import { readdirSync, readFileSync, statSync } from "node:fs"
import { join } from "node:path"
import {
  CATALOG_PRODUCTS,
  getCatalogProduct,
  getStorefrontGarmentList,
  getCatalogCategories,
} from "@/lib/catalog/products"
import { ALLOWED_PARTNER_CATEGORIES } from "@/lib/partners/product-policy"
import { PRODUCTS } from "@/lib/products"
import { PRODUCTS as BOT_PRODUCTS } from "@/lib/catalog"
import { PARTNER_PRICE_BY_ID_ARS } from "@/lib/partnerPrices"
import { lookupProductName, productDisplayName, productModelName } from "@/lib/product-names"
import { resolveProduct } from "@/lib/orders/product-aliases"
import { guessGarmentKey } from "@/lib/partners/partner-cost"
import { getGarmentMapping } from "@/lib/garment-mappings"
import { isSizeValidForGarment, pickSizeFor, sizeChartForGarment, sizesForGarment } from "@/lib/catalog/sizes"
import { getPrintArea, hasBackTemplate, resolveGarmentTemplate } from "@/app/crear/garment-templates"
import { MODELS, MODEL_TO_GARMENT_KEY } from "@/app/b2b-precios-2026/data"
// Solo para verificar valores: es el módulo de datos server-only con `cost`. Un test node puede leerlo.
import {
  ALL_GARMENT_PRICING,
  GROWTH_TIER_DELTA_ARS,
} from "@/lib/partners/garment-pricing-data"

const KEY = "remera-sin-mangas-bondi"
const REPO_ROOT = join(__dirname, "..", "..")

describe("Remera Sin Mangas Bondi — catálogo", () => {
  const p = getCatalogProduct(KEY)!

  it("existe con nombre, categoría, tipo y talles del spec", () => {
    expect(p).toBeDefined()
    expect(p.name).toBe("Remera Sin Mangas Bondi")
    expect(p.category).toBe("Remera Sin Mangas")
    expect(p.garmentType).toBe("tank")
    expect(p.fabric).toBe("algodon 100% peinado")
    expect(p.weightGsm).toBe(250)
    expect(p.sizes).toEqual(["S", "M", "L", "XL", "2XL"])
  })

  it("precios de venta: web 28.600 y partner on_demand 25.800 (nunca el costo del proveedor)", () => {
    expect(p.retailARS).toBe(28600)
    expect(p.costARS).toBe(25800)
  })

  it("colores Blanca y Negra con hex y assets del spec", () => {
    expect(p.colors.map((c) => [c.key, c.name, c.hex])).toEqual([
      ["white", "Blanca", "#f5f5f5"],
      ["black", "Negra", "#111111"],
    ])
    expect(p.colors[0].thumbnail).toBe("/garments/remera-sin-mangas-bondi-white-front.png")
    expect(p.colors[1].thumbnail).toBe("/garments/remera-sin-mangas-bondi-black-front.png")
    expect(p.colors[0].hero).toBe("/products/remera-sin-mangas-bondi-blanca/front.png")
    expect(p.colors[1].hero).toBe("/products/remera-sin-mangas-bondi-negra/front.png")
    expect(p.measurementsImage).toBe("/products/remera-sin-mangas-bondi-medidas.png")
  })

  it("descripción corta del spec, sin claims inventados", () => {
    expect(p.shortDescription).toContain("Remera clasica sin mangas en algodon 100% peinado")
    expect(p.shortDescription).toContain("ideal para verano, gym y eventos")
  })

  it("la categoría está permitida para partners", () => {
    expect(getCatalogCategories()).toContain("Remera Sin Mangas")
    expect((ALLOWED_PARTNER_CATEGORIES as readonly string[]).map((c) => c.toLowerCase())).toContain("remera sin mangas")
  })

  it("no pisa a la Bali ni a la Aldea", () => {
    expect(getCatalogProduct("musculosa-bali")!.retailARS).toBe(21800)
    expect(getCatalogProduct("musculosa-bali")!.colors.map((c) => c.key)).toEqual(["white", "gray"])
    expect(getCatalogProduct("aldea-classic-tshirt")!.sizes).toEqual(["S", "M", "L", "XL", "XXL"])
    expect(CATALOG_PRODUCTS.filter((x) => x.key === KEY)).toHaveLength(1)
  })
})

describe("Remera Sin Mangas Bondi — web (lib/products) y feed", () => {
  it("dos fichas (blanca y negra) a $28.600 con assets del spec", () => {
    const blanca = PRODUCTS.find((x) => x.id === `${KEY}-blanca`)!
    const negra = PRODUCTS.find((x) => x.id === `${KEY}-negra`)!
    for (const [prod, dir] of [[blanca, "blanca"], [negra, "negra"]] as const) {
      expect(prod.price).toBe("$28.600")
      expect(prod.available).toBe(true)
      expect(prod.category).toBe("Remeras Sin Mangas")
      expect(prod.images.main).toBe(`/products/remera-sin-mangas-bondi-${dir}/front.png`)
      expect(prod.images.lifestyle).toEqual([`/products/remera-sin-mangas-bondi-${dir}/back.png`])
      expect(prod.images.measurements).toBe("/products/remera-sin-mangas-bondi-medidas.png")
    }
  })

  it("feed de Meta usa el precio partner on_demand (25.800), mismo criterio que el resto", () => {
    expect(PARTNER_PRICE_BY_ID_ARS[`${KEY}-blanca`]).toBe(25800)
    expect(PARTNER_PRICE_BY_ID_ARS[`${KEY}-negra`]).toBe(25800)
  })

  it("el bot/catálogo público la lista a 28.600 con sus dos colores", () => {
    const b = BOT_PRODUCTS.find((x) => x.garmentType === KEY)!
    expect(b.price).toBe(28600)
    expect(b.colors).toEqual(["blanca", "negra"])
  })

  it("/b2b-precios-2026: modelo Bondi con la tabla de la Aldea", () => {
    const m = MODELS.find((x) => x.id === "bondi")!
    expect(m.subtitle).toBe("Modelo Bondi")
    expect(m.prices).toEqual({ partner: 25800, starter: 25100, pro: 24400, drop: 23800, bulk: 23600 })
    expect(m.sizes).toEqual(["S", "M", "L", "XL", "2XL"])
    expect(MODEL_TO_GARMENT_KEY.bondi).toBe(KEY)
    expect(m.colors.map((c) => c.name)).toEqual(["Blanca", "Negra"])
  })
})

describe("Remera Sin Mangas Bondi — pricing de partners", () => {
  const g = ALL_GARMENT_PRICING[KEY]

  it("tiers de venta del spec (= Aldea) y costo 21.990", () => {
    expect(g.on_demand).toBe(25800)
    expect(g.b2b_starter).toBe(25100)
    expect(g.b2b_pro).toBe(24400)
    expect(g.b2b_drop).toBe(23800)
    expect(g.b2b_bulk).toBe(23600)
    expect(g.b2c_suggested).toBe(28600)
    expect(g.cost).toBe(21990)
  })

  it("Growth = cost + delta = 22.990 / 22.790 / 22.590 / 22.390 / 22.190", () => {
    const growth = (Object.keys(GROWTH_TIER_DELTA_ARS) as Array<keyof typeof GROWTH_TIER_DELTA_ARS>).map(
      (t) => g.cost + GROWTH_TIER_DELTA_ARS[t],
    )
    expect(growth).toEqual([22990, 22790, 22590, 22390, 22190])
  })

  it("regla del 8 %: Growth partner <= 92 % del on_demand", () => {
    const growthPartner = g.cost + GROWTH_TIER_DELTA_ARS.partner
    expect(growthPartner / g.on_demand).toBeLessThanOrEqual(0.92)
    expect(Math.ceil(growthPartner / 0.92 / 100) * 100).toBeLessThanOrEqual(g.on_demand)
  })
})

describe("Remera Sin Mangas Bondi — el costo NO sale a cliente", () => {
  it("getStorefrontGarmentList (API pública del storefront) no contiene el costo 21.990", () => {
    const item = getStorefrontGarmentList().find((x) => x.key === KEY)!
    expect(item).toBeDefined()
    expect(item.cost).toBe(25800) // precio partner publicado, NO el costo del proveedor
    const json = JSON.stringify(getStorefrontGarmentList())
    expect(json).not.toMatch(/21990|21\.990|21,990/)
    expect(json).not.toMatch(/RSMB|RSMN|supplier/i)
  })

  it("ningún archivo de app/, components/, docs públicos ni llms.txt menciona 21.990 ni los SKU de proveedor", () => {
    const offenders: string[] = []
    const SKIP_FILES = new Set(["lib/partners/garment-pricing-data.ts"])
    const walk = (dir: string) => {
      for (const name of readdirSync(join(REPO_ROOT, dir))) {
        const rel = `${dir}/${name}`
        const abs = join(REPO_ROOT, rel)
        if (name === "node_modules" || name === ".next") continue
        if (statSync(abs).isDirectory()) { walk(rel); continue }
        if (!/\.(tsx?|md|txt|json)$/.test(name) || /\.test\.|\.spec\./.test(name)) continue
        if (SKIP_FILES.has(rel)) continue
        const src = readFileSync(abs, "utf-8")
        if (/21\.?990|21,990/.test(src) && /bondi|sin mangas/i.test(src)) offenders.push(rel)
        if (/\bRSM[BN]\b/.test(src)) offenders.push(rel)
      }
    }
    for (const d of ["app", "components", "docs/public", "lib"]) walk(d)
    expect(readFileSync(join(REPO_ROOT, "public/llms.txt"), "utf-8")).not.toMatch(/21\.?990/)
    expect(offenders).toEqual([])
  })

  it("el módulo de datos con `cost` solo lo importa garment-pricing.server (ningún componente cliente de /crear ni del catálogo)", () => {
    for (const rel of [
      "app/crear/DesignCanvas.tsx",
      "app/crear/garment-templates.ts",
      "components/DesignCustomizer.tsx",
      "components/cotizador-calculator.tsx",
      "components/partners/storefront-designer.tsx",
      "components/partners/new-product-panel.tsx",
      "lib/catalog/products.ts",
      "lib/products.ts",
      "lib/catalog.ts",
      "lib/partnerPrices.ts",
    ]) {
      expect(readFileSync(join(REPO_ROOT, rel), "utf-8"), rel).not.toMatch(/garment-pricing-data/)
    }
  })
})

describe("Remera Sin Mangas Bondi — alias", () => {
  const BONDI = "Remera Sin Mangas Bondi"
  it.each([
    "bondi", "Bondi", "sin mangas", "Sin Mangas", "remera sin mangas", "Remera sin mangas",
    "remera clasica sin mangas", "Remera Clásica Sin Mangas", "remera sin manga",
    "Remera Sin Mangas Bondi", "remera-sin-mangas-bondi", "Remera Sin Mangas Bondi Custom — Novamente",
    "remera blanca sin mangas",
  ])("%s -> Bondi", (input) => {
    expect(resolveProduct(input)).toBe(BONDI)
  })

  it("no rompe a la Bali: musculosa sigue siendo la Bali", () => {
    for (const i of ["musculosa", "Musculosa Bali", "bali", "musculosa mujer", "musculosa sin mangas"]) {
      expect(resolveProduct(i), i).toBe("Musculosa mujer morley")
    }
  })

  it("no rompe a la Aldea: 'remera clasica' y 'remera' sin 'sin mangas' siguen en la Aldea", () => {
    for (const i of ["remera clasica", "remera", "Remera clásica", "aldea", "remera basica"]) {
      expect(resolveProduct(i), i).toBe("Remera clásica man")
    }
    expect(resolveProduct("remera clasica mujer")).toBe("Remera clásica woman")
    expect(resolveProduct("remera oversize")).toBe("Remera Oversize unisex")
    expect(resolveProduct("remera crop")).toBe("Remera Crop")
  })

  it("product-names: Bondi tiene modelo/descriptivo propio y no cae en Aldea ni Bali", () => {
    expect(lookupProductName({ id: `${KEY}-blanca` })).toEqual({ modelo: "Bondi", descriptivo: "Remera sin mangas" })
    expect(lookupProductName({ garmentType: KEY })).toEqual({ modelo: "Bondi", descriptivo: "Remera sin mangas" })
    expect(productModelName({ id: `${KEY}-negra` })).toBe("Bondi")
    expect(productDisplayName({ id: `${KEY}-negra`, name: "x", color: "Negra" })).toBe("Remera sin mangas - Negra")
    expect(lookupProductName({ id: "musculosa-bali-blanca" })).toEqual({ modelo: "Bali", descriptivo: "Musculosa" })
    expect(lookupProductName({ id: "aldea-tshirt-negro" })?.modelo).toBe("Aldea")
  })

  it("guessGarmentKey (costo de partner): Bondi -> su key; musculosa y remera genérica no cambian", () => {
    expect(guessGarmentKey("Remera Sin Mangas Bondi")).toBe(KEY)
    expect(guessGarmentKey("remera sin mangas")).toBe(KEY)
    expect(guessGarmentKey("Bondi")).toBe(KEY)
    expect(guessGarmentKey("Musculosa Bali")).toBe("musculosa-bali")
    expect(guessGarmentKey("musculosa sin mangas")).toBe("musculosa-bali")
    expect(guessGarmentKey("Remera Aldea Classic")).toBe("aldea-classic-tshirt")
    expect(guessGarmentKey("remera")).toBe("aura-oversize-tshirt")
  })
})

describe("Remera Sin Mangas Bondi — /crear (talles, templates, área de estampa)", () => {
  it("ofrece S, M, L, XL y 2XL con el mecanismo de talles por prenda", () => {
    expect(sizesForGarment(KEY)).toEqual(["S", "M", "L", "XL", "2XL"])
    expect(sizesForGarment(KEY, "black")).toEqual(["S", "M", "L", "XL", "2XL"])
    expect(sizesForGarment(KEY)).not.toContain("XXL")
    expect(sizesForGarment(KEY)).not.toContain("XS")
    expect(pickSizeFor(sizesForGarment(KEY), "M")).toBe("M")
    expect(pickSizeFor(sizesForGarment(KEY), "XXL")).toBe("M")
    expect(sizeChartForGarment(KEY)).toBe("/products/remera-sin-mangas-bondi-medidas.png")
  })

  it("el checkout rechaza talles infantiles en la Bondi y acepta 2XL", () => {
    expect(isSizeValidForGarment(KEY, "2XL")).toBe(true)
    expect(isSizeValidForGarment(KEY, "10")).toBe(false)
  })

  it("template de la prenda por color y lado", () => {
    for (const c of ["white", "black"]) {
      for (const s of ["front", "back"] as const) {
        expect(resolveGarmentTemplate(KEY, c, s)).toEqual([`/garments/remera-sin-mangas-bondi-${c}-${s}.png`])
      }
    }
  })

  it("área de estampa = la de la Aldea (remera clásica), con dorso", () => {
    expect(getPrintArea(KEY, "front")).toEqual(getPrintArea("aldea-classic-tshirt", "front"))
    expect(getPrintArea(KEY, "back")).toEqual(getPrintArea("aldea-classic-tshirt", "back"))
    expect(getPrintArea(KEY, "front")).not.toEqual(getPrintArea("musculosa-bali", "front"))
    expect(hasBackTemplate(KEY)).toBe(true)
  })

  it("garment-mappings: mapping real (no fallback) para los 2 colores x 2 lados", () => {
    for (const c of ["white", "black"]) {
      for (const s of ["front", "back"] as const) {
        const m = getGarmentMapping(KEY, c, s)!
        expect(m.id).not.toBe("fallback")
        expect(m.garmentPath).toBe(`/garments/remera-sin-mangas-bondi-${c}-${s}.png`)
        expect(m.coordinates.width).toBeGreaterThan(0)
      }
    }
  })
})

describe("Remera Sin Mangas Bondi — guía de talles", () => {
  const MEDIDAS = {
    sizes: ["S", "M", "L", "XL", "2XL"],
    width: ["52", "54", "55", "57,5", "59,5"],
    length: ["75", "77", "79", "81", "83"],
  }
  const chartLiteral = (src: string, keyRe: RegExp) => {
    const block = src.slice(src.search(keyRe))
    return block.slice(0, 400).replace(/["']/g, '"')
  }

  it("las tres fuentes (PDP, drops y script del PDF) tienen las mismas medidas del spec", () => {
    const pdp = readFileSync(join(REPO_ROOT, "app/products/[id]/page.tsx"), "utf-8")
    const drops = readFileSync(join(REPO_ROOT, "app/drops/[id]/DropClient.tsx"), "utf-8")
    const pdf = readFileSync(join(REPO_ROOT, "scripts/generate-size-guide-pdf.ts"), "utf-8")
    for (const [src, re] of [
      [pdp, /"Remeras Sin Mangas": \{/],
      [drops, /"remera-sin-mangas-bondi": \{/],
      [pdf, /title: 'Remera Sin Mangas Bondi/],
    ] as const) {
      const lit = chartLiteral(src, re)
      expect(lit).toContain(`"S", "M", "L", "XL", "2XL"`.replace(/"/g, lit.includes("'S'") ? "'" : '"'))
      for (const v of [...MEDIDAS.width, ...MEDIDAS.length]) expect(lit).toContain(v)
    }
  })

  it("el PDF commiteado se regeneró con la Bondi", () => {
    const bytes = readFileSync(join(REPO_ROOT, "public/guia-de-talles-novamente.pdf"))
    expect(bytes.length).toBeGreaterThan(1000)
  })
})
