/**
 * Graba el tutorial público "Cómo diseñar tu prenda con IA" para /ayuda —
 * reemplaza `public/ayuda/b2c.mp4`, que hasta ahora era un remux directo de
 * `marketing_assets/MARKETING_B2C_OPENAI_POLISHED.mp4` (un video viejo,
 * nunca grabado con este pipeline — ver e2e/README-videos.md sección "B2C").
 * Ese video tenía dos bugs: desync narración/pantalla cerca de t≈40s (la
 * caption "Elegí el tipo de prenda..." quedaba pisada por el spinner
 * "Generando diseño...") y una fecha de entrega vieja quemada en el
 * checkout ("21 ago – 25 ago"). La fecha se recalcula en vivo
 * (`estimatedDelivery`, app/checkout/page.tsx:90) así que re-grabar la
 * arregla sola.
 *
 * Storyboard completo: marketing_assets/faq-videos/STORYBOARDS.md sección
 * "b2c".
 *
 * A diferencia de los otros e2e/record-*-video.spec.ts (todos flujo B2B del
 * partner, contra el tenant fixture con sesión plantada), este es el flujo
 * B2C PÚBLICO — sin login, sin tenant, sin `hideRetailPrice` (esos testids
 * son del workspace de partner, no existen acá):
 *
 *   Home (`/`) → click "Diseñar mi prenda" (scroll suave a la sección del
 *   generador, NO navega) → tipear el prompt en el input de la landing
 *   (`CrearLauncher`) → "Crear gratis" → router.push a `/crear?prompt=...`
 *   → como hay `?prompt=`, `DesignChat` dispara la generación sola al
 *   montar (`DesignChat.tsx:957-962`, initialPrompt) → esperar el mensaje
 *   "Acá está tu diseño:" (IA real, `POST /api/generate-image`) → tab
 *   "Canvas" (se habilita solo con diseño listo) → elegir prenda / color /
 *   talle (el layer con el diseño se agrega solo al entrar a Canvas,
 *   DesignCanvas.tsx:730-773) → "Aplicar y agregar al carrito" → `/cart` →
 *   "Finalizar Compra" → `/checkout` → completar el formulario con datos
 *   ficticios obvios → NUNCA enviar el pedido.
 *
 * Leaks: el flujo público SÍ muestra el Navbar y el Footer globales (con el
 * email de contacto REAL de la empresa, contact@novamente.ar — intencional,
 * visible en cualquier página pública) — por eso NO se llama assertNoLeaks
 * en las páginas con Footer (home, /cart, /checkout; mismo criterio que
 * record-share-link-video.spec.ts para la vidriera pública). `/crear` no
 * tiene navbar ni footer (GlobalChrome.tsx lo trata full-screen) — ahí sí
 * se verifica.
 *
 * Run:
 *   npx playwright test e2e/record-b2c-video.spec.ts
 *
 * Salida: marketing_assets/video_b2c_raw/latest.webm +
 * marketing_assets/sync_b2c.json.
 */
import { test, type Page, type Locator } from '@playwright/test'
import * as fs from 'fs'
import * as path from 'path'
import {
  injectFakeCursor,
  suppressDevOverlay,
  assertNoLeaks,
  driftCursorTo,
  clickWithRipple,
  makeAudioSync,
  delay,
  hold,
  waitVisibleWithReload,
  fillAndVerify,
} from './fixtures/video-recording'

/**
 * Click en "Crear gratis" → confirmar que router.push nos deja en
 * `/crear?prompt=...`, con reintento si no.
 *
 * Encontrado en corridas reales de esta grabación (server de dev compartido
 * con otra sesión activa — tráfico pesado de /workspace/orders visible en el
 * log al mismo tiempo): el click a veces dispara el submit NATIVO del
 * `<form>` en vez del `onSubmit` de React (el input no tiene `name`, así que
 * el submit nativo aterriza en `/?` con query vacía) — muy probablemente una
 * carrera de hidratación bajo carga pesada del server compartido, no un bug
 * de la app. Si pasa, la navegación completa resetea la página entera:
 * recuperamos volviendo a Home, reabriendo la sección del generador y
 * re-tipeando el prompt antes de reintentar.
 */
