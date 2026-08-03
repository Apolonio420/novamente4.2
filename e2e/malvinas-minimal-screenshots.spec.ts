import { test } from '@playwright/test'

const OUT = '/private/tmp/claude-501/-Users-sambujuan-novamente-dev-chatbot/ddf326a2-985c-4856-8de5-ba8b782f45b3/scratchpad'

test('malvinas desktop 1440', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/malvinas', { waitUntil: 'networkidle' })
  await page.screenshot({ path: `${OUT}/malvinas-desktop-full.png`, fullPage: true })
})

test('malvinas mobile 390', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/malvinas', { waitUntil: 'networkidle' })
  await page.screenshot({ path: `${OUT}/malvinas-mobile-full.png`, fullPage: true })
})

test('home desktop 1440 - banner malvinas', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/', { waitUntil: 'networkidle' })
  const banner = page.locator('a[href="/malvinas"]')
  await banner.scrollIntoViewIfNeeded()
  await page.screenshot({ path: `${OUT}/home-desktop-malvinas-banner.png` })
})

test('malvinas minimal cards closeup desktop', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/malvinas', { waitUntil: 'networkidle' })
  const heading = page.getByRole('heading', { name: 'Colección Minimal' })
  await heading.scrollIntoViewIfNeeded()
  const section = page.locator('section', { has: heading })
  await section.screenshot({ path: `${OUT}/malvinas-minimal-section-desktop.png` })
})

test('malvinas minimal cards closeup mobile', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/malvinas', { waitUntil: 'networkidle' })
  const heading = page.getByRole('heading', { name: 'Colección Minimal' })
  await heading.scrollIntoViewIfNeeded()
  const section = page.locator('section', { has: heading })
  await section.screenshot({ path: `${OUT}/malvinas-minimal-section-mobile.png` })
})
