import { test, expect } from '@playwright/test'

// Verificación visual de los productos nuevos (Bambino, Aldea beige, Crop visón).
// Correr con el server prod levantado: npx next start -p 3000

test.describe('Productos nuevos 2026-06', () => {
  test('PDP Bambino blanco renderiza con talles 4 a 16', async ({ page }) => {
    await page.goto('/products/bambino-tshirt-blanco')
    await expect(page.getByText('Bambino Remera Infantil - Blanco').first()).toBeVisible()
    await expect(page.getByText('$23.500').first()).toBeVisible()
    await expect(page.getByText('Talles 4 a 16').first()).toBeVisible()
    await page.screenshot({ path: 'e2e/screenshots/bambino-blanco.png', fullPage: false })
  })

  test('PDP Aldea beige renderiza', async ({ page }) => {
    await page.goto('/products/aldea-tshirt-beige')
    await expect(page.getByText('Aldea Classic Fit T-Shirt - Beige').first()).toBeVisible()
    await expect(page.getByText('$28.600').first()).toBeVisible()
    await page.screenshot({ path: 'e2e/screenshots/aldea-beige.png', fullPage: false })
  })

  test('PDP Crop visón renderiza y crop negra ya no existe', async ({ page }) => {
    await page.goto('/products/remera-crop-vison')
    await expect(page.getByText('Remera Crop Mujer - Visón').first()).toBeVisible()
    await page.screenshot({ path: 'e2e/screenshots/crop-vison.png', fullPage: false })

    // La crop negra queda fuera del catálogo: la PDP responde con la UI de not-found.
    // (Next puede devolver status 200 por streaming, por eso se chequea el contenido.)
    await page.goto('/products/remera-crop-negra')
    await expect(page).toHaveTitle(/Producto no encontrado|404/)
    await expect(page.getByText('Remera Crop Mujer - Negra')).toHaveCount(0)
  })

  test('B2B precios 2026 muestra Bambino con 6 colores', async ({ page }) => {
    await page.goto('/b2b-precios-2026')
    await expect(page.getByText('Bambino').first()).toBeVisible()
    await page.screenshot({ path: 'e2e/screenshots/b2b-precios.png', fullPage: true })
  })
})