async function submitPromptAndReachCrear(
  page: Page,
  promptText: string,
  landingInput: Locator,
  crearBtn: Locator,
): Promise<void> {
  const maxAttempts = 3
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    await clickWithRipple(page, crearBtn)
    try {
      // waitUntil:'commit' — es una navegación soft (router.push/pushState),
      // el evento "load" no vuelve a dispararse para este tipo de
      // transición y el default de waitForURL (waitUntil:'load') se queda
      // esperando para siempre aunque la URL ya haya cambiado.
      await page.waitForURL(/\/crear\?prompt=/, { timeout: 8_000, waitUntil: 'commit' })
      return
    } catch {
      const url = page.url()
      console.log(`[record-b2c-video] intento ${attempt}/${maxAttempts}: no llegamos a /crear?prompt= (url actual: ${url})`)
      if (attempt === maxAttempts) {
        throw new Error(`submitPromptAndReachCrear: no se pudo llegar a /crear?prompt= tras ${maxAttempts} intentos (última url: ${url})`)
      }
      await page.goto('/', { waitUntil: 'domcontentloaded' })
      const heroBtn = page.getByRole('button', { name: /Diseñar mi prenda/i }).first()
      await waitVisibleWithReload(page, heroBtn, 20_000)
      await heroBtn.click()
      await waitVisibleWithReload(page, landingInput, 15_000)
      await delay(700)
      await fillAndVerify(page, landingInput, promptText)
      await delay(300)
    }
  }
}

test.use({
  viewport: { width: 1280, height: 720 },
  deviceScaleFactor: 2,
  video: { mode: 'on', size: { width: 1280, height: 720 } },
  launchOptions: { slowMo: 200 },
  actionTimeout: 30_000,
})

