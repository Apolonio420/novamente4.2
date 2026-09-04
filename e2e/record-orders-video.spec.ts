/**
 * Graba el video tutorial "Qué pasa cuando entra un pedido" para el FAQ del
 * workspace (/workspace/support → SupportFaq.tsx), contra el tenant fixture
 * E2E (e2e-partner-test / "Aurora Estudio") con 3 pedidos demo (ver
 * scripts/seed-e2e-partner.ts --with-orders): "Cliente de Prueba" en
 * Pendiente / En produccion / Entregado.
 *
 * Storyboard: marketing_assets/faq-videos/STORYBOARDS.md sección 3.
 *
 * Flujo: /workspace/orders → grilla con los 3 pedidos → abrir el pedido
 * "nuevo" (Pendiente) → mostrar cliente/items/total → avanzar el estado
 * (Pendiente → Confirmado → En produccion, ninguno de los dos dispara
 * notificación — solo el paso a "Enviado" dispara un mail, ver
 * app/api/partners/orders/[id]/route.ts, y ese NO se toca acá) → cerrar el
 * detalle → volver a la grilla → filtro "Entregado".
 *
 * Dos cuidados especiales de este spec (no genéricos del resto del batch):
 *
 * 1) El pedido fixture usa customer_email "cliente@novamente.test", que
 *    dispara el patrón genérico de email de LEAK_PATTERNS. Se agregó
 *    data-testid="order-customer-email" en app/workspace/orders/page.tsx (fila
 *    de la tabla + detalle) y se registró en HIDDEN_LEAK_TESTIDS
 *    (e2e/fixtures/video-recording.ts) — se oculta con CSS, no aparece en
 *    ningún frame.
 * 2) Pueden existir filas huérfanas "Cliente Test E2E" / Cancelado de
 *    corridas viejas de e2e/partner-load-order.spec.ts que ningún agente
 *    pudo borrar de la base (DELETE bloqueado por el permission system —
 *    ver e2e/README-videos.md sección 1). hideOrphanTestRows() las saca del
 *    DOM (no de la base) antes de cada checkpoint — se re-corre porque la
 *    página re-fetchea la lista cada 30s (auto-refresh) y podrían reaparecer.
 *
 * OJO — este spec MUTA el estado real del pedido fixture "nuevo" (queda en
 * "En produccion" en vez de "Pendiente"). Para dejarlo como estaba:
 *   npx tsx scripts/seed-e2e-partner.ts --with-orders
 *
 * Requiere E2E_PARTNER_EMAIL / E2E_PARTNER_PASSWORD en el entorno. Sin
 * credenciales, el test se SKIPEA.
 *
 * Run:
 *   npx playwright test e2e/record-orders-video.spec.ts
 *
 * Salida: marketing_assets/video_orders_raw/latest.webm +
 * marketing_assets/sync_orders.json.
 */
import { test, expect, type Page } from '@playwright/test'
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
  makeAudioSync,
  delay,
  hold,
} from './fixtures/video-recording'

test.skip(!hasPartnerAuthCreds(), 'Faltan E2E_PARTNER_EMAIL / E2E_PARTNER_PASSWORD')

test.use({
  viewport: { width: 1280, height: 720 },
  deviceScaleFactor: 2,
  video: { mode: 'on', size: { width: 1280, height: 720 } },
  launchOptions: { slowMo: 250 },
  actionTimeout: 30_000,
})

/**
 * Oculta (display:none, NUNCA el.remove()) cualquier fila/card cuyo texto
 * matchee "Cliente Test E2E" — huérfanas de e2e/partner-load-order.spec.ts,
 * ajenas al seed de este spec, que un DELETE no pudo limpiar (ver comentario
 * de arriba del archivo). Cubre tanto <tr> (tabla desktop) como <button>
 * (card mobile, no usado en este viewport pero por las dudas).
 *
 * OJO — primera versión de este helper usaba el.remove(), y reventaba la
 * página con un error boundary ("Algo salió mal") en cuanto React volvía a
 * re-renderizar esa misma lista (ej. al cambiar de filtro, que dispara un
 * nuevo fetchOrders() + re-render del <tbody>): React sigue esas filas como
 * propias, y un remove() por fuera de React deja su reconciliador con una
 * referencia a un nodo que ya no está en el árbol real, y explota al intentar
 * removerlo/actualizarlo de nuevo (visto reproducido en una corrida real:
 * video terminaba en la pantalla de error, no en la grilla filtrada). Ocultar
 * con estilo en vez de desmontar el nodo no interfiere con la reconciliación
 * — mismo patrón no destructivo que hideRetailPrice.
 */
