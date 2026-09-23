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

// Refleja lo que hoy devuelve el endpoint REAL (verificado corriendo
// hasMockupBase contra las 9 prendas de CATALOG_PRODUCTS) — las 9 prendas,
// sus colores reales, y las URLs estáticas reales de public/garments/std/
// (sirven de verdad contra `next dev`/`next start`, no son inventadas). Los
// 3 huecos reales (sin base ESTÁNDAR, resuelven por garment-mappings.json)
// quedan con static*Url: null a propósito, para ejercitar el fallback de
// red del panel.
function stdUrl(garmentKey: string, color: string, side: 'front' | 'back'): string {
  return `/garments/std/${garmentKey}-${color}-${side}.jpg`
}

export const GARMENT_OPTIONS = {
  garments: [
    {
      key: 'aldea-classic-tshirt',
      name: 'Remera Aldea Classic Fit',
      category: 'Remera Classic',
      thumbnail: stdUrl('aldea-classic-tshirt', 'black', 'front'),
      colors: [
        { key: 'black', name: 'Negro', hex: '#1a1a1a', front: true, back: true, frontStaticUrl: stdUrl('aldea-classic-tshirt', 'black', 'front'), backStaticUrl: stdUrl('aldea-classic-tshirt', 'black', 'back') },
        { key: 'white', name: 'Blanco', hex: '#f5f5f5', front: true, back: true, frontStaticUrl: stdUrl('aldea-classic-tshirt', 'white', 'front'), backStaticUrl: stdUrl('aldea-classic-tshirt', 'white', 'back') },
      ],
    },
    {
      key: 'aura-oversize-tshirt',
      name: 'Remera Aura Oversize',
      category: 'Remera Oversize',
      thumbnail: stdUrl('aura-oversize-tshirt', 'black', 'front'),
      colors: [
        { key: 'black', name: 'Negro', hex: '#1a1a1a', front: true, back: true, frontStaticUrl: stdUrl('aura-oversize-tshirt', 'black', 'front'), backStaticUrl: stdUrl('aura-oversize-tshirt', 'black', 'back') },
        { key: 'white', name: 'Blanco', hex: '#f5f5f5', front: true, back: true, frontStaticUrl: stdUrl('aura-oversize-tshirt', 'white', 'front'), backStaticUrl: stdUrl('aura-oversize-tshirt', 'white', 'back') },
        { key: 'stone-wash', name: 'Stone Wash', hex: '#9a9085', front: true, back: true, frontStaticUrl: stdUrl('aura-oversize-tshirt', 'stone-wash', 'front'), backStaticUrl: stdUrl('aura-oversize-tshirt', 'stone-wash', 'back') },
      ],
    },
    {
      key: 'remera-clasica-mujer',
      name: 'Remera Clasica Mujer',
      category: 'Remera Mujer',
      thumbnail: stdUrl('remera-clasica-mujer', 'black', 'front'),
      colors: [
        { key: 'black', name: 'Negra', hex: '#1a1a1a', front: true, back: true, frontStaticUrl: stdUrl('remera-clasica-mujer', 'black', 'front'), backStaticUrl: stdUrl('remera-clasica-mujer', 'black', 'back') },
        { key: 'white', name: 'Blanca', hex: '#f5f5f5', front: true, back: true, frontStaticUrl: stdUrl('remera-clasica-mujer', 'white', 'front'), backStaticUrl: stdUrl('remera-clasica-mujer', 'white', 'back') },
      ],
    },
    {
      key: 'remera-crop-mujer',
      name: 'Remera Crop Mujer',
      category: 'Remera Mujer',
      thumbnail: stdUrl('remera-crop-mujer', 'black', 'front'),
      colors: [
        { key: 'black', name: 'Negra', hex: '#1a1a1a', front: true, back: true, frontStaticUrl: stdUrl('remera-crop-mujer', 'black', 'front'), backStaticUrl: stdUrl('remera-crop-mujer', 'black', 'back') },
        { key: 'chocolate', name: 'Chocolate', hex: '#4a3226', front: true, back: true, frontStaticUrl: stdUrl('remera-crop-mujer', 'chocolate', 'front'), backStaticUrl: stdUrl('remera-crop-mujer', 'chocolate', 'back') },
        { key: 'gray', name: 'Gris Melange', hex: '#9aa0a6', front: true, back: true, frontStaticUrl: stdUrl('remera-crop-mujer', 'gray', 'front'), backStaticUrl: stdUrl('remera-crop-mujer', 'gray', 'back') },
        // sin base estándar de FRENTE (resuelve por garment-mappings.json) — a propósito.
        { key: 'yellow', name: 'Amarillo', hex: '#f3d34a', front: true, back: true, frontStaticUrl: null, backStaticUrl: stdUrl('remera-crop-mujer', 'yellow', 'back') },
      ],
    },
    {
      key: 'musculosa-bali',
      name: 'Musculosa Bali',
      category: 'Musculosa',
      thumbnail: stdUrl('musculosa-bali', 'gray', 'front'),
      colors: [
        // sin base estándar de FRENTE (resuelve por garment-mappings.json) — a propósito.
        { key: 'white', name: 'Blanca', hex: '#f5f5f5', front: true, back: true, frontStaticUrl: null, backStaticUrl: stdUrl('musculosa-bali', 'white', 'back') },
        { key: 'gray', name: 'Gris', hex: '#9aa0a6', front: true, back: true, frontStaticUrl: stdUrl('musculosa-bali', 'gray', 'front'), backStaticUrl: stdUrl('musculosa-bali', 'gray', 'back') },
      ],
    },
    {
      key: 'buzo-cuello-redondo',
      name: 'Buzo Cuello Redondo',
      category: 'Buzo',
      thumbnail: stdUrl('buzo-cuello-redondo', 'black', 'front'),
      colors: [
        { key: 'black', name: 'Negro', hex: '#1a1a1a', front: true, back: true, frontStaticUrl: stdUrl('buzo-cuello-redondo', 'black', 'front'), backStaticUrl: stdUrl('buzo-cuello-redondo', 'black', 'back') },
        { key: 'white', name: 'Blanco', hex: '#f5f5f5', front: true, back: true, frontStaticUrl: stdUrl('buzo-cuello-redondo', 'white', 'front'), backStaticUrl: stdUrl('buzo-cuello-redondo', 'white', 'back') },
        { key: 'stone-wash', name: 'Stone Wash', hex: '#9a9085', front: true, back: true, frontStaticUrl: stdUrl('buzo-cuello-redondo', 'stone-wash', 'front'), backStaticUrl: stdUrl('buzo-cuello-redondo', 'stone-wash', 'back') },
      ],
    },
    {
      key: 'buzo-hoodie-unisex',
      name: 'Buzo Hoodie Oversize',
      category: 'Buzo Hoodie Oversize',
      thumbnail: stdUrl('buzo-hoodie-unisex', 'black', 'front'),
      colors: [
        { key: 'black', name: 'Negro', hex: '#1a1a1a', front: true, back: true, frontStaticUrl: stdUrl('buzo-hoodie-unisex', 'black', 'front'), backStaticUrl: stdUrl('buzo-hoodie-unisex', 'black', 'back') },
        // sin base estándar de DORSO (resuelve por garment-mappings.json) — a propósito.
        { key: 'white', name: 'Blanco', hex: '#f5f5f5', front: true, back: true, frontStaticUrl: stdUrl('buzo-hoodie-unisex', 'white', 'front'), backStaticUrl: null },
        { key: 'stone-wash', name: 'Stone Wash', hex: '#9a9085', front: true, back: true, frontStaticUrl: stdUrl('buzo-hoodie-unisex', 'stone-wash', 'front'), backStaticUrl: stdUrl('buzo-hoodie-unisex', 'stone-wash', 'back') },
      ],
    },
    {
      key: 'remera-infantil',
      name: 'Bambino Remera Infantil',
      category: 'Remera Infantil',
      thumbnail: stdUrl('remera-infantil', 'white', 'front'),
      colors: [
        { key: 'white', name: 'Blanco', hex: '#f5f5f5', front: true, back: true, frontStaticUrl: stdUrl('remera-infantil', 'white', 'front'), backStaticUrl: stdUrl('remera-infantil', 'white', 'back') },
        { key: 'black', name: 'Negro', hex: '#1a1a1a', front: true, back: true, frontStaticUrl: stdUrl('remera-infantil', 'black', 'front'), backStaticUrl: stdUrl('remera-infantil', 'black', 'back') },
        { key: 'gray', name: 'Gris', hex: '#9a9a9a', front: true, back: true, frontStaticUrl: stdUrl('remera-infantil', 'gray', 'front'), backStaticUrl: stdUrl('remera-infantil', 'gray', 'back') },
        { key: 'yellow', name: 'Amarillo', hex: '#f3d34a', front: true, back: true, frontStaticUrl: stdUrl('remera-infantil', 'yellow', 'front'), backStaticUrl: stdUrl('remera-infantil', 'yellow', 'back') },
        { key: 'celeste', name: 'Celeste', hex: '#a9d3e5', front: true, back: true, frontStaticUrl: stdUrl('remera-infantil', 'celeste', 'front'), backStaticUrl: stdUrl('remera-infantil', 'celeste', 'back') },
        { key: 'rosa', name: 'Rosa', hex: '#f0b8c8', front: true, back: true, frontStaticUrl: stdUrl('remera-infantil', 'rosa', 'front'), backStaticUrl: stdUrl('remera-infantil', 'rosa', 'back') },
      ],
    },
    {
      key: 'totebag',
      name: 'Bahía Totebag',
      category: 'Accesorio',
      thumbnail: stdUrl('totebag', 'crudo', 'front'),
      colors: [
        { key: 'crudo', name: 'Crudo', hex: '#e8dfc9', front: true, back: true, frontStaticUrl: stdUrl('totebag', 'crudo', 'front'), backStaticUrl: stdUrl('totebag', 'crudo', 'back') },
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

    // Nombre y precio — sin diseño cargado (este test no sube ninguno) el
    // campo queda vacío a propósito (solo el placeholder guía), no se
    // completa con el nombre de la prenda solo.
    const nameInput = page.locator('#np-name')
    await expect(nameInput).toHaveValue('')
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

  test('subir un diseño sugiere el nombre a partir del archivo + la prenda', async ({ page }) => {
    await page.route('**/api/partners/products/garment-options', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(GARMENT_OPTIONS) }),
    )
    await page.route('**/api/partners/design/upload', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          url: 'https://pub-test.r2.dev/design.png',
          assetId: 'asset_1',
          storageKey: 'partners/test/uploads/design.png',
          width: 2000,
          height: 2000,
          hasAlpha: true,
          bgRemovable: true,
          warnings: [],
        }),
      }),
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

    await page.setInputFiles('#np-dropzone-front', {
      name: 'mi_logo-banda_FINAL.png',
      mimeType: 'image/png',
      buffer: Buffer.from([0x89, 0x50, 0x4e, 0x47]),
    })

    await expect(page.locator('#np-name')).toHaveValue('Mi Logo Banda FINAL · Aldea')
  })
})
