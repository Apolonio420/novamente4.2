import { test, expect } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'

/**
 * Mockup de la Remera Sin Mangas Bondi en /crear, blanca y negra, con un PNG
 * de prueba (círculo + "TEST") precargado vía ?image=. La imagen se sirve
 * interceptando la request: no sube a R2 ni llama a Gemini.
 */
const BASE = process.env.E2E_BASE_URL ?? 'http://localhost:3939'
const SHOTS = path.join(__dirname, '..', 'test-results', 'bondi-mockup')
const TEST_PNG = process.env.BONDI_TEST_PNG ?? ''

test.describe.configure({ timeout: 60_000 })

for (const color of ['Blanca', 'Negra'] as const) {
  test(`/crear: Bondi ${color} con estampa en el pecho`, async ({ page }) => {
    test.skip(!TEST_PNG || !fs.existsSync(TEST_PNG), 'definir BONDI_TEST_PNG')
    fs.mkdirSync(SHOTS, { recursive: true })
    await page.setViewportSize({ width: 1440, height: 1700 })
    await page.route((url) => url.pathname === '/__bondi-test/print.png', (route) =>
      route.fulfill({ status: 200, contentType: 'image/png', body: fs.readFileSync(TEST_PNG) }),
    )
    await page.goto(`${BASE}/crear?image=/__bondi-test/print.png`, { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(6000)
    const empezar = page.getByRole('button', { name: /Empezar a diseñar/ })
    if (await empezar.count()) await empezar.click()
    await page.getByLabel(new RegExp(`sin mangas en ${color}`, 'i')).first().click()
    await page.waitForTimeout(1500)
    await page.getByText('Canvas', { exact: true }).first().click()
    await page.waitForTimeout(5000)
    await page.screenshot({ path: `${SHOTS}/crear-bondi-${color.toLowerCase()}.png` })
    await expect(page.locator('canvas').first()).toBeVisible()
  })
}
