/**
 * /ayuda (público, sin auth) ya NO debe mostrar los tutoriales de partner
 * (Studio, Catálogo) — solo el video B2C de "crear tu prenda". Los
 * tutoriales de partner se movieron adentro del workspace (Soporte → FAQ,
 * ver e2e/workspace-support-faq.spec.ts) porque muestran el panel interno
 * del partner y no deben ser públicos.
 */
import { test, expect } from '@playwright/test'
import * as fs from 'fs'
import * as path from 'path'

test('muestra solo el video B2C y no expone tutoriales de partner', async ({ page }) => {
  await page.goto('/ayuda')

  // Antes de activarlo, VideoCard solo monta el <video> de preview (mudo,
  // hover) — un único card, un único video en el DOM.
  const videos = page.locator('video')
  await expect(videos).toHaveCount(1)
  expect(await videos.first().getAttribute('src')).toBe('/ayuda/b2c-preview.mp4')

  // Nada de headings/copy de las secciones de partner que se removieron.
  await expect(page.getByText('Recorrido por el Studio')).toHaveCount(0)
  await expect(page.getByText('Cómo administrar tu Catálogo')).toHaveCount(0)
  await expect(page.getByText('Para Partners')).toHaveCount(0)

  // Sin links a rutas de login/workspace de partner viejas.
  await expect(page.locator('a[href="/partners/login"]')).toHaveCount(0)
  await expect(page.locator('a[href="/partners/workspace"]')).toHaveCount(0)

  // El link al FAQ del workspace (donde ahora viven los tutoriales de partner) existe.
  const workspaceSupportLink = page.locator('a[href="/workspace/support"]')
  await expect(workspaceSupportLink).toHaveCount(1)

  const screenshotDir = path.join(__dirname, 'screenshots')
  fs.mkdirSync(screenshotDir, { recursive: true })
  await page.screenshot({ path: path.join(screenshotDir, 'ayuda-public.png'), fullPage: true })

  // Al activarlo (click en Reproducir), VideoCard reemplaza el árbol por el
  // <video controls> real — confirmamos que apunta al b2c.mp4, no a Studio/Catálogo.
  await page.getByRole('button', { name: /Reproducir/i }).click()
  const activeVideo = page.locator('video')
  await expect(activeVideo).toHaveCount(1)
  expect(await activeVideo.first().getAttribute('src')).toBe('/ayuda/b2c.mp4')
})
