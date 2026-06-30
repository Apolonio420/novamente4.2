import { test, expect } from '@playwright/test'
import path from 'path'

// Usa baseURL de playwright.config (localhost:3000 / webServer en CI),
// o E2E_BASE si se corre contra un dev server en otro puerto.
const BASE = process.env.E2E_BASE ?? ''
const PRICE_ALDEA_TSHIRT_ARS = 28600 // lib/catalog/products.ts — sin recargo por doble estampado

async function skipOnboarding(page: import('@playwright/test').Page) {
  await page.addInitScript(() => {
    try {
      localStorage.setItem('novamente:onboarding-seen', '1')
      localStorage.setItem('novamente:mockup-tutorial-seen', '1')
      localStorage.setItem('novamente:hints-seen', JSON.stringify({ input: true, garment: true }))
    } catch {}
  })
}

test.describe('Doble estampado — flujo completo', () => {
  test('genera frente + espalda reales, ambos lados listos, carrito con los dos diseños y sin recargo', async ({ page }) => {
    test.setTimeout(60000)
    await skipOnboarding(page)

    // 1) Frente: precargado vía ?image= (como llega un cliente desde la landing).
    await page.goto(`${BASE}/crear?image=/falco/halcon-logo.png`)
    await page.waitForLoadState('networkidle').catch(() => {})
    await expect(page.locator('img[src*="halcon-logo"]').first()).toBeVisible({ timeout: 10000 })

    // 2) Prender doble estampado.
    const toggle = page.getByRole('button', { name: /Doble estampado/i }).first()
    await toggle.click()
    await expect(page.getByText('Frente y espalda de tu prenda en una sola imagen')).toBeVisible()
    await expect(page.getByText('Falta un lado')).toBeVisible()

    // 3) Pasar al lado Espalda (clic en el panel del recuadro interpuesto).
    await page.getByRole('button', { name: /Diseñar espalda/i }).click()

    // 4) Adjuntar una imagen REAL (sube por /api/public/design/upload, sin IA) y
    // pedir "usala tal cual" — fija backDesignUrl sin pasar por Gemini (rápido y determinístico).
    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles(path.join(__dirname, '..', 'public', 'falco', 'halcon-negro.png'))
    await expect(page.getByAltText('Adjunto')).toBeVisible({ timeout: 10000 })

    const textarea = page.locator('textarea')
    await textarea.fill('usala tal cual')
    await textarea.press('Enter') // handleKeyDown: Enter sin Shift → handleSend()

    // 5) Ambos lados deben quedar listos.
    await expect(page.getByText('Ambos lados listos')).toBeVisible({ timeout: 15000 })

    // El badge es síncrono al estado de React; la <img> de la espalda recién
    // empieza a cargar en ese instante. Esperar a que la imagen del diseño de
    // espalda esté realmente pintada antes de capturar (si no, el screenshot
    // puede mostrar la prenda lisa aunque el estado ya esté "listo").
    const backDesignImg = page.locator('img[alt="Diseño espalda"]')
    await backDesignImg.waitFor({ state: 'visible', timeout: 10000 })
    await expect(async () => {
      const ok = await backDesignImg.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)
      expect(ok).toBe(true)
    }).toPass({ timeout: 10000 })

    await page.screenshot({ path: 'e2e/_doble-estampado-full.png', fullPage: true })

    // 6) Agregar al carrito y verificar el item persistido (zustand → localStorage).
    await page.getByRole('button', { name: /Agregar al carrito/i }).click()
    // .first(): el mismo texto también aparece duplicado en el anunciador aria-live del toast.
    await expect(page.getByText('Agregado al carrito').first()).toBeVisible({ timeout: 10000 })

    const cartRaw = await page.evaluate(() => localStorage.getItem('cart-storage'))
    expect(cartRaw).toBeTruthy()
    const cart = JSON.parse(cartRaw!)
    const items: any[] = cart?.state?.items ?? []
    expect(items.length).toBeGreaterThan(0)
    const item = items[items.length - 1]

    expect(item.doble_estampa).toBe('Si')
    expect(item.frontDesign).toBeTruthy()
    expect(item.backDesign).toBeTruthy()
    expect(item.frontDesign).not.toBe(item.backDesign) // dos diseños distintos, no el mismo repetido
    expect(item.price).toBe(PRICE_ALDEA_TSHIRT_ARS) // SIN recargo — el precio ya incluye las dos estampas
  })

  test('guard: no deja agregar al carrito si falta un lado', async ({ page }) => {
    test.setTimeout(45000)
    await skipOnboarding(page)

    await page.goto(`${BASE}/crear?image=/falco/halcon-logo.png`)
    await page.waitForLoadState('networkidle').catch(() => {})

    // La sección "Agregar al carrito" sólo se renderiza con un mockup fresco
    // (session.currentMockupUrl && !mockupIsStale) — generarlo primero, como
    // haría un usuario real, antes de poder intentar el guard.
    await page.getByRole('button', { name: /Probar en/i }).click()
    const addToCartBtn = page.getByRole('button', { name: /Agregar al carrito/i })
    await addToCartBtn.waitFor({ state: 'visible', timeout: 30000 })

    const cartBefore = await page.evaluate(() => localStorage.getItem('cart-storage'))
    const countBefore = cartBefore ? (JSON.parse(cartBefore)?.state?.items ?? []).length : 0

    await page.getByRole('button', { name: /Doble estampado/i }).first().click()
    await expect(page.getByText('Falta un lado')).toBeVisible()

    // Sólo el frente está listo — espalda pendiente. Intentar agregar al carrito
    // debe disparar el toast de guard (texto único, no el badge que ya está visible).
    await addToCartBtn.click()
    await expect(page.getByText('Diseñá el frente y la espalda antes de agregar al carrito.')).toBeVisible({ timeout: 5000 })

    const cartAfter = await page.evaluate(() => localStorage.getItem('cart-storage'))
    const countAfter = cartAfter ? (JSON.parse(cartAfter)?.state?.items ?? []).length : 0
    expect(countAfter).toBe(countBefore) // no se agregó nada
  })

  test('hoodie: el preview de doble estampado usa los templates del buzo', async ({ page }) => {
    test.setTimeout(30000)
    await skipOnboarding(page)

    await page.goto(`${BASE}/crear?image=/falco/halcon-logo.png`)
    await page.waitForLoadState('networkidle').catch(() => {})

    // .first() — el nombre accesible también matchea los botones de color anidados
    // (mismo aria-label "{producto} en {color}"); la tarjeta del producto va primero en el DOM.
    await page.getByRole('button', { name: /Buzo Hoodie Oversize/i }).first().click()
    await page.getByRole('button', { name: /Doble estampado/i }).first().click()

    await expect(page.getByText('Frente y espalda de tu prenda en una sola imagen')).toBeVisible()
    await expect(page.locator('img[src*="buzo-hoodie-unisex"]').first()).toBeVisible({ timeout: 10000 })

    await page.screenshot({ path: 'e2e/_doble-estampado-hoodie.png', fullPage: true })
  })
})
