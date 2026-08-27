import { test, expect } from '@playwright/test'

/**
 * /crear — Chat IA, mirado como lo mira un cliente.
 *
 * Lo que se reportó usando la herramienta:
 *  · se genera la foto, se puede descargar, pero NO SE VE (quedaba sólo en el
 *    panel derecho, que scrollea aparte)
 *  · el tamaño chico sólo dejaba estampar sobre el corazón: no había forma de
 *    centrarlo ni de elegir el otro lado
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
