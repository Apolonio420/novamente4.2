import { test, expect } from "@playwright/test"

/**
 * Verifica el flujo de compra real de un producto de la Serie Malvinas:
 * /malvinas → producto (color + talle) → carrito → checkout.
 * NO completa ningún pago — solo confirma que se llega a la pantalla de checkout
 * con el item correcto. Corre contra el build de producción local (`next start`).
 */

const SCRATCHPAD =
  process.env.MALVINAS_E2E_SCRATCHPAD ??
  "/private/tmp/claude-501/-Users-sambujuan-novamente-dev-chatbot/2b80b6a3-e328-46fd-8f35-08a1e70abc95/scratchpad"

const VIEWPORTS = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "mobile", width: 390, height: 844 },
]

test.describe("Serie Malvinas — flujo de compra", () => {
  test("landing /malvinas tiene CTA Comprar hacia el producto", async ({ page }) => {
    await page.goto("/malvinas", { waitUntil: "networkidle" })
    const comprarLinks = page.getByRole("link", { name: "Comprar" })
    await expect(comprarLinks.first()).toBeVisible()
    const href = await comprarLinks.first().getAttribute("href")
    expect(href).toMatch(/^\/malvinas\/[a-z0-9-]+$/)
  })

  test("producto con colores: elegir color + talle, agregar al carrito, ir a checkout", async ({ page }) => {
    await page.goto("/malvinas/tres-estrellas", { waitUntil: "networkidle" })

    // Precio derivado de lib/catalog.ts (Aura Oversize T-Shirt = $31.000)
    await expect(page.getByText(/\$\s?31\.000/)).toBeVisible()

    // Elegir el segundo color (Blanca oversize)
    const colorButtons = page.getByRole("button", { name: /^Color / })
    await expect(colorButtons).toHaveCount(3)
    await colorButtons.nth(1).click()

    // Elegir talle M
    await page.getByRole("button", { name: "M", exact: true }).click()

    // Agregar al carrito
    await page.getByRole("button", { name: /Agregar al carrito/ }).click()
    await expect(page.getByText("Agregado al carrito")).toBeVisible()

    // Ir al carrito
    await page.goto("/cart", { waitUntil: "networkidle" })
    await expect(page.getByText(/Tres estrellas/).first()).toBeVisible()
    await expect(page.getByText(/Blanca oversize/)).toBeVisible()

    // Ir a checkout (sin completar el pago)
    await page.getByRole("button", { name: /Finalizar Compra/i }).click()
    await page.waitForURL("**/checkout", { timeout: 15000 })
    await expect(page).toHaveURL(/\/checkout$/)
    await expect(page.getByText(/Tres estrellas/).first()).toBeVisible()
  })

  test("producto con 2 colores: elegir color, comprar ahora lleva directo a checkout", async ({ page }) => {
    await page.goto("/malvinas/trapo-negra", { waitUntil: "networkidle" })
    await expect(page.getByText(/\$\s?28\.600/)).toBeVisible()

    // trapo-negra tiene Negra + Stone wash (única excepción a 3 colores — tela blanca
    // no es viable sobre esta prenda). Verificamos el selector antes de comprar.
    const colorButtons = page.getByRole("button", { name: /^Color / })
    await expect(colorButtons).toHaveCount(2)
    await colorButtons.nth(1).click()

    await page.getByRole("button", { name: "L", exact: true }).click()
    await page.getByRole("button", { name: /Comprar ahora/ }).click()

    await page.waitForURL("**/checkout", { timeout: 15000 })
    await expect(page).toHaveURL(/\/checkout$/)
    await expect(page.getByText(/El trapo/).first()).toBeVisible()
  })
})