test('grabar tutorial B2C — Diseñá tu prenda con IA', async ({ page }) => {
  // Generación real de IA + margen: puede tardar bastante bajo carga.
  test.setTimeout(240_000)

  const startTime = Date.now()
  const sync = makeAudioSync(startTime)

  await injectFakeCursor(page)
  await suppressDevOverlay(page)

  // ── Home pública, sin sesión ──
  await page.goto('/', { waitUntil: 'domcontentloaded' })
  await page.keyboard.press('Escape').catch(() => {})
  const heroHeading = page.getByRole('heading', { name: /Ropa personalizada con IA/i })
  await waitVisibleWithReload(page, heroHeading, 30_000)
  await delay(300)

  // START AUDIO 1: "Hacer tu prenda en Novamente es muy fácil." (2.40s)
  sync.mark(1)
  await hold(page, 1500)

  // START AUDIO 2: "Primero, entrá a la opción Diseñar tu prenda." (2.80s)
  // Botón real de la hero (ScrollButton) — SOLO hace scrollIntoView suave a
  // #generator-section, no navega — un click real acá es seguro (a
  // diferencia de un <Link>, no hay riesgo de interrumpir una transición
  // client-side a medio camino).
  const disenarBtn = page.getByRole('button', { name: /Diseñar mi prenda/i }).first()
  sync.mark(2)
  await driftCursorTo(page, disenarBtn, 6, 220)
  await clickWithRipple(page, disenarBtn)
  const landingInput = page.locator('[data-cta="landing-crear-input"]')
  await waitVisibleWithReload(page, landingInput, 15_000)
  // Colchón extra: darle tiempo al scroll suave (scrollIntoView behavior:
  // "smooth") de terminar antes de interactuar — mismo motivo que el fix de
  // abajo con fillAndVerify.
  await delay(700)

  // START AUDIO 3: "Describí lo que tenés en mente en el chat, y la IA hace el resto." (5.00s)
  sync.mark(3)
  const prompt = 'León de neon estilo retro de los ochenta'
  await landingInput.click()
  await landingInput.pressSequentially(prompt, { delay: 45 })
  await delay(250)
  // React a veces pisa el input si el componente todavía está hidratando /
  // asentando el scroll suave que acabamos de disparar (mismo motivo que
  // documenta fillAndVerify() en video-recording.ts) — verificar y, si no
  // pegó, reintentar con fillAndVerify (fill directo + verificación + un
  // retry).
  const typedValue = await landingInput.inputValue().catch(() => '')
  if (typedValue !== prompt) {
    console.log('[record-b2c-video] pressSequentially no retuvo el valor — reintentando con fillAndVerify')
    await fillAndVerify(page, landingInput, prompt)
  }
  await delay(200)

  // Tramo sin narración propia: el click en "Crear gratis" (con reintento —
  // ver submitPromptAndReachCrear) y la navegación a /crear no aportan nada
  // visual nuevo a esta caption — se recorta del video final con
  // sync.cut(), igual que la espera larga de generación más abajo.
  const navCutFrom = sync.now()
  const crearBtn = page.locator('[data-cta="landing-crear-submit"]')
  await submitPromptAndReachCrear(page, prompt, landingInput, crearBtn)
  const generatingLabel = page.getByText(/Generando diseño/i)
  await waitVisibleWithReload(page, generatingLabel, 20_000)
  const navCutTo = sync.now()
  sync.cut(navCutFrom, navCutTo)

  // ~3s reales del estado "Generando..." — visible, sin recortar.
  await hold(page, 3000)

  const cutFrom = sync.now()
  const listoMsg = page.getByText(/Acá está tu diseño/i)
  await listoMsg.waitFor({ state: 'visible', timeout: 150_000 })
  await delay(400)
  const cutTo = sync.now()
  sync.cut(cutFrom, cutTo)
  await assertNoLeaks(page, 'crear-diseno-listo')

  // ── Canvas: el layer con el diseño se agrega solo al entrar ──
  const canvasTab = page.getByRole('tab', { name: /Canvas/i })
  await canvasTab.click()
  const garmentChip = page.getByRole('button', { name: /Aura Oversize/i })
  await waitVisibleWithReload(page, garmentChip, 15_000)
  await delay(300)

  // START AUDIO 4: "Elegí el tipo de prenda, el talle y tu color favorito." (3.20s)
  sync.mark(4)
  await clickWithRipple(page, garmentChip)
  const colorSwatch = page.getByRole('button', { name: /^Blanco$/ }).first()
  await clickWithRipple(page, colorSwatch)
  const sizeL = page.getByRole('button', { name: /^L$/ })
  await clickWithRipple(page, sizeL)
  await assertNoLeaks(page, 'crear-canvas-estilo')

  const applyBtn = page.getByRole('button', { name: /Aplicar y agregar al carrito/i })
  await clickWithRipple(page, applyBtn)
  await delay(700)

  // ── Carrito → Checkout (navegación dura, mismo patrón que el resto del
  // pipeline para páginas distintas) ──
  // Tramo sin narración propia, recortado con sync.cut(): el store del
  // carrito (zustand con persist a localStorage, lib/cartStore.tsx:115)
  // rehidrata de forma asíncrona — confirmado en una corrida real que
  // /cart muestra un frame de "Tu carrito está vacío" antes de que la
  // rehidratación complete y aparezca el producto recién agregado. Sin
  // este corte ese flash queda en el video final (nada lo explica, ni
  // siquiera está bajo caption, pero es confuso igual).
  const cartCutFrom = sync.now()
  await page.goto('/cart', { waitUntil: 'domcontentloaded' })
  const finalizarBtn = page.getByRole('button', { name: /Finalizar Compra/i })
  await waitVisibleWithReload(page, finalizarBtn, 20_000)
  await delay(300)
  const cartCutTo = sync.now()
  sync.cut(cartCutFrom, cartCutTo)

  // START AUDIO 5: "¡Completá tu compra de forma segura y recibilo en tu casa!" (3.40s)
  sync.mark(5)
  await clickWithRipple(page, finalizarBtn)
  await page.waitForURL(/\/checkout/, { timeout: 15_000 })
  const emailInput = page.locator('#email')
  await waitVisibleWithReload(page, emailInput, 20_000)

  // Datos 100% ficticios — nunca reales, y NUNCA se envía el pedido.
  await fillAndVerify(page, emailInput, 'cliente@ejemplo.com')
  await fillAndVerify(page, page.locator('#firstName'), 'Cliente')
  await fillAndVerify(page, page.locator('#lastName'), 'Ejemplo')
  await fillAndVerify(page, page.locator('#phone'), '+54 9 11 0000-0000')
  await fillAndVerify(page, page.locator('#address'), 'Av. Ejemplo 123')
  await fillAndVerify(page, page.locator('#city'), 'Buenos Aires')
  await fillAndVerify(page, page.locator('#postalCode'), '1000')

  // Hold final generoso — el mux script recorta la cola sobrante solo
  // (target = lastAudioEnd + tail), esto solo asegura frames reales para el
  // encoder de screencast (ver comentario de hold() en video-recording.ts).
  await hold(page, 6500)
  sync.end()
  console.log('[record-b2c-video] end marker emitido, cerrando página')

  // NUNCA clickear "Confirmar y Pagar" / "Confirmar Pedido" — no disparar
  // POST /api/checkout ni llegar al proveedor de pago.

  const video = page.video()
  await page.close()
  if (video) {
    const videoPath = await video.path()
    const outDir = path.resolve(__dirname, '../marketing_assets/video_b2c_raw')
    fs.mkdirSync(outDir, { recursive: true })
    fs.copyFileSync(videoPath, path.join(outDir, 'latest.webm'))
    console.log('Video crudo copiado a', path.join(outDir, 'latest.webm'))
  }

  const syncPath = path.resolve(__dirname, '../marketing_assets/sync_b2c.json')
  fs.writeFileSync(syncPath, JSON.stringify(sync.toJSON(), null, 2))
  console.log('Sync log escrito en', syncPath)
})
