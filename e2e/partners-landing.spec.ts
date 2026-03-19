import { test, expect } from '@playwright/test'

test.describe('Partners Landing Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/partners')
  })

  test('renders hero section with CTA buttons', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('merch premium')
    await expect(page.getByRole('link', { name: /empezar gratis/i }).first()).toBeVisible()
    await expect(page.getByRole('link', { name: /hablar con un asesor/i }).first()).toBeVisible()
  })

  test('renders all 6 feature cards', async ({ page }) => {
    const features = [
      'Tu storefront lista',
      'Design Engine con IA',
      'SEO & Discovery',
      'Chatbot de ventas',
      'Analytics y leads',
      'Cero stock, cero riesgo',
    ]
    for (const f of features) {
      await expect(page.getByText(f)).toBeVisible()
    }
  })

  test('renders 3 pricing tiers', async ({ page }) => {
    await expect(page.getByText('Starter').first()).toBeVisible()
    await expect(page.getByText('Growth').first()).toBeVisible()
    await expect(page.getByText('Pro').first()).toBeVisible()
    await expect(page.getByText('Gratis').first()).toBeVisible()
  })

  test('shows annual pricing discount note', async ({ page }) => {
    await expect(page.getByText(/Plan anual: -15%/)).toHaveCount(2) // Growth + Pro
  })

  test('renders how it works steps', async ({ page }) => {
    const steps = ['Registrate', 'Configurá', 'Publicá', 'Vendé']
    for (const s of steps) {
      await expect(page.getByText(s).first()).toBeVisible()
    }
  })

  test('has links to legal pages', async ({ page }) => {
    await expect(page.getByRole('link', { name: /terminos y condiciones/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /politica de privacidad/i })).toBeVisible()
  })

  test('has FAQ schema in JSON-LD', async ({ page }) => {
    const scripts = await page.locator('script[type="application/ld+json"]').allTextContents()
    const haseFaq = scripts.some((s) => s.includes('FAQPage'))
    expect(haseFaq).toBe(true)
  })

  test('has breadcrumb schema in JSON-LD', async ({ page }) => {
    const scripts = await page.locator('script[type="application/ld+json"]').allTextContents()
    const hasBreadcrumb = scripts.some((s) => s.includes('BreadcrumbList'))
    expect(hasBreadcrumb).toBe(true)
  })
})
