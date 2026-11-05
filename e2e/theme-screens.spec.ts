/**
 * Tema claro/oscuro (Juan 05/11): capturas de las pantallas principales en los
 * dos temas, desktop y mobile, más un chequeo de contraste por color computado.
 *
 *   PLAYWRIGHT_BASE_URL=http://localhost:3142 [PW_CHANNEL=chrome] npx playwright test e2e/theme-screens.spec.ts
 *
 * Capturas en test-results/theme-screens/<tema>-<viewport>-<pantalla>.png.
 * THEME_PAGES=home,producto filtra pantallas.
 */
import { test, expect, type Page } from "@playwright/test"

const PAGES: { name: string; path: string }[] = [
  { name: "home", path: "/" },
  { name: "producto", path: "/products/aura-tshirt-negro" },
  { name: "carrito", path: "/cart" },
  { name: "checkout", path: "/checkout" },
  { name: "crear", path: "/crear" },
  { name: "marcas", path: "/marcas" },
  { name: "empresas", path: "/empresas" },
  { name: "partners", path: "/partners" },
  { name: "partners-login", path: "/partners/login" },
  { name: "workspace-preview", path: "/dev/new-product-preview" },
  { name: "tienda-partner", path: "/p/maldito-demonio" },
  { name: "malvinas", path: "/malvinas" },
  { name: "merchs", path: "/merchs" },
  { name: "ofertas", path: "/ofertas" },
]

const VIEWPORTS = {
  desktop: { width: 1440, height: 900 },
  mobile: { width: 390, height: 844 },
} as const

// PW_CHANNEL=chrome usa el Chrome instalado si falta el chromium de esta versión de Playwright.
if (process.env.PW_CHANNEL) test.use({ channel: process.env.PW_CHANNEL })

const only = process.env.THEME_PAGES?.split(",")
// test-results/ se borra en cada corrida; THEME_SHOTS_DIR guarda las capturas en otro lado.
const OUT = process.env.THEME_SHOTS_DIR ?? "test-results/theme-screens"

/** Textos visibles con contraste < 3:1 contra el primer fondo opaco de sus ancestros. */
async function lowContrast(page: Page) {
  return page.evaluate(() => {
    const parse = (c: string) => {
      const m = c.match(/rgba?\(([^)]+)\)/)
      if (!m) return null
      const p = m[1].split(/[ ,/]+/).filter(Boolean).map(Number)
      return { r: p[0], g: p[1], b: p[2], a: p[3] ?? 1 }
    }
    const lum = ({ r, g, b }: { r: number; g: number; b: number }) => {
      const f = (v: number) => {
        v /= 255
        return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
      }
      return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b)
    }
    const bgOf = (el: Element | null): { r: number; g: number; b: number } | "image" => {
      while (el) {
        const s = getComputedStyle(el)
        if (s.backgroundImage && s.backgroundImage !== "none" && !s.backgroundImage.startsWith("radial")) return "image"
        const c = parse(s.backgroundColor)
        if (c && c.a > 0.85) return c
        el = el.parentElement
      }
      return { r: 255, g: 255, b: 255 }
    }
    const out: { text: string; ratio: number; color: string; cls: string }[] = []
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
    const seen = new Set<Element>()
    while (walker.nextNode()) {
      const el = walker.currentNode.parentElement
      const text = walker.currentNode.textContent?.trim()
      if (!el || !text || seen.has(el)) continue
      seen.add(el)
      const r = el.getBoundingClientRect()
      const s = getComputedStyle(el)
      if (r.width === 0 || r.height === 0 || s.visibility === "hidden" || Number(s.opacity) < 0.3) continue
      if (el.closest("[aria-hidden=true], .sr-only, script, style, noscript")) continue
      const fg = parse(s.color)
      const bg = bgOf(el)
      if (!fg || bg === "image") continue
      const l1 = lum(fg), l2 = lum(bg)
      const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05)
      if (ratio < 3) out.push({ text: text.slice(0, 50), ratio: Math.round(ratio * 100) / 100, color: s.color, cls: (el.className?.toString?.() ?? "").slice(0, 120) })
    }
    return out
  })
}

