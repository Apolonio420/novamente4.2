/**
 * Graba un video tutorial del Studio (workspace) en PRODUCCIÓN con la cuenta demo.
 * Flujo: login → workspace (Novamente Mundial) → Studio → subir diseño →
 * aplicar a mockup → elegir prenda/color → mockup → publicar (borrador) → catálogo.
 *
 * OJO: corre contra PROD, crea un producto real en el tenant demo y graba ~5-7 min.
 * Por eso está gateado por env: sin credenciales, se SKIPEA (no corre en una
 * pasada normal de `npx playwright test`). NUNCA hardcodear la contraseña acá —
 * este archivo se commitea.
 *
 * Run:
 *   TUTORIAL_E2E_EMAIL=demo@... TUTORIAL_E2E_PASSWORD=... \
 *     npx playwright test e2e/tutorial-studio-video.spec.ts
 *   (opcional TUTORIAL_E2E_DESIGN=/path/al/diseño.png para usar otro arte;
 *    default: e2e/fixtures/tutorial-design.png)
 * Video: test-results/<carpeta del test>/video.webm
 */
import { test, expect } from '@playwright/test'
import * as path from 'path'

const BASE = process.env.TUTORIAL_E2E_BASE ?? 'https://www.novamente.ar'
const EMAIL = process.env.TUTORIAL_E2E_EMAIL ?? ''
const PASS = process.env.TUTORIAL_E2E_PASSWORD ?? ''
const DESIGN = process.env.TUTORIAL_E2E_DESIGN ?? path.resolve(__dirname, 'fixtures/tutorial-design.png')
const SHOTS = path.resolve(__dirname, '../test-results/tutorial-shots')

// Sin credenciales explícitas no corre: evita que una pasada e2e normal (o CI)
// grabe video, loguee en prod y cree productos demo sin querer.
test.skip(!EMAIL || !PASS, 'Set TUTORIAL_E2E_EMAIL y TUTORIAL_E2E_PASSWORD para grabar el tutorial')

test.use({
  viewport: { width: 1280, height: 720 },
  video: { mode: 'on', size: { width: 1280, height: 720 } },
  launchOptions: { slowMo: 600 },
  actionTimeout: 20_000,
})

async function dismissTour(page: any) {
  // popover "Bienvenido a tu workspace" (1 de 6) u otros tours
  for (let i = 0; i < 3; i++) {
    const close = page.locator('button:has-text("×"), [aria-label="Close"], [aria-label="Cerrar"]').first()
    if (await close.isVisible().catch(() => false)) { await close.click().catch(() => {}) }
    else { await page.keyboard.press('Escape').catch(() => {}) }
    await page.waitForTimeout(600)
    if (!(await page.locator('text=/bienvenido a tu workspace/i').first().isVisible().catch(() => false))) break
  }
}

async function shot(page: any, name: string) {
  await page.screenshot({ path: `${SHOTS}/${name}.png`, fullPage: false }).catch(() => {})
}