async function hideOrphanTestRows(page: Page): Promise<void> {
  await page.evaluate(() => {
    const candidates = Array.from(document.querySelectorAll('tr, button'))
    for (const el of candidates) {
      if (el.textContent && /Cliente Test E2E/.test(el.textContent)) {
        ;(el as HTMLElement).style.display = 'none'
      }
    }
  })
}

test('grabar tutorial Pedidos (orders)', async ({ page }) => {
  test.setTimeout(240_000)

  const startTime = Date.now()
  const sync = makeAudioSync(startTime)

  await injectFakeCursor(page)
  await hideRetailPrice(page)
  await suppressDevOverlay(page)

  // ── Arrancar ya adentro de /workspace/orders, sin tipear ningún email ──
  await loginAndGoTo(page, page.request, '/workspace/orders')

  const clienteDePrueba = page.getByText('Cliente de Prueba').first()
  // waitVisibleWithReload solo reintenta UNA vez con un reload — se vio esta
  // página quedarse colgada en el skeleton más seguido que el resto del batch
  // (fetch cliente que nunca llega a dispararse bajo carga pesada de la
  // máquina, ver e2e/README-videos.md sección 3 "Flakiness conocida"). Acá
  // reintentamos con navegaciones DURAS frescas (no solo reload) hasta 3
  // veces antes de rendirnos.
  let ordersLoaded = false
  for (let attempt = 1; attempt <= 3 && !ordersLoaded; attempt++) {
    try {
      await clienteDePrueba.waitFor({ state: 'visible', timeout: 20_000 })
      ordersLoaded = true
    } catch {
      console.log(`[record-orders-video] intento ${attempt}/3: "Cliente de Prueba" no apareció a tiempo — navegación dura fresca`)
      await page.goto('/workspace/orders', { waitUntil: 'domcontentloaded' })
    }
  }
  if (!ordersLoaded) {
    await clienteDePrueba.waitFor({ state: 'visible', timeout: 30_000 })
  }
  await expect(page.locator('.animate-pulse')).toHaveCount(0, { timeout: 10_000 }).catch(() => {})
  await delay(400)
  await hideOrphanTestRows(page)
  await assertNoLeaks(page, 'orders-list')

  // Fila "nuevo" (Pendiente) — todos los 3 pedidos fixture comparten el mismo
  // customer_name, así que discriminamos por el badge de estado, no por el
  // nombre.
  const pendingRow = page.locator('table tbody tr').filter({ hasText: 'Pendiente' }).first()
  await pendingRow.waitFor({ state: 'visible', timeout: 10_000 })

  // START AUDIO 1: "Cuando entra un pedido, lo ves acá, en Pedidos." (4.85s)
  sync.mark(1)
  await driftCursorTo(page, pendingRow, 8, 420) // ~3.4s de viaje visible por la grilla
  await hold(page, 800)

  // START AUDIO 2: "Cada pedido muestra el cliente, los productos y el total." (5.30s)
  sync.mark(2)
  await clickWithRipple(page, pendingRow)
  const detailHeading = page.getByRole('heading', { name: 'Pedido', exact: true })
  await detailHeading.waitFor({ state: 'visible', timeout: 10_000 })
  await hideOrphanTestRows(page)
  await hold(page, 3500) // se ve cliente / items / total del panel
  await assertNoLeaks(page, 'orders-detail-open')

  // START AUDIO 3: "El estado te dice en qué etapa está: nuevo, en producción o entregado." (5.90s)
  sync.mark(3)
  const toConfirmedBtn = page.getByRole('button', { name: /Mover a confirmado/i })
  await moveCursorTo(page, toConfirmedBtn)
  await hold(page, 900) // se ve el badge "Pendiente" + el botón de transición antes de tocarlo
  await clickWithRipple(page, toConfirmedBtn)
  const toProducingBtn = page.getByRole('button', { name: /Mover a en produccion/i })
  await toProducingBtn.waitFor({ state: 'visible', timeout: 10_000 })
  await hold(page, 500)
  await clickWithRipple(page, toProducingBtn)
  // Confirmar que el badge de estado quedó en "En produccion" (no solo que se
  // clickeó) antes de seguir — ninguna de las dos transiciones dispara
  // notificación (ver comentario de arriba, solo "Enviado" manda mail).
  await page.getByText('En produccion', { exact: true }).first().waitFor({ state: 'visible', timeout: 10_000 })
  await hideOrphanTestRows(page)
  await assertNoLeaks(page, 'orders-status-advanced')

  // ── Cerrar el detalle y filtrar por "Entregado" — SIN marker propio
  // (transición sin narración dedicada, mismo patrón que otros specs de este
  // batch), y ESPERAMOS a que el fetch filtrado resuelva (skeleton fuera del
  // DOM + fila real visible) ANTES de marcar el clip 4. El mux siempre corta
  // el video en lastAudioEnd(clip4) + 1.5s medido desde donde se llame
  // sync.mark(4) — si el marker se dispara ANTES de que el filtro termine de
  // cargar (visto pasar en una corrida real bajo carga pesada: el video
  // terminaba con el skeleton de "Entregado" todavía en pantalla, violando
  // la regla de terminar en un estado de éxito), no hay hold() después que lo
  // arregle, porque el corte final es un timestamp fijo, no algo que un hold
  // más largo pueda correr. Arrancar el clip narrado recién con el contenido
  // ya estable es la única forma de garantizar que el corte cae sobre él. ──
  await page.keyboard.press('Escape') // cierra el panel de detalle (mismo listener que Escape en la página)
  await detailHeading.waitFor({ state: 'hidden', timeout: 10_000 }).catch((e) => {
    console.log('[record-orders-video] detailHeading no se ocultó a tiempo tras Escape:', e.message)
  })
  await hideOrphanTestRows(page)
  const entregadoTab = page.getByRole('button', { name: /^Entregado$/i })
  await driftCursorTo(page, entregadoTab, 5, 300)
  await clickWithRipple(page, entregadoTab)
  await hideOrphanTestRows(page)
  await expect(page.locator('.animate-pulse')).toHaveCount(0, { timeout: 15_000 }).catch((e) => {
    console.log('[record-orders-video] skeleton de "Entregado" no se resolvió a tiempo:', e.message)
  })
  await page.getByText('Cliente de Prueba').first().waitFor({ state: 'visible', timeout: 15_000 })
  await hideOrphanTestRows(page)

  // START AUDIO 4: "Vos hacés el seguimiento, nosotros producimos y enviamos." (5.35s)
  // Recién ACÁ, con la grilla filtrada ya resuelta y estable.
  sync.mark(4)
  // Encoder catch-up generoso antes de page.close() (ver comentario de hold()
  // en video-recording.ts) — termina en la grilla filtrada por "Entregado".
  await hold(page, 6500)
  await assertNoLeaks(page, 'orders-final')
  sync.end()
  console.log('[record-orders-video] end marker emitido, cerrando página')

  // ── Guardar el crudo + el sync log para el mux script ──
  const video = page.video()
  await page.close()
  if (video) {
    const videoPath = await video.path()
    const outDir = path.resolve(__dirname, '../marketing_assets/video_orders_raw')
    fs.mkdirSync(outDir, { recursive: true })
    fs.copyFileSync(videoPath, path.join(outDir, 'latest.webm'))
    console.log('Video crudo copiado a', path.join(outDir, 'latest.webm'))
  }

  const syncPath = path.resolve(__dirname, '../marketing_assets/sync_orders.json')
  fs.writeFileSync(syncPath, JSON.stringify(sync.toJSON(), null, 2))
  console.log('Sync log escrito en', syncPath)
})
