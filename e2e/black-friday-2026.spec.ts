/**
 * Black Friday 2026 — precio tachado en /crear y en el checkout, con el reloj
 * del navegador fijado dentro y fuera de la ventana (27/11 00:00 → 30/11 23:59 ART).
 * Solo navega: no crea pedidos ni pagos.
 *
 *   PLAYWRIGHT_BASE_URL=http://localhost:3217 npx playwright test e2e/black-friday-2026.spec.ts
 */
import { test, expect } from '@playwright/test'

const DENTRO = new Date('2026-11-28T15:00:00-03:00')
const FUERA = new Date('2026-12-01T00:00:00-03:00')

const carrito = (quantity: number) => ({
  state: {
    items: [{
      id: 'custom-canvas-e2e', name: 'Remera oversize Custom — Novamente', garmentType: 'aura-oversize-tshirt',
      color: 'black', garmentColor: 'black', size: 'M', price: 31000, quantity, image: '/garments/tshirt-black-oversize-front.jpeg',
      doble_estampa: 'No',
    }],
  },
  version: 0,
})

test.describe('Black Friday 2026 — web', () => {
  test('/crear muestra el precio tachado dentro de la ventana', async ({ page }) => {
    await page.clock.setFixedTime(DENTRO)
    await page.addInitScript(() => localStorage.setItem('novamente:onboarding-seen', '1'))
    await page.goto('/crear')
    const tachado = page.locator('.line-through', { hasText: '$31.000' }).first()
    await expect(tachado).toBeVisible({ timeout: 30_000 })
    await expect(page.getByText('$27.900').first()).toBeVisible()
    await page.screenshot({ path: 'test-results/bf-2026-crear-dentro.png', fullPage: false })
  })

  test('/crear sin tachado después del 30/11 23:59', async ({ page }) => {
    await page.clock.setFixedTime(FUERA)
    await page.goto('/crear')
    await expect(page.getByText('$31.000').first()).toBeVisible({ timeout: 30_000 })
    await expect(page.locator('.line-through', { hasText: '$31.000' })).toHaveCount(0)
  })

  test('checkout: 1 prenda a precio BF con el de lista tachado; 5 prendas vuelven a lista', async ({ page }) => {
    await page.clock.setFixedTime(DENTRO)
    await page.addInitScript((c) => localStorage.setItem('cart-storage', JSON.stringify(c)), carrito(1))
    await page.goto('/checkout')
    await expect(page.getByText('$27.900 c/u · Black Friday').first()).toBeVisible({ timeout: 30_000 })
    await expect(page.locator('.line-through', { hasText: '$31.000' }).first()).toBeVisible()
    await expect(page.getByText(/No se suma con códigos de descuento/)).toBeVisible()
    await page.screenshot({ path: 'test-results/bf-2026-checkout-dentro.png', fullPage: true })

    const p2 = await page.context().newPage()
    await p2.clock.setFixedTime(DENTRO)
    await p2.addInitScript((c) => localStorage.setItem('cart-storage', JSON.stringify(c)), carrito(5))
    await p2.goto('/checkout')
    await expect(p2.getByText('$31.000 c/u').first()).toBeVisible({ timeout: 30_000 })
    await expect(p2.getByText(/Black Friday/)).toHaveCount(0)
  })
})
