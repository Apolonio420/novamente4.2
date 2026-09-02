/**
 * Graba el video tutorial "Cómo administrar tu Catálogo" para /ayuda, contra
 * el tenant fixture E2E (e2e-partner-test) con 3 productos reales (ver
 * scripts/seed-e2e-partner.ts --with-products) — así el catálogo no muestra
 * skeletons vacíos como el video viejo.
 *
 * Reemplaza a scripts/record-catalog-video.mjs (borrado — contraseña
 * hardcodeada + tenant interno vacío).
 *
 * Flujo: sesión plantada → /workspace → click "Catalogo" → hover producto →
 * click "Agregar producto" (muestra el form de alta, sin enviarlo).
 *
 * Requiere E2E_PARTNER_EMAIL / E2E_PARTNER_PASSWORD en el entorno. Sin
 * credenciales, el test se SKIPEA.
 *
 * Run:
 *   npx tsx scripts/seed-e2e-partner.ts --with-products
 *   npx playwright test e2e/record-catalog-video.spec.ts
 *
 * Salida: marketing_assets/video_catalog_raw/latest.webm +
 * marketing_assets/sync_catalog.json para scripts/mux-marketing-video.mjs.
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

test('grabar tutorial Catálogo', async ({ page }) => {
  test.setTimeout(180_000)

  const startTime = Date.now()
  const sync = makeAudioSync(startTime)

  await injectFakeCursor(page)
  await hideRetailPrice(page)
  await suppressDevOverlay(page)

  // ── Arrancar ya adentro de /workspace, sin tipear ningún email ──
  await loginAndGoTo(page, page.request, '/workspace')
  await page.keyboard.press('Escape').catch(() => {})
  await delay(1500)
  await assertNoLeaks(page, 'workspace-dashboard')

  // ── Verificar que el tenant fixture tiene >=3 productos reales ANTES de grabar ──
  // Por href (no por texto) — mismo motivo que en record-studio-video.spec.ts:
  // el Navbar publico queda visible dentro de /workspace/* y evitamos cualquier
  // ambiguedad con otros links de texto parecido.
  const catalogLink = page.locator('a[href="/workspace/catalog"]').first()

  await ripplePreview(page, catalogLink)
  // Navegacion DURA en vez de confiar en la SPA nav del click — mismo motivo
  // que en record-studio-video.spec.ts: verificado que el click (soft nav)
  // puede dejar la pagina destino colgada en su fetch inicial mientras que
  // un page.goto() directo siempre dispara el mount/fetch correctamente.
  await page.goto('/workspace/catalog', { waitUntil: 'domcontentloaded' })

  // ── Esperar a que termine el loading skeleton (mismo selector .grid.gap-4 > div
  // que usan TANTO el skeleton (loading && ...) como la grilla real (!loading && ...)
  // en app/workspace/catalog/page.tsx — por eso esperamos el NOMBRE de un producto
  // real en vez de solo contar hijos del grid, que matchearia el skeleton igual.
  // Además esperamos que YA NO quede ningún card .animate-pulse (el skeleton
  // real) y damos un settle delay corto — el texto del producto puede quedar
  // "visible" para Playwright un instante antes de que el resto del grid
  // (thumbnails, badges) termine de pintar, y no queremos que marker 1 caiga
  // ahí (se vio: t=0 seguía mostrando skeleton incluso después del recorte
  // de lead-in, porque el recorte usaba ese offset "visible demasiado
  // temprano"). ──
  const knownProductName = page.getByText(/Remera Dragon Neon|Buzo Aurora|Tote Botánica/i).first()
  await waitVisibleWithReload(page, knownProductName, 20_000)
  await expect(page.locator('.animate-pulse')).toHaveCount(0, { timeout: 10_000 }).catch(() => {})
  await delay(400)

  // START AUDIO 1: "En la pestaña Catálogo de tu Studio vas a encontrar todos tus diseños."
  sync.mark(1)
  const productCards = page.locator('.grid.gap-4 > div')
  const cardCount = await productCards.count()
  if (cardCount < 3) {
    throw new Error(
      `El tenant fixture tiene ${cardCount} productos visibles (se necesitan >=3 para no grabar skeletons). Corré: npx tsx scripts/seed-e2e-partner.ts --with-products`,
    )
  }
  await hold(page, 3000) // resto del audio 1
  await assertNoLeaks(page, 'catalog-list')

  // START AUDIO 2: "Acá podés ver el stock, editar el precio de venta y administrar todo lo que ofrecés en tu tienda."
  sync.mark(2)
  const firstCard = productCards.first()
  await moveCursorTo(page, firstCard)
  await hold(page, 5600) // resto del audio 2 (hover se sostiene)
  await assertNoLeaks(page, 'catalog-hover')

  // START AUDIO 3: "Mantener tu catálogo actualizado es clave para atraer más clientes."
  sync.mark(3)
  const addBtn = page.getByRole('button', { name: /Agregar producto/i }).first()
  await clickWithRipple(page, addBtn)
  await delay(700)

  // ── Cargar el form (nombre + precio) para que no se vea en blanco/sin
  // tocar, pero NO terminar ahí: ese form tiene un campo "Prenda base
  // (opcional, para calcular tu margen)" con su propio texto de margen que
  // no vale la pena sanitizar en un flujo que de todas formas no vamos a
  // enviar (es para subir diseño propio, fuera de alcance del video).
  // Mejor: cargar, cancelar, y terminar en la grilla con el producto real
  // visible — matchea igual la narración ("mantener tu catálogo
  // actualizado") sin abrir superficie de leak nueva. ──
  const newProductName = page.locator('#product-name')
  if (await newProductName.isVisible().catch(() => false)) {
    await fillAndVerify(page, newProductName, 'Segunda Colección')
    const newProductPrice = page.locator('#product-price')
    if (await newProductPrice.isVisible().catch(() => false)) {
      await fillAndVerify(page, newProductPrice, '32000')
    }
  }
  await hold(page, 1200) // se ve el form cargado (acortado: mas tiempo para la grilla final)
  console.log('[record-catalog-video] form cargado, sigue con cancelar')
  await assertNoLeaks(page, 'catalog-add-form-filled')

  // ── Cancelar y CONFIRMAR que volvimos a la grilla — no asumir que el
  // click alcanzó. Si cancelBtn no aparece o el panel no cierra, mejor
  // fallar acá (con log) que terminar el video en un estado a medio
  // transicionar. ──
  const cancelBtn = page.getByRole('button', { name: /^Cancelar$/i }).first()
  const cancelVisible = await cancelBtn.isVisible().catch(() => false)
  console.log('[record-catalog-video] cancelBtn visible:', cancelVisible)
  if (cancelVisible) {
    await clickWithRipple(page, cancelBtn)
    await cancelBtn.waitFor({ state: 'hidden', timeout: 10_000 }).catch((e) => {
      console.log('[record-catalog-video] cancelBtn no se ocultó a tiempo:', e.message)
    })
  }
  console.log('[record-catalog-video] de vuelta en la grilla, confirmando producto visible')
  await knownProductName.waitFor({ state: 'visible', timeout: 10_000 })
  // El encoder del screencast de Playwright se va atrasando respecto al reloj
  // real bajo carga sostenida (verificado: a esta altura de la grabación el
  // .webm crudo terminaba SIEMPRE congelado en el form, aunque el test ya
  // había vuelto a la grilla hacía rato) — le damos bastante tiempo real acá
  // para que el pipe se ponga al día y alcance a codificar frames reales de
  // la grilla antes de page.close().
  await hold(page, 7000) // termina en la grilla, con los productos reales visibles
  await assertNoLeaks(page, 'catalog-final')
  sync.end()
  console.log('[record-catalog-video] end marker emitido, cerrando página')

  // ── Guardar el crudo + el sync log para el mux script ──
  const video = page.video()
  await page.close()
  if (video) {
    const videoPath = await video.path()
    const outDir = path.resolve(__dirname, '../marketing_assets/video_catalog_raw')
    fs.mkdirSync(outDir, { recursive: true })
    fs.copyFileSync(videoPath, path.join(outDir, 'latest.webm'))
    console.log('Video crudo copiado a', path.join(outDir, 'latest.webm'))
  }

  const syncPath = path.resolve(__dirname, '../marketing_assets/sync_catalog.json')
  fs.writeFileSync(syncPath, JSON.stringify(sync.toJSON(), null, 2))
  console.log('Sync log escrito en', syncPath)
})
