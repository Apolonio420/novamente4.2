/**
 * Los tutoriales de partner (Studio, Catálogo) que se sacaron de /ayuda
 * (público) ahora viven dentro del workspace, embebidos en las respuestas
 * de la FAQ de Soporte (components/workspace/SupportFaq.tsx, rendereada en
 * app/workspace/support/page.tsx) — así solo un partner logueado los ve.
 *
 * Requiere E2E_PARTNER_EMAIL / E2E_PARTNER_PASSWORD en .env.local. Sin
 * credenciales, el test se SKIPEA (mismo patrón que e2e/record-*-video.spec.ts).
 */
import { test, expect } from '@playwright/test'
import * as fs from 'fs'
import * as path from 'path'
import { hasPartnerAuthCreds } from './fixtures/partner-auth'
import { loginAndGoTo } from './fixtures/video-recording'

test.skip(!hasPartnerAuthCreds(), 'Faltan E2E_PARTNER_EMAIL / E2E_PARTNER_PASSWORD')

test('la FAQ de Soporte muestra los tutoriales de partner', async ({ page }) => {
  test.setTimeout(60_000)

  // page.request (no el fixture `request` standalone) para que la cookie de
  // sesión que planta /api/auth/set-session comparta el mismo contexto del
  // browser que navega — mismo patrón que e2e/record-catalog-video.spec.ts.
  await loginAndGoTo(page, page.request, '/workspace/support')

  const faq = page.getByTestId('support-faq')
  await expect(faq).toBeVisible()

  const details = faq.locator('details')
  await expect(details.first()).toBeVisible()
  expect(await details.count()).toBeGreaterThanOrEqual(4)

  const faqVideos = page.getByTestId('support-faq-video')
  await expect(faqVideos).toHaveCount(2)

  const screenshotDir = path.join(__dirname, 'screenshots')
  fs.mkdirSync(screenshotDir, { recursive: true })

  // Abrir la pregunta del Studio y confirmar que revela el video correcto.
  const studioQuestion = faq.getByText('¿Cómo creo un producto con el Studio?')
  await studioQuestion.click()

  // VideoCard solo monta el <video> real (controls, src=studio.mp4) al
  // activarlo con el botón Reproducir — antes de eso lo que hay en el DOM
  // es el <video> mudo de preview (studio-preview.mp4).
  await faq.getByRole('button', { name: /Reproducir/i }).click()
  const studioVideo = faq.locator('video').first()
  await expect(studioVideo).toBeVisible()
  const studioSrc = await studioVideo.getAttribute('src')
  expect(studioSrc).toMatch(/\/ayuda\/studio\.mp4$/)

  await page.screenshot({ path: path.join(screenshotDir, 'workspace-support-faq.png'), fullPage: true })
})
