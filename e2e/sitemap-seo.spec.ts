import { test, expect } from '@playwright/test'

test.describe('SEO Infrastructure', () => {
  test('sitemap.xml is accessible', async ({ request }) => {
    const res = await request.get('/sitemap.xml')
    expect(res.ok()).toBe(true)
    const text = await res.text()
    expect(text).toContain('<?xml')
    expect(text).toContain('urlset')
  })

  test('robots.txt is accessible', async ({ request }) => {
    const res = await request.get('/robots.txt')
    expect(res.ok()).toBe(true)
    const text = await res.text()
    expect(text.toLowerCase()).toContain('sitemap')
  })

  test('llms.txt is accessible', async ({ request }) => {
    const res = await request.get('/llms.txt')
    // May redirect or serve directly
    expect(res.status()).toBeLessThan(500)
  })

  test('partners page has correct meta tags', async ({ page }) => {
    await page.goto('/partners')
    const title = await page.title()
    expect(title).toContain('Partners')

    const description = await page.locator('meta[name="description"]').getAttribute('content')
    expect(description).toBeTruthy()
    expect(description).toContain('Storefront')

    const canonical = await page.locator('link[rel="canonical"]').getAttribute('href')
    expect(canonical).toContain('/partners')
  })

  test('terms page has correct meta tags', async ({ page }) => {
    await page.goto('/partners/terms')
    const title = await page.title()
    expect(title).toContain('Terminos')
  })

  test('privacy page has correct meta tags', async ({ page }) => {
    await page.goto('/partners/privacy')
    const title = await page.title()
    expect(title).toContain('Privacidad')
  })
})
