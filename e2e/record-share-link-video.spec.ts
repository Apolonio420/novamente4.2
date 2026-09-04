/**
 * Graba el video tutorial "Cómo compartir tu tienda" para /ayuda, contra el
 * tenant fixture E2E (e2e-partner-test / "Aurora Estudio") ya seedeado con
 * `--with-products --with-branding --with-orders` (ver
 * scripts/seed-e2e-partner.ts y e2e/README-videos.md sección 6).
 *
 * Storyboard: marketing_assets/faq-videos/STORYBOARDS.md sección 1.
 *
 * Flujo: Dashboard → cursor viaja hasta "Ver tienda" (motion continua, no un
 * salto) → navegación dura a la tienda pública `/p/e2e-partner-test` (mismo
 * patrón que record-catalog-video.spec.ts para no arriesgar una pestaña
 * nueva/SPA nav a medio cargar) → scroll lento y continuo por la vidriera
 * (hero → sobre nosotros → productos) durante los clips 3 y 4 → volver a
 * /workspace → mostrar el link "Ver mi storefront" del sidebar.
 *
 * Segunda pasada (review frame-by-frame independiente, ver
 * e2e/README-videos.md si se agrega ahí): la primera grabación tenía tramos
 * estáticos largos bajo narración (dashboard quieto durante el clip 2,
 * storefront quieto durante los clips 3-4) y el clip 4 original ("Copiá ese
 * link...") no tenía ningún affordance real en pantalla para copiar el link
 * (investigado: el único botón "Copiar link" real,
 * app/workspace/page.tsx:665, vive en StorefrontVisibilityBanner y SOLO se
 * muestra si la tienda está sin publicar/suspendida — con el tenant fixture
 * ya publicado nunca aparece). Se regeneró SOLO el texto del clip 4 en
 * narration.json (audio + overlay re-generados) para que coincida con lo que
 * de verdad se ve en pantalla (la vidriera scrolleando), y se agregó
 * movimiento continuo real (cursor viajando en pasos, scroll en pasos
 * chicos) en vez de un solo `hold()` estático.
 *
 * Requiere E2E_PARTNER_EMAIL / E2E_PARTNER_PASSWORD en el entorno. Sin
 * credenciales, el test se SKIPEA.
 *
 * Run:
 *   npx playwright test e2e/record-share-link-video.spec.ts
 *
 * Salida: marketing_assets/video_share-link_raw/latest.webm +
 * marketing_assets/sync_share-link.json.
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
  ripplePreview,
  driftCursorTo,
  slowContinuousScroll,
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

test('grabar tutorial Compartir tienda (share-link)', async ({ page }) => {
  test.setTimeout(180_000)

  const startTime = Date.now()
  const sync = makeAudioSync(startTime)

  await injectFakeCursor(page)
  await hideRetailPrice(page)
  await suppressDevOverlay(page)

  // ── Arrancar en el Dashboard, sesión plantada ──
  await loginAndGoTo(page, page.request, '/workspace')
  await page.keyboard.press('Escape').catch(() => {})

  // Esperar el botón real "Ver tienda" (no un skeleton) antes de arrancar el
  // audio 1 — mismo motivo que record-catalog-video.spec.ts: no queremos que
  // el marker 1 caiga sobre un dashboard a medio cargar.
  const verTiendaBtn = page.getByRole('link', { name: /Ver tienda/i }).first()
  // Timeout más generoso que el default (20s) — la máquina viene bajo carga
  // pesada durante esta sesión (varias corridas de grabación + disco casi
  // lleno) y esta espera puntual venía fallando incluso con 20s+1 reload.
  await waitVisibleWithReload(page, verTiendaBtn, 45_000)
  await delay(400)
  await assertNoLeaks(page, 'dashboard')

  // START AUDIO 1: "Compartir tu tienda es facilísimo." (3.60s)
  sync.mark(1)
  await hold(page, 1400)

  // START AUDIO 2: "Desde el Dashboard, tocás "Ver tienda", arriba a la derecha." (5.06s)
  // Movimiento continuo: el cursor VIAJA hacia el botón en pasos (no un salto)
  // durante casi toda la duración del clip, y recién al final hace el click
  // real con ripple — así no queda un tramo estático largo bajo narración.
  sync.mark(2)
  await driftCursorTo(page, verTiendaBtn, 10, 420) // ~4.2s de viaje visible hasta el botón
  // ripplePreview en vez de click real: el link real es target="_blank" (abre
  // pestaña nueva sin grabar) — mismo patrón documentado en STORYBOARDS.md
  // sección 1 y ya usado por record-catalog-video.spec.ts para navegación
  // entre páginas del workspace: ripple visual + page.goto() duro después.
  await ripplePreview(page, verTiendaBtn)
  await hold(page, 400)

  // ── Navegar a la tienda pública en la MISMA página (navegación dura) ──
  await page.goto('/p/e2e-partner-test', { waitUntil: 'domcontentloaded' })

  // Esperar contenido real de la tienda pública (nombre de marca) antes de
  // seguir — evita mostrar un frame en blanco/skeleton bajo el audio 3.
  const storeName = page.getByText(/Aurora Estudio/i).first()
  await waitVisibleWithReload(page, storeName, 20_000)
  await delay(300)
  // La tienda pública no tiene sesión de partner visible — no hace falta
  // hideRetailPrice ahí (ver STORYBOARDS.md sección 1). NO llamamos
  // assertNoLeaks en esta página: confirmado en la grabación real que su
  // footer público (mismo footer de TODO el sitio, no algo del tenant
  // fixture) muestra "contact@novamente.ar" — el email de contacto REAL de
  // la empresa, visible a propósito en cualquier página pública de
  // novamente.ar. LEAK_PATTERNS matchea cualquier @novamente.(ar|test), así
  // que ese footer siempre dispara un falso positivo acá — no es un leak del
  // tenant fixture, es contenido público intencional del sitio.

  // START AUDIO 3: "Se abre tu vidriera pública, con tu logo y tus productos." (5.86s)
  sync.mark(3)
  await hold(page, 900) // breve pausa mostrando el hero completo (logo + tagline) antes de scrollear

  // START AUDIO 4: "Ese es el link de tu tienda: compartilo por WhatsApp o redes." (5.16s)
  // Scroll LENTO Y CONTINUO durante el resto del clip 3 y todo el clip 4 —
  // el viewer ve la vidriera completa pasar (hero → "sobre nosotros" →
  // grilla de productos) mientras la narración habla de compartir el link de
  // ESTA tienda que está viendo, en vez de quedar congelado.
  await slowContinuousScroll(page, 4900) // resto del clip 3
  sync.mark(4)
  await slowContinuousScroll(page, 4700) // casi todo el clip 4
  await hold(page, 300)

  // ── Volver al workspace (navegación dura, mismo motivo que arriba). El
  // salto de página real (loading transitorio, navbar público parpadeando un
  // instante antes de que hidrate la sesión del partner) no tiene narración
  // propia y no aporta nada al video — lo recortamos del video final con
  // sync.cut() en vez de intentar "esperarlo mejor": no hay forma de hacer
  // una hard-navigation invisible, así que lo sacamos. ──
  const cutFrom = sync.now()
  await page.goto('/workspace', { waitUntil: 'domcontentloaded' })
  const sidebarStorefrontLink = page.locator('a[href="/p/e2e-partner-test"]').first()
  await waitVisibleWithReload(page, sidebarStorefrontLink, 20_000)
  await delay(300)
  const cutTo = sync.now()
  sync.cut(cutFrom, cutTo)
  await assertNoLeaks(page, 'workspace-sidebar-link')

  // START AUDIO 5: "También lo encontrás en el menú, en "Ver mi storefront"." (4.20s)
  sync.mark(5)
  await driftCursorTo(page, sidebarStorefrontLink, 6, 380) // viaje visible hasta el link del sidebar
  // Hold real generoso antes de page.close(): el encoder de screencast de
  // Playwright necesita tiempo real para ponerse al día (ver comentario de
  // hold() en video-recording.ts) — el mux script recorta la cola sobrante
  // solo (target = lastAudioEnd + 1.5s), así que este hold no alarga el
  // video final, solo asegura que el .webm crudo tenga frames reales acá.
  await hold(page, 6000)
  await assertNoLeaks(page, 'workspace-final')
  sync.end()
  console.log('[record-share-link-video] end marker emitido, cerrando página')

  // ── Guardar el crudo + el sync log para el mux script ──
  const video = page.video()
  await page.close()
  if (video) {
    const videoPath = await video.path()
    const outDir = path.resolve(__dirname, '../marketing_assets/video_share-link_raw')
    fs.mkdirSync(outDir, { recursive: true })
    fs.copyFileSync(videoPath, path.join(outDir, 'latest.webm'))
    console.log('Video crudo copiado a', path.join(outDir, 'latest.webm'))
  }

  const syncPath = path.resolve(__dirname, '../marketing_assets/sync_share-link.json')
  fs.writeFileSync(syncPath, JSON.stringify(sync.toJSON(), null, 2))
  console.log('Sync log escrito en', syncPath)
})
