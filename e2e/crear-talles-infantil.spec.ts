import { test, expect } from '@playwright/test'
import path from 'node:path'

/**
 * /crear — la remera infantil se vendía con talles de adulto (pedido
 * NOV-20261105-9051 salió talle "L"; el proveedor trabaja 4 a 16). Ahora el
 * selector muestra los talles de LA prenda elegida.
 */
const BASE = process.env.E2E_BASE_URL ?? 'http://localhost:3939'
const SHOTS = path.join(__dirname, '..', 'test-results', 'crear-talles-infantil')

test('al elegir la remera infantil, el talle es 4 a 16 con su tabla de medidas', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(`${BASE}/crear`, { waitUntil: 'networkidle' })
  const empezar = page.getByRole('button', { name: /Empezar a diseñar/ })
  if (await empezar.count()) await empezar.click()

  const talles = page.locator('label:has-text("Talle") + div button')
  // Arranca con una prenda de adulto
  await expect(talles.filter({ hasText: /^L$/ })).toHaveCount(1)

  await page.getByText('Remera infantil', { exact: true }).first().click()
  await expect(talles).toHaveText(['4', '6', '8', '10', '12', '14', '16'])
  await expect(talles.filter({ hasText: /^L$/ })).toHaveCount(0)

  await page.getByRole('button', { name: /Ver medidas/ }).click()
  const tabla = page.getByTestId('kids-size-table')
  await expect(tabla.getByText('50 cm')).toBeVisible()
  await expect(tabla.getByText('66 cm')).toBeVisible()
  await tabla.scrollIntoViewIfNeeded()
  await page.screenshot({ path: `${SHOTS}/1-infantil-talles-4-16.png` })

  // Volver a una prenda de adulto: vuelven S-XL y desaparece la tabla
  await page.getByText('Remera clásica', { exact: true }).first().click()
  await expect(talles.filter({ hasText: /^M$/ })).toHaveCount(1)
  await expect(page.getByTestId('kids-size-table')).toHaveCount(0)
})
