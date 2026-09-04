/**
 * Graba el video tutorial "Cómo cambio los precios de mis productos" para el
 * FAQ del workspace (/workspace/support → SupportFaq.tsx), contra el tenant
 * fixture E2E (e2e-partner-test / "Aurora Estudio") con 3 productos reales
 * (ver scripts/seed-e2e-partner.ts --with-products).
 *
 * Storyboard: marketing_assets/faq-videos/STORYBOARDS.md sección 4.
 *
 * Flujo: /workspace/catalog → edición individual (click en "Remera Dragon
 * Neon" → cambiar #product-price → Guardar cambios) → modal de "Cambio
 * masivo de precios" (categoría "Remera Oversize" → "Ajuste por %" → +10% →
 * Aplicar a todos) → grilla final con los 3 precios actualizados.
 *
 * OJO — este spec MUTA precios reales del tenant fixture (bulk-price real,
 * no un cancelar). Después de grabar, restaurar los precios canónicos:
 *   npx tsx scripts/seed-e2e-partner.ts --with-products
 *
 * Requiere E2E_PARTNER_EMAIL / E2E_PARTNER_PASSWORD en el entorno. Sin
 * credenciales, el test se SKIPEA.
 *
 * Run:
 *   npx playwright test e2e/record-pricing-video.spec.ts
 *
 * Salida: marketing_assets/video_pricing_raw/latest.webm +
 * marketing_assets/sync_pricing.json.
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

test('grabar tutorial Precios (pricing)', async ({ page }) => {
  test.setTimeout(180_000)

  const startTime = Date.now()
  const sync = makeAudioSync(startTime)

  await injectFakeCursor(page)
  await hideRetailPrice(page)
  await suppressDevOverlay(page)

  // ── Arrancar ya adentro de /workspace/catalog, sin tipear ningún email ──
  await loginAndGoTo(page, page.request, '/workspace/catalog')

  const knownProductName = page.getByText(/Remera Dragon Neon|Buzo Aurora|Tote Botánica/i).first()
  await waitVisibleWithReload(page, knownProductName, 45_000)
  await expect(page.locator('.animate-pulse')).toHaveCount(0, { timeout: 10_000 }).catch(() => {})
  await delay(400)
  await assertNoLeaks(page, 'catalog-list')

  const productCards = page.locator('.grid.gap-4 > div')
  const cardCount = await productCards.count()
  if (cardCount < 3) {
    throw new Error(
      `El tenant fixture tiene ${cardCount} productos visibles (se necesitan >=3). Corré: npx tsx scripts/seed-e2e-partner.ts --with-products`,
    )
  }
  const remeraCard = productCards.filter({ hasText: 'Remera Dragon Neon' }).first()

  // START AUDIO 1: "Cambiar precios es rápido, uno por uno o todos juntos." (6.17s)
  sync.mark(1)
  await driftCursorTo(page, remeraCard, 8, 400) // ~3.2s de viaje visible hasta la card
  await hold(page, 2600)

  // START AUDIO 2: "Tocás un producto, editás el precio y guardás." (4.97s)
  sync.mark(2)
  await clickWithRipple(page, remeraCard)
  const priceField = page.locator('#product-price')
  await priceField.waitFor({ state: 'visible', timeout: 10_000 })
  await moveCursorTo(page, priceField)
  await fillAndVerify(page, priceField, '33000')
  await hold(page, 700)
  const saveBtn = page.getByRole('button', { name: /^Guardar cambios$/i })
  await clickWithRipple(page, saveBtn)
  // Confirmar que el modal cerró (el form de edición se desmonta) antes de seguir.
  await priceField.waitFor({ state: 'hidden', timeout: 10_000 }).catch((e) => {
    console.log('[record-pricing-video] priceField no se ocultó a tiempo tras Guardar:', e.message)
  })
  await knownProductName.waitFor({ state: 'visible', timeout: 10_000 })
  await assertNoLeaks(page, 'catalog-price-edited')

  // START AUDIO 3: "Para cambios grandes, usá "Cambio masivo de precios"." (5.06s)
  sync.mark(3)
  const bulkBtn = page.getByRole('button', { name: /Cambio masivo de precios/i })
  await driftCursorTo(page, bulkBtn, 5, 300)
  await clickWithRipple(page, bulkBtn)
  const categorySelect = page.locator('select').filter({ has: page.locator('option', { hasText: 'Selecciona una categoria' }) })
  await categorySelect.waitFor({ state: 'visible', timeout: 10_000 })
  await moveCursorTo(page, categorySelect)
  await categorySelect.selectOption({ label: 'Remera Oversize' })
  await hold(page, 900)

  // START AUDIO 4: "Elegís la categoría, el ajuste, y se aplica a todos." (5.21s)
  sync.mark(4)
  const pctToggle = page.getByRole('button', { name: /Ajuste por %/i })
  await clickWithRipple(page, pctToggle)
  const bulkValueInput = page.locator('input[type="number"]').first()
  await moveCursorTo(page, bulkValueInput)
  await fillAndVerify(page, bulkValueInput, '10')
  await hold(page, 500)
  const applyBtn = page.getByRole('button', { name: /Aplicar a todos/i })
  await clickWithRipple(page, applyBtn)
  // Esperar a que el modal cierre (bulkOpen -> false) — confirma que el POST
  // /api/partners/catalog/bulk-price terminó, no solo que se clickeó.
  await categorySelect.waitFor({ state: 'hidden', timeout: 15_000 }).catch((e) => {
    console.log('[record-pricing-video] categorySelect no se ocultó a tiempo tras Aplicar:', e.message)
  })
  await knownProductName.waitFor({ state: 'visible', timeout: 10_000 })
  // Encoder catch-up generoso antes de page.close() (ver comentario de hold()
  // en video-recording.ts) — termina en la grilla con los 3 precios reales.
  await hold(page, 6500)
  await assertNoLeaks(page, 'catalog-final')
  sync.end()
  console.log('[record-pricing-video] end marker emitido, cerrando página')

  // ── Guardar el crudo + el sync log para el mux script ──
  const video = page.video()
  await page.close()
  if (video) {
    const videoPath = await video.path()
    const outDir = path.resolve(__dirname, '../marketing_assets/video_pricing_raw')
    fs.mkdirSync(outDir, { recursive: true })
    fs.copyFileSync(videoPath, path.join(outDir, 'latest.webm'))
    console.log('Video crudo copiado a', path.join(outDir, 'latest.webm'))
  }

  const syncPath = path.resolve(__dirname, '../marketing_assets/sync_pricing.json')
  fs.writeFileSync(syncPath, JSON.stringify(sync.toJSON(), null, 2))
  console.log('Sync log escrito en', syncPath)
})
