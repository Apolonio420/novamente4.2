import { test, expect } from '@playwright/test'
import path from 'node:path'

/**
 * Alta de la Remera Sin Mangas Bondi (Juan 05/11): tienda, /crear con S-2XL y
 * tarifa B2B. Sin costos a la vista.
 */
const BASE = process.env.E2E_BASE_URL ?? 'http://localhost:3939'
const SHOTS = path.join(__dirname, '..', 'test-results', 'bondi-alta')

test.describe.configure({ timeout: 120_000 })

for (const color of ['blanca', 'negra'] as const) {
  test(`tienda: PDP de la Bondi ${color} con precio web y medidas`, async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto(`${BASE}/products/remera-sin-mangas-bondi-${color}`, { waitUntil: 'networkidle' })
    await expect(page.getByText(/Bondi/).first()).toBeVisible()
    await expect(page.getByText(/28\.600/).first()).toBeVisible()
    await expect(page.locator('body')).not.toContainText('21.990')
    await page.screenshot({ path: `${SHOTS}/1-pdp-${color}.png` })
  })
}

test('/crear: al elegir la Bondi el talle es S a 2XL', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(`${BASE}/crear`, { waitUntil: 'networkidle' })
  const empezar = page.getByRole('button', { name: /Empezar a diseñar/ })
  if (await empezar.count()) await empezar.click()

  await page.getByText(/Sin Mangas/i).first().click()
  const talles = page.locator('label:has-text("Talle") + div button')
  await expect(talles).toHaveText(['S', 'M', 'L', 'XL', '2XL'])
  await talles.first().scrollIntoViewIfNeeded()
  await page.screenshot({ path: `${SHOTS}/2-crear-bondi-talles.png` })
})

test('/b2b-precios-2026: la Bondi con la tarifa de la Aldea', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(`${BASE}/b2b-precios-2026`, { waitUntil: 'networkidle' })
  const bondi = page.getByText('Modelo Bondi').first()
  await bondi.scrollIntoViewIfNeeded()
  await expect(bondi).toBeVisible()
  await expect(page.locator('body')).not.toContainText('21.990')
  await page.screenshot({ path: `${SHOTS}/3-b2b-precios-bondi.png` })
})
