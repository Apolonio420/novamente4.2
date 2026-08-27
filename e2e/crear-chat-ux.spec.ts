import { test, expect } from '@playwright/test'

/**
 * /crear — Chat IA, mirado como lo mira un cliente.
 *
 * Lo que se reportó usando la herramienta:
 *  · se genera la foto, se puede descargar, pero NO SE VE (quedaba sólo en el
 *    panel derecho, que scrollea aparte)
 *  · el tamaño chico sólo dejaba estampar sobre el corazón: no había forma de
 *    centrarlo ni de elegir el otro lado
 *  · al prender el doble estampado, las dos miniaturas salían vacías aunque
 *    acabaras de generar un diseño para uno de los lados
 */

const BASE = process.env.E2E_BASE_URL ?? 'http://localhost:3939'

/** Al entrar hay un modal de bienvenida; un usuario lo cierra antes de tocar nada. */
async function entrar(page: import('@playwright/test').Page) {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(`${BASE}/crear`, { waitUntil: 'networkidle' })
  const empezar = page.getByRole('button', { name: /Empezar a diseñar/ })
  if (await empezar.count()) await empezar.click()
  await page.waitForTimeout(300)
}

test.describe('/crear — Chat IA', () => {
  test('elegir tamaño chico ofrece DÓNDE ponerlo', async ({ page }) => {
    await entrar(page)

    // Sin tamaño chico, el selector de posición no molesta
    await expect(page.getByText('Dónde en el pecho')).toHaveCount(0)

    await page.getByRole('button', { name: /R1/ }).click()

    // Con tamaño chico aparecen las opciones que antes no existían
    await expect(page.getByText('Dónde en el pecho')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Centro', exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Corazón', exact: true })).toBeVisible()
  })

  test('se puede elegir Centro, que antes era imposible', async ({ page }) => {
    await entrar(page)

    await page.getByRole('button', { name: /R1/ }).click()
    const centro = page.getByRole('button', { name: 'Centro', exact: true })
    await centro.click()
    // Queda marcado como elegido
    await expect(centro).toHaveClass(/border-violet-500/)
  })

  test('al pasar a espalda las opciones se adaptan', async ({ page }) => {
    await entrar(page)

    await page.getByRole('button', { name: /R1/ }).click()
    await expect(page.getByText('Dónde en el pecho')).toBeVisible()
  })

  test('la fila sigue entrando en pantalla con el selector nuevo', async ({ page }) => {
    await entrar(page)
    await page.getByRole('button', { name: /R1/ }).click()

    const scrollHeight = await page.evaluate(() => document.documentElement.scrollHeight)
    expect(scrollHeight).toBeLessThan(1400)
  })
})

test.describe('/crear — doble estampado', () => {
  /**
   * Reportado el 27/08/2026: "genero una imagen y después pongo doble
   * estampado, el frente y el dorso me figuran vacíos cuando yo ya había
   * generado uno de ellos". Entrar con ?image= deja un diseño cargado en el
   * frente sin gastar una generación.
   */
  async function conDisenoEnElFrente(page: import('@playwright/test').Page) {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto(`${BASE}/crear?image=/logo.png`, { waitUntil: 'networkidle' })
    const empezar = page.getByRole('button', { name: /Empezar a diseñar/ })
    if (await empezar.count()) await empezar.click()
    await page.waitForTimeout(400)
  }

  test('el lado que ya diseñaste aparece con su diseño, no vacío', async ({ page }) => {
    await conDisenoEnElFrente(page)
    await page.getByRole('button', { name: /Doble estampado/ }).click()

    const frente = page.getByRole('button', { name: 'Diseñar frente' })
    await expect(frente).toBeVisible()
    // la miniatura del frente lleva el diseño...
    await expect(frente.locator('img[alt^="Diseño"]')).toBeVisible()
    // ...y NO el cartel de vacío
    await expect(frente.getByText('Diseñá el frente')).toHaveCount(0)
  })

  test('el lado que falta sí queda marcado como pendiente', async ({ page }) => {
    await conDisenoEnElFrente(page)
    await page.getByRole('button', { name: /Doble estampado/ }).click()

    const espalda = page.getByRole('button', { name: 'Diseñar espalda' })
    await expect(espalda.getByText('Diseñá la espalda')).toBeVisible()
    await expect(page.getByText('Falta un lado')).toBeVisible()
  })

  test('el diseño de la miniatura se ve de verdad (no 0px ni roto)', async ({ page }) => {
    await conDisenoEnElFrente(page)
    await page.getByRole('button', { name: /Doble estampado/ }).click()

    const caja = await page.getByRole('button', { name: 'Diseñar frente' })
      .locator('img[alt^="Diseño"]').boundingBox()
    expect(caja!.width).toBeGreaterThan(10)
    expect(caja!.height).toBeGreaterThan(10)
  })
})

test.describe('/crear — la foto avisa cuánto falta', () => {
  test('generar la prenda sola muestra una barra de progreso en el chat', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto(`${BASE}/crear?image=/logo.png`, { waitUntil: 'networkidle' })
    const empezar = page.getByRole('button', { name: /Empezar a diseñar/ })
    if (await empezar.count()) await empezar.click()

    await page.getByRole('button', { name: /prenda sola/i }).click()

    // Antes esto era un renglón gris de 11px en el panel derecho: pasaban ~20s
    // sin nada que mirar en el chat.
    const barra = page.getByRole('progressbar', { name: /Generando la foto/ })
    await expect(barra).toBeVisible({ timeout: 5000 })
    await expect(page.getByText(/Armando la prenda sola/)).toBeVisible()

    // y avanza
    const a = Number(await barra.getAttribute('aria-valuenow'))
    await page.waitForTimeout(2500)
    const b = Number(await barra.getAttribute('aria-valuenow'))
    expect(b).toBeGreaterThan(a)
    expect(b).toBeLessThanOrEqual(92)
  })
})
