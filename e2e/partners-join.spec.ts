import { test, expect } from '@playwright/test'

test.describe('Partners Onboarding Wizard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/partners/join')
  })

  test('renders datos basicos step first with form fields', async ({ page }) => {
    await expect(page.getByText('Datos basicos')).toBeVisible()
    await expect(page.getByText(/nombre comercial/i)).toBeVisible()
    await expect(page.locator('body')).not.toContainText('Application error')
  })

  test('shows step 1 of 4 indicator', async ({ page }) => {
    await expect(page.getByText('Paso 1 de 4')).toBeVisible()
  })

  test('has Siguiente button', async ({ page }) => {
    const btn = page.locator('button').filter({ hasText: 'Siguiente' }).first()
    await expect(btn).toBeVisible()
  })

  test('page loads without errors', async ({ page }) => {
    await expect(page.locator('body')).not.toContainText('Application error')
  })

  test('has legal links at bottom', async ({ page }) => {
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    await expect(page.getByRole('link', { name: /terminos y condiciones/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /politica de privacidad/i })).toBeVisible()
  })
})
