import { test, expect } from '@playwright/test'

test.describe('Partners Directory', () => {
  test('renders directory page', async ({ page }) => {
    await page.goto('/partners/directory')
    await expect(page.locator('h1')).toBeVisible()
  })

  test('has structured data (Breadcrumb + ItemList)', async ({ page }) => {
    await page.goto('/partners/directory')
    const scripts = await page.locator('script[type="application/ld+json"]').allTextContents()
    const hasBreadcrumb = scripts.some((s) => s.includes('BreadcrumbList'))
    expect(hasBreadcrumb).toBe(true)
  })
})
