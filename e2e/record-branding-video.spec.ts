/**
 * Graba el video tutorial "Cómo cargar tu logo y tu identidad de marca" para
 * /ayuda, contra el tenant fixture E2E (e2e-partner-test / "Aurora Estudio").
 *
 * A diferencia de los otros videos de este batch, ESTE necesita el tenant en
 * el estado "antes" (sin logo, sin publicar) para mostrar el banner/preview
 * vacío y el toast de auto-publish REAL al guardar — ver
 * marketing_assets/faq-videos/STORYBOARDS.md sección 2. Por eso el flujo
 * completo es:
 *
 *   npx tsx scripts/seed-e2e-partner.ts --reset-branding   (deja el tenant "antes")
 *   npx playwright test e2e/record-branding-video.spec.ts
 *   npx tsx scripts/seed-e2e-partner.ts --with-branding    (restaura el "después"
 *                                                            para los otros 4 videos)
 *
 * Storyboard: marketing_assets/faq-videos/STORYBOARDS.md sección 2.
 *
 * Flujo: /workspace/branding en estado "antes" → subir el logo real del
 * fixture (public/branding/aurora-estudio-logo.png) en la pestaña Imágenes →
 * pestaña Colores y tipografia, elegir la paleta "Midnight" (mismos valores
 * primary/accent que usa scripts/seed-e2e-partner.ts::E2E_BRANDING — así el
 * "después" de este video coincide con el branding real que ven los otros 4
 * videos) → pestaña Textos de marca, cargar el tagline real del fixture (sin
 * esto el auto-publish NO se dispara: la regla es logo + (banner O tagline O
 * about_text), ver lib/partners/auto-publish.ts) → Guardar → toast de
 * auto-publish.
 *
 * Requiere E2E_PARTNER_EMAIL / E2E_PARTNER_PASSWORD en el entorno. Sin
 * credenciales, el test se SKIPEA.
 *
 * Salida: marketing_assets/video_branding_raw/latest.webm +
 * marketing_assets/sync_branding.json.
 */
import { test } from '@playwright/test'
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
  driftCursorTo,
  clickWithRipple,
  fillAndVerify,
  makeAudioSync,
  delay,
  hold,
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

