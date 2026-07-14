import { test, expect } from '@playwright/test'

test.describe('Empresas landing page', () => {
  test('shows the corporate pitch, visual catalog and contact path', async ({ page }) => {
    await page.goto('/empresas')

    await expect(page).toHaveTitle(/Merch para Empresas y Equipos/)
    await expect(page.getByRole('heading', { name: 'Merch que tu equipo quiere usar.' })).toBeVisible()
    await expect(page.getByRole('link', { name: /pedir propuesta por whatsapp/i })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Nueve modelos. Un estándar de calidad.' })).toBeVisible()
    await expect(page.locator('#catalogo img')).toHaveCount(9)
    await expect(page.getByRole('link', { name: 'EMPRESAS' }).first()).toHaveAttribute('href', '/empresas')

    await page.screenshot({ path: 'test-results/empresas-page.png', fullPage: true })
  })

  test('is included in the public sitemap', async ({ request }) => {
    const response = await request.get('/sitemap.xml')
    expect(response.ok()).toBe(true)
    expect(await response.text()).toContain('https://www.novamente.ar/empresas')
  })
})
