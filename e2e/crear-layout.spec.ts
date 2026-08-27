import { test, expect } from '@playwright/test'

/**
 * /crear: los controles tienen que ENTRAR EN PANTALLA.
 *
 * La fila no tenía tope de alto, así que la columna derecha (preview, catálogo,
 * doble estampa, tamaño, talle, CTA, historial) estiraba todo, el
 * `overflow-y-auto` del chat nunca se activaba y había que scrollear la página
 * entera para llegar a los botones. Medido antes del arreglo en 1440x900:
 * scrollHeight 1668 y el botón de mockup a 1583px de arriba.
 */

const BASE = process.env.E2E_BASE_URL ?? 'http://localhost:3939'

test.describe('/crear — layout', () => {
  test('en desktop la página no se estira: los controles entran sin scrollear', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto(`${BASE}/crear`, { waitUntil: 'networkidle' })

    const scrollHeight = await page.evaluate(() => document.documentElement.scrollHeight)
    // Antes del arreglo daba ~1668 en esta misma viewport.
    expect(scrollHeight).toBeLessThan(1400)
  })

  test('el chat scrollea adentro, no empuja la página', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto(`${BASE}/crear`, { waitUntil: 'networkidle' })

    // La fila principal queda acotada a la ventana
    const fila = page.locator('div.lg\\:h-\\[calc\\(100vh-11rem\\)\\]').first()
    await expect(fila).toBeVisible()
    const caja = await fila.boundingBox()
    expect(caja!.height).toBeLessThanOrEqual(900)
  })

  test('los controles se alcanzan scrolleando el panel, no la página entera', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto(`${BASE}/crear`, { waitUntil: 'networkidle' })

    const medidas = await page.evaluate(() => {
      const col = document.querySelector('div.lg\\:overflow-y-auto') as HTMLElement | null
      return { alto: col?.clientHeight ?? 0, contenido: col?.scrollHeight ?? 0 }
    })

    // El panel scrollea adentro (tiene más contenido que alto)...
    expect(medidas.contenido).toBeGreaterThan(medidas.alto)
    // ...pero poco: antes había que recorrer 1668px de PÁGINA para lo mismo.
    expect(medidas.contenido - medidas.alto).toBeLessThan(500)
  })

  test('no quedó ningún comentario de código renderizado como texto', async ({ page }) => {
    await page.goto(`${BASE}/crear`, { waitUntil: 'networkidle' })
    const texto = await page.locator('body').innerText()
    expect(texto).not.toContain('overflow-y-auto')
    expect(texto).not.toContain('header sticky')
  })
})
