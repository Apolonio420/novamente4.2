import { test, expect, type Page, type Route } from '@playwright/test'
import { readFileSync } from 'node:fs'
import path from 'node:path'

/**
 * /crear — ediciones que salen iguales + caritas de feedback (Juan 05/11/2026).
 *
 * Lo que contó el usuario: "le dije haceme el delfín un poco más chico… y me
 * mandó exactamente la misma imagen". Ahora el server reintenta y, si sigue
 * igual, responde `unchanged: true`: el chat lo avisa, NO lo muestra como
 * versión nueva y ofrece generar de cero.
 *
 * Las rutas de IA se mockean (cero gasto de Gemini). Las imágenes son las
 * fixtures reales del caso, achicadas.
 */

const BASE = process.env.E2E_BASE_URL ?? 'http://localhost:3939'
const SHOTS = path.join(__dirname, '..', 'test-results', 'crear-edicion-feedback')
const FIX = path.join(__dirname, '..', '__tests__', 'crear', 'fixtures', 'edit-change')
const IMG_GEN = 'https://pub-e2e.r2.dev/v1/raw-designs/delfin.png'
const IMG_EDIT = 'https://pub-e2e.r2.dev/v1/edited-designs/rayo.png'

async function setup(page: Page, opts: { editUnchanged: boolean }) {
  const feedback: any[] = []
  const generate: any[] = []
  await page.addInitScript(() => window.localStorage.setItem('novamente:crear-gen-email-done', '1'))
  await page.route('https://pub-e2e.r2.dev/**', (route: Route) => {
    const name = route.request().url().includes('rayo') ? 'rayo-out' : 'delfin-in'
    return route.fulfill({ contentType: 'image/png', body: readFileSync(path.join(FIX, `${name}.png`)) })
  })
  await page.route('**/api/generate-image', async (route) => {
    generate.push(route.request().postDataJSON())
    await route.fulfill({ json: { success: true, images: [{ url: IMG_GEN }] } })
  })
  await page.route('**/api/public/design/edit', (route) =>
    route.fulfill({
      json: opts.editUnchanged
        ? { success: false, unchanged: true, attempts: 2, changePct: 0.86, error: 'No logré aplicar ese cambio' }
        : { success: true, images: [{ url: IMG_EDIT }], attempts: 1, changePct: 12.3 },
    }),
  )
  await page.route('**/api/public/design/feedback', async (route) => {
    feedback.push(route.request().postDataJSON())
    await route.fulfill({ json: { saved: true } })
  })
  // El mockup automático no es parte de esta prueba.
  await page.route('**/api/public/design/mockup-lifestyle', (route) => route.fulfill({ status: 500, json: {} }))

  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(`${BASE}/crear`, { waitUntil: 'networkidle' })
  const empezar = page.getByRole('button', { name: /Empezar a diseñar/ })
  if (await empezar.count()) await empezar.click()
  return { feedback, generate }
}

async function send(page: Page, text: string) {
  const box = page.locator('textarea').last()
  await box.fill(text)
  await box.press('Enter')
}

const CONCEPT = 'una playa con un delfín saltando y una combi volkswagen tipo scooby doo'
const EDIT = 'haceme el delfín un poco más chico, que todo tenga proporciones más reales'

test('cada imagen generada trae 3 caritas y el voto se guarda con prompt, operación e imagen', async ({ page }) => {
  const { feedback } = await setup(page, { editUnchanged: false })
  await send(page, CONCEPT)
  const caritas = page.getByTestId('image-feedback')
  await expect(caritas).toHaveCount(1)
  await expect(caritas.getByRole('button', { name: 'No me gustó' })).toBeVisible()
  await expect(caritas.getByRole('button', { name: 'Más o menos' })).toBeVisible()
  await expect(caritas.getByRole('button', { name: 'Me gustó', exact: true })).toBeVisible()
  await page.screenshot({ path: `${SHOTS}/1-caritas-generar.png` })

  await caritas.getByRole('button', { name: 'Me gustó', exact: true }).click()
  await expect(caritas.getByText('¡Gracias!')).toBeVisible()
  await expect.poll(() => feedback.length).toBe(1)
  expect(feedback[0]).toMatchObject({ rating: 3, operation: 'generate', imageUrl: IMG_GEN, prompt: CONCEPT })

  // Editar: la imagen nueva también trae caritas, con operación "edit"
  await send(page, EDIT)
  await expect(page.getByText('Acá va la versión actualizada:')).toBeVisible()
  await expect(caritas).toHaveCount(2)
  await caritas.nth(1).getByRole('button', { name: 'No me gustó' }).click()
  await expect.poll(() => feedback.length).toBe(2)
  expect(feedback[1]).toMatchObject({ rating: 1, operation: 'edit', imageUrl: IMG_EDIT, prompt: EDIT })
  await caritas.nth(1).scrollIntoViewIfNeeded()
  await page.screenshot({ path: `${SHOTS}/2-caritas-editar.png` })
})

test('si la edición sale igual, avisa y ofrece generar de cero (no la muestra como nueva)', async ({ page }) => {
  const { generate } = await setup(page, { editUnchanged: true })
  await send(page, CONCEPT)
  await expect(page.getByTestId('image-feedback')).toHaveCount(1)

  await send(page, EDIT)
  await expect(page.getByText(/me salió prácticamente igual/)).toBeVisible()
  await expect(page.getByText('Acá va la versión actualizada:')).toHaveCount(0)
  // sigue habiendo UNA sola imagen en el chat: no se repitió la misma como nueva
  await expect(page.getByTestId('image-feedback')).toHaveCount(1)
  const deCero = page.getByRole('button', { name: 'Generar de cero con este pedido' })
  await expect(deCero).toBeVisible()
  await deCero.scrollIntoViewIfNeeded()
  await page.screenshot({ path: `${SHOTS}/3-edicion-salio-igual.png` })

  await deCero.click()
  await expect.poll(() => generate.length).toBe(2)
  // de cero = concepto original + el cambio pedido
  expect(generate[1].prompt.startsWith(CONCEPT)).toBe(true)
  expect(generate[1].prompt).toContain(EDIT)
  await expect(page.getByTestId('image-feedback')).toHaveCount(2)
})
