import { test, expect } from '@playwright/test'

// Cobertura consistente de PDP para los colores que quedaron sin cubrir en
// e2e/new-products-2026-06.spec.ts (Bambino solo testeaba blanco y celeste)
// tras la auditoría de garment-mappings que agregó las 12 entradas de
// Bambino/remera-infantil a lib/garment-mappings.json (Studio self-service).
// Correr con el server prod levantado: npx next start -p 3000

const BAMBINO_COLORS: Array<{ slug: string; label: string }> = [
  { slug: 'negro', label: 'Negro' },
  { slug: 'gris', label: 'Gris' },
  { slug: 'amarillo', label: 'Amarillo' },
  { slug: 'rosa', label: 'Rosa' },
]

test.describe('Cobertura Bambino (colores restantes) 2026-07', () => {
  for (const { slug, label } of BAMBINO_COLORS) {
    test(`PDP Bambino ${label} renderiza con precio $23.500`, async ({ page }) => {
      await page.goto(`/products/bambino-tshirt-${slug}`)
      await expect(page.getByText(`Bambino Remera Infantil - ${label}`).first()).toBeVisible()
      await expect(page.getByText('$23.500').first()).toBeVisible()
      await page.screenshot({ path: `e2e/screenshots/bambino-${slug}.png`, fullPage: false })
    })
  }
})

test.describe('Bahía Totebag + Bambino + b2b-precios-2026 (consistencia)', () => {
  test('b2b-precios-2026 muestra Bahía y Bambino juntos', async ({ page }) => {
    await page.goto('/b2b-precios-2026')
    await expect(page.getByText('Bahía').first()).toBeVisible()
    await expect(page.getByText('Bambino').first()).toBeVisible()
    await page.screenshot({ path: 'e2e/screenshots/b2b-precios-bahia-bambino.png', fullPage: true })
  })
})
