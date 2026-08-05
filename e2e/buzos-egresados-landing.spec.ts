import { test, expect } from "@playwright/test"

/**
 * Smoke test de la landing SEO /buzos-egresados (keyword "buzos de egresados
 * 2026", Search Console jul-2026: posicion 5.2, 212 impresiones/mes).
 *
 * Patron de e2e/malvinas-buy-flow.spec.ts: carga, H1 visible, CTA WhatsApp
 * con href correcto, precios visibles (derivados de lib/catalog.ts).
 */

test.describe("Landing /buzos-egresados", () => {
  test("carga, H1 con la keyword, precios visibles y CTA WhatsApp correcto", async ({ page }) => {
    await page.goto("/buzos-egresados", { waitUntil: "networkidle" })

    // H1 contiene la keyword exacta "buzos de egresados"
    const h1 = page.getByRole("heading", { level: 1 })
    await expect(h1).toBeVisible()
    await expect(h1).toContainText(/buzos de egresados/i)

    // Precios de Boston (hoodie) y Berlin (buzo cuello redondo) — derivados
    // de lib/catalog.ts (buzo-hoodie-unisex=$55.000, buzo-cuello-redondo=$43.000).
    await expect(page.getByText(/\$\s?55\.000/).first()).toBeVisible()
    await expect(page.getByText(/\$\s?43\.000/).first()).toBeVisible()

    // CTA principal de WhatsApp con el texto prellenado pedido y el numero del bot.
    const waLink = page.locator('a[data-cta="hero-buzos-egresados"]')
    await expect(waLink).toBeVisible()
    const href = await waLink.getAttribute("href")
    expect(href).toContain("https://wa.me/5492235169720")
    expect(href).toContain(encodeURIComponent("Quiero cotizar buzos de egresados para mi curso"))

    // CTA final (misma tracking convention data-cta que el resto del sitio).
    const waLinkFinal = page.locator('a[data-cta="final-cta-buzos-egresados"]')
    await expect(waLinkFinal).toBeVisible()

    // FAQ presente (FAQPage JSON-LD respaldado por contenido visible en la pagina).
    await expect(page.getByText("Preguntas frecuentes sobre buzos de egresados")).toBeVisible()
  })

  test("JSON-LD: Product (por modelo) + FAQPage presentes en el HTML servido", async ({ page }) => {
    await page.goto("/buzos-egresados", { waitUntil: "networkidle" })

    const jsonLdBlocks = await page.locator('script[type="application/ld+json"]').allTextContents()
    const parsed = jsonLdBlocks.map((t) => JSON.parse(t))

    const products = parsed.filter((p) => p["@type"] === "Product")
    expect(products.length).toBeGreaterThanOrEqual(2)
    for (const p of products) {
      expect(p.offers?.price).toBeGreaterThan(0)
      expect(p.offers?.priceCurrency).toBe("ARS")
    }

    const faqPage = parsed.find((p) => p["@type"] === "FAQPage")
    expect(faqPage).toBeTruthy()
    expect(faqPage.mainEntity.length).toBeGreaterThanOrEqual(6)
    expect(faqPage.mainEntity.length).toBeLessThanOrEqual(8)
  })

  test("mobile viewport: H1 y CTA visibles", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto("/buzos-egresados", { waitUntil: "networkidle" })
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible()
    await expect(page.locator('a[data-cta="hero-buzos-egresados"]')).toBeVisible()
  })
})