test('tutorial studio completo', async ({ page }) => {
  test.setTimeout(420_000)

  // ripple violeta en cada click para que se note en el video
  await page.addInitScript(() => {
    addEventListener('mousedown', (e: MouseEvent) => {
      const d = document.createElement('div')
      d.style.cssText = `position:fixed;left:${e.clientX - 20}px;top:${e.clientY - 20}px;width:40px;height:40px;border-radius:50%;border:3px solid #a78bfa;background:rgba(167,139,250,.3);z-index:2147483647;pointer-events:none;transition:transform .5s ease,opacity .5s ease;transform:scale(.5);opacity:1`
      document.body.appendChild(d)
      requestAnimationFrame(() => { d.style.transform = 'scale(1.8)'; d.style.opacity = '0' })
      setTimeout(() => d.remove(), 600)
    }, true)
  })

  // ── 1) Login ──
  await page.goto(`${BASE}/partners/login`, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(1500)
  await shot(page, '01-login')
  await page.locator('input[type="email"], input[name="email"]').first().fill(EMAIL)
  const passInput = page.locator('input[type="password"]').first()
  await passInput.fill(PASS)
  await shot(page, '02-login-filled')
  // OJO: el header tiene "Iniciar sesión o registrarse" — apuntar SOLO al submit del form
  const submit = page.getByRole('button', { name: 'Iniciar sesión', exact: true }).first()
  if (await submit.isVisible().catch(() => false)) {
    await submit.click()
  } else {
    await passInput.press('Enter')
  }
  await page.waitForURL('**/workspace**', { timeout: 60_000 })
  await page.waitForTimeout(3000)
  await shot(page, '03-post-login')

  // ── 2) Cerrar tour + cambiar al tenant Novamente Mundial ──
  await dismissTour(page)
  const onMundial = await page.locator('text=Novamente Mundial').first().isVisible().catch(() => false)
  if (!onMundial) {
    // abrir el switcher de marca (header del sidebar con el nombre del tenant actual)
    await page.locator('text=/novamente \\(internal\\)/i').first().click().catch(() => {})
    await page.waitForTimeout(1200)
    await shot(page, '04a-switcher')
    await page.locator('text=Novamente Mundial').first().click()
    await page.waitForTimeout(3000)
    await dismissTour(page)
  }
  await shot(page, '04-workspace')

  // ── 3) Ir al Studio ──
  await page.getByRole('link', { name: /^studio$/i }).first().click()
    .catch(async () => { await page.goto(`${BASE}/workspace/design-engine`, { waitUntil: 'domcontentloaded' }) })
  await page.waitForTimeout(3500)
  await shot(page, '05-studio')

  // ── 3b) Nueva sesión: chat limpio (sin mockups de corridas anteriores) ──
  // hay duplicados (panel desktop + drawer mobile): usar SOLO los visibles, todo con catch
  let newSession = page.locator('button[title="Nueva sesion"]:visible').first()
  if (!(await newSession.isVisible().catch(() => false))) {
    await page.locator('button[title="Mostrar panel de sesiones"]:visible').first().click({ timeout: 8_000 }).catch(() => {})
    await page.waitForTimeout(1200)
    newSession = page.locator('button[title="Nueva sesion"]:visible').first()
  }
  await newSession.click({ timeout: 8_000 }).catch(() => {})
  await page.waitForTimeout(1500)
  // cerrar el panel para que el video quede limpio
  await page.locator('button[title="Cerrar panel de sesiones"]:visible').first().click({ timeout: 5_000 }).catch(() => {})
  await page.waitForTimeout(800)
  await shot(page, '05b-new-session')

  // ── 4) Subir diseño propio ──
  // botón/área "Subí tu propio diseño" (si el input no está montado aún)
  const uploadTrigger = page.locator('text=/subí tu propio diseño/i').first()
  if (await uploadTrigger.isVisible().catch(() => false)) {
    await uploadTrigger.click().catch(() => {})
    await page.waitForTimeout(1200)
  }
  await shot(page, '06-pre-upload')
  const fileInput = page.locator('input[type="file"]').first()
  await fileInput.setInputFiles(DESIGN)
  await page.waitForTimeout(4000)
  await shot(page, '07-uploaded')

  // ── 6) Aplicar el diseño a la prenda (ícono remera sobre la imagen subida) ──
  const addBtns = page.locator('button[title="Agregar este producto a tu catalogo"]')
  const addBtnsBefore = await addBtns.count()
  await page.locator('button[title="Aplicar a una prenda Novamente"]').last().click()
  await page.waitForTimeout(2000)
  await shot(page, '09-applying')

  // ── 7) Esperar el mockup NUEVO: que termine de generar y aparezca SU botón de catálogo ──
  await page.locator('text=/generando mockup/i').first().waitFor({ state: 'visible', timeout: 30_000 }).catch(() => {})
  await page.locator('text=/generando mockup/i').first().waitFor({ state: 'hidden', timeout: 180_000 }).catch(() => {})
  await expect
    .poll(async () => addBtns.count(), { timeout: 60_000, intervals: [1000] })
    .toBeGreaterThan(addBtnsBefore)
  const addToCatalog = addBtns.nth(addBtnsBefore)
  await page.waitForTimeout(4000)
  await shot(page, '10-mockup-ready')

  // ── 8) Agregar al catálogo: nombre + precio → Crear producto ──
  await addToCatalog.click()
  await page.waitForTimeout(2000)
  await shot(page, '11-catalog-modal')
  // el modal tiene "Nombre del producto" y "Precio de venta (ARS)"
  const nameInput = page.locator('label:has-text("Nombre del producto")').locator('xpath=following::input[1]')
  await nameInput.fill('Remera Demo Tutorial')
  const priceInput = page.locator('label:has-text("Precio de venta (ARS)")').locator('xpath=following::input[1]')
  if (await priceInput.isVisible().catch(() => false)) {
    await priceInput.fill('39000')
  }
  await shot(page, '12-modal-filled')
  await page.getByRole('button', { name: /crear producto/i }).first().click()
  await page.waitForTimeout(6000)
  await shot(page, '13-created')

  // ── 9) Ver el producto en el catálogo ──
  await page.goto(`${BASE}/workspace/catalog`, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(4000)
  await shot(page, '14-catalog')
  await expect(page.locator('text=/demo tutorial/i').first()).toBeVisible({ timeout: 20_000 })
  await page.waitForTimeout(3000)
  await shot(page, '15-done')
})
