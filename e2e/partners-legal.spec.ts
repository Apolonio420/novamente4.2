import { test, expect } from '@playwright/test'

test.describe('Legal Pages', () => {
  test.describe('Terms of Service', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/partners/terms')
    })

    test('renders page title', async ({ page }) => {
      await expect(page.locator('h1')).toContainText('Terminos y Condiciones')
    })

    test('has 10 sections', async ({ page }) => {
      for (let i = 1; i <= 10; i++) {
        await expect(page.getByText(new RegExp(`^${i}\\.`))).toBeVisible()
      }
    })

    test('mentions plan details (Starter, Growth, Pro)', async ({ page }) => {
      await expect(page.getByText('Starter').first()).toBeVisible()
      await expect(page.getByText('Growth').first()).toBeVisible()
      await expect(page.getByText('Pro').first()).toBeVisible()
    })

    test('mentions 15% annual discount', async ({ page }) => {
      await expect(page.getByText(/15% de descuento/)).toBeVisible()
    })

    test('has back link to partners', async ({ page }) => {
      await expect(page.getByRole('link', { name: /volver a partners/i })).toBeVisible()
    })

    test('has link to privacy page', async ({ page }) => {
      await expect(page.getByRole('link', { name: /politica de privacidad/i })).toBeVisible()
    })

    test('has contact email', async ({ page }) => {
      await expect(page.getByRole('link', { name: /contact@novamente.ar/ }).first()).toBeVisible()
    })
  })

  test.describe('Privacy Policy', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/partners/privacy')
    })

    test('renders page title', async ({ page }) => {
      await expect(page.locator('h1')).toContainText('Politica de Privacidad')
    })

    test('has 10 sections', async ({ page }) => {
      for (let i = 1; i <= 10; i++) {
        await expect(page.getByText(new RegExp(`^${i}\\.`))).toBeVisible()
      }
    })

    test('mentions data providers (MercadoPago, Cloudflare, Supabase, Google)', async ({ page }) => {
      await expect(page.getByText('MercadoPago:').first()).toBeVisible()
      await expect(page.getByText('Cloudflare:').first()).toBeVisible()
      await expect(page.getByText('Supabase:').first()).toBeVisible()
      await expect(page.getByText('Google:').first()).toBeVisible()
    })

    test('has back link to partners', async ({ page }) => {
      await expect(page.getByRole('link', { name: /volver a partners/i })).toBeVisible()
    })

    test('has link to terms page', async ({ page }) => {
      await expect(page.getByRole('link', { name: /terminos y condiciones/i })).toBeVisible()
    })
  })
})
