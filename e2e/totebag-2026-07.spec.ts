import { test, expect } from '@playwright/test'

// Verificación visual del producto nuevo Bahía Totebag (talle único, sin tabla de talles).
// Correr con el server prod levantado: npx next start -p 3000

test.describe('Producto nuevo Bahía Totebag 2026-07', () => {
  test('PDP Bahía Totebag crudo renderiza con precio $20.900 y sin tabla de talles', async ({ page }) => {
    await page.goto('/products/bahia-totebag-crudo')
    await expect(page.getByText('Bahía Totebag - Crudo').first()).toBeVisible()
    await expect(page.getByText('$20.900').first()).toBeVisible()
    await expect(page.getByText('Tamaño único').first()).toBeVisible()
    await expect(page.getByText('Guia de Talles')).toHaveCount(0)
    await page.screenshot({ path: 'e2e/screenshots/bahia-totebag-crudo.png', fullPage: false })
  })

  test('B2B precios 2026 muestra el modelo Bahía', async ({ page }) => {
    await page.goto('/b2b-precios-2026')
    await expect(page.getByText('Bahía').first()).toBeVisible()
    await page.screenshot({ path: 'e2e/screenshots/b2b-precios-bahia.png', fullPage: true })
  })
})
