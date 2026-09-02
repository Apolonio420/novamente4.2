/**
 * Graba el video tutorial "Recorrido por el Studio" para /ayuda, contra el
 * tenant fixture E2E (e2e-partner-test, marca "Aurora Estudio"), NUNCA
 * contra el tenant interno.
 *
 * Reemplaza al viejo scripts/record-studio-video.mjs (borrado — tenía la
 * contraseña de un usuario real hardcodeada y grababa el tenant interno,
 * filtrando badge PRO/Admin, precio retail y el email interno).
 *
 * Flujo: sesión plantada (sin login en pantalla) → /workspace (espera
 * contenido real, sin skeleton) → Studio → nueva sesión de chat (limpia
 * cualquier mensaje viejo colgado de corridas anteriores) → prompt →
 * "Aplicar a prenda" → esperar mockup real → "Agregar al catálogo" → nombre →
 * "Crear producto" → ver el producto en /workspace/catalog.
 *
 * Requiere E2E_PARTNER_EMAIL / E2E_PARTNER_PASSWORD en el entorno (ver
 * scripts/seed-e2e-partner.ts). Sin credenciales, el test se SKIPEA.
 *
 * Run:
 *   npx tsx scripts/seed-e2e-partner.ts --with-products
 *   npx playwright test e2e/record-studio-video.spec.ts
 *
 * Salida: video crudo en test-results/.../video.webm, copiado además a
 * marketing_assets/video_studio_raw/latest.webm, + marketing_assets/sync_studio.json
 * con los offsets [AUDIO_SYNC] para scripts/mux-marketing-video.mjs (el mux
 * recorta el tramo mudo/skeleton antes del primer marker).
 */
import { test, expect } from '@playwright/test'
import * as fs from 'fs'
import * as path from 'path'
import { hasPartnerAuthCreds } from './fixtures/partner-auth'
import {
  loginAndGoTo,
  hideRetailPrice,
  suppressDevOverlay,
  assertNoLeaks,
  injectFakeCursor,
  moveCursorTo,
  clickWithRipple,
  fillAndVerify,
  makeAudioSync,
  delay,
  hold,
  ripplePreview,
  waitVisibleWithReload,
} from './fixtures/video-recording'

test.skip(!hasPartnerAuthCreds(), 'Faltan E2E_PARTNER_EMAIL / E2E_PARTNER_PASSWORD')

test.use({
  viewport: { width: 1280, height: 720 },
  deviceScaleFactor: 2,
  video: { mode: 'on', size: { width: 1280, height: 720 } },
  launchOptions: { slowMo: 250 },
  actionTimeout: 30_000,
})

