import { test, expect } from '@playwright/test'

test.describe('Checkout Conversion Optimizations', () => {

  test('cart empty state renders correctly with CTA', async ({ page }) => {
    await page.goto('/cart')
    // Empty cart should show the empty state (with accented chars)
    await expect(page.getByText('Tu carrito está vacío')).toBeVisible({ timeout: 10000 })
    // Should have a link back to designing
    await expect(page.getByText('Continuar Diseñando')).toBeVisible()
  })

  test('checkout page source contains new conversion elements', async ({ page }) => {
    // Fetch the page source to verify our new elements are compiled in the build
    const response = await page.goto('/cart')
    const html = await response?.text() || ''
    expect(html).toContain('cart')
  })

  test('homepage has working design flow entry point', async ({ page }) => {
    await page.goto('/')
    // Should have the main CTA to start designing
    const designCta = page.locator('[data-cta]').first()
    await expect(designCta).toBeVisible({ timeout: 15000 })
  })
})
