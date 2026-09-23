/**
 * E2E del storefront público /p/[slug] — Fase 1 de la mejora de tiendas
 * partner (auditoría de 88 tiendas: botón de compra invisible, título
 * "Contactar" sin sentido, FAQs ausentes en starter).
 *
 * Corre contra STOREFRONT_E2E_URL (default: http://localhost:3000/p/abond,
 * una tienda pública real y liviana) en dos viewports, mobile (390) y
 * desktop (1280):
 *   - el hero renderiza (hay un <h1> o el logo del hero)
 *   - no hay ningún <h2> con el texto exacto "Contactar"
 *   - hay una sección de FAQs visible
 *   - el primer botón "Ver y comprar" tiene contraste de superficie >= 3:1
 *     contra el fondo de la página (computed styles reales del DOM)
 */
import { test, expect, type Page } from '@playwright/test'
import { contrastRatio } from '../lib/color/contrast'

const STOREFRONT_URL =
  process.env.STOREFRONT_E2E_URL ?? 'http://localhost:3000/p/abond'

const VIEWPORTS = [
  { name: 'mobile', width: 390, height: 844 },
  { name: 'desktop', width: 1280, height: 900 },
] as const

/** "rgb(r, g, b)" / "rgba(r, g, b, a)" → "#rrggbb" (compone sobre negro si hay alpha < 1). */
function cssColorToHex(css: string): string | null {
  const m = css.match(/rgba?\(([^)]+)\)/)
  if (!m) return null
  const parts = m[1].split(',').map((s) => parseFloat(s.trim()))
  const [r, g, b, a = 1] = parts
  if ([r, g, b].some((n) => Number.isNaN(n))) return null
  // Componer sobre negro (aproximación razonable: el fondo real del
  // storefront es bg-zinc-950, muy cercano a negro).
  const composite = (c: number) => Math.round(c * a)
  const toHex = (n: number) => Math.max(0, Math.min(255, n)).toString(16).padStart(2, '0')
  return `#${toHex(composite(r))}${toHex(composite(g))}${toHex(composite(b))}`
}

async function getPageBackgroundColor(page: Page): Promise<string> {
  return page.evaluate(() => getComputedStyle(document.body).backgroundColor)
}

for (const viewport of VIEWPORTS) {
  test.describe(`Storefront partner /p/[slug] — ${viewport.name}`, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } })

    test('hero renderiza, sin título "Contactar", con FAQs y CTA legible', async ({ page }) => {
      test.setTimeout(60_000)

      const response = await page.goto(STOREFRONT_URL, { waitUntil: 'domcontentloaded' })
      test.skip(
        !response || response.status() >= 400,
        `No se pudo cargar ${STOREFRONT_URL} (status ${response?.status()}) — tienda de test no disponible en este entorno`,
      )

      // Hero: hay un <h1> (nombre de la tienda) visible.
      const h1 = page.locator('h1').first()
      await expect(h1).toBeVisible()

      // Ningún <h2> debe decir exactamente "Contactar" (default de columna,
      // sin sentido como título — auditoría: 59/88 tiendas).
      const h2Texts = await page.locator('h2').allTextContents()
      const trimmed = h2Texts.map((t) => t.trim())
      expect(trimmed).not.toContain('Contactar')

      // FAQs visibles en cualquier plan (antes solo Growth+/Pro).
      const faqHeading = page.getByRole('heading', { name: /preguntas frecuentes/i })
      await expect(faqHeading).toBeVisible()

      // Contraste de superficie del primer CTA "Ver y comprar" contra el
      // fondo de la página — >= 3:1 (WCAG non-text contrast).
      const buyButton = page.getByText('Ver y comprar', { exact: false }).first()
      const hasProducts = (await buyButton.count()) > 0
      test.skip(!hasProducts, 'Tienda de test sin productos publicados — no hay CTA "Ver y comprar" que chequear')

      await expect(buyButton).toBeVisible()
      const buttonBg = await buyButton.evaluate((el) => getComputedStyle(el).backgroundColor)
      const pageBg = await getPageBackgroundColor(page)

      const buttonHex = cssColorToHex(buttonBg)
      const pageHex = cssColorToHex(pageBg)
      expect(buttonHex, `no se pudo parsear backgroundColor del botón: ${buttonBg}`).toBeTruthy()
      expect(pageHex, `no se pudo parsear backgroundColor de la página: ${pageBg}`).toBeTruthy()

      const ratio = contrastRatio(buttonHex!, pageHex!)
      expect(ratio).toBeGreaterThanOrEqual(3 - 0.05)
    })

    // Fase 3 pieza E1 — la card de producto con frente+dorso alterna sola
    // entre las 2 caras (fundido CSS). Con reduced-motion DESACTIVADO
    // (`reducedMotion: 'no-preference'`) tiene que animar; verificamos que
    // la card tenga 2 <img> (frente/dorso) y que en 2 momentos distintos la
    // opacidad de al menos una de las dos cambie.
    test('la card de producto con dorso alterna frente/dorso (reduced-motion desactivado)', async ({ page }) => {
      test.setTimeout(30_000)
      await page.emulateMedia({ reducedMotion: 'no-preference' })

      const response = await page.goto(STOREFRONT_URL, { waitUntil: 'domcontentloaded' })
      test.skip(
        !response || response.status() >= 400,
        `No se pudo cargar ${STOREFRONT_URL} (status ${response?.status()}) — tienda de test no disponible en este entorno`,
      )

      // Buscar la primera card que tenga 2 imágenes (frente + dorso real).
      const dualImageContainers = page.locator('div.absolute.inset-0').filter({
        has: page.locator('img'),
      })
      const count = await dualImageContainers.count()
      let target = null
      for (let i = 0; i < count; i++) {
        const el = dualImageContainers.nth(i)
        if ((await el.locator('img').count()) === 2) {
          target = el
          break
        }
      }
      test.skip(!target, 'Tienda de test sin ningún producto con 2 imágenes (frente+dorso) — nada que animar')

      const opacityAt = async () =>
        target!.locator('img').evaluateAll((imgs) => imgs.map((img) => getComputedStyle(img).opacity))

      const first = await opacityAt()
      // El fundido tarda ~3.5s + un delay de arranque aleatorio (0-3.5s) —
      // esperamos hasta 8s para ver el cambio con margen.
      await expect
        .poll(async () => (await opacityAt()).join(','), { timeout: 8_000, intervals: [250] })
        .not.toBe(first.join(','))
    })
  })
}