test('grabar tutorial Studio', async ({ page }) => {
  test.setTimeout(300_000)

  // El reloj de sync arranca en el context creation (aprox. cuando arranca la
  // grabación del video) — NO después de esperar el contenido real. Así el
  // primer marker refleja fielmente cuántos segundos de skeleton hay al
  // arrancar el video crudo, y scripts/mux-marketing-video.mjs puede recortar
  // ese tramo con -ss (target = firstMarkerAt - 0.5s) y restarlo de todos los
  // offsets — en vez de que el mux "adivine" cuánto cortar.
  const startTime = Date.now()
  const sync = makeAudioSync(startTime)

  await injectFakeCursor(page)
  await hideRetailPrice(page)
  await suppressDevOverlay(page)

  // ── Arrancar ya adentro de /workspace, sin tipear ningún email ──
  await loginAndGoTo(page, page.request, '/workspace')
  await page.keyboard.press('Escape').catch(() => {}) // dismiss tour si aparece

  // ── Esperar contenido REAL (no el skeleton de carga) ANTES del primer
  // marker — "Hola, <nombre>" solo se pinta cuando `loading` pasa a false en
  // app/workspace/page.tsx. El tiempo que tarda esto queda reflejado en el
  // offset de mark(1), que el mux usa para recortar el tramo skeleton. ──
  await waitVisibleWithReload(page, page.getByText(/^Hola, /).first(), 20_000)
  await assertNoLeaks(page, 'workspace-dashboard')

  // START AUDIO 1: "Bienvenidos a Novamente Studio. Este es tu panel de control."
  sync.mark(1)
  const brandingTab = page.locator('text=Branding').first()
  if (await brandingTab.isVisible().catch(() => false)) {
    await moveCursorTo(page, brandingTab)
  }
  await hold(page, 3600)

  // START AUDIO 2: "Escribimos lo que queremos diseñar en el chat y la IA hace el resto."
  sync.mark(2)
  // OJO: getByRole('link', {name: /studio/i}) es ambiguo — GlobalChrome.tsx
  // mantiene el Navbar publico (con su propio link "STUDIO" -> /studio, una
  // pagina de marketing real) visible incluso dentro de /workspace/*, a
  // proposito, para que el partner pueda volver al sitio publico. Apuntamos
  // por href al link del sidebar del workspace (mismo patron que usaba el
  // script de referencia scripts/record-studio-video.mjs).
  const studioLink = page.locator('a[href="/workspace/design-engine"]').first()
  await ripplePreview(page, studioLink) // cursor + ripple visual, SIN click real (ver ripplePreview)
  await page.goto('/workspace/design-engine', { waitUntil: 'domcontentloaded' })
  await page.keyboard.press('Escape').catch(() => {})
  await delay(800)
  await assertNoLeaks(page, 'studio-landing')

  // ── Nueva sesión de chat ANTES de escribir nada: el workspace carga el
  // historial de la última sesión guardada al montar la página (ver
  // loadSessions() en design-engine/page.tsx), así que corridas anteriores
  // de este mismo spec (o interrumpidas a mitad de una generación) dejan
  // mensajes "Generando mockup..." colgados con isLoading:true para siempre
  // en la DB — y quedarían visibles arriba del mensaje nuevo en el video.
  // handleNewConversation() resetea session + remoteSessionId a null, así
  // que arrancamos con un chat 100% vacío. No es un bug de la app (el
  // isLoading se resuelve bien cuando la corrida no se interrumpe) — es
  // higiene de la grabación. ──
  const sessionsToggle = page.locator('button[title="Mostrar panel de sesiones"]:visible').first()
  if (await sessionsToggle.isVisible().catch(() => false)) {
    await sessionsToggle.click({ timeout: 8_000 }).catch(() => {})
    await delay(600)
    await page.locator('button[title="Nueva sesion"]:visible').first().click({ timeout: 8_000 }).catch(() => {})
    await delay(400)
    await page.locator('button[title="Cerrar panel de sesiones"]:visible').first().click({ timeout: 5_000 }).catch(() => {})
    await delay(400)
  }

  const promptInput = page.getByPlaceholder(/Describí solo el dibujo/i).first()
  await waitVisibleWithReload(page, promptInput, 30_000)
  await fillAndVerify(page, promptInput, 'Una remera negra con un dragón neon')
  await delay(300)
  await page.keyboard.press('Enter')
  await hold(page, 3700) // resto del audio 2 mientras arranca la generación

  // ── Esperar a que termine "Generando diseño..." (genera la estampa) ──
  await page
    .locator('text=/generando diseño/i')
    .first()
    .waitFor({ state: 'hidden', timeout: 120_000 })
    .catch(() => {})
  await assertNoLeaks(page, 'design-generated')

  // START AUDIO 3: "Hacemos clic en aplicar a la prenda para ver cómo queda."
  sync.mark(3)
  const applyBtn = page.getByRole('button', { name: /Aplicar a prenda/i }).first()
  await applyBtn.waitFor({ state: 'visible', timeout: 30_000 })

  const addToCatalogBtns = page.locator('button[title="Agregar este producto a tu catalogo"]')
  const addBtnsBefore = await addToCatalogBtns.count()
  await clickWithRipple(page, applyBtn)
  await hold(page, 2900) // resto del audio 3
  await assertNoLeaks(page, 'applying-to-garment')

  // ── Esperar a que el mockup REAL termine de generar (poll hasta 240s).
  // Con la sesión limpia de arriba, el ÚNICO mensaje "Generando mockup..."
  // en pantalla es el de esta corrida — cuando isLoading pasa a false
  // aparece su botón "Agregar al catalogo" y el poll corta. Ya no puede
  // quedar un spinner viejo congelado en cuadro.
  //
  // La generación real tarda ~20-40s sin nada de narración encima (audio 3
  // ya terminó, audio 4 arranca recién cuando el mockup está listo) — un
  // tramo muerto mirando el spinner. En vez de mostrarlo entero, marcamos un
  // `cut` (dejamos ~3s de spinner visibles para que se entienda qué está
  // pasando, cortamos el resto) que scripts/mux-marketing-video.mjs saca del
  // video y usa para correr los offsets de todo lo que viene después. ──
  await page
    .locator('text=/generando mockup/i')
    .first()
    .waitFor({ state: 'visible', timeout: 30_000 })
    .catch(() => {})
  const cutFrom = sync.now() + 3.0
  await expect
    .poll(async () => addToCatalogBtns.count(), { timeout: 240_000, intervals: [1500] })
    .toBeGreaterThan(addBtnsBefore)
  // Confirmar que NO queda ningún "Generando..." visible (ni el de esta
  // corrida ni uno viejo) antes de seguir — si quedara, es una señal real de
  // que algo no resolvió y preferimos fallar acá a grabarlo.
  await expect(page.locator('text=/generando/i')).toHaveCount(0, { timeout: 5_000 })
  const cutTo = Math.max(cutFrom, sync.now() - 0.5)
  sync.cut(cutFrom, cutTo)
  await delay(1500)
  await assertNoLeaks(page, 'mockup-ready')

  // START AUDIO 4: "¡Se ve genial! Ahora solo tenemos que agregarlo al catálogo."
  sync.mark(4)
  const addToCatalogBtn = addToCatalogBtns.nth(addBtnsBefore)
  await clickWithRipple(page, addToCatalogBtn)
  await hold(page, 2800) // resto del audio 4
  await assertNoLeaks(page, 'catalog-modal')

  // START AUDIO 5: "Le ponemos nombre, lo guardamos y listo para vender."
  sync.mark(5)
  const nameInput = page.getByPlaceholder(/Ej: Remera/i).first()
  await nameInput.waitFor({ state: 'visible', timeout: 10_000 })
  await fillAndVerify(page, nameInput, 'Remera Dragon Neon')
  await delay(500)

  const saveBtn = page.getByRole('button', { name: /Crear producto/i }).first()
  await clickWithRipple(page, saveBtn)
  // ── Esperar el estado de ÉXITO, no un delay fijo — handleCreateCatalogProduct
  // (app/workspace/design-engine/page.tsx) cierra el modal con
  // setCatalogModal(null) recién cuando el POST responde bien; saveBtn vive
  // adentro de ese modal, así que esperamos a que se DESMONTE (sale del DOM)
  // en vez de asumir que "Crear producto" ya terminó tras un hold fijo — así
  // el video nunca termina congelado en el spinner "Creando...". ──
  await saveBtn.waitFor({ state: 'hidden', timeout: 20_000 })
  await assertNoLeaks(page, 'product-created')

  // ── Confirmar que el producto quedó visible en el catálogo ──
  await page.goto('/workspace/catalog', { waitUntil: 'domcontentloaded' })
  await hold(page, 2000)
  await assertNoLeaks(page, 'catalog-final')
  await expect(page.locator('text=/remera dragon neon/i').first()).toBeVisible({ timeout: 20_000 })
  await hold(page, 2500)
  sync.end()

  // ── Guardar el crudo + el sync log para el mux script ──
  const video = page.video()
  await page.close() // fuerza el flush del webm antes de leer su path
  if (video) {
    const videoPath = await video.path()
    const outDir = path.resolve(__dirname, '../marketing_assets/video_studio_raw')
    fs.mkdirSync(outDir, { recursive: true })
    fs.copyFileSync(videoPath, path.join(outDir, 'latest.webm'))
    console.log('Video crudo copiado a', path.join(outDir, 'latest.webm'))
  }

  const syncPath = path.resolve(__dirname, '../marketing_assets/sync_studio.json')
  fs.writeFileSync(syncPath, JSON.stringify(sync.toJSON(), null, 2))
  console.log('Sync log escrito en', syncPath)
})