for (const theme of ["light", "dark"] as const) {
  for (const [vp, size] of Object.entries(VIEWPORTS)) {
    for (const p of PAGES.filter((x) => !only || only.includes(x.name))) {
      test(`${theme} ${vp} ${p.name}`, async ({ page }, info) => {
        test.setTimeout(90_000)
        await page.setViewportSize(size)
        // Sin elección guardada = default (claro). En oscuro simulamos haber tocado el botón.
        await page.addInitScript((t) => {
          if (t === "dark") localStorage.setItem("novamente-theme", "dark")
          localStorage.setItem("email-capture-dismissed", "1")
        }, theme)
        await page.goto(p.path, { waitUntil: "domcontentloaded" })
        await page.waitForLoadState("networkidle", { timeout: 20_000 }).catch(() => {})
        await page.waitForTimeout(1500)
        const htmlClass = await page.evaluate(() => document.documentElement.className)
        expect(htmlClass.includes("dark")).toBe(theme === "dark")
        await page.screenshot({ path: `${OUT}/${theme}-${vp}-${p.name}.png`, fullPage: true })
        const bad = await lowContrast(page)
        await info.attach("low-contrast.json", { body: JSON.stringify(bad, null, 2), contentType: "application/json" })
        console.log(`[contrast] ${theme} ${vp} ${p.name}: ${bad.length} textos < 3:1`)
        for (const b of bad.slice(0, 8)) console.log(`   ${b.ratio} "${b.text}" ${b.color} .${b.cls}`)
      })
    }
  }
}

// Barrido de landings (pauta/SEO): solo claro, captura de la primera pantalla.
// THEME_SWEEP=1 lo activa (son ~35 rutas).
const SWEEP = [
  "/ayuda", "/b2b-precios-2026", "/blog", "/buzos-egresados", "/buzos-personalizados", "/comparar",
  "/cotizador", "/despedidas-personalizadas", "/disena-tu-remera", "/drops", "/dtg-vs-serigrafia",
  "/envios", "/estampar-remeras", "/faq", "/guia-estampado", "/hoodie-personalizado",
  "/indumentaria-deportiva", "/lanza-tu-marca", "/merch", "/merch-para-bandas", "/merch-para-creadores",
  "/nosotros", "/regalos-dia-del-padre", "/regalos-empresariales", "/regalos-personalizados",
  "/remeras-cumpleanos", "/remeras-para-eventos", "/remeras-personalizadas", "/remeras-por-mayor",
  "/uniformes-personalizados", "/studio", "/terminos", "/quote", "/products",
]
for (const path of process.env.THEME_SWEEP ? SWEEP : []) {
  for (const [vp, size] of Object.entries(VIEWPORTS)) {
    test(`barrido light ${vp} ${path}`, async ({ page }) => {
      test.setTimeout(120_000)
      await page.setViewportSize(size)
      await page.addInitScript(() => localStorage.setItem("email-capture-dismissed", "1"))
      await page.goto(path, { waitUntil: "domcontentloaded" })
      await page.waitForLoadState("networkidle", { timeout: 15_000 }).catch(() => {})
      await page.waitForTimeout(1000)
      await page.screenshot({ path: `${OUT}/sweep-${vp}-${path.slice(1).replace(/\//g, "_")}.png` })
    })
  }
}

test("el botón cambia el tema y lo recuerda", async ({ page }) => {
  await page.setViewportSize(VIEWPORTS.desktop)
  await page.goto("/", { waitUntil: "domcontentloaded" })
  await expect(page.locator("html")).not.toHaveClass(/dark/)
  await page.getByTestId("theme-toggle").first().click()
  await expect(page.locator("html")).toHaveClass(/dark/)
  await page.reload({ waitUntil: "domcontentloaded" })
  await expect(page.locator("html")).toHaveClass(/dark/)
  await page.getByTestId("theme-toggle").first().click()
  await expect(page.locator("html")).not.toHaveClass(/dark/)
})
