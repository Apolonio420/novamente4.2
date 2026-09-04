/**
 * Graba el video tutorial "Cómo pedir ayuda creando un ticket" para /ayuda,
 * contra el tenant fixture E2E (e2e-partner-test / "Aurora Estudio").
 *
 * Storyboard: marketing_assets/faq-videos/STORYBOARDS.md sección 5. Crea un
 * ticket REAL en la tabla de soporte del tenant fixture (aceptable, mismo
 * patrón que el cambio masivo de precios/alta de producto en los otros
 * videos) — sin auto-triage (deshabilitado en
 * app/api/partners/support/route.ts, comentario "Auto-triage DISABLED"), sin
 * notificación a un canal compartido.
 *
 * Requiere E2E_PARTNER_EMAIL / E2E_PARTNER_PASSWORD en el entorno. Sin
 * credenciales, el test se SKIPEA.
 *
 * Salida: marketing_assets/video_support-ticket_raw/latest.webm +
 * marketing_assets/sync_support-ticket.json. Loguea el id del ticket creado
 * (capturado de la respuesta real de POST /api/partners/support) para el
 * reporte de la tarea.
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

test('grabar tutorial Soporte (crear ticket)', async ({ page }) => {
  test.setTimeout(180_000)

  const startTime = Date.now()
  const sync = makeAudioSync(startTime)

  let createdTicketId: string | null = null
  page.on('response', (res) => {
    if (res.request().method() === 'POST' && res.url().includes('/api/partners/support') && res.ok()) {
      res
        .json()
        .then((body) => {
          createdTicketId = body?.ticket?.id ?? null
          console.log('[record-support-ticket-video] ticket creado, id =', createdTicketId)
        })
        .catch(() => {})
    }
  })

  await injectFakeCursor(page)
  await hideRetailPrice(page)
  await suppressDevOverlay(page)

  // ── Arrancar en /workspace/support, sesión plantada ──
  await loginAndGoTo(page, page.request, '/workspace/support')

  const header = page.getByRole('heading', { name: /^Soporte$/i })
  await waitVisibleWithReload(page, header, 20_000)
  await delay(400)
  await assertNoLeaks(page, 'support-before')

  // START AUDIO 1: "¿Tenés una duda o un problema? Creá un ticket en Soporte." (5.52s)
  sync.mark(1)
  await hold(page, 5000) // header + FAQ existente (SupportFaq) visibles, da contexto

  // START AUDIO 2: "Tocás "Nuevo ticket" y contás tu consulta." (4.70s)
  sync.mark(2)
  const newTicketBtn = page.getByRole('button', { name: /Nuevo ticket/i })
  await clickWithRipple(page, newTicketBtn)
  const subjectInput = page.locator('#subject')
  await subjectInput.waitFor({ state: 'visible', timeout: 10_000 })
  await moveCursorTo(page, subjectInput)
  await fillAndVerify(page, subjectInput, 'Consulta sobre mi tienda')
  await hold(page, 2000)
  await assertNoLeaks(page, 'support-form-subject')

  // START AUDIO 3: "Elegís una categoría y describís el detalle." (4.37s)
  sync.mark(3)
  const categorySelect = page.locator('#category')
  await moveCursorTo(page, categorySelect)
  await categorySelect.selectOption('technical')
  await delay(300)
  const descriptionInput = page.locator('#description')
  await moveCursorTo(page, descriptionInput)
  await fillAndVerify(
    page,
    descriptionInput,
    'Hola, quiero cambiar el color principal de mi tienda y no encuentro la opción. ¿Me ayudan?',
  )
  await hold(page, 1500)
  await assertNoLeaks(page, 'support-form-filled')

  // START AUDIO 4: "Enviás el ticket y nuestro equipo te responde." (4.01s)
  sync.mark(4)
  const sendBtn = page.getByRole('button', { name: /Enviar ticket/i })
  await clickWithRipple(page, sendBtn)
  // Confirmar que el ticket recién creado aparece en la lista con estado
  // "Abierto" — no asumir, esperar el texto real del asunto en la lista.
  const ticketInList = page.getByText('Consulta sobre mi tienda').first()
  await ticketInList.waitFor({ state: 'visible', timeout: 15_000 })
  await hold(page, 6500) // final: ticket creado + badge "Abierto", encoder catch-up
  await assertNoLeaks(page, 'support-final')
  sync.end()
  console.log('[record-support-ticket-video] end marker emitido, cerrando página')
  console.log('[record-support-ticket-video] TICKET_ID_FINAL =', createdTicketId)

  // ── Guardar el crudo + el sync log para el mux script ──
  const video = page.video()
  await page.close()
  if (video) {
    const videoPath = await video.path()
    const outDir = path.resolve(__dirname, '../marketing_assets/video_support-ticket_raw')
    fs.mkdirSync(outDir, { recursive: true })
    fs.copyFileSync(videoPath, path.join(outDir, 'latest.webm'))
    console.log('Video crudo copiado a', path.join(outDir, 'latest.webm'))
  }

  const syncPath = path.resolve(__dirname, '../marketing_assets/sync_support-ticket.json')
  fs.writeFileSync(syncPath, JSON.stringify(sync.toJSON(), null, 2))
  console.log('Sync log escrito en', syncPath)
})
