import { test, expect } from '@playwright/test'

// Migración CTAs /design → /crear (ver next.config.mjs redirects + links repointados).
// /crear es el estudio nuevo; /design exacto redirige; /design/[imageId] (permalinks
// de diseños compartidos) sigue vivo.

test.describe('Migración /design → /crear', () => {
  test('/design redirige 308 a /crear', async ({ request }) => {
    const res = await request.get('/design', { maxRedirects: 0 })
    expect(res.status()).toBe(308)
    expect(res.headers()['location']).toBe('/crear')
  })

  test('/design preserva el querystring al redirigir', async ({ request }) => {
    const res = await request.get('/design?style=anime', { maxRedirects: 0 })
    expect(res.status()).toBe(308)
    expect(res.headers()['location']).toBe('/crear?style=anime')
  })

  test('/design/[imageId] NO redirige (permalink sigue vivo)', async ({ request }) => {
    const res = await request.get('/design/some-image-id', { maxRedirects: 0 })
    expect(res.status()).not.toBe(308)
    expect(res.status()).toBeLessThan(300)
  })

  test('/crear responde 200', async ({ request }) => {
    const res = await request.get('/crear', { maxRedirects: 0 })
    expect(res.status()).toBe(200)
  })

  test('navegar a /design aterriza en /crear', async ({ page }) => {
    await page.goto('/design')
    await expect(page).toHaveURL(/\/crear$/)
  })

  test('una landing apunta sus CTAs a /crear y no a /design', async ({ page }) => {
    await page.goto('/hoodie-personalizado')
    await expect(page.locator('a[href="/crear"]').first()).toBeVisible()
    await expect(page.locator('a[href="/design"]')).toHaveCount(0)
  })
})