test.describe("Serie Malvinas — Lienzo (selector de Medida en vez de Talle)", () => {
  test("lienzo-carta-nautica: elegir medida, agregar al carrito, ir a checkout", async ({ page }) => {
    await page.goto("/malvinas/lienzo-carta-nautica", { waitUntil: "networkidle" })

    // Precio "desde" antes de elegir medida — el más chico de sizeOptions (lib/products.ts:131).
    await expect(page.getByText(/Desde.*\$\s?34\.000/)).toBeVisible()

    // Selector dice "Medida", no "Talle".
    await expect(page.getByText("Medida", { exact: true })).toBeVisible()

    // Elegir medida 35×40 cm (precio $41.000)
    await page.getByRole("button", { name: "35×40 cm" }).click()
    await expect(page.getByText(/\$\s?41\.000/).first()).toBeVisible()

    // Sin tabla de talles de ropa (ancho/largo cm de prenda) para el lienzo.
    await expect(page.getByText("Tabla de talles")).toHaveCount(0)

    await page.getByRole("button", { name: /Agregar al carrito/ }).click()
    await expect(page.getByText("Agregado al carrito")).toBeVisible()

    await page.goto("/cart", { waitUntil: "networkidle" })
    await expect(page.getByText(/Carta Náutica.*Lienzo/).first()).toBeVisible()
    // El carrito formatea precio en-US ($41,000.00) mientras la PDP usa es-AR ($41.000) — ambos válidos.
    await expect(page.getByText(/\$\s?41[.,]000/).first()).toBeVisible()

    await page.getByRole("button", { name: /Finalizar Compra/i }).click()
    await page.waitForURL("**/checkout", { timeout: 15000 })
    await expect(page).toHaveURL(/\/checkout$/)
    await expect(page.getByText(/Carta Náutica.*Lienzo/).first()).toBeVisible()
  })

  for (const vp of VIEWPORTS) {
    test(`/malvinas/lienzo-carta-nautica @ ${vp.name}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height })
      await page.goto("/malvinas/lienzo-carta-nautica", { waitUntil: "networkidle" })
      await page.getByRole("button", { name: "40×50 cm" }).click()
      await page.waitForTimeout(400)
      await page.screenshot({ path: `${SCRATCHPAD}/malvinas-lienzo-product-${vp.name}.png`, fullPage: true })
    })
  }
})

test.describe("Serie Malvinas — Product JSON-LD", () => {
  test("/malvinas/tres-estrellas emite Product JSON-LD con precio real de catalogo", async ({ page }) => {
    await page.goto("/malvinas/tres-estrellas", { waitUntil: "networkidle" })
    const jsonLdBlocks = await page.locator('script[type="application/ld+json"]').allTextContents()
    const product = jsonLdBlocks.map((t) => JSON.parse(t)).find((p) => p["@type"] === "Product")
    expect(product).toBeTruthy()
    expect(product.offers.price).toBe(31000) // Aura Oversize T-Shirt, lib/catalog.ts
    expect(product.offers.priceCurrency).toBe("ARS")
  })

  test("/malvinas/lienzo-carta-nautica emite un Offer por medida (sizeOptions)", async ({ page }) => {
    await page.goto("/malvinas/lienzo-carta-nautica", { waitUntil: "networkidle" })
    const jsonLdBlocks = await page.locator('script[type="application/ld+json"]').allTextContents()
    const product = jsonLdBlocks.map((t) => JSON.parse(t)).find((p) => p["@type"] === "Product")
    expect(product).toBeTruthy()
    expect(Array.isArray(product.offers)).toBe(true)
    expect(product.offers.length).toBe(3)
  })
})

test.describe("Screenshots — desktop + mobile", () => {
  for (const vp of VIEWPORTS) {
    test(`/malvinas @ ${vp.name}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height })
      await page.goto("/malvinas", { waitUntil: "networkidle" })
      await page.waitForTimeout(400)
      await page.screenshot({ path: `${SCRATCHPAD}/malvinas-buyable-${vp.name}.png`, fullPage: true })
    })

    test(`/malvinas/tres-estrellas @ ${vp.name}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height })
      await page.goto("/malvinas/tres-estrellas", { waitUntil: "networkidle" })
      await page.waitForTimeout(400)
      await page.screenshot({ path: `${SCRATCHPAD}/malvinas-product-${vp.name}.png`, fullPage: true })
    })

    test(`/cart with malvinas item @ ${vp.name}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height })
      await page.goto("/malvinas/tres-estrellas", { waitUntil: "networkidle" })
      await page.getByRole("button", { name: "M", exact: true }).click()
      await page.getByRole("button", { name: /Agregar al carrito/ }).click()
      await page.waitForTimeout(300)
      await page.goto("/cart", { waitUntil: "networkidle" })
      await page.waitForTimeout(400)
      await page.screenshot({ path: `${SCRATCHPAD}/malvinas-cart-${vp.name}.png`, fullPage: true })
    })
  }
})
