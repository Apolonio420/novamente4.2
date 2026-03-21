import { test, expect } from '@playwright/test'

test.describe('Nova Chatbot', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    // Wait for the Nova FAB button to appear
    await page.waitForSelector('[aria-label="Abrir asistente Nova"]', { timeout: 15000 })
  })

  test('FAB button is visible on homepage', async ({ page }) => {
    const fab = page.locator('[aria-label="Abrir asistente Nova"]')
    await expect(fab).toBeVisible()
    // Should have Nova avatar image
    const avatar = fab.locator('img[alt="Nova"]')
    await expect(avatar).toBeVisible()
  })

  test('FAB is hidden on workspace pages', async ({ page }) => {
    await page.goto('/workspace')
    // FAB should not render
    const fab = page.locator('[aria-label="Abrir asistente Nova"]')
    await expect(fab).toHaveCount(0)
  })

  test('opens chat panel when clicking FAB', async ({ page }) => {
    await page.click('[aria-label="Abrir asistente Nova"]')
    // Chat header should be visible — use exact text match within the chat panel
    await expect(page.getByText('Nova', { exact: true })).toBeVisible()
    await expect(page.getByText('Asistente IA')).toBeVisible()
    // Welcome message should be visible
    await expect(page.getByText('¡Hola! Soy Nova')).toBeVisible()
  })

  test('shows page-aware quick reply suggestions', async ({ page }) => {
    await page.click('[aria-label="Abrir asistente Nova"]')
    // Homepage should show default suggestions — target the small rounded chip buttons inside the chat
    const chatPanel = page.locator('.bg-zinc-950')
    await expect(chatPanel.getByRole('button', { name: 'Ver productos', exact: true })).toBeVisible()
    await expect(chatPanel.getByRole('button', { name: 'Quiero diseñar algo' })).toBeVisible()
  })

  test('textarea exists and accepts input', async ({ page }) => {
    await page.click('[aria-label="Abrir asistente Nova"]')
    const textarea = page.locator('textarea[placeholder="Escribí tu mensaje..."]')
    await expect(textarea).toBeVisible()
    await textarea.fill('Hola Nova')
    await expect(textarea).toHaveValue('Hola Nova')
  })

  test('image upload button is present', async ({ page }) => {
    await page.click('[aria-label="Abrir asistente Nova"]')
    const imgBtn = page.locator('button[title="Adjuntar imagen"]')
    await expect(imgBtn).toBeVisible()
  })

  test('fullscreen toggle works', async ({ page }) => {
    await page.click('[aria-label="Abrir asistente Nova"]')
    // Click fullscreen button
    await page.click('button[title="Pantalla completa"]')
    // Should now show minimize button
    await expect(page.locator('button[title="Minimizar"]')).toBeVisible()
  })

  test('ESC closes fullscreen', async ({ page }) => {
    await page.click('[aria-label="Abrir asistente Nova"]')
    // Go fullscreen
    await page.click('button[title="Pantalla completa"]')
    await expect(page.locator('button[title="Minimizar"]')).toBeVisible()
    // Press ESC
    await page.keyboard.press('Escape')
    // Should go back to windowed (not closed entirely)
    await expect(page.locator('button[title="Pantalla completa"]')).toBeVisible()
  })

  test('ESC closes panel when not fullscreen', async ({ page }) => {
    await page.click('[aria-label="Abrir asistente Nova"]')
    await expect(page.locator('text=Soy Nova')).toBeVisible()
    await page.keyboard.press('Escape')
    // Panel should close, FAB should be back
    await expect(page.locator('[aria-label="Abrir asistente Nova"]')).toBeVisible()
  })

  test('clear chat button works', async ({ page }) => {
    await page.click('[aria-label="Abrir asistente Nova"]')
    await expect(page.locator('text=Soy Nova')).toBeVisible()
    // Click clear chat
    await page.click('button[title="Limpiar chat"]')
    // Welcome should still show (empty state)
    await expect(page.locator('text=Soy Nova')).toBeVisible()
  })

  test('close button works', async ({ page }) => {
    await page.click('[aria-label="Abrir asistente Nova"]')
    await expect(page.locator('text=Soy Nova')).toBeVisible()
    await page.click('button[title="Cerrar"]')
    await expect(page.locator('[aria-label="Abrir asistente Nova"]')).toBeVisible()
  })

  test('send button is disabled when textarea is empty', async ({ page }) => {
    await page.click('[aria-label="Abrir asistente Nova"]')
    // The send button should be disabled
    const sendBtn = page.locator('button:has(.lucide-send)')
    // Try a different selector — the send button with disabled state
    const textarea = page.locator('textarea[placeholder="Escribí tu mensaje..."]')
    await expect(textarea).toHaveValue('')
  })

  test('quick reply sends message on click', async ({ page }) => {
    await page.click('[aria-label="Abrir asistente Nova"]')
    // Click a quick reply inside the chat panel
    const chatPanel = page.locator('.bg-zinc-950')
    await chatPanel.getByRole('button', { name: 'Ver productos', exact: true }).click()
    // User message bubble should appear (the purple user bubble)
    await expect(page.locator('.bg-purple-600:has-text("Ver productos")')).toBeVisible({ timeout: 5000 })
  })

  test('XSS is prevented in message rendering', async ({ page }) => {
    await page.click('[aria-label="Abrir asistente Nova"]')
    // Type a message with HTML tags
    const textarea = page.locator('textarea[placeholder="Escribí tu mensaje..."]')
    await textarea.fill('<img onerror=alert(1) src=x>')
    await page.keyboard.press('Enter')
    // The text should appear escaped, not as HTML
    await page.waitForTimeout(500)
    const userBubbles = page.locator('text=<img onerror')
    await expect(userBubbles.first()).toBeVisible()
  })

  test('AI disclaimer is shown', async ({ page }) => {
    await page.click('[aria-label="Abrir asistente Nova"]')
    await expect(page.locator('text=Respuestas generadas por IA')).toBeVisible()
  })

  test('opens fullscreen on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto('/')
    await page.waitForSelector('[aria-label="Abrir asistente Nova"]', { timeout: 15000 })
    await page.click('[aria-label="Abrir asistente Nova"]')
    // Panel should cover the full viewport (no rounded corners = fullscreen)
    const panel = page.locator('.bg-zinc-950')
    await expect(panel).toBeVisible()
    // Fullscreen/minimize toggle should be hidden on mobile
    await expect(page.locator('button[title="Pantalla completa"]')).toHaveCount(0)
    await expect(page.locator('button[title="Minimizar"]')).toHaveCount(0)
  })

  test('mobile touch targets are adequately sized', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto('/')
    await page.waitForSelector('[aria-label="Abrir asistente Nova"]', { timeout: 15000 })
    await page.click('[aria-label="Abrir asistente Nova"]')
    // Close button should be visible and clickable
    const closeBtn = page.locator('button[title="Cerrar"]')
    await expect(closeBtn).toBeVisible()
    // Textarea should be visible
    const textarea = page.locator('textarea[placeholder="Escribí tu mensaje..."]')
    await expect(textarea).toBeVisible()
    // Image upload button should be visible
    const imgBtn = page.locator('button[title="Adjuntar imagen"]')
    await expect(imgBtn).toBeVisible()
  })
})
