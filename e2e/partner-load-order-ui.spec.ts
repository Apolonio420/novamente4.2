/**
 * E2E UI: el partner abre "Cargar venta" en /workspace/orders, pega texto, la IA
 * lo parsea y aparecen los items editables. Saca screenshot.
 *
 * Planta la sesión del partner (cookie server-side para middleware + localStorage
 * para el cliente supabase) igual que hace el login, para evitar la fragilidad
 * del form de login. Requiere creds de partner + server local; si faltan, skipea.
 */
import { test, expect } from '@playwright/test'
import { E2E_PARTNER_EMAIL, E2E_PARTNER_PASSWORD, hasPartnerAuthCreds } from './fixtures/partner-auth'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''

async function passwordGrant(): Promise<{ access_token: string; refresh_token: string; expires_in: number; user: unknown }> {
  const res = await fetch(`${SUPABASE_URL.replace(/\/$/, '')}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { apikey: SUPABASE_ANON, 'content-type': 'application/json' },
    body: JSON.stringify({ email: E2E_PARTNER_EMAIL, password: E2E_PARTNER_PASSWORD }),
  })
  if (!res.ok) throw new Error(`password grant failed ${res.status}: ${await res.text().catch(() => '')}`)
  return res.json()
}

test.describe('Partner UI: cargar venta', () => {
  test.skip(!hasPartnerAuthCreds(), 'Faltan creds de partner E2E')

  test('abrir modal → parsear con IA → screenshot', async ({ page }) => {
    test.setTimeout(90_000)

    const sess = await passwordGrant()
    const ref = new URL(SUPABASE_URL).hostname.split('.')[0]
    const storageKey = `sb-${ref}-auth-token`
    const expires_at = Math.floor(Date.now() / 1000) + (sess.expires_in ?? 3600)
    const sessionObj = {
      access_token: sess.access_token,
      refresh_token: sess.refresh_token,
      expires_at,
      expires_in: sess.expires_in,
      token_type: 'bearer',
      user: sess.user,
    }

    // 1. Plantar sesión cliente (localStorage) antes de que corran los scripts.
    await page.addInitScript(
      ([k, v]) => {
        try { localStorage.setItem(k, v) } catch { /* noop */ }
      },
      [storageKey, JSON.stringify(sessionObj)] as [string, string],
    )
    // 2. Plantar cookie server-side para el middleware (comparte cookie jar con la página).
    await page.request
      .post('/api/auth/set-session', {
        data: { access_token: sess.access_token, refresh_token: sess.refresh_token },
      })
      .catch(() => null)

    // 3. Ir a pedidos
    await page.goto('/workspace/orders')
    await expect(page.getByRole('button', { name: 'Cargar venta' }).first()).toBeVisible({ timeout: 25_000 })

    // 4. Abrir modal
    await page.getByRole('button', { name: 'Cargar venta' }).first().click()
    const input = page.getByTestId('load-order-input')
    await expect(input).toBeVisible({ timeout: 10_000 })

    // 5. Pegar texto + parsear con IA (Gemini real)
    await input.fill('Quiero 2 remeras oversize negras talle L con estampa adelante y atras, y 1 hoodie blanco M. Es para Juan Perez.')
    await page.getByTestId('load-order-parse').click()

    // 6. Esperan los items editables
    await expect(page.getByTestId('load-order-submit')).toBeVisible({ timeout: 30_000 })
    await expect(page.locator('input[placeholder="Remera Oversize unisex"]').first()).toBeVisible({ timeout: 30_000 })

    await page.screenshot({ path: 'test-results/load-order-modal.png', fullPage: true })
  })
})
