/**
 * E2E del panel "Nuevo producto" (Fase 3 pieza C) — recorre el flujo con
 * TODOS los endpoints mockeados (`page.route`), contra la ruta SOLO DEV
 * `/dev/new-product-preview` (el panel real vive en /workspace/catalog, que
 * exige login de partner; ver `app/dev/new-product-preview/page.tsx`).
 *
 * Verifica: elegir prenda + color, ver la vista previa (mockeada),
 * completar nombre/precio, y que "Publicar" mande el payload correcto a
 * `POST /api/partners/products/from-design`.
 */
import { test, expect } from '@playwright/test'

const PREVIEW_URL = process.env.NEW_PRODUCT_PREVIEW_URL ?? 'http://localhost:3000/dev/new-product-preview'

const GARMENT_OPTIONS = {
  garments: [
    {
      key: 'aldea-classic-tshirt',
      name: 'Remera Aldea Classic Fit',
      category: 'Remera Classic',
      colors: [
        { key: 'black', name: 'Negro', hex: '#1a1a1a', front: true, back: true },
        { key: 'white', name: 'Blanco', hex: '#f5f5f5', front: true, back: true },
      ],
    },
  ],
}

test.describe('Panel Nuevo producto (mockeado)', () => {
  test('elegir prenda/color y publicar manda el payload correcto a from-design', async ({ page }) => {
    let fromDesignBody: any = null

    await page.route('**/api/partners/products/garment-options', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(GARMENT_OPTIONS) }),
    )
    await page.route('**/api/partners/products/mockup-preview', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ previewUrl: 'data:image/jpeg;base64,AAAA' }),
      }),
    )
    await page.route('**/api/partners/products/from-design', async (route) => {
      fromDesignBody = route.request().postDataJSON()
      route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          product: { id: 'prod_test_1', name: fromDesignBody.name, status: fromDesignBody.status },
        }),
      })
    })

    const response = await page.goto(PREVIEW_URL, { waitUntil: 'domcontentloaded' })
    test.skip(
      !response || response.status() >= 400,
      `No se pudo cargar ${PREVIEW_URL} (status ${response?.status()}) — build sin la ruta dev disponible en este entorno`,
    )

    // Bloque 2 — elegir prenda
    await expect(page.getByRole('heading', { name: '2. Prenda y colores' })).toBeVisible()
    await page.getByRole('button', { name: /Aldea/ }).click()

    // Elegir color (chip)
    await page.getByRole('button', { name: 'Negro' }).click()

    // La vista previa mockeada debe aparecer para frente y dorso
    await expect(page.locator('[data-testid="new-product-preview"] img')).toHaveCount(2, { timeout: 10_000 })

    // Nombre y precio
    const nameInput = page.locator('#np-name')
    await expect(nameInput).not.toHaveValue('')
    await nameInput.fill('Buho negro')

    const priceInput = page.locator('#np-price')
    await priceInput.fill('32000')

    // Publicar
    await page.getByRole('button', { name: 'Publicar' }).click()

    await expect.poll(() => fromDesignBody).not.toBeNull()
    expect(fromDesignBody.name).toBe('Buho negro')
    expect(fromDesignBody.price).toBe(32000)
    expect(fromDesignBody.garmentKey).toBe('aldea-classic-tshirt')
    expect(fromDesignBody.colors).toEqual(['black'])
    expect(fromDesignBody.status).toBe('published')

    // Se ve la confirmación (dev preview cierra el panel y muestra el producto creado)
    await expect(page.locator('[data-testid="dev-last-created"]')).toContainText('prod_test_1')
  })

  test('el precio por debajo del mínimo bloquea el submit con un mensaje claro', async ({ page }) => {
    await page.route('**/api/partners/products/garment-options', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(GARMENT_OPTIONS) }),
    )
    await page.route('**/api/partners/products/mockup-preview', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ previewUrl: 'data:image/jpeg;base64,AAAA' }),
      }),
    )

    const response = await page.goto(PREVIEW_URL, { waitUntil: 'domcontentloaded' })
    test.skip(!response || response.status() >= 400, `No se pudo cargar ${PREVIEW_URL}`)

    await page.getByRole('button', { name: /Aldea/ }).click()
    await page.getByRole('button', { name: 'Negro' }).click()
    await page.locator('#np-price').fill('500')

    const publishBtn = page.getByRole('button', { name: 'Publicar' })
    await expect(publishBtn).toBeDisabled()
    await expect(page.getByText(/precio mínimo/i)).toBeVisible()
  })
})