test('grabar tutorial Branding (logo + identidad de marca)', async ({ page }) => {
  test.setTimeout(180_000)

  const startTime = Date.now()
  const sync = makeAudioSync(startTime)

  await injectFakeCursor(page)
  await hideRetailPrice(page)
  await suppressDevOverlay(page)

  // ── Arrancar en /workspace/branding, ya en el estado "antes" (el reset
  // --reset-branding corrió ANTES de este spec, ver comentario de arriba) ──
  await loginAndGoTo(page, page.request, '/workspace/branding')

  // Esperar el tab "Identidad Visual" (siempre el tab activo por default) en
  // vez de solo un delay fijo — mismo motivo que en record-catalog-video: no
  // queremos que el marker 1 caiga sobre el skeleton de carga.
  const visualTab = page.getByRole('tab', { name: /Identidad Visual/i })
  await waitVisibleWithReload(page, visualTab, 20_000)
  const logoDropzone = page.getByText('Arrastrá o hacé click para subir').first()
  await waitVisibleWithReload(page, logoDropzone, 20_000)
  await delay(400)
  await assertNoLeaks(page, 'branding-before')

  // START AUDIO 1: "Antes de publicar tu tienda, completá tu marca en Branding." (5.16s)
  // Movimiento continuo (encontrado en review frame-by-frame: t=1-6s quieto
  // bajo esta narración en la primera grabación) — el cursor recorre visible
  // el header/tabs y recién termina sobre la dropzone del logo, en vez de un
  // salto instantáneo seguido de un hold estático.
  sync.mark(1)
  const visualTabForDrift = page.getByRole('tab', { name: /Identidad Visual/i })
  await driftCursorTo(page, visualTabForDrift, 4, 300) // recorre hacia el tab activo
  await hold(page, 300)
  await driftCursorTo(page, logoDropzone, 7, 480) // baja hasta la dropzone del logo
  await hold(page, 400)

  // START AUDIO 2: "Subí tu logo en la pestaña Imágenes." (3.96s)
  sync.mark(2)
  // El input real es `className="hidden"` (display:none) — setInputFiles
  // funciona igual sin necesidad de un click real que abriría el file picker
  // nativo del OS (no manejable por Playwright). Es el PRIMER input[type=file]
  // en el DOM (Logo, antes que Banner y Hero, mismo orden que la pestaña
  // "Imágenes").
  const logoFileInput = page.locator('input[type="file"]').first()
  const logoPath = path.resolve(__dirname, '../public/branding/aurora-estudio-logo.png')
  await logoFileInput.setInputFiles(logoPath)
  // Esperar el preview subido (la dropzone se reemplaza por un <img>) — no
  // asumir un delay fijo, el upload real pega contra /api/partners/upload.
  const logoPreview = page.locator('img[alt="Upload"]').first()
  await logoPreview.waitFor({ state: 'visible', timeout: 15_000 })
  await hold(page, 2600)
  await assertNoLeaks(page, 'branding-logo-uploaded')

  // START AUDIO 3: "Elegí una paleta de colores que te represente." (4.06s)
  sync.mark(3)
  const colorsTab = page.getByRole('tab', { name: /Colores y tipografia/i })
  await clickWithRipple(page, colorsTab)
  // Paleta "Midnight" — primary #1e1b4b / accent #818cf8, EXACTAMENTE los
  // mismos valores que E2E_BRANDING en scripts/seed-e2e-partner.ts, así el
  // "después" de este video queda igual al branding real que muestran los
  // otros 4 videos del batch.
  const midnightPalette = page.getByRole('button', { name: /Midnight/i })
  await clickWithRipple(page, midnightPalette)
  await hold(page, 1400)

  // Tab "Textos de marca" + tagline — necesario para que auto-publish se
  // dispare al guardar (logo + (banner O tagline O about_text), ver
  // lib/partners/auto-publish.ts::hasMinimumBranding). No tiene marker propio
  // (transición corta, mismo patrón de "acción entre clips sin narración
  // dedicada" que ya usan record-catalog-video.spec.ts / record-studio-video).
  const textsTab = page.getByRole('tab', { name: /Textos de marca/i })
  await clickWithRipple(page, textsTab)
  const taglineInput = page.locator('#tagline')
  await moveCursorTo(page, taglineInput)
  await fillAndVerify(page, taglineInput, 'Diseños propios, estampados a pedido')
  await hold(page, 700)
  await assertNoLeaks(page, 'branding-colors-and-tagline')

  // START AUDIO 4: "Tocás Guardar y listo." (2.57s)
  sync.mark(4)
  const saveBtn = page.getByRole('button', { name: /Guardar/i })
  await clickWithRipple(page, saveBtn)
  await hold(page, 1100)

  // START AUDIO 5: "Tu storefront queda publicado al instante." (4.75s)
  // El toast de auto-publish (app/workspace/branding/page.tsx:318) se
  // autodescarta a los 3.5s de aparecer (showToast) — si marcamos el clip
  // ANTES de esperarlo, el toast puede desvanecerse a mitad de la narración o
  // incluso antes de que arranque (visto pasar en la primera corrida: a los
  // 34-35s ya no quedaba rastro del toast en pantalla). Por eso esperamos que
  // el toast esté REALMENTE visible primero, y recién ahí marcamos el clip —
  // así el inicio de "Tu storefront queda publicado al instante." coincide
  // con el momento real en que aparece, y se ve durante la mayor parte de la
  // ventana narrada en vez de haber desaparecido antes de tiempo.
  const successToast = page.getByText(/publicado y visible en novamente\.ar/i)
  await successToast.waitFor({ state: 'visible', timeout: 15_000 })
  sync.mark(5)
  await hold(page, 6500) // final: toast de éxito + estado guardado, encoder catch-up
  await assertNoLeaks(page, 'branding-final')
  sync.end()
  console.log('[record-branding-video] end marker emitido, cerrando página')

  // ── Guardar el crudo + el sync log para el mux script ──
  const video = page.video()
  await page.close()
  if (video) {
    const videoPath = await video.path()
    const outDir = path.resolve(__dirname, '../marketing_assets/video_branding_raw')
    fs.mkdirSync(outDir, { recursive: true })
    fs.copyFileSync(videoPath, path.join(outDir, 'latest.webm'))
    console.log('Video crudo copiado a', path.join(outDir, 'latest.webm'))
  }

  const syncPath = path.resolve(__dirname, '../marketing_assets/sync_branding.json')
  fs.writeFileSync(syncPath, JSON.stringify(sync.toJSON(), null, 2))
  console.log('Sync log escrito en', syncPath)
})
